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

// --- FAKE USERS ---
let fakeUsers = [];
const NUM_FAKE_USERS = 3000;
const BET_AMOUNTS = [20,50, 100,200, 500, 1200, 2000, 3000, 5000, 10000];

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

// --- GAME LOGIC (FIXED QUEUE LOADING) ---
async function startGame() {
    gameState = 'betting';
    multiplier = 1.00;
    
    // Generate Fake Bets
    prepareFakeUsers();
    updateUI('betting');
    renderList();

    try {
        // 1. Get Queue Doc
        const queueRef = db.collection('game_state').doc('crash_queue');
        const doc = await queueRef.get();
        
        let list = [];
        if (doc.exists) {
            list = doc.data().list || [];
        }

        if (list.length > 0) {
            // Priority: Queue
            crashPoint = parseFloat(list[0]);
            console.log("Loaded from Queue:", crashPoint);
            
            // Remove used item
            list.shift(); 
            await queueRef.update({ list: list });
            
        } else {
            // Fallback: Random (1.00x - 10.00x)
            let raw = 1 / (1 - Math.random()) * 0.95;
            crashPoint = Math.min(Math.max(1.00, raw), 10.00);
            console.log("Queue Empty. Random:", crashPoint);
        }

        // Update Admin View
        await db.collection('game_state').doc('current_round').set({
            crashPoint: crashPoint,
            status: 'betting',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

    } catch (e) {
        console.error("Queue Error:", e);
        crashPoint = 2.00; // Safety
    }
    
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
        processFakeUsers(); // Real-time updates
        animId = requestAnimationFrame(runGame);
    }
}

function endGame() {
    cancelAnimationFrame(animId);
    gameState = 'crashed';
    updateUI('crashed');
    
    db.collection('game_state').doc('current_round').update({ status: 'finished' });
    
    history.unshift(crashPoint);
    if(history.length > 20) history.pop();
    renderHistory();
    
    if(myBet && !myBet.cashedOut) {
        saveBetResult(myBet.amount, 0, 0);
    }
    myBet = null;
    
    // Final render to show losses
    renderList();

    setTimeout(startGame, 3000);
}

// --- FAKE USERS (REALISTIC BEHAVIOR) ---
function prepareFakeUsers() {
    fakeUsers = [];
    for(let i=0; i<NUM_FAKE_USERS; i++) {
        const name = `User***${Math.floor(Math.random()*90)+10}`;
        const bet = BET_AMOUNTS[Math.floor(Math.random() * BET_AMOUNTS.length)];
        
        // Realistic Cashout Targets
        let target;
        let r = Math.random();
        if(r < 0.5) target = (Math.random() * 0.4 + 1.1).toFixed(2); // 50% exit early (1.1-1.5)
        else if(r < 0.8) target = (Math.random() * 1.5 + 1.5).toFixed(2); // 30% exit mid (1.5-3.0)
        else target = (Math.random() * 7 + 3.0).toFixed(2); // 20% risk takers
        
        fakeUsers.push({
            name: name,
            bet: bet,
            target: parseFloat(target),
            cashedOut: false,
            win: 0
        });
    }
}

function processFakeUsers() {
    let changed = false;
    fakeUsers.forEach(u => {
        // Check if user should cashout NOW
        if(!u.cashedOut && multiplier >= u.target) {
            u.cashedOut = true;
            u.win = Math.floor(u.bet * u.target);
            changed = true;
        }
    });
    
    // Only re-render if something changed (Optimization)
    if(changed && activeTab === 'all') {
        renderList();
    }
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
    
    // Render Fake Users
    // Sort: Cashed Out First (Green), Then Waiting (White), Then Lost (Red)
    let displayUsers = [...fakeUsers];
    
    if(activeTab === 'top') {
        displayUsers = displayUsers.filter(u => u.cashedOut).sort((a,b) => b.win - a.win);
    } else {
        // All Bets Sorting Logic:
        // 1. Cashed Out (Top)
        // 2. Still Playing (Middle)
        // 3. Crashed/Lost (Bottom)
        displayUsers.sort((a, b) => {
            if (a.cashedOut && !b.cashedOut) return -1;
            if (!a.cashedOut && b.cashedOut) return 1;
            return b.bet - a.bet; // Secondary sort by bet amount
        });
    }

    list.innerHTML = displayUsers.map(u => {
        let statusClass = '';
        let multText = '-';
        let winText = '-';

        if(u.cashedOut) {
            statusClass = 'win'; // Green
            multText = u.target.toFixed(2) + 'x';
            winText = u.win;
        } else if(gameState === 'crashed') {
            statusClass = 'loss'; // Red (Lost)
            multText = '-';
            winText = '0';
        } else {
            // Still playing
            multText = '-';
            winText = '-';
        }

        return `<div class="bet-row ${statusClass}">
            <span>${u.name}</span>
            <span>${u.bet}</span>
            <span>${multText}</span>
            <span>${winText}</span>
        </div>`;
    }).join('');
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
