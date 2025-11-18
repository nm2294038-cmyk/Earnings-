
// ====================================================================
// SECTION A: FIREBASE CONFIGURATION & CORE STATE
// ====================================================================

const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
    measurementId: "G-HJQ46RQNZS"
};

let auth, db;
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
} else {
    console.error("Firebase SDKs not loaded. Cannot initialize Firebase.");
}

let isLoggedIn = false;
let currentUserId = null; 
let currentUserName = "Guest User"; 
let authMode = 'signup'; 
let walletListener = null; 
let currentPageId = 'home-content'; 
const USERS_COLLECTION = "users";

const REWARD_MILESTONES = [
    { invites: 5000, coins: 10000, item: 'Bonus Coins' },
    { invites: 10000, coins: 15000, item: 'Premium Coins' },
    { invites: 15000, coins: 20000, item: 'Voucher Code' },
    { invites: 20000, coins: 25000, item: 'Gift Card' },
    { invites: 25000, coins: 30000, item: 'Mystery Box' },
    { invites: 30000, coins: 35000, item: 'Gold Membership' },
    { invites: 35000, coins: 40000, item: 'Cash Bonus' },
    { invites: 40000, coins: 45000, item: 'Exclusive Offer' },
    { invites: 45000, coins: 50000, item: 'Diamond Reward' },
    { invites: 50000, coins: 55000, item: 'Luxury Item' }
];

const OPEN_HOUR_START = 10; 
const OPEN_MINUTE_START = 0; 
const OPEN_HOUR_END = 21; // Assuming 9:00 PM is 21:00 (720 minutes logic was confusing)
const OPEN_MINUTE_END = 0; 

// ====================================================================
// SECTION B: UI NAVIGATION HANDLERS (Defined first for proper scoping)
// ====================================================================

/**
 * Core function to switch the visible content section and update header/footer UI.
 */
function _internalUISwitch(targetPageId, title) {
    const contentSections = document.querySelectorAll('.content-section');
    const headerTitle = document.getElementById('header-title');
    const appHeader = document.querySelector('.app-header');
    const backButton = document.getElementById('back-button');
    const rewardsTabs = document.getElementById('rewards-tabs');
    const navLinks = document.querySelectorAll('.mobile-footer .nav-link');

    currentPageId = targetPageId;

    contentSections.forEach(section => section.classList.remove('active'));
    document.getElementById(targetPageId).classList.add('active');
    headerTitle.textContent = title;

    const needsFlatHeader = (targetPageId !== 'home-content');
    if (needsFlatHeader) {
        appHeader.classList.add('flat-header'); 
        backButton.style.display = 'block'; 
    } else {
        appHeader.classList.remove('flat-header'); 
        backButton.style.display = 'none';
    }

    // Footer link active state update
    navLinks.forEach(l => l.classList.remove('active'));
    const activeFooterLink = document.querySelector(`.mobile-footer [data-page="${targetPageId}"]`);
    if (activeFooterLink) {
        activeFooterLink.classList.add('active');
    }
    
    // Rewards tab visibility
    rewardsTabs.style.display = (targetPageId === 'rewards-content') ? 'flex' : 'none';
    
    window.scrollTo(0, 0);
}

