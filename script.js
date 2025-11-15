// --- FIREBASE CONFIGURATION AND INITIALIZATION ---
// NOTE: Replace with your actual Firebase config (This is a mock config)
const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a22f5f1a959d8ce3f02",
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
let currentReferralCode = null; 
let currentUserName = "Guest User"; 
let authMode = 'signup'; 
let walletListener = null; 

const MOCK_REFERRAL_CODE = "USER-TEST1";
const USERS_COLLECTION = "users";

// Define all reward tiers for easy management (Rewards Tab)
const REWARD_TIERS = [
    100, 500, 
    5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000
];

// --- CORE FUNCTIONS ---

/**
 * Checks if the current time is between 10:00 PM and 10:10 PM (Local Time).
 * @returns {boolean} True if the withdrawal window is open.
 */
function isWithdrawalWindowOpen() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // 10:00 PM is 22:00 in 24-hour format
    const startTime = 22 * 60; // 1320 minutes (10:00 PM)
    const endTime = 22 * 60 + 10; // 1330 minutes (10:10 PM)
    const currentTime = hours * 60 + minutes;

    return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Updates the lock state of the Withdrawal button and displays the time status.
 */
function updateWithdrawalLockState() {
    const withdrawalBox = document.getElementById('withdrawal-task-box');
    const timeDisplay = document.getElementById('withdrawal-time-display');
    
    if (!withdrawalBox || !timeDisplay) return;

    if (isWithdrawalWindowOpen()) {
        // Window is open: UNLOCK
        withdrawalBox.classList.remove('locked-task');
        const lockIcon = withdrawalBox.querySelector('.lock-overlay-icon');
        if (lockIcon) lockIcon.style.display = 'none';
        
        timeDisplay.className = 'withdrawal-time-info open';
        timeDisplay.innerHTML = '✅ Withdrawal Window is OPEN! (10:00 PM - 10:10 PM)';
        
    } else {
        // Window is closed: LOCK
        withdrawalBox.classList.add('locked-task');
        const lockIcon = withdrawalBox.querySelector('.lock-overlay-icon');
        if (lockIcon) lockIcon.style.display = 'block';

        const now = new Date();
        const nextOpenTime = new Date(now);
        
        // Set next open time to 10:00 PM today
        nextOpenTime.setHours(22, 0, 0, 0); 
        
        // If 10 PM has passed today, set it for 10 PM tomorrow
        if (now.getTime() > nextOpenTime.getTime()) {
            nextOpenTime.setDate(nextOpenTime.getDate() + 1);
        }

        const diffMs = nextOpenTime.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);


        timeDisplay.className = 'withdrawal-time-info closed';
        timeDisplay.innerHTML = `🔒 Withdrawal opens in: ${diffHours}h ${diffMinutes}m ${diffSeconds}s (10:00 PM - 10:10 PM)`;
    }
}

/**
 * Manages the locked state of the other 12 locked boxes (Bronze, Bonus, Task 1-10).
 * 
 * --- كيفية فتح هذه الصناديق (How to Unlock These Boxes) ---
 * 
 * لفتح صندوق معين، قم بتغيير قيمة المتغير المقابل له أدناه من `true` إلى `false`.
 * مثال: لفتح صندوق "Bronze Box"، قم بتغيير `const lockBronzeBox = true;` إلى `const lockBronzeBox = false;`
 * 
 * @param {string} boxId - The ID of the box element.
 * @param {boolean} shouldBeLocked - True to lock, False to unlock.
 */
function controlOtherLockedBoxes(boxId, shouldBeLocked) {
    const box = document.getElementById(boxId);
    if (!box) return;

    if (shouldBeLocked) {
        box.classList.add('locked-task');
        // Ensure lock icon is visible
        const lockIcon = box.querySelector('.lock-overlay-icon');
        if (lockIcon) lockIcon.style.display = 'block';
    } else {
        box.classList.remove('locked-task');
        // Hide lock icon
        const lockIcon = box.querySelector('.lock-overlay-icon');
        if (lockIcon) lockIcon.style.display = 'none';
    }
}

// --- LOCK/UNLOCK CONFIGURATION FOR DAILY TASKS (Edit these variables to unlock) ---
const lockBronzeBox = true; // صندوق البرونز
const lockExtraBonus = true; // المكافأة الإضافية
const lockTask1 = true;
const lockTask2 = true;
const lockTask3 = true;
const lockTask4 = true;
const lockTask5 = true;
const lockTask6 = true;
const lockTask7 = true;
const lockTask8 = true;
const lockTask9 = true;
const lockTask10 = true;


