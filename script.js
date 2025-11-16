// --- FIREBASE CONFIGURATION AND INITIALIZATION ---
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

// --- GLOBAL STATE & DATA MANAGEMENT ---
let isLoggedIn = false;
let currentUserId = null; 
let currentUserName = "Guest User"; 
let authMode = 'signup'; 
let walletListener = null; 

const USERS_COLLECTION = "users";

// --- REWARDS MILESTONES (Updated 5k gap) ---
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

// --- WITHDRAWAL TIME CONFIGURATION (10:00 PM to 10:00 PM) ---
const OPEN_HOUR_START = 10; // 10 AM
const OPEN_MINUTE_START = 0; // 00 minutes
const OPEN_HOUR_END = 9; // 00 PM
const OPEN_MINUTE_END = 720; // 720 minutes

// --- DYNAMIC LOGIC FOR TIME-BASED LOCKING ---

/**
 * Checks if the current local time falls within the withdrawal window (10:00 AM - 10:30 AM).
 * @returns {boolean} True if window is open.
 */
function isWithdrawalWindowOpen() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const startTimeInMinutes = (OPEN_HOUR_START * 60) + OPEN_MINUTE_START;
    const endTimeInMinutes = (OPEN_HOUR_END * 60) + OPEN_MINUTE_END;
    const currentTimeInMinutes = (currentHour * 60) + currentMinute;

    return (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes);
}

/**
 * Updates the lock status for home page withdrawal box and wallet items.
 */
function updateWithdrawalLockStatus() {
    const isOpen = isWithdrawalWindowOpen();
    const homeWithdrawalBox = document.getElementById('home-withdrawal-box');
    const timeLockedItems = document.querySelectorAll('#withdrawal-grid .withdrawal-item.time-locked');
    
    const lockMessage = `Withdrawal Locked. Opens at ${OPEN_HOUR_START}:00 AM - ${OPEN_HOUR_END}:720 PM`;

    // 1. Handle Home Page Withdrawal Box
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
    
    // 2. Handle Wallet Page Time-Locked Items (EasyPaisa, JazzCash, Bank)
    timeLockedItems.forEach(item => {
        if (isOpen) {
            item.classList.remove('locked-item');
            item.style.pointerEvents = 'auto';
            item.style.opacity = '1';
            // Remove lock icon (which is implemented via ::before CSS in .locked-item)
            item.style.setProperty('--lock-display', 'none'); 

        } else {
            item.classList.add('locked-item');
            item.style.pointerEvents = 'none';
            item.style.opacity = '0.5';
        }
    });
    
    // Schedule the next update
    setTimeout(updateWithdrawalLockStatus, 60000); // Check every 60 seconds
}


// --- PROFILE AND WALLET DISPLAY LOGIC (Firestore Integration) ---

/**
 * @comment: Yeh function real-time mein user ka balance, invites, aur profile data update karta hai.
 */
function initializeWalletDisplay() {
    // Main App Coins
    const mainBalanceDisplay = document.getElementById('wallet-coin-balance');
    // New Balances
    const tiktokBalanceDisplay = document.getElementById('tiktok-coin-balance');
    const amazonBalanceDisplay = document.getElementById('amazon-coin-balance');
    const pubgUCBalanceDisplay = document.getElementById('pubg-uc-balance');
    
    const totalInviteCountDisplay = document.getElementById('total-invites-count');
    const activeInviteCountDisplay = document.getElementById('active-invites-count');
    
    if (!db || !currentUserId) {
        console.warn("Wallet Display: Not logged in (UID missing).");
        mainBalanceDisplay.textContent = '---';
        tiktokBalanceDisplay.textContent = '---';
        amazonBalanceDisplay.textContent = '---';
        pubgUCBalanceDisplay.textContent = '---';
        updateProfileCardDisplay("Guest User", "---");
        return;
    }
    
    // 1. Clear any existing listener 
    if (walletListener) {
        walletListener();
        console.log("Previous wallet listener detached.");
    }

    // Firestore reference user ke UID (document ID) par
    const walletRef = db.collection(USERS_COLLECTION).doc(currentUserId);
    
    mainBalanceDisplay.textContent = 'Loading...';
    totalInviteCountDisplay.textContent = '...';
    activeInviteCountDisplay.textContent = '...';

    // 2. Set up new real-time listener (onSnapshot)
    walletListener = walletRef.onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            
            // Reading all coin fields
            const rawCoins = data.coins !== undefined ? data.coins : 0; 
            const tiktokCoins = data.tiktokCoins !== undefined ? data.tiktokCoins : 0;
            const amazonCoins = data.amazonCoins !== undefined ? data.amazonCoins : 0;
            const pubgUC = data.pubgUC !== undefined ? data.pubgUC : 0;
            
            const totalInvites = data.totalInvites || 0; 
            const activeInvites = data.activeInvites || 0;
            currentUserName = data.name || (auth.currentUser ? auth.currentUser.email.split('@')[0] : "User");
            
            const formattedBalance = parseFloat(rawCoins).toFixed(2);
            
            // Update all balance displays
            mainBalanceDisplay.textContent = formattedBalance;
            tiktokBalanceDisplay.textContent = parseFloat(tiktokCoins).toFixed(2);
            amazonBalanceDisplay.textContent = parseFloat(amazonCoins).toFixed(2);
            pubgUCBalanceDisplay.textContent = parseInt(pubgUC).toLocaleString(); // UC is usually integer
            
            totalInviteCountDisplay.textContent = totalInvites;
            activeInviteCountDisplay.textContent = activeInvites;
            updateRewardTimeline(totalInvites);
            updateProfileCardDisplay(currentUserName, formattedBalance);

            console.log(`SUCCESS: Realtime balance update received for UID ${currentUserId}. Value: ${formattedBalance}`);

        } else {
            console.warn(`USER INIT: User document missing for UID: ${currentUserId}. Creating placeholder.`);
            
            // Initialize all coin fields for a new user
            walletRef.set({
                name: auth.currentUser.email.split('@')[0],
                email: auth.currentUser.email,
                coins: 0, 
                tiktokCoins: 0,
                amazonCoins: 0,
                pubgUC: 0,
                referralCode: currentUserId.substring(0, 8).toUpperCase(),
                totalInvites: 0,
                activeInvites: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }); 

            mainBalanceDisplay.textContent = '0.00 (New User)';
            tiktokBalanceDisplay.textContent = '0.00';
            amazonBalanceDisplay.textContent = '0.00';
            pubgUCBalanceDisplay.textContent = '0';
            updateProfileCardDisplay(currentUserName, "0.00");
        }
    }, error => {
        console.error("ERROR: Error listening to user document (Check Security Rules!):", error);
        mainBalanceDisplay.textContent = 'Error!';
    });
}

