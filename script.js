// ====================================================================
// SECTION A: FIREBASE CONFIGURATION & CORE STATE
// ====================================================================

const firebaseConfig = {
    // !!! ADMIN NOTE: REPLACE THIS WITH YOUR ACTUAL FIREBASE CONFIGURATION !!!
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
const CAROUSEL_SLIDE_COUNT = 6;
const SOCIAL_AD_REFRESH_RATE = 5000; // 5 seconds

// To store the reward of the currently visible ad
let allAdsData = [];
let currentAdIndex = 0; 
let currentAdReward = 0; 

// *** NEW CONSTANT: Referral Bonus for the referrer (the person who invited) ***
const REFERRAL_BONUS_COINS = 5000; // Example coin amount for successful referral

// REWARD MILESTONES (Partial list for brevity)
const REWARD_MILESTONES = [
    { invites: 1, coins: 100000, item: 'Bonus Coins' },
    { invites: 10, coins: 1000000, item: 'Premium Coins' },
    { invites: 20, coins: 2000000, item: 'Voucher Code' },
    { invites: 30, coins: 3000000, item: 'Gift Card' },
    { invites: 250, coins: 300000000, item: 'Mystery Box' },
    { invites: 30000, coins: 3500000000, item: 'Gold Membership' },
    { invites: 35000, coins: 40000000000, item: 'Cash Bonus' },
    { invites: 40000, coins: 450000000000, item: 'Exclusive Offer' },
    { invites: 45000, coins: 50000000000000, item: 'Diamond Reward' },
    { invites: 50000, coins: 550000000000000, item: 'Luxury Item' }
];

const OPEN_HOUR_START = 10; 
const OPEN_MINUTE_START = 0; 
const OPEN_HOUR_END = 21; 
const OPEN_MINUTE_END = 0; 

// ====================================================================
// SECTION B: UI NAVIGATION HANDLERS
// ====================================================================

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

    navLinks.forEach(l => l.classList.remove('active'));
    const activeFooterLink = document.querySelector(`.mobile-footer [data-page="${targetPageId}"]`);
    if (activeFooterLink) {
        activeFooterLink.classList.add('active');
    }
    
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
    const activeLink = rewardsTabs.querySelector(`[data-tab="${targetTabId.replace('-content', '')}"]`);
    if(activeLink) activeLink.classList.add('active');
}

function switchPage(targetPageId, title) {
    const rewardsTabs = document.getElementById('rewards-tabs');

    if (targetPageId !== currentPageId) {
        history.pushState({ page: targetPageId, title: title }, title, `#${targetPageId}`);
    }
    
    _internalUISwitch(targetPageId, title);
    if (targetPageId === 'rewards-content') {
         const defaultTabLink = rewardsTabs.querySelector('.tab-link.active');
         if (defaultTabLink) {
             const defaultTabId = defaultTabLink.getAttribute('data-tab');
             switchTab(defaultTabId + '-content');
         } else {
             switchTab('invite-tab-content');
         }
    }
}

function handleBack() {
    window.history.back();
}


// ====================================================================
// SECTION C: FEATURES (Link Handling & Exit Prompt)
// ====================================================================

document.addEventListener('click', function(e) {
    let target = e.target;
    while (target && target.tagName !== 'A') {
        target = target.parentElement;
    }

    if (target && target.href) {
        const url = target.href;
        
        if (target.getAttribute('data-page') || target.id === 'logout-button' || url.endsWith('#')) {
            return;
        }

        let parentContainer = target.closest('.admin-locked-container');
        if (parentContainer && parentContainer.classList.contains('locked')) {
            e.preventDefault();
            e.stopPropagation();
            const message = parentContainer.querySelector('.admin-locked-overlay p').textContent;
            alert(message);
            return;
        }
        
        const featureElement = target.closest('[data-feature]');
        if (featureElement && featureElement.classList.contains('locked')) {
            e.preventDefault();
            e.stopPropagation();
            const message = featureElement.querySelector('.admin-locked-overlay p').textContent;
            alert(message);
            return;
        }


        if (url.startsWith('http') || url.startsWith('https') || url.startsWith('//')) {
            e.preventDefault(); 
            // NOTE: Social Ad link handling is moved to handleAdInteraction
            if (target.id !== 'social-ad-link') {
                window.open(url, '_blank');
            }
        }
    }
});


function showExitModal() {
    document.getElementById('exit-modal-overlay').style.display = 'flex';
}

function hideExitModal() {
    document.getElementById('exit-modal-overlay').style.display = 'none';
}

