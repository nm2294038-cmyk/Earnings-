import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, setDoc, addDoc, query, where, limit, orderBy } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// --- Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
    measurementId: "G-HJQ46RQNZS"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Global States ---
let globalCoinsData = [];
let userHoldings = {};
let currentUser = null;

// --- DOM Elements (Declared globally, initialized inside DOMContentLoaded) ---
let headerWallet, userDisplay, loginModal, depositModal, openDepositModalHeader, walletTableBody;
let closeDepositModal, btnSubmitDeposit, depCoinSelect, depAmountPKR, depCoinEst, depHistoryList;
let btnLoginAction, btnSignupAction, openLoginBtn, closeLoginModal;


// --- Helper Functions ---
const getDbField = (coinId) => (coinId === 'main') ? 'coins' : coinId;
const getCoinSymbol = (id) => {
    const c = globalCoinsData.find(x => x.id === id);
    return c ? c.symbol : id.toUpperCase();
};
const formatCompact = (num) => {
    if (num === null || num === undefined || num === 0) return '0';
    const absNum = Math.abs(num);
    if (absNum >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (absNum >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (absNum >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const closeAllModals = () => {
    loginModal.style.display = 'none';
    depositModal.style.display = 'none';
};
window.onclick = (e) => { 
    if(e.target.className === 'modal-overlay') closeAllModals(); 
};


// --- Core Functions ---

function initializeElements() {
    // Header/App
    headerWallet = document.getElementById('headerWallet');
    userDisplay = document.getElementById('userDisplay');
    openDepositModalHeader = document.getElementById('openDepositModalHeader');
    walletTableBody = document.getElementById('walletTableBody');
    
    // Modals
    loginModal = document.getElementById('loginModal');
    depositModal = document.getElementById('depositModal');

    // Login Modal buttons
    openLoginBtn = document.getElementById('openLoginBtn');
    closeLoginModal = document.getElementById('closeLoginModal');
    btnLoginAction = document.getElementById('btnLoginAction');
    btnSignupAction = document.getElementById('btnSignupAction');
    
    // Deposit Modal elements
    closeDepositModal = document.getElementById('closeDepositModal');
    btnSubmitDeposit = document.getElementById('btnSubmitDeposit');
    depCoinSelect = document.getElementById('depCoinSelect');
    depAmountPKR = document.getElementById('depAmountPKR');
    depCoinEst = document.getElementById('depCoinEst');
    depHistoryList = document.getElementById('depHistoryList');
}

function attachListeners() {
    // Global Listeners
    closeLoginModal.addEventListener('click', closeAllModals);
    closeDepositModal.addEventListener('click', closeAllModals);
    openLoginBtn.addEventListener('click', () => { closeAllModals(); loginModal.style.display = 'flex'; });

    // Header Deposit Button
    openDepositModalHeader.addEventListener('click', () => {
        closeAllModals(); 
        if(!currentUser) { 
            loginModal.style.display = 'flex'; 
            alert("Please login first."); 
            return; 
        }
        populateDepDropdown();
        depositModal.style.display = 'flex';
        if (currentUser) {
            listenToDeposits(currentUser.uid);
        }
    });

    // Login/Signup Actions
    btnLoginAction.addEventListener('click', handleLogin);
    btnSignupAction.addEventListener('click', handleSignup);

    // Deposit Form Actions
    depAmountPKR.addEventListener('keyup', updateDepEst);
    depCoinSelect.addEventListener('change', updateDepEst);
    btnSubmitDeposit.addEventListener('click', submitDeposit);
    document.getElementById('downloadImageBtn').addEventListener('click', downloadDepositImage);

    // Initial Auth State Check
    onAuthStateChanged(auth, handleAuthStateChange);
}

// --- Handlers ---

async function handleLogin() {
    const email = document.getElementById('emailInput').value;
    const pass = document.getElementById('passInput').value;
    try { 
        await signInWithEmailAndPassword(auth, email, pass); 
        closeAllModals(); 
        depositModal.style.display = 'flex'; 
        populateDepDropdown();
    } 
    catch (e) { 
        document.getElementById('loginErrorMsg').innerText = e.message; 
        document.getElementById('loginErrorMsg').style.display = 'block'; 
    }
}

async function handleSignup() {
    const email = document.getElementById('emailInput').value;
    const pass = document.getElementById('passInput').value;
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", cred.user.uid), { email: email, coins: 0, referralCount: 0, referredBy: null, createdAt: new Date() });
        closeAllModals();
        depositModal.style.display = 'flex'; 
        populateDepDropdown();
    } catch (e) { 
        document.getElementById('loginErrorMsg').innerText = e.message; 
        document.getElementById('loginErrorMsg').style.display = 'block'; 
    }
}

function handleAuthStateChange(user) {
    currentUser = user;
    if(user) {
        const initial = user.email ? user.email[0].toUpperCase() : "U";
        userDisplay.innerHTML = `<div class="profile-img">${initial}</div><div><button class="login-btn logout-btn" onclick="logoutApp()">Logout</button></div>`;
        listenToUserWallet(user.uid);
    } else {
        userHoldings = {};
        // Re-attach login button listener if user logs out
        userDisplay.innerHTML = `<button class="login-btn" id="openLoginBtn2">🔑 Login</button>`;
        document.getElementById('openLoginBtn2').addEventListener('click', () => { closeAllModals(); loginModal.style.display = 'flex'; });
        headerWallet.innerHTML = `0 <span class="coin-suffix">Coins</span>`;
        renderWalletDashboard();
        depHistoryList.innerHTML = "Login to view history";
    }
}

window.logoutApp = () => signOut(auth);

// --- Data Listeners & Render Functions ---

onSnapshot(collection(db, "coins"), (snap) => {
    globalCoinsData = [];
    snap.forEach(d => globalCoinsData.push(d.data()));
    renderWalletDashboard();
    if (depositModal.style.display === 'flex') {
        populateDepDropdown();
    }
});

function listenToUserWallet(uid) {
    onSnapshot(doc(db, "users", uid), (docSnap) => {
        if(docSnap.exists()) userHoldings = docSnap.data();
        headerWallet.innerHTML = `${formatCompact(userHoldings.coins || 0)} <span class="coin-suffix">Coins</span>`;
        renderWalletDashboard();
    });
}

function renderWalletDashboard() {
    if (globalCoinsData.length === 0) {
        walletTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">Fetching coin data...</td></tr>';
        return;
    }

    if (!currentUser) {
        walletTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#555;">Please log in to see your coin balances.</td></tr>';
        return;
    }

    let html = "";
    globalCoinsData.sort((a, b) => {
        const qtyA = userHoldings[getDbField(a.id)] || 0;
        const qtyB = userHoldings[getDbField(b.id)] || 0;
        return (b.price * qtyB) - (a.price * qtyA);
    });

    globalCoinsData.forEach(coin => {
        const qty = userHoldings[getDbField(coin.id)] || 0;

        html += `
            <tr>
                <td><span class="coin-symbol">${coin.symbol}</span><div style="font-size:0.8em; color:#666">${coin.name}</div></td>
                <td class="coin-rate">PKR ${coin.price.toFixed(4)}</td>
                <td class="coin-balance">${formatCompact(qty)}</td> 
            </tr>
        `;
    });
    walletTableBody.innerHTML = html;
}

// --- DEPOSIT FORM FUNCTIONS ---

function populateDepDropdown() {
    if(globalCoinsData.length === 0 || !depCoinSelect) return;

    globalCoinsData.sort((a, b) => (a.id === 'main' ? -1 : 1));
    
    let opts = globalCoinsData.map(c => `<option value="${c.id}" data-price="${c.price}">${c.name} (${c.symbol})</option>`).join('');
    depCoinSelect.innerHTML = opts;
    updateDepEst();
}

function updateDepEst() {
    if (!depAmountPKR || !depCoinSelect || !depCoinEst) return;

    const pkr = parseFloat(depAmountPKR.value);
    if(!pkr || pkr <= 0) { depCoinEst.innerText = "You Get: 0 Coins"; return; }
    
    const selectedOption = depCoinSelect.selectedOptions[0];
    if (!selectedOption) { depCoinEst.innerText = "You Get: 0 Coins (Select Coin)"; return; }

    const rate = parseFloat(selectedOption.getAttribute('data-price'));
    const coins = pkr / rate;
    const symbol = getCoinSymbol(depCoinSelect.value);
    
    depCoinEst.innerText = `You Get: ≈ ${Math.floor(coins).toLocaleString()} ${symbol}`;
}

async function submitDeposit() {
    const depTrxId = document.getElementById('depTrxId');
    const depSenderName = document.getElementById('depSenderName');
    const depSenderAccount = document.getElementById('depSenderAccount');
    const depMethod = document.getElementById('depMethod');
    const depSuccessMsg = document.getElementById('depSuccessMsg');
    const depErrorMsg = document.getElementById('depErrorMsg');

    if (!currentUser || !depAmountPKR) { depErrorMsg.innerText = "Login error or form not loaded."; depErrorMsg.style.display = 'block'; return; }

    const pkr = parseFloat(depAmountPKR.value);
    const trx = depTrxId.value;
    const senderName = depSenderName.value;
    const senderAccount = depSenderAccount.value;
    const method = depMethod.value;
    const coinId = depCoinSelect.value;

    if(!pkr || pkr < 100 || !trx || !senderName || !senderAccount) { 
        depErrorMsg.innerText = "Please fill all fields and ensure PKR amount is valid (Min 100 PKR)."; 
        depErrorMsg.style.display='block'; depSuccessMsg.style.display='none'; return; 
    }

    const rate = parseFloat(depCoinSelect.selectedOptions[0].getAttribute('data-price'));
    const coins = Math.floor(pkr / rate);
    const coinSymbol = getCoinSymbol(coinId);

    try {
        await addDoc(collection(db, "deposits"), {
            userId: currentUser.uid,
            email: currentUser.email,
            method: method,
            amountPKR: pkr,
            coinsRequested: coins,
            coinId: coinId,
            coinSymbol: coinSymbol,
            trxId: trx,
            senderName: senderName,
            senderAccount: senderAccount,
            status: "Pending",
            timestamp: new Date()
        });

        depSuccessMsg.innerText = "Deposit Submitted! Wait for Admin Approval."; 
        depSuccessMsg.style.display='block';
        depErrorMsg.style.display='none';
        
        depAmountPKR.value = ''; depTrxId.value = '';
        depCoinEst.innerText = "You Get: 0 Coins"; 

    } catch(e) { 
        depErrorMsg.innerText = "Submission Error: " + e.message; 
        depErrorMsg.style.display='block'; depSuccessMsg.style.display='none';
    }
}

function listenToDeposits(uid) {
    if (!depHistoryList) return; 
    
    const q = query(collection(db, "deposits"), where("userId", "==", uid), orderBy("timestamp", "desc"), limit(10));
    onSnapshot(q, (snap) => {
        if(snap.empty) { depHistoryList.innerHTML = "<div style='text-align:center; color:#555'>No history found.</div>"; return; }
        let html = "";
        
        snap.forEach(docSnap => {
            const d = docSnap.data();
            const date = d.timestamp ? new Date(d.timestamp.seconds * 1000).toLocaleString() : 'N/A';
            const rejectionReason = d.status === 'Rejected' && d.reason ? `<div style="color:#f44336; font-size:0.7em; font-style:italic;'>Reason: ${d.reason}</div>` : '';
            const coinsRequested = d.coinsRequested || 0;
            const amountPKR = d.amountPKR || 0;

            html += `<div class="history-item">
                <div>
                    <div style="font-weight:bold; color:#fff;">${amountPKR.toLocaleString()} PKR (${d.method || 'N/A'})</div>
                    <div style="color:#4caf50; font-size:0.8em;">+${coinsRequested.toLocaleString()} ${d.coinSymbol || 'Coins'}</div>
                    ${rejectionReason}
                </div>
                <div style="text-align:right">
                    <span class="badge badge-${d.status}">${d.status}</span>
                    <div style="color:#666; font-size:0.7em;">${date}</div>
                </div>
            </div>`;
        });
        depHistoryList.innerHTML = html;
    });
}

function downloadDepositImage() {
    const imageURL = document.getElementById('depositImage').src;
    const a = document.createElement('a');
    a.href = imageURL;
    a.download = 'Deposit_Guide.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    attachListeners();
});
