// ====================================================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
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
const LINKS_COLLECTION = 'multi_video_links'; // Keeping the name for backward compatibility
const LOCK_DOC_ID = 'task_lock_status';       
const SETTINGS_DOC_ID = 'multi_video_task';   
const USERS_COLLECTION = 'users';             
const EARNINGS_HISTORY_COLLECTION = 'earnings_history';

// --- GLOBAL STATE ---
let currentUser = null;
let allTaskLinks = []; 
let currentTaskIndex = 0; 
let taskTimerSeconds = 40; 
let finalRewardAmount = 50000; 
let timerInterval;
let isTaskLocked = true; 
let userCoins = 0;
let isUserTaskCompleted = false;
let isTransitioning = false; 

// --- DOM Elements ---
const authUI = document.getElementById('auth-ui');
const authTitle = document.getElementById('auth-title');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const mainContent = document.getElementById('main-content');
const userInfoDisplay = document.getElementById('user-info');
const userCoinsDisplay = document.getElementById('user-coins');
const authButton = document.getElementById('authButton');

const taskLockedMessage = document.getElementById('task-locked-message');
const taskCompletedMessage = document.getElementById('task-completed-message');
const websiteTaskUI = document.getElementById('website-task-ui'); 
const websiteViewer = document.getElementById('website-viewer'); 
const currentWebsiteIndexSpan = document.getElementById('current-website-index'); 
const totalWebsitesSpan = document.getElementById('total-websites'); 
const websiteTimerProgress = document.getElementById('website-timer-progress'); 
const timerDisplay = document.getElementById('timer-display');
const nextWebsiteButton = document.getElementById('next-website-button'); 
const finalRewardDisplay = document.getElementById('final-reward-display');

// ====================================================================
// 2. USER AUTHENTICATION
// ====================================================================

auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        userInfoDisplay.textContent = `Logged in as: ${user.email}`;
        authButton.textContent = 'Logout';
        authUI.style.display = 'none';
        mainContent.style.display = 'block';
        loadUserData(); 
        loadGlobalData(); 
    } else {
        userInfoDisplay.textContent = 'Guest';
        userCoinsDisplay.innerHTML = `<i class="fas fa-coins me-1"></i>0`;
        authButton.textContent = 'Login';
        mainContent.style.display = 'none';
        authUI.style.display = 'block';
        
        allTaskLinks = [];
        currentTaskIndex = 0;
        userCoins = 0;
        isUserTaskCompleted = false;
        updateUI();
        clearInterval(timerInterval);
        websiteViewer.src = 'about:blank'; 
    }
});

function toggleAuthUI() {
    if (currentUser) {
        logoutUser();
    } else {
        authUI.style.display = authUI.style.display === 'none' ? 'block' : 'none';
        mainContent.style.display = 'none';
        authTitle.textContent = 'Login'; 
    }
}

async function loginUser() {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert("Login Failed: " + error.message);
    }
}