function handleExitDecision(shouldExit) {
    hideExitModal();
    if (!shouldExit) {
        history.pushState({ page: 'home-content', title: 'Daily Tasks' }, 'Daily Tasks', '#home-content');
        _internalUISwitch('home-content', 'Daily Tasks');
        document.querySelectorAll('.mobile-footer .nav-link').forEach(l => l.classList.remove('active'));
        const homeLink = document.querySelector(`.mobile-footer [data-page="home-content"]`);
        if (homeLink) homeLink.classList.add('active');
    }
}


window.addEventListener('popstate', function(event) {
    const state = event.state;
    
    if (state && state.page) {
        _internalUISwitch(state.page, state.title || 'YoursMed App');
    } else {
        if (currentPageId === 'home-content') {
            showExitModal();
        }
    }
});


/**
 * Applies or removes a lock overlay controlled by the Admin.
 */
function applyAdminLock(element, locked, message) {
    if (!element) return;

    const existingOverlay = element.querySelector('.admin-locked-overlay');

    if (locked) {
        element.classList.add('locked');
        
        if (!existingOverlay) {
            const overlay = document.createElement('div');
            overlay.className = 'admin-locked-overlay';
            overlay.innerHTML = `<i class="fas fa-exclamation-triangle"></i><p style="font-size: 0.9em; margin: 5px 0 0;">${message}</p>`;
            
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                alert(message);
            });
            element.appendChild(overlay);
        }
    } else {
        element.classList.remove('locked');
        if (existingOverlay) {
            existingOverlay.remove();
        }
    }
}

/**
 * Checks global settings from Firebase and applies locks to UI sections.
 */
function checkFeatureLocks() {
    if (typeof db === 'undefined') {
        console.error("Firestore not available for locking.");
        return;
    }

    db.collection('settings').doc('global').onSnapshot(doc => {
        if (doc.exists) {
            const settings = doc.data();
            
            const applyLockToFeature = (featureName, lockKey, defaultMessage) => {
                const isLocked = settings[lockKey] === true;
                const elements = document.querySelectorAll(`[data-feature="${featureName}"]`);
                elements.forEach(element => {
                    applyAdminLock(element, isLocked, defaultMessage);
                });
            };

            // Main Grid Locks (Partial list for brevity)
            applyLockToFeature('dailyCheck', 'isLockDailyCheck', "Daily Check is temporarily disabled by the Admin.");
            applyLockToFeature('videoOffer', 'isLockVideoOffer', "Video Offers are temporarily disabled by the Admin.");
            applyLockToFeature('withdrawalOptions', 'isLockWithdrawal', "All Withdrawal options are temporarily disabled by the Admin.");
            
            // Section Locks (Partial list for brevity)
            applyLockToFeature('rewardsSection', 'isLockRewardsSection', "The Referral and Rewards system is temporarily disabled by the Admin.");
            applyLockToFeature('newFeaturesSection', 'isLockNewFeatures', "New Features/Offerwalls are temporarily disabled by the Admin.");
            
            // Locked Tasks (Bottom Grid)
            for (let i = 1; i <= 10; i++) {
                const lockKey = `isLockLockedTask${i}`;
                const featureName = `lockedTask${i}`;
                const element = document.querySelector(`[data-feature="${featureName}"]`);
                const hardcodedLockIcon = element ? element.querySelector('.lock-overlay-icon') : null;
                
                if (element) {
                    const isLockedByAdmin = settings[lockKey] === true;
                    
                    if (settings[lockKey] === false) {
                        element.classList.remove('locked-task');
                        element.style.pointerEvents = 'auto';
                        if (hardcodedLockIcon) hardcodedLockIcon.style.display = 'none';
                    } else if (isLockedByAdmin || settings[lockKey] === undefined) {
                        element.classList.add('locked-task');
                        element.style.pointerEvents = 'none';
                        if (hardcodedLockIcon) hardcodedLockIcon.style.display = 'block';
                    }
                }
            }


        } else {
            console.warn("Global settings document not found.");
        }
    }, error => {
        console.error("Error fetching settings for locks:", error);
    });
}


// ====================================================================
// SECTION D: DYNAMIC CONTENT LOADING (Social Ad, Carousel & App Links)
// ====================================================================

