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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- GLOBAL STATE & MOCK AUTH ---
let isLoggedIn = false;
let currentUserUid = null; // Will store the mock UID if logged in.
let currentReferralCode = "JOLAB-YIXDFA"; // Default/Placeholder code

// Function to update visibility of Login/Logout buttons
function updateAuthStateUI() {
    const loggedInElements = document.querySelectorAll('.logged-in-only');
    const loggedOutElements = document.querySelectorAll('.logged-out-only');

    if (isLoggedIn) {
        // Show Logout, Hide Login/Signup
        loggedInElements.forEach(el => el.style.display = 'flex');
        loggedOutElements.forEach(el => el.style.display = 'none');
    } else {
        // Show Login/Signup, Hide Logout
        loggedInElements.forEach(el => el.style.display = 'flex');
        loggedOutElements.forEach(el => el.style.display = 'flex');
    }
    
    // Re-initialize referral system based on new state
    initializeReferralSystem(); 
}

// Mock Login/Signup handler (in a real app, this would be a Firebase signIn/createUser call)
function handleMockLogin() {
     isLoggedIn = true;
     // Simulate successful login and generate a unique mock ID
     currentUserUid = "LIVE_USER_" + Math.random().toString(36).substring(2, 8).toUpperCase();
     updateAuthStateUI();
     
     // Immediately switch to the Rewards tab to show the link
     switchPage('rewards-content', 'Refer & Earn');
     alert("Login/Sign Up Successful (Mock)! Please check the Rewards tab for your dynamic link.");
}

// Mock Logout handler
function handleMockLogout() {
     isLoggedIn = false;
     currentUserUid = null;
     updateAuthStateUI();
     alert("Logout Successful (Mock).");
     // Switch back to home
     switchPage('home-content', 'Daily Tasks');
}


    
let currentPageId = 'home-content'; // Track the current page for back button logic

/**
 * Initializes the Referral System by fetching or generating the user's invite link
 * and setting up a real-time listener for their invite statistics.
 */
function initializeReferralSystem() {
    const linkTextDisplay = document.getElementById('actual-referral-link-text');
    const copyButton = document.getElementById('copy-referral-btn');
    const inviteButton = document.getElementById('invite-button-link');
    const totalInviteCount = document.getElementById('total-invites-count');
    const activeInviteCount = document.getElementById('active-invites-count');

    const BASE_URL = "https://www.yoursmed.xyz/?ref=";

    if (!isLoggedIn || !currentUserUid) {
        // If logged out
        linkTextDisplay.textContent = "[Please log in to generate your referral link]";
        copyButton.style.display = 'none';
        inviteButton.href = "#"; // Disable invite action
        totalInviteCount.textContent = 0;
        activeInviteCount.textContent = 0;
        return;
    }

    // --- Logged In Logic ---

    // 1. Generate/Fetch Referral Code (Mock Firebase interaction)
    // For demonstration, we use a mock code based on UID
    const referralCode = currentUserUid.substring(0, 8); 
    const fullLink = BASE_URL + referralCode;

    linkTextDisplay.textContent = fullLink;
    copyButton.style.display = 'inline-block';
    copyButton.textContent = 'Copy Link';
    inviteButton.href = `whatsapp://send?text=Earn free money! Join YoursMed using my link: ${encodeURIComponent(fullLink)}`;


    // 2. Setup Mock Real-time Invite Counts
    // In a real scenario, this would be a db.collection('users').doc(currentUserUid).onSnapshot(...)
    // Since we are mocking Firestore data, we will simulate static data or random mock updates.

    // We will just update static/mock numbers here
    totalInviteCount.textContent = 5; // Example dynamic data
    activeInviteCount.textContent = 2; // Example dynamic data
    
    // (If a full Firebase implementation was required, the onSnapshot listener from the previous response would go here)
}

// Function to handle the copy action
function copyReferralLink() {
    const linkText = document.getElementById('actual-referral-link-text').textContent;
    const copyButton = document.getElementById('copy-referral-btn');

    if (navigator.clipboard) {
        navigator.clipboard.writeText(linkText).then(() => {
            const originalText = copyButton.textContent;
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
        // Fallback for older browsers (not reliable in modern mobile context)
        alert("Clipboard not supported. Please copy the link manually: " + linkText);
    }
}


// Function to switch main content sections
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

    const needsFlatHeader = (targetPageId === 'rewards-content' || targetPageId === 'wallet-content' || targetPageId === 'daily-task-view');
    
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
    } else if (targetPageId === 'daily-task-view') {
         headerTitle.textContent = 'Daily Tasks';
    }
}

// Function to handle Rewards sub-tab switching
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

// Functionality for the back button
function handleBack() {
    if (currentPageId === 'daily-task-view' || currentPageId === 'wallet-content' || currentPageId === 'rewards-content' || currentPageId === 'more-content') {
        switchPage('home-content', 'Daily Tasks');
        document.querySelectorAll('.mobile-footer .nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector('.mobile-footer [data-page="home-content"]').classList.add('active');
    }
}


document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.mobile-footer .nav-link');
  const backButton = document.getElementById('back-button');
  const copyButton = document.getElementById('copy-referral-btn');
  
  // Initial Auth State Update (user starts logged out)
  updateAuthStateUI();

  // Hook up the copy button handler
  if (copyButton) {
      copyButton.addEventListener('click', copyReferralLink);
  }

  // Event Listeners for Footer Navigation
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPageId = link.getAttribute('data-page');
      
      // Update active class on footer links
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      let title = '';
      switch(targetPageId) {
        case 'home-content': title = 'Daily Tasks'; break;
        case 'rewards-content': title = 'Invite & Earn'; break;
        case 'wallet-content': title = 'Wallet'; break;
        case 'more-content': title = 'More'; break;
        default: title = 'YoursMed App';
      }
      
      switchPage(targetPageId, title);
    });
  });

  // Event Listeners for Rewards Tab Links
  document.querySelectorAll('#rewards-tabs .tab-link').forEach(tabLink => {
    tabLink.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTabId = tabLink.getAttribute('data-tab');
      switchTab(targetTabId + '-content'); 
    });
  });
  
  // Back button click handler
  backButton.addEventListener('click', handleBack);


  // Initialize: Start on the Home page
  switchPage('home-content', 'Daily Tasks');

});
