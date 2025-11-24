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

// --- STATE ---
let user = null;
let balance = 0;
let isSignup = false;
let invest = 280;
let duration = 5; // Seconds
let marketMode = 'NORMAL'; // Default Market Mode

// Chart State
let candles = [];
let currentCandle = null;
// let candleWidth = 11; // <<< REMOVED
// let spacing = 3;     // <<< REMOVED
let startPrice = 5840.00;

let canvas = document.getElementById('chart');
let ctx = canvas.getContext('2d');
let width, height;

// --- AUTH ---
auth.onAuthStateChanged(u => {
    user = u;
    if (u) {
        document.getElementById('authModal').style.display = 'none';
        db.collection('users').doc(u.uid).onSnapshot(doc => {
            if (doc.exists) {
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
        if (isSignup) await auth.createUserWithEmailAndPassword(e, p);
        else await auth.signInWithEmailAndPassword(e, p);
    } catch (err) { alert(err.message); }
}

// --- MARKET CONTROL LISTENER (ADMIN SYNC) ---
db.collection('admin_settings').doc('market_control').onSnapshot(doc => {
    if (doc.exists) {
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
for (let i = 0; i < 40; i++) {
    let move = (Math.random() - 0.5) * 5;
    let close = startPrice + move;
    let high = Math.max(startPrice, close) + Math.random();
    let low = Math.min(startPrice, close) - Math.random();

    candles.push({ open: startPrice, close: close, high: high, low: low });
    startPrice = close;
}
currentCandle = { open: startPrice, close: startPrice, high: startPrice, low: startPrice };

// THIS IS THE UPDATED FUNCTION
function drawChart() {
    ctx.clearRect(0, 0, width, height);
    
    // Combine history + current
    let allCandles = [...candles, currentCandle];
    
    // --- DYNAMIC CALCULATION START ---
    // Decide how many candles to show based on screen width for better look
    let numVisibleCandles = 30;
    if (width < 500) { // For small mobile screens
        numVisibleCandles = 20;
    }
    
    let visible = allCandles.slice(-numVisibleCandles);

    // Calculate total space for each candle (body + spacing) dynamically
    let totalCandleUnitWidth = (width - 20) / numVisibleCandles; // Adjusted padding
    
    // Assign 70% width to candle body and 30% to spacing
    let candleWidth = totalCandleUnitWidth * 0.7;
    let spacing = totalCandleUnitWidth * 0.3;
    // --- DYNAMIC CALCULATION END ---

    // Scale Y axis based on visible candles
    let minP = Math.min(...visible.map(c => c.low)) - 2;
    let maxP = Math.max(...visible.map(c => c.high)) + 2;
    let range = maxP - minP || 1;
    
    const getY = (p) => height - ((p - minP) / range) * (height - 40) - 20;
    const getX = (i) => i * (candleWidth + spacing) + 10; // Adjusted padding

    // Draw Grid
    ctx.strokeStyle = '#25262b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
        let y = (height / 5) * i;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
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
        ctx.moveTo(x + candleWidth / 2, yHigh);
        ctx.lineTo(x + candleWidth / 2, yLow);
        ctx.stroke();
        
        // Body
        let h = Math.abs(yClose - yOpen);
        if (h < 1) h = 1;
        ctx.fillRect(x, Math.min(yOpen, yClose), candleWidth, h);
    });

    // Update Price Line
    let curY = getY(currentCandle.close);
    
    const line = document.getElementById('curLine');
    line.style.top = curY + 'px';
    
    let lastX = getX(visible.length - 1);
    line.style.left = lastX + 'px';
    line.style.width = (width - lastX) + 'px';

    document.getElementById('curTag').innerText = currentCandle.close.toFixed(2);
    
    requestAnimationFrame(drawChart);
}
drawChart();

// Live Update Loop (With Admin Control)
setInterval(() => {
    let change = (Math.random() - 0.5) * 1.5;

    if (marketMode === 'UP') {
        change = (Math.random() * 1.0) + 0.2;
    } else if (marketMode === 'DOWN') {
        change = -(Math.random() * 1.0) - 0.2;
    }

    currentCandle.close += change;
    
    if (currentCandle.close > currentCandle.high) currentCandle.high = currentCandle.close;
    if (currentCandle.close < currentCandle.low) currentCandle.low = currentCandle.close;
}, 100);

// New Candle Loop
setInterval(() => {
    candles.push({ ...currentCandle });
    if (candles.length > 50) candles.shift();
    
    let nextOpen = currentCandle.close;
    currentCandle = { open: nextOpen, close: nextOpen, high: nextOpen, low: nextOpen };
}, 3000);


// --- TRADING LOGIC ---
function adjAmt(v) {
    if (invest + v >= 280) {
        invest += v;
        document.getElementById('amtVal').innerText = invest;
    }
}

async function trade(type) {
    if (!user) return document.getElementById('authModal').style.display = 'flex';
    if (balance < invest) return alert("Insufficient Coins");

    await db.collection('users').doc(user.uid).update({
        coins: firebase.firestore.FieldValue.increment(-invest)
    });

    const entryPrice = currentCandle.close;
    
    const overlay = document.getElementById('tradeOverlay');
    const line = document.createElement('div');
    line.className = 'trade-line';
    line.style.borderColor = type === 'up' ? 'var(--green)' : 'var(--red)';
    line.style.top = document.getElementById('curLine').style.top;

    line.innerHTML = `
        <div class="trade-badge" style="background:${type === 'up' ? 'var(--green)' : 'var(--red)'}">
            <i class="fa-solid fa-arrow-${type}"></i> ${invest} <span class="timer">${duration}s</span>
        </div>
    `;
    overlay.appendChild(line);

    let timeLeft = duration;
    const timerInt = setInterval(() => {
        timeLeft--;
        line.querySelector('.timer').innerText = timeLeft + 's';
        if (timeLeft <= 0) clearInterval(timerInt);
    }, 1000);

    setTimeout(async () => {
        line.remove();
        const exitPrice = currentCandle.close;
        let win = false;

        if (type === 'up' && exitPrice > entryPrice) win = true;
        else if (type === 'down' && exitPrice < entryPrice) win = true;

        showResult(win, win ? invest * 1.8 : 0);

        if (win) {
            await db.collection('users').doc(user.uid).update({
                coins: firebase.firestore.FieldValue.increment(invest * 2)
            });
        }

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
