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
let isSignup = false;
let invest = 100;
let duration = 5; // Seconds
let marketMode = 'NORMAL'; // Default Market Mode

// Chart State
let candles = [];
let currentCandle = null;
let candleWidth = 11;
let spacing = 3;
let startPrice = 5840.00;

let canvas = document.getElementById('chart');
let ctx = canvas.getContext('2d');
let width, height;

// --- AUTH ---
auth.onAuthStateChanged(u => {
    user = u;
    if(u) {
        document.getElementById('authModal').style.display = 'none';
        db.collection('users').doc(u.uid).onSnapshot(doc => {
            if(doc.exists) {
                balance = doc.data().coins || 0;
                document.getElementById('balance').innerText = balance.toLocaleString();
            } else {
                db.collection('users').doc(u.uid).set({ email: u.email, coins: 5000 });
            }
        });
    } else {
        document.getElementById('balance').innerText = '0';
    }
});

document.getElementById('profileBtn').onclick = () => document.getElementById('authModal').style.display = 'flex';

function toggleAuth() {
    isSignup = !isSignup;
    document.querySelector('#authModal h3').innerText = isSignup ? "Signup" : "Login";
}

async function handleAuth() {
    const e = document.getElementById('email').value;
    const p = document.getElementById('pass').value;
    try {
        if(isSignup) await auth.createUserWithEmailAndPassword(e, p);
        else await auth.signInWithEmailAndPassword(e, p);
    } catch(err) { alert(err.message); }
}

// --- MARKET CONTROL LISTENER (ADMIN SYNC) ---
db.collection('admin_settings').doc('market_control').onSnapshot(doc => {
    if(doc.exists) {
        marketMode = doc.data().mode;
    }
});

