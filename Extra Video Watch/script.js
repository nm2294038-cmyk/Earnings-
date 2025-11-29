// ====================================================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ====================================================================
const firebaseConfig = {
    // !!! REPLACE THIS WITH YOUR ACTUAL API KEY !!!
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4", 
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
};
if (!firebase.apps.length) { 
    firebase.initializeApp(firebaseConfig); 
}

const auth = firebase.auth();
const db = firebase.firestore();

// Firebase Collections/Document IDs
const USERS_COLLECTION = 'users';
const SETTINGS_DOC_ID = 'multi_video_task';
const LINKS_COLLECTION = 'multi_video_links';
const LOCK_DOC_ID = 'task_lock_status';

// --- GLOBAL STATE ---
let currentUser = null;
let userWalletBalance = 0;
let userWatchCount = 0;
let gameActive = false;
let completedVideoCount = 0;
let videoTimers = {};
let videoLinks = [];
let currentVideoIndex = 0;
let isTaskLocked = true;

let settings = {
    timerSeconds: 40,
    finalReward: 50000,
    cooldownSeconds: 60, // Not currently used in the provided logic, but kept for context
    totalIframes: 0
};

// --- DOM Elements ---
const walletDisplay = document.getElementById('wallet-display');
const startTaskBtn = document.getElementById('start-task-btn');
const videoGridContainer = document.getElementById('video-grid-container');
const taskInfo = document.getElementById('task-info');
const rewardInfo = document.getElementById('reward-info');
const userWatchStatus = document.getElementById('user-watch-status');
const authModalEl = document.getElementById('authModal');

// ====================================================================
// 1. AUTH & DATA LISTENERS
// ====================================================================
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        listenToUserData(user.uid);
        listenToTaskLockStatus();
        loadTaskSettingsAndLinks();
    } else {
        updateUIState(false);
    }
});

function listenToUserData(uid) {
    db.collection(USERS_COLLECTION).doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            userWalletBalance = data.coins || 0;
            userWatchCount = data.watchCount || 0;
        }
        updateUIState(true);
    });
}

function listenToTaskLockStatus() {
    db.collection('global_settings').doc(LOCK_DOC_ID).onSnapshot(doc => {
        isTaskLocked = doc.exists ? doc.data().isLocked : true;
        updateUIState(true);
    });
}

async function loadTaskSettingsAndLinks() {
    try {
        const settingsDoc = await db.collection('global_settings').doc(SETTINGS_DOC_ID).get();
        if (settingsDoc.exists) {
            settings = { ...settings, ...settingsDoc.data() };
        }

        const linksSnapshot = await db.collection(LINKS_COLLECTION).orderBy('index', 'asc').get();
        videoLinks = linksSnapshot.docs.map(doc => doc.data().url);
        settings.totalIframes = videoLinks.length;
        
        updateUIState(true);
    } catch (e) {
        console.error("Settings load error:", e);
        taskInfo.textContent = "Error loading task settings. Check Firebase Rules.";
    }
}

function updateUIState(isLoggedIn) {
    walletDisplay.textContent = `Wallet: ${userWalletBalance.toLocaleString()} Coins`;
    userWatchStatus.textContent = `Your Current Watch Count: ${userWatchCount}`;
    
    if (isLoggedIn) {
        rewardInfo.textContent = `Watch ${settings.totalIframes} videos for ${settings.timerSeconds} seconds each to earn ${settings.finalReward.toLocaleString()} Coins!`;
        
        if (gameActive) {
            startTaskBtn.disabled = true;
            taskInfo.textContent = `Task Running: ${completedVideoCount} / ${settings.totalIframes} videos completed.`;
        } else if (isTaskLocked) {
            startTaskBtn.disabled = true;
            startTaskBtn.textContent = "Task Locked by Admin";
            taskInfo.textContent = "The task is currently locked. Please wait.";
        } else if (settings.totalIframes === 0) {
            startTaskBtn.disabled = true;
            startTaskBtn.textContent = "No Videos Available";
            taskInfo.textContent = "Admin has not added any videos yet.";
        } else {
            startTaskBtn.disabled = false;
            startTaskBtn.textContent = "Start Auto-Play Task";
            taskInfo.textContent = "Click 'Start Task' to begin earning.";
        }
    } else {
        startTaskBtn.disabled = true;
        startTaskBtn.textContent = "Start Auto-Play Task";
        taskInfo.textContent = "Please Login to start the Multi-Video Task.";
        userWatchStatus.textContent = `Your Current Watch Count: 0`;
    }
}

// ====================================================================
// 2. SEQUENTIAL AUTO-PLAY LOGIC
// ====================================================================

startTaskBtn.onclick = () => {
    if (!currentUser || gameActive || isTaskLocked || settings.totalIframes === 0) return;
    gameActive = true;
    completedVideoCount = 0;
    currentVideoIndex = 0;
    updateUIState(true);
    
    createVideoPlayers();
    setTimeout(() => startNextVideo(), 1000);
};

