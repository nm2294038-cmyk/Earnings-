// ====================================================================
// 1. FIREBASE CONFIGURATION & SETUP
// ====================================================================

const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
    measurementId: "G-HJQ46RQNZS"
};

// Initialize Firebase (Standard/Compat Mode)
if (typeof firebase === 'undefined') {
    console.error("Firebase SDK not loaded. Check your HTML file.");
} else {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
}

const auth = firebase.auth();
const db = firebase.firestore();

// --- GLOBAL STATE AND CONSTANTS ---
let isSignupMode = false;
let currentUser = null;

// --- FIRESTORE COLLECTION NAMES ---
const VIDEO_COLLECTION = 'video_sections';
const EARNINGS_COLLECTION = 'worker_earnings';
const USER_COLLECTION = 'users';

// --- DEFAULT VIDEO LINKS (FALLBACK DATA) ---
const DEFAULT_VIDEOS = [
    { id: 1, link: "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", reward: 10, time: 250 }, 
    { id: 2, link: "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", reward: 10, time: 250 }, 
    { id: 3, link: "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", reward: 10, time: 250 }, 
    { id: 4, link: "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", reward: 10, time: 250 }, 
    { id: 5, link: "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", reward: 10, time: 250 }, 
    { id: 6, link: "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", reward: 10, time: 250 }, 
    { id: 7, link: "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", reward: 10, time: 250 }, 
    { id: 8, link: "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", reward: 10, time: 250 }, 
    { id: 9, link: "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", reward: 10, time: 250 }, 
    { id: 10, link: "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", reward: 10, time: 250 }
];

// --- NEW: Video Data State ---
let availableVideos = []; 
const rewardedVideos = {}; 

// --- DOM ELEMENTS ---
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authButton = document.getElementById('authButton');
const toggleText = document.getElementById('toggleText');
const logoutButton = document.getElementById('logoutButton');
const walletDisplay = document.getElementById('walletDisplay');
const newBalanceDisplay = document.getElementById('newBalanceDisplay');
const rewardCoinsDisplay = document.getElementById('rewardCoinsDisplay');
const container = document.getElementById('mainContainer');
const authNameInput = document.getElementById('authName');


// ====================================================================
// 2. AUTHENTICATION AND INITIALIZATION
// ====================================================================

function toggleAuthMode() {
    isSignupMode = !isSignupMode;
    if (isSignupMode) {
        authTitle.textContent = "Signup Karen";
        authButton.textContent = "Signup";
        toggleText.innerHTML = 'Account hai? <a onclick="toggleAuthMode()">Login Karen</a>';
        authNameInput.style.display = 'block';
        authNameInput.required = true;
    } else {
        authTitle.textContent = "Login Karen";
        authButton.textContent = "Login";
        toggleText.innerHTML = 'Account nahi hai? <a onclick="toggleAuthMode()">Signup Karen</a>';
        authNameInput.style.display = 'none';
        authNameInput.required = false;
    }
}

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName').value;


    try {
        if (isSignupMode) {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            await userCredential.user.updateProfile({ displayName: name });
            
            await db.collection(USER_COLLECTION).doc(userCredential.user.uid).set({
                coins: 0,
                email: email,
                name: name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("Signup Successful! Welcome.");
        } else {
            await auth.signInWithEmailAndPassword(email, password);
            alert("Login Successful!");
        }
        authModal.style.display = 'none';
    } catch (error) {
        alert(`Authentication Failed: ${error.message}`);
    }
});

logoutButton.addEventListener('click', async () => {
    await auth.signOut();
    Object.keys(rewardedVideos).forEach(key => rewardedVideos[key] = false);
    alert("Logout Successful.");
});

