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
const wdTaxDisplay = document.getElementById('wdTaxDisplay');

// Deposit Elements
const depositModal = document.getElementById('depositModal');
const btnSubmitDeposit = document.getElementById('btnSubmitDeposit');
const depCoinSelect = document.getElementById('depCoinSelect');
const depAmountPKR = document.getElementById('depAmountPKR');
const depCoinEst = document.getElementById('depCoinEst');
const depHistoryList = document.getElementById('depHistoryList');

// Referral & Exchange Elements
const referralModal = document.getElementById('referralModal');
const myRefLink = document.getElementById('myRefLink');
const btnShareWhatsapp = document.getElementById('btnShareWhatsapp');
const exchangeModal = document.getElementById('exchangeModal');
const exFromCoin = document.getElementById('exFromCoin');
const exToCoin = document.getElementById('exToCoin');
const exAmount = document.getElementById('exAmount');
const exCalcResult = document.getElementById('exCalcResult');
const exPkrValue = document.getElementById('exPkrValue');
const exTaxInfo = document.getElementById('exTaxInfo');

// Footer
const navHome = document.getElementById('navHome');
const navDeposit = document.getElementById('navDeposit');
const navWithdraw = document.getElementById('navWithdraw');
const navExchange = document.getElementById('navExchange');
const navReferral = document.getElementById('navReferral');

let globalCoinsData = [];
let userHoldings = {};
let currentUser = null;
let userWithdrawalCount = 0; 

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
    document.getElementById('depositModal').style.display = 'none';
};
window.onclick = (e) => { if(e.target.className === 'modal-overlay') closeAllModals(); };

// Footer Navigation
navHome.addEventListener('click', () => { closeAllModals(); window.scrollTo(0,0); });

// Login Handling
document.getElementById('openLoginBtn')?.addEventListener('click', () => { closeAllModals(); document.getElementById('loginModal').style.display = 'flex'; });
document.getElementById('closeLoginModal').addEventListener('click', closeAllModals);
document.getElementById('closeWithdrawModal').addEventListener('click', closeAllModals);
document.getElementById('closeExchangeModal').addEventListener('click', closeAllModals);
document.getElementById('closeReferralModal').addEventListener('click', closeAllModals);
document.getElementById('closeDepositModal').addEventListener('click', closeAllModals);

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
        await setDoc(doc(db, "users", cred.user.uid), { email: email, coins: 0, referralCount: 0, referredBy: refCode || null, createdAt: new Date() });
        if(refCode) { try { const refUserRef = doc(db, "users", refCode); await updateDoc(refUserRef, { referralCount: increment(1) }); } catch(e) {} }
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
        listenToDeposits(user.uid);
    } else {
        userDisplay.innerHTML = `<button class="login-btn" id="openLoginBtn2">🔑 Login</button>`;
        document.getElementById('openLoginBtn2').addEventListener('click', () => document.getElementById('loginModal').style.display = 'flex');
        userHoldings = {}; renderTable();
        wdHistoryList.innerHTML = ''; depHistoryList.innerHTML = '';
    }
});

// --- DEPOSIT LOGIC ---
navDeposit.addEventListener('click', () => {
    if(!currentUser) { alert("Login First"); return; }
    closeAllModals();
    depositModal.style.display = 'flex';
    populateDepDropdown();
});

function populateDepDropdown() {
    if(globalCoinsData.length === 0) return;
    let opts = globalCoinsData.map(c => `<option value="${c.id}" data-price="${c.price}">${c.name} (${c.symbol})</option>`).join('');
    depCoinSelect.innerHTML = opts;
}

depAmountPKR.addEventListener('keyup', updateDepEst);
depCoinSelect.addEventListener('change', updateDepEst);

function updateDepEst() {
    const pkr = parseFloat(depAmountPKR.value);
    if(!pkr || pkr <= 0) { depCoinEst.innerText = "You Get: 0 Coins"; return; }
    const selectedOption = depCoinSelect.selectedOptions[0];
    const rate = parseFloat(selectedOption.getAttribute('data-price'));
    const coins = pkr / rate;
    const symbol = selectedOption.text.split('(')[1].replace(')', '');
    depCoinEst.innerText = `You Get: ≈ ${coins.toLocaleString(undefined, {maximumFractionDigits: 0})} ${symbol}`;
}

btnSubmitDeposit.addEventListener('click', async () => {
    const method = document.getElementById('depMethod').value;
    const pkr = parseFloat(depAmountPKR.value);
    const trx = document.getElementById('depTrxId').value;
    const senderName = document.getElementById('depSenderName').value;
    const senderAccount = document.getElementById('depSenderAccount').value;
    const coinId = depCoinSelect.value;
    const coinSymbol = depCoinSelect.selectedOptions[0].text;

    if(!pkr || !trx || !senderName || !senderAccount) { 
        document.getElementById('depErrorMsg').innerText = "Fill all fields"; 
        document.getElementById('depErrorMsg').style.display='block'; return; 
    }

    const rate = parseFloat(depCoinSelect.selectedOptions[0].getAttribute('data-price'));
    const coins = Math.floor(pkr / rate);

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
        document.getElementById('depSuccessMsg').innerText = "Deposit Submitted!"; document.getElementById('depSuccessMsg').style.display='block';
        document.getElementById('depErrorMsg').style.display='none';
        depAmountPKR.value = ''; document.getElementById('depTrxId').value = '';
    } catch(e) { document.getElementById('depErrorMsg').innerText = e.message; document.getElementById('depErrorMsg').style.display='block'; }
});