async function signupUser() {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await db.collection(USERS_COLLECTION).doc(userCredential.user.uid).set({
            email: email,
            coins: 0,
            currentTaskIndex: 0, 
            isTaskCompleted: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Account created and logged in!");
    } catch (error) {
        alert("Sign Up Failed: " + error.message);
    }
}

function logoutUser() {
    auth.signOut();
}

async function resetPassword() {
    const email = authEmailInput.value;
    if (!email) {
        alert("Please enter your email to reset password.");
        return;
    }
    try {
        await auth.sendPasswordResetEmail(email);
        alert("Password reset email sent to " + email);
    } catch (error) {
        alert("Password Reset Failed: " + error.message);
    }
}

// ====================================================================
// 3. DATA LOADING (User & Global)
// ====================================================================

async function loadGlobalData() {
    await loadTaskSettings();
    await loadTaskLinks(); 
    listenToTaskLockStatus(); 
}

async function loadUserData() {
    if (!currentUser) return;
    const userDoc = await db.collection(USERS_COLLECTION).doc(currentUser.uid).get();
    if (userDoc.exists) {
        const data = userDoc.data();
        userCoins = data.coins || 0;
        currentTaskIndex = data.currentTaskIndex || 0; 
        isUserTaskCompleted = data.isTaskCompleted || false;
    } else {
        await db.collection(USERS_COLLECTION).doc(currentUser.uid).set({
            email: currentUser.email,
            coins: 0,
            currentTaskIndex: 0, 
            isTaskCompleted: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        userCoins = 0;
        currentTaskIndex = 0;
        isUserTaskCompleted = false;
    }
    updateUI();
    if (!isUserTaskCompleted) { 
        displayCurrentTaskLink(); 
    }
}

async function loadTaskSettings() {
    try {
        const settingsDoc = await db.collection('global_settings').doc(SETTINGS_DOC_ID).get();
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            taskTimerSeconds = settings.timerSeconds || 40; 
            finalRewardAmount = settings.finalReward || 50000;
            finalRewardDisplay.textContent = finalRewardAmount.toLocaleString();
        }
    } catch (e) {
        console.error("Error loading task settings:", e);
    }
}

async function loadTaskLinks() { 
    try {
        const linksSnapshot = await db.collection(LINKS_COLLECTION).orderBy('index', 'asc').get();
        allTaskLinks = linksSnapshot.docs.map(doc => doc.data());
        allTaskLinks = allTaskLinks.filter(link => !link.url.includes('example.com/fill_me_website_slot_'));
        totalWebsitesSpan.textContent = allTaskLinks.length; 
        updateUI();
    } catch (e) {
        console.error("Error loading task links:", e);
        alert("Failed to load task links.");
    }
}

function listenToTaskLockStatus() {
    db.collection('global_settings').doc(LOCK_DOC_ID).onSnapshot(doc => {
        isTaskLocked = doc.exists ? doc.data().isLocked : true; 
        updateUI();
        if (isTaskLocked && timerInterval) {
            clearInterval(timerInterval); 
            websiteViewer.src = 'about:blank'; 
        }
    }, error => {
        console.error("Error listening to lock status:", error);
        isTaskLocked = true; 
        updateUI();
    });
}

// ====================================================================
// 4. UI & WEBSITE LOGIC
// ====================================================================

function updateUI() {
    if (!currentUser) {
        userCoinsDisplay.innerHTML = `<i class="fas fa-coins me-1"></i>0`;
        return;
    }

    userCoinsDisplay.innerHTML = `<i class="fas fa-coins me-1"></i>${userCoins.toLocaleString()}`;

    if (isTaskLocked) {
        taskLockedMessage.style.display = 'block';
        websiteTaskUI.style.display = 'none';
        taskCompletedMessage.style.display = 'none';
        websiteViewer.src = 'about:blank'; 
    } else if (isUserTaskCompleted) {
        taskCompletedMessage.style.display = 'block';
        websiteTaskUI.style.display = 'none';
        taskLockedMessage.style.display = 'none';
        websiteViewer.src = 'about:blank'; 
    } else {
        taskLockedMessage.style.display = 'none';
        taskCompletedMessage.style.display = 'none';
        websiteTaskUI.style.display = 'block'; 
        currentWebsiteIndexSpan.textContent = currentTaskIndex + 1; 
        totalWebsitesSpan.textContent = allTaskLinks.length;

        if (allTaskLinks.length > 0) {
             displayCurrentTaskLink();
        } else {
             websiteViewer.src = 'about:blank';
             timerDisplay.textContent = "No websites available yet.";
             nextWebsiteButton.disabled = true; 
        }
    }
}

function displayCurrentTaskLink() { 
    clearInterval(timerInterval); 

    if (!allTaskLinks || allTaskLinks.length === 0) {
        websiteViewer.src = 'about:blank';
        timerDisplay.textContent = "No websites available.";
        nextWebsiteButton.disabled = true;
        return;
    }

    if (currentTaskIndex >= allTaskLinks.length) {
        completeTask();
        return;
    }

    const link = allTaskLinks[currentTaskIndex];
    if (!link || !link.url) {
        console.error("Link at index", currentTaskIndex, "is missing URL.");
        currentTaskIndex++;
        saveUserProgress(); 
        displayCurrentTaskLink(); 
        return;
    }

    websiteViewer.src = link.url; 
    
    nextWebsiteButton.disabled = true; 
    startWebsiteTimer(taskTimerSeconds); 
    currentWebsiteIndexSpan.textContent = currentTaskIndex + 1;
}

function startWebsiteTimer(duration) { 
    let timeLeft = duration;
    timerDisplay.textContent = `Viewing: ${timeLeft}s remaining`;
    websiteTimerProgress.style.width = '100%';
    websiteTimerProgress.setAttribute('aria-valuenow', 100);

    nextWebsiteButton.disabled = true;

    clearInterval(timerInterval);
    timerInterval = setInterval(async () => {
        if (isTaskLocked || isUserTaskCompleted || !currentUser) { 
             clearInterval(timerInterval);
             websiteViewer.src = 'about:blank'; 
             timerDisplay.textContent = "Task interrupted.";
             return;
        }

        timeLeft--;
        const progress = (timeLeft / duration) * 100;
        websiteTimerProgress.style.width = `${progress}%`;
        websiteTimerProgress.setAttribute('aria-valuenow', progress);
        timerDisplay.textContent = `Viewing: ${timeLeft}s remaining`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = "Time's up! Loading next website...";
            websiteTimerProgress.style.width = '0%';
            
            if (!isTransitioning) {
                isTransitioning = true; 
                await nextWebsite();
                isTransitioning = false; 
            }
        }
    }, 1000);
}

async function nextWebsite() { 
    if (!currentUser) { 
        console.error("Attempted to advance task without a logged-in user.");
        return;
    }

    currentTaskIndex++;
    await saveUserProgress();

    if (currentTaskIndex < allTaskLinks.length) {
        displayCurrentTaskLink(); 
    } else {
        completeTask(); 
    }
}

async function completeTask() {
    if (isUserTaskCompleted) return; 

    isUserTaskCompleted = true;
    await db.collection(USERS_COLLECTION).doc(currentUser.uid).update({
        isTaskCompleted: true,
        coins: firebase.firestore.FieldValue.increment(finalRewardAmount),
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await db.collection(EARNINGS_HISTORY_COLLECTION).add({
        uid: currentUser.uid,
        email: currentUser.email,
        reward: finalRewardAmount,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        task: "multi_website_task_completion" 
    });

    userCoins += finalRewardAmount; 
    updateUI();
    alert(`Task Completed! You earned ${finalRewardAmount.toLocaleString()} coins!`);
}

async function refreshTask() {
    isUserTaskCompleted = false; 
    currentTaskIndex = 0;
    alert("Task UI refreshed. Your previous earnings are saved. To earn again, an admin needs to reset your task status.");
    await loadUserData(); 
    updateUI();
}

async function saveUserProgress() {
    if (!currentUser) return;
    try {
        await db.collection(USERS_COLLECTION).doc(currentUser.uid).update({
            currentTaskIndex: currentTaskIndex 
        });
    } catch (e) {
        console.error("Error saving user progress:", e);
    }
}