// Real-time Auth State Listener
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        document.getElementById('profileIcon').textContent = '✅';
        walletDisplay.style.display = 'block';
        logoutButton.style.display = 'block';
        toggleText.style.display = 'none';
        
        listenToWallet(user.uid);
        updateVideoOverlays(true);

    } else {
        document.getElementById('profileIcon').textContent = '👤';
        walletDisplay.style.display = 'none';
        logoutButton.style.display = 'none';
        toggleText.style.display = 'block';
        
        updateVideoOverlays(false);
    }
});


// ====================================================================
// 3. WALLET AND FIRESTORE FUNCTIONS
// ====================================================================

function listenToWallet(uid) {
    db.collection(USER_COLLECTION).doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            const coins = data.coins ? Number(data.coins) : 0; 
            walletDisplay.textContent = `Coins: ${coins.toLocaleString()}`;
            newBalanceDisplay.textContent = coins.toLocaleString(); 
        } else {
            db.collection(USER_COLLECTION).doc(uid).set({ coins: 0 });
        }
    }, error => {
        console.error("Error listening to wallet:", error);
    });
}

async function addCoinsToWallet(uid, amount, sourceDetails) {
    const userRef = db.collection(USER_COLLECTION).doc(uid);
    const userEmail = currentUser.email;

    try {
        // 1. Update Wallet
        await userRef.update({
            coins: firebase.firestore.FieldValue.increment(amount) 
        });

        // 2. Log Earning for Admin Panel
        await db.collection(EARNINGS_COLLECTION).add({
            userId: uid,
            email: userEmail,
            amount: amount,
            source: sourceDetails.source,
            reference: sourceDetails.reference,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

    } catch (error) {
        console.error("Error updating wallet/logging earning:", error);
        alert("Coins add nahi ho paye. Database connection ya permissions check karen.");
    }
}

// ====================================================================
// 4. VIDEO AND TIMER LOGIC
// ====================================================================

function getYouTubeId(url) {
    let match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];
    match = url.match(/youtu\.be\/([^?]+)/);
    if (match) return match[1];
    return 'fjHXG7brtso'; 
}

function updateVideoOverlays(isLoggedIn) {
    document.querySelectorAll('.video-overlay').forEach(overlay => {
        if (isLoggedIn) {
            overlay.classList.remove('disabled');
            overlay.querySelector('.video-overlay-text').textContent = 'Video Play Karen Aur Coins Kamaen';
        } else {
            overlay.classList.add('disabled');
            overlay.querySelector('.video-overlay-text').textContent = 'Login Karen Coins Kamane Ke Liye';
        }
    });
}

function showRewardPopup(coins) {
    document.getElementById('rewardModal').style.display = "flex"; 
    rewardCoinsDisplay.textContent = coins.toLocaleString();
}

function startTimer(sectionId, rewardTime, rewardCoins, overlayElement, videoLink) {
    if (!currentUser || rewardedVideos[sectionId]) return; 

    const timerDisplay = document.getElementById(`timer-${sectionId}`);
    timerDisplay.style.display = 'block';
    let timeLeft = rewardTime;
    
    timerDisplay.textContent = `Timer: ${timeLeft} seconds remaining...`;

    const timerInterval = setInterval(async () => {
        timeLeft--;
        timerDisplay.textContent = `Timer: ${timeLeft} seconds remaining...`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            
            rewardedVideos[sectionId] = true; 
            
            // --- 1. Coins add karna ---
            const sourceDetails = {
                source: "Video Reward",
                reference: `Section ${sectionId} (${videoLink})`
            };
            await addCoinsToWallet(currentUser.uid, rewardCoins, sourceDetails);
            
            // --- 2. UI update ---
            timerDisplay.textContent = `Mubarak! ${rewardCoins.toLocaleString()} Coins Mil Gaye!`;
            timerDisplay.style.backgroundColor = '#d4edda';
            timerDisplay.style.color = '#155724';
            
            // --- 3. Popup dikhana ---
            showRewardPopup(rewardCoins);
            
            // --- 4. Overlay ko wapas lana ---
            overlayElement.style.display = 'flex';
            overlayElement.style.opacity = '1';
            overlayElement.querySelector('.video-overlay-text').textContent = 'Reward Mil Chuka Hai!';
            overlayElement.classList.add('disabled');
        }
    }, 1000);
}