function listenToDeposits(uid) {
    const q = query(collection(db, "deposits"), where("userId", "==", uid));
    onSnapshot(q, (snap) => {
        if(snap.empty) { depHistoryList.innerHTML = "<div style='text-align:center; color:#555'>No history</div>"; return; }
        let html = "";
        const docs = []; snap.forEach(d => docs.push(d.data()));
        docs.sort((a,b) => b.timestamp - a.timestamp);
        docs.forEach(d => {
            html += `<div class="history-item">
                <div><div style="font-weight:bold; color:#fff;">${d.amountPKR} PKR</div><div style="color:#4caf50; font-size:0.8em;">For: ${d.coinsRequested} ${d.coinSymbol || 'Coins'}</div></div>
                <div style="text-align:right"><span class="badge badge-${d.status}">${d.status}</span><div style="color:#666; font-size:0.8em;">${new Date(d.timestamp.seconds*1000).toLocaleDateString()}</div></div>
            </div>`;
        });
        depHistoryList.innerHTML = html;
    });
}

// --- REFERRAL LOGIC ---
navReferral.addEventListener('click', () => {
    if(!currentUser) { alert("Login First"); return; }
    closeAllModals();
    referralModal.style.display = 'flex';
    const link = `https://www.yoursmed.xyz/?ref=${currentUser.uid}`;
    myRefLink.innerText = link;
    btnShareWhatsapp.onclick = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Join YoursMed King Market! Use my link: ${link}`)}`, '_blank');
});

// --- WITHDRAWAL LOGIC (WITH 20% TAX) ---
navWithdraw.addEventListener('click', () => {
    if(!currentUser) { alert("Login First"); return; }
    closeAllModals();
    withdrawModal.style.display = 'flex';
    populateWdDropdown();
    updateLimitDisplay();
});