// --- INITIALIZATION & INTERVALS ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Withdrawal Lock State and start checking every second for precision
    updateWithdrawalLockState();
    setInterval(updateWithdrawalLockState, 1000); // Check every second

    // 2. Apply lock states to other boxes
    controlOtherLockedBoxes('locked-task-bronze', lockBronzeBox);
    controlOtherLockedBoxes('locked-task-bonus', lockExtraBonus);
    controlOtherLockedBoxes('locked-task-1', lockTask1);
    controlOtherLockedBoxes('locked-task-2', lockTask2);
    controlOtherLockedBoxes('locked-task-3', lockTask3);
    controlOtherLockedBoxes('locked-task-4', lockTask4);
    controlOtherLockedBoxes('locked-task-5', lockTask5);
    controlOtherLockedBoxes('locked-task-6', lockTask6);
    controlOtherLockedBoxes('locked-task-7', lockTask7);
    controlOtherLockedBoxes('locked-task-8', lockTask8);
    controlOtherLockedBoxes('locked-task-9', lockTask9);
    controlOtherLockedBoxes('locked-task-10', lockTask10);
});


// --- FIREBASE & UI LOGIC ---

/**
 * Sets up a real-time listener to fetch and display the user's wallet balance and rewards data.
 */
function initializeWalletDisplay() {
    const balanceDisplay = document.getElementById('wallet-coin-balance');
    const totalInviteCountDisplay = document.getElementById('total-invites-count');
    const activeInviteCountDisplay = document.getElementById('active-invites-count');
    
    if (!db || !currentReferralCode) {
        balanceDisplay.textContent = '---';
        totalInviteCountDisplay.textContent = 0;
        activeInviteCountDisplay.textContent = 0;
        updateRewardTimeline(0);
        updateProfileCardDisplay("Guest User", "---");
        return;
    }
    
    // 1. Clear any existing listener
    if (walletListener) {
        walletListener();
        console.log("Previous wallet listener detached.");
    }

    // We listen to the user document identified by their Referral Code (which is the Document ID)
    const walletRef = db.collection(USERS_COLLECTION).doc(currentReferralCode);
    
    balanceDisplay.textContent = 'Loading...';
    totalInviteCountDisplay.textContent = '...';
    activeInviteCountDisplay.textContent = '...';

    // 2. Set up new real-time listener (onSnapshot)
    walletListener = walletRef.onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            const balance = data.balance || 0;
            const totalInvites = data.totalInvites || 0;
            const activeInvites = data.activeInvites || 0;
            currentUserName = data.name || "User";
            
            const formattedBalance = parseFloat(balance).toFixed(2);
            
            // Update Wallet UI
            balanceDisplay.textContent = formattedBalance;
            
            // Update Rewards UI
            totalInviteCountDisplay.textContent = totalInvites;
            activeInviteCountDisplay.textContent = activeInvites;
            updateRewardTimeline(totalInvites);
            
            // Update Profile Card UI
            updateProfileCardDisplay(currentUserName, formattedBalance);

            console.log(`Realtime balance update received: ${formattedBalance}`);
        } else {
            // If the document is missing, log an error but keep the user logged in via Auth
            console.error(`Firestore document missing for referral code: ${currentReferralCode}`);
            balanceDisplay.textContent = '0.00';
            updateProfileCardDisplay("User Data Missing", "0.00");
        }
    }, error => {
        console.error("Error listening to user document:", error);
        balanceDisplay.textContent = 'Error';
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

window.closeAuthModal = function() {
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

window.toggleAuthMode = function() {
    if (authMode === 'signup') {
        setAuthMode('login');
    } else {
        setAuthMode('signup');
    }
}

window.handleAuthClick = function(mode) {
    if (mode === 'logout') {
        handleRealLogout();
    } else {
        showAuthModal(mode);
    }
}

function generateReferralCode(email) {
    const emailPrefix = email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
    return emailPrefix.substring(0, 4) + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function generateRandomBonus() {
    return Math.floor(Math.random() * (200 - 100 + 1)) + 100;
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
            const userReferralCode = generateReferralCode(email);
            const signupBonus = generateRandomBonus();
            
            // 1. Create User document in Firestore 
            await db.collection(USERS_COLLECTION).doc(userReferralCode).set({
                uid: uid, // IMPORTANT: Store UID for later lookup
                name: name,
                email: email, 
                referralCode: userReferralCode,
                referredBy: referralCodeUsed || null,
                balance: signupBonus, 
                totalInvites: 0,
                activeInvites: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // 2. Update the referrer's invite count
            if (referralCodeUsed) {
                const referrerRef = db.collection(USERS_COLLECTION).doc(referralCodeUsed);
                
                await db.runTransaction(async (transaction) => {
                    const referrerDoc = await transaction.get(referrerRef);
                    
                    if (referrerDoc.exists) {
                        const newInvites = (referrerDoc.data().totalInvites || 0) + 1;
                        transaction.update(referrerRef, { 
                            totalInvites: newInvites,
                        });
                        console.log(`Updated referrer ${referralCodeUsed} with new totalInvites: ${newInvites}`);
                    } else {
                        console.warn(`Referrer code ${referralCodeUsed} not found.`);
                    }
                });
            }


            alert(`Account created! You received ${signupBonus} coins.`);
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
 * Finds the user's Firestore Document ID (Referral Code) using their Auth UID.
 * This is the crucial step to link Auth login to Firestore data.
 * 
 * @param {string} uid - The Firebase Auth User ID.
 * @returns {string | null} The Referral Code (Document ID) or null if not found.
 */
async function findUserReferralCode(uid) {
    try {
        // Query the 'users' collection where the 'uid' field matches the Auth UID
        const snapshot = await db.collection(USERS_COLLECTION).where('uid', '==', uid).limit(1).get();
        
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            currentUserName = doc.data().name || "User";
            return doc.id; // The Document ID is the Referral Code
        } else {
            console.warn(`Firestore document not found for UID: ${uid}`); 
        }
    } catch (e) {
        console.error("Error finding user referral code in Firestore:", e);
    }
    return null; 
}

auth.onAuthStateChanged(async user => {
    if (user) {
        currentUserId = user.uid;
        isLoggedIn = true;
        
        // Step 1: Find the referral code (Document ID) based on the UID
        currentReferralCode = await findUserReferralCode(currentUserId);
        
        if (currentReferralCode) {
            updateAuthStateUI();
            // Step 2: Initialize listener to load wallet data using the found Referral Code
            initializeWalletDisplay();
        } else {
            // If user logged in via Auth but no Firestore data found
            handleRealLogout(false);
            // Display specific error for missing Firestore data
            document.getElementById('profile-name').textContent = "Data Error";
            document.getElementById('profile-balance').textContent = "User Data Missing!";
            console.error(`CRITICAL: User ${currentUserId} logged in but Firestore document is missing.`);
        }

    } else {
        handleRealLogout(false);
    }
});

function handleRealLogout(shouldRedirect = true) {
     if (walletListener) {
        walletListener();
        walletListener = null;
     }
     if (isLoggedIn) {
         auth.signOut();
     }
     isLoggedIn = false;
     currentUserId = null;
     currentReferralCode = null;
     currentUserName = "Guest User";
     
     document.getElementById('wallet-coin-balance').textContent = '---';
     document.getElementById('total-invites-count').textContent = 0;
     document.getElementById('active-invites-count').textContent = 0;
     updateRewardTimeline(0); 
     updateProfileCardDisplay("Guest User", "---");

     updateAuthStateUI();

     if (shouldRedirect) {
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

function updateRewardTimeline(inviteCount) {
    // Check all reward tiers dynamically
    REWARD_TIERS.forEach(tier => {
        const rewardId = `reward-${tier}-invites`;
        const element = document.getElementById(rewardId);
        
        if (element) {
            const iconContainer = element.querySelector('.timeline-item-icon');
            
            if (inviteCount >= tier) {
                element.classList.remove('locked');
                element.classList.add('unlocked');
                iconContainer.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                element.classList.add('locked');
                element.classList.remove('unlocked');
                iconContainer.innerHTML = '<i class="fas fa-lock"></i>';
            }
        }
    });
}


function initializeReferralSystem() {
    const linkTextDisplay = document.getElementById('actual-referral-link-text');
    const copyButton = document.getElementById('copy-referral-btn');
    const inviteButton = document.getElementById('invite-button-link');

    const BASE_URL = "https://www.yoursmed.xyz/?ref=";
    const DEFAULT_MESSAGE = "[Please log in to generate your referral link]";

    if (!isLoggedIn || !currentReferralCode) {
        linkTextDisplay.textContent = DEFAULT_MESSAGE;
        copyButton.style.display = 'none';
        inviteButton.href = "#"; 
        return;
    }

    const fullLink = BASE_URL + currentReferralCode;
    
    linkTextDisplay.textContent = fullLink;
    copyButton.style.display = 'block'; 
    copyButton.textContent = 'Copy Link';
    copyButton.style.backgroundColor = '#4CAF50';
    inviteButton.href = `whatsapp://send?text=Earn free money! Join YoursMed using my link: ${encodeURIComponent(fullLink)}`;
}

function copyReferralLink() {
    const linkText = document.getElementById('actual-referral-link-text').textContent;
    const copyButton = document.getElementById('copy-referral-btn');

    if (navigator.clipboard) {
        navigator.clipboard.writeText(linkText).then(() => {
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
    } else {
        alert("Clipboard not supported. Please copy the link manually: " + linkText);
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

  // Initial page load
  switchPage('home-content', 'Daily Tasks');

});
