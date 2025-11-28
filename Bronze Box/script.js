// ====================================================================
// 1. FIREBASE SETUP & CONSTANTS
// ====================================================================
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
};

if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

const USER_COLLECTION = 'users';
const DEPOSIT_COLLECTION = 'deposit_requests';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const UNLOCK_DURATION_DAYS = 15;
const BASE_COINS = 1000;
const MULTIPLIER = 10;
const NUM_LEVELS = 11;
const UNLOCK_COST_MULTIPLIER = 10;
const PKR_EXCHANGE_RATE = 10000;

let currentUser = null;
let userData = { coins: 0, unlockedLevels: { 1: 'Permanent' }, claimedDates: {} };
let pendingDepositLevels = new Set();
let depositListenerUnsubscribe = null;

let currentModalLevel = null;
let currentModalCost = 0;

// ====================================================================
// 2. DATA GENERATION & HELPER FUNCTIONS
// ====================================================================

function formatNumber(num) {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
}

function getReward(index) { return BASE_COINS * Math.pow(MULTIPLIER, index); }

function checkLevelStatus(levelNum, unlockedLevels) {
    const expiryDate = unlockedLevels[levelNum];
    if (!expiryDate) return { isUnlocked: false, statusText: 'Locked' };
    if (expiryDate === 'Permanent') return { isUnlocked: true, statusText: 'Unlocked' };
    if (expiryDate >= getTodayDate()) return { isUnlocked: true, expiryDate: expiryDate, statusText: 'Expires ' + expiryDate };
    return { isUnlocked: false, expiryDate: expiryDate, statusText: 'Expired' };
}

function generateLevelConfigs() {
    return Array.from({ length: NUM_LEVELS }, (_, i) => {
        const levelNum = i + 1;
        const reward = getReward(i);
        const status = checkLevelStatus(levelNum, userData.unlockedLevels);
        return {
            level: levelNum,
            reward: reward,
            cost: reward * UNLOCK_COST_MULTIPLIER,
            isUnlocked: status.isUnlocked,
            isClaimedToday: userData.claimedDates[levelNum] === getTodayDate(),
            expiration: status.expiryDate,
            statusText: status.statusText
        };
    });
}

// ====================================================================
// 3. AUTHENTICATION
// ====================================================================
auth.onAuthStateChanged(user => {
    const loginRequiredMsg = document.getElementById('login-required-message');
    const userGreeting = document.getElementById('user-greeting');
    const profileIcon = document.getElementById('profileIconStatus');
    
    currentUser = user;
    if (user) {
        loginRequiredMsg.style.display = 'none';
        profileIcon.className = 'fas fa-user-check';
        userGreeting.textContent = `Welcome, ${user.displayName || user.email.split('@')[0]}`;
        listenToUserData(user.uid);
        listenToPendingDeposits(user.uid);
    } else {
        loginRequiredMsg.style.display = 'block';
        profileIcon.className = 'fas fa-user-circle';
        userGreeting.textContent = 'Daily Bounce Claim';
        document.getElementById('wallet-display').textContent = '0';
        userData = { coins: 0, unlockedLevels: { 1: 'Permanent' }, claimedDates: {} };
        if (depositListenerUnsubscribe) depositListenerUnsubscribe();
        pendingDepositLevels.clear();
        renderLevels(); 
    }
});

function listenToUserData(uid) {
    db.collection(USER_COLLECTION).doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            userData = {
                coins: data.coins || 0,
                unlockedLevels: data.unlockedLevels || { 1: 'Permanent' },
                claimedDates: data.claimedDates || {}
            };
            if (!userData.unlockedLevels[1]) userData.unlockedLevels[1] = 'Permanent';
        } else {
            db.collection(USER_COLLECTION).doc(uid).set(userData, { merge: true });
        }
        document.getElementById('wallet-display').textContent = userData.coins.toLocaleString();
        renderLevels();
    }, console.error);
}

function listenToPendingDeposits(uid) {
    if (depositListenerUnsubscribe) depositListenerUnsubscribe();
    const q = db.collection(DEPOSIT_COLLECTION).where('userId', '==', uid).where('status', '==', 'Pending');
    depositListenerUnsubscribe = q.onSnapshot(snapshot => {
        pendingDepositLevels.clear();
        snapshot.forEach(doc => pendingDepositLevels.add(doc.data().levelToUnlock));
        renderLevels();
    }, console.error);
}

let isSignupMode = false;
function toggleAuthMode() {
    isSignupMode = !isSignupMode;
    document.getElementById('authModalTitle').textContent = isSignupMode ? 'Sign Up' : 'Login';
    document.getElementById('authSubmitBtn').textContent = isSignupMode ? 'Sign Up' : 'Login';
    document.getElementById('authName').style.display = isSignupMode ? 'block' : 'none';
    document.getElementById('toggleAuthLink').textContent = isSignupMode ? 'Already have an account? Login' : 'Need an account? Sign Up';
}

async function handleAuthSubmit() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName').value;
    try {
        if (isSignupMode) {
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            await cred.user.updateProfile({ displayName: name });
            await db.collection(USER_COLLECTION).doc(cred.user.uid).set({
                coins: 0, email: email, name: name,
                unlockedLevels: { 1: 'Permanent' }, claimedDates: {}
            });
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }
        closeModal('authModal');
    } catch (error) {
        alert(`Auth Failed: ${error.message}`);
    }
}