function updateLimitDisplay() {
    const refs = userHoldings.referralCount || 0;
    let limit = 10000;
    let status = "Level 1";

    if(userWithdrawalCount === 0) {
        status = "Welcome Bonus (No Refs Needed)";
    } else {
        if(refs >= 1000) { limit = 100000; status = "Level 4 (Max)"; }
        else if(refs >= 400) { limit = 60000; status = "Level 3"; }
        else if(refs >= 100) { limit = 30000; status = "Level 2"; }
        else { limit = 10000; status = "Level 1"; }
    }

    wdLimitInfo.innerHTML = `
        <div>Your Referrals: <span class="limit-highlight">${refs}</span></div>
        <div>Current Limit: <span class="limit-highlight">${limit.toLocaleString()} Coins</span></div>
        <div style="font-size:0.8em; color:#4caf50;">Status: ${status}</div>
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
wdCoinSelect.addEventListener('change', updateWdEst);

function updateWdBalance() {
    const coinId = wdCoinSelect.value;
    const bal = userHoldings[getDbField(coinId)] || 0;
    wdAvailBal.innerText = `Available: ${bal.toLocaleString()} ${getCoinSymbol(coinId)}`;
    updateWdEst();
}

function updateWdEst() {
    const amt = parseFloat(wdAmount.value);
    if(!amt || amt <= 0) { 
        wdPkrEst.innerText = "Total Value: PKR 0.00"; 
        wdTaxDisplay.innerHTML = `<div>Fee (20%): <span style="color:#f44336">0</span></div><div>Net Receive: <span style="color:#4caf50">0</span></div>`;
        return; 
    }
    
    const price = parseFloat(wdCoinSelect.selectedOptions[0].getAttribute('data-price'));
    
    // Calculate Tax
    const fee = amt * 0.20;
    const netCoins = amt - fee;
    const netPkr = netCoins * price;

    wdTaxDisplay.innerHTML = `
        <div>Fee (20%): <span style="color:#f44336">-${fee.toFixed(0)}</span></div>
        <div>Net Receive: <span style="color:#4caf50">${netCoins.toFixed(0)} Coins</span></div>
    `;
    wdPkrEst.innerText = `Total Value: PKR ${netPkr.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

btnSubmitWithdraw.addEventListener('click', async () => {
    const coinId = wdCoinSelect.value;
    const method = wdMethod.value;
    const name = document.getElementById('wdName').value;
    const account = document.getElementById('wdAccount').value;
    const amount = parseInt(document.getElementById('wdAmount').value);

    if(!name || !account || !amount) { document.getElementById('wdErrorMsg').innerText = "Fill all fields!"; document.getElementById('wdErrorMsg').style.display='block'; return; }

    const dbField = getDbField(coinId);
    if((userHoldings[dbField] || 0) < amount) { document.getElementById('wdErrorMsg').innerText = "Low Balance!"; document.getElementById('wdErrorMsg').style.display='block'; return; }

    // Limits
    const refs = userHoldings.referralCount || 0;
    let limit = 10000;
    if(userWithdrawalCount > 0) {
        if(refs >= 1000) limit = 100000;
        else if(refs >= 400) limit = 60000;
        else if(refs >= 100) limit = 30000;
    }

    if(amount > limit) { document.getElementById('wdErrorMsg').innerText = `Limit Exceeded! Max ${limit} coins.`; document.getElementById('wdErrorMsg').style.display='block'; return; }

    // Time Limit
    const q = query(collection(db, "withdrawals"), where("userId", "==", currentUser.uid));
    const snap = await getDocs(q);
    let lastWdTime = 0;
    snap.forEach(doc => { const t = doc.data().timestamp.seconds * 1000; if(t > lastWdTime) lastWdTime = t; });
    if(lastWdTime > 0 && (Date.now() - lastWdTime) < (7*24*60*60*1000)) { document.getElementById('wdErrorMsg').innerText = "Wait 7 days between withdrawals."; document.getElementById('wdErrorMsg').style.display='block'; return; }

    // Calculate Net Amount
    const fee = Math.floor(amount * 0.20);
    const netAmount = amount - fee;

    try {
        await updateDoc(doc(db, "users", currentUser.uid), { [dbField]: increment(-amount) });
        await addDoc(collection(db, "withdrawals"), { 
            userId: currentUser.uid, 
            email: currentUser.email, 
            coinId: coinId, 
            coinSymbol: getCoinSymbol(coinId), 
            amount: amount, 
            fee: fee,
            netAmount: netAmount,
            method: method, 
            accountName: name, 
            accountNumber: account, 
            status: "Pending", 
            timestamp: new Date() 
        });
        document.getElementById('wdSuccessMsg').innerText = "Submitted!"; document.getElementById('wdSuccessMsg').style.display='block';
        document.getElementById('wdErrorMsg').style.display='none';
        updateWdBalance();
    } catch (e) { document.getElementById('wdErrorMsg').innerText = e.message; document.getElementById('wdErrorMsg').style.display='block'; }
});

function listenToWithdrawals(uid) {
    const q = query(collection(db, "withdrawals"), where("userId", "==", uid));
    onSnapshot(q, (snap) => {
        userWithdrawalCount = snap.size;
        if(snap.empty) { wdHistoryList.innerHTML = "<div style='text-align:center; color:#555'>No history</div>"; return; }
        let html = "";
        const docs = []; snap.forEach(d => docs.push(d.data()));
        docs.sort((a,b) => b.timestamp - a.timestamp);
        docs.forEach(d => {
            const coinObj = globalCoinsData.find(c => c.id === d.coinId);
            const pkrVal = (d.netAmount || d.amount) * (coinObj ? coinObj.price : 0);
            html += `<div class="history-item">
                <div><div style="font-weight:bold; color:#fff;">${d.amount} ${d.coinSymbol}</div><div style="color:#4caf50; font-size:0.85em;">(Net: ${d.netAmount || d.amount} | PKR ${pkrVal.toFixed(2)})</div></div>
                <div style="text-align:right"><span class="badge badge-${d.status}">${d.status}</span><div style="color:#666; font-size:0.8em;">${new Date(d.timestamp.seconds*1000).toLocaleDateString()}</div></div>
            </div>`;
        });
        wdHistoryList.innerHTML = html;
    });
}

// --- EXCHANGE LOGIC (20% TAX) ---
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
    const amt = parseFloat(document.getElementById('exAmount').value);
    if(!amt || amt <= 0) { exCalcResult.innerText = "Receive: 0 Coins"; exPkrValue.innerText = "(Value: PKR 0.00)"; return; }
    const p1 = parseFloat(fromEl.options[fromEl.selectedIndex].dataset.price);
    const p2 = parseFloat(toEl.options[toEl.selectedIndex].dataset.price);
    const res = (p1 * amt) / p2;
    // 20% Tax
    const finalRes = res * 0.80;
    exCalcResult.innerText = `Receive: ${finalRes.toFixed(2)} Coins`;
    exPkrValue.innerText = `(Value: PKR ${(amt * p1).toFixed(2)})`;
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
    const rawReceive = (p1 * amt) / p2;
    const finalReceive = Math.floor(rawReceive * 0.80);

    try {
        await updateDoc(doc(db, "users", currentUser.uid), { [dbFrom]: increment(-amt), [dbTo]: increment(finalReceive) });
        await addDoc(collection(db, "exchanges"), {
            userId: currentUser.uid, email: currentUser.email, fromCoin: fromId, toCoin: toId, sent: amt, received: finalReceive, taxDeducted: Math.floor(rawReceive * 0.20), timestamp: new Date()
        });
        alert("Exchanged!"); closeAllModals();
    } catch(e) { alert("Error: " + e.message); }
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
document.getElementById('downloadImageBtn').addEventListener('click', function() {
    const imageURL = document.getElementById('depositImage').src;
    const a = document.createElement('a');
    a.href = imageURL;
    a.download = 'Deposit_Guide.jpg'; // Download file name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});