function updateProfileCardDisplay(name, balance) {
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-balance').innerHTML = `<i class="fas fa-coins" style="color:#ffc107;"></i> Balance: ${balance} Coins`;
}

// --- AUTH MODAL & FLOW HANDLERS ---

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
        title.textContent = "Create Account";
        submitBtn.textContent = "Sign Up";
        switchText.textContent = "Already have an account?";
        switchLink.textContent = "Login";
        nameInput.style.display = 'block'; 
        nameInput.required = true;
        referralInput.style.display = 'block'; 
    } else { // 'login'
        title.textContent = "Log In";
        submitBtn.textContent = "Login";
        switchText.textContent = "Don't have an account?";
        switchLink.textContent = "Sign Up";
        nameInput.style.display = 'none';
        nameInput.required = false;
        referralInput.style.display = 'none'; 
    }
}

function toggleAuthMode() {
    if (authMode === 'signup') {
        setAuthMode('login');
    } else {
        setAuthMode('signup');
    }
}

function handleAuthClick(mode) {
    if (mode === 'logout') {
        handleRealLogout();
    } else {
        showAuthModal(mode);
    }
}

function generateRandomBonus() {
    return Math.floor(Math.random() * (200 - 100 + 1)) + 100;
}

// Function to find referral document by its unique code (Document ID is UID)
async function findReferralDocIdByCode(code) {
    try {
        const snapshot = await db.collection(USERS_COLLECTION).where('referralCode', '==', code).limit(1).get();
        if (!snapshot.empty) {
            return snapshot.docs[0].id; 
        }
    } catch(e) {
        console.error("Error finding referrer by code:", e);
    }
    return null;
}


