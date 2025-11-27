// ====================================================================
// 1. FIREBASE CONFIGURATION & CORE LOGIC
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

// <<<<< YEH LINE MISSING THI AUR ADD KI GAYI HAI >>>>>
// Is line se Firebase shuru hota hai.
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// --- CONSTANTS & DEFAULTS ---
const FALLBACK_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const USER_COLLECTION = 'users';
const LINKS_COLLECTION = 'video_links'; 
const SETTINGS_DOC_ID = 'global_video_settings';
let MAX_TASKS_PER_24H = 50; 

// Ab yeh lines sahi kaam karengi
const auth = firebase.auth();
const db = firebase.firestore();

// --- GLOBAL STATE ---
window.currentUser = null;
let userWalletBalance = 0;
let gameActive = false;
let completedVideoCount = 0;
let cooldownTimer = 0; 
let cooldownInterval = null; 
let currentVideoLink = FALLBACK_URL;
let videoTimers = {}; 

let settings = {
    totalIframes: 10,
    timerSeconds: 40,
    finalReward: 500,
    cooldownSeconds: 60,
    taskCount: 0,
};

// --- DOM ELEMENTS ---
const startButton = document.getElementById('start-button');
const videoLoaderWrapper = document.getElementById('video-loader-wrapper');
const videoTaskContainer = document.getElementById('iframe-container');
const walletDisplay = document.getElementById('wallet-display');
const infoMessage = document.getElementById('info-message');
const authModalEl = document.getElementById('authModal');
const profileBalanceDisplay = document.getElementById('profile-wallet-balance');
const dynamicRewardInfo = document.getElementById('dynamic-reward-info');


// ====================================================================
// 2. AUTHENTICATION & DATA LISTENERS
// ====================================================================
auth.onAuthStateChanged(user => {
    window.currentUser = user;
    if (user) {
        document.getElementById('auth-status').textContent = `Logged in as: ${user.email}`;
        fetchDynamicSettingsAndLinks().then(() => {
            listenToWallet(user.uid);
        });
    } else {
        userWalletBalance = 0;
        updateUIState(false);
        closeAuthModal();
    }
});

async function fetchDynamicSettingsAndLinks() {
    try {
        const settingsDoc = await db.collection('global_settings').doc(SETTINGS_DOC_ID).get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            settings.totalIframes = data.totalIframes || settings.totalIframes;
            settings.timerSeconds = data.timerSeconds || settings.timerSeconds;
            settings.finalReward = data.finalReward || settings.finalReward;
            settings.cooldownSeconds = data.cooldownSeconds || settings.cooldownSeconds;
            MAX_TASKS_PER_24H = data.maxTasksPer24h || MAX_TASKS_PER_24H;
        }
        
        const linksSnapshot = await db.collection(LINKS_COLLECTION).orderBy('createdAt', 'asc').limit(1).get();
        if (!linksSnapshot.empty && linksSnapshot.docs[0].data().url) {
            currentVideoLink = linksSnapshot.docs[0].data().url;
        }
    } catch (e) {
        console.error("Failed to load settings from Firestore. Check Firebase Rules.", e);
        alert("Could not load task settings. Please try again later.");
    }
}

function listenToWallet(uid) {
    db.collection(USER_COLLECTION).doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            userWalletBalance = data.coins || 0;
            const now = new Date();
            let lastDate = data.lastTaskDate ? data.lastTaskDate.toDate() : null;
            settings.taskCount = data.taskCount || 0;

            if (lastDate && (now.getTime() - lastDate.getTime() > 24 * 60 * 60 * 1000)) {
                settings.taskCount = 0;
            }
        } else {
            db.collection(USER_COLLECTION).doc(uid).set({ coins: 0, taskCount: 0, lastTaskDate: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        }
        updateUIState(true);
    });
}

function updateUIState(isLoggedIn) {
    walletDisplay.textContent = `Wallet: ${userWalletBalance.toLocaleString()} Coins`;
    profileBalanceDisplay.textContent = `${userWalletBalance.toLocaleString()} Coins`;
    dynamicRewardInfo.textContent = `Watch ${settings.totalIframes} video(s) (${settings.timerSeconds}s each) to Earn ${settings.finalReward.toLocaleString()} Coins!`;
    let remainingTasks = MAX_TASKS_PER_24H - settings.taskCount;

    if (isLoggedIn) {
        if (remainingTasks <= 0) {
            startButton.disabled = true;
            startButton.textContent = `Limit Reached`;
            infoMessage.textContent = `Daily limit reached.`;
        } else if (gameActive) {
            startButton.disabled = true;
            infoMessage.textContent = `Task Running: ${completedVideoCount}/${settings.totalIframes}`;
        } else if (cooldownTimer > 0) {
            startButton.disabled = true;
            const m = Math.floor(cooldownTimer / 60), s = cooldownTimer % 60;
            startButton.textContent = `Cooldown: ${m > 0 ? `${m}m ` : ''}${s}s`;
            infoMessage.textContent = `Wait for next task.`;
        } else {
            startButton.disabled = false;
            startButton.textContent = `Start Task (${remainingTasks} left)`;
            infoMessage.textContent = `Tasks remaining: ${remainingTasks}.`;
        }
    } else {
        startButton.disabled = true;
        startButton.textContent = `Start Video Task`;
        infoMessage.textContent = 'Please Login to start.';
    }
}