function switchTab(targetTabId) {
    const rewardsTabs = document.getElementById('rewards-tabs');
    document.querySelectorAll('#rewards-content .tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.getElementById(targetTabId).classList.add('active');
    
    rewardsTabs.querySelectorAll('.tab-link').forEach(link => {
        link.classList.remove('active');
    });
    // Ensure we find the correct tab link (e.g., 'invite-tab' from 'invite-tab-content')
    rewardsTabs.querySelector(`[data-tab="${targetTabId.replace('-content', '')}"]`).classList.add('active');
}

function switchPage(targetPageId, title) {
    const rewardsTabs = document.getElementById('rewards-tabs');

    // History Management: Push new state only if navigating to a *new* tab
    if (targetPageId !== currentPageId) {
        // Push state to enable back navigation and prevent redirect to #
        history.pushState({ page: targetPageId, title: title }, title, `#${targetPageId}`);
    }
    
    _internalUISwitch(targetPageId, title);
    if (targetPageId === 'rewards-content') {
         // Activate the default sub-tab when switching to the Rewards page
         const defaultTabLink = rewardsTabs.querySelector('.tab-link.active');
         if (defaultTabLink) {
             const defaultTabId = defaultTabLink.getAttribute('data-tab');
             switchTab(defaultTabId + '-content');
         } else {
             // Fallback to the first tab if none is active
             switchTab('invite-tab-content');
         }
    }
}

function handleBack() {
    // Internal back arrow click triggers popstate
    window.history.back();
}


// ====================================================================
// SECTION C: FEATURES (Link Handling & Exit Prompt)
// ====================================================

/**
 * FEATURE 1: Global Link Interception (New Tab / Mobile App Support)
 * NOTE: Isko maine thoda modify kiya hai takay internal links (jo # se start nahi hote) bhi new tab mein open hon.
 * Agar aapko chahiye ki internal app links (jaise ki Task Earn, Profile) app ke andar hi load hon, to yeh logic
 * adjust karna padega ya aap un links par 'target="_self"' add kar sakte hain.
 */
document.addEventListener('click', function(e) {
    let target = e.target;
    while (target && target.tagName !== 'A') {
        target = target.parentElement;
    }

    if (target && target.href) {
        const url = target.href;
        
        // Agar link internal navigation (data-page) ya auth modal ya sirf # hai, to ignore karein.
        if (target.getAttribute('data-page') || target.id === 'logout-button' || url.endsWith('#')) {
            return;
        }

        // Agar yeh external URL hai (http/https se start ho raha hai)
        if (url.startsWith('http') || url.startsWith('https') || url.startsWith('//')) {
            e.preventDefault(); 
            // External links ko new tab mein open karein
            window.open(url, '_blank');
        }
        // Agar yeh path based internal link hai (e.g., 'Profile/index.html'), to ye default browser behavior par chhod dega.
        // Agar aap chahte hain ki yeh bhi new tab mein khule, to aapko isko target._blank dena hoga.
    }
});


/**
 * FEATURE 2: Back Button Confirmation Prompt (Custom Modal)
 */

function showExitModal() {
    document.getElementById('exit-modal-overlay').style.display = 'flex';
}

function hideExitModal() {
    document.getElementById('exit-modal-overlay').style.display = 'none';
}

function handleExitDecision(shouldExit) {
    hideExitModal();
    if (shouldExit) {
        // Agar user exit karna chahta hai, to history ko aage badhne dein (jo browser ko band kar dega)
        // Ya agar yeh Cordova/WebView hai to Native Exit function call karein.
        // For browser, we do nothing and let the history depletion happen.
    } else {
        // Agar user rukna chahta hai, to home page ka state dobara history mein daal do
        history.pushState({ page: 'home-content', title: 'Daily Tasks' }, 'Daily Tasks', '#home-content');
        // Ab hum home content par hain
        _internalUISwitch('home-content', 'Daily Tasks');
        // Footer ko bhi update karein
        document.querySelectorAll('.mobile-footer .nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector(`.mobile-footer [data-page="home-content"]`).classList.add('active');
    }
}


window.addEventListener('popstate', function(event) {
    const state = event.state;
    
    if (state && state.page) {
        // Internal navigation (State change within the app). NO PROMPT.
        _internalUISwitch(state.page, state.title || 'YoursMed App');
    } else {
        // Exiting the app from the root state. SHOW PROMPT.
        
        // Agar hum home page par hain aur history khatam ho gayi, tabhi prompt dikhao
        if (currentPageId === 'home-content') {
            showExitModal();
        }
    }
});


// ====================================================================
// SECTION D: FIREBASE & DATA LOGIC
// ====================================================================

function isWithdrawalWindowOpen() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const startTimeInMinutes = (OPEN_HOUR_START * 60) + OPEN_MINUTE_START;
    const endTimeInMinutes = (OPEN_HOUR_END * 60) + OPEN_MINUTE_END; // 21 * 60 + 0 = 1260
    const currentTimeInMinutes = (currentHour * 60) + currentMinute;
    
    // Check if current time is within the start and end time window
    return (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes);
}

function updateWithdrawalLockStatus() {
    const isOpen = isWithdrawalWindowOpen();
    const homeWithdrawalBox = document.getElementById('home-withdrawal-box');
    const timeLockedItems = document.querySelectorAll('#withdrawal-grid .withdrawal-item.time-locked');
    const lockMessage = `Withdrawal Locked. Opens at ${OPEN_HOUR_START}:00 AM - ${OPEN_HOUR_END - 12}:00 PM`; // User-friendly display 9:00 PM

    if (homeWithdrawalBox) {
        let overlay = homeWithdrawalBox.querySelector('.lock-time-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'lock-time-overlay';
            homeWithdrawalBox.appendChild(overlay);
        }
        if (isOpen) {
            homeWithdrawalBox.classList.remove('locked-task');
            overlay.style.display = 'none';
        } else {
            homeWithdrawalBox.classList.add('locked-task');
            overlay.innerHTML = `<i class="fas fa-lock"></i> ${lockMessage}`;
            overlay.style.display = 'flex';
        }
    }
    
    timeLockedItems.forEach(item => {
        if (isOpen) {
            item.classList.remove('locked-item');
            item.style.pointerEvents = 'auto';
            item.style.opacity = '1';
            item.style.setProperty('--lock-display', 'none'); 
        } else {
            item.classList.add('locked-item');
            item.style.pointerEvents = 'none';
            item.style.opacity = '0.5';
        }
    });
    // Set timeout to check again after 1 minute
    setTimeout(updateWithdrawalLockStatus, 60000); 
}

function updateProfileCardDisplay(name, balance) {
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-balance').innerHTML = `<i class="fas fa-coins" style="color:#ffc107;"></i> Balance: ${balance} Coins`;
}

function initializeWalletDisplay() {
    const mainBalanceDisplay = document.getElementById('wallet-coin-balance');
    const tiktokBalanceDisplay = document.getElementById('tiktok-coin-balance');
    const amazonBalanceDisplay = document.getElementById('amazon-coin-balance');
    const pubgUCBalanceDisplay = document.getElementById('pubg-uc-balance');
    const totalInviteCountDisplay = document.getElementById('total-invites-count');
    const activeInviteCountDisplay = document.getElementById('active-invites-count');
    
    if (!db || !currentUserId) {
        mainBalanceDisplay.textContent = '---';
        updateProfileCardDisplay("Guest User", "---");
        return;
    }
    
    if (walletListener) { walletListener(); walletListener = null; }

    const walletRef = db.collection(USERS_COLLECTION).doc(currentUserId);
    mainBalanceDisplay.textContent = 'Loading...';

    walletListener = walletRef.onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            const rawCoins = data.coins !== undefined ? data.coins : 0; 
            const tiktokCoins = data.tiktokCoins !== undefined ? data.tiktokCoins : 0;
            const amazonCoins = data.amazonCoins !== undefined ? data.amazonCoins : 0;
            const pubgUC = data.pubgUC !== undefined ? data.pubgUC : 0;
            const totalInvites = data.totalInvites || 0; 
            const activeInvites = data.activeInvites || 0;
            currentUserName = data.name || (auth.currentUser ? auth.currentUser.email.split('@')[0] : "User");
            const formattedBalance = parseFloat(rawCoins).toFixed(2);
            
            mainBalanceDisplay.textContent = formattedBalance;
            tiktokBalanceDisplay.textContent = parseFloat(tiktokCoins).toFixed(2);
            amazonBalanceDisplay.textContent = parseFloat(amazonCoins).toFixed(2);
            pubgUCBalanceDisplay.textContent = parseInt(pubgUC).toLocaleString();
            totalInviteCountDisplay.textContent = totalInvites;
            activeInviteCountDisplay.textContent = activeInvites;
            updateRewardTimeline(totalInvites);
            updateProfileCardDisplay(currentUserName, formattedBalance);
        } else {
            walletRef.set({
                name: auth.currentUser.email.split('@')[0], email: auth.currentUser.email,
                coins: 0, tiktokCoins: 0, amazonCoins: 0, pubgUC: 0,
                referralCode: currentUserId.substring(0, 8).toUpperCase(), totalInvites: 0, activeInvites: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }); 
            updateProfileCardDisplay(currentUserName, "0.00");
        }
    }, error => {
        mainBalanceDisplay.textContent = 'Error!';
    });
}

