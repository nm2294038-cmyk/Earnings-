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

// Global State
let globalCoinsData = [];
let userHoldings = {};
let currentUser = null;

// Helper Functions
const getDbField = (coinId) => (coinId === 'main') ? 'coins' : coinId;
const getCoinSymbol = (id) => { const c = globalCoinsData.find(x => x.id === id); return c ? c.symbol : id.toUpperCase(); };

const closeAllModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(el => el.style.display = 'none');
};
window.onclick = (e) => { if(e.target.className === 'modal-overlay') closeAllModals(); };

// Navigation
document.getElementById('navHome').onclick = () => { closeAllModals(); window.scrollTo(0,0); };
document.getElementById('navWithdraw').onclick = () => openModal('withdrawModal');
document.getElementById('navExchange').onclick = () => openModal('exchangeModal');
document.getElementById('navReferral').onclick = () => openModal('referralModal');
document.getElementById('navDeposit').onclick = () => openModal('depositModal');

function openModal(id) {
    if(!currentUser && id !== 'loginModal') { alert("Login First"); return; }
    closeAllModals();
    const modal = document.getElementById(id);
    if(modal) {
        modal.style.display = 'flex';
        if(id === 'withdrawModal') { populateWdDropdown(); updateLimitDisplay(); }
        if(id === 'exchangeModal') populateExchange();
        if(id === 'referralModal') setupReferral();
    }
}

// Login Logic
const openLoginBtn = document.getElementById('openLoginBtn');
if(openLoginBtn) openLoginBtn.onclick = () => { closeAllModals(); document.getElementById('loginModal').style.display = 'flex'; };

document.querySelectorAll('.btn-close').forEach(btn => btn.onclick = closeAllModals);

document.getElementById('btnLoginAction').onclick = async () => {
    try { await signInWithEmailAndPassword(auth, document.getElementById('emailInput').value, document.getElementById('passInput').value); closeAllModals(); } 
    catch (e) { document.getElementById('loginErrorMsg').innerText = e.message; document.getElementById('loginErrorMsg').style.display = 'block'; }
};

document.getElementById('btnSignupAction').onclick = async () => {
    try {
        const email = document.getElementById('emailInput').value;
        const pass = document.getElementById('passInput').value;
        const refCode = new URLSearchParams(window.location.search).get('ref');
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", cred.user.uid), { email, coins: 0, referralCount: 0, referredBy: refCode || null, createdAt: new Date() });
        if(refCode) try { await updateDoc(doc(db, "users", refCode), { referralCount: increment(1) }); } catch(e){}
        closeAllModals();
    } catch (e) { document.getElementById('loginErrorMsg').innerText = e.message; document.getElementById('loginErrorMsg').style.display = 'block'; }
};

window.logoutApp = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if(user) {
        const userDisplay = document.getElementById('userDisplay');
        if(userDisplay) userDisplay.innerHTML = `<div class="profile-img">${user.email[0].toUpperCase()}</div><div style="margin-left:10px;"><button class="login-btn logout-btn" onclick="logoutApp()">Logout</button></div>`;
        if(openLoginBtn) openLoginBtn.style.display='none';
        listenToUserWallet(user.uid);
        listenToWithdrawals(user.uid);
        listenToDeposits(user.uid);
    } else {
        const userDisplay = document.getElementById('userDisplay');
        if(userDisplay) userDisplay.innerHTML = `<button class="login-btn" id="openLoginBtn2">🔑 Login</button>`;
        const btn2 = document.getElementById('openLoginBtn2');
        if(btn2) btn2.onclick = () => document.getElementById('loginModal').style.display = 'flex';
        userHoldings = {}; renderTable();
    }
});

// --- DEPOSIT LOGIC ---
document.getElementById('depAmount').addEventListener('keyup', () => {
    const amt = parseFloat(document.getElementById('depAmount').value);
    const rate = 2; 
    if(!amt || amt <= 0) {
        document.getElementById('depCoinEst').innerText = "You Get: 0 Coins";
    } else {
        const coins = amt / rate;
        document.getElementById('depCoinEst').innerText = `You Get: ≈ ${coins.toFixed(2)} Coins (Rate: 2 PKR/Coin)`;
    }
});