function startCooldown() {
    cooldownTimer = settings.cooldownSeconds;
    if (cooldownInterval) clearInterval(cooldownInterval);
    cooldownInterval = setInterval(() => {
        cooldownTimer--;
        updateUIState(true);
        if (cooldownTimer <= 0) clearInterval(cooldownInterval);
    }, 1000);
}

// ====================================================================
// 3. VIDEO TASK LOGIC
// ====================================================================

function getYouTubeEmbedUrl(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3` : null;
}

window.handleStartTask = function() {
    if (!window.currentUser || gameActive || cooldownTimer > 0 || settings.taskCount >= MAX_TASKS_PER_24H) return;
    gameActive = true;
    completedVideoCount = 0;
    updateUIState(true);
    videoLoaderWrapper.style.display = 'block';
    createVideoPlayers();
};

function createVideoPlayers() {
    videoTaskContainer.innerHTML = '';
    const embedUrl = getYouTubeEmbedUrl(currentVideoLink);
    if (!embedUrl) {
        alert("Invalid YouTube video link from admin.");
        resetGame(); return;
    }

    for (let i = 0; i < settings.totalIframes; i++) {
        const playerItem = document.createElement('div');
        playerItem.className = 'video-player-item';
        playerItem.innerHTML = `
            <div class="video-container">
                <iframe id="video-iframe-${i}" src="about:blank" allow="autoplay; encrypted-media"></iframe>
            </div>
            <div id="timer-msg-${i}" class="timer-message">Watch for ${settings.timerSeconds} seconds</div>
            <div class="video-overlay" onclick="startVideoAndTimer(this, ${i}, '${embedUrl}')">
                <i class="fas fa-play-circle"></i>
                <span>Click to Watch</span>
            </div>
        `;
        videoTaskContainer.appendChild(playerItem);
    }
}

function startVideoAndTimer(overlay, index, url) {
    overlay.onclick = null;
    overlay.style.cursor = 'default';
    document.getElementById(`video-iframe-${index}`).src = url;
    overlay.classList.add('hidden');

    let remainingTime = settings.timerSeconds;
    const timerMsgElement = document.getElementById(`timer-msg-${index}`);
    
    const countdownInterval = setInterval(() => {
        remainingTime--;
        timerMsgElement.textContent = `Timer: ${remainingTime}s remaining...`;
        
        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            handleVideoCompletion(index);
        }
    }, 1000);
}

function handleVideoCompletion(index) {
    completedVideoCount++;
    const playerItem = document.getElementById(`video-iframe-${index}`).closest('.video-player-item');
    const timerMsgElement = playerItem.querySelector('.timer-message');
    timerMsgElement.textContent = '✅ Completed!';
    timerMsgElement.classList.add('completed');
    
    const overlay = playerItem.querySelector('.video-overlay');
    overlay.style.background = 'rgba(46, 204, 113, 0.8)';
    overlay.innerHTML = '<i class="fas fa-check-circle"></i><span>Completed</span>';
    overlay.classList.remove('hidden');

    updateUIState(true);

    if (completedVideoCount === settings.totalIframes) {
        awardRewardAndReset();
    }
}

async function awardRewardAndReset() {
    alert(`Congratulations! You've earned ${settings.finalReward} coins!`);
    const userRef = db.collection(USER_COLLECTION).doc(window.currentUser.uid);
    await db.runTransaction(async t => {
        const doc = await t.get(userRef);
        const newCoins = (doc.data().coins || 0) + settings.finalReward;
        const newTaskCount = (doc.data().taskCount || 0) + 1;
        t.update(userRef, { coins: newCoins, taskCount: newTaskCount, lastTaskDate: firebase.firestore.FieldValue.serverTimestamp() });
    });
    resetGame();
    startCooldown();
}

function resetGame() {
    gameActive = false;
    videoLoaderWrapper.style.display = 'none';
    videoTaskContainer.innerHTML = '';
    Object.values(videoTimers).forEach(clearTimeout);
    videoTimers = {};
    updateUIState(true);
}

// ====================================================================
// 4. AUTH MODAL FUNCTIONS
// ====================================================================
window.showAuthModal = function(mode) {
    authModalEl.style.display = 'flex';
    const authContent = document.getElementById('authContent');
    const profileContent = document.getElementById('profileContent');
    const isProfile = mode === 'profile';
    document.getElementById('modalTitle').textContent = isProfile ? 'User Profile' : (mode === 'login' ? 'Login' : 'Sign Up');
    authContent.style.display = isProfile ? 'none' : 'block';
    profileContent.style.display = isProfile ? 'block' : 'none';
    authContent.dataset.mode = mode;
    document.getElementById('authName').style.display = mode === 'signup' ? 'block' : 'none';
    document.getElementById('authSubmitButton').textContent = mode === 'login' ? 'Login' : 'Sign Up';
    document.getElementById('toggleAuth').innerHTML = mode === 'login' ? 'Need an account? <a>Sign Up</a>' : 'Already have an account? <a>Login</a>';
};

window.closeAuthModal = () => authModalEl.style.display = 'none';
window.toggleAuthMode = () => showAuthModal(document.getElementById('authContent').dataset.mode === 'login' ? 'signup' : 'login');

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
            await db.collection(USER_COLLECTION).doc(cred.user.uid).set({ email, name, coins: 0, taskCount: 0, lastTaskDate: firebase.firestore.FieldValue.serverTimestamp() });
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }
        closeAuthModal();
    } catch (error) {
        alert("Auth Failed: " + error.message);
    }
};

window.logoutUser = () => auth.signOut();
