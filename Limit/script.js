import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, setDoc, addDoc, updateDoc, increment, query, where, getDocs, serverTimestamp, orderBy } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// --- CONFIG ---
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

// --- CONSTANTS ---
const MAX_WITHDRAWAL_LIMIT_BASE = 59000000;
const MAX_WITHDRAWAL_LIMIT_INCREASED = 120000000;
const LIMIT_INCREASE_PRICE = 8000;
const DISCOUNT_CARD_PRICE = 100; 
const INITIAL_COIN_BALANCE = 100000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // For Base Limit Withdrawal Frequency
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000; 
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000; 
const ADMIN_WHATSAPP_NUMBER = "923437269309"; // Pakistan format (92 country code)
        
let mainCoinRate = 0.0001; 

// --- Ticker Data ---
let tickerNames = [
    "Ali R.", "Zoya Khan", "Muhammad T.", "Aliza B.", "Sana", "Faisal A.", "Aisha", "Kamran", "Bilal", "Usman",
    "Hina M.", "Zubair S.", "Fatima", "Imran", "Javed", "Sajid", "Nadia", "Tariq", "Amna", "Shehzad",
    "Mariam", "Waqas", "Nida", "Rizwan", "Farah", "Ghani", "Iqbal", "Kiran", "Laila", "Noman",
    "Osman", "Qasim", "Rameen", "Saif", "Tuba", "Umar", "Vaqas", "Yasmin", "Zahid", "Zainab",
    "Ahmed F.", "Dua Z.", "Ehsan M.", "Gohar K.", "Hassaan", "Isha P.", "Junaid B.", "Khadija", "Marium", "Noor",
"Ali R.", "Zoya Khan", "Muhammad T.", "Aliza B.", "Sana", "Faisal A.", "Aisha", "Kamran", "Bilal", "Usman",
"Hina M.", "Zubair S.", "Fatima", "Imran", "Javed", "Sajid", "Nadia", "Tariq", "Amna", "Shehzad",
"Mariam", "Waqas", "Nida", "Rizwan", "Farah", "Ghani", "Iqbal", "Kiran", "Laila", "Noman",
"Osman", "Qasim", "Rameen", "Saif", "Tuba", "Umar", "Vaqas", "Yasmin", "Zahid", "Zainab",
"Ahmed F.", "Dua Z.", "Ehsan M.", "Gohar K.", "Hassaan", "Isha P.", "Junaid B.", "Khadija", "Marium", "Noor",

"Arslan", "Anum", "Babar A.", "Bushra", "Danish", "Dua F.", "Eman", "Fahad", "Fatima B.", "Gulzar",
"Hafsa", "Haroon", "Hassan", "Inaya", "Iqra", "Javed R.", "Kashif", "Komal", "Laiba", "Muneeb",
"Nashit", "Noreen", "Omair", "Parveen", "Rabia", "Rashid", "Saba", "Sameer", "Shahid", "Shazia",
"Tariq H.", "Tehseen", "Umair", "Uzma", "Waseem", "Wardah", "Yasir", "Yumna", "Zaeem", "Zoya F.",

"Adeel", "Areeba", "Asim", "Afra", "Basit", "Bushra K.", "Chaudhry", "Dania", "Ehtesham", "Fawad",
"Gul", "Hamza", "Huma", "Irfan", "Ishrat", "Javeria", "Kaleem", "Kanwal", "Lubna", "Mahnoor",
"Nasir", "Nida H.", "Owais", "Palwasha", "Qamar", "Quratulain", "Rabeea", "Rameesha", "Sana K.", "Sami",
"Tahir", "Talia", "Ubaid", "Uzair", "Vian", "Waqar", "Wali", "Yasir R.", "Zara", "Zubair A.",

"Ahmad", "Amna H.", "Asma", "Ather", "Bisma", "Burhan", "Dua R.", "Faisal R.", "Faryal", "Ghulam",
"Hafeez", "Hira", "Humaira", "Imtiaz", "Iqbal S.", "Jahanzaib", "Kiran H.", "Komal R.", "Laeeq", "Lubna A.",
"Muhsin", "Mahrukh", "Nashra", "Noman K.", "Omar S.", "Parvez", "Qasim A.", "Rabia S.", "Rashida", "Sadaf",
"Sajida", "Sohail", "Tania", "Tariq S.", "Umar F.", "Uzma H.", "Wali A.", "Waqas H.", "Yumna R.", "Zubair K.",

"Aamir", "Ayesha F.", "Aliya", "Asif", "Bilal H.", "Bushra S.", "Dania H.", "Ehsan R.", "Fahim", "Farah S.",
"Gulzar H.", "Hamza R.", "Huma F.", "Imran S.", "Iqra H.", "Junaid R.", "Kashif A.", "Komal S.", "Laiba H.", "Muneeb R.",
"Nashit A.", "Noreen H.", "Omair R.", "Parveen S.", "Rabia H.", "Rashid A.", "Saba H.", "Sameer A.", "Shahid R.", "Shazia H.",
"Tariq A.", "Tehseen H.", "Umair A.", "Uzma H.", "Waqar A.", "Wardah H.", "Yasir A.", "Yumna H.", "Zaeem A.", "Zoya H."
];
let currentTickerIndex = 0;


// --- ELEMENTS & STATE (Variables) ---
const loginModal = document.getElementById('loginModal');
const fastOrderModal = document.getElementById('fastOrderModal'); 
const discountCardModal = document.getElementById('discountCardModal'); 
const generateDiscountCardModal = document.getElementById('generateDiscountCardModal');
const discountStatusText = document.getElementById('discountStatusText'); 
const discountCardActionBtn = document.getElementById('discountCardActionBtn'); 
const discountCardDisplay = document.getElementById('discountCardDisplay'); 
const wdAmount = document.getElementById('wdAmount');
const wdTaxDisplay = document.getElementById('wdTaxDisplay');
const wdPkrEst = document.getElementById('wdPkrEst');
const depAmountPKR = document.getElementById('depAmountPKR');
const depCoinEst = document.getElementById('depCoinEst');
const wdAvailBal = document.getElementById('wdAvailBal');
const wdLimitInfo = document.getElementById('wdLimitInfo');
const btnLoginAction = document.getElementById('btnLoginAction');
const btnSignupAction = document.getElementById('btnSignupAction');
const btnSubmitFastOrder = document.getElementById('btnSubmitFastOrder'); 
const btnSubmitDiscountCard = document.getElementById('btnSubmitDiscountCard'); 
const btnSubmitWithdraw = document.getElementById('btnSubmitWithdraw');
const btnSubmitDeposit = document.getElementById('btnSubmitDeposit');
const btnSubmitLimitIncrease = document.getElementById('btnSubmitLimitIncrease');
const btnGenerateDiscountCard = document.getElementById('btnGenerateDiscountCard'); 