async function handleAuthSubmit() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name').value;
    const referralCodeUsed = document.getElementById('auth-referral-code').value.toUpperCase().trim();
    
    const submitBtn = document.getElementById('auth-submit-btn');

    if (!auth || !db) {
        alert("Firebase not initialized.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = (authMode === 'signup' ? 'Processing Sign Up...' : 'Processing Login...');

    try {
        if (authMode === 'signup') {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;
            const userReferralCode = uid.substring(0, 8).toUpperCase(); 
            const signupBonus = generateRandomBonus();
            
            // 1. Create User document in Firestore (UID as Document ID)
            await db.collection(USERS_COLLECTION).doc(uid).set({
                name: name,
                email: email, 
                coins: signupBonus, 
                tiktokCoins: 0, // Initialize new fields
                amazonCoins: 0, // Initialize new fields
                pubgUC: 0,      // Initialize new fields
                referralCode: userReferralCode, 
                referredBy: referralCodeUsed || null,
                totalInvites: 0,
                activeInvites: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(firestoreError => {
                console.error("Firestore Document Creation Failed:", firestoreError);
                alert("Account created, but database setup failed. Error: " + firestoreError.message);
            });
            
            // 2. Update the referrer's invite count (If code was provided)
            if (referralCodeUsed) {
                const referrerDocId = await findReferralDocIdByCode(referralCodeUsed);
                
                if (referrerDocId) {
                    const referrerRef = db.collection(USERS_COLLECTION).doc(referrerDocId);
                    
                    await db.runTransaction(async (transaction) => {
                        const referrerDoc = await transaction.get(referrerRef);
                        
                        if (referrerDoc.exists) {
                            const newInvites = (referrerDoc.data().totalInvites || 0) + 1;
                            transaction.update(referrerRef, { 
                                totalInvites: newInvites,
                            });
                        }
                    });
                }
            }


            alert(`Account created! You received ${signupBonus} coins. Welcome!`);
        } else { // Login
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

/**
 * @comment: Firebase Auth state change hone par run hota hai.
 */
auth.onAuthStateChanged(async user => {
    if (user) {
        currentUserId = user.uid; 
        isLoggedIn = true;
        currentUserName = user.displayName || user.email.split('@')[0] || "User"; 
        
        console.log("AUTH STATE: User Logged In. UID:", currentUserId);
        
        updateAuthStateUI();
        initializeWalletDisplay(); 

    } else {
        console.log("AUTH STATE: User Logged Out.");
        handleRealLogout(false);
    }
});

/**
 * @comment: Logout handling. Listener bhi band karta hai.
 */
function handleRealLogout(shouldRedirect = true) {
     if (walletListener) {
        walletListener(); 
        walletListener = null;
        console.log("Wallet listener successfully detached.");
     }
     isLoggedIn = false;
     currentUserId = null;
     currentUserName = "Guest User";
     
     // Reset all balance displays
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
        switchPage('home-content', 'Daily Tasks');
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

// --- REWARDS TIMELINE RENDERING ---
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

        const html = `
            <div class="timeline-item ${statusClass}" id="reward-${reward.invites}">
                <div class="timeline-item-icon">${iconContent}</div>
                <div class="timeline-title">${rewardTitle}</div>
                <div class="timeline-card ${cardClass}">
                    <i class="fas fa-trophy reward-icon"></i>
                    <div class="card-text">
                        <strong>${rewardText}</strong>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}


function updateRewardTimeline(inviteCount) {
    // Render the entire dynamic timeline based on the new count
    renderRewardTimeline(inviteCount);
}


/**
 * @comment: Referral link system updated to display UID as a temporary sharing mechanism.
 */
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
            console.error('Could not copy text: ', err);
            alert('Error copying link. Please copy manually.');
        });
    } else if (!isLoggedIn) {
         alert("Please log in first to copy your link.");
    }
}


let currentPageId = 'home-content'; 

function switchPage(targetPageId, title) {
    const contentSections = document.querySelectorAll('.content-section');
    const rewardsTabs = document.getElementById('rewards-tabs');
    const headerTitle = document.getElementById('header-title');
    const appHeader = document.querySelector('.app-header');
    const backButton = document.getElementById('back-button');

    currentPageId = targetPageId;

    contentSections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(targetPageId);
    if (targetSection) {
      targetSection.classList.add('active');
      headerTitle.textContent = title;
    }

    const needsFlatHeader = (targetPageId !== 'home-content');
    
    if (needsFlatHeader) {
      appHeader.classList.add('flat-header'); 
      backButton.style.display = 'block'; 
      rewardsTabs.style.display = (targetPageId === 'rewards-content') ? 'flex' : 'none';
    } else {
      appHeader.classList.remove('flat-header'); 
      backButton.style.display = 'none'; 
      rewardsTabs.style.display = 'none';
    }
    
    if (targetPageId === 'rewards-content') {
         headerTitle.textContent = 'Refer & Earn';
         const defaultTabLink = rewardsTabs.querySelector('.tab-link.active');
         if (defaultTabLink) {
             const defaultTabId = defaultTabLink.getAttribute('data-tab');
             switchTab(defaultTabId + '-content');
         }
    } else if (targetPageId === 'wallet-content') {
         headerTitle.textContent = 'Wallet';
    } else if (targetPageId === 'more-content') {
         headerTitle.textContent = 'More';
    }
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
    rewardsTabs.querySelector(`[data-tab="${targetTabId.replace('-content', '')}"]`).classList.add('active');
}

function handleBack() {
    switchPage('home-content', 'Daily Tasks');
    document.querySelectorAll('.mobile-footer .nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector('.mobile-footer [data-page="home-content"]').classList.add('active');
}


document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.mobile-footer .nav-link');
  const backButton = document.getElementById('back-button');
  const copyButton = document.getElementById('copy-referral-btn');
  
  if (copyButton) {
      copyButton.addEventListener('click', copyReferralLink);
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPageId = link.getAttribute('data-page');
      
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

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

  // Initial page load: Render rewards timeline for the guest user (0 invites)
  renderRewardTimeline(0);
  switchPage('home-content', 'Daily Tasks');
  
  // Start checking withdrawal lock status
  updateWithdrawalLockStatus();
});
