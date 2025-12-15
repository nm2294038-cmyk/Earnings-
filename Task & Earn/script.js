// =========================================================================
// FIREBASE INITIALIZATION & CONFIGURATION
// =========================================================================

const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
    measurementId: "G-HJQ46RQNZS"
};

// --- INITIALIZE FIREBASE APP ---
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// --- FIREBASE SERVICES ---
const auth = firebase.auth();
const db = firebase.firestore();
const TASK_REWARD_SOURCE = 'Task'; 

// =========================================================================
// DOM ELEMENTS & INITIAL STATE
// =========================================================================

// --- DOM ELEMENTS ---
const articleSection = document.getElementById('articleSection');
const categoryMainSection = document.getElementById('categoryMainSection');
const taskMainSection = document.getElementById('taskMainSection');
const taskList = document.getElementById('taskList');
const profileIconButton = document.getElementById('profileIconButton');
const authModal = document.getElementById('authModal');
const successPopup = document.getElementById('successPopup');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const coinsBalanceDisplay = document.getElementById('coinsBalanceDisplay');
const userInfoDiv = document.getElementById('userInfo');
const mainHeaderTitle = document.getElementById('mainHeaderTitle');
const taskListHeaderTitle = document.getElementById('taskListHeaderTitle');
const loginView = document.getElementById('loginView');
const signupView = document.getElementById('signupView');
const authMessage = document.getElementById('authMessage');

// --- NEW DOM ELEMENTS for Toggle ---
const toggleSignupLink = document.getElementById('toggleSignupLink');
const toggleLoginLink = document.getElementById('toggleLoginLink');


let allTasks = []; 
let currentUser = null;
let userTaskLocks = {}; // Cache to store lock status

// =========================================================================
// UI CONTROL & AUTHENTICATION
// =========================================================================

function showView(viewName) {
    if (!articleSection || !categoryMainSection || !taskMainSection) return;
    
    articleSection.style.display = 'none';
    categoryMainSection.style.display = 'none';
    taskMainSection.style.display = 'none';
    
    if (!currentUser) {
        articleSection.style.display = 'block';
        mainHeaderTitle.textContent = 'Earning Guide';
        userInfoDiv.style.display = 'none';
        return;
    }
    
    userInfoDiv.style.display = 'flex';
    if (viewName === 'categories') {
        categoryMainSection.style.display = 'block';
        mainHeaderTitle.textContent = 'Tasks Categories';
    } else if (viewName === 'tasks') {
        taskMainSection.style.display = 'block';
    }
}
window.showCategoryView = function() { showView('categories'); }
window.showTaskListView = async function(platform) {
    const cleanPlatform = platform.trim(); 
    mainHeaderTitle.textContent = `${cleanPlatform} Tasks`;
    taskListHeaderTitle.textContent = `${cleanPlatform} Tasks`;
    showView('tasks');
    if (currentUser) {
        await fetchUserTaskLocks(currentUser.uid); // Fetch locks before rendering
    }
    renderTasks(cleanPlatform); 
}

profileIconButton.addEventListener('click', () => {
    if (currentUser) {
        if (confirm("Aap pehle se logged in hain. Kya aap logout karna chahte hain?")) auth.signOut();
    } else {
        authMessage.textContent = '';
        authModal.style.display = 'flex';
    }
});

function toggleAuthView() {
    authMessage.textContent = '';
    if (loginView.style.display === 'none') {
        loginView.style.display = 'block';
        signupView.style.display = 'none';
    } else {
        loginView.style.display = 'none';
        signupView.style.display = 'block';
    }
}

// FIXING 'Cannot read properties of null (reading 'addEventListener')'
// We check if the elements exist before attaching listeners.
if (toggleSignupLink) {
    toggleSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthView();
    });
}
if (toggleLoginLink) {
    toggleLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthView();
    });
}