let userHoldings = {};
let currentUser = null;
let unsubscribeWallet = null;
let unsubscribeWD = null;
let unsubscribeDep = null;
let unsubscribeLimit = null;
let unsubscribeOrders = null;


// --- CORE HELPER FUNCTIONS ---
const closeAllModals = () => {
    [loginModal, fastOrderModal, discountCardModal, generateDiscountCardModal, document.getElementById('withdrawModal'), document.getElementById('depositModal'), document.getElementById('limitIncreaseModal')].forEach(m => { if(m) m.style.display = 'none'; });
    document.getElementById('wdErrorMsg').style.display='none';
    document.getElementById('wdSuccessMsg').style.display='none';
    document.getElementById('loginErrorMsg').style.display='none';
    document.getElementById('depErrorMsg').style.display='none';
    document.getElementById('depSuccessMsg').style.display='none';
    document.getElementById('limitErrorMsg').style.display='none';
    document.getElementById('limitSuccessMsg').style.display='none';
    document.getElementById('orderErrorMsg').style.display='none';
    document.getElementById('orderSuccessMsg').style.display='none';
    document.getElementById('discountErrorMsg').style.display='none';
    document.getElementById('discountSuccessMsg').style.display='none';
    document.getElementById('generateCardErrorMsg').style.display='none'; 
};
window.logoutApp = () => signOut(auth).catch(e => console.error("Logout error:", e));

// --- WHATSAPP CHAT LOGIC (NEW) ---
window.openWhatsAppChat = () => {
    const userEmail = currentUser ? currentUser.email : "Not Logged In";
    const initialMessage = encodeURIComponent(`Hello Admin, I need assistance.
    
My User Email/ID: ${userEmail}
1. Withdrawal status?
2. Limit Increase approval?
3. Other Query: 

-- Please type your question above this line --`);

    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${initialMessage}`;
    window.open(whatsappUrl, '_blank');
};


// --- LIVE WITHDRAWAL TICKER LOGIC ---
function showRandomWithdrawal() {
    const ticker = document.getElementById('withdrawalTicker');
    if (!ticker) return;

    const name = tickerNames[currentTickerIndex];
    currentTickerIndex = (currentTickerIndex + 1) % tickerNames.length;
    
    const randomAmount = (Math.floor(Math.random() * 4500000) + 500000).toLocaleString(); 

    ticker.innerHTML = `
        <div class="ticker-message">
            <i class="fas fa-check-circle"></i> Withdrawal Successful: ${name} just received ${randomAmount} coins!
        </div>
    `;
    const message = ticker.querySelector('.ticker-message');
    
    setTimeout(() => {
        message.classList.add('show');
    }, 50);

    setTimeout(() => {
        message.classList.remove('show');
    }, 4000); 
}

function startWithdrawalTicker() {
    showRandomWithdrawal();
    setInterval(showRandomWithdrawal, 5000);
}

// --- HISTORY TOGGLE FUNCTION ---
function toggleHistory(event) {
    const header = event.currentTarget;
    const targetId = header.getAttribute('data-target');
    const content = document.getElementById(targetId);
    const icon = header.querySelector('.toggle-icon');

    if (content.classList.contains('active')) {
        content.classList.remove('active');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    } else {
        content.classList.add('active');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    }
}

// Helper to copy text
window.copyCardNumber = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Discount Card Number ${text} copied!`);
    }).catch(err => {
        console.error('Could not copy text: ', err);
        alert('Could not copy text. Please copy manually.');
    });
};


// --- UI UPDATES & EXPIRY CHECK ---

function renderDiscountCard(userData) {
    const expiryDate = userData.discountExpiry?.toDate();
    const validUntil = expiryDate ? expiryDate.toLocaleDateString() : 'N/A';
    const statusColor = (expiryDate && expiryDate.getTime() > Date.now()) ? 'white' : 'yellow';
    
    const cardNumber = userData.cardIDCard ? userData.cardIDCard.replace(/-/g, '') : 'N/A';
    
    discountCardDisplay.innerHTML = `
        <div class="card-header"><i class="fas fa-tag"></i> PREMIUM DISCOUNT CARD</div>
        <div class="card-detail"><strong>Name:</strong> ${userData.cardHolderName || 'N/A'}</div>
        <div class="card-detail"><strong>Father Name:</strong> ${userData.cardFatherName || 'N/A'}</div>
        <div class="card-detail">
            <strong>Card No:</strong> 
            <span id="discountCardNumberSpan">${cardNumber}</span>
            <button class="copy-btn" onclick="copyCardNumber('${cardNumber}')">
                <i class="fas fa-copy"></i> Copy
            </button>
        </div>
        <div class="card-validity" style="color: ${statusColor};">VALID UNTIL: ${validUntil}</div>
    `;
    discountCardDisplay.style.display = 'block';
}

