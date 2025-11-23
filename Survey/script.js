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
const db = firebase.firestore();
const auth = firebase.auth();

let user = null, idx = 0, data = {}, isSignup = false;

// --- 100 QUESTIONS ARRAY ---
const questions = [
    // 1-10
    {q: "What is your gender?", type: "radio", opts: ["Male", "Female", "Other"]},
    {q: "What is your age?", type: "radio", opts: ["18-24", "25-34", "35-44", "45+"]},
    {q: "Marital Status?", type: "radio", opts: ["Single", "Married", "Divorced"]},
    {q: "Employment Status?", type: "radio", opts: ["Employed", "Student", "Unemployed"]},
    {q: "Do you have children?", type: "radio", opts: ["Yes", "No"]},
    {q: "Do you own a car?", type: "radio", opts: ["Yes", "No"]},
    {q: "Do you own a house?", type: "radio", opts: ["Yes", "No", "Rent"]},
    {q: "Highest Education?", type: "radio", opts: ["High School", "Bachelor", "Master", "PhD"]},
    {q: "Which city do you live in?", type: "text"},
    {q: "What is your profession?", type: "text"},
    // 11-20
    {q: "Which phone do you use?", type: "radio", opts: ["Android", "iPhone", "Other"]},
    {q: "Do you own a laptop?", type: "radio", opts: ["Yes", "No"]},
    {q: "Internet Provider?", type: "text"},
    {q: "Favorite Social Media?", type: "radio", opts: ["Facebook", "Instagram", "TikTok"]},
    {q: "Do you play games?", type: "radio", opts: ["Yes", "No"]},
    {q: "Console owned?", type: "radio", opts: ["PlayStation", "Xbox", "PC", "None"]},
    {q: "Do you shop online?", type: "radio", opts: ["Often", "Rarely", "Never"]},
    {q: "Preferred online store?", type: "text"},
    {q: "Do you use banking apps?", type: "radio", opts: ["Yes", "No"]},
    {q: "Do you use crypto?", type: "radio", opts: ["Yes", "No"]},
    // 21-30
    {q: "Do you smoke?", type: "radio", opts: ["Yes", "No"]},
    {q: "Do you drink coffee?", type: "radio", opts: ["Yes", "No"]},
    {q: "Do you exercise?", type: "radio", opts: ["Daily", "Weekly", "Never"]},
    {q: "Favorite food?", type: "text"},
    {q: "Do you like cooking?", type: "radio", opts: ["Yes", "No"]},
    {q: "Do you have pets?", type: "radio", opts: ["Dog", "Cat", "Bird", "None"]},
    {q: "Do you travel often?", type: "radio", opts: ["Yes", "No"]},
    {q: "Favorite holiday spot?", type: "text"},
    {q: "Do you watch movies?", type: "radio", opts: ["Yes", "No"]},
    {q: "Favorite Movie Genre?", type: "radio", opts: ["Action", "Comedy", "Drama"]},
    // 31-40
    {q: "Do you have insurance?", type: "radio", opts: ["Yes", "No"]},
    {q: "Do you wear glasses?", type: "radio", opts: ["Yes", "No"]},
    {q: "Sleep hours?", type: "radio", opts: ["<6", "6-8", "8+"]},
    {q: "Drink enough water?", type: "radio", opts: ["Yes", "No"]},
    {q: "Eat fast food?", type: "radio", opts: ["Often", "Rarely", "Never"]},
    {q: "Take vitamins?", type: "radio", opts: ["Yes", "No"]},
    {q: "Have allergies?", type: "radio", opts: ["Yes", "No"]},
    {q: "Blood type?", type: "text"},
    {q: "Height (cm)?", type: "text"},
    {q: "Weight (kg)?", type: "text"},
    // 41-50
    {q: "Have a credit card?", type: "radio", opts: ["Yes", "No"]},
    {q: "Have savings?", type: "radio", opts: ["Yes", "No"]},
    {q: "Invest in stocks?", type: "radio", opts: ["Yes", "No"]},
    {q: "Have loans?", type: "radio", opts: ["Yes", "No"]},
    {q: "Monthly income range?", type: "radio", opts: ["<20k", "20-50k", "50k+"]},
    {q: "Spend most on?", type: "radio", opts: ["Food", "Rent", "Shopping"]},
    {q: "Use mobile wallets?", type: "radio", opts: ["Yes", "No"]},
    {q: "Track expenses?", type: "radio", opts: ["Yes", "No"]},
    {q: "Own a business?", type: "radio", opts: ["Yes", "No"]},
    {q: "Donate to charity?", type: "radio", opts: ["Yes", "No"]},
    // 51-60
    {q: "Brand conscious?", type: "radio", opts: ["Yes", "No"]},
    {q: "Buy luxury items?", type: "radio", opts: ["Yes", "No"]},
    {q: "Use coupons?", type: "radio", opts: ["Yes", "No"]},
    {q: "Shop sales only?", type: "radio", opts: ["Yes", "No"]},
    {q: "Favorite clothing brand?", type: "text"},
    {q: "Favorite shoe brand?", type: "text"},
    {q: "Buy electronics often?", type: "radio", opts: ["Yes", "No"]},
    {q: "Buy groceries online?", type: "radio", opts: ["Yes", "No"]},
    {q: "Read reviews before buying?", type: "radio", opts: ["Yes", "No"]},
    {q: "Return items often?", type: "radio", opts: ["Yes", "No"]},
    // 61-70
    {q: "Have Netflix?", type: "radio", opts: ["Yes", "No"]},
    {q: "Have Spotify?", type: "radio", opts: ["Yes", "No"]},
    {q: "Watch YouTube daily?", type: "radio", opts: ["Yes", "No"]},
    {q: "Listen to podcasts?", type: "radio", opts: ["Yes", "No"]},
    {q: "Read books?", type: "radio", opts: ["Yes", "No"]},
    {q: "Go to concerts?", type: "radio", opts: ["Yes", "No"]},
    {q: "Go to cinema?", type: "radio", opts: ["Yes", "No"]},
    {q: "Play musical instrument?", type: "radio", opts: ["Yes", "No"]},
    {q: "Paint or draw?", type: "radio", opts: ["Yes", "No"]},
    {q: "Like dancing?", type: "radio", opts: ["Yes", "No"]},
    // 71-80
    {q: "Have passport?", type: "radio", opts: ["Yes", "No"]},
    {q: "Traveled abroad?", type: "radio", opts: ["Yes", "No"]},
    {q: "Prefer beach or mountains?", type: "radio", opts: ["Beach", "Mountain"]},
    {q: "Travel solo?", type: "radio", opts: ["Yes", "No"]},
    {q: "Stay in hotels?", type: "radio", opts: ["Yes", "No"]},
    {q: "Use Airbnb?", type: "radio", opts: ["Yes", "No"]},
    {q: "Been on a cruise?", type: "radio", opts: ["Yes", "No"]},
    {q: "Like camping?", type: "radio", opts: ["Yes", "No"]},
    {q: "Travel for work?", type: "radio", opts: ["Yes", "No"]},
    {q: "Dream destination?", type: "text"},
    // 81-90
    {q: "Believe in aliens?", type: "radio", opts: ["Yes", "No"]},
    {q: "Believe in ghosts?", type: "radio", opts: ["Yes", "No"]},
    {q: "Follow politics?", type: "radio", opts: ["Yes", "No"]},
    {q: "Care about environment?", type: "radio", opts: ["Yes", "No"]},
    {q: "Recycle?", type: "radio", opts: ["Yes", "No"]},
    {q: "Trust news?", type: "radio", opts: ["Yes", "No"]},
    {q: "Like technology?", type: "radio", opts: ["Yes", "No"]},
    {q: "Optimistic about future?", type: "radio", opts: ["Yes", "No"]},
    {q: "Like big cities?", type: "radio", opts: ["Yes", "No"]},
    {q: "Prefer quiet life?", type: "radio", opts: ["Yes", "No"]},
    // 91-100
    {q: "Use dating apps?", type: "radio", opts: ["Yes", "No"]},
    {q: "Like spicy food?", type: "radio", opts: ["Yes", "No"]},
    {q: "Drink energy drinks?", type: "radio", opts: ["Yes", "No"]},
    {q: "Own a smartwatch?", type: "radio", opts: ["Yes", "No"]},
    {q: "Use VR headset?", type: "radio", opts: ["Yes", "No"]},
    {q: "Have a mentor?", type: "radio", opts: ["Yes", "No"]},
    {q: "Happy with job?", type: "radio", opts: ["Yes", "No"]},
    {q: "Happy with life?", type: "radio", opts: ["Yes", "No"]},
    {q: "Enjoyed this survey?", type: "radio", opts: ["Yes", "No"]},
    {q: "Any feedback?", type: "text"}
];