// Function to handle the click on the overlay
function handleVideoClick(event, sectionId, videoData) {
    const overlay = event.currentTarget;
    
    if (!currentUser) {
        alert("Coins kamane ke liye pehle Login ya Signup karen.");
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    if (rewardedVideos[sectionId]) {
        alert("Aap is video ka reward pehle hi le chuke hain.");
        return;
    }
    
    if (overlay.classList.contains('disabled')) {
         return;
    }

    const iframe = overlay.nextElementSibling;
    
    // 1. Overlay remove karna
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);

    // 2. Video ko autoplay karna
    const videoLink = videoData.link;
    const videoId = getYouTubeId(videoLink);
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0`;

    // 3. Timer shuru karna
    startTimer(sectionId, videoData.time, videoData.reward, overlay, videoLink);
}


// --- DYNAMIC SECTION GENERATION (UPDATED TO FETCH FROM FIRESTORE) ---
function generateSections(videosToDisplay) {
    container.innerHTML = '';
    
    if (videosToDisplay.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:50px; color:#555;">No videos available. Please check the Admin Panel.</p>';
        return;
    }

    videosToDisplay.forEach(video => {
        const i = video.id;
        const currentLink = video.link;
        const videoId = getYouTubeId(currentLink);
        const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`;
        const rewardCoins = video.reward || 10;
        const rewardTime = video.time || 250;

        const section = document.createElement('div');
        section.classList.add('section');
        section.id = `section${i}`;
        
        section.innerHTML = `
            <h2>Section ${i}: Watch & Earn ${rewardCoins.toLocaleString()} Coins</h2>
            <div class="video-wrapper">
                
                <!-- Overlay for click detection -->
                <div class="video-overlay" id="overlay-${i}">
                    <span class="video-overlay-text">Video Play Karen Aur Coins Kamaen</span>
                </div>

                <!-- Iframe -->
                <iframe 
                    src="${embedUrl}" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
            
            <!-- Timer Display -->
            <div class="timer-display" id="timer-${i}">
                Timer: ${rewardTime} seconds remaining...
            </div>
        `;
        
        container.appendChild(section);
        rewardedVideos[i] = false; 

        const overlayElement = document.getElementById(`overlay-${i}`);
        // Pass the entire video object to the handler
        overlayElement.addEventListener('click', (e) => handleVideoClick(e, i, video));
    });
    updateVideoOverlays(currentUser);
}

// --- NEW: Firestore Listener for Videos with Fallback ---
function listenToVideoSections() {
    db.collection(VIDEO_COLLECTION).orderBy('id').onSnapshot(snapshot => {
        availableVideos = [];
        snapshot.forEach(doc => {
            // Ensure ID is a number for sorting/mapping
            const data = doc.data();
            data.id = Number(data.id); 
            availableVideos.push(data);
        });
        
        // If Firestore is empty, use the default videos
        if (availableVideos.length === 0) {
            console.log("Firestore video list is empty. Using default hardcoded videos.");
            generateSections(DEFAULT_VIDEOS);
        } else {
            generateSections(availableVideos);
        }

    }, error => {
        console.error("Error fetching video sections:", error);
        // Fallback to default videos on connection error
        container.innerHTML = '<p style="text-align:center; padding:50px; color:orange;">Warning: Could not connect to Admin Videos. Using default videos.</p>';
        generateSections(DEFAULT_VIDEOS);
    });
}


// ====================================================================
// 5. EVENT LISTENERS AND INITIAL LOAD
// ====================================================================

document.getElementById('profileIcon').addEventListener('click', () => {
    document.getElementById('authModal').style.display = 'flex';
});

// Start the app by listening to video sections first
listenToVideoSections();