function updateDiscountCardUI() {
    if (!currentUser) {
        discountStatusText.innerText = "Login to check status";
        discountCardActionBtn.innerText = "Login";
        discountCardActionBtn.onclick = () => { closeAllModals(); document.getElementById('loginModal').style.display = 'flex'; };
        discountCardDisplay.style.display = 'none';
        return;
    }

    const expiryTime = userHoldings.discountExpiry?.toDate();
    const isDiscountActive = expiryTime && expiryTime.getTime() > Date.now();
    const cardDetailsExist = userHoldings.cardHolderName && userHoldings.cardIDCard;
    
    if (isDiscountActive && cardDetailsExist) {
        discountStatusText.innerText = `Active until: ${expiryTime.toLocaleDateString()}`;
        discountCardActionBtn.innerText = "View Card (Active)";
        discountCardActionBtn.style.background = 'var(--secondary-color)';
        discountCardActionBtn.onclick = () => { renderDiscountCard(userHoldings); };
        renderDiscountCard(userHoldings);
        
    } else if (!isDiscountActive && cardDetailsExist) {
        discountStatusText.innerText = `Expired on: ${expiryTime?.toLocaleDateString() || 'N/A'}`;
        discountCardActionBtn.innerText = "Re-Purchase (100 PKR)";
        discountCardActionBtn.style.background = 'var(--danger-color)';
        discountCardActionBtn.onclick = () => { closeAllModals(); document.getElementById('discountCardModal').style.display = 'flex'; };
        renderDiscountCard(userHoldings);

    } else if (userHoldings.discountExpiry === null && userHoldings.cardHolderName) {
        discountStatusText.innerText = "Card Generated. Awaiting Activation.";
        discountCardActionBtn.innerText = "Contact Admin (Pending)";
        discountCardActionBtn.style.background = 'gray';
        discountCardActionBtn.onclick = () => { alert("Your card is generated. If you paid 100 PKR, please wait for admin approval."); };
        renderDiscountCard(userHoldings);

    } else if (userHoldings.discountExpiry === null && !cardDetailsExist) {
        discountStatusText.innerText = "Generate Your Card Details";
        discountCardActionBtn.innerText = "Generate Card Now";
        discountCardActionBtn.style.background = 'var(--accent-color)';
        discountCardActionBtn.onclick = () => { closeAllModals(); generateDiscountCardModal.style.display = 'flex'; };
        discountCardDisplay.style.display = 'none';
    
    } else {
        discountStatusText.innerText = "1 Year Discount Validity";
        discountCardActionBtn.innerText = "Buy Now (100 PKR)";
        discountCardActionBtn.style.background = 'var(--primary-color)';
        discountCardActionBtn.onclick = () => { closeAllModals(); document.getElementById('discountCardModal').style.display = 'flex'; };
        discountCardDisplay.style.display = 'none';
    }
}

function updateAuthStateUI(user) {
    currentUser = user;
    if (user) {
        document.querySelector('.auth-controls').innerHTML = `<button class="logout-btn" onclick="logoutApp()">Logout</button>`;
        document.getElementById('userDisplay').innerHTML = `
            <div class="profile-img">${user.email.charAt(0).toUpperCase()}</div>
            <div style="flex-grow: 1; margin-left: 10px; text-align: left;">
                <div style="font-weight: 500;">${user.email}</div>
                <div style="font-size: 0.8em; color: #666;">UID: ${user.uid.substring(0, 8)}...</div>
            </div>
            <button class="logout-btn" onclick="logoutApp()">Logout</button>
        `;
        
        listenToUserWallet(user.uid);
        listenToWithdrawals(user.uid);
        listenToDeposits(user.uid);
        listenToLimitIncreases(user.uid);
        listenToOrders(user.uid); 
        
    } else {
        document.querySelector('.auth-controls').innerHTML = `<button id="openLoginBtn">Sign In / Up</button>`;
        document.getElementById('openLoginBtn').onclick = () => { closeAllModals(); document.getElementById('loginModal').style.display = 'flex'; };
        
        document.getElementById('userDisplay').innerHTML = `<p style="margin: 0;">Not Logged In</p>`;
        
        userHoldings = {};
        if (unsubscribeWallet) unsubscribeWallet();
        if (unsubscribeWD) unsubscribeWD();
        if (unsubscribeDep) unsubscribeDep();
        if (unsubscribeLimit) unsubscribeLimit();
        if (unsubscribeOrders) unsubscribeOrders(); 
        
        document.getElementById('headerWallet').innerHTML = `0 <span class="coin-suffix">Coins</span>`;
        document.getElementById('user-coin-balance').innerHTML = `0.00 <span class="coin-suffix">COINS</span>`;
        document.getElementById('wdAvailBal').innerText = `Available: 0 Coins`;

        document.querySelectorAll('.tracking-content').forEach(content => {
            content.classList.remove('active');
            content.parentElement.querySelector('.toggle-icon')?.classList.remove('fa-chevron-up');
            content.parentElement.querySelector('.toggle-icon')?.classList.add('fa-chevron-down');
        });
    }
    
    document.getElementById('profile-icon').onclick = () => {
        const details = document.getElementById('profile-details');
        if (details) details.style.display = details.style.display === 'block' ? 'none' : 'block';
    };
}

function listenToUserWallet(uid) {
    if (unsubscribeWallet) unsubscribeWallet();
    unsubscribeWallet = onSnapshot(doc(db, "users", uid), (docSnap) => {
        if(docSnap.exists()) userHoldings = docSnap.data();
        else userHoldings = {};
        
        const mainCoinBalance = userHoldings.coins || 0;
        const formattedBalance = mainCoinBalance.toLocaleString(undefined, { maximumFractionDigits: 2 });
        
        document.getElementById('headerWallet').innerHTML = `${formattedBalance} <span class="coin-suffix">Coins</span>`;
        document.getElementById('user-coin-balance').innerHTML = `${formattedBalance} <span class="coin-suffix">COINS</span>`;
        document.getElementById('wdAvailBal').innerText = `Available: ${formattedBalance} Coins`;
        
        updateLimitDisplay();
        updateWdEst();
        updateDiscountCardUI(); 
    });
}