document.getElementById('btnSubmitDeposit').onclick = async () => {
    const method = document.getElementById('depMethod').value;
    const amount = parseFloat(document.getElementById('depAmount').value);
    const senderName = document.getElementById('depSenderName').value;
    const senderNumber = document.getElementById('depSenderNumber').value;
    const tid = document.getElementById('depTid').value;

    if(!amount || !senderName || !senderNumber || !tid) {
        document.getElementById('depErrorMsg').innerText = "Fill all fields!";
        document.getElementById('depErrorMsg').style.display = 'block'; return;
    }

    const coinsCalc = amount / 2; 

    try {
        await addDoc(collection(db, "deposits"), {
            userId: currentUser.uid,
            email: currentUser.email,
            method, amountPKR: amount, coinsCalculated: coinsCalc,
            senderName, senderNumber, tid,
            status: "Pending", timestamp: new Date()
        });
        document.getElementById('depSuccessMsg').innerText = "Deposit Request Submitted!";
        document.getElementById('depSuccessMsg').style.display = 'block';
        document.getElementById('depErrorMsg').style.display = 'none';
        document.getElementById('depAmount').value = '';
        document.getElementById('depTid').value = '';
    } catch(e) {
        document.getElementById('depErrorMsg').innerText = e.message;
        document.getElementById('depErrorMsg').style.display = 'block';
    }
};

function listenToDeposits(uid) {
    const q = query(collection(db, "deposits"), where("userId", "==", uid));
    onSnapshot(q, (snap) => {
        let html = "";
        const docs = [];
        snap.forEach(d => docs.push(d.data()));
        docs.sort((a,b) => b.timestamp - a.timestamp);
        docs.forEach(d => {
            const reasonHtml = d.status === 'Rejected' && d.rejectionReason 
                ? `<div class="h-reason">⚠️ Reason: ${d.rejectionReason}</div>` 
                : '';

            html += `
            <div class="history-card">
                <div class="h-left">
                    <div class="h-amount">PKR ${d.amountPKR}</div>
                    <div class="h-sub">TID: ${d.tid}</div>
                    ${reasonHtml}
                </div>
                <div class="h-right">
                    <span class="badge badge-${d.status}">${d.status}</span>
                    <div class="h-date">${new Date(d.timestamp.seconds*1000).toLocaleDateString()}</div>
                </div>
            </div>`;
        });
        document.getElementById('depHistoryList').innerHTML = html || "<div style='text-align:center;color:#666'>No deposits yet</div>";
    });
}

// --- WITHDRAWAL LOGIC ---
function populateWdDropdown() {
    if(globalCoinsData.length === 0) return;
    let opts = globalCoinsData.map(c => `<option value="${c.id}" data-price="${c.price}">${c.name}</option>`).join('');
    document.getElementById('wdCoinSelect').innerHTML = opts;
    updateWdEst();
}

document.getElementById('wdCoinSelect').onchange = updateWdEst;
document.getElementById('wdAmount').onkeyup = updateWdEst;

function updateWdEst() {
    const coinId = document.getElementById('wdCoinSelect').value;
    const bal = userHoldings[getDbField(coinId)] || 0;
    document.getElementById('wdAvailBal').innerText = `Available: ${bal.toLocaleString()} ${getCoinSymbol(coinId)}`;
    
    const amt = parseFloat(document.getElementById('wdAmount').value);
    if(!amt) { document.getElementById('wdPkrEst').innerText = "Total Value: PKR 0.00"; return; }
    
    const price = parseFloat(document.getElementById('wdCoinSelect').selectedOptions[0].dataset.price);
    document.getElementById('wdPkrEst').innerText = `Total Value: PKR ${(amt * price).toFixed(2)}`;
}

function updateLimitDisplay() {
    const refs = userHoldings.referralCount || 0;
    let limit = 2000;
    if(refs >= 50) limit = 10000;
    document.getElementById('wdLimitInfo').innerHTML = `Refs: <span class="limit-highlight">${refs}</span> | Limit: <span class="limit-highlight">${limit}</span>`;
}

