// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
    measurementId: "G-HJQ46RQNZS"
};

// Initialize Firebase
if (typeof firebase === 'undefined') {
    console.error("Firebase SDK not loaded.");
} else {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// --- CONSTANTS (Task Costs Per Unit) ---
const UNIT_RATES = {
    YouTube: {
        'Subscriber': { rate: 100, min: 10 }, 
        'Like': { rate: 2, min: 100 },
        'View': { rate: 2, min: 500 },
        'Comment': { rate: 52, min: 20 }
    },
    TikTok: {
        'Follow': { rate: 100, min: 10 },
        'Like': { rate: 30, min: 100 },
        'View': { rate: 3, min: 1000 }
    },
    Instagram: {
        'Follower': { rate: 100, min: 5 },
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
let walletUnsubscribe = null;
let historyUnsubscribe = null;

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

// --- AUTH FUNCTIONS ---
window.toggleAuthMode = function() {
    isSignupMode = !isSignupMode;
    if (isSignupMode) {
        authTitle.textContent = "Signup Karen";
        authButton.textContent = "Signup";
        toggleText.innerHTML = 'Account hai? <a href="#" onclick="toggleAuthMode()">Login Karen</a>';
    } else {
        authTitle.textContent = "Login Karen";
        authButton.textContent = "Login";
        toggleText.innerHTML = 'Account nahi hai? <a href="#" onclick="toggleAuthMode()">Signup Karen</a>';
    }
}

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    try {
        if (isSignupMode) {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            // Create user doc
            await db.collection('users').doc(userCredential.user.uid).set({ 
                coins: 0,
                email: email
            });
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
    if (walletUnsubscribe) walletUnsubscribe();
    if (historyUnsubscribe) historyUnsubscribe();
    await auth.signOut();
    alert("Logout Successful.");
    window.location.reload();
});

profileIconButton.addEventListener('click', () => {
    if (!currentUser) {
        authModal.style.display = 'flex';
        isSignupMode = false;
        authTitle.textContent = "Login Karen";
        authButton.textContent = "Login";
        toggleText.innerHTML = 'Account nahi hai? <a href="#" onclick="toggleAuthMode()">Signup Karen</a>';
    }
});

window.onclick = function(event) {
    if (event.target == authModal) {
        authModal.style.display = "none";
    }
}

// --- WALLET LISTENER ---
function listenToWallet(uid) {
    walletUnsubscribe = db.collection('users').doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            const coins = data.coins ? Number(data.coins) : 0; 
            currentCoinBalance = coins;
            if(currentBalanceDisplay) currentBalanceDisplay.textContent = `${coins.toLocaleString()} Coins`;
            checkSubmissionEligibility();
        } else {
            if(currentBalanceDisplay) currentBalanceDisplay.textContent = `0 Coins`;
            currentCoinBalance = 0;
        }
    }, error => {
        console.error("Wallet Error:", error);
    });
}

// --- AUTH STATE ---
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        articleSection.style.display = 'none';
        taskSubmissionSection.style.display = 'block';
        currentBalanceDisplay.style.display = 'block';
        authModal.style.display = 'none';
        logoutButton.style.display = 'block';
        
        listenToWallet(user.uid);
        listenToTaskHistory(user.uid);

    } else {
        articleSection.style.display = 'block';
        taskSubmissionSection.style.display = 'none';
        currentBalanceDisplay.style.display = 'none';
        logoutButton.style.display = 'none';
        currentCoinBalance = 0;
    }
});

// --- TASK FORM LOGIC ---

