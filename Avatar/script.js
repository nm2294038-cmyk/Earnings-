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
if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- STATE ---
let user = null;
let balance = 0;
let gameState = 'waiting';
let multiplier = 1.00;
let crashPoint = 1.00;
let myBet = null; 
let activeTab = 'all';
let isSignup = false;
let animId;
let history = [1.20, 2.55, 1.10, 5.40, 1.80];

// --- AUTH ---
auth.onAuthStateChanged(u => {
    user = u;
    if(u) {
        document.getElementById('authModal').style.display = 'none';
        db.collection('users').doc(u.uid).onSnapshot(doc => {
            if(doc.exists) {
                balance = doc.data().coins || 0;
                document.getElementById('balance').innerText = balance.toFixed(2);
            } else {
                db.collection('users').doc(u.uid).set({ email: u.email, coins: 1000 });
            }
        });
        loadMyBets();
    } else {
        document.getElementById('balance').innerText = '0.00';
    }
});

document.getElementById('profileBtn').onclick = () => document.getElementById('authModal').style.display = 'flex';

function toggleAuth() {
    isSignup = !isSignup;
    document.getElementById('authTitle').innerText = isSignup ? "Signup" : "Login";
}

async function handleAuth() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('pass').value;
    try {
        if(isSignup) await auth.createUserWithEmailAndPassword(e, p);
        else await auth.signInWithEmailAndPassword(e, p);
    } catch(err) { alert(err.message); }
}