// --- RENDER ---
const container = document.getElementById("qContainer");
questions.forEach((q, i) => {
    let html = `<div class="question-card" id="q${i}"><div class="question-text">${i+1}. ${q.q}</div>`;
    
    if(q.type === "text") {
        html += `<input type="text" onchange="saveAns(${i}, this.value)" placeholder="Type your answer here...">`;
    } else {
        html += `<ul class="options-list">`;
        q.opts.forEach(opt => {
            html += `<li><label><input type="radio" name="q${i}" value="${opt}" onchange="saveAns(${i}, '${opt}')"> ${opt}</label></li>`;
        });
        html += `</ul>`;
    }
    container.innerHTML += html + `</div>`;
});

// --- NAV ---
function show(i) {
    document.querySelectorAll('.question-card').forEach(el => el.classList.remove('active'));
    document.getElementById(`q${i}`).classList.add('active');
    document.getElementById('qCount').innerText = `Question ${i+1} of 100`;
    
    let prog = ((i+1)/100)*100;
    document.getElementById('progBar').style.width = prog + "%";
    
    document.getElementById('prevBtn').style.display = i===0 ? 'none':'block';
    document.getElementById('nextBtn').innerText = i===99 ? 'Submit' : 'Next';
}

function saveAns(i, val) { data[`Q${i+1}`] = val; }

