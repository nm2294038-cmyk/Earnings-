// ====================================================================
// 1. FIREBASE CONFIGURATION & CORE STATE
// ====================================================================

const firebaseConfig = {
    // !!! IMPORTANT: REPLACE WITH YOUR ACTUAL FIREBASE CONFIGURATION !!!
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4", 
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
};

let auth, db;
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
} else {
    console.error("Firebase SDKs not loaded. Running in local mode only.");
}

const USERS_COLLECTION = "users";
const WORKER_EARNINGS_COLLECTION = "worker_earnings"; 
const localStorageKey = 'matchGame_unlockedLevel_v_local';

// Game State Variables
let currentLevelIndex = -1, selectedItem = null, matchedCount = 0, gameLocked = false;
let pairsInCurrentLevel = [];
let audioCtx;
const totalLevels = 250; 

// --- UPDATED REWARD SETTINGS ---
const MIN_COIN_REWARD = 10; // Ab kam se kam 10 coins milenge
const MAX_COIN_REWARD = 20; // Zayada se zayada 20 coins milenge
const GAME_COMPLETION_BONUS = 2000; // Game khatam karne par 2000 coins

// User State Variables
let currentUser = null;
let userUnlockedLevel = 1; 
let levelProgressListener = null; 
let authMode = 'login';


// ====================================================================
// 2. LEVEL DATA GENERATION (250 LEVELS)
// ====================================================================

function shuffleArray(array) { 
    for (let i = array.length - 1; i > 0; i--) { 
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; 
    } return array; 
}

let levelConfigs = [
    { pairs: [{ l: 'A', p: '🍎' }, { l: 'B', p: '🎈' }, { l: 'C', p: '🐱' }, { l: 'D', p: '🐶' }, { l: 'E', p: '🐘' }] },
    { pairs: [{ l: 'One', p: '1' }, { l: 'Two', p: '2' }, { l: 'Three', p: '3' }, { l: 'Four', p: '4' }, { l: 'Five', p: '5' }] },
    { pairs: [{ p: 'Red', l: '🟥' }, { p: 'Blue', l: '🟦' }, { p: 'Green', l: '🟩' }, { p: 'Yellow', l: '🟨' }, { p: 'Orange', l: '🟧' }] },
];

const dataSets = {
    food: [ ['🍔','Burger'], ['🍕','Pizza'], ['🍣','Sushi'], ['🌮','Taco'], ['🍩','Donut'], ['🍟','Fries'], ['🧀','Cheese'], ['🍞','Bread'], ['🥚','Egg'], ['🥦','Broccoli'], ['🌽','Corn'], ['🥕','Carrot'], ['🍇','Grapes'], ['🍌','Banana'], ['🍓','Strawberry'] ],
    animals: [ ['🦁','Lion'], ['🐯','Tiger'], ['🐻','Bear'], ['🦊','Fox'], ['🐰','Rabbit'], ['🐸','Frog'], ['🐧','Penguin'], ['🦉','Owl'], ['🦋','Butterfly'], ['🐜','Ant'], ['🐝','Bee'], ['🐄','Cow'], ['🐕','Dog'], ['🐈','Cat'], ['🐒','Monkey'] ],
    transport: [ ['🚗','Car'], ['🚌','Bus'], ['✈️','Plane'], ['⛵','Boat'], ['🚲','Bicycle'], ['🚂','Train'], ['🚀','Rocket'], ['🚁','Helicopter'], ['🚢','Ship'], ['🛵','Scooter'], ['🚨','Ambulance'], ['🚔','Police'], ['🚖','Taxi'], ['🚜','Tractor'], ['🚚','Truck'] ],
    emotions: [ ['😃','Happy'], ['😢','Sad'], ['😠','Angry'], ['😱','Fear'], ['🤢','Disgust'], ['😲','Surprise'], ['😴','Tired'], ['😕','Confused'], ['🥰','Love'], ['😷','Sick'], ['😭','Crying'], ['🧐','Thoughtful'], ['🥳','Party'], ['😎','Cool'], ['😇','Angel'] ],
    objects: [ ['📚','Books'], ['✏️','Pencil'], ['📏','Ruler'], ['🔑','Key'], ['✂️','Scissors'], ['🚪','Door'], ['💡','Bulb'], ['⏰','Clock'], ['☎️','Phone'], ['📺','TV'], ['⚽','Ball'], ['🪁','Kite'], ['🧸','Teddy'], ['🎁','Gift'], ['🎉','Pop'] ]
};

function generateLevelsFromData(dataArray) {
    let shuffledData = shuffleArray([...dataArray]);
    for (let i = 0; i + 5 <= shuffledData.length; i += 5) {
        const chunk = shuffledData.slice(i, i + 5);
        levelConfigs.push({ pairs: chunk.map(([p, l]) => ({ p, l })) });
    }
}

