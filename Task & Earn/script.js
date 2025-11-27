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

let allTasks = []; 
let currentUser = null;

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
function showCategoryView() { showView('categories'); }
function showTaskListView(platform) {
    const cleanPlatform = platform.trim(); 
    mainHeaderTitle.textContent = `${cleanPlatform} Tasks`;
    taskListHeaderTitle.textContent = `${cleanPlatform} Tasks`;
    showView('tasks');
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
// DATA & TASK LOGIC
// =========================================================================

async function addCoinsToWallet(uid, amount, platform, link, type) {
    if (!uid) return false;
    const userRef = db.collection('users').doc(uid);
    try {
        await userRef.update({ coins: firebase.firestore.FieldValue.increment(amount) });
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
        if (error.code === 'not-found' || error.message.includes('No document to update')) {
             await userRef.set({ coins: amount, email: currentUser.email, name: currentUser.displayName || 'Worker' }, { merge: true });
             return true;
        }
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
        
        if (taskMainSection.style.display === 'block') {
            const currentPlatform = taskListHeaderTitle.textContent.replace(' Tasks', '').trim();
            renderTasks(currentPlatform);
        }
    }, error => {
        console.error("Error fetching tasks:", error);
    });
}

// --- TASK RENDERING (Uses strict matching for platform name) ---
function renderTasks(platform) {
    taskList.innerHTML = '';
    
    // FILTERS TASKS BASED ON THE EXACT PLATFORM NAME
    let filteredTasks = allTasks.filter(task => task.platform === platform);
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `<p style="text-align: center;">Is category mein koi task maujood nahi hai.</p>`;
        return;
    }
    
    filteredTasks.forEach(task => {
        let warningText = "لازمی انتباہ: اگر ٹاسک ہدایات کے مطابق مکمل نہیں کیا گیا تو آپ کا وتھڈراول مسترد کر دیا جائے گا۔";
        let buttonText = `Open & Earn ${task.coinsRate || 0} Coins`;

        if (task.platform === 'App Install' || task.type === 'Review App') {
            warningText = "اہم: App install/review karne ke baad usay thori der use karein. Screenshot/proof zaroori ho sakta hai.";
        }

        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <div class="task-title">${task.linkTitle || task.type}</div>
            <div class="task-platform">${task.platform} - ${task.type || 'Click'}</div>
            <div class="warning-box">
                <div class="urdu">${warningText}</div>
            </div>
            <button class="earn-button" 
                    data-link="${task.link}" 
                    data-platform="${task.platform}" 
                    data-coins="${task.coinsRate || 0}" 
                    data-type="${task.type || 'Click'}"
                    onclick="handleTaskClick(this)">
                ${buttonText}
            </button>`;
        taskList.appendChild(card);
    });
}

// --- SMART REDIRECT FUNCTION ---
function openAppLink(webUrl, platform) {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    let os = 'desktop';
    if (/android/i.test(userAgent)) os = 'android';
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) os = 'ios';

    let appUrl = webUrl;
    const platformLower = platform.toLowerCase();
    
    try {
        if (platformLower === 'youtube') {
            // YouTube specific logic here
        } else if (platformLower === 'tiktok') {
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

// --- HANDLE TASK CLICK ---
window.handleTaskClick = async function(button) {
    if (!currentUser) {
        alert("Task shuru karne ke liye pehle login karen.");
        profileIconButton.click();
        return;
    }

    const link = button.dataset.link;
    const coinsToEarn = Number(button.dataset.coins);
    const platform = button.dataset.platform;
    const type = button.dataset.type;
    
    button.disabled = true;
    button.textContent = "Earning...";
    
    const success = await addCoinsToWallet(currentUser.uid, coinsToEarn, platform, link, type);
    if (success) {
        showSuccessPopup(`✅ ${coinsToEarn.toLocaleString()} Coins fori taur par add kar diye gaye hain!`);
    } else {
        alert("Coins add karne mein masla hua.");
    }
    
    let finalWebUrl = link;
    if (platform.toLowerCase() === 'youtube' && type.toLowerCase() === 'subscribe') {
        if (!link.includes('sub_confirmation=1')) {
            finalWebUrl = link + (link.includes('?') ? '&' : '?') + 'sub_confirmation=1';
        }
    }
    
    openAppLink(finalWebUrl, platform);
    
    button.textContent = "Task Completed (Earning Done)";
}