function getYouTubeEmbedUrl(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    const videoId = match ? match[1] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0` : null;
}

function createVideoPlayers() {
    videoGridContainer.innerHTML = '';
    for (let i = 0; i < settings.totalIframes; i++) {
        const playerItem = document.createElement('div');
        playerItem.className = 'video-player-item';
        playerItem.id = `player-item-${i}`;
        playerItem.innerHTML = `
            <div class="video-container">
                <iframe id="video-iframe-${i}" src="about:blank" allow="autoplay; encrypted-media"></iframe>
            </div>
            <div id="timer-msg-${i}" class="timer-message">Video ${i + 1}: Waiting to start...</div>
            <div id="overlay-${i}" class="video-overlay waiting">
                <i class="fas fa-lock"></i>
                <span>Waiting for Video ${i + 1} to start</span>
            </div>
        `;
        videoGridContainer.appendChild(playerItem);
    }
}

function startNextVideo() {
    if (currentVideoIndex >= settings.totalIframes) {
        awardRewardAndReset();
        return;
    }

    const index = currentVideoIndex;
    const embedUrl = getYouTubeEmbedUrl(videoLinks[index]);
    
    if (!embedUrl) {
        console.error(`Link ${index + 1} is invalid. Skipping.`);
        currentVideoIndex++;
        startNextVideo();
        return;
    }

    const iframe = document.getElementById(`video-iframe-${index}`);
    const timerMsgElement = document.getElementById(`timer-msg-${index}`);
    const overlay = document.getElementById(`overlay-${index}`);

    timerMsgElement.classList.add('active');
    
    // Load the video and start autoplay
    iframe.src = embedUrl;
    overlay.classList.add('hidden');

    let remainingTime = settings.timerSeconds;
    
    const countdownInterval = setInterval(() => {
        remainingTime--;
        timerMsgElement.textContent = `Video ${index + 1}: ACTIVE - ${remainingTime}s remaining...`;
        
        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            handleVideoCompletion(index);
        }
    }, 1000);
    
    videoTimers[index] = countdownInterval;
}

function handleVideoCompletion(index) {
    completedVideoCount++;
    
    const timerMsgElement = document.getElementById(`timer-msg-${index}`);
    const overlay = document.getElementById(`overlay-${index}`);
    
    timerMsgElement.textContent = `Video ${index + 1}: ✅ Completed!`;
    timerMsgElement.classList.remove('active');
    timerMsgElement.classList.add('completed');
    
    overlay.style.background = 'rgba(46, 204, 113, 0.8)';
    overlay.innerHTML = '<i class="fas fa-check-circle"></i><span>Completed</span>';
    overlay.classList.remove('hidden', 'waiting');

    updateUIState(true);

    currentVideoIndex++;
    if (currentVideoIndex < settings.totalIframes) {
        // Prepare next video for immediate start
        const nextOverlay = document.getElementById(`overlay-${currentVideoIndex}`);
        if (nextOverlay) {
             nextOverlay.classList.remove('waiting');
             nextOverlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Starting Next Video...</span>';
        }
        setTimeout(() => startNextVideo(), 1500); // Small delay before starting the next video
    } else {
        awardRewardAndReset();
    }
}

async function awardRewardAndReset() {
    alert(`Congratulations! You've earned ${settings.finalReward.toLocaleString()} coins!`);
    const userRef = db.collection(USERS_COLLECTION).doc(currentUser.uid);
    // Use transaction for safe coin update and resetting watchCount
    await db.runTransaction(async t => {
        const doc = await t.get(userRef);
        const newCoins = (doc.data().coins || 0) + settings.finalReward;
        t.update(userRef, { coins: newCoins, watchCount: 0 }); 
    });
    resetGame();
}

function resetGame() {
    gameActive = false;
    videoGridContainer.innerHTML = '';
    Object.values(videoTimers).forEach(clearInterval);
    videoTimers = {};
    updateUIState(true);
}

// ====================================================================
// 3. AUTH MODAL FUNCTIONS (Global Functions)
// ====================================================================
        
window.showAuthModal = (mode) => {
    const authContent = document.getElementById('authContent');
    const profileContent = document.getElementById('profileContent');
    const modalTitle = document.getElementById('modalTitle');
    
    authModalEl.style.display = 'flex';
    
    if (mode === 'profile') {
        modalTitle.textContent = 'Profile';
        authContent.style.display = 'none';
        profileContent.style.display = 'block';
        document.getElementById('auth-status').textContent = `Logged in as: ${currentUser.email}`;
    } else {
        authContent.style.display = 'block';
        profileContent.style.display = 'none';
        authContent.dataset.mode = mode;
        modalTitle.textContent = mode === 'login' ? 'Login' : 'Sign Up';
        document.getElementById('authName').style.display = mode === 'signup' ? 'block' : 'none';
        document.getElementById('authSubmitButton').textContent = mode === 'login' ? 'Login' : 'Sign Up';
        document.getElementById('toggleAuth').innerHTML = mode === 'login' ? 'Need an account? <a>Sign Up</a>' : 'Already have an account? <a>Login</a>';
    }
}

window.closeAuthModal = () => authModalEl.style.display = 'none';
window.toggleAuthMode = () => window.showAuthModal(document.getElementById('authContent').dataset.mode === 'login' ? 'signup' : 'login');

window.submitAuthForm = async () => {
    const [name, email, password, mode] = [
        document.getElementById('authName').value,
        document.getElementById('authEmail').value,
        document.getElementById('authPassword').value,
        document.getElementById('authContent').dataset.mode
    ];
    try {
        if (mode === 'signup') {
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            // Initialize user data in Firestore
            await db.collection(USERS_COLLECTION).doc(cred.user.uid).set({ email: email, name: name, coins: 0, watchCount: 0, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }
        closeAuthModal();
    } catch (error) {
        alert("Auth Failed: " + error.message);
    }
};

window.logoutUser = () => auth.signOut();