function openProfileAuth() {
    if (currentUser) openModal('logoutModal');
    else openModal('authModal');
}

function handleLogout() {
    auth.signOut();
    closeModal('genericModal'); 
}

// ====================================================================
// 4. UI RENDERING
// ====================================================================
function renderLevels() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';
    if (!currentUser) return;
    
    generateLevelConfigs().forEach(config => {
        const card = document.createElement('div');
        card.className = 'level-card';
        const isExpired = config.statusText === 'Expired';
        const isPending = pendingDepositLevels.has(config.level);
        
        let actionButtonHTML = '';
        if (config.isClaimedToday) {
            actionButtonHTML = `<button class="action-button" disabled><i class="fas fa-check-circle"></i> Claimed</button>`;
        } else if (config.isUnlocked) {
            actionButtonHTML = `<button class="action-button btn-claim" onclick="handleClaim(${config.level}, ${config.reward})"><i class="fas fa-hand-holding-usd"></i> Claim</button>`;
        } else if (isPending) {
            actionButtonHTML = `<button class="action-button" disabled><i class="fas fa-hourglass-half"></i> Pending Approval</button>`;
        } else {
            actionButtonHTML = `<button class="action-button btn-buy" onclick="openModal('depositRequestModal', ${config.level}, ${config.cost})"><i class="fas fa-lock-open"></i> Unlock Level (${formatNumber(config.cost)} Coins)</button>`;
        }

        card.innerHTML = `
            <div>
                <span class="level-title">LEVEL ${config.level}</span>
                <span class="status-badge">${config.isClaimedToday ? 'Claimed Today' : (isPending ? 'PENDING' : config.statusText.toUpperCase())}</span>
            </div>
            <div class="coin-amount"><i class="fas fa-coins"></i> ${formatNumber(config.reward)}</div>
            ${actionButtonHTML}
            ${config.isUnlocked && config.level !== 1 ? `<div class="expiration-text">${isExpired ? 'EXPIRED!' : 'Expires: ' + config.expiration}</div>` : ''}
        `;
        grid.appendChild(card);
    });
}

// ====================================================================
// 5. ACTION HANDLERS
// ====================================================================
async function handleClaim(levelNum, rewardAmount) {
    await db.collection(USER_COLLECTION).doc(currentUser.uid).update({
        coins: firebase.firestore.FieldValue.increment(rewardAmount),
        [`claimedDates.${levelNum}`]: getTodayDate()
    });
    window.open('https://www.google.com', '_blank');
}

async function handleDepositSubmit() {
    const senderName = document.getElementById('depositSenderName').value;
    const senderAccount = document.getElementById('depositSenderAccount').value;
    const tid = document.getElementById('depositTID').value;
    const amountPKR = parseFloat(document.getElementById('depositAmountPKR').value);
    const requiredPKR = Math.ceil(currentModalCost / PKR_EXCHANGE_RATE);
    
    if (!senderName || !senderAccount || !tid || !amountPKR) {
        return alert("Please fill all required fields.");
    }
    if (amountPKR < requiredPKR) {
        return alert(`Deposit amount must be at least ${requiredPKR} PKR.`);
    }

    try {
        await db.collection(DEPOSIT_COLLECTION).add({
            userId: currentUser.uid,
            email: currentUser.email,
            userName: currentUser.displayName || currentUser.email.split('@')[0],
            levelToUnlock: currentModalLevel,
            requiredCoins: currentModalCost,
            amountPKR: amountPKR,
            senderName: senderName,
            senderAccount: senderAccount,
            senderIDCard: document.getElementById('depositSenderIDCard').value,
            tid: tid,
            status: 'Pending',
            requestedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        closeModal('depositModal');
        alert('Deposit request submitted! Waiting for Admin approval.');
    } catch (error) {
        console.error("Deposit submission error:", error);
        alert('Failed to submit deposit request.');
    }
}

// ====================================================================
// 6. MODAL SYSTEM
// ====================================================================
function openModal(type, levelNum, cost) {
    currentModalLevel = levelNum;
    currentModalCost = cost;
    
    if (type === 'depositRequestModal') {
        if (!currentUser) return alert("Please log in to unlock levels.");
        
        const requiredPKR = Math.ceil(cost / PKR_EXCHANGE_RATE);
        document.getElementById('depositModalTitle').textContent = `Unlock Level ${levelNum}`;
        document.getElementById('requiredCoinsDisplay').textContent = formatNumber(cost) + ' Coins';
        document.getElementById('requiredPkrDisplay').textContent = requiredPKR.toLocaleString() + ' PKR';
        document.getElementById('depositAmountPKR').placeholder = `Minimum ${requiredPKR} PKR`;
        document.getElementById('exchangeRateDisplay').textContent = `1 PKR = ${PKR_EXCHANGE_RATE.toLocaleString()} Coins`;
        
        document.getElementById('depositModal').style.display = 'flex';
    } else if (type === 'authModal') {
        document.getElementById('authModal').style.display = 'flex';
    } else if (type === 'logoutModal') {
        document.getElementById('modalTitle').textContent = 'Logout Confirmation';
        document.getElementById('modalMessage').innerHTML = `Are you sure you want to log out?`;
        document.getElementById('confirmBtn').onclick = handleLogout; 
        document.getElementById('genericModal').style.display = 'flex';
    }
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}