function updateLimitDisplay() {
    const wdLimitInfo = document.getElementById('wdLimitInfo');
    if (!wdLimitInfo) return;
    const isLimitIncreased = userHoldings.limitIncreased === true;
    const isFirstWithdrawalDone = userHoldings.firstWithdrawalDone === true;
    const expiryTime = userHoldings.limitIncreaseExpiry?.toDate(); 
    const isExpired = expiryTime && expiryTime.getTime() < Date.now();
    let limit;

    if (isLimitIncreased && !isExpired) {
        limit = MAX_WITHDRAWAL_LIMIT_INCREASED;
        wdLimitInfo.innerHTML = `Current Daily Limit: <strong>${limit.toLocaleString()} Coins (VIP Active)</strong>. Expires: ${expiryTime.toLocaleDateString()}.`;
        wdLimitInfo.style.color = '#4caf50';
    } else if (isFirstWithdrawalDone) {
        limit = 0; 
        if (isLimitIncreased && isExpired) {
            wdLimitInfo.innerHTML = `<strong>Limit Expired on ${expiryTime.toLocaleDateString()}!</strong> Purchase Boost again.`;
        } else {
            wdLimitInfo.innerHTML = `<strong>Withdrawal Locked!</strong> You used the Base Limit. Purchase Limit Boost to continue.`;
        }
        wdLimitInfo.style.color = '#dc3545';
    } else {
        limit = MAX_WITHDRAWAL_LIMIT_BASE;
        wdLimitInfo.innerHTML = `Current Daily Limit: <strong>${limit.toLocaleString()} Coins (Base Limit)</strong>. One-time use before lock.`;
        wdLimitInfo.style.color = '#ff9800';
    }
}


// --- LISTENERS TO DATABASE (History Logic) ---

function updateWdEst() { 
     const wdAmount = document.getElementById('wdAmount');
     const wdTaxDisplay = document.getElementById('wdTaxDisplay');
     const wdPkrEst = document.getElementById('wdPkrEst');
     if (!wdAmount || !wdTaxDisplay || !wdPkrEst) return;
     const amt = parseFloat(wdAmount.value);
    
     if(!amt || amt <= 0) { 
        wdPkrEst.innerText = "Total Value: PKR 0.00"; 
        wdTaxDisplay.innerHTML = `<div>Fee (20%): <span style="color:#f44336">0</span></div><div>Net Receive: <span style="color:#4caf50">0</span></div>`;
        return; 
     }
    
     const fee = amt * 0.20;
     const netCoins = amt - fee;
     const netPkr = netCoins * mainCoinRate; 

     wdTaxDisplay.innerHTML = `
        <div>Fee (20%): <span style="color:#f44336">-${fee.toFixed(0).toLocaleString()}</span></div>
        <div>Net Receive: <span style="color:#4caf50">${netCoins.toFixed(0).toLocaleString()} Coins</span></div>
     `;
     wdPkrEst.innerText = `Total Value (PKR Est.): PKR ${netPkr.toLocaleString(undefined, {minimumFractionDigits: 2})} (Rate: ${mainCoinRate.toFixed(4)})`;
}

function updateDepEstUI() {
    const depAmountPKR = document.getElementById('depAmountPKR');
    const depCoinEst = document.getElementById('depCoinEst');
     if (!depAmountPKR || !depCoinEst) return;
     const pkr = parseFloat(depAmountPKR.value);
     if(!pkr || pkr <= 0 || mainCoinRate === 0) { depCoinEst.innerText = "You Get: 0 Coins"; return; }
     
     const coins = pkr / mainCoinRate;
     depCoinEst.innerText = `You Get: ≈ ${coins.toLocaleString(undefined, {maximumFractionDigits: 0})} Coins (Rate: ${mainCoinRate.toFixed(4)} PKR)`;
}

function listenToMainCoinRate() {
    const mainCoinRef = doc(db, "coins", "main");
    onSnapshot(mainCoinRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            mainCoinRate = data.price || 0.0001; 
            updateWdEst(); // Trigger withdrawal update on rate change
            updateDepEstUI(); 
        } else {
             mainCoinRate = 0.0001; 
        }
    });
}

function listenToWithdrawals(uid) {
    const wdHistoryList = document.getElementById('wdHistoryList');
    if (unsubscribeWD) unsubscribeWD();
    const q = query(collection(db, "withdrawals"), where("userId", "==", uid), orderBy("timestamp", "desc"));
    unsubscribeWD = onSnapshot(q, (snap) => {
        if(snap.empty) { wdHistoryList.innerHTML = "<p>No recent withdrawal requests.</p>"; return; }
        
        let html = "";
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const statusClass = data.status === 'Approved' ? 'status-approved' : (data.status === 'Pending' ? 'status-pending' : 'status-rejected');
            const timestamp = data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
            
            html += `<div class="tracking-item">
                        <div><div style="font-weight:bold;">${data.amount?.toLocaleString() || 'N/A'} MC</div><div style="font-size:0.9em;">Method: ${data.method}</div></div>
                        <div style="text-align:right"><span class="status-badge ${statusClass}">${data.status}</span><div style="color:#666; font-size:0.8em;">${timestamp}</div></div>
                    </div>`;
        });
        wdHistoryList.innerHTML = html;
    });
}

function listenToDeposits(uid) {
    const depHistoryList = document.getElementById('depHistoryList');
    if (unsubscribeDep) unsubscribeDep();
    const q = query(collection(db, "deposits"), where("userId", "==", uid), orderBy("timestamp", "desc"));
    unsubscribeDep = onSnapshot(q, (snap) => {
        if(snap.empty) { depHistoryList.innerHTML = "<p>No recent deposit requests.</p>"; return; }
        
        let html = "";
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const statusClass = data.status === 'Approved' ? 'status-approved' : (data.status === 'Pending' ? 'status-pending' : 'status-rejected');
            const timestamp = data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
            
            html += `<div class="tracking-item">
                        <div><div style="font-weight:bold;">${data.amountPKR} PKR</div><div style="color:#28a745; font-size:0.9em;">Coins: ${data.coinsRequested?.toLocaleString() || 'N/A'}</div></div>
                        <div style="text-align:right"><span class="status-badge ${statusClass}">${data.status}</span><div style="color:#666; font-size:0.8em;">${timestamp}</div></div>
                    </div>`;
        });
        depHistoryList.innerHTML = html;
    });
}