document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        authModal.style.display = 'none';
    } catch (error) { 
        authMessage.textContent = error.message;
    }
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('userName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const signupButton = document.getElementById('signupButton');
    if (password.length < 6) {
        authMessage.textContent = "Password kam se kam 6 characters ka hona chahiye.";
        return;
    }
    signupButton.disabled = true;
    authMessage.textContent = "Processing...";
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        await db.collection('users').doc(user.uid).set({
            name: name, email: email, coins: 0, createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        authModal.style.display = 'none';
    } catch (error) {
        authMessage.textContent = error.message;
    } finally {
        signupButton.disabled = false;
    }
});

auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        showView('categories');
        userEmailDisplay.textContent = user.email; 
        fetchTasks();
        listenToWallet(user.uid); 
    } else {
        showView('article');
        allTasks = [];
    }
});

// =========================================================================
// TASK LOCKING LOGIC
// =========================================================================

async function lockTaskForUser(userId, taskId) {
    const lockTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
    
    await db.collection('task_locks').doc(userId).set({
        [taskId]: {
            lockedUntil: lockTime,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }
    }, { merge: true });

    userTaskLocks[taskId] = lockTime;
}

async function fetchUserTaskLocks(userId) {
    if (!userId) {
        userTaskLocks = {};
        return;
    }
    try {
        const doc = await db.collection('task_locks').doc(userId).get();
        if (doc.exists) {
            const lockData = doc.data();
            const currentTime = new Date().getTime();
            
            const activeLocks = {};
            for (const taskId in lockData) {
                // Check if lockedUntil property exists and is greater than current time
                if (lockData[taskId].lockedUntil && lockData[taskId].lockedUntil > currentTime) {
                    activeLocks[taskId] = lockData[taskId].lockedUntil;
                }
            }
            userTaskLocks = activeLocks;
        } else {
            userTaskLocks = {};
        }
    } catch (error) {
        console.error("Error fetching task locks:", error);
        userTaskLocks = {};
    }
}

function isTaskLocked(taskId) {
    const lockedUntil = userTaskLocks[taskId];
    if (!lockedUntil) return false;

    const currentTime = new Date().getTime();
    return lockedUntil > currentTime;
}

// =========================================================================
// DATA & TASK LOGIC
// =========================================================================

async function addCoinsToWallet(uid, amount, platform, link, type) {
    if (!uid) return false;
    const userRef = db.collection('users').doc(uid);
    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                // Handle case where user document doesn't exist (shouldn't happen after signup)
                transaction.set(userRef, { coins: amount, email: currentUser.email, name: currentUser.displayName || 'Worker' });
            } else {
                const newCoins = (userDoc.data().coins || 0) + amount;
                transaction.update(userRef, { coins: newCoins });
            }
        });

        await db.collection('worker_earnings').add({ 
            userId: uid, 
            email: currentUser.email, 
            amount, 
            source: TASK_REWARD_SOURCE,
            platform: platform, 
            type, 
            reference: link, 
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        });
        return true;
    } catch (error) {
        console.error("Error adding coins or logging earning:", error);
        return false;
    }
}

function showSuccessPopup(message) {
    successPopup.textContent = message;
    successPopup.style.display = 'block';
    setTimeout(() => { successPopup.style.display = 'none'; }, 3000);
}

function listenToWallet(uid) {
    db.collection('users').doc(uid).onSnapshot(doc => {
        const coins = doc.exists ? (doc.data().coins || 0) : 0;
        coinsBalanceDisplay.textContent = `${coins.toLocaleString()} Coins`;
    });
}

function fetchTasks() {
    db.collection('tasks').where('status', '==', 'Approved').onSnapshot(snapshot => {
        allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (taskMainSection && taskMainSection.style.display === 'block' && currentUser) {
            const currentPlatform = taskListHeaderTitle.textContent.replace(' Tasks', '').trim();
            // Since we rely on snapshot, we re-render the current view
            fetchUserTaskLocks(currentUser.uid).then(() => {
                renderTasks(currentPlatform);
            });
        }
    }, error => {
        console.error("Error fetching tasks:", error);
    });
}

