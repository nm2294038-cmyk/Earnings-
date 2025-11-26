import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, setDoc, addDoc, updateDoc, increment, query, where, getDocs } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

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

// Elements
const tableBody = document.getElementById('tableBody');
const headerWallet = document.getElementById('headerWallet');
const userDisplay = document.getElementById('userDisplay');
const statusDiv = document.getElementById('marketStatus');

// Withdrawal Elements
const withdrawModal = document.getElementById('withdrawModal');
const btnSubmitWithdraw = document.getElementById('btnSubmitWithdraw');
const wdCoinSelect = document.getElementById('wdCoinSelect');
const wdAvailBal = document.getElementById('wdAvailBal');
const wdMethod = document.getElementById('wdMethod');
const wdAmount = document.getElementById('wdAmount');
const wdPkrEst = document.getElementById('wdPkrEst');
const wdHistoryList = document.getElementById('wdHistoryList');
const wdLimitInfo = document.getElementById('wdLimitInfo');

// Referral Elements
const referralModal = document.getElementById('referralModal');
const myRefLink = document.getElementById('myRefLink');
const btnShareWhatsapp = document.getElementById('btnShareWhatsapp');

// Footer
const navHome = document.getElementById('navHome');
const navWithdraw = document.getElementById('navWithdraw');
const navExchange = document.getElementById('navExchange');
const navReferral = document.getElementById('navReferral');

let globalCoinsData = [];
let userHoldings = {};
let currentUser = null;

// Helper: Map 'main' coin to 'coins' field
const getDbField = (coinId) => (coinId === 'main') ? 'coins' : coinId;

const getCoinSymbol = (id) => {
    const c = globalCoinsData.find(x => x.id === id);
    return c ? c.symbol : id.toUpperCase();
};

// Close Modals Helper
const closeAllModals = () => {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('withdrawModal').style.display = 'none';
    document.getElementById('exchangeModal').style.display = 'none';
    document.getElementById('referralModal').style.display = 'none';
};
window.onclick = (e) => {
    if(e.target.className === 'modal-overlay') closeAllModals();
};

// Footer Navigation
navHome.addEventListener('click', () => { closeAllModals(); window.scrollTo(0,0); });

// Login Handling
document.getElementById('openLoginBtn')?.addEventListener('click', () => { closeAllModals(); document.getElementById('loginModal').style.display = 'flex'; });
document.getElementById('closeLoginModal').addEventListener('click', closeAllModals);
document.getElementById('closeWithdrawModal').addEventListener('click', closeAllModals);
document.getElementById('closeExchangeModal').addEventListener('click', closeAllModals);
document.getElementById('closeReferralModal').addEventListener('click', closeAllModals);

// Auth Actions
document.getElementById('btnLoginAction').addEventListener('click', async () => {
    try { await signInWithEmailAndPassword(auth, document.getElementById('emailInput').value, document.getElementById('passInput').value); closeAllModals(); } 
    catch (e) { document.getElementById('loginErrorMsg').innerText = e.message; document.getElementById('loginErrorMsg').style.display = 'block'; }
});

document.getElementById('btnSignupAction').addEventListener('click', async () => {
    try {
        const email = document.getElementById('emailInput').value;
        const pass = document.getElementById('passInput').value;
        
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');

        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        
        await setDoc(doc(db, "users", cred.user.uid), { 
            email: email, 
            coins: 0, 
            referralCount: 0, 
            referredBy: refCode || null, 
            createdAt: new Date() 
        });

        if(refCode) {
            try {
                const refUserRef = doc(db, "users", refCode);
                await updateDoc(refUserRef, { referralCount: increment(1) });
            } catch(e) { console.log("Referral update failed", e); }
        }

        closeAllModals();
    } catch (e) { document.getElementById('loginErrorMsg').innerText = e.message; document.getElementById('loginErrorMsg').style.display = 'block'; }
});

window.logoutApp = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if(user) {
        const initial = user.email ? user.email[0].toUpperCase() : "U";
        userDisplay.innerHTML = `<div class="profile-img">${initial}</div><div style="margin-left:10px;"><button class="login-btn logout-btn" onclick="logoutApp()">Logout</button></div>`;
        document.getElementById('openLoginBtn') ? document.getElementById('openLoginBtn').style.display='none' : null;
        listenToUserWallet(user.uid);
        listenToWithdrawals(user.uid);
    } else {
        userDisplay.innerHTML = `<button class="login-btn" id="openLoginBtn2">🔑 Login</button>`;
        document.getElementById('openLoginBtn2').addEventListener('click', () => document.getElementById('loginModal').style.display = 'flex');
        userHoldings = {}; renderTable();
        wdHistoryList.innerHTML = '';
    }
});