// --- AUTH HANDLERS ---
function showAuthModal(mode) {
    document.getElementById('auth-modal').style.display = 'flex';
    setAuthMode(mode);
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
    document.getElementById('auth-form').reset(); 
}

function setAuthMode(mode) {
    authMode = mode;
    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const switchText = document.getElementById('switch-text');
    const switchLink = document.getElementById('switch-link');
    const nameInput = document.getElementById('auth-name');
    const referralInput = document.getElementById('auth-referral-code');

    if (mode === 'signup') {
        title.textContent = "Create Account"; submitBtn.textContent = "Sign Up";
        switchText.textContent = "Already have an account?"; switchLink.textContent = "Login";
        nameInput.style.display = 'block'; nameInput.required = true;
        referralInput.style.display = 'block'; 
    } else {
        title.textContent = "Log In"; submitBtn.textContent = "Login";
        switchText.textContent = "Don't have an account?"; switchLink.textContent = "Sign Up";
        nameInput.style.display = 'none'; nameInput.required = false;
        referralInput.style.display = 'none'; 
    }
}

function toggleAuthMode() {
    if (authMode === 'signup') { setAuthMode('login'); } else { setAuthMode('signup'); }
}

function handleAuthClick(mode) {
    if (mode === 'logout') { handleRealLogout(); } else { showAuthModal(mode); }
}

