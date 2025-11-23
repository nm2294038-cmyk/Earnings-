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
let currentUser = null;
let userBoxData = {};
let isSignup = false;

function randomColor() { return "#" + Math.floor(Math.random() * 16777215).toString(16); }

// --- RENDER BOXES ---
const boxArea = document.getElementById("boxArea");

function renderBoxes() {
    boxArea.innerHTML = '';
    
    for (let i = 1; i <= 100; i++) {
        let box = document.createElement("div");
        box.className = "box";
        box.id = "box" + i;
        
        let bg = randomColor();
        let border = randomColor();
        let text = randomColor();
        let link = `https://toolswebsite205.blogspot.com/?box=${i}`;

        box.style.background = bg;
        box.style.borderColor = border;
        box.style.color = text;

        // Check Lock
        const now = Date.now();
        const lockTime = userBoxData[`box_${i}`] || 0;
        const isLocked = now < lockTime;

        if (isLocked) {
            box.classList.add("locked");
            const timeLeft = Math.ceil((lockTime - now) / (1000 * 60 * 60));
            box.innerHTML = `<div class="lock-overlay">🔒</div><small>Opens in ${timeLeft}h</small>`;
        } else {
            // Box Content
            box.innerHTML = `
                <div class="reward-label">Win 100-1000</div>
                <b style="font-size:1.4em;">Box ${i}</b>
                <a href="${link}" class="link-icon" target="_blank"><i class="fas fa-gift"></i></a>
            `;
        }

        box.onclick = (e) => handleBoxClick(i, link, isLocked, e);
        boxArea.appendChild(box);
    }
}

// --- CLICK LOGIC ---
async function handleBoxClick(boxId, link, isLocked, e) {
    if (!currentUser) {
        alert("Please Login to claim rewards!");
        document.getElementById('authModal').style.display = 'flex';
        return;
    }

    if (isLocked) {
        alert("Box is locked! Please wait for cooldown.");
        return;
    }

    if (!e.target.closest("a")) {
        window.open(link, "_blank");
    }

    // REAL REWARD (1-10 Coins)
    const reward = Math.floor(Math.random() * 10) + 1;
    const lockUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 Hours Lock
    
    try {
        const batch = db.batch();
        
        // 1. UPDATE USER WALLET
        const userRef = db.collection("users").doc(currentUser.uid);
        batch.update(userRef, {
            coins: firebase.firestore.FieldValue.increment(reward),
            [`boxes.box_${boxId}`]: lockUntil
        });

        // 2. SAVE LOG FOR ADMIN
        const logRef = db.collection("box_logs").doc();
        batch.set(logRef, {
            userId: currentUser.uid,
            email: currentUser.email,
            boxId: boxId,
            amount: reward,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();
        
        userBoxData[`box_${boxId}`] = lockUntil;
        renderBoxes();
        
        showNotification(`🎉 Congratulations! You won ${reward} Coins!`);

    } catch (err) {
        console.error("Error:", err);
    }
}

function showNotification(msg) {
    const n = document.getElementById("notification");
    n.innerHTML = msg;
    n.style.display = "block";
    setTimeout(() => n.style.display = "none", 3000);
}

// --- AUTHENTICATION ---
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        document.getElementById("userEmailDisplay").innerText = user.email.split('@')[0];
        document.getElementById("logoutBtn").style.display = "block";
        document.getElementById("authForm").style.display = "none";
        
        db.collection("users").doc(user.uid).onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById("coinBalance").innerText = data.coins || 0;
                userBoxData = data.boxes || {};
                renderBoxes();
            } else {
                // Fallback for old users
                db.collection("users").doc(user.uid).set({ coins: 0, boxes: {} }, { merge: true });
            }
        });
    } else {
        document.getElementById("userEmailDisplay").innerText = "Guest";
        document.getElementById("coinBalance").innerText = "0";
        userBoxData = {};
        renderBoxes();
    }
});

// --- AUTH HANDLERS ---
document.getElementById("profileBtn").onclick = () => document.getElementById('authModal').style.display = 'flex';

function toggleAuth() {
    isSignup = !isSignup;
    document.getElementById("authTitle").innerText = isSignup ? "Create Account" : "Login";
}

document.getElementById("authForm").onsubmit = async (e) => {
    e.preventDefault();
    const em = document.getElementById("email").value;
    const ps = document.getElementById("password").value;
    
    try {
        if(isSignup) {
            // 1. Create Auth
            const cred = await auth.createUserWithEmailAndPassword(em, ps);
            
            // 2. Save to Firestore
            await db.collection("users").doc(cred.user.uid).set({
                email: em,
                coins: 0,
                boxes: {},
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert("Account Created Successfully!");
        } else {
            await auth.signInWithEmailAndPassword(em, ps);
            alert("Logged In!");
        }
        document.getElementById('authModal').style.display='none';
    } catch(e) { alert(e.message); }
};

document.getElementById("logoutBtn").onclick = () => {
    auth.signOut();
    location.reload();
};

renderBoxes();