function listenToLimitIncreases(uid) {
    const limitHistoryList = document.getElementById('limitHistoryList');
    if (unsubscribeLimit) unsubscribeLimit();
    const q = query(collection(db, "limitIncreases"), where("userId", "==", uid), orderBy("timestamp", "desc"));
    unsubscribeLimit = onSnapshot(q, (snap) => {
        if(snap.empty) { limitHistoryList.innerHTML = "<p>No limit increase requests.</p>"; return; }
        
        let html = "";
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const statusClass = data.status === 'Approved' ? 'status-approved' : (data.status === 'Pending' ? 'status-pending' : 'status-rejected');
            const timestamp = data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
            
            html += `<div class="tracking-item">
                        <div><div style="font-weight:bold;">${data.amountPKR} PKR (Limit Boost)</div></div>
                        <div style="text-align:right"><span class="status-badge ${statusClass}">${data.status}</span><div style="color:#666; font-size:0.8em;">${timestamp}</div></div>
                    </div>`;
        });
        limitHistoryList.innerHTML = html;
    });
}

function listenToOrders(uid) {
    const ordersHistoryList = document.getElementById('ordersHistoryList');
    if (unsubscribeOrders) unsubscribeOrders();
    const q = query(collection(db, "customOrders"), where("userId", "==", uid), orderBy("timestamp", "desc"));
    unsubscribeOrders = onSnapshot(q, (snap) => {
        if(snap.empty) { ordersHistoryList.innerHTML = "<p>No custom orders submitted.</p>"; return; }
        
        let html = "";
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const statusClass = data.status === 'Approved' ? 'status-approved' : (data.status === 'Pending' ? 'status-pending' : 'status-rejected');
            const timestamp = data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
            
            html += `<div class="tracking-item">
                        <div><div style="font-weight:bold;">${data.productName.substring(0, 30)}...</div><div style="font-size:0.9em;">Category: ${data.category}</div></div>
                        <div style="text-align:right"><span class="status-badge ${statusClass}">${data.status}</span><div style="color:#666; font-size:0.8em;">${timestamp}</div></div>
                    </div>`;
        });
        ordersHistoryList.innerHTML = html;
    });
}


// --- AUTHENTICATION & SUBMISSION HANDLERS ---
async function handleLogin() {
    const emailInput = document.getElementById('emailInput');
    const passInput = document.getElementById('passInput');
    const errorMsg = document.getElementById('loginErrorMsg');
    errorMsg.style.display = 'none';

    const email = emailInput?.value.trim();
    const pass = passInput?.value;

    if (!email || !pass) { errorMsg.innerText = "Please enter email and password."; errorMsg.style.display = 'block'; return; }

    try { 
        await signInWithEmailAndPassword(auth, email, pass); 
        closeAllModals(); 
    } catch (e) { 
        errorMsg.innerText = "Login Failed: " + e.message; 
        errorMsg.style.display = 'block'; 
    }
}

async function handleSignup() {
    const emailInput = document.getElementById('emailInput');
    const passInput = document.getElementById('passInput');
    const errorMsg = document.getElementById('loginErrorMsg');
    errorMsg.style.display = 'none';
    
    const email = emailInput?.value.trim();
    const pass = passInput?.value;

    if (!email || !pass || pass.length < 6) { errorMsg.innerText = "Please enter a valid email and password (min 6 chars)."; errorMsg.style.display = 'block'; return; }

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        await setDoc(doc(db, "users", cred.user.uid), { 
            email: email, 
            coins: INITIAL_COIN_BALANCE, 
            referralCount: 0, 
            referredBy: refCode || null, 
            limitIncreased: false,
            firstWithdrawalDone: false, 
            discountExpiry: null, 
            discountCardNumber: null, // Initialized
            createdAt: serverTimestamp() 
        });
        
        if(refCode) { try { const refUserRef = doc(db, "users", refCode); await updateDoc(refUserRef, { referralCount: increment(1) }); } catch(e) { console.warn("Referral update failed:", e); } }
        
        closeAllModals();
    } catch (e) { 
        errorMsg.innerText = "Signup Failed: " + e.message; 
        errorMsg.style.display = 'block'; 
    }
}

async function handleSubmitFastOrder() {
    if (!currentUser) { document.getElementById('orderErrorMsg').innerText = "Please log in first."; document.getElementById('orderErrorMsg').style.display='block'; return; }
    
    const orderErrorMsg = document.getElementById('orderErrorMsg');
    const orderSuccessMsg = document.getElementById('orderSuccessMsg');

    orderErrorMsg.style.display = 'none';
    orderSuccessMsg.style.display = 'none';

    const name = document.getElementById('orderName')?.value.trim();
    const fatherName = document.getElementById('orderFatherName')?.value.trim();
    const whatsapp = document.getElementById('orderWhatsapp')?.value.trim();
    const email = document.getElementById('orderEmail')?.value.trim();
    const category = document.getElementById('orderCategory')?.value;
    const productName = document.getElementById('orderProductName')?.value.trim();
    const productLink = document.getElementById('orderProductLink')?.value.trim(); 
    const discountCode = document.getElementById('orderDiscountCode')?.value.trim();
    const address = document.getElementById('orderAddress')?.value.trim();
    const idCard = document.getElementById('orderIDCard')?.value.trim();

    if (!name || !fatherName || !whatsapp || !email || !category || !productName) {
        orderErrorMsg.innerText = "Please fill all required fields (Name, Father Name, WhatsApp, Email, Category, Product Details).";
        orderErrorMsg.style.display = 'block';
        return;
    }

    const expiryTime = userHoldings.discountExpiry?.toDate();
    const isDiscountActive = expiryTime && expiryTime.getTime() > Date.now();
    let appliedDiscount = 0;
    
    if (discountCode && isDiscountActive) {
        appliedDiscount = 0.20; 
    }

    try {
        await addDoc(collection(db, "customOrders"), {
            userId: currentUser.uid,
            submitterEmail: currentUser.email,
            name, fatherName, whatsapp, email, category, productName,
            productLink: productLink || 'N/A', 
            discountCode: discountCode || 'N/A',
            discountApplied: appliedDiscount,
            address: address || 'N/A',
            idCard: idCard || 'N/A',
            status: "Pending",
            timestamp: serverTimestamp()
        });

        orderSuccessMsg.innerText = `Order submitted successfully! Discount applied: ${appliedDiscount > 0 ? 'YES (20%)' : 'NO'}. We will contact you shortly.`;
        orderSuccessMsg.style.display = 'block';
        
         document.getElementById('orderName').value = '';
         document.getElementById('orderFatherName').value = '';
         document.getElementById('orderIDCard').value = '';
         document.getElementById('orderWhatsapp').value = '';
         document.getElementById('orderEmail').value = '';
         document.getElementById('orderProductLink').value = '';
         document.getElementById('orderDiscountCode').value = '';
         document.getElementById('orderAddress').value = '';
         document.getElementById('orderCategory').value = '';
         document.getElementById('orderProductName').value = '';
        
    } catch (e) {
        orderErrorMsg.innerText = "Error submitting order: " + e.message;
        orderErrorMsg.style.display = 'block';
    }
}

