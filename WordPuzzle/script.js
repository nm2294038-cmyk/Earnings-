// ====================================================================
// A. FIREBASE CONFIGURATION & INITIAL STATE
// ====================================================================

const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
};

let auth, db;
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
} else {
    console.error("Firebase SDKs not loaded.");
}

let currentUserId = null;
let authMode = 'signup';
let userProgress = {}; // Stores {themeName: currentPuzzleIndex}
let currentWalletBalance = 0;
let walletListener = null;

const USERS_COLLECTION = "users";

// ====================================================================
// B. GAME DATA (Themes and Puzzles)
// ====================================================================

const PUZZLE_DATA = {
    Animals: [
        { word: "LION", hint: "King of the jungle" }, { word: "TIGER", hint: "Striped wild cat" },
        { word: "BEAR", hint: "Sleeps in winter" }, { word: "ZEBRA", hint: "Black and white stripes" },
        { word: "DOG", hint: "Man's best friend" }, { word: "CAT", hint: "Loves milk and sleeping" },
        { word: "MOUSE", hint: "Small rodent" }, { word: "ELEPHANT", hint: "Has a long trunk" },
        { word: "GIRAFFE", hint: "Has a long neck" }, { word: "MONKEY", hint: "Loves bananas" },
        { word: "WOLF", hint: "Hunts in packs" }, { word: "FOX", hint: "Is known for cunning" },
        { word: "PANDA", hint: "Eats bamboo" }, { word: "RABBIT", hint: "Hops around" },
        { word: "DEER", hint: "Known for antlers" }, { word: "FISH", hint: "Swims in water" },
        { word: "SHARK", hint: "Dangerous sea creature" }, { word: "EAGLE", hint: "Flies high" },
        { word: "SNAKE", hint: "Has no legs" }, { word: "CROCODILE", hint: "Reptile with strong jaws" },
        { word: "COW", hint: "Gives us milk" }, { word: "SHEEP", hint: "Gives us wool" },
        { word: "GOAT", hint: "Eats almost anything" }, { word: "HORSE", hint: "Used for riding" },
        { word: "DONKEY", hint: "Carries heavy loads" }, { word: "CHICKEN", hint: "Lays eggs" },
        { word: "DUCK", hint: "Quacks and swims" }, { word: "TURTLE", hint: "Slow reptile with a shell" },
        { word: "KANGAROO", hint: "Jumps in Australia" }, { word: "RHINO", hint: "Large animal with a horn" }
    ],
    Colors: [
        { word: "RED", hint: "Color of an apple" }, { word: "BLUE", hint: "Color of the sky" },
        { word: "GREEN", hint: "Color of grass" }, { word: "YELLOW", hint: "Color of the sun" },
        { word: "ORANGE", hint: "Named after a fruit" }, { word: "PURPLE", hint: "Mix of red and blue" },
        { word: "PINK", hint: "Light red" }, { word: "BROWN", hint: "Color of chocolate" },
        { word: "BLACK", hint: "Absorbs all light" }, { word: "WHITE", hint: "Reflects all light" },
        { word: "GRAY", hint: "Mix of black and white" }, { word: "GOLD", hint: "Precious metal color" },
        { word: "SILVER", hint: "Another precious metal color" }, { word: "CYAN", hint: "Light blue-green" },
        { word: "MAGENTA", hint: "Vibrant purplish-red" }, { word: "TURQUOISE", hint: "Gemstone color" },
        { word: "MAROON", hint: "Dark brownish-red" }, { word: "VIOLET", hint: "Close to purple" },
        { word: "LIME", hint: "Bright green color" }, { word: "BEIGE", hint: "Pale sandy fawn color" },
        { word: "TEAL", hint: "Dark bluish-green" }, { word: "INDIGO", hint: "Deep dark blue" },
        { word: "CORAL", hint: "Pinkish-orange" }, { word: "CRIMSON", hint: "Rich deep red" },
        { word: "AQUA", hint: "Water color" }, { word: "BRONZE", hint: "Metallic brown" },
        { word: "LAVENDER", hint: "Pale purple shade" }, { word: "NAVY", hint: "Very dark blue" },
        { word: "OCHRE", hint: "Yellowish brown" }, { word: "OLIVE", hint: "Dull yellowish-green" }
    ],
    // Simplified placeholder data for other 10 themes, each with 30 puzzles
    Cities: new Array(30).fill(null).map((_, i) => ({ word: `CITY${i+1}`, hint: `Famous city ${i+1}` })),
    Nature: new Array(30).fill(null).map((_, i) => ({ word: `TREE${i+1}`, hint: `Found in the outdoors ${i+1}` })),
    House: new Array(30).fill(null).map((_, i) => ({ word: `ROOM${i+1}`, hint: `Part of a home ${i+1}` })),
    Adjectives: new Array(30).fill(null).map((_, i) => ({ word: `BIG${i+1}`, hint: `Describes a noun ${i+1}` })),
    'TV Shows': new Array(30).fill(null).map((_, i) => ({ word: `SHOW${i+1}`, hint: `Watched on TV ${i+1}` })),
    Countries: new Array(30).fill(null).map((_, i) => ({ word: `ASIA${i+1}`, hint: `A sovereign nation ${i+1}` })),
    Monuments: new Array(30).fill(null).map((_, i) => ({ word: `STATUE${i+1}`, hint: `Famous landmark ${i+1}` })),
    'Actors & Directors': new Array(30).fill(null).map((_, i) => ({ word: `STAR${i+1}`, hint: `Film professional ${i+1}` })),
    Writers: new Array(30).fill(null).map((_, i) => ({ word: `BOOK${i+1}`, hint: `Author of books ${i+1}` })),
    History: new Array(30).fill(null).map((_, i) => ({ word: `WAR${i+1}`, hint: `Past events ${i+1}` })),
};