// --- NEW FUNCTION: Load Social Ad Settings from Admin Panel ---
function loadSocialAdSettings() {
    if (typeof db === 'undefined') return;

    // Listen to the settings/socialAd document for real-time updates
    db.collection('settings').doc('socialAd').onSnapshot(doc => {
        if (doc.exists && doc.data().ads) {
            // Filter out ads that don't have basic required fields
            allAdsData = doc.data().ads.filter(ad => ad.imageUrl && ad.websiteLink); 
            
            if (allAdsData.length === 0) {
                 console.warn("No active ads found in the database. Using defaults.");
                 // Use a default ad with a default reward (e.g., 10 coins)
                 allAdsData = [{ imageUrl: 'https://i.ibb.co/L50Hq68/placeholder-ad.png', websiteLink: 'https://www.yoursmed.xyz', coinsReward: 10 }];
            }
        } else {
            console.warn("Social Ad settings document or ads array not found. Using defaults.");
            allAdsData = [{ imageUrl: 'https://i.ibb.co/L50Hq68/placeholder-ad.png', websiteLink: 'https://www.yoursmed.xyz', coinsReward: 10 }];
        }
    }, error => {
        console.error("Error fetching social ad settings:", error);
    });
}

function updateSocialAdModal(adData) {
    const adImage = document.getElementById('social-ad-image');
    const adLink = document.getElementById('social-ad-link');
    const rewardDisplay = document.getElementById('social-ad-reward-display'); // This targets the span inside the button
    
    // Ensure adData.coinsReward is treated as a number, defaulting to 10
    const reward = adData.coinsReward !== undefined ? parseInt(adData.coinsReward) : 10;

    if (adImage) adImage.src = adData.imageUrl;
    if (adLink) adLink.href = adData.websiteLink;
    
    // Store the reward amount for the current ad
    currentAdReward = reward;
    
    // Show the reward amount to the user (Replaced "Visit Website")
    if (rewardDisplay) {
        // Display coins with localization for thousands separator
        rewardDisplay.textContent = `${currentAdReward.toLocaleString()} Coins`; 
    }
}
// --- END NEW FUNCTION ---


/**
 * Loads Carousel Slides from Firebase Settings.
 */
function loadCarouselSlides() {
    if (typeof db === 'undefined') return;

    const carouselTrack = document.getElementById('carousel-track');
    
    db.collection('settings').doc('carousel_slides').onSnapshot(doc => {
        let slides = [];
        if (doc.exists) {
            slides = doc.data().slides || [];
        }

        if (slides.length === 0) {
            // Default slides if nothing is configured by admin
            slides = [
                { imageUrl: 'https://i.ibb.co/qM4wYtKy/IMG-20251119-WA0032.jpg', linkUrl: 'https://toolswebsite205.blogspot.com' },
                { imageUrl: 'https://i.ibb.co/hFdpRnXR/FB-IMG-1763006052781.jpg', linkUrl: 'https://www.facebook.com/share/g/17MG25oD5j/' },
                { imageUrl: 'https://i.ibb.co/bj9cnS2m/FB-IMG-1763006049127.jpg', linkUrl: 'https://www.instagram.com/gmnetworking9?igsh=ejV6MjUzcTVyMGxz' },
                { imageUrl: 'https://i.ibb.co/jvgxx2gF/FB-IMG-1763006046346.jpg', linkUrl: '#' },
                { imageUrl: 'https://i.ibb.co/Fkqz9FXT/FB-IMG-1763006044569.jpg', linkUrl: 'https://www.tiktok.com/@gmnetworking9?_r=1' },
                { imageUrl: 'https://i.ibb.co/SwGJrVTV/FB-IMG-1763006042540.jpg', linkUrl: 'https://www.yoursmed.xyz/?ref=29UI1U0O' }
            ];
        }

        let innerHTML = '';
        const effectiveSlides = slides.slice(0, CAROUSEL_SLIDE_COUNT);

        effectiveSlides.forEach((slide, index) => {
             innerHTML += `
                 <a href="${slide.linkUrl || '#'}" 
                    class="carousel-slide slide-${index + 1}"
                    style="background-image: url('${slide.imageUrl || ''}');">
                 </a>
             `;
        });
        
        // Loop the slides for smooth transition (Add duplicates up to 10 slides total)
        for (let i = effectiveSlides.length; i < 10; i++) {
            const originalSlide = effectiveSlides[i % effectiveSlides.length];
             innerHTML += `
                 <a href="${originalSlide.linkUrl || '#'}" 
                    class="carousel-slide slide-placeholder-${i + 1}"
                    style="background-image: url('${originalSlide.imageUrl || ''}');">
                 </a>
             `;
        }

        carouselTrack.innerHTML = innerHTML;
    });
}