document.getElementById('btnSubmitWithdraw').onclick = async () => {
    const coinId = document.getElementById('wdCoinSelect').value;
    const amount = parseInt(document.getElementById('wdAmount').value);
    const dbField = getDbField(coinId);
    
    const refs = userHoldings.referralCount || 0;
    let limit = 2000;
    if(refs >= 50) limit = 10000;

    if(amount > limit) { document.getElementById('wdErrorMsg').innerText = `Limit Exceeded! Max ${limit}`; document.getElementById('wdErrorMsg').style.display='block'; return; }
    if((userHoldings[dbField]||0) < amount) { document.getElementById('wdErrorMsg').innerText = "Low Balance"; document.getElementById('wdErrorMsg').style.display='block'; return; }

    const q = query(collection(db, "withdrawals"), where("userId", "==", currentUser.uid));
    const snap = await getDocs(q);
    let lastTime = 0;
    snap.forEach(d => { if(d.data().timestamp.seconds*1000 > lastTime) lastTime = d.data().timestamp.seconds*1000; });
    if(Date.now() - lastTime < 604800000) { document.getElementById('wdErrorMsg').innerText = "Wait 7 days between withdrawals"; document.getElementById('wdErrorMsg').style.display='block'; return; }

    try {
        await updateDoc(doc(db, "users", currentUser.uid), { [dbField]: increment(-amount) });
        await addDoc(collection(db, "withdrawals"), {
            userId: currentUser.uid, email: currentUser.email, coinId, coinSymbol: getCoinSymbol(coinId),
            amount, method: document.getElementById('wdMethod').value,
            accountName: document.getElementById('wdName').value, accountNumber: document.getElementById('wdAccount').value,
            status: "Pending", timestamp: new Date()
        });
        document.getElementById('wdSuccessMsg').innerText = "Submitted!"; document.getElementById('wdSuccessMsg').style.display='block';
    } catch(e) { document.getElementById('wdErrorMsg').innerText = e.message; document.getElementById('wdErrorMsg').style.display='block'; }
};

function listenToWithdrawals(uid) {
    const q = query(collection(db, "withdrawals"), where("userId", "==", uid));
    onSnapshot(q, (snap) => {
        let html = "";
        const docs = [];
        snap.forEach(d => docs.push(d.data()));
        docs.sort((a,b) => b.timestamp - a.timestamp);
        docs.forEach(d => {
            const reasonHtml = d.status === 'Rejected' && d.rejectionReason 
                ? `<div class="h-reason">⚠️ Reason: ${d.rejectionReason}</div>` 
                : '';

            html += `
            <div class="history-card">
                <div class="h-left">
                    <div class="h-amount">${d.amount} ${d.coinSymbol}</div>
                    <div class="h-sub">${d.method}</div>
                    ${reasonHtml}
                </div>
                <div class="h-right">
                    <span class="badge badge-${d.status}">${d.status}</span>
                    <div class="h-date">${new Date(d.timestamp.seconds*1000).toLocaleDateString()}</div>
                </div>
            </div>`;
        });
        document.getElementById('wdHistoryList').innerHTML = html;
    });
}

// --- EXCHANGE LOGIC ---
function populateExchange() {
    let opts = globalCoinsData.map(c => `<option value="${c.id}" data-price="${c.price}">${c.name}</option>`).join('');
    document.getElementById('exFromCoin').innerHTML = opts;
    document.getElementById('exToCoin').innerHTML = opts;
}

document.getElementById('exAmount').addEventListener('keyup', calcEx);
document.getElementById('exFromCoin').addEventListener('change', calcEx);
document.getElementById('exToCoin').addEventListener('change', calcEx);

function calcEx() {
    const fromEl = document.getElementById('exFromCoin');
    const toEl = document.getElementById('exToCoin');
    const amt = parseFloat(document.getElementById('exAmount').value);
    
    if(!amt || amt <= 0) {
        document.getElementById('exCalcResult').innerText = "Receive: 0 Coins";
        document.getElementById('exPkrValue').innerText = "(Value: PKR 0.00)";
        return;
    }

    const p1 = parseFloat(fromEl.options[fromEl.selectedIndex].dataset.price);
    const p2 = parseFloat(toEl.options[toEl.selectedIndex].dataset.price);
    
    const res = (p1 * amt) / p2;
    const pkrVal = amt * p1; 

    document.getElementById('exCalcResult').innerText = `Receive: ${res.toFixed(2)} Coins`;
    document.getElementById('exPkrValue').innerText = `(Value: PKR ${pkrVal.toFixed(2)})`;
}

