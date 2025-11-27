// ====================================================================
// 6. FIREBASE & CORE LOGIC
// ====================================================================

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
};

// TARGET URL & REWARD SETTINGS (DEFAULTS)
const FALLBACK_URL = "https://toolswebsite205.blogspot.com";
const USER_COLLECTION = 'users';
const EARNINGS_COLLECTION = 'worker_earnings'; 
const LINKS_COLLECTION = 'iframe_links'; 
const SETTINGS_DOC_ID = 'global_iframe_settings'; 
const MAX_TASKS_PER_24H = 50; // Max tasks per user per 24 hours

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}
const auth = firebase.auth();
const db = firebase.firestore();

// --- GLOBAL STATE ---
window.currentUser = null;
let userWalletBalance = 0;
let gameActive = false;
let completedIframeCount = 0;
let cooldownTimer = 0; 
let cooldownInterval = null; 
let currentIframeLinks = []; 

// Dynamic Settings (Fetched from Admin Panel)
let settings = {
    totalIframes: 50,
    timerSeconds: 40,
    finalReward: 500,
    cooldownSeconds: 60,
    taskCount: 0,
    lastTaskDate: null,
};

// --- DOM ELEMENTS ---
const walletDisplay = document.getElementById('wallet-display');
const infoMessage = document.getElementById('info-message');
const startButton = document.getElementById('start-button');
const iframeLoaderWrapper = document.getElementById('iframe-loader-wrapper');
const iframeContainer = document.getElementById('iframe-container');
const authModalEl = document.getElementById('authModal');
const profileBalanceDisplay = document.getElementById('profile-wallet-balance');
const dynamicRewardInfo = document.getElementById('dynamic-reward-info');


// ====================================================================
// 7. AUTHENTICATION & WALLET LISTENERS
// ====================================================================

auth.onAuthStateChanged(user => {
    window.currentUser = user;
    if (user) {
        document.getElementById('auth-status').textContent = `Logged in as: ${user.email}`;
        listenToWallet(user.uid);
        fetchDynamicSettingsAndLinks(); 
    } else {
        userWalletBalance = 0;
        walletDisplay.textContent = 'Wallet: 0 Coins';
        updateUIState(false);
        closeAuthModal();
    }
});

// --- FETCH USER STATS AND RESET COUNT IF 24H PASSED ---
function resetTaskCountIfNeeded(userData) {
    const now = new Date();
    let lastDate = userData.lastTaskDate ? userData.lastTaskDate.toDate() : null;
    let currentCount = userData.taskCount || 0;

    if (lastDate && (now.getTime() - lastDate.getTime() > 24 * 60 * 60 * 1000)) {
        currentCount = 0;
        lastDate = firebase.firestore.FieldValue.serverTimestamp();
    }
    
    settings.taskCount = currentCount;
    settings.lastTaskDate = lastDate;
}


async function fetchDynamicSettingsAndLinks() {
    // 1. Fetch Settings
    try {
        const settingsDoc = await db.collection('global_settings').doc(SETTINGS_DOC_ID).get();
        if (settingsDoc.exists) {
            const data = settingsDoc.data();
            settings.totalIframes = data.totalIframes || settings.totalIframes;
            settings.timerSeconds = data.timerSeconds || settings.timerSeconds;
            settings.finalReward = data.finalReward || settings.finalReward;
            settings.cooldownSeconds = data.cooldownSeconds || settings.cooldownSeconds;
        }
    } catch (e) {
        console.error("Failed to load settings.");
    }

    // 2. Fetch Links
    try {
        const linksSnapshot = await db.collection(LINKS_COLLECTION).get();
        currentIframeLinks = [];
        linksSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.url) currentIframeLinks.push(data.url);
        });
        
        if (currentIframeLinks.length === 0) {
            currentIframeLinks = [FALLBACK_URL];
        }
    } catch (e) {
        console.error("Failed to load links.");
        currentIframeLinks = [FALLBACK_URL];
    }
    
    updateUIState(true); 
}


function listenToWallet(uid) {
    db.collection(USER_COLLECTION).doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            userWalletBalance = data.coins || 0;
            resetTaskCountIfNeeded(data); 
        } else {
            // Ensure taskCount is initialized for new users
            db.collection(USER_COLLECTION).doc(uid).set({ coins: 0, taskCount: 0, lastTaskDate: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            userWalletBalance = 0;
        }
        updateUIState(true);
    });
}