function renderTasks(platform) {
    taskList.innerHTML = '';
    
    let filteredTasks = allTasks.filter(task => task.platform === platform);
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `<p style="text-align: center; color: ${getComputedStyle(document.documentElement).getPropertyValue('--dark-text').trim()}">Is category mein koi task maujood nahi hai.</p>`;
        return;
    }
    
    filteredTasks.forEach(task => {
        const isLocked = isTaskLocked(task.id);
        let warningText = "لازمی انتباہ: اگر ٹاسک ہدایات کے مطابق مکمل نہیں کیا گیا تو آپ کا وتھڈراول مسترد کر دیا جائے گا۔";
        let buttonText = isLocked ? `Locked <span class="lock-icon">🔒</span>` : `Open & Earn ${task.coinsRate || 0} Coins`;

        if (task.platform === 'App Install' || task.type === 'Review App') {
            warningText = "اہم: App install/review karne ke baad usay thori der use karein. Screenshot/proof zaroori ho sakta hai.";
        }

        const card = document.createElement('div');
        card.className = 'task-card';
        card.style.opacity = isLocked ? '0.6' : '1'; 
        card.innerHTML = `
            <div class="task-title">${task.linkTitle || task.type}</div>
            <div class="task-platform">${task.platform} - ${task.type || 'Click'}</div>
            <div class="warning-box">
                <div class="urdu">${warningText}</div>
            </div>
            <button class="earn-button" 
                    data-id="${task.id}"
                    data-link="${task.link}" 
                    data-platform="${task.platform}" 
                    data-coins="${task.coinsRate || 0}" 
                    data-type="${task.type || 'Click'}"
                    ${isLocked ? 'disabled' : ''}
                    onclick="handleTaskClick(this)">
                ${buttonText}
            </button>`;
        taskList.appendChild(card);
    });
}

function openAppLink(webUrl, platform) {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    let os = 'desktop';
    if (/android/i.test(userAgent)) os = 'android';
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) os = 'ios';

    let appUrl = webUrl;
    const platformLower = platform.toLowerCase();
    
    try {
        if (platformLower === 'tiktok') {
            appUrl = `tiktok://openurl?url=${encodeURIComponent(webUrl)}`; 
        } 
        
    } catch (e) { console.error("URL parse error:", e); }

    if (os !== 'desktop' && platformLower !== 'app install' && platformLower !== 'website') {
        window.location.href = appUrl;
        setTimeout(() => { window.open(webUrl, '_blank'); }, 2500);
    } else {
        window.open(webUrl, '_blank');
    }
}

window.handleTaskClick = async function(button) {
    if (!currentUser) {
        alert("Task shuru karne ke liye pehle login karen.");
        profileIconButton.click();
        return;
    }

    const taskId = button.dataset.id;
    const link = button.dataset.link;
    const coinsToEarn = Number(button.dataset.coins);
    const platform = button.dataset.platform;
    const type = button.dataset.type;
    
    if (isTaskLocked(taskId)) {
        alert("یہ ٹاسک اگلے 24 گھنٹوں کے لیے آپ کے لیے لاک کر دیا گیا ہے۔");
        return;
    }
    
    button.disabled = true;
    button.textContent = "Processing...";
    
    const success = await addCoinsToWallet(currentUser.uid, coinsToEarn, platform, link, type);
    
    if (success) {
        await lockTaskForUser(currentUser.uid, taskId);
        
        showSuccessPopup(`✅ ${coinsToEarn.toLocaleString()} Coins fori taur par add kar diye gaye hain! Task 24 ghanton k liye lock ho gaya.`);

        let finalWebUrl = link;
        if (platform.toLowerCase() === 'youtube' && type.toLowerCase() === 'subscribe') {
            if (!link.includes('sub_confirmation=1')) {
                finalWebUrl = link + (link.includes('?') ? '&' : '?') + 'sub_confirmation=1';
            }
        }
        openAppLink(finalWebUrl, platform);
        
        // Update the button status to locked
        button.innerHTML = `Task Completed & Locked <span class="lock-icon">🔒</span>`;
        
    } else {
        alert("Coins add karne mein masla hua.");
        button.disabled = false;
        button.innerHTML = `Open & Earn ${coinsToEarn} Coins`;
    }
}