Object.keys(dataSets).forEach(key => generateLevelsFromData(dataSets[key]));

levelConfigs = levelConfigs.map((level, index) => ({
    pairs: level.pairs.map((pair, pIndex) => ({
        letter: pair.l || pair.l,
        picture: pair.p || pair.p,
        id: `l${index+1}_p${pIndex+1}`
    }))
}));

const currentLevelCount = levelConfigs.length;
for (let i = currentLevelCount; i < totalLevels; i++) {
    const levelNum = i + 1;
    levelConfigs.push({
        pairs: [
            { letter: `L${levelNum} Item 1`, picture: `Placeholder A`, id: `l${levelNum}_p1`},
            { letter: `L${levelNum} Item 2`, picture: `Placeholder B`, id: `l${levelNum}_p2`},
            { letter: `L${levelNum} Item 3`, picture: `Placeholder C`, id: `l${levelNum}_p3`},
            { letter: `L${levelNum} Item 4`, picture: `Placeholder D`, id: `l${levelNum}_p4`},
            { letter: `L${levelNum} Item 5`, picture: `Placeholder E`, id: `l${levelNum}_p5`},
        ]
    });
}


// ====================================================================
// 3. FIREBASE/FIRESTORE DATA HANDLING
// ====================================================================

function getHighestUnlockedLevel() {
    return currentUser ? userUnlockedLevel : parseInt(localStorage.getItem(localStorageKey) || '1', 10);
}

// --- Log Earning for Admin Panel (Updated to handle Bonus) ---
async function logGameEarning(amount, levelIndex, customType = null) {
    if (!currentUser || !db || amount <= 0) return;

    // Agar customType (Bonus) hai to wo use kare, warna normal level text
    const typeText = customType || `Level Completion (L${levelIndex + 1})`;

    try {
        await db.collection(WORKER_EARNINGS_COLLECTION).add({
            userId: currentUser.uid,
            email: currentUser.email,
            amount: amount,
            source: "Match Game", 
            type: typeText, 
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Error logging game earning:", error);
    }
}

// --- Add Coins (Wallet Update) ---
async function addCoins(amount) {
    if (!currentUser || !db) return 0;
    
    const userRef = db.collection(USERS_COLLECTION).doc(currentUser.uid);
    
    try {
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);
            const newCoins = (doc.data().coins || 0) + amount;
            transaction.update(userRef, { coins: newCoins });
        });
        return amount;
    } catch (error) {
        console.error("Coin transaction failed:", error);
        return 0;
    }
}

// --- Level Unlock (Firestore Update) ---
async function unlockLevel(levelNumber) {
    const currentMax = getHighestUnlockedLevel();
    if (levelNumber > currentMax) {
        if (currentUser && db) {
            const userRef = db.collection(USERS_COLLECTION).doc(currentUser.uid);
            try {
                await userRef.update({ unlockedLevel: levelNumber });
            } catch (error) {
                console.error("Error updating level in Firestore:", error);
            }
        } else {
            localStorage.setItem(localStorageKey, levelNumber.toString());
            userUnlockedLevel = levelNumber; 
            if (!currentUser) renderLevelSelectScreen(); 
        }
    }
}

// --- Real-time Data Listener ---
async function initializeUserDataDisplay() {
    const coinCountSpan = document.getElementById('coin-count');
    const userMaxLevelDisplay = document.getElementById('user-max-level');

    if (!currentUser || !db) {
        coinCountSpan.textContent = '0';
        userUnlockedLevel = parseInt(localStorage.getItem(localStorageKey) || '1', 10);
        userMaxLevelDisplay.textContent = userUnlockedLevel;
        renderLevelSelectScreen();
        return;
    }

    if (levelProgressListener) levelProgressListener(); 
    
    const userRef = db.collection(USERS_COLLECTION).doc(currentUser.uid);
    
    levelProgressListener = userRef.onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            
            userUnlockedLevel = data.unlockedLevel || 1;
            userMaxLevelDisplay.textContent = userUnlockedLevel;
            
            coinCountSpan.textContent = parseFloat(data.coins || 0).toFixed(0);
        } else {
            userRef.set({
                email: currentUser.email,
                coins: 0,
                unlockedLevel: 1,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            userUnlockedLevel = 1;
        }
        renderLevelSelectScreen(); 
    }, error => {
        console.error("Firestore Listener Error:", error);
        userUnlockedLevel = parseInt(localStorage.getItem(localStorageKey) || '1', 10);
        renderLevelSelectScreen();
    });
}