/**
 * Loads App Download Links and Ad Message from Firebase Settings.
 */
function loadAppDownloadLinks() {
    if (typeof db === 'undefined') return;

    const adMessageElement = document.getElementById('ad-message');
    const downloadButton = document.getElementById('app-download-button');

    db.collection('settings').doc('app_links').onSnapshot(doc => {
        if (doc.exists) {
            const links = doc.data();
            const downloadLink = links.appDownloadLink || '#';
            const message = links.adPlaceholderMessage || 'Download the app and win Rs.10k';
            
            if (adMessageElement) adMessageElement.innerHTML = `YoursMed King <br>${message}`;
            if (downloadButton) downloadButton.href = downloadLink;
        }
    });
}


// ====================================================================
// SECTION E: CORE FIREBASE & USER LOGIC
// ====================================================================

/**
 * Formats large numbers into K, M, B format.
 * @param {number} num 
 * @returns {string} Formatted string (e.g., 1234567 -> 1.23M)
 */
function formatCoinBalance(num) {
    if (num === null || num === undefined) return '0';
    num = parseFloat(num);
    
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2).replace(/\.00$/, '') + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2).replace(/\.00$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2).replace(/\.00$/, '') + 'K';
    }
    return num.toFixed(2);
}


function isWithdrawalWindowOpen() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const startTimeInMinutes = (OPEN_HOUR_START * 60) + OPEN_MINUTE_START;
    const endTimeInMinutes = (OPEN_HOUR_END * 60) + OPEN_MINUTE_END;
    const currentTimeInMinutes = (currentHour * 60) + currentMinute;
    
    return (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes);
}

function updateWithdrawalLockStatus() {
    const isOpen = isWithdrawalWindowOpen();
    const homeWithdrawalBox = document.getElementById('home-withdrawal-box');
    const timeLockedItems = document.querySelectorAll('#withdrawal-grid-container .withdrawal-item.time-locked');
    const lockMessage = `Withdrawal Locked. Opens at ${OPEN_HOUR_START}:00 AM to ${OPEN_HOUR_END - 12}:00 PM`;

    if (homeWithdrawalBox) {
        let overlay = homeWithdrawalBox.querySelector('.lock-time-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'lock-time-overlay';
            homeWithdrawalBox.appendChild(overlay);
        }
        if (isOpen) {
            if (!homeWithdrawalBox.classList.contains('locked')) {
                homeWithdrawalBox.classList.remove('locked-task');
                overlay.style.display = 'none';
            }
        } else {
            homeWithdrawalBox.classList.add('locked-task');
            overlay.innerHTML = `<i class="fas fa-lock"></i> ${lockMessage}`;
            overlay.style.display = 'flex';
        }
    }
    
    timeLockedItems.forEach(item => {
        if (!item.closest('.admin-locked-container.locked') && !item.classList.contains('locked')) {
            if (isOpen) {
                item.classList.remove('locked-item');
                item.style.pointerEvents = 'auto';
                item.style.opacity = '1';
            } else {
                item.classList.add('locked-item');
                item.style.pointerEvents = 'none';
                item.style.opacity = '0.5';
            }
        }
    });
    setTimeout(updateWithdrawalLockStatus, 60000); 
}


function updateProfileCardDisplay(name, balance) {
    document.getElementById('profile-name').textContent = name;
    // Use formatCoinBalance for the profile card display
    document.getElementById('profile-balance').innerHTML = `<i class="fas fa-coins" style="color:#ffc107;"></i> Balance: ${formatCoinBalance(balance)}`;
}

// **MAIN WALLET AND REWARDS CLAIM LOGIC**
async function attemptRewardClaim(userId, totalInvites, claimedRewards) {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    let rewardClaimed = false;

    for (const reward of REWARD_MILESTONES) {
        const milestoneKey = `invites_${reward.invites}`;
        
        // Check if milestone is reached AND not already claimed
        if (totalInvites >= reward.invites && claimedRewards && claimedRewards[milestoneKey] !== true) {
            try {
                await userRef.update({
                    coins: firebase.firestore.FieldValue.increment(reward.coins),
                    [`claimedRewards.${milestoneKey}`]: true // Mark as claimed
                });
                console.log(`Successfully claimed reward for ${reward.invites} invites: ${reward.coins} coins.`);
                rewardClaimed = true;
                
                // Show a brief alert to the user (optional, but helpful)
                alert(`🎉 Congratulations! You claimed ${reward.coins.toLocaleString()} Coins for reaching ${reward.invites.toLocaleString()} total invites!`);

                // Stop after claiming one reward to prevent hitting rate limits, let the listener handle the next refresh
                return true; 
            } catch (error) {
                console.error(`Failed to claim reward ${milestoneKey}:`, error);
            }
        }
    }
    return rewardClaimed;
}


