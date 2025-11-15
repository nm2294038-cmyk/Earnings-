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

// Global functions exposed to HTML via onclick
window.showCategoryView = function() {
    showView('categories');
}

window.showTaskListView = function(platform) {
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
        // 1. Update Wallet
        await userRef.update({
            coins: firebase.firestore.FieldValue.increment(amount) 
        });

        // 2. Log Earning for Admin Panel (worker_earnings collection)
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
             // User document might not exist, create it.
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
    // Fetch all approved tasks and store them locally
    db.collection('tasks').where('status', '==', 'Approved').onSnapshot(snapshot => {
        allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // If we are currently viewing tasks, re-render them with new data
        if (currentView === 'tasks') {
            renderTasks(currentFilterPlatform);
        }

    }, error => {
        console.error("Error fetching tasks:", error);
        if (currentView === 'tasks') {
            taskList.innerHTML = `<p style="color: var(--danger-color);">Tasks load nahi ho sake. Database connection check karen.</p>`;
        }
    });
}

// --- TASK RENDERING ---
function renderTasks(platform) {
    taskList.innerHTML = '';
    let filteredTasks = allTasks;

    if (platform !== 'All' && platform !== 'General') {
        filteredTasks = allTasks.filter(task => task.platform === platform);
    } else if (platform === 'General') {
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
        const earnAmountDisplay = (coinsToEarn / 1000).toFixed(2); 
        
        // Assuming maxClicks and currentClicks exist in the database model
        const clicksRemaining = task.maxClicks ? (task.maxClicks - (task.currentClicks || 0)) : 'N/A';
        const clicksCompleted = task.currentClicks || 0;

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
                Open & Earn ₹${earnAmountDisplay} (Clicks: ${clicksCompleted}/${clicksRemaining})
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
         alert("Is task ki earning 0 hai.");
         return;
    }
    
    button.disabled = true;
    button.textContent = "Processing...";
    
    // 1. Open the link in a new tab (Simulates viewing the task)
    window.open(link, '_blank');
    
    // 2. INSTANT COIN ADDITION & LOGGING
    const success = await addCoinsToWallet(currentUser.uid, coinsToEarn, platform, link, type);
    
    if (success) {
        showSuccessPopup(`✅ ${coinsToEarn.toLocaleString()} Coins aapke Wallet mein fori taur par add kar diye gaye hain!`);
    } else {
        alert("Coins add karne mein masla hua.");
    }

    // Reset button state (Ideally, the user should refresh or the app should handle click tracking/limits properly)
    // For now, we simply change the button text to show earning is done for this click.
    button.textContent = "Task Completed (Earning Done)";
}

// --- INITIAL LOAD & AUTH CHECK ---
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        showView('categories');
        userEmailDisplay.textContent = user.email; 
        
        // Start listening to data
        fetchTasks();
        listenToWallet(user.uid); 
    } else {
        showView('article');
    }
});