// --- UI State Management ---
function updateUIState(isLoggedIn) {
    // Update reward text dynamically
    dynamicRewardInfo.textContent = `Complete ${settings.totalIframes} IFRAME Task to Earn ${settings.finalReward.toLocaleString()} Coins!`;
    
    let remainingTasks = MAX_TASKS_PER_24H - settings.taskCount;
    
    if (isLoggedIn && remainingTasks <= 0) {
         startButton.disabled = true;
         startButton.textContent = `Limit Reached (${MAX_TASKS_PER_24H} / 24h)`;
         infoMessage.textContent = `You have reached the limit of ${MAX_TASKS_PER_24H} tasks for today.`;
    }
    else if (isLoggedIn && !gameActive && cooldownTimer === 0) {
        startButton.disabled = false;
        startButton.textContent = `Start Task (${remainingTasks} remaining)`;
        infoMessage.textContent = `Wallet: ${userWalletBalance.toLocaleString()} Coins. Tasks remaining today: ${remainingTasks}.`;
    } else if (isLoggedIn && cooldownTimer > 0) {
        startButton.disabled = true;
        const minutes = Math.floor(cooldownTimer / 60);
        const seconds = cooldownTimer % 60;
        const timeStr = (minutes > 0 ? `${minutes}m ` : '') + `${seconds}s`;

        startButton.textContent = `Cooldown: ${timeStr}`;
        infoMessage.textContent = `Task completed. Wait ${timeStr} before starting again.`;
    } else if (isLoggedIn && gameActive) {
        startButton.disabled = true;
        infoMessage.textContent = `Task Running: ${completedIframeCount} / ${settings.totalIframes} completed. DO NOT LEAVE.`;
    } else {
        startButton.disabled = true;
        startButton.textContent = `Start Task`;
        infoMessage.textContent = 'Please Login to start the task.';
    }
    walletDisplay.textContent = `Wallet: ${userWalletBalance.toLocaleString()} Coins`;
    profileBalanceDisplay.textContent = userWalletBalance.toLocaleString() + ' Coins';
}

// --- Cooldown Logic ---
function startCooldown() {
    cooldownTimer = settings.cooldownSeconds;
    updateUIState(true);
    
    if (cooldownInterval) clearInterval(cooldownInterval);

    cooldownInterval = setInterval(() => {
        cooldownTimer--;
        updateUIState(true);
        
        if (cooldownTimer <= 0) {
            clearInterval(cooldownInterval);
            cooldownTimer = 0;
            updateUIState(true);
        }
    }, 1000);
}

// ====================================================================
// 8. AUTHENTICATION FUNCTIONS
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
    document.getElementById('authSubmitButton').textContent = isProfile ? '---' : (mode === 'login' ? 'Login' : 'Sign Up');
    document.getElementById('toggleAuth').innerHTML = mode === 'login' ? 'Need an account? <a>Sign Up</a>' : 'Already have an account? <a>Login</a>';
};

window.closeAuthModal = function() { document.getElementById('authModal').style.display = 'none'; };

window.toggleAuthMode = function() {
    const authContent = document.getElementById('authContent');
    const currentMode = authContent.dataset.mode;
    const newMode = currentMode === 'login' ? 'signup' : 'login';
    window.showAuthModal(newMode);
};