function initializeWalletDisplay() {
    const mainBalanceDisplay = document.getElementById('wallet-coin-balance');
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

    walletListener = walletRef.onSnapshot(async doc => {
        if (doc.exists) {
            const data = doc.data();
            const rawCoins = data.coins !== undefined ? data.coins : 0; 
            const totalInvites = data.totalInvites || 0;
            const activeInvites = data.activeInvites || 0;
            const claimedRewards = data.claimedRewards || {};
            
            currentUserName = data.name || (auth.currentUser ? auth.currentUser.email.split('@')[0] : "User");
            
            // 1. Attempt to claim any unclaimed rewards based on TOTAL INVITES
            if (totalInvites > 0) {
                 const claimed = await attemptRewardClaim(currentUserId, totalInvites, claimedRewards);
                 if (claimed) {
                     return;
                 }
            }
            
            // 2. Update UI (only if no claim was processed in this snapshot cycle)
            // Apply formatting to all coin displays
            mainBalanceDisplay.textContent = formatCoinBalance(rawCoins);
            document.getElementById('tiktok-coin-balance').textContent = formatCoinBalance(data.tiktokCoins || 0);
            document.getElementById('amazon-coin-balance').textContent = formatCoinBalance(data.amazonCoins || 0);
            document.getElementById('pubg-uc-balance').textContent = (data.pubgUC || 0).toLocaleString(); // UC usually not formatted to K/M
            
            totalInviteCountDisplay.textContent = totalInvites;
            activeInviteCountDisplay.textContent = activeInvites;
            
            updateRewardTimeline(totalInvites, claimedRewards); 
            updateProfileCardDisplay(currentUserName, rawCoins); // Pass raw coins to profile card display for formatting

        } else {
            // User creation logic remains here for new users
            const userEmailPrefix = auth.currentUser ? auth.currentUser.email.split('@')[0] : "User";
            walletRef.set({
                name: userEmailPrefix, email: auth.currentUser.email,
                coins: 0, tiktokCoins: 0, amazonCoins: 0, pubgUC: 0,
                referralCode: currentUserId.substring(0, 8).toUpperCase(), referredBy: null, totalInvites: 0, activeInvites: 0,
                claimedRewards: {}, 
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
        switchText.textContent = "Already have an account? "; switchLink.textContent = "Login";
        nameInput.style.display = 'block'; nameInput.required = true;
        referralInput.style.display = 'block'; 
    } else {
        title.textContent = "Log In"; submitBtn.textContent = "Login";
        switchText.textContent = "Don't have an account? "; switchLink.textContent = "Sign Up";
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

/**
 * Finds the user ID (document ID) by their unique referral code.
 * @param {string} code 
 * @returns {Promise<string|null>} The referrer's UID or null.
 */
async function findReferrerIdByCode(code) {
    try {
        const snapshot = await db.collection(USERS_COLLECTION)
                                 .where('referralCode', '==', code)
                                 .limit(1)
                                 .get();
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

    if (!auth || !db) { alert("Firebase not initialized."); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = (authMode === 'signup' ? 'Processing Sign Up...' : 'Processing Login...');

    try {
        if (authMode === 'signup') {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const newUid = userCredential.user.uid;
            const userReferralCode = newUid.substring(0, 8).toUpperCase(); 
            const signupBonus = generateRandomBonus();
            
            let referrerUid = null;

            // 1. Check if a valid referrer code was used
            if (referralCodeUsed) {
                referrerUid = await findReferrerIdByCode(referralCodeUsed);
            }
            
            // 2. Create the new user document
            await db.collection(USERS_COLLECTION).doc(newUid).set({
                name: name, email: email, coins: signupBonus, tiktokCoins: 0, amazonCoins: 0, pubgUC: 0,
                referralCode: userReferralCode, referredBy: referrerUid, // Store referrer UID, not just code
                totalInvites: 0, activeInvites: 0, claimedRewards: {}, 
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // 3. Update the referrer's invite count and give bonus coins
            if (referrerUid) {
                const referrerRef = db.collection(USERS_COLLECTION).doc(referrerUid);
                
                // Use transaction to ensure atomic update
                await db.runTransaction(async (transaction) => {
                    const referrerDoc = await transaction.get(referrerRef);
                    if (referrerDoc.exists) {
                        const currentTotalInvites = referrerDoc.data().totalInvites || 0;
                        
                        transaction.update(referrerRef, {
                            totalInvites: currentTotalInvites + 1,
                            coins: firebase.firestore.FieldValue.increment(REFERRAL_BONUS_COINS)
                        });
                    }
                });
                
                // Show pop up to the NEW USER confirming referrer received coins
                alert(`Account created! You received ${signupBonus} coins. Your referrer (Code: ${referralCodeUsed}) has been awarded ${REFERRAL_BONUS_COINS.toLocaleString()} coins!`);
            } else {
                 alert(`Account created! You received ${signupBonus} coins. Welcome!`);
            }
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
     if (walletListener) { walletListener = null; }
     isLoggedIn = false; currentUserId = null; currentUserName = "Guest User";
     document.getElementById('wallet-coin-balance').textContent = '---';
     document.getElementById('tiktok-coin-balance').textContent = '---';
     document.getElementById('amazon-coin-balance').textContent = '---';
     document.getElementById('pubg-uc-balance').textContent = '---';
     document.getElementById('total-invites-count').textContent = 0;
     document.getElementById('active-invites-count').textContent = 0;
     updateRewardTimeline(0, {}); 
     updateProfileCardDisplay("Guest User", "---");
     updateAuthStateUI();
     if (shouldRedirect) {
        auth.signOut();
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
        loggedOutElements.forEach(el => el.style.display = 'flex');
        loggedInElements.forEach(el => el.style.display = 'none');
    }
    initializeReferralSystem(); 
}

// **UPDATED REWARDS RENDER FUNCTION**
function renderRewardTimeline(currentInvites, claimedRewards) {
    const container = document.getElementById('dynamic-reward-timeline');
    container.innerHTML = '';
    
    REWARD_MILESTONES.forEach(reward => {
        const milestoneKey = `invites_${reward.invites}`;
        const isClaimed = claimedRewards && claimedRewards[milestoneKey] === true;
        const isUnlocked = currentInvites >= reward.invites;

        const statusClass = isClaimed ? 'unlocked' : (isUnlocked ? 'unlocked' : 'locked'); 
        const iconContent = isClaimed ? '<i class="fas fa-check-circle"></i>' : (isUnlocked ? '<i class="fas fa-check"></i>' : '<i class="fas fa-lock"></i>');
        const cardClass = reward.item.includes('Coins') ? 'card-coins' : 'card-bluetooth';
        const rewardTitle = isClaimed ? 'CLAIMED' : `Unlock on ${reward.invites.toLocaleString()} Invites`;
        const rewardText = `Win ${reward.coins.toLocaleString()} Coins Bonus`;
        
        const html = `
            <div class="timeline-item ${statusClass}" data-milestone="${reward.invites}">
                <div class="timeline-item-icon">${iconContent}</div>
                <div class="timeline-title">${rewardTitle}</div>
                <div class="timeline-card ${cardClass}">
                    <i class="fas fa-trophy reward-icon"></i>
                    <div class="card-text"><strong>${rewardText}</strong></div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

function updateRewardTimeline(inviteCount, claimedRewards) {
    renderRewardTimeline(inviteCount, claimedRewards);
}

function initializeReferralSystem() {
    const linkTextDisplay = document.getElementById('actual-referral-link-text');
    const copyButton = document.getElementById('copy-referral-btn');
    const inviteButton = document.getElementById('invite-button-link');
    const BASE_URL = "https://www.yoursmed.xyz/"; 
    
    if (isLoggedIn && currentUserId) {
        // Use the first 8 characters of UID as the public referral code
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
// SECTION G: VOICE NOTE SUBMISSION LOGIC (Auto Submit)
// ====================================================================

const recognitionStatus = document.getElementById('recognition-status');
const startRecognitionBtn = document.getElementById('start-recognition-btn');
const submitVoiceNoteBtn = document.getElementById('submit-voice-note-btn'); 
const voiceNoteOutput = document.getElementById('voice-note-output');

let recognition;

// Function to handle the actual submission to Firebase
async function autoSubmitVoiceNote(noteText) {
    if (!noteText || !isLoggedIn) return;

    recognitionStatus.textContent = "Submitting Note...";
    voiceNoteOutput.value = noteText;
    
    try {
        await db.collection('voice_notes').add({
            userId: currentUserId,
            email: auth.currentUser.email,
            note: noteText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'New'
        });
        
        recognitionStatus.textContent = "Voice Note submitted successfully! Admin will review it.";
        voiceNoteOutput.value = noteText + "\n\n(Submitted successfully)";

    } catch (error) {
        console.error("Submission failed:", error);
        recognitionStatus.textContent = `Submission failed: ${error.message}`;
        voiceNoteOutput.value = noteText + "\n\n(Submission failed)";
    }
}

// Check for Web Speech API compatibility
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false; 
    recognition.interimResults = false;
    recognition.lang = 'ur-PK'; 

    recognition.onstart = function() {
        recognitionStatus.textContent = "Listening... Speak now!";
        startRecognitionBtn.classList.add('recording');
        voiceNoteOutput.style.display = 'block';
        voiceNoteOutput.value = '';
        submitVoiceNoteBtn.style.display = 'none'; 
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        voiceNoteOutput.value = transcript;
        recognitionStatus.textContent = "Finished. Processing submission...";
        
        // --- AUTO SUBMIT LOGIC ---
        if (transcript.length > 0) {
            setTimeout(() => {
                autoSubmitVoiceNote(transcript);
            }, 500); 
        } else {
             recognitionStatus.textContent = "No text captured. Tap again to retry.";
        }
    };

    recognition.onerror = function(event) {
        recognitionStatus.textContent = `Error: ${event.error}. Try reloading the page or check microphone permissions.`;
        startRecognitionBtn.classList.remove('recording');
    };

    recognition.onend = function() {
        startRecognitionBtn.classList.remove('recording');
        if (!voiceNoteOutput.value.includes("submitted successfully")) {
            if (voiceNoteOutput.value.length === 0) {
                recognitionStatus.textContent = "No voice detected. Tap again to try.";
            } else {
                recognitionStatus.textContent = "Finished processing. (Auto-submission attempted)";
            }
        }
    };
} else {
    recognitionStatus.textContent = "Speech Recognition not supported by this browser. Please use Chrome (HTTPS required).";
    startRecognitionBtn.disabled = true;
}

startRecognitionBtn.addEventListener('click', () => {
    if (!isLoggedIn) {
        alert("Please log in to submit a voice note.");
        return;
    }
    if (recognition) {
        try {
            voiceNoteOutput.value = "";
            recognitionStatus.textContent = "Starting...";
            recognition.start();
        } catch (e) {
            recognitionStatus.textContent = "Error starting recognition. Please check permissions.";
            console.error(e);
        }
    }
});

// ====================================================================
// SECTION H: SOCIAL AD IMPLEMENTATION (Dynamic & Timed, SEQUENTIAL)
// ====================================================================

let adInterval = null; 

/**
 * Helper function to show a brief notification (using alert for guaranteed pop-up).
 */
function showPopupNotification(message) {
    alert(message);
}

/**
 * Awards coins to the user's wallet using the dynamically set currentAdReward.
 */
async function awardSocialAdCoins(rewardAmount) {
    if (!isLoggedIn || !currentUserId || rewardAmount <= 0) {
        if (!isLoggedIn) {
            showPopupNotification("Login required to earn coins!");
        }
        return false;
    }
    
    const userRef = db.collection(USERS_COLLECTION).doc(currentUserId);

    try {
        // *** Coins are ADDED here (increment) ***
        await userRef.update({
            coins: firebase.firestore.FieldValue.increment(rewardAmount)
        });
        
        // Show pop up on screen
        showPopupNotification(`🎉 Coins Added Successfully! ${rewardAmount.toLocaleString()} Coins have been added to your wallet.`);
        
        console.log(`COIN AWARD SUCCESS: Added ${rewardAmount} coins to wallet.`);
        return true;
    } catch (error) {
        console.error("COIN AWARD ERROR: Failed to award social ad coins:", error);
        showPopupNotification("Critical Error: Failed to add coins to your wallet. Please check connection.");
        return false;
    }
}


function showSocialAd() {
    const adOverlay = document.getElementById('social-ad-overlay');
    
    // Check if we have active ads
    if (allAdsData && allAdsData.length > 0) {
        // Get the current ad data
        const adData = allAdsData[currentAdIndex];
        
        // Update modal content, which also sets currentAdReward and updates the display
        updateSocialAdModal(adData);
        adOverlay.style.display = 'flex';
        
        // Move to the next ad index for the next interval
        currentAdIndex = (currentAdIndex + 1) % allAdsData.length;
    } else {
        // If no ads, just hide the modal
        hideSocialAd();
    }
}

function hideSocialAd() {
    const adOverlay = document.getElementById('social-ad-overlay');
    if (adOverlay) {
        adOverlay.style.display = 'none';
    }
}

function startAdInterval() {
    if (adInterval) {
        clearInterval(adInterval);
    }
    // Start the interval to show the next sequential ad every 5 seconds
    adInterval = setInterval(showSocialAd, SOCIAL_AD_REFRESH_RATE);
}

// Function to handle interaction (clicking link/coins button) and restart interval
function handleAdInteraction(event) {
    // Check if the click originated from the clickable coins button/link
    if (event.target.closest('#social-ad-link')) {
        event.preventDefault();
        
        if (!isLoggedIn) {
            showPopupNotification("Please log in to claim coin rewards!");
            hideSocialAd();
            startAdInterval();
            return;
        }

        // 1. Award Coins ASYNC using the reward of the currently visible ad
        awardSocialAdCoins(currentAdReward); 
        
        // Get the URL from the currently visible ad link element
        const adLinkElement = document.getElementById('social-ad-link');
        const targetUrl = adLinkElement ? adLinkElement.href : '#';

        // 2. Open the link in a new tab
        if (targetUrl && targetUrl !== '#') {
             window.open(targetUrl, '_blank');
        } else {
             console.warn("Ad link not set or invalid.");
        }
    } else if (event.target.classList.contains('ad-close')) {
        event.preventDefault(); // Don't allow closing button to trigger coin reward
    }
    
    hideSocialAd();
    startAdInterval(); // Restart the cycle
}


// ====================================================================
// SECTION I: DOM INITIALIZATION AND EVENTS
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.mobile-footer .nav-link');
  const copyButton = document.getElementById('copy-referral-btn');
  const backButton = document.getElementById('back-button');
  
  if (copyButton) {
      copyButton.addEventListener('click', copyReferralLink);
  }

  history.replaceState({ page: 'home-content', title: 'Daily Tasks' }, 'Daily Tasks', '#home-content');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault(); 
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

  // --- SOCIAL AD EVENT LISTENERS ---
  const adCloseButton = document.querySelector('.ad-close');
  // Handle closing the ad
  if (adCloseButton) adCloseButton.addEventListener('click', (e) => {
      e.preventDefault();
      hideSocialAd(); 
      startAdInterval(); // Restart interval when closed
  }); 

  const socialAdLink = document.getElementById('social-ad-link');
  // Handle clicking the ad link/coins button
  if (socialAdLink) socialAdLink.addEventListener('click', handleAdInteraction); 
  // --- END SOCIAL AD EVENT LISTENERS ---


  // Initial data loading
  loadSocialAdSettings(); 
  loadCarouselSlides();
  loadAppDownloadLinks();
  
  // Initial UI Setup
  renderRewardTimeline(0, {}); 
  _internalUISwitch('home-content', 'Daily Tasks');
  updateWithdrawalLockStatus();
  checkFeatureLocks(); 
  
  // Start the perpetual social ad display loop
  startAdInterval();
});
/* ===== NEW LIVE FEED SCRIPT (ADD-ON ONLY) ===== */

(function(){

  const feedBox = document.getElementById("live-feed");
  if(!feedBox) return; // safety

  const methods = ["EasyPaisa","JazzCash","Bank"];
  const users = ["****34","****48","****44","****08","****94","****98","****31","****79"];

  function rand(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomAmount(){
    // MINIMUM 200 enforced
    return rand(200, 50000);
  }

  function timeAgo(){
    const t = ["Just now","1 min ago","2 min ago","5 min ago"];
    return t[rand(0, t.length-1)];
  }

  function createCard(){
    if(feedBox.children.length >= 6){
      feedBox.removeChild(feedBox.lastChild);
    }

    const div = document.createElement("div");
    div.style.cssText = `
      background:#020617;
      border-left:4px solid #22c55e;
      border-radius:8px;
      padding:10px;
      margin-bottom:8px;
      color:#fff;
      font-family:Arial,Helvetica,sans-serif;
    `;

    const method = methods[rand(0, methods.length-1)];
    const user = users[rand(0, users.length-1)];
    const amount = randomAmount();

    div.innerHTML = `
      <div style="font-weight:bold;">💳 ${method} (User ${user})</div>
      <div style="color:#22c55e;font-size:16px;">Rs ${amount.toLocaleString()}</div>
      <div style="font-size:11px;color:#94a3b8;">Completed • ${timeAgo()}</div>
    `;

    feedBox.prepend(div);
  }

  // initial load
  for(let i=0;i<4;i++) createCard();

  // update every 3 seconds
  setInterval(createCard, 3000);

})();
