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


let allTasks = []; 
let currentUser = null;
let currentView = 'categories';
let currentFilterPlatform = 'All';

// --- VIEW MANAGEMENT ---
function showView(viewName) {
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
        currentView = 'categories';
    } else if (viewName === 'tasks') {
        taskMainSection.style.display = 'block';
        mainHeaderTitle.textContent = `${currentFilterPlatform} Tasks`;
        currentView = 'tasks';
    }
}

function showCategoryView() {
    showView('categories');
}

function showTaskListView(platform) {
    currentFilterPlatform = platform;
    taskListHeaderTitle.textContent = `${platform} Tasks`;
    showView('tasks');
    renderTasks(platform);
}

// --- WALLET & LOGGING FUNCTION ---
async function addCoinsToWallet(uid, amount, platform, link, type) {
    if (!uid) return false;
    const userRef = db.collection('users').doc(uid);
    const userEmail = currentUser.email;

    try {
        await userRef.update({
            coins: firebase.firestore.FieldValue.increment(amount) 
        });
        await db.collection('worker_earnings').add({
            userId: uid,
            email: userEmail,
            amount: amount,
            source: platform,
            type: type,
            reference: link,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        if (error.code === 'not-found') {
             await userRef.set({ coins: amount, email: currentUser.email }, { merge: true });
             return true;
        }
        console.error("Error updating wallet/logging earning:", error);
        return false;
    }
}

// --- UI POPUP FUNCTION ---
function showSuccessPopup(message) {
    successPopup.textContent = message;
    successPopup.style.display = 'block';
    setTimeout(() => {
        successPopup.style.display = 'none';
    }, 3000);
}

// --- AUTH HANDLING ---
profileIconButton.addEventListener('click', () => {
    if (currentUser) {
        if (confirm("Aap pehle se logged in hain. Kya aap logout karna chahte hain?")) {
            auth.signOut();
        }
    } else {
        authModal.style.display = 'flex';
    }
});

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        authModal.style.display = 'none';
    } catch (error) {
        alert(`Login Failed: ${error.message}`);
    }
});

auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        showView('categories');
        userInfoDiv.style.display = 'flex';
        userEmailDisplay.textContent = user.email; 
        fetchTasks();
        listenToWallet(user.uid); 
    } else {
        showView('article');
    }
});

// --- WALLET LISTENER (For Header Display) ---
function listenToWallet(uid) {
    db.collection('users').doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            const coins = Number(data.coins) || 0;
            coinsBalanceDisplay.textContent = `${coins.toLocaleString()} Coins`;
        } else {
            coinsBalanceDisplay.textContent = `0 Coins`;
        }
    });
}

// --- TASK FETCHING ---
function fetchTasks() {
    db.collection('tasks').where('status', '==', 'Approved').onSnapshot(snapshot => {
        allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentView === 'tasks') {
            renderTasks(currentFilterPlatform);
        }
    }, error => {
        console.error("Error fetching tasks:", error);
        if (currentView === 'tasks') {
            taskList.innerHTML = `<p style="color: red;">Tasks load nahi ho sake. Database connection check karen.</p>`;
        }
    });
}

// --- TASK RENDERING ---
function renderTasks(platform) {
    taskList.innerHTML = '';
    let filteredTasks = allTasks.filter(task => task.platform === platform);
    if (platform === 'General') {
        filteredTasks = allTasks.filter(task => !['YouTube', 'TikTok', 'Instagram', 'Facebook', 'WhatsApp', 'App Download'].includes(task.platform));
    }
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `<p style="text-align: center;">Is category mein koi task maujood nahi hai.</p>`;
        return;
    }
    filteredTasks.forEach(task => {
        const title = task.linkTitle || task.type || 'New Task'; 
        const platformName = task.platform || 'General';
        const coinsToEarn = task.coinsRate || 0;
        const clicksCompleted = task.currentClicks || 0;
        const maxClicks = task.maxClicks || 1;
        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <div class="task-title">${title}</div>
            <div class="task-platform">${platformName}</div>
            <div class="warning-box">
                <div class="urdu">لازمی انتباہ: اگر ٹاسک ہدایات کے مطابق مکمل نہیں کیا گیا تو آپ کا وتھڈراول مسترد کر دیا جائے گا۔</div>
                <div class="english">Warning: If the task isn't completed correctly, your withdrawal will be rejected.</div>
            </div>
            <button class="earn-button" 
                    data-link="${task.link}" 
                    data-task-id="${task.id}"
                    data-platform="${platformName}"
                    data-coins="${coinsToEarn}"
                    data-type="${task.type || 'Click'}"
                    onclick="handleTaskClick(this)">
                Open & Earn ${coinsToEarn} Coins (Clicks: ${clicksCompleted}/${maxClicks})
            </button>
        `;
        taskList.appendChild(card);
    });
}

// --- HANDLE TASK CLICK (Earning Logic - INSTANT) ---
window.handleTaskClick = async function(button) {
    if (!currentUser) {
        alert("Task shuru karne ke liye pehle login karen.");
        document.getElementById('profileIconButton').click();
        return;
    }
    const link = button.dataset.link;
    const coinsToEarn = Number(button.dataset.coins);
    const platform = button.dataset.platform;
    const type = button.dataset.type;
    if (coinsToEarn <= 0) {
         alert("Is task ki earning 0 hai. Admin se rabta karen.");
         return;
    }
    button.disabled = true;
    button.textContent = "Processing...";
    window.open(link, '_blank');
    const success = await addCoinsToWallet(currentUser.uid, coinsToEarn, platform, link, type);
    if (success) {
        showSuccessPopup(`✅ ${coinsToEarn.toLocaleString()} Coins aapke Wallet mein fori taur par add kar diye gaye hain!`);
    } else {
        alert("Coins add karne mein masla hua.");
    }
    button.textContent = "Task Completed (Earning Done)";
}

// --- REPEATING SOCIAL AD LOGIC ---

// Function to load the social ad script dynamically
function loadSocialAd() {
    const existingAdScript = document.getElementById('socialAdScript');
    if (existingAdScript) {
        existingAdScript.remove();
    }
    const adScript = document.createElement('script');
    adScript.id = 'socialAdScript';
    adScript.type = 'text/javascript';
    
    // *** YEH LINE AAPKE NAYE SCRIPT SE UPDATE KAR DI GAYI HAI ***
    adScript.src = '//pl28063578.effectivegatecpm.com/f8/df/df/f8dfdf7576999fcac45d5b19753b542e.js';
    
    document.head.appendChild(adScript);
    console.log("Social ad reloaded.");
}

// Har 30 second (30000 milliseconds) ke baad ad ko load karne ka interval
const adInterval = 30000; 

// Interval shuru karen
setInterval(loadSocialAd, adInterval);