// --- CHART LOGIC (CANDLES) ---
function resize() {
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// Init Candles
for(let i=0; i<40; i++) {
    let move = (Math.random() - 0.5) * 5;
    let close = startPrice + move;
    let high = Math.max(startPrice, close) + Math.random();
    let low = Math.min(startPrice, close) - Math.random();
    
    candles.push({ open: startPrice, close: close, high: high, low: low });
    startPrice = close;
}
currentCandle = { open: startPrice, close: startPrice, high: startPrice, low: startPrice };

function drawChart() {
    ctx.clearRect(0, 0, width, height);
    
    // Combine history + current
    let allCandles = [...candles, currentCandle];
    let visible = allCandles.slice(-30); // Show last 30
    
    // Scale Y
    let minP = Math.min(...visible.map(c => c.low)) - 2;
    let maxP = Math.max(...visible.map(c => c.high)) + 2;
    let range = maxP - minP || 1;
    
    const getY = (p) => height - ((p - minP) / range) * (height - 40) - 20;
    const getX = (i) => i * (candleWidth + spacing) + 20;

    // Draw Grid
    ctx.strokeStyle = '#25262b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=1; i<5; i++) {
        let y = (height/5)*i;
        ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Draw Candles
    visible.forEach((c, i) => {
        let x = getX(i);
        let yOpen = getY(c.open);
        let yClose = getY(c.close);
        let yHigh = getY(c.high);
        let yLow = getY(c.low);
        
        let isGreen = c.close >= c.open;
        ctx.fillStyle = isGreen ? '#00b853' : '#ff3b30';
        ctx.strokeStyle = ctx.fillStyle;
        
        // Wick
        ctx.beginPath();
        ctx.moveTo(x + candleWidth/2, yHigh);
        ctx.lineTo(x + candleWidth/2, yLow);
        ctx.stroke();
        
        // Body
        let h = Math.abs(yClose - yOpen);
        if(h < 1) h = 1;
        ctx.fillRect(x, Math.min(yOpen, yClose), candleWidth, h);
    });

    // Update Price Line (SYNCED WITH CANDLE)
    let curY = getY(currentCandle.close);
    
    // Move the HTML line
    const line = document.getElementById('curLine');
    line.style.top = curY + 'px';
    
    // Move the dot (using left position of last candle)
    let lastX = getX(visible.length - 1);
    line.style.left = lastX + 'px'; // Start line from candle
    line.style.width = (width - lastX) + 'px'; // Extend to right

    document.getElementById('curTag').innerText = currentCandle.close.toFixed(2);
    
    requestAnimationFrame(drawChart);
}
drawChart();

// Live Update Loop (With Admin Control)
setInterval(() => {
    // Default Random Movement
    let change = (Math.random() - 0.5) * 1.5;

    // ADMIN OVERRIDE
    if (marketMode === 'UP') {
        change = (Math.random() * 1.0) + 0.2; // Always Positive
    } else if (marketMode === 'DOWN') {
        change = -(Math.random() * 1.0) - 0.2; // Always Negative
    }

    currentCandle.close += change;
    
    // Update High/Low
    if(currentCandle.close > currentCandle.high) currentCandle.high = currentCandle.close;
    if(currentCandle.close < currentCandle.low) currentCandle.low = currentCandle.close;
}, 100);

// New Candle Loop (Every 3s)
setInterval(() => {
    candles.push({...currentCandle});
    if(candles.length > 50) candles.shift();
    
    let nextOpen = currentCandle.close;
    currentCandle = { open: nextOpen, close: nextOpen, high: nextOpen, low: nextOpen };
}, 3000);


// --- TRADING LOGIC ---
function adjAmt(v) {
    if(invest + v >= 100) {
        invest += v;
        document.getElementById('amtVal').innerText = invest;
    }
}

async function trade(type) {
    if(!user) return document.getElementById('authModal').style.display = 'flex';
    if(balance < invest) return alert("Insufficient Coins");

    // 1. Deduct Coins
    await db.collection('users').doc(user.uid).update({
        coins: firebase.firestore.FieldValue.increment(-invest)
    });

    // 2. Capture Entry
    const entryPrice = currentCandle.close;
    
    // 3. Draw Trade Line
    const overlay = document.getElementById('tradeOverlay');
    const line = document.createElement('div');
    line.className = 'trade-line';
    line.style.borderColor = type === 'up' ? 'var(--green)' : 'var(--red)';
    line.style.top = document.getElementById('curLine').style.top; // Snap to current

    line.innerHTML = `
        <div class="trade-badge" style="background:${type === 'up' ? 'var(--green)' : 'var(--red)'}">
            <i class="fa-solid fa-arrow-${type}"></i> ${invest} <span class="timer">${duration}s</span>
        </div>
    `;
    overlay.appendChild(line);

    // 4. Timer Logic
    let timeLeft = duration;
    const timerInt = setInterval(() => {
        timeLeft--;
        line.querySelector('.timer').innerText = timeLeft + 's';
        if(timeLeft <= 0) clearInterval(timerInt);
    }, 1000);

    // 5. Result Logic
    setTimeout(async () => {
        line.remove(); // Remove line
        const exitPrice = currentCandle.close;
        let win = false;

        if(type === 'up' && exitPrice > entryPrice) win = true;
        else if(type === 'down' && exitPrice < entryPrice) win = true;

        showResult(win, win ? invest * 2 : 0);

        if(win) {
            await db.collection('users').doc(user.uid).update({
                coins: firebase.firestore.FieldValue.increment(invest * 2)
            });
        }

        // Save History
        db.collection('trades').add({
            userId: user.uid,
            email: user.email,
            type: type,
            amount: invest,
            entry: entryPrice,
            exit: exitPrice,
            result: win ? 'Win' : 'Loss',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

    }, duration * 1000);
}

function showResult(win, amount) {
    const pop = document.getElementById('resultPopup');
    pop.className = `result-popup ${win ? 'win-pop' : 'loss-pop'}`;
    pop.innerHTML = win ? `YOU WON<br>+${amount}` : `YOU LOST<br>-${invest}`;
    pop.style.display = 'block';
    setTimeout(() => pop.style.display = 'none', 2000);
}