async function handleSubmitDiscountCard() {
    if (!currentUser) { document.getElementById('discountErrorMsg').innerText = "Please log in first."; document.getElementById('discountErrorMsg').style.display='block'; return; }
    
    const discountErrorMsg = document.getElementById('discountErrorMsg');
    const discountSuccessMsg = document.getElementById('discountSuccessMsg');
    
    discountErrorMsg.style.display = 'none';
    discountSuccessMsg.style.display = 'none';

    const trxId = document.getElementById('discountTrxId')?.value.trim();
    const senderName = document.getElementById('discountSenderName')?.value.trim();
    const senderAccount = document.getElementById('discountSenderAccount')?.value.trim();
    const method = document.getElementById('discountMethod')?.value;
    
    if (!trxId || !senderName || !senderAccount || !method) {
        discountErrorMsg.innerText = "Please fill all transaction details.";
        discountErrorMsg.style.display = 'block';
        return;
    }

    const expiryTime = userHoldings.discountExpiry?.toDate();
    const isDiscountActive = expiryTime && expiryTime.getTime() > Date.now();
    const cardDetailsExist = userHoldings.cardHolderName && userHoldings.cardIDCard;
    
    if (isDiscountActive) {
        discountErrorMsg.innerText = `You already have an active Discount Card until ${expiryTime.toLocaleDateString()}.`;
        discountErrorMsg.style.display = 'block';
        return;
    }
    
    try {
        await addDoc(collection(db, "discountCardPurchases"), {
            userId: currentUser.uid,
            email: currentUser.email,
            amountPKR: DISCOUNT_CARD_PRICE,
            method, trxId, senderName, senderAccount,
            status: "Pending",
            timestamp: serverTimestamp()
        });

        document.getElementById('discountTrxId').value = '';
        document.getElementById('discountSenderName').value = '';
        document.getElementById('discountSenderAccount').value = '';

        if (!cardDetailsExist) {
            discountSuccessMsg.innerText = "Purchase proof received. Please generate your unique Card now.";
            setTimeout(() => {
                closeAllModals();
                document.getElementById('generateDiscountCardModal').style.display = 'flex';
            }, 2000);
        } else {
             discountSuccessMsg.innerText = "Purchase proof submitted! Awaiting Admin approval to renew/activate.";
             setTimeout(closeAllModals, 2000);
        }
        
    } catch (e) {
        discountErrorMsg.innerText = "Error submitting request: " + e.message;
        discountErrorMsg.style.display = 'block';
    }
}

async function handleSubmitWithdrawal() {
    if (!currentUser) { document.getElementById('wdErrorMsg').innerText = "Please log in first."; document.getElementById('wdErrorMsg').style.display='block'; return; }

    const wdName = document.getElementById('wdName')?.value.trim();
    const wdAccount = document.getElementById('wdAccount')?.value.trim();
    const wdMethod = document.getElementById('wdMethod')?.value;
    const amount = parseInt(wdAmount.value);
    
    const wdErrorMsg = document.getElementById('wdErrorMsg');
    const wdSuccessMsg = document.getElementById('wdSuccessMsg');
    
    wdErrorMsg.style.display='none';
    wdSuccessMsg.style.display='none';

    if(!wdAmount.value || amount <= 0 || isNaN(amount) || !wdName || !wdAccount || !wdMethod) { 
         wdErrorMsg.innerText = "Please fill all withdrawal fields (Amount, Holder Name, Account, Method)."; 
         wdErrorMsg.style.display='block'; 
         return; 
    }
    if((userHoldings.coins || 0) < amount) { wdErrorMsg.innerText = "Low Balance!"; wdErrorMsg.style.display='block'; return; }

    // State Checks
    const isLimitIncreased = userHoldings.limitIncreased === true;
    const isFirstWithdrawalDone = userHoldings.firstWithdrawalDone === true;
    const expiryTime = userHoldings.limitIncreaseExpiry?.toDate();
    const isExpired = expiryTime && expiryTime.getTime() < Date.now();

    if (isFirstWithdrawalDone && (!isLimitIncreased || isExpired)) {
         if(isExpired) {
            wdErrorMsg.innerText = `Withdrawal Locked! Your Limit Boost expired on ${expiryTime.toLocaleDateString()}. Please buy the Boost again.`;
         } else {
            wdErrorMsg.innerText = "Withdrawal Locked! You used the Base Limit. Purchase Limit Boost to continue.";
         }
        wdErrorMsg.style.display = 'block';
        return;
    }

    // --- WITHDRAWAL FREQUENCY CHECK LOGIC (FIXED: 30 Days for Base Users) ---
    // If VIP is active, skip this 30-day check entirely.
    if (!(isLimitIncreased && !isExpired)) {
         // Perform 30-day check only if user is NOT a current VIP
        const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);
        const q = query(collection(db, "withdrawals"), where("userId", "==", currentUser.uid), where("timestamp", ">=", thirtyDaysAgo));
        const recentWithdrawals = await getDocs(q);
        
        if (!recentWithdrawals.empty) {
            wdErrorMsg.innerText = "Error: You can only submit one withdrawal request every 30 days (Base Limit). VIP status removes this check.";
            wdErrorMsg.style.display='block';
            return;
        }
    }
    // --- END WITHDRAWAL FREQUENCY CHECK ---

    let currentLimit = (isLimitIncreased && !isExpired) ? MAX_WITHDRAWAL_LIMIT_INCREASED : MAX_WITHDRAWAL_LIMIT_BASE;
    if (amount > currentLimit) { 
        wdErrorMsg.innerText = `Daily Limit Exceeded! Max ${currentLimit.toLocaleString()} coins.`; 
        wdErrorMsg.style.display='block'; 
        return; 
    }
    
    const fee = Math.floor(amount * 0.20);
    const netAmount = amount - fee;
    
    try {
        const userRef = doc(db, "users", currentUser.uid);
        let updates = { coins: increment(-amount) };
        
        if (!isFirstWithdrawalDone && !isLimitIncreased) {
            updates.firstWithdrawalDone = true;
        }

        await updateDoc(userRef, updates);

        await addDoc(collection(db, "withdrawals"), { 
            userId: currentUser.uid, email: currentUser.email, coinId: 'main', 
            amount: amount, fee: fee, netAmount: netAmount, method: wdMethod, 
            accountName: wdName, accountNumber: wdAccount, 
            status: "Pending", timestamp: serverTimestamp() 
        });
        
        wdSuccessMsg.innerText = `Submitted! ${amount.toLocaleString()} Coins deducted. Admin will pay PKR ${ (netAmount * mainCoinRate).toLocaleString(undefined, {minimumFractionDigits: 0}) } shortly.`; 
        wdSuccessMsg.style.display='block';
        wdAmount.value = '';
        updateWdEst();
    } catch (e) { 
        wdErrorMsg.innerText = "Critical Error during withdrawal submission: " + e.message; 
        wdErrorMsg.style.display='block'; 
    }
}

