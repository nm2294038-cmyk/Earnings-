// --- FIREBASE CONFIGURATION AND INITIALIZATION ---
// NOTE: Replace with your actual Firebase config (This is a mock config)
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
let currentReferralCode = null; 
let currentUserName = "Guest User"; 
let authMode = 'signup'; 
let walletListener = null; 

const MOCK_REFERRAL_CODE = "USER-TEST1";
const USERS_COLLECTION = "users";

// --- PROFILE AND WALLET DISPLAY LOGIC (Firestore Integration) ---

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
            balanceDisplay.textContent = '0.00';
            updateProfileCardDisplay("User Not Found", "0.00");
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
                uid: uid,
                name: name,
                email: email, 
                referralCode: userReferralCode,
                referredBy: referralCodeUsed || null,
                balance: signupBonus, 
                totalInvites: 0,
                activeInvites: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // 2. IMPORTANT: Update the referrer's invite count using a Transaction
            if (referralCodeUsed) {
                const referrerRef = db.collection(USERS_COLLECTION).doc(referralCodeUsed);
                
                await db.runTransaction(async (transaction) => {
                    const referrerDoc = await transaction.get(referrerRef);
                    
                    if (referrerDoc.exists) {
                        const newInvites = (referrerDoc.data().totalInvites || 0) + 1;
                        // Update referrer's total invites (and possibly give bonus coins here too)
                        transaction.update(referrerRef, { 
                            totalInvites: newInvites,
                            // Example of adding 100 bonus coins to referrer on new signup:
                            // balance: (referrerDoc.data().balance || 0) + 100 
                        });
                        console.log(`Updated referrer ${referralCodeUsed} with new totalInvites: ${newInvites}`);
                    } else {
                        console.warn(`Referrer code ${referralCodeUsed} not found.`);
                    }
                });
            }


            alert(`Account created! You received ${signupBonus} coins. Referrer updated if code was valid.`);
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

async function findUserReferralCode(uid) {
    try {
        const snapshot = await db.collection(USERS_COLLECTION).where('uid', '==', uid).limit(1).get();
        if (!snapshot.empty) {
            currentUserName = snapshot.docs[0].data().name || "User";
            return snapshot.docs[0].id; 
        }
    } catch (e) {
        console.error("Error finding user referral code:", e);
    }
    return MOCK_REFERRAL_CODE; 
}

auth.onAuthStateChanged(async user => {
    if (user) {
        currentUserId = user.uid;
        isLoggedIn = true;
        
        currentReferralCode = await findUserReferralCode(currentUserId);
        
        updateAuthStateUI();
        initializeWalletDisplay();

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
    const reward100 = document.getElementById('reward-100-invites');
    const reward500 = document.getElementById('reward-500-invites');

    if (inviteCount >= 100) {
        reward100.classList.remove('locked');
        reward100.querySelector('.timeline-item-icon').innerHTML = '<i class="fas fa-check"></i>';
        reward100.classList.add('unlocked');
    } else {
        reward100.classList.add('locked');
        reward100.classList.remove('unlocked');
        reward100.querySelector('.timeline-item-icon').innerHTML = '<i class="fas fa-lock"></i>';
    }

    if (inviteCount >= 500) {
        reward500.classList.remove('locked');
        reward500.querySelector('.timeline-item-icon').innerHTML = '<i class="fas fa-check"></i>';
        reward500.classList.add('unlocked');
    } else {
        reward500.classList.add('locked');
        reward500.classList.remove('unlocked');
        reward500.querySelector('.timeline-item-icon').innerHTML = '<i class="fas fa-lock"></i>';
    }
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