// --- GAME LOGIC (STRICT QUEUE PRIORITY) ---
async function startGame() {
    gameState = 'betting';
    multiplier = 1.00;
    
    try {
        // 1. Check Queue First
        const queueDoc = await db.collection('game_state').doc('crash_queue').get();
        let queueList = queueDoc.exists ? (queueDoc.data().list || []) : [];

        if (queueList.length > 0) {
            // List mein number hai, pehla wala uthao
            crashPoint = queueList[0];
            
            // List update karo (Pehla wala remove kar do)
            let newList = queueList.slice(1);
            await db.collection('game_state').doc('crash_queue').set({ list: newList });
            
            console.log("Using Queue Value:", crashPoint);
            
        } else {
            // List khali hai -> Random Generate karo (Fallback)
            // Agar aap chahte hain ke game ruk jaye jab list khali ho, to yahan return kar dein.
            // Filhal main random fallback rakh raha hoon taake game stuck na ho.
            let rawCrash = 1 / (1 - Math.random()) * 0.95;
            crashPoint = Math.min(Math.max(1.00, rawCrash), 10.00);
            console.log("Queue Empty. Using Random:", crashPoint);
        }

        // 2. Update Current Round for Admin View
        await db.collection('game_state').doc('current_round').set({
            crashPoint: crashPoint,
            status: 'betting',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

    } catch (e) {
        console.error("Sync Error:", e);
        crashPoint = 2.00; // Fallback
    }
    
    updateUI('betting');
    
    setTimeout(() => {
        gameState = 'running';
        db.collection('game_state').doc('current_round').update({ status: 'running' });
        updateUI('running');
        runGame();
    }, 5000);
}

function runGame() {
    multiplier += 0.01 * Math.pow(multiplier, 0.8);
    
    if(multiplier >= crashPoint) {
        endGame();
    } else {
        updateGameScreen();
        updateButtonState();
        animId = requestAnimationFrame(runGame);
    }
}

function endGame() {
    cancelAnimationFrame(animId);
    gameState = 'crashed';
    updateUI('crashed');
    
    // Mark round as finished
    db.collection('game_state').doc('current_round').update({ status: 'finished' });
    
    history.unshift(crashPoint);
    if(history.length > 20) history.pop();
    renderHistory();
    
    if(myBet && !myBet.cashedOut) {
        saveBetResult(myBet.amount, 0, 0);
    }
    myBet = null;

    setTimeout(startGame, 3000);
}

// --- UI UPDATES ---
const plane = document.getElementById('plane');
const trail = document.getElementById('trail');
const disp = document.getElementById('mult-disp');
const msg = document.getElementById('game-msg');
const btn = document.getElementById('action-btn');
const btnSub = document.getElementById('btn-sub');

function updateGameScreen() {
    disp.innerText = multiplier.toFixed(2) + 'x';
    const progress = Math.min(1, (multiplier - 1) / 10);
    const x = progress * 280; 
    const y = Math.pow(progress, 0.8) * 150;
    plane.style.transform = `translate(${x}px, -${y}px) rotate(-15deg)`;
    trail.style.transform = `scale(${1 + progress * 2})`;
    trail.style.opacity = 0.2 + (progress * 0.5);
}

function updateUI(state) {
    if(state === 'betting') {
        msg.style.display = 'block';
        msg.innerText = "WAITING FOR NEXT ROUND";
        disp.style.display = 'none';
        plane.style.transform = 'translate(0,0)';
        trail.style.transform = 'scale(1)';
        
        if(myBet) {
            btn.className = 'action-btn btn-wait';
            btn.firstElementChild.innerText = "BET PLACED";
            btnSub.innerText = "Waiting...";
        } else {
            btn.className = 'action-btn btn-bet';
            btn.firstElementChild.innerText = "BET";
            btnSub.innerText = document.getElementById('bet-amount').value;
        }
    } 
    else if(state === 'running') {
        msg.style.display = 'none';
        disp.style.display = 'block';
        disp.classList.remove('crashed');
        
        if(myBet && !myBet.cashedOut) {
            btn.className = 'action-btn btn-cashout';
        } else {
            btn.className = 'action-btn btn-wait';
            btn.firstElementChild.innerText = "WAITING";
            btnSub.innerText = "";
        }
    }
    else if(state === 'crashed') {
        disp.classList.add('crashed');
        disp.innerText = crashPoint.toFixed(2) + 'x';
        msg.style.display = 'block';
        msg.innerText = "FLEW AWAY!";
        btn.className = 'action-btn btn-wait';
        btn.firstElementChild.innerText = "CRASHED";
        btnSub.innerText = "";
    }
}

function updateButtonState() {
    if(gameState === 'running' && myBet && !myBet.cashedOut) {
        const win = (myBet.amount * multiplier).toFixed(2);
        btn.firstElementChild.innerText = "CASHOUT";
        btnSub.innerText = win;
    }
}

function renderHistory() {
    const bar = document.getElementById('history-bar');
    bar.innerHTML = history.map(h => 
        `<div class="hist-item ${h >= 2 ? 'high' : 'low'}">${h.toFixed(2)}x</div>`
    ).join('');
}

// --- BETTING ACTIONS ---
btn.onclick = () => {
    if(!user) return document.getElementById('authModal').style.display = 'flex';

    const amt = parseInt(document.getElementById('bet-amount').value);

    if(gameState === 'betting' && !myBet) {
        if(balance < amt) return alert("Low Balance");
        
        db.collection('users').doc(user.uid).update({
            coins: firebase.firestore.FieldValue.increment(-amt)
        });
        
        myBet = { amount: amt, cashedOut: false };
        updateUI('betting');
    }
    else if(gameState === 'running' && myBet && !myBet.cashedOut) {
        const win = Math.floor(myBet.amount * multiplier);
        myBet.cashedOut = true;
        
        db.collection('users').doc(user.uid).update({
            coins: firebase.firestore.FieldValue.increment(win)
        });
        
        saveBetResult(myBet.amount, win, multiplier);
        
        btn.className = 'action-btn btn-wait';
        btn.firstElementChild.innerText = "WON";
        btnSub.innerText = win;
    }
};

function saveBetResult(bet, win, mult) {
    db.collection('bets').add({
        userId: user.uid,
        email: user.email,
        bet: bet,
        win: win,
        multiplier: mult,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// --- TABS & LISTS ---
function switchTab(t) {
    activeTab = t;
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderList();
}

function loadMyBets() {
    db.collection('bets').where('userId', '==', user.uid).orderBy('timestamp', 'desc').limit(20).onSnapshot(snap => {
        if(activeTab === 'my') {
            const list = document.getElementById('bets-list');
            list.innerHTML = snap.docs.map(d => {
                const b = d.data();
                const cls = b.win > 0 ? 'win' : '';
                return `<div class="bet-row ${cls}">
                    <span>${new Date(b.timestamp?.seconds*1000).toLocaleTimeString()}</span>
                    <span>${b.bet}</span>
                    <span>${b.multiplier.toFixed(2)}x</span>
                    <span>${b.win}</span>
                </div>`;
            }).join('');
        }
    });
}

function renderList() {
    const list = document.getElementById('bets-list');
    if(activeTab === 'my') {
        loadMyBets();
        return;
    }
    
    let html = '';
    for(let i=0; i<15; i++) {
        const u = 'User'+Math.floor(Math.random()*999);
        const b = Math.floor(Math.random()*500);
        const m = (Math.random()*5 + 1).toFixed(2);
        const w = (b * m).toFixed(0);
        html += `<div class="bet-row win">
            <span>${u}</span>
            <span>${b}</span>
            <span>${m}x</span>
            <span>${w}</span>
        </div>`;
    }
    list.innerHTML = html;
}

function adjBet(v) {
    const inp = document.getElementById('bet-amount');
    let val = parseInt(inp.value) + v;
    if(val < 10) val = 10;
    inp.value = val;
    btnSub.innerText = val.toFixed(2);
}
function setBet(v) { 
    document.getElementById('bet-amount').value = v; 
    btnSub.innerText = v.toFixed(2);
}

// Init
renderHistory();
startGame();
renderList();