async function handleSubmitDeposit() {
    if (!currentUser) { document.getElementById('depErrorMsg').innerText = "Please log in first."; document.getElementById('depErrorMsg').style.display='block'; return; }

    const amountPKR = parseInt(document.getElementById('depAmountPKR')?.value);
    const depTrxId = document.getElementById('depTrxId')?.value.trim();
    const depSenderName = document.getElementById('depSenderName')?.value.trim();
    const depSenderAccount = document.getElementById('depSenderAccount')?.value.trim();

    const depErrorMsg = document.getElementById('depErrorMsg');
    const depSuccessMsg = document.getElementById('depSuccessMsg');
    
    depErrorMsg.style.display = 'none';
    depSuccessMsg.style.display = 'none';

    if (amountPKR < 100 || !depTrxId || isNaN(amountPKR) || !depSenderName || !depSenderAccount) { 
        depErrorMsg.innerText = "Please fill all deposit fields and ensure PKR amount is >= 100."; 
        depErrorMsg.style.display = 'block'; 
        return; 
    }
    
    const coinsRequested = Math.floor(amountPKR / mainCoinRate);

    try {
        await addDoc(collection(db, "deposits"), {
            userId: currentUser.uid, email: currentUser.email, 
            amountPKR: amountPKR, coinsRequested: coinsRequested, 
            method: document.getElementById('depMethod').value,
            trxId: depTrxId,
            senderName: depSenderName,
            senderAccount: depSenderAccount,
            status: "Pending", timestamp: serverTimestamp()
        });

        depSuccessMsg.innerText = `Deposit proof submitted! Expected coins: ${coinsRequested.toLocaleString()}. Awaiting Admin verification.`;
        depSuccessMsg.style.display = 'block';
        document.getElementById('depAmountPKR').value = '';
        document.getElementById('depTrxId').value = '';
        document.getElementById('depSenderName').value = '';
        document.getElementById('depSenderAccount').value = '';
    } catch (e) {
        depErrorMsg.innerText = "Error submitting deposit: " + e.message;
        depErrorMsg.style.display = 'block';
    }
}

async function handleSubmitLimitIncrease() {
    if (!currentUser) { document.getElementById('limitErrorMsg').innerText = "Please log in first."; document.getElementById('limitErrorMsg').style.display='block'; return; }

    const limitTrxId = document.getElementById('limitTrxId')?.value.trim();
    const limitSenderName = document.getElementById('limitSenderName')?.value.trim();
    const limitSenderAccount = document.getElementById('limitSenderAccount')?.value.trim();
    const limitMethod = document.getElementById('limitMethod')?.value; 

    const limitErrorMsg = document.getElementById('limitErrorMsg');
    const limitSuccessMsg = document.getElementById('limitSuccessMsg');

    limitErrorMsg.style.display = 'none';
    limitSuccessMsg.style.display = 'none';

    if (!limitTrxId || !limitSenderName || !limitSenderAccount || !limitMethod) { 
        limitErrorMsg.innerText = "Please fill all transaction and deposit method details."; 
        limitErrorMsg.style.display = 'block'; 
        return; 
    }

    if (userHoldings.limitIncreased && userHoldings.limitIncreaseExpiry?.toDate() > Date.now()) { 
        limitErrorMsg.innerText = "Error: Your limit is currently active!"; 
        limitErrorMsg.style.display = 'block'; 
        return; 
    }

    // --- 24 Hour Diamond Check ---
    const lastLimitDate = userHoldings.lastLimitIncreaseDate?.toDate();
    const twentyFourHoursPassed = !lastLimitDate || (Date.now() - lastLimitDate.getTime() > TWENTY_FOUR_HOURS_MS);
    
    if (!twentyFourHoursPassed) {
        limitErrorMsg.innerText = "Error: You must wait 24 hours after your last VIP activity to submit a new limit request.";
        limitErrorMsg.style.display = 'block';
        return;
    }
    // --- END 24 Hour Diamond Check ---

    try {
        await addDoc(collection(db, "limitIncreases"), {
            userId: currentUser.uid, email: currentUser.email,
            amountPKR: LIMIT_INCREASE_PRICE,
            method: limitMethod,
            trxId: limitTrxId,
            senderName: limitSenderName,
            senderAccount: limitSenderAccount,
            status: "Pending", timestamp: serverTimestamp()
        });

        // Set local flag for 24 hour delay 
        await updateDoc(doc(db, "users", currentUser.uid), {
            lastLimitIncreaseDate: serverTimestamp()
        });

        limitSuccessMsg.innerText = `Limit Boost proof submitted for ${LIMIT_INCREASE_PRICE} PKR. Awaiting Admin approval.`;
        limitSuccessMsg.style.display = 'block';
        document.getElementById('limitTrxId').value = '';
        document.getElementById('limitSenderName').value = '';
        document.getElementById('limitSenderAccount').value = '';
    } catch (e) {
        limitErrorMsg.innerText = "Error submitting limit increase request: " + e.message;
        limitErrorMsg.style.display = 'block';
    }
}