function generateRandomBonus() { return Math.floor(Math.random() * (200 - 100 + 1)) + 100; }

async function findReferralDocIdByCode(code) {
    try {
        const snapshot = await db.collection(USERS_COLLECTION).where('referralCode', '==', code).limit(1).get();
        if (!snapshot.empty) { return snapshot.docs[0].id; }
    } catch(e) { console.error("Error finding referrer by code:", e); }
    return null;
}

async function handleAuthSubmit() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name').value;
    const referralCodeUsed = document.getElementById('auth-referral-code').value.toUpperCase().trim();
    const submitBtn = document.getElementById('auth-submit-btn');

    if (!auth || !db) { alert("Firebase not initialized."); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = (authMode === 'signup' ? 'Processing Sign Up...' : 'Processing Login...');

    try {
        if (authMode === 'signup') {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;
            const userReferralCode = uid.substring(0, 8).toUpperCase(); 
            const signupBonus = generateRandomBonus();
            
            await db.collection(USERS_COLLECTION).doc(uid).set({
                name: name, email: email, coins: signupBonus, tiktokCoins: 0, amazonCoins: 0, pubgUC: 0,
                referralCode: userReferralCode, referredBy: referralCodeUsed || null, totalInvites: 0, activeInvites: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            if (referralCodeUsed) {
                const referrerDocId = await findReferralDocIdByCode(referralCodeUsed);
                if (referrerDocId) {
                    const referrerRef = db.collection(USERS_COLLECTION).doc(referrerDocId);
                    await db.runTransaction(async (transaction) => {
                        const referrerDoc = await transaction.get(referrerRef);
                        if (referrerDoc.exists) {
                            const newInvites = (referrerDoc.data().totalInvites || 0) + 1;
                            transaction.update(referrerRef, { totalInvites: newInvites });
                        }
                    });
                }
            }
            alert(`Account created! You received ${signupBonus} coins. Welcome!`);
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }
        closeAuthModal();
    } catch (error) {
        console.error("Auth error:", error);
        alert("Authentication failed: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = (authMode === 'signup' ? 'Sign Up' : 'Login');
    }
}

auth.onAuthStateChanged(async user => {
    if (user) {
        currentUserId = user.uid; isLoggedIn = true;
        currentUserName = user.displayName || user.email.split('@')[0] || "User"; 
        updateAuthStateUI(); 
        initializeWalletDisplay(); 
    } else {
        handleRealLogout(false);
    }
});

function handleRealLogout(shouldRedirect = true) {
     if (walletListener) { walletListener(); walletListener = null; }
     isLoggedIn = false; currentUserId = null; currentUserName = "Guest User";
     document.getElementById('wallet-coin-balance').textContent = '---';
     document.getElementById('tiktok-coin-balance').textContent = '---';
     document.getElementById('amazon-coin-balance').textContent = '---';
     document.getElementById('pubg-uc-balance').textContent = '---';
     document.getElementById('total-invites-count').textContent = 0;
     document.getElementById('active-invites-count').textContent = 0;
     updateRewardTimeline(0); 
     updateProfileCardDisplay("Guest User", "---");
     updateAuthStateUI();
     if (shouldRedirect) {
        auth.signOut();
        // Logout ke baad home page par switch karein aur history ko replace karein
        history.replaceState({ page: 'home-content', title: 'Daily Tasks' }, 'Daily Tasks', '#home-content');
        _internalUISwitch('home-content', 'Daily Tasks');
     }
}

function updateAuthStateUI() {
    const loggedInElements = document.querySelectorAll('.logged-in-only');
    const loggedOutElements = document.querySelectorAll('.logged-out-only');

    if (isLoggedIn) {
        loggedInElements.forEach(el => el.style.display = 'flex');
        loggedOutElements.forEach(el => el.style.display = 'none');
    } else {
        loggedInElements.forEach(el => el.style.display = 'none');
        loggedOutElements.forEach(el => el.style.display = 'flex');
    }
    initializeReferralSystem(); 
}

function renderRewardTimeline(currentInvites) {
    const container = document.getElementById('dynamic-reward-timeline');
    container.innerHTML = '';
    REWARD_MILESTONES.forEach(reward => {
        const isUnlocked = currentInvites >= reward.invites;
        const statusClass = isUnlocked ? 'unlocked' : 'locked';
        const iconContent = isUnlocked ? '<i class="fas fa-check"></i>' : '<i class="fas fa-lock"></i>';
        const cardClass = reward.item.includes('Coins') ? 'card-coins' : 'card-bluetooth';
        const rewardTitle = `Unlock on ${reward.invites.toLocaleString()} Invites`;
        const rewardText = `Win ${reward.coins.toLocaleString()} Coins Bonus`;
        const html = `<div class="timeline-item ${statusClass}" id="reward-${reward.invites}"><div class="timeline-item-icon">${iconContent}</div><div class="timeline-title">${rewardTitle}</div><div class="timeline-card ${cardClass}"><i class="fas fa-trophy reward-icon"></i><div class="card-text"><strong>${rewardText}</strong></div></div></div>`;
        container.innerHTML += html;
    });
}

function updateRewardTimeline(inviteCount) {
    renderRewardTimeline(inviteCount);
}

function initializeReferralSystem() {
    const linkTextDisplay = document.getElementById('actual-referral-link-text');
    const copyButton = document.getElementById('copy-referral-btn');
    const inviteButton = document.getElementById('invite-button-link');
    const BASE_URL = "https://www.yoursmed.xyz/"; 
    
    if (isLoggedIn && currentUserId) {
        const code = currentUserId.substring(0, 8).toUpperCase();
        const shareLink = `${BASE_URL}?ref=${code}`;
        linkTextDisplay.textContent = `Your Code: ${code} | Link: ${shareLink}`;
        copyButton.style.display = 'block'; 
        copyButton.textContent = 'Copy Link';
        copyButton.style.backgroundColor = '#4CAF50';
        inviteButton.href = `whatsapp://send?text=Earn free money! Join YoursMed: ${encodeURIComponent(shareLink)}`;
    } else {
        linkTextDisplay.textContent = "[Log in to see your Referral Code]";
        copyButton.style.display = 'block'; 
        copyButton.textContent = 'Login to Copy Link';
        copyButton.style.backgroundColor = '#1e88e5';
        inviteButton.href = "#"; 
    }
}

function copyReferralLink() {
    const linkText = document.getElementById('actual-referral-link-text').textContent;
    const copyButton = document.getElementById('copy-referral-btn');

    if (isLoggedIn && navigator.clipboard) {
        const linkMatch = linkText.match(/Link: (.*)/);
        const linkToCopy = linkMatch ? linkMatch[1] : linkText;
        
        navigator.clipboard.writeText(linkToCopy).then(() => {
            const originalText = 'Copy Link';
            copyButton.textContent = 'Copied!';
            copyButton.style.backgroundColor = '#2ecc71';
            setTimeout(() => {
                copyButton.textContent = originalText;
                copyButton.style.backgroundColor = '#4CAF50';
            }, 1500);
        }).catch(err => {
            alert('Error copying link. Please copy manually.');
        });
    } else if (!isLoggedIn) {
         alert("Please log in first to copy your link.");
    }
}


// ====================================================================
// SECTION F: DOM INITIALIZATION AND EVENTS
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.mobile-footer .nav-link');
  const copyButton = document.getElementById('copy-referral-btn');
  const backButton = document.getElementById('back-button');
  
  if (copyButton) {
      copyButton.addEventListener('click', copyReferralLink);
  }

  // --- 1. Set initial history state ---
  // Ensure home page is the initial state for popstate management
  history.replaceState({ page: 'home-content', title: 'Daily Tasks' }, 'Daily Tasks', '#home-content');


  // --- 2. Event listeners for navigation (This part is crucial) ---
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // *** YEH LINE REDIRECT HONAY SE ROKTI HAI ***
      e.preventDefault(); 
      // ******************************************
      
      const targetPageId = link.getAttribute('data-page');
      
      let title = '';
      switch(targetPageId) {
        case 'home-content': title = 'Daily Tasks'; break;
        case 'rewards-content': title = 'Refer & Earn'; break;
        case 'wallet-content': title = 'Wallet'; break;
        case 'more-content': title = 'More'; break;
        default: title = 'YoursMed App';
      }
      
      switchPage(targetPageId, title);
    });
  });

  document.querySelectorAll('#rewards-tabs .tab-link').forEach(tabLink => {
    tabLink.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTabId = tabLink.getAttribute('data-tab');
      switchTab(targetTabId + '-content'); 
    });
  });
  
  backButton.addEventListener('click', handleBack);

  // Initial setup
  renderRewardTimeline(0);
  _internalUISwitch('home-content', 'Daily Tasks');
  updateWithdrawalLockStatus();
});