// ====================================================================
// 4. AUTHENTICATION HANDLERS
// ====================================================================

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        document.getElementById('auth-form-container').style.display = 'none';
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('user-email-display').textContent = `Logged in as: ${user.email}`;
        document.getElementById('logout-btn').style.display = 'block';
        document.getElementById('wallet-container').style.display = 'flex';
        initializeUserDataDisplay();
    } else {
        currentUser = null;
        document.getElementById('auth-form-container').style.display = 'block';
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'none';
        document.getElementById('wallet-container').style.display = 'none';
        if (levelProgressListener) levelProgressListener(); 
        initializeUserDataDisplay(); 
    }
    closeAuthModal();
});

function showAuthModal() {
    document.getElementById('auth-modal').style.display = 'flex';
    setAuthMode('login'); 
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
    document.getElementById('auth-error').textContent = '';
}

function setAuthMode(mode) {
    authMode = mode;
    document.getElementById('auth-title').textContent = (mode === 'signup' ? "Create Account" : "Log In");
    document.getElementById('auth-submit-btn').textContent = (mode === 'signup' ? "Sign Up" : "Login");
    document.getElementById('switch-text').textContent = (mode === 'signup' ? "Already have an account?" : "Don't have an account?");
    document.getElementById('switch-link').textContent = (mode === 'signup' ? "Login" : "Sign Up");
}

function toggleAuthMode() {
    setAuthMode(authMode === 'signup' ? 'login' : 'signup');
}

async function handleAuthSubmit() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('auth-submit-btn');

    if (!email || password.length < 6) {
        document.getElementById('auth-error').textContent = 'Enter valid email & password (min 6 chars).';
        return;
    }

    submitBtn.disabled = true;
    document.getElementById('auth-error').textContent = '';

    try {
        if (authMode === 'signup') {
            await auth.createUserWithEmailAndPassword(email, password);
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }
    } catch (error) {
        document.getElementById('auth-error').textContent = error.message;
    } finally {
        submitBtn.disabled = false;
    }
}

function handleAuthLogout() {
    auth.signOut();
}


// ====================================================================
// 5. GAME VIEW AND LOGIC FUNCTIONS
// ====================================================================

function initAudio() { 
    if (!audioCtx) { 
        audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
    } 
    if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playSound(type) { 
    // Sound implementation placeholder
}

function showScreen(screenId) { 
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function renderLevelSelectScreen() {
    const highestUnlocked = getHighestUnlockedLevel();
    const container = document.getElementById('level-buttons-container');
    container.innerHTML = '';
    
    levelConfigs.forEach((config, index) => {
        const levelNum = index + 1;
        const button = document.createElement('button');
        button.className = 'level-button';
        button.textContent = `${levelNum}`;
        
        if (levelNum <= highestUnlocked) {
            button.classList.add('unlocked');
            button.addEventListener('click', () => startGame(index));
        } else {
            button.classList.add('locked');
        }
        container.appendChild(button);
    });
}

function createItemElement(itemData, type) { 
    const div = document.createElement('div');
    div.className = 'item'; 
    div.dataset.id = itemData.id; 
    div.dataset.type = type; 
    const content = (type === 'letter') ? itemData.letter : itemData.picture;
    div.textContent = content; 
    div.addEventListener('click', handleItemClick); 
    return div; 
}

function loadLevelData(levelIndex) { 
    if (levelIndex < 0 || levelIndex >= levelConfigs.length) return false;
    
    currentLevelIndex = levelIndex;
    pairsInCurrentLevel = levelConfigs[currentLevelIndex].pairs;
    selectedItem = null; matchedCount = 0; gameLocked = false;
    
    document.getElementById('letters').innerHTML = '';
    document.getElementById('pictures').innerHTML = '';
    document.getElementById('connector-lines').innerHTML = '';
    document.getElementById('message').textContent = 'Select first item...';
    document.getElementById('level-display').textContent = `Level ${currentLevelIndex + 1}`;
    
    const leftItems = pairsInCurrentLevel.map(p => ({id: p.id, letter: p.letter}));
    const rightItems = pairsInCurrentLevel.map(p => ({id: p.id, picture: p.picture}));
    
    shuffleArray(leftItems).forEach(item => document.getElementById('letters').appendChild(createItemElement(item, 'letter')));
    shuffleArray(rightItems).forEach(item => document.getElementById('pictures').appendChild(createItemElement(item, 'picture')));
    
    return true;
}

function startGame(levelIndex) { 
    initAudio();
    if (loadLevelData(levelIndex)) {
        showScreen('game-screen');
    } else {
        goToLevelSelect();
    }
}

function getElementCenter(el) { 
    const rect = el.getBoundingClientRect();
    const cRect = document.querySelector('.columns-container').getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - cRect.left, y: rect.top + rect.height / 2 - cRect.top }; 
}

function drawLine(e1, e2) { 
    const p1 = getElementCenter(e1);
    const p2 = getElementCenter(e2); 
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y); 
    line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y); 
    document.getElementById('connector-lines').appendChild(line); 
}