document.getElementById('btnSubmitExchange').onclick = async () => {
    const fromId = document.getElementById('exFromCoin').value;
    const toId = document.getElementById('exToCoin').value;
    const amt = parseInt(document.getElementById('exAmount').value);
    
    if(fromId === toId) { alert("Cannot exchange same coin"); return; }
    if(!amt || amt <= 0) { alert("Enter valid amount"); return; }

    const dbFrom = getDbField(fromId);
    const dbTo = getDbField(toId);
    
    if((userHoldings[dbFrom]||0) < amt) { 
        document.getElementById('exErrorMsg').innerText = "Insufficient Balance"; 
        document.getElementById('exErrorMsg').style.display = 'block'; 
        return; 
    }

    const p1 = parseFloat(document.getElementById('exFromCoin').selectedOptions[0].dataset.price);
    const p2 = parseFloat(document.getElementById('exToCoin').selectedOptions[0].dataset.price);
    const receive = Math.floor((p1 * amt) / p2);

    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            [dbFrom]: increment(-amt),
            [dbTo]: increment(receive)
        });
        document.getElementById('exSuccessMsg').innerText = "Exchange Successful!";
        document.getElementById('exSuccessMsg').style.display = 'block';
        document.getElementById('exErrorMsg').style.display = 'none';
        setTimeout(() => closeAllModals(), 2000);
    } catch(e) {
        document.getElementById('exErrorMsg').innerText = e.message;
        document.getElementById('exErrorMsg').style.display = 'block';
    }
};

function setupReferral() {
    document.getElementById('myRefLink').innerText = `https://www.yoursmed.xyz/?ref=${currentUser.uid}`;
    document.getElementById('btnShareWhatsapp').onclick = () => window.open(`https://wa.me/?text=Join Now: https://www.yoursmed.xyz/?ref=${currentUser.uid}`, '_blank');
}

// --- DATA ---
onSnapshot(doc(db, "adminControl", "config"), (doc) => { if(doc.exists() && document.getElementById('marketStatus')) document.getElementById('marketStatus').innerHTML = doc.data().isRunning ? "<span style='color:#00ff88'>● LIVE</span>" : "<span style='color:#ff4d4d'>● CLOSED</span>"; });
onSnapshot(collection(db, "coins"), (snap) => {
    globalCoinsData = [];
    snap.forEach(d => globalCoinsData.push(d.data()));
    renderTable();
});
function listenToUserWallet(uid) { onSnapshot(doc(db, "users", uid), (s) => { if(s.exists()) userHoldings = s.data(); renderTable(); }); }

function renderTable() {
    if(globalCoinsData.length === 0) return;
    globalCoinsData.sort((a, b) => {
        let qtyA = userHoldings[getDbField(a.id)] || 0;
        let qtyB = userHoldings[getDbField(b.id)] || 0;
        return (b.price * qtyB) - (a.price * qtyA);
    });
    tableBody.innerHTML = "";
    globalCoinsData.forEach(coin => {
        let qty = userHoldings[getDbField(coin.id)] || 0;
        const val = coin.price * qty;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><div class="symbol">${coin.symbol}</div><div style="font-size:0.8em; color:#666">${coin.name}</div></td>
            <td class="${coin.price>=(coin.previousPrice||coin.basePrice)?'price-up':'price-down'}">${coin.price.toFixed(4)}</td>
            <td style="color:#fff;">${qty.toLocaleString()}</td>
            <td style="color:#81d4fa;">PKR ${val.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>`;
        tableBody.appendChild(tr);
    });
    headerWallet.innerHTML = `${(userHoldings.coins || 0).toLocaleString()} <span class="coin-suffix">Coins</span>`;
}
