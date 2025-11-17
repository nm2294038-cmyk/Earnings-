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

// Assuming Firebase is loaded globally via <script> tags in index.html
if (typeof firebase === 'undefined') {
    console.error("Firebase SDK not loaded. Check index.html.");
} else {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// --- CONSTANTS (Task Costs Per Unit) ---
const UNIT_RATES = {
    YouTube: {
        'Subscriber': { rate: 280, min: 10 }, 
        'Like': { rate: 24, min: 100 },
        'View': { rate: 20, min: 500 }
    },
    TikTok: {
        'Follow': { rate: 100, min: 10 },
        'Like': { rate: 30, min: 100 },
        'View': { rate: 3, min: 1000 }
    },
    Instagram: {
        'Follower': { rate: 380, min: 5 },
        'Like': { rate: 24, min: 50 }
    },
    Facebook: {
        'Follower': { rate: 160, min: 10 },
        'Post Reaction': { rate: 12, min: 50 }
    },
    Products: { 
        'Product Click': { rate: 100, min: 10 }, 
    }
};

// --- GLOBAL STATE ---
let currentUser = null;
let currentCoinBalance = 0;
let requiredCoins = 0;
let unitCost = 0;
let isSignupMode = false;

// --- DOM ELEMENTS ---
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authButton = document.getElementById('authButton');
const toggleText = document.getElementById('toggleText');
const logoutButton = document.getElementById('logoutButton');
const profileIconButton = document.getElementById('profileIconButton');
const currentBalanceDisplay = document.getElementById('currentBalanceDisplay');
const articleSection = document.getElementById('articleSection');
const taskSubmissionSection = document.getElementById('taskSubmissionSection');
const taskForm = document.getElementById('taskForm');
const platformSelect = document.getElementById('platformSelect');
const taskTypeSelect = document.getElementById('taskTypeSelect');
const taskQuantityInput = document.getElementById('taskQuantity'); 
const minQuantityDisplay = document.getElementById('minQuantityDisplay'); 
const coinsRequiredDisplay = document.getElementById('coinsRequiredDisplay');
const submitTaskButton = document.getElementById('submitTaskButton');
const taskHistoryList = document.getElementById('taskHistoryList');


// --- AUTH MODAL LOGIC (Global Functions for onclick) ---
window.toggleAuthMode = function() {
    isSignupMode = !isSignupMode;
    if (isSignupMode) {
        authTitle.textContent = "Signup Karen";
        authButton.textContent = "Signup";
        toggleText.innerHTML = 'Account hai? <a onclick="toggleAuthMode()">Login Karen</a>';
    } else {
        authTitle.textContent = "Login Karen";
        authButton.textContent = "Login";
        toggleText.innerHTML = 'Account nahi hai? <a onclick="toggleAuthMode()">Signup Karen</a>';
    }
}

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    try {
        if (isSignupMode) {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await db.collection('users').doc(userCredential.user.uid).set({ coins: 0 });
            alert("Signup Successful! Welcome.");
        } else {
            await auth.signInWithEmailAndPassword(email, password);
            alert("Login Successful!");
        }
        authModal.style.display = 'none';
    } catch (error) {
        alert(`Authentication Failed: ${error.message}`);
    }
});

logoutButton.addEventListener('click', async () => {
    await auth.signOut();
    alert("Logout Successful.");
});

profileIconButton.addEventListener('click', () => {
    authModal.style.display = 'flex';
    if (!auth.currentUser) {
        isSignupMode = false;
        window.toggleAuthMode();
    }
});


// --- WALLET LISTENER ---
function listenToWallet(uid) {
    db.collection('users').doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            const coins = data.coins ? Number(data.coins) : 0; 
            currentCoinBalance = coins;
            currentBalanceDisplay.textContent = `${coins.toLocaleString()} Coins`;
            checkSubmissionEligibility();
        } else {
            currentBalanceDisplay.textContent = `0 Coins`;
            currentCoinBalance = 0;
        }
    });
}

async function addCoinsToWallet(uid, amount) {
    const userRef = db.collection('users').doc(uid);
    try {
        await userRef.update({
            coins: firebase.firestore.FieldValue.increment(amount) 
        });
    } catch (error) {
        console.error("Error updating wallet:", error);
    }
}

// --- AUTH CHECK ---
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        articleSection.style.display = 'none';
        taskSubmissionSection.style.display = 'block';
        currentBalanceDisplay.style.display = 'block';
        authModal.style.display = 'none';
        logoutButton.style.display = 'block';
        toggleText.style.display = 'none';
        
        listenToWallet(user.uid);
        listenToTaskHistory(user.uid);

    } else {
        articleSection.style.display = 'block';
        taskSubmissionSection.style.display = 'none';
        currentBalanceDisplay.style.display = 'none';
        logoutButton.style.display = 'none';
        toggleText.style.display = 'block';
        currentCoinBalance = 0;
    }
});

// --- TASK FORM LOGIC ---

function calculateTotalCost() {
    const quantity = Number(taskQuantityInput.value);
    const minQuantity = Number(taskQuantityInput.min);

    requiredCoins = 0;
    
    if (unitCost > 0 && quantity >= minQuantity) {
        requiredCoins = unitCost * quantity;
    } 
    
    coinsRequiredDisplay.textContent = `Total Required Coins: ${requiredCoins.toLocaleString()}`;
    checkSubmissionEligibility();
}