async function handleItemClick(event) { 
    initAudio(); 
    playSound('click'); 
    if (gameLocked) return; 
    const clickedEl = event.target.closest('.item'); 
    if (!clickedEl || clickedEl.classList.contains('matched')) return; 
    
    if (!selectedItem) {
        selectedItem = clickedEl; selectedItem.classList.add('selected'); 
        document.getElementById('message').textContent = `Selected ${clickedEl.textContent}. Find the match!`;
    } else { 
        if (selectedItem === clickedEl || selectedItem.dataset.type === clickedEl.dataset.type) { 
            selectedItem.classList.remove('selected'); selectedItem = null; 
            document.getElementById('message').textContent = 'Select first item...'; 
            return;
        } 
        
        gameLocked = true; 
        
        if (selectedItem.dataset.id === clickedEl.dataset.id) { 
            // Correct Match
            playSound('correct'); 
            selectedItem.classList.remove('selected'); selectedItem.classList.add('matched'); 
            clickedEl.classList.add('matched'); 
            drawLine(selectedItem, clickedEl); 
            matchedCount++; 
            document.getElementById('message').textContent = 'Match! ✨';
            
            selectedItem = null; 
            
            if (matchedCount === pairsInCurrentLevel.length) { 
                // Level Complete Logic
                playSound('win'); 
                
                // --- UPDATED REWARD LOGIC ---
                if (currentUser) {
                    // 1. Standard Level Reward (10 to 20 coins)
                    const rewardAmount = Math.floor(Math.random() * (MAX_COIN_REWARD - MIN_COIN_REWARD + 1)) + MIN_COIN_REWARD;
                    await addCoins(rewardAmount); 
                    await logGameEarning(rewardAmount, currentLevelIndex); 
                    
                    document.getElementById('message').textContent += ` +${rewardAmount} Coins!`;

                    // 2. CHECK FOR GAME COMPLETION (2000 Bonus)
                    const nextLevelNum = currentLevelIndex + 2; 
                    
                    if (nextLevelNum > totalLevels) {
                        // All levels finished! Award 2000 Bonus
                        await addCoins(GAME_COMPLETION_BONUS);
                        await logGameEarning(GAME_COMPLETION_BONUS, currentLevelIndex, "GRAND PRIZE: All Levels Completed");
                        
                        alert(`CONGRATULATIONS! You have completed all ${totalLevels} levels! \n\nYou earned a BONUS of ${GAME_COMPLETION_BONUS} Coins!`);
                        document.getElementById('message').textContent = `ALL LEVELS COMPLETE! +${GAME_COMPLETION_BONUS} BONUS! 🏆`;
                    } else {
                        // Unlock next level
                        await unlockLevel(nextLevelNum);
                    }
                } else {
                    // Guest mode logic
                    const nextLevelNum = currentLevelIndex + 2; 
                    if (nextLevelNum <= totalLevels) {
                        await unlockLevel(nextLevelNum); 
                    }
                }
                
                triggerCelebration(); 
                
                // Delay before going back to menu
                setTimeout(goToLevelSelect, 3500); 
            } else { 
                setTimeout(() => { gameLocked = false; document.getElementById('message').textContent = 'Select first item...'; }, 700); 
            } 
        } else { 
            // Incorrect Match
            playSound('incorrect'); 
            document.getElementById('message').textContent = 'Incorrect match 🤔. Try again!';
            selectedItem.classList.add('incorrect'); clickedEl.classList.add('incorrect'); 
            
            setTimeout(() => { 
                selectedItem?.classList.remove('selected', 'incorrect'); 
                clickedEl.classList.remove('incorrect'); 
                selectedItem = null; 
                document.getElementById('message').textContent = 'Select first item...'; 
                gameLocked = false; 
            }, 800); 
        } 
    }
}

function triggerCelebration() { 
    const container = document.getElementById('celebration-container');
    container.innerHTML = '';
    for (let i = 0; i < 50; i++) { 
        const c = document.createElement('div');
        c.className = 'confetti'; 
        c.style.left = `${Math.random()*100}vw`; 
        c.style.animationDelay = `${Math.random()*0.5}s`; 
        container.appendChild(c); 
    } 
    container.classList.add('active'); 
    setTimeout(() => container.classList.remove('active'), 3000); 
}

function goToLevelSelect() {
    showScreen('level-select-screen');
    gameLocked = false;
}

function restartLevel() {
    if (currentLevelIndex !== -1) loadLevelData(currentLevelIndex);
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => { 
    if (!currentUser) {
        renderLevelSelectScreen();
        showScreen('level-select-screen');
    }
    document.body.addEventListener('click', initAudio, { once: true });
});