// --- REFERRAL LOGIC ---
navReferral.addEventListener('click', () => {
    if(!currentUser) { alert("Login First"); return; }
    closeAllModals();
    referralModal.style.display = 'flex';
    
    const link = `https://www.yoursmed.xyz/?ref=${currentUser.uid}`;
    myRefLink.innerText = link;
    
    btnShareWhatsapp.onclick = () => {
        const msg = `Join YoursMed King Market and earn coins! Use my link: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };
});

// --- WITHDRAWAL LOGIC (7-DAY LIMIT & AMOUNT LIMIT) ---
navWithdraw.addEventListener('click', () => {
    if(!currentUser) { alert("Login First"); return; }
    closeAllModals();
    withdrawModal.style.display = 'flex';
    populateWdDropdown();
    updateLimitDisplay();
});

function updateLimitDisplay() {
    const refs = userHoldings.referralCount || 0;
    let limit = 2000;
    let status = "Basic Level";
    if(refs >= 500) { limit = 10000; status = "Pro Level"; }

    wdLimitInfo.innerHTML = `
        <div>Your Referrals: <span class="limit-highlight">${refs}</span></div>
        <div>Weekly Limit: <span class="limit-highlight">${limit.toLocaleString()} Coins</span> (${status})</div>
        <div style="font-size:0.8em; color:#888; margin-top:5px;">(Withdrawal allowed once every 7 days)</div>
    `;
}

function populateWdDropdown() {
    if(globalCoinsData.length === 0) return;
    let opts = globalCoinsData.map(c => `<option value="${c.id}" data-price="${c.price}">${c.name} (${c.symbol})</option>`).join('');
    wdCoinSelect.innerHTML = opts;
    updateWdBalance(); 
}

wdCoinSelect.addEventListener('change', updateWdBalance);
wdAmount.addEventListener('keyup', updateWdEst);
wdAmount.addEventListener('change', updateWdEst);
wdCoinSelect.addEventListener('change', updateWdEst);

function updateWdBalance() {
    const coinId = wdCoinSelect.value;
    const bal = userHoldings[getDbField(coinId)] || 0;
    wdAvailBal.innerText = `Available: ${bal.toLocaleString()} ${getCoinSymbol(coinId)}`;
    updateWdEst();
}

function updateWdEst() {
    const amt = parseFloat(wdAmount.value);
    if(!amt || amt <= 0) { wdPkrEst.innerText = "Total Value: PKR 0.00"; return; }
    const price = parseFloat(wdCoinSelect.selectedOptions[0].getAttribute('data-price'));
    const totalPkr = amt * price;
    wdPkrEst.innerText = `Total Value: PKR ${totalPkr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

btnSubmitWithdraw.addEventListener('click', async () => {
    const coinId = wdCoinSelect.value;
    const method = wdMethod.value;
    const name = document.getElementById('wdName').value;
    const account = document.getElementById('wdAccount').value;
    const amount = parseInt(document.getElementById('wdAmount').value);

    if(!name || !account || !amount || !method) {
         document.getElementById('wdErrorMsg').innerText = "Fill all fields!"; 
         document.getElementById('wdErrorMsg').style.display='block'; return; 
    }

    const dbField = getDbField(coinId);
    const currentBal = userHoldings[dbField] || 0;
    if(amount > currentBal) {
         document.getElementById('wdErrorMsg').innerText = "Insufficient Balance!"; 
         document.getElementById('wdErrorMsg').style.display='block'; return; 
    }

    // --- CHECK 1: AMOUNT LIMIT ---
    const refs = userHoldings.referralCount || 0;
    let limit = 2000;
    if(refs >= 500) limit = 10000;

    if(amount > limit) {
        document.getElementById('wdErrorMsg').innerText = `Limit Exceeded! Max ${limit} coins per week.`;
        document.getElementById('wdErrorMsg').style.display='block';
        return;
    }

    // --- CHECK 2: 7-DAY TIME LIMIT ---
    const q = query(collection(db, "withdrawals"), where("userId", "==", currentUser.uid));
    const snap = await getDocs(q);
    let lastWdTime = 0;
    
    snap.forEach(doc => {
        const t = doc.data().timestamp.seconds * 1000;
        if(t > lastWdTime) lastWdTime = t;
    });

    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if(lastWdTime > 0 && (now - lastWdTime) < oneWeek) {
        const daysLeft = Math.ceil((oneWeek - (now - lastWdTime)) / (1000 * 60 * 60 * 24));
        document.getElementById('wdErrorMsg').innerText = `Please wait ${daysLeft} more days for next withdrawal.`;
        document.getElementById('wdErrorMsg').style.display='block';
        return;
    }

    try {
        await updateDoc(doc(db, "users", currentUser.uid), { [dbField]: increment(-amount) });

        await addDoc(collection(db, "withdrawals"), {
            userId: currentUser.uid,
            email: currentUser.email,
            coinId: coinId,
            coinSymbol: getCoinSymbol(coinId),
            amount: amount,
            method: method,
            accountName: name,
            accountNumber: account,
            status: "Pending",
            timestamp: new Date()
        });

        document.getElementById('wdSuccessMsg').innerText = "Request Submitted! Status: Pending"; 
        document.getElementById('wdSuccessMsg').style.display='block';
        document.getElementById('wdErrorMsg').style.display='none';
        document.getElementById('wdAmount').value = '';
        updateWdBalance();

    } catch (e) {
        document.getElementById('wdErrorMsg').innerText = e.message; document.getElementById('wdErrorMsg').style.display='block';
    }
});

// --- WITHDRAWAL HISTORY ---
function listenToWithdrawals(uid) {
    const q = query(collection(db, "withdrawals"), where("userId", "==", uid));
    onSnapshot(q, (snap) => {
        if(snap.empty) { wdHistoryList.innerHTML = "<div style='text-align:center; padding:10px; color:#555'>No history found</div>"; return; }
        let html = "";
        const docs = [];
        snap.forEach(d => docs.push(d.data()));
        docs.sort((a,b) => b.timestamp - a.timestamp);

        docs.forEach(d => {
            html += `
                <div class="history-item">
                    <div>
                        <div style="font-weight:bold; color:#fff;">${d.amount} ${d.coinSymbol || 'Coins'}</div>
                        <div style="color:#aaa; font-size:0.9em;">via ${d.method}</div>
                    </div>
                    <div style="text-align:right">
                        <span class="badge badge-${d.status}">${d.status}</span>
                        <div style="color:#666; font-size:0.8em; margin-top:2px;">${new Date(d.timestamp.seconds*1000).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        });
        wdHistoryList.innerHTML = html;
    });
}

// --- EXCHANGE LOGIC ---
navExchange.addEventListener('click', () => {
    if(!currentUser) { alert("Login First"); return; }
    closeAllModals();
    document.getElementById('exchangeModal').style.display = 'flex';
    let opts = globalCoinsData.map(c => `<option value="${c.id}" data-price="${c.price}">${c.name}</option>`).join('');
    document.getElementById('exFromCoin').innerHTML = opts;
    document.getElementById('exToCoin').innerHTML = opts;
});

document.getElementById('exAmount').addEventListener('keyup', calcEx);
document.getElementById('exFromCoin').addEventListener('change', calcEx);
document.getElementById('exToCoin').addEventListener('change', calcEx);

function calcEx() {
    const fromEl = document.getElementById('exFromCoin');
    const toEl = document.getElementById('exToCoin');
    const amt = document.getElementById('exAmount').value;
    const p1 = parseFloat(fromEl.options[fromEl.selectedIndex].dataset.price);
    const p2 = parseFloat(toEl.options[toEl.selectedIndex].dataset.price);
    const res = (p1 * amt) / p2;
    document.getElementById('exCalcResult').innerText = `Receive: ${isNaN(res)?0:res.toFixed(2)}`;
}

document.getElementById('btnSubmitExchange').addEventListener('click', async () => {
    const fromId = document.getElementById('exFromCoin').value;
    const toId = document.getElementById('exToCoin').value;
    const amt = parseInt(document.getElementById('exAmount').value);
    if(fromId === toId || !amt) return;
    
    const dbFrom = getDbField(fromId);
    const dbTo = getDbField(toId);
    if((userHoldings[dbFrom]||0) < amt) { alert("Low Balance"); return; }

    const p1 = parseFloat(document.getElementById('exFromCoin').selectedOptions[0].dataset.price);
    const p2 = parseFloat(document.getElementById('exToCoin').selectedOptions[0].dataset.price);
    const receive = Math.floor((p1 * amt) / p2);

    await updateDoc(doc(db, "users", currentUser.uid), {
        [dbFrom]: increment(-amt), [dbTo]: increment(receive)
    });
    alert("Exchanged!");
    closeAllModals();
});

// --- DATA ---
onSnapshot(doc(db, "adminControl", "config"), (doc) => { if(doc.exists()) statusDiv.innerHTML = doc.data().isRunning ? "<span style='color:#00ff88'>● LIVE</span>" : "<span style='color:#ff4d4d'>● CLOSED</span>"; });

onSnapshot(collection(db, "coins"), (snap) => {
    globalCoinsData = [];
    snap.forEach(d => globalCoinsData.push(d.data()));
    renderTable();
});

function listenToUserWallet(uid) {
    onSnapshot(doc(db, "users", uid), (docSnap) => {
        if(docSnap.exists()) userHoldings = docSnap.data();
        renderTable();
    });
}

function renderTable() {
    if(globalCoinsData.length === 0) return;
    globalCoinsData.sort((a, b) => {
        let qtyA = userHoldings[getDbField(a.id)] || 0;
        let qtyB = userHoldings[getDbField(b.id)] || 0;
        return (b.price * qtyB) - (a.price * qtyA);
    });

    tableBody.innerHTML = "";
    let totalCoinsCount = 0; 
    globalCoinsData.forEach(coin => {
        let qty = userHoldings[getDbField(coin.id)] || 0;
        const val = coin.price * qty;
        totalCoinsCount += qty;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><div class="symbol">${coin.symbol}</div><div style="font-size:0.8em; color:#666">${coin.name}</div></td>
            <td class="${coin.price>=(coin.previousPrice||coin.basePrice)?'price-up':'price-down'}">${coin.price.toFixed(4)}</td>
            <td style="color:#fff;">${qty.toLocaleString()}</td>
            <td style="color:#81d4fa;">PKR ${val.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>`;
        tableBody.appendChild(tr);
    });
    headerWallet.innerHTML = `${totalCoinsCount.toLocaleString()} <span class="coin-suffix">Coins</span>`;
}