window.submitAuthForm = async function() {
    const name = document.getElementById('authName').value;
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const mode = document.getElementById('authContent').dataset.mode;

    try {
        if (mode === 'signup') {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await db.collection(USER_COLLECTION).doc(userCredential.user.uid).set({ coins: 0, email: email, name: name, taskCount: 0, lastTaskDate: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }
    } catch (error) {
        alert("Auth Failed: " + error.message);
    }
};

window.logoutUser = () => auth.signOut();


// ====================================================================
// 9. IFRAME LOADER SETUP & GAME LOGIC
// ====================================================================

window.handleStartTask = async function() {
    if (!window.currentUser) return;
    
    // Final Limit Check (UI state should already prevent this, but check again)
    if (settings.taskCount >= MAX_TASKS_PER_24H) {
        alert(`Limit Reached! You have completed ${MAX_TASKS_PER_24H} tasks in the last 24 hours.`);
        return;
    }
    
    if (gameActive || cooldownTimer > 0) return;
    if (currentIframeLinks.length === 0) {
         alert("Links are not loaded yet. Please wait a moment or check Admin settings.");
         return;
    }

    if (confirm(`Starting the ${settings.totalIframes} IFRAME task. Reward: ${settings.finalReward.toLocaleString()} Coins. Do not leave the page!`)) {
        await updateTaskCountOnStart(); // Update count in DB immediately
        startGameSession();
    }
};

async function updateTaskCountOnStart() {
    const userRef = db.collection(USER_COLLECTION).doc(window.currentUser.uid);
    
    try {
        // Increment task count and update last task date
        await userRef.update({
            taskCount: firebase.firestore.FieldValue.increment(1),
            lastTaskDate: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Failed to update task count:", error);
        alert("Error updating task count. Please refresh.");
        throw new Error("Task count update failed.");
    }
}


function startGameSession() {
    gameActive = true;
    completedIframeCount = 0;
    startButton.disabled = true;
    iframeLoaderWrapper.style.display = 'block';
    iframeContainer.innerHTML = '';
    
    logEarning("Timer Task Start", 0, `${settings.totalIframes} Iframe Timer Task initiated`);

    setupIframeLoader();
    setupForfeitLock();
    updateUIState(true);
}

function setupIframeLoader() {
    if (window.iframeIntervals) {
        window.iframeIntervals.forEach(clearInterval);
    }
    window.iframeIntervals = [];

    for (let i = 0; i < settings.totalIframes; i++) {
        const url = currentIframeLinks[i % currentIframeLinks.length];
        startIframe(i, url);
    }
}

function startIframe(index, url) {
    const item = document.createElement("div");
    item.className = "iframe-item";
    item.dataset.id = index;

    const header = document.createElement("div");
    header.className = "iframe-header";

    const lbl = document.createElement("span");
    lbl.className = "iframe-number-label";
    lbl.textContent = `IFrame ${index + 1}`;

    const timerLbl = document.createElement("span");
    timerLbl.className = "iframe-timer-label";
    timerLbl.textContent = `Time: ${settings.timerSeconds}s`;

    header.append(lbl, timerLbl);

    const iframe = document.createElement("iframe");
    iframe.className = "actual-iframe";
    iframe.src = url + (url.includes("?") ? "&" : "?") + "rnd=" + Math.random(); 

    item.append(header, iframe);
    iframeContainer.append(item);

    let secondsLeft = settings.timerSeconds;
    
    // Timer logic
    const timerInterval = setInterval(() => {
        secondsLeft--;
        timerLbl.textContent = `Time: ${secondsLeft}s`;

        if (secondsLeft <= 0) {
            clearInterval(timerInterval);
            item.classList.add('complete');
            timerLbl.textContent = 'COMPLETE';
            
            if (!item.dataset.completed) {
                 item.dataset.completed = true;
                 handleIframeCompletion();
            }
        }
    }, 1000);

    // Store interval for cleanup
    window.iframeIntervals.push(timerInterval);
}

function handleIframeCompletion() {
    completedIframeCount++;
    updateUIState(true); 
    
    if (completedIframeCount === settings.totalIframes) {
        completeTaskAndReward();
    }
}

async function completeTaskAndReward() {
    gameActive = false;
    
    // Clear all intervals to stop timers
    if (window.iframeIntervals) {
        window.iframeIntervals.forEach(clearInterval);
    }

    // 1. Reward Coins
    await db.collection(USER_COLLECTION).doc(window.currentUser.uid).update({
        coins: firebase.firestore.FieldValue.increment(settings.finalReward)
    });
    
    // 2. Log Reward
    await logEarning("Timer Task Complete", settings.finalReward, `${settings.totalIframes} Iframe Timer Task completed.`);
    
    infoMessage.textContent = `TASK COMPLETE! Earned ${settings.finalReward.toLocaleString()} Coins!`;
    alert(`Mubarak! You completed the task and earned ${settings.finalReward.toLocaleString()} Coins!`);
    
    // Disable and hide iframe section
    iframeLoaderWrapper.style.display = 'none';
    window.removeEventListener('popstate', handleForfeit);
    
    // Start cooldown
    startCooldown();
}

async function logEarning(source, amount, reference) {
    if (!window.currentUser) return;
    await db.collection(EARNINGS_COLLECTION).add({
        userId: window.currentUser.uid,
        email: window.currentUser.email,
        amount: amount,
        source: source,
        reference: reference,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// --- 9. FORFEIT LOCK ---

function handleForfeit(event) {
    if (gameActive && window.currentUser) {
        const confirmForfeit = confirm("WARNING: If you leave this page, the current task will be CANCELED, and you will lose the reward. Are you sure?");
        
        if (confirmForfeit) {
            logEarning("Task Canceled", 0, "Task abandoned by user.");
            gameActive = false;
            iframeLoaderWrapper.style.display = 'none';
            updateUIState(true);
            startCooldown(); 
        } else {
            // Re-push state to block navigation
            window.history.pushState(null, null, window.location.href);
        }
    }
}

function setupForfeitLock() {
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', handleForfeit);
}

// --- 10. INITIAL SETUP ---

document.addEventListener('DOMContentLoaded', () => {
    setupForfeitLock(); 
});