platformSelect.addEventListener('change', () => {
    const platform = platformSelect.value;
    taskTypeSelect.innerHTML = '<option value="">--- Select Task Type ---</option>';
    taskTypeSelect.disabled = true;
    taskQuantityInput.disabled = true;
    
    unitCost = 0;
    taskQuantityInput.value = '';
    minQuantityDisplay.value = '10';
    taskQuantityInput.min = 10;
    
    if (platform && UNIT_RATES[platform]) {
        for (const taskType in UNIT_RATES[platform]) {
            const rate = UNIT_RATES[platform][taskType].rate;
            const min = UNIT_RATES[platform][taskType].min;

            const option = document.createElement('option');
            option.value = taskType;
            option.setAttribute('data-rate', rate);
            option.setAttribute('data-min', min);
            option.textContent = `${taskType} (${rate.toLocaleString()} Coins per unit)`;
            taskTypeSelect.appendChild(option);
        }
        taskTypeSelect.disabled = false;
    }
    calculateTotalCost();
});

taskTypeSelect.addEventListener('change', () => {
    const selectedOption = taskTypeSelect.options[taskTypeSelect.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        const rate = Number(selectedOption.getAttribute('data-rate'));
        const min = Number(selectedOption.getAttribute('data-min'));
        
        unitCost = rate;
        taskQuantityInput.min = min;
        minQuantityDisplay.value = min.toLocaleString();
        
        taskQuantityInput.disabled = false;
        if (Number(taskQuantityInput.value) < min) {
            taskQuantityInput.value = min;
        }
    } else {
        unitCost = 0;
        taskQuantityInput.disabled = true;
    }
    calculateTotalCost();
});

taskQuantityInput.addEventListener('input', calculateTotalCost);
taskQuantityInput.addEventListener('change', calculateTotalCost);


function checkSubmissionEligibility() {
    const quantity = Number(taskQuantityInput.value);
    const minQuantity = Number(taskQuantityInput.min);

    const isQuantityValid = quantity >= minQuantity && quantity > 0;

    if (requiredCoins > 0 && currentCoinBalance >= requiredCoins && isQuantityValid) {
        submitTaskButton.disabled = false;
        submitTaskButton.textContent = `Task Submit Karen (${requiredCoins.toLocaleString()} Coins Total)`;
    } else {
        submitTaskButton.disabled = true;
        if (requiredCoins > 0 && !isQuantityValid) {
            submitTaskButton.textContent = `Miqdar Kam Hai (Minimum ${minQuantity.toLocaleString()} Chahiye)`;
        } else if (requiredCoins > 0 && currentCoinBalance < requiredCoins) {
            submitTaskButton.textContent = `Coins Kam Hain (Chahiye: ${requiredCoins.toLocaleString()})`;
        } else {
            submitTaskButton.textContent = `Task Submit Karen`;
        }
    }
}


// --- TASK SUBMISSION ---
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const quantity = Number(taskQuantityInput.value);
    const minQuantity = Number(taskQuantityInput.min);

    if (!currentUser || requiredCoins === 0 || currentCoinBalance < requiredCoins || quantity < minQuantity) {
        alert("Coins kam hain ya task/quantity select nahi kiya gaya.");
        return;
    }

    const platform = platformSelect.value;
    const type = taskTypeSelect.value;
    const link = document.getElementById('taskLink').value;
    const totalCoinsDeducted = requiredCoins;

    if (!confirm(`Kya aap ${quantity.toLocaleString()} ${type}s ke liye ${totalCoinsDeducted.toLocaleString()} Coins kharch karke yeh task submit karna chahte hain?`)) {
        return;
    }

    try {
        // 1. Deduct Coins from Wallet
        await addCoinsToWallet(currentUser.uid, -totalCoinsDeducted);

        // 2. Create Task Request Record
        await db.collection('user_tasks').add({
            userId: currentUser.uid,
            email: currentUser.email,
            platform: platform,
            type: type,
            link: link,
            coinsDeducted: totalCoinsDeducted,
            quantityRequested: quantity,
            unitCost: unitCost,
            status: 'Pending', 
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`Task Request Bhej Di Gayi! ${totalCoinsDeducted.toLocaleString()} Coins aapke wallet se kaat liye gaye hain.`);
        taskForm.reset();
        unitCost = 0;
        requiredCoins = 0;
        platformSelect.dispatchEvent(new Event('change')); // Reset form view

    } catch (error) {
        console.error("Task submission failed:", error);
        alert("Task Request bhejte waqt koi masla hua. Dobara koshish karen.");
    }
});


// --- HISTORY LOGIC ---

function formatTimestamp(timestamp) {
    if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('en-PK', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }
    return 'N/A';
}

function renderTaskHistory(requests) {
    if (requests.length === 0) {
        taskHistoryList.innerHTML = '<p>Aapne abhi tak koi task request nahi bheji hai.</p>';
        return;
    }

    let html = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Platform</th>
                    <th>Task / Qty</th>
                    <th>Coins Spent</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    requests.forEach(req => {
        const statusClass = (req.status || 'Pending').toLowerCase();
        const taskDetails = `${req.type} (${req.quantityRequested ? req.quantityRequested.toLocaleString() : 'N/A'})`;
        
        html += `
            <tr>
                <td>${req.platform}</td>
                <td>${taskDetails}</td>
                <td>${req.coinsDeducted ? req.coinsDeducted.toLocaleString() : 'N/A'}</td>
                <td>${formatTimestamp(req.timestamp)}</td>
                <td><span class="status-${statusClass}">${req.status || 'Pending'}</span></td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    taskHistoryList.innerHTML = html;
}

function listenToTaskHistory(uid) {
    db.collection('user_tasks')
      .where('userId', '==', uid)
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
          const requests = [];
          snapshot.forEach(doc => {
              requests.push(doc.data());
          });
          renderTaskHistory(requests);
      }, error => {
          console.error("Error fetching task history:", error);
          taskHistoryList.innerHTML = '<p style="color: var(--danger-color);">History load karne mein masla hua. (Index check karen)</p>';
      });
}