const THEME_ICONS = {
    Animals: { icon: 'fas fa-paw', color: '#880e4f' },
    Colors: { icon: 'fas fa-palette', color: '#6a1b9a' },
    Cities: { icon: 'fas fa-city', color: '#ff9800' },
    Nature: { icon: 'fas fa-leaf', color: '#ff8a00' },
    House: { icon: 'fas fa-home', color: '#1565c0' },
    Adjectives: { icon: 'fas fa-balance-scale', color: '#66bb6a' },
    'TV Shows': { icon: 'fas fa-tv', color: '#ff8a00' },
    Countries: { icon: 'fas fa-globe-asia', color: '#e53935' },
    Monuments: { icon: 'fas fa-landmark', color: '#ff8a00' },
    'Actors & Directors': { icon: 'fas fa-theater-masks', color: '#ff9800' },
    Writers: { icon: 'fas fa-pen-fancy', color: '#e53935' },
    History: { icon: 'fas fa-scroll', color: '#4527a0' }
};

let currentTheme = 'Animals';
let currentPuzzleIndex = 0;
let currentTargetWord = '';
let currentAttempt = [];
let lettersUsed = []; // Stores the selected button element and letter

// ====================================================================
// C. MODAL AND AUTHENTICATION HANDLERS
// ====================================================================

function showModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    // Reset auth modal state if closing auth modal
    if (id === 'auth-modal') {
        document.getElementById('auth-form').style.display = 'none';
        document.getElementById('guide-content').style.display = 'block';
        document.getElementById('modal-heading').textContent = 'How to Start';
    }
}

function showAuthForm(mode) {
    document.getElementById('guide-content').style.display = 'none';
    document.getElementById('auth-form').style.display = 'block';
    setAuthMode(mode);
    showModal('auth-modal');
}

function setAuthMode(mode) {
    authMode = mode;
    const heading = document.getElementById('modal-heading');
    const submitBtn = document.getElementById('auth-submit-btn');
    const switchText = document.getElementById('switch-text');
    const switchLink = document.getElementById('switch-link');
    const nameInput = document.getElementById('auth-name');

    if (mode === 'signup') {
        heading.textContent = "Create Account"; submitBtn.textContent = "Sign Up";
        switchText.textContent = "Already have an account? "; switchLink.textContent = "Login";
        nameInput.style.display = 'block'; nameInput.required = true;
    } else {
        heading.textContent = "Log In"; submitBtn.textContent = "Login";
        switchText.textContent = "Don't have an account? "; switchLink.textContent = "Sign Up";
        nameInput.style.display = 'none'; nameInput.required = false;
    }
}

function toggleAuthMode() {
    if (authMode === 'signup') { setAuthMode('login'); } else { setAuthMode('signup'); }
}

