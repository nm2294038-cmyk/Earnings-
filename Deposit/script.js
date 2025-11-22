// --- FIREBASE CONFIGURATION AND INITIALIZATION ---
// IMPORTANT: Make sure the Firebase SDKs are loaded in index.html HEAD before this script runs.
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

// --- GLOBAL STATE AND CONSTANTS ---
let isSignupMode = false;
let currentUser = null;
const COIN_RATE_PKR = 2; // 2 PKR = 1 Coin
const COIN_PACKAGES = [25,50 ,100, 200, 300, 500, 1000, 2000, 5000,10000,15000,20000,25000, 30000]; 

// --- DOM ELEMENTS ---
const authModal = document.getElementById('authModal');
const depositContent = document.getElementById('depositContent');
const depositArticle = document.getElementById('depositArticle');
const depositForm = document.getElementById('depositForm');
const depositHistoryList = document.getElementById('depositHistoryList');
const currentBalanceDisplay = document.getElementById('currentBalanceDisplay');
const depositAmountInput = document.getElementById('depositAmount');
const coinPackagesContainer = document.getElementById('coinPackages');
const authTitle = document.getElementById('authTitle');
const authButton = document.getElementById('authButton');
const toggleText = document.getElementById('toggleText');
const logoutButton = document.getElementById('logoutButton');
const profileIconButton = document.getElementById('profileIconButton');

// New Form Fields
const senderNameInput = document.getElementById('senderName');
const senderAccountInput = document.getElementById('senderAccount');
const senderCnicInput = document.getElementById('senderCnic');
const transactionIdInput = document.getElementById('transactionId');


// --- INITIAL SETUP: RENDER COIN PACKAGES ---
function renderCoinPackages() {
    coinPackagesContainer.innerHTML = '';
    COIN_PACKAGES.forEach(coins => {
        const pkrAmount = coins * COIN_RATE_PKR;
        const button = document.createElement('button');
        button.className = 'coin-package-btn';
        button.setAttribute('data-pkr', pkrAmount); 
        button.textContent = `${coins} Coins (${pkrAmount} PKR)`;
        coinPackagesContainer.appendChild(button);
    });
}
renderCoinPackages();

// --- COIN PACKAGE SELECTION LOGIC ---
coinPackagesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('coin-package-btn')) {
        const selectedPkr = Number(e.target.getAttribute('data-pkr'));
        
        // 1. Update Input Field with PKR amount
        depositAmountInput.value = selectedPkr;
        
        // 2. Update Visual Selection
        document.querySelectorAll('.coin-package-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        e.target.classList.add('selected');
    }
});

// --- EVENT LISTENER TO OPEN MODAL VIA ICON ---
profileIconButton.addEventListener('click', () => {
    authModal.style.display = 'flex';
    if (!auth.currentUser) {
        isSignupMode = false;
        toggleAuthMode();
    }
});


// --- AUTH MODAL LOGIC ---

function toggleAuthMode() {
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
            await db.collection('users').doc(userCredential.user.uid).set({ coins: 0, email: email });
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

// Real-time Auth State Listener
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        // Logged In: Show Deposit Section, Hide Article Guide
        depositArticle.style.display = 'none';
        depositContent.style.display = 'block';
        currentBalanceDisplay.style.display = 'block';
        logoutButton.style.display = 'block';
        toggleText.style.display = 'none';
        
        listenToWallet(user.uid);
        listenToDepositHistory(user.uid);

    } else {
        // Logged Out: Show Article Guide, Hide Deposit Section
        depositArticle.style.display = 'block';
        depositContent.style.display = 'none';
        currentBalanceDisplay.style.display = 'none';
        logoutButton.style.display = 'none';
        toggleText.style.display = 'block';
        authModal.style.display = 'none';
    }
});

// --- WALLET LOGIC (Real-Time Listener) ---

function listenToWallet(uid) {
    db.collection('users').doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            const coins = data.coins ? Number(data.coins) : 0; 
            currentBalanceDisplay.textContent = `${coins} Coins`;
        } else {
            currentBalanceDisplay.textContent = `0 Coins`;
        }
    });
}

// --- DEPOSIT FORM SUBMISSION ---

depositForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const method = document.getElementById('depositMethod').value;
    const amount = Number(depositAmountInput.value); // PKR Amount
    const txId = transactionIdInput.value.trim();
    const senderName = senderNameInput.value.trim();
    const senderAccount = senderAccountInput.value.trim();
    const senderCnic = senderCnicInput.value.trim(); // CNIC is optional but collected
    
    // Calculate coins based on the new rate
    const coinsToReceive = Math.floor(amount / COIN_RATE_PKR); 

    if (amount < COIN_RATE_PKR || !method || !txId || !senderName || !senderAccount) {
        alert(`Deposit ke liye kam az kam ${COIN_RATE_PKR} PKR, Deposit Method, Transaction ID, Sender ka Naam, aur Sender ka Account Number darj karna zaroori hai.`);
        return;
    }

    try {
        await db.collection('deposits').add({
            userId: currentUser.uid,
            email: currentUser.email,
            method: method,
            amount: amount, // PKR amount sent
            coinsEquivalent: coinsToReceive, // Calculated coins
            transactionId: txId,
            senderName: senderName, // New Field
            senderAccount: senderAccount, // New Field
            senderCnic: senderCnic, // New Field
            status: 'Pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`Deposit Request Submit ho gayi. Aapko ${coinsToReceive} Coins milenge. Admin verification ke baad coins add ho jayenge.`);
        depositForm.reset();
        document.querySelectorAll('.coin-package-btn').forEach(btn => btn.classList.remove('selected'));
    } catch (error) {
        console.error("Deposit submission failed:", error);
        alert("Deposit Request bhejte waqt masla hua.");
    }
});

// --- HISTORY LOGIC ---

function formatTimestamp(timestamp) {
    if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('en-PK', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }
    return 'N/A';
}

function listenToDepositHistory(uid) {
    const historyQuery = db.collection('deposits')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(10);

    historyQuery.onSnapshot(snapshot => {
        let html = `
            <table class="deposit-history-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Coins</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (snapshot.empty) {
            depositHistoryList.innerHTML = '<p>Aapne abhi tak koi deposit request nahi bheji hai.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const d = doc.data();
            const statusClass = 'status-' + (d.status || "Pending").toLowerCase();
            const date = formatTimestamp(d.timestamp);
            const coins = d.coinsEquivalent || 0;

            html += `
                <tr>
                    <td>${date}</td>
                    <td>${d.method}</td>
                    <td>${coins}</td>
                    <td><span class="${statusClass}">${d.status || 'Pending'}</span></td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        depositHistoryList.innerHTML = html;
    }, error => {
        console.error("Error fetching deposit history:", error);
        depositHistoryList.innerHTML = '<p style="color: var(--danger-color);">History load nahi ho saki. (Check Firestore Rules)</p>';
    });
}