function calculateTotalCost() {
    const quantity = Number(taskQuantityInput.value);
    const minQuantity = Number(taskQuantityInput.min) || 0;

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
    if(minQuantityDisplay) minQuantityDisplay.value = '10'; // Default placeholder
    taskQuantityInput.min = 10;
    
    if (platform && UNIT_RATES[platform]) {
        for (const taskType in UNIT_RATES[platform]) {
            const rate = UNIT_RATES[platform][taskType].rate;
            const min = UNIT_RATES[platform][taskType].min;

            const option = document.createElement('option');
            option.value = taskType;
            option.setAttribute('data-rate', rate);
            option.setAttribute('data-min', min);
            option.textContent = `${taskType} (${rate.toLocaleString()} Coins)`;
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
        if(minQuantityDisplay) minQuantityDisplay.value = min.toLocaleString();
        
        taskQuantityInput.disabled = false;
        // Auto set to min if empty or less
        if (!taskQuantityInput.value || Number(taskQuantityInput.value) < min) {
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
    if (!submitTaskButton) return;

    const quantity = Number(taskQuantityInput.value);
    const minQuantity = Number(taskQuantityInput.min);
    const isQuantityValid = quantity >= minQuantity && quantity > 0;

    if (requiredCoins > 0 && currentCoinBalance >= requiredCoins && isQuantityValid) {
        submitTaskButton.disabled = false;
        submitTaskButton.textContent = `Submit (${requiredCoins.toLocaleString()} Coins)`;
        submitTaskButton.style.backgroundColor = "#28a745";
    } else {
        submitTaskButton.disabled = true;
        if (requiredCoins > 0 && !isQuantityValid) {
            submitTaskButton.textContent = `Qty Kam Hai (Min: ${minQuantity})`;
        } else if (requiredCoins > 0 && currentCoinBalance < requiredCoins) {
            submitTaskButton.textContent = `Coins Kam Hain (Need: ${requiredCoins})`;
        } else {
            submitTaskButton.textContent = `Task Submit Karen`;
        }
        submitTaskButton.style.backgroundColor = "#cccccc";
    }
}

// --- SUBMIT TASK (UPDATED FOR RULES) ---
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const quantity = Number(taskQuantityInput.value);
    const minQuantity = Number(taskQuantityInput.min);

    if (!currentUser || requiredCoins === 0 || currentCoinBalance < requiredCoins || quantity < minQuantity) {
        alert("Validation Failed: Coins kam hain ya quantity ghalat hai.");
        return;
    }

    const platform = platformSelect.value;
    const type = taskTypeSelect.value;
    const urlInput = document.getElementById('taskLink').value; // Keep ID as taskLink, save as url
    const totalCoinsDeducted = requiredCoins;

    if (!confirm(`Confirm: ${quantity} ${type}s ke liye ${totalCoinsDeducted} Coins katenge?`)) {
        return;
    }

    submitTaskButton.disabled = true;
    submitTaskButton.textContent = "Processing...";

    try {
        const batch = db.batch();

        // 1. Deduct Coins
        const userRef = db.collection('users').doc(currentUser.uid);
        batch.update(userRef, {
            coins: firebase.firestore.FieldValue.increment(-totalCoinsDeducted)
        });

        // 2. Create Submission (Use 'linkSubmissions' collection)
        const newDocRef = db.collection('linkSubmissions').doc();
        batch.set(newDocRef, {
            userId: currentUser.uid,
            email: currentUser.email,
            platform: platform,
            type: type,
            url: urlInput,      // Field changed to 'url' for rules
            cost: totalCoinsDeducted,
            quantity: quantity, // Save quantity
            unitPrice: unitCost,
            status: 'Pending', 
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        alert(`Success! Task Request Submitted.`);
        taskForm.reset();
        unitCost = 0;
        requiredCoins = 0;
        platformSelect.dispatchEvent(new Event('change'));

    } catch (error) {
        console.error("Task submission failed:", error);
        alert(`Error: ${error.message}`);
    } finally {
        checkSubmissionEligibility();
    }
});


// --- HISTORY LOGIC (With Index Error Fix) ---

function formatTimestamp(timestamp) {
    if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('en-PK', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }
    return 'Just Now';
}

function renderTaskHistory(requests) {
    if (!taskHistoryList) return;

    if (requests.length === 0) {
        taskHistoryList.innerHTML = '<p style="text-align:center; padding:10px;">No history found.</p>';
        return;
    }

    let html = `
        <table class="history-table" style="width:100%; border-collapse:collapse;">
            <thead>
                <tr style="background:#f1f1f1; text-align:left;">
                    <th style="padding:8px;">Task</th>
                    <th style="padding:8px;">Cost</th>
                    <th style="padding:8px;">Status</th>
                    <th style="padding:8px;">Date</th>
                </tr>
            </thead>
            <tbody>
    `;

    requests.forEach(req => {
        const statusClass = (req.status || 'Pending').toLowerCase();
        let statusColor = 'orange';
        if(statusClass === 'approved') statusColor = 'green';
        if(statusClass === 'rejected') statusColor = 'red';

        // Fallback for old data without 'url'
        const linkUrl = req.url || req.link || '#';
        const qty = req.quantity || req.quantityRequested || '-';

        html += `
            <tr style="border-bottom:1px solid #ddd;">
                <td style="padding:8px;">
                    <strong>${req.platform}</strong> <small>(${req.type})</small><br>
                    <span style="font-size:0.85em;">Qty: ${qty}</span><br>
                    <a href="${linkUrl}" target="_blank" style="font-size:0.8em; color:blue;">Open Link</a>
                </td>
                <td style="padding:8px;">${req.cost || req.coinsDeducted}</td>
                <td style="padding:8px;">
                    <span style="color:${statusColor}; font-weight:bold;">${req.status || 'Pending'}</span>
                </td>
                <td style="padding:8px; font-size:0.8em;">${formatTimestamp(req.timestamp)}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    taskHistoryList.innerHTML = html;
}

function listenToTaskHistory(uid) {
    // 1. Collection = 'linkSubmissions'
    // 2. userId match zaroori hai (Permission denied fix)
    // 3. orderBy timestamp (Index required)
    
    db.collection('linkSubmissions')
      .where('userId', '==', uid)
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
          const requests = [];
          snapshot.forEach(doc => {
              requests.push(doc.data());
          });
          renderTaskHistory(requests);
      }, error => {
          console.error("History Error:", error);
          
          if (error.code === 'failed-precondition') {
             // Show Link to create Index
             taskHistoryList.innerHTML = `
                <p style="color:red; font-size:12px; padding:10px; border:1px solid red;">
                   <b>System Error (Missing Index):</b><br>
                   Developer, please open browser console (F12) and click the Firebase link to fix this.
                </p>`;
          } else if (error.code === 'permission-denied') {
             taskHistoryList.innerHTML = '<p style="color:red;">Permission Denied. (Rules Update Required)</p>';
          }
      });
}