async function handleAuthSubmit() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name').value;
    const submitBtn = document.getElementById('auth-submit-btn');

    if (!auth || !db) { alert("Firebase not initialized."); return; }

    submitBtn.disabled = true;

    try {
        if (authMode === 'signup') {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;
            await db.collection(USERS_COLLECTION).doc(uid).set({
                name: name, email: email, coins: 0,
                progress: {},
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert(`Account created! Welcome, ${name}!`);
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }
        closeModal('auth-modal');
    } catch (error) {
        console.error("Auth error:", error);
        alert("Authentication failed: " + error.message);
    } finally {
        submitBtn.disabled = false;
        setAuthMode(authMode);
    }
}

// ====================================================================
// D. FIREBASE DATA LISTENERS
// ====================================================================

auth.onAuthStateChanged(async user => {
    if (user) {
        currentUserId = user.uid;
        initializeUserDataListeners(user.uid);
    } else {
        currentUserId = null;
        currentWalletBalance = 0;
        userProgress = {};
        updateWalletUI();
        renderThemes(); // Render themes but they will be disabled/locked
    }
});

function initializeUserDataListeners(uid) {
    if (walletListener) { walletListener(); } // Unsubscribe previous listener

    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    
    walletListener = userRef.onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            currentWalletBalance = data.coins || 0;
            userProgress = data.progress || {};
            updateWalletUI();
            renderThemes();
        } else {
            // Should not happen if data was set on signup/login, but ensures UI updates
            console.warn("User data initialized but document not found yet.");
        }
    }, error => {
        console.error("Error listening to wallet data:", error);
    });
}

function updateWalletUI() {
    const walletDisplay = document.getElementById('wallet-display');
    walletDisplay.textContent = `${currentWalletBalance.toLocaleString()} Coins`;
}

async function awardCoins(themeName) {
    if (!currentUserId) return;

    // Award random coins between 1 and 10
    const reward = Math.floor(Math.random() * 10) + 1; 
    const userRef = db.collection(USERS_COLLECTION).doc(currentUserId);

    // 1. Update wallet balance (using Firestore increment for safety)
    await userRef.update({
        coins: firebase.firestore.FieldValue.increment(reward)
    });
    
    // 2. Show notification
    document.getElementById('reward-amount').textContent = reward;
    const notification = document.getElementById('coin-notification');
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 2500);
}

async function updateProgress(themeName, newIndex) {
    if (!currentUserId) return;

    const userRef = db.collection(USERS_COLLECTION).doc(currentUserId);
    
    // Update progress using dot notation for specific theme
    const updateObject = {};
    updateObject[`progress.${themeName}`] = newIndex;

    await userRef.update(updateObject);
}

// ====================================================================
// E. THEME RENDERING
// ====================================================================

function renderThemes() {
    const grid = document.getElementById('theme-grid');
    grid.innerHTML = '';

    Object.keys(PUZZLE_DATA).forEach(themeName => {
        const totalPuzzles = PUZZLE_DATA[themeName].length;
        const completedPuzzles = userProgress[themeName] || 0;
        const progressPercentage = (completedPuzzles / totalPuzzles) * 100;
        const iconInfo = THEME_ICONS[themeName];
        const isMastered = completedPuzzles >= totalPuzzles;

        const card = document.createElement('div');
        card.className = 'theme-card';
        card.setAttribute('data-theme', themeName);
        
        card.innerHTML = `
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercentage}%; background-color: ${iconInfo.color};"></div>
            </div>
            <span class="progress-text">${completedPuzzles}/${totalPuzzles}</span>
            <div class="card-icon" style="color: ${iconInfo.color};"><i class="${iconInfo.icon}"></i></div>
            <div class="card-title">${themeName}</div>
            <div class="coin-cost">
                ${isMastered ? 'MASTERED' : 'Reward'}
                <i class="fas fa-coins"></i>
            </div>
        `;

        if (currentUserId) {
            card.addEventListener('click', () => {
                startGame(themeName);
            });
        } else {
            // Apply dimmed effect if not logged in
            card.style.opacity = 0.6;
            card.style.cursor = 'default';
            card.addEventListener('click', () => {
                 alert("Please sign up or log in to play the game and save your progress.");
                 showModal('auth-modal');
            });
        }
        
        grid.appendChild(card);
    });
}

// ====================================================================
// F. GAME LOGIC (Word Puzzle)
// ====================================================================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateLetterOptions(word) {
    const letters = word.split('');
    // Add 3 random filler letters
    for (let i = 0; i < 3; i++) {
        const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        letters.push(randomChar);
    }
    return shuffleArray(letters);
}

