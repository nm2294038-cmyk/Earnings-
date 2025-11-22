// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
    measurementId: "G-HJQ46RQNZS"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- CONFIG ---
const COIN_RATE = 80;
const PACKAGES = [
    { id: 'p1', coins: 2000 },
    { id: 'p2', coins: 5000 },
    { id: 'p3', coins: 8000 },
    { id: 'p4', coins: 15000 },
    { id: 'p5', coins: 25000 },
    { id: 'p6', coins: 48000 },
        
{ id: 'p7', coins: 60000 },
    { id: 'p8', coins: 75000 },
    { id: 'p9', coins: 98000 }
];
let user = null;
let userData = { coins: 0, inviteCount: 0, claimed: [] };
let selectedPkg = null;
let isSignup = false;

// --- AUTH ---
auth.onAuthStateChanged(u => {
    user = u;
    if (user) {
        document.getElementById('loginAlert').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
        
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (doc.exists) {
                const d = doc.data();
                userData.coins = d.coins || 0;
                userData.inviteCount = d.inviteCount || 0;
                userData.claimed = d.claimedPackages || [];
            } else {
                db.collection('users').doc(user.uid).set({ coins: 0, inviteCount: 0, claimedPackages: [] });
            }
            updateUI(); // Packages Logic Here
        });
        loadHistory();
    } else {
        document.getElementById('loginAlert').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
    }
});

// --- RENDER PACKAGES (LOGIC UPDATED) ---
function updateUI() {
    document.getElementById('balanceDisplay').innerText = userData.coins;
    document.getElementById('inviteDisplay').innerText = userData.inviteCount;
    
    const container = document.getElementById('pkgContainer');
    container.innerHTML = '';

    PACKAGES.forEach((pkg, idx) => {
        const btn = document.createElement('button');
        const pkr = (pkg.coins / COIN_RATE).toFixed(0);
        
        const isClaimed = userData.claimed.includes(pkg.id);
        let isLocked = false;

        // Logic: Agar ye first package nahi hai, to check karo ke pichla claim hua ya nahi?
        if (idx > 0) {
            const prevPkgId = PACKAGES[idx - 1].id;
            // Agar pichla claim nahi hua, to ye wala LOCK rahega
            if (!userData.claimed.includes(prevPkgId)) {
                isLocked = true;
            }
        }

        if (isClaimed) {
            // Case 1: Already Claimed
            btn.className = 'pkg-btn sold-out';
            btn.disabled = true;
            btn.innerHTML = `<h3 style="margin:0;">${pkg.coins}</h3><small>COMPLETED ✅</small>`;
        } 
        else if (isLocked) {
            // Case 2: Locked (Previous not finished)
            btn.className = 'pkg-btn locked';
            btn.disabled = true;
            btn.innerHTML = `<h3 style="margin:0;">🔒 Locked</h3><small>Complete Prev First</small>`;
        } 
        else {
            // Case 3: Available (Unlocked)
            btn.className = 'pkg-btn';
            btn.innerHTML = `<h3 style="margin:0;">${pkg.coins}</h3><small style="color:var(--primary-color); font-weight:bold;">${pkr} PKR</small>`;
            btn.onclick = (e) => {
                e.preventDefault();
                selectPackage(pkg, idx, btn);
            };
        }
        
        container.appendChild(btn);
    });
}

function selectPackage(pkg, idx, btnElement) {
    document.querySelectorAll('.pkg-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    
    // Invite Logic: 1st (index 0) = Free, Rest = 1000 Invites
    const reqInvites = idx === 0 ? 0 : 100;
    
    selectedPkg = { ...pkg, reqInvites: reqInvites };
    document.getElementById('amountInput').value = `${pkg.coins} Coins`;
    document.getElementById('pkrText').innerText = `You get: ${(pkg.coins / COIN_RATE).toFixed(0)} PKR`;
}

// --- WITHDRAWAL SUBMIT ---
document.getElementById('wdForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedPkg) { alert("Please select a package."); return; }
    
    if (userData.coins < selectedPkg.coins) { alert("Not enough coins!"); return; }
    
    // Invite Check
    if (userData.inviteCount < selectedPkg.reqInvites) {
        document.getElementById('myCurrentInvites').innerText = userData.inviteCount;
        document.getElementById('inviteModal').style.display = 'flex';
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true; btn.innerText = "Processing...";

    try {
        const batch = db.batch();
        const ref = db.collection('withdrawal_requests').doc();
        batch.set(ref, {
            userId: user.uid,
            email: user.email,
            amount: selectedPkg.coins,
            pkr: selectedPkg.coins / COIN_RATE,
            pkgId: selectedPkg.id,
            bank: document.getElementById('bankSelect').value,
            accNum: document.getElementById('accNum').value,
            accName: document.getElementById('accName').value,
            status: 'Pending',
            date: firebase.firestore.FieldValue.serverTimestamp()
        });

        const uRef = db.collection('users').doc(user.uid);
        batch.update(uRef, {
            coins: firebase.firestore.FieldValue.increment(-selectedPkg.coins),
            claimedPackages: firebase.firestore.FieldValue.arrayUnion(selectedPkg.id)
        });

        await batch.commit();
        alert("Success! Package Completed.");
        
        // Reset
        document.getElementById('wdForm').reset();
        document.getElementById('amountInput').value = "";
        selectedPkg = null;
        
    } catch (err) { alert(err.message); }
    btn.disabled = false; btn.innerText = "Submit Withdrawal";
});

// --- HISTORY ---
function loadHistory() {
    db.collection('withdrawal_requests')
    .where('userId', '==', user.uid)
    .limit(10)
    .onSnapshot(snap => {
        let reqs = [];
        snap.forEach(d => reqs.push(d.data()));
        reqs.sort((a,b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
        
        let html = '';
        reqs.forEach(r => {
            const cls = r.status === 'Pending' ? 'card-pending' : 'card-approved';
            html += `<div class="history-card ${cls}">
                <b>${r.amount} Coins</b> - <span>${r.status}</span><br>
                <small>${r.bank} | Rs. ${parseInt(r.pkr)}</small>
            </div>`;
        });
        document.getElementById('historyBox').innerHTML = html || 'No history.';
    });
}

// --- HELPERS ---
function shareLink() {
    window.open(`https://wa.me/?text=Join%20Now:%20https://www.yoursmed.xyz/?ref=${user.uid}`, '_blank');
}

// Modal Controls
const authModal = document.getElementById('authModal');
document.getElementById('profileBtn').onclick = () => authModal.style.display = 'flex';
document.getElementById('closeAuthModal').onclick = () => authModal.style.display = 'none';
document.getElementById('closeInviteModal').onclick = () => document.getElementById('inviteModal').style.display = 'none';

document.getElementById('toggleAuthBtn').onclick = () => {
    isSignup = !isSignup;
    document.getElementById('authHeader').innerText = isSignup ? "Create Account" : "Login";
}

document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    const em = document.getElementById('email').value;
    const ps = document.getElementById('pass').value;
    try {
        if(isSignup) await auth.createUserWithEmailAndPassword(em, ps);
        else await auth.signInWithEmailAndPassword(em, ps);
        authModal.style.display = 'none';
    } catch(e) { alert(e.message); }
}

document.getElementById('logoutBtn').onclick = () => { auth.signOut(); location.reload(); }