function move(dir) {
    if(dir === 1 && idx === 99) return submit();
    if(idx + dir >= 0 && idx + dir < 100) {
        idx += dir;
        show(idx);
    }
}

// --- SUBMIT ---
async function submit() {
    if(!user) {
        alert("Please Login to Submit!");
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    const btn = document.getElementById('nextBtn');
    btn.disabled = true; btn.innerText = "Sending...";

    try {
        await db.collection('survey_submissions').add({
            email: user.email,
            uid: user.uid,
            answers: data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        const reward = Math.floor(Math.random() * 30) + 1;
        await db.collection('users').doc(user.uid).update({
            coins: firebase.firestore.FieldValue.increment(reward)
        });

        alert(`Success! You earned ${reward} Coins.`);
        location.reload();
    } catch(e) { alert(e.message); btn.disabled = false; }
}

// --- AUTH ---
auth.onAuthStateChanged(u => {
    user = u;
    if(u) {
        document.getElementById('uEmail').innerText = u.email.split('@')[0];
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('authModal').style.display = 'none';
        
        db.collection('users').doc(u.uid).onSnapshot(d => {
            if(d.exists) document.getElementById('bal').innerText = d.data().coins;
        });
    }
});

document.getElementById('profileBtn').onclick = () => document.getElementById('authModal').style.display = 'flex';

function toggleAuth() {
    isSignup = !isSignup;
    document.getElementById('authTitle').innerText = isSignup ? "Signup" : "Login";
}

document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    const m = document.getElementById('em').value;
    const p = document.getElementById('pw').value;
    
    try {
        if(isSignup) {
            const c = await auth.createUserWithEmailAndPassword(m, p);
            await db.collection('users').doc(c.user.uid).set({
                email: m, coins: 0, createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("Created!");
        } else {
            await auth.signInWithEmailAndPassword(m, p);
            alert("Logged In!");
        }
        // Retry submit if on last step
        if(idx === 99) submit();
    } catch(err) { alert(err.message); }
};

document.getElementById('logoutBtn').onclick = () => {
    auth.signOut(); location.reload();
};

show(0);