// --- GENERATE CARD LOGIC ---
window.handleGenerateCard = async () => {
    if (!currentUser) return;
    const errorMsg = document.getElementById('generateCardErrorMsg');
    errorMsg.style.display = 'none';
    
    const holderName = document.getElementById('cardHolderName').value.trim();
    const fatherName = document.getElementById('cardFatherName').value.trim();
    const idCard = document.getElementById('cardIDCard').value.trim();

    if (!holderName || !fatherName || !idCard) {
        errorMsg.innerText = "Please fill all required fields.";
        errorMsg.style.display = 'block';
        return;
    }

    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            cardHolderName: holderName,
            cardFatherName: fatherName,
            cardIDCard: idCard
        });

        alert("Discount Card successfully generated! Awaiting Admin activation of 1-Year validity.");
        closeAllModals();

        document.getElementById('cardHolderName').value = '';
        document.getElementById('cardFatherName').value = '';
        document.getElementById('cardIDCard').value = '';
        
    } catch (e) {
        errorMsg.innerText = "Error generating card: " + e.message;
        errorMsg.style.display = 'block';
    }
};


// --- DOM CONTENT LOADED ---
document.addEventListener('DOMContentLoaded', () => {
     startWithdrawalTicker();

     listenToMainCoinRate();

     onAuthStateChanged(auth, (user) => {
         updateAuthStateUI(user);
         closeAllModals();
     });
     
     // Attach toggle function to history headers
     document.querySelectorAll('.tracking-header').forEach(header => {
        header.addEventListener('click', toggleHistory);
     });

     // --- WHATSAPP CHAT BUTTON ---
     document.getElementById('global-admin-chat-btn')?.addEventListener('click', openWhatsAppChat);

     // --- MODAL OPENERS & CLOSERS ---
     document.getElementById('openLoginBtn')?.addEventListener('click', () => { closeAllModals(); loginModal.style.display = 'flex'; });
     document.getElementById('openFastOrderModal')?.addEventListener('click', () => {
         if(!currentUser) { alert("Please login first to place an order."); return; }
         closeAllModals(); fastOrderModal.style.display = 'flex';
     });
     
     document.getElementById('discountCardActionBtn')?.addEventListener('click', () => {
         updateDiscountCardUI(); 
     });

     document.getElementById('openDiscountCardModal')?.addEventListener('click', () => { 
         if(!currentUser) { alert("Please login first to buy the card."); return; }
         closeAllModals(); discountCardModal.style.display = 'flex';
     });

     document.getElementById('openDepositModal')?.addEventListener('click', () => {
         if(!currentUser) { alert("Please login first to submit a deposit."); return; }
         closeAllModals(); document.getElementById('depositModal').style.display = 'flex'; 
     });
     document.getElementById('navWithdraw')?.addEventListener('click', () => { 
        if(!currentUser) { alert("Please login first to withdraw."); return; }
        closeAllModals(); document.getElementById('withdrawModal').style.display = 'flex'; updateLimitDisplay();
     });
     document.getElementById('openLimitIncreaseModal')?.addEventListener('click', () => { 
         if(!currentUser) { alert("Please login first."); return; }
         closeAllModals(); document.getElementById('limitIncreaseModal').style.display = 'flex';
     });
     

     // --- MODAL CLOSERS ---
     document.getElementById('closeLoginModal')?.addEventListener('click', closeAllModals);
     document.getElementById('closeFastOrderModal')?.addEventListener('click', closeAllModals);
     document.getElementById('closeDiscountCardModal')?.addEventListener('click', closeAllModals); 
     document.getElementById('closeGenerateDiscountCardModal')?.addEventListener('click', closeAllModals); 
     document.getElementById('closeWithdrawalModal')?.addEventListener('click', closeAllModals);
     document.getElementById('closeDepositModal')?.addEventListener('click', closeAllModals);
     document.getElementById('closeLimitIncreaseModal')?.addEventListener('click', closeAllModals);
     
     // --- SUBMISSION LISTENERS ---
     document.getElementById('btnLoginAction')?.addEventListener('click', handleLogin);
     document.getElementById('btnSignupAction')?.addEventListener('click', handleSignup);
     document.getElementById('btnSubmitFastOrder')?.addEventListener('click', handleSubmitFastOrder); 
     document.getElementById('btnSubmitDiscountCard')?.addEventListener('click', handleSubmitDiscountCard); 
     document.getElementById('btnSubmitWithdraw')?.addEventListener('click', handleSubmitWithdrawal);
     document.getElementById('btnSubmitDeposit')?.addEventListener('click', handleSubmitDeposit);
     document.getElementById('btnSubmitLimitIncrease')?.addEventListener('click', handleSubmitLimitIncrease);
     btnGenerateDiscountCard?.addEventListener('click', handleGenerateCard); 
     
     // --- UI HANDLERS (for estimation) ---
     document.getElementById('wdAmount')?.addEventListener('input', updateWdEst); 
     document.getElementById('depAmountPKR')?.addEventListener('input', updateDepEstUI);
     
     // Initial Check
     if (auth.currentUser) updateAuthStateUI(auth.currentUser); else updateAuthStateUI(null);
});