function startGame(themeName) {
    currentTheme = themeName;
    currentPuzzleIndex = userProgress[themeName] || 0;

    if (currentPuzzleIndex >= PUZZLE_DATA[themeName].length) {
        document.getElementById('message-area').textContent = "Congratulations! You have mastered this theme!";
        document.getElementById('game-puzzle-counter').textContent = `Puzzle ${currentPuzzleIndex}/30`;
        showModal('game-modal');
        return;
    }

    loadPuzzle(currentPuzzleIndex);
    document.getElementById('game-theme-title').textContent = `Theme: ${currentTheme}`;
    showModal('game-modal');
}

function loadPuzzle(index) {
    const puzzle = PUZZLE_DATA[currentTheme][index];
    currentTargetWord = puzzle.word;
    currentAttempt = Array(currentTargetWord.length).fill('_');
    lettersUsed = [];

    document.getElementById('game-puzzle-counter').textContent = `Puzzle ${index + 1}/30`;
    document.getElementById('hint-display').textContent = `Hint: ${puzzle.hint}`;
    document.getElementById('message-area').textContent = '';
    
    updateWordDisplay();
    renderLetterOptions(currentTargetWord);
}

function updateWordDisplay() {
    document.getElementById('current-word-display').textContent = currentAttempt.join(' ');
}

function renderLetterOptions(word) {
    const optionsContainer = document.getElementById('letter-options');
    optionsContainer.innerHTML = '';
    
    const options = generateLetterOptions(word);
    options.forEach((letter, index) => {
        const button = document.createElement('button');
        button.className = 'letter-btn';
        button.textContent = letter;
        button.setAttribute('data-index', index);
        button.onclick = () => selectLetter(letter, button);
        optionsContainer.appendChild(button);
    });
}

function selectLetter(letter, button) {
    if (currentAttempt.includes('_')) {
        const emptyIndex = currentAttempt.indexOf('_');
        currentAttempt[emptyIndex] = letter;
        // Store the button reference and its value for clearing
        lettersUsed.push({ letter: letter, button: button }); 
        button.disabled = true;
        updateWordDisplay();
        document.getElementById('message-area').textContent = '';
    }
}

function clearAttempt() {
    currentAttempt = Array(currentTargetWord.length).fill('_');
    
    // Re-enable all used buttons
    lettersUsed.forEach(item => {
        item.button.disabled = false;
    });
    lettersUsed = [];
    
    updateWordDisplay();
    document.getElementById('message-area').textContent = '';
}

async function checkPuzzle() {
    const attemptedWord = currentAttempt.join('');
    
    if (attemptedWord.length < currentTargetWord.length || currentAttempt.includes('_')) {
        document.getElementById('message-area').textContent = "Please fill all spaces.";
        return;
    }

    if (attemptedWord === currentTargetWord) {
        document.getElementById('message-area').textContent = "Correct! Loading next puzzle...";
        
        // 1. Award Coins and update progress
        if (currentUserId) {
            await awardCoins(currentTheme);
            currentPuzzleIndex++;
            await updateProgress(currentTheme, currentPuzzleIndex);
        } else {
            currentPuzzleIndex++;
            alert("Puzzle solved! (Coins not saved because you are a guest)");
        }

        // 2. Load next puzzle or finish
        setTimeout(() => {
            if (currentPuzzleIndex < PUZZLE_DATA[currentTheme].length) {
                loadPuzzle(currentPuzzleIndex);
            } else {
                document.getElementById('message-area').textContent = `Congratulations! You mastered ${currentTheme}!`;
                alert(`You have mastered the ${currentTheme} theme!`);
                closeModal('game-modal');
                renderThemes(); // Update theme grid UI after completion
            }
        }, 1000);

    } else {
        document.getElementById('message-area').textContent = "Incorrect. Try again!";
        clearAttempt();
    }
}

// ====================================================================
// G. INITIALIZATION
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initial render is triggered by the auth listener, but we ensure basic setup
    // is ready if Firebase initializes late.
    
    document.getElementById('profile-icon').addEventListener('click', () => {
        if (!currentUserId) {
            showModal('auth-modal');
        } else {
            alert(`Logged in as: ${auth.currentUser.email}\nWallet: ${currentWalletBalance} Coins`);
        }
    });

    // Dummy functionality for difficulty buttons
    document.querySelectorAll('.diff-button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.diff-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

});
