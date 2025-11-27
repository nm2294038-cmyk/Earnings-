// ====================================================================
// 1. FIREBASE CONFIGURATION & SETUP
// ====================================================================

const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    databaseURL: "https://traffic-exchange-62a58-default-rtdb.firebaseio.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.firebasestorage.app",
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

// Global Variables
window.currentUser = null;
window.userWalletBalance = 0;
window.userName = 'Guest';
window.gameActive = false;
window.GAME_BET_AMOUNT = 310;
window.GAME_WIN_REWARD = 280;
window.MANUAL_PLAYER_COLOR = 'yellow';

// --- Ludo Constants ---
const PLAYERS = ['green', 'yellow', 'blue', 'red'];
const START_INDICES = { green: 1, yellow: 14, blue: 27, red: 40 };
const HOME_ENTRY_INDICES = { green: 51, yellow: 12, blue: 25, red: 38 };
const HOME_COLUMN_LENGTH = 6;
const TOTAL_PATH_CELLS = 52;
const SAFE_ZONE_INDICES = [
    START_INDICES.green, START_INDICES.yellow, START_INDICES.blue, START_INDICES.red,
    START_INDICES.green + 3, START_INDICES.yellow + 3, START_INDICES.blue + 3, START_INDICES.red + 3,
    7, 20, 33, 46
];
const DICE_ANIMATION_DURATION = 1000; const DICE_ANIMATION_INTERVAL = 75;
const ACTION_DELAY = 1500; const PAWN_MOVE_VISUAL_DELAY = 500;

// --- DOM Elements ---
const boardElement = document.getElementById('ludo-board');
const diceElement = document.getElementById('dice');
const messageElement = document.getElementById('message');
const startButton = document.getElementById('start-game-button');
const exitButton = document.getElementById('exit-game-button'); 

// --- Game State ---
let currentPlayerIndex = 0; let currentDiceValue = null; let consecutiveSixes = 0;
let pawns = {}; let playerPawns = { green: [], yellow: [], blue: [], red: [] };
let waitingForPawnMove = false;
let diceAnimationTimeout = null; let diceAnimationInterval = null;
let gameTurnCount = 0; 
let aiPlayerNames = {}; // Stores the random names for current game

const pathCoords = [ { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 }, { row: 6, col: 7 }, { row: 5, col: 7 }, { row: 4, col: 7 }, { row: 3, col: 7 }, { row: 2, col: 7 }, { row: 1, col: 7 }, { row: 1, col: 8 }, { row: 1, col: 9 }, { row: 2, col: 9 }, { row: 3, col: 9 }, { row: 4, col: 9 }, { row: 5, col: 9 }, { row: 6, col: 9 }, { row: 7, col: 10 }, { row: 7, col: 11 }, { row: 7, col: 12 }, { row: 7, col: 13 }, { row: 7, col: 14 }, { row: 7, col: 15 }, { row: 8, col: 15 }, { row: 9, col: 15 }, { row: 9, col: 14 }, { row: 9, col: 13 }, { row: 9, col: 12 }, { row: 9, col: 11 }, { row: 9, col: 10 }, { row: 10, col: 9 }, { row: 11, col: 9 }, { row: 12, col: 9 }, { row: 13, col: 9 }, { row: 14, col: 9 }, { row: 15, col: 9 }, { row: 15, col: 8 }, { row: 15, col: 7 }, { row: 14, col: 7 }, { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 6 }, { row: 9, col: 5 }, { row: 9, col: 4 }, { row: 9, col: 3 }, { row: 9, col: 2 }, { row: 9, col: 1 }, { row: 8, col: 1 }, { row: 7, col: 1 } ];
const finalHomePathCoords = { green:  [{ row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 8 }, { row: 7, col: 8 }], yellow: [{ row: 8, col: 2 }, { row: 8, col: 3 }, { row: 8, col: 4 }, { row: 8, col: 5 }, { row: 8, col: 6 }, { row: 8, col: 7 }], blue:   [{ row: 14, col: 8 }, { row: 13, col: 8 }, { row: 12, col: 8 }, { row: 11, col: 8 }, { row: 10, col: 8 }, { row: 9, col: 8 }], red:    [{ row: 8, col: 14 }, { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 }] };

// --- 50 Pakistani Names (Defined Globally on Window Object) ---
window.PAKISTANI_NAMES = [ 
    'Ayesha','Nazim' ,'Fatima', 'Sana', 'Maria', 'Hina', 'Zainab', 'Sara', 'Iqra', 'Mehreen', 'Nida', 
    'Ali', 'Ahmed', 'Usman', 'Hassan', 'Bilal', 'Imran', 'Kamran', 'Faisal', 'Zahid', 'Waqas',
    'Sadia', 'Kiran', 'Uzma', 'Asma', 'Madiha', 'Shehryar', 'Junaid', 'Tariq', 'Farhan', 'Rizwan',
    'Rabia', 'Aalia', 'Noor', 'Amna', 'Shazia', 'Zubair', 'Haris', 'Sohail', 'Jawad', 'Noman',
    'Mehak', 'Alishba', 'Samina', 'Ghazala', 'Saima', 'Anas', 'Daniyal', 'Waleed', 'Mustafa', 'Arsalan'
];


// ====================================================================
// 2. UTILITY FUNCTIONS
// ====================================================================

function capitalize(s) { if (!s) return ''; return s.charAt(0).toUpperCase() + s.slice(1); }
function getCurrentPlayerColor() { return PLAYERS[currentPlayerIndex]; }
function getPawnId(color, index) { return `${color}-pawn-${index}`; }
function getCellElement(positionId) { return boardElement.querySelector(`[data-cell-id="${positionId}"]`); }
function getPawnsOnCell(cellId) {  const occupyingPawns = []; if (!cellId) return []; const cellElement = document.getElementById(cellId) || getCellElement(cellId); if (cellElement) { const pawnElements = cellElement.querySelectorAll('.pawn'); pawnElements.forEach(p => occupyingPawns.push(p.id)); } return occupyingPawns; }
function checkWinCondition(playerColor) {  const playerPawnIds = playerPawns[playerColor]; return playerPawnIds.every(pawnId => pawns[pawnId].state === 'finished'); }

function resetGameStateVars() { 
    currentPlayerIndex = 0; 
    currentDiceValue = null; 
    consecutiveSixes = 0; 
    waitingForPawnMove = false; 
    diceElement.textContent = '👑'; 
    gameTurnCount = 0; 
    aiPlayerNames = {}; 
}

// --- Get Player Name (Uses the global aiPlayerNames) ---
window.getPlayerName = function(color) {
    if (color === window.MANUAL_PLAYER_COLOR) {
        return window.userName;
    }
    return aiPlayerNames[color] || capitalize(color);
}

window.setMessage = function(text) { messageElement.textContent = text; }

function highlightActivePlayerArea() {
    document.querySelectorAll('.start-area').forEach(area => area.classList.remove('active-player'));
    document.querySelectorAll('.player-display').forEach(pd => pd.classList.remove('active-player-info'));
    const color = getCurrentPlayerColor();
    const activeBoardArea = document.getElementById(`start-area-${color}`); if (activeBoardArea) activeBoardArea.classList.add('active-player');
    const activePlayerInfoDiv = document.getElementById(`player-info-${color}`); if(activePlayerInfoDiv) activePlayerInfoDiv.classList.add('active-player-info');
}


// ====================================================================
// 3. WALLET & ADMIN LOGGING
// ====================================================================

function updateYellowPlayerDisplay(name) {
    document.getElementById('yellow-player-name').textContent = `${name} (You)`;
    const initial = name.charAt(0).toUpperCase();
    document.getElementById('yellow-player-pic').src = `https://placehold.co/60x60/FFD700/333?text=${initial}`;
}

function startWalletListener(uid) {
    db.collection("users").doc(uid).onSnapshot((doc) => {
        if (doc.exists) {
            window.userWalletBalance = doc.data().coins || 0;
            window.userName = doc.data().name || 'User';
            document.getElementById('wallet-display').textContent = `Wallet: ${window.userWalletBalance} Coins`;
            updateYellowPlayerDisplay(window.userName);
            window.checkGameEligibility();
        } else {
            window.userWalletBalance = 0;
            document.getElementById('wallet-display').textContent = 'Wallet: 0 Coins';
            window.checkGameEligibility();
        }
    });
}

window.checkGameEligibility = function() {
    const startButton = document.getElementById('start-game-button');
    const message = document.getElementById('message');
    startButton.style.display = 'block';

    if (window.currentUser && window.userWalletBalance >= window.GAME_BET_AMOUNT) {
        startButton.disabled = false;
        startButton.textContent = `Start Game (Bet ${window.GAME_BET_AMOUNT} Coins)`;
        if (!window.gameActive) {
            message.textContent = "Ready to play! Click 'Start Game'.";
        }
    } else {
        startButton.disabled = true;
        startButton.textContent = `Start Game (Need ${window.GAME_BET_AMOUNT} Coins)`;
        if (!window.currentUser) {
            message.textContent = "Please Login/Sign Up to start the game.";
        } else if (window.userWalletBalance < window.GAME_BET_AMOUNT) {
            message.textContent = `You need ${window.GAME_BET_AMOUNT} coins to play. Current: ${window.userWalletBalance}.`;
        }
    }
}

window.deductBet = async function() {
    if (!window.currentUser || window.userWalletBalance < window.GAME_BET_AMOUNT) {
        return false;
    }
    try {
        // 1. Deduct Coins
        await db.collection("users").doc(window.currentUser.uid).update({
            coins: firebase.firestore.FieldValue.increment(-window.GAME_BET_AMOUNT)
        });

        // 2. Log "Bet Placed" to Admin Panel
        await db.collection("ludo_game_logs").add({
            userId: window.currentUser.uid,
            email: window.currentUser.email,
            userName: window.userName,
            result: "Bet Placed",
            betAmount: window.GAME_BET_AMOUNT,
            wonAmount: 0,
            winnerColor: "Pending",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error("Error deducting bet:", error);
        alert("Transaction failed. Check internet connection.");
        return false;
    }
}

// --- Handle Game End & Log Result (Now handles Forfeit) ---
window.handleGameEndBetting = async function(winnerColor, isForfeit = false) {
    if (!window.currentUser) return;
    
    const userColor = window.MANUAL_PLAYER_COLOR;
    let amountChange = 0;
    let gameResult = ""; 

    if (isForfeit) {
        gameResult = "Loss (Forfeit)";
        amountChange = 0; 
        window.setMessage(`Game Forfeited. You lost your ${window.GAME_BET_AMOUNT} coin bet.`);

    } else if (winnerColor === userColor) {
        amountChange = window.GAME_BET_AMOUNT + window.GAME_WIN_REWARD;
        gameResult = "Win";
        window.setMessage(`VICTORY! ${window.userName} won! You received ${amountChange} coins.`);
    } else {
        amountChange = 0;
        gameResult = "Loss";
        window.setMessage(`DEFEAT. ${window.getPlayerName(winnerColor)} won. You lost your ${window.GAME_BET_AMOUNT} coin bet.`);
    }

    // 1. Update Wallet (Only credit if win and not forfeit)
    if (amountChange > 0 && gameResult === 'Win') {
        try {
            await db.collection("users").doc(window.currentUser.uid).update({
                coins: firebase.firestore.FieldValue.increment(amountChange)
            });
        } catch (error) {
            console.error("Error crediting reward:", error);
        }
    }

    // 2. Log Result to Admin Panel
    try {
        await db.collection("ludo_game_logs").add({
            userId: window.currentUser.uid,
            email: window.currentUser.email,
            userName: window.userName,
            result: gameResult,
            betAmount: window.GAME_BET_AMOUNT,
            wonAmount: (gameResult === 'Win') ? amountChange : 0,
            winnerColor: isForfeit ? 'FORFEIT' : window.getPlayerName(winnerColor), // Log the AI name or 'FORFEIT'
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Error logging game data:", error);
    }
}

// --- NEW: Handle Exit Game (Called by the HTML button) ---
window.handleExitGame = function() {
    if (!window.gameActive) return;

    const confirmForfeit = confirm("Are you sure you want to forfeit? You will lose your bet and the game will end.");
    
    if (confirmForfeit) {
        endGame(null, true); 
    }
}


// ====================================================================
// 4. AUTHENTICATION
// ====================================================================

auth.onAuthStateChanged((user) => {
    window.currentUser = user;
    if (user) {
        document.getElementById('auth-status').textContent = `Hello, ${user.email}`;
        startWalletListener(user.uid);
    } else {
        document.getElementById('wallet-display').textContent = 'Wallet: -';
        window.userWalletBalance = 0;
        window.userName = 'Guest';
        updateYellowPlayerDisplay('Guest');
    }
    window.checkGameEligibility();
});

window.loginUser = function(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then(() => { window.closeAuthModal(); })
        .catch((error) => { alert("Login Failed: " + error.message); });
}

window.signupUser = function(name, email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            db.collection("users").doc(userCredential.user.uid).set({
                coins: 200, email: email, name: name
            });
            window.closeAuthModal();
        })
        .catch((error) => { alert("Sign Up Failed: " + error.message); });
}

window.logoutUser = function() {
    auth.signOut().then(() => {
        window.gameActive = false;
        window.checkGameEligibility();
        window.closeAuthModal();
    }).catch((error) => { console.error("Logout Error:", error); });
}

// ====================================================================
// 5. MODAL CONTROLS
// ====================================================================
window.showAuthModal = function(mode) {
    const modal = document.getElementById('authModal');
    const profileContent = document.getElementById('profileContent');
    const authContent = document.getElementById('authContent');
    const modalTitle = document.getElementById('modalTitle');
    const authNameInput = document.getElementById('authName');

    if (mode === 'profile' && window.currentUser) {
        modalTitle.textContent = 'User Profile';
        authContent.style.display = 'none';
        profileContent.style.display = 'block';
        document.getElementById('profile-wallet-balance').textContent = window.userWalletBalance + ' Coins';
    } else {
        modalTitle.textContent = mode === 'login' ? 'Login' : 'Sign Up';
        document.getElementById('authSubmitButton').textContent = modalTitle.textContent;
        document.getElementById('toggleAuth').textContent = mode === 'login' ? 'Need an account? Sign Up' : 'Already have an account? Login';
        authContent.dataset.mode = mode;

        authNameInput.style.display = mode === 'signup' ? 'block' : 'none';

        authContent.style.display = 'block';
        profileContent.style.display = 'none';
    }
    modal.style.display = 'block';
}

window.closeAuthModal = function() {
    document.getElementById('authModal').style.display = 'none';
}

window.toggleAuthMode = function() {
    const authContent = document.getElementById('authContent');
    const currentMode = authContent.dataset.mode;
    const newMode = currentMode === 'login' ? 'signup' : 'login';
    window.showAuthModal(newMode);
}

window.submitAuthForm = function() {
    const name = document.getElementById('authName').value;
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const mode = document.getElementById('authContent').dataset.mode;

    if (email.length < 5 || password.length < 6) {
        alert("Please enter a valid email and a password of at least 6 characters.");
        return;
    }
    if (mode === 'signup' && name.length < 2) {
        alert("Please enter your name for registration.");
        return;
    }

    if (mode === 'login') {
        window.loginUser(email, password);
    } else {
        window.signupUser(name, email, password);
    }
}

// ====================================================================
// 6. LUDO GAME LOGIC
// ====================================================================

// --- Function to assign random names to AI players ---
function assignAInames() {
    const aiColors = PLAYERS.filter(c => c !== window.MANUAL_PLAYER_COLOR);
    const availableNames = [...window.PAKISTANI_NAMES]; 
    aiPlayerNames = {};

    aiColors.forEach(color => {
        const randomIndex = Math.floor(Math.random() * availableNames.length);
        aiPlayerNames[color] = availableNames[randomIndex];
        availableNames.splice(randomIndex, 1);
        
        // Update the display for AI players
        const initial = aiPlayerNames[color].charAt(0).toUpperCase();
        const picElement = document.getElementById(`${color}-player-pic`);
        const nameElement = document.getElementById(`${color}-player-name`);
        
        if(picElement) {
             picElement.src = `https://placehold.co/60x60/${color === 'green' ? '2ecc71' : (color === 'blue' ? '3498db' : 'e74c3c')}/fff?text=${initial}`;
        }
        if(nameElement) {
            nameElement.textContent = aiPlayerNames[color];
        }
    });
    
    // Ensure Yellow Player (User) name is updated
    updateYellowPlayerDisplay(window.userName);
}


window.handleStartGame = function() {
    if (!window.currentUser || window.userWalletBalance < window.GAME_BET_AMOUNT) {
        window.setMessage("Cannot start. Check login status and wallet balance.");
        return;
    }

    window.deductBet().then(success => {
        if (success) {
            initializeGame();
        } else {
            window.setMessage("Failed to deduct bet. Game not started.");
        }
    });
}

function initializeGame() {
    // 1. Assign Random Names before starting
    assignAInames();
    
    // 2. Board Setup
    boardElement.innerHTML = ''; 
    recreateStaticBoardElements();
    pathCoords.forEach((coord, index) => {
        const cellId = `path-${index}`; const classes = ['path'];
        if (SAFE_ZONE_INDICES.includes(index)) classes.push('safe-zone');
        if (index >= START_INDICES.green && index < START_INDICES.green + 5) classes.push('green-path');
        else if (index >= START_INDICES.yellow && index < START_INDICES.yellow + 5) classes.push('yellow-path');
        else if (index >= START_INDICES.blue && index < START_INDICES.blue + 5) classes.push('blue-path');
        else if (index >= START_INDICES.red && index < START_INDICES.red + 5) classes.push('red-path');
        if (index === START_INDICES.green + 3 && !classes.includes('green-path')) classes.push('green-path');
        if (index === START_INDICES.yellow + 3 && !classes.includes('yellow-path')) classes.push('yellow-path');
        if (index === START_INDICES.blue + 3 && !classes.includes('blue-path')) classes.push('blue-path');
        if (index === START_INDICES.red + 3 && !classes.includes('red-path')) classes.push('red-path');
        createCellElement(coord.row, coord.col, cellId, [...new Set(classes)]);
    });
    // FIX: Correctly iterate over finalHomePathCoords
    Object.entries(finalHomePathCoords).forEach(([color, coords]) => {
        coords.forEach((coord, index) => { 
            createCellElement(coord.row, coord.col, `${color}-home-${index}`, [`${color}-path`]); 
        });
    });
    pawns = {}; playerPawns = { green: [], yellow: [], blue: [], red: [] };
    PLAYERS.forEach(color => {
        for (let i = 0; i < 4; i++) {
            const pawnId = getPawnId(color, i); const startSpotId = `${color}-start-${i}`;
            pawns[pawnId] = { color: color, index: i, position: startSpotId, state: 'start' };
            playerPawns[color].push(pawnId); createPawnElement(pawnId, color); movePawnElement(pawnId, startSpotId);
        }
    });

    resetGameStateVars(); 
    window.gameActive = true;
    startButton.style.display = 'none';
    if (exitButton) exitButton.style.display = 'block'; 
    diceElement.style.display = 'flex';
    startGameTurn();
}

function startGameTurn() {
    if (!window.gameActive) return; highlightActivePlayerArea();
    const currentPlayerColor = getCurrentPlayerColor();
    const currentPlayerName = window.getPlayerName(currentPlayerColor);
    
    // --- FIX: Message display updated to use only name + color ---
    window.setMessage(`${currentPlayerName} (${capitalize(currentPlayerColor)}), your turn.`); 
    
    diceElement.textContent = '👑';

    const isManualTurn = (currentPlayerColor === window.MANUAL_PLAYER_COLOR);

    if (isManualTurn) {
        diceElement.classList.add('active');
        diceElement.addEventListener('click', handleManualDiceRoll);
        waitingForPawnMove = false;
    } else {
        diceElement.classList.remove('active');
        diceElement.removeEventListener('click', handleManualDiceRoll);
        setTimeout(automatedRollDice, ACTION_DELAY / 2);
    }
}

// --- UPDATED: Controlled Dice Roll ---
function performDiceRollAnimation(callback) {
    diceElement.classList.remove('active'); diceElement.classList.add('rolling');
    clearTimeout(diceAnimationTimeout); clearInterval(diceAnimationInterval);
    
    const currentPlayerColor = getCurrentPlayerColor();
    let finalDiceValue;

    // --- AI WIN ADVANTAGE LOGIC (Green Player Advantage) ---
    if (currentPlayerColor === 'green' && Math.random() < 0.8) { 
        finalDiceValue = 6;
    } else if (gameTurnCount < PLAYERS.length && currentPlayerColor !== window.MANUAL_PLAYER_COLOR) {
        // Guaranteed 6 for first round AI players (to quickly get out)
        finalDiceValue = 6;
    } else if (gameTurnCount < PLAYERS.length && currentPlayerColor === window.MANUAL_PLAYER_COLOR) {
        // Guaranteed NON-6 for user on first round
        finalDiceValue = Math.floor(Math.random() * 5) + 1; 
    } else {
        // Normal random roll for others
        finalDiceValue = Math.floor(Math.random() * 6) + 1;
    }

    diceAnimationInterval = setInterval(() => { diceElement.textContent = Math.floor(Math.random() * 6) + 1; }, DICE_ANIMATION_INTERVAL);
    diceAnimationTimeout = setTimeout(() => {
        clearInterval(diceAnimationInterval); diceElement.classList.remove('rolling');
        diceElement.textContent = finalDiceValue; currentDiceValue = finalDiceValue; 
        
        gameTurnCount++; 
        callback();
    }, DICE_ANIMATION_DURATION);
}


function handleManualDiceRoll() {
    diceElement.removeEventListener('click', handleManualDiceRoll); performDiceRollAnimation(processManualRollResult);
}

function processManualRollResult() {
    const activePlayerWhoseTurnItIs = getCurrentPlayerColor();
    const activePlayerName = window.getPlayerName(activePlayerWhoseTurnItIs);

    if (activePlayerWhoseTurnItIs !== window.MANUAL_PLAYER_COLOR) return;

    const pawnsOutsideStart = playerPawns[window.MANUAL_PLAYER_COLOR].some(pId => pawns[pId].state !== 'start');

    if (currentDiceValue === 6) {
        consecutiveSixes++;
        if (consecutiveSixes === 3) {
            window.setMessage(`Rolled third 6! ${activePlayerName}'s turn forfeited.`);
            handleTurnCompletion(false);
            return;
        }
        window.setMessage(`${activePlayerName} rolled a 6! Move or bring out.`);
    } else {
        consecutiveSixes = 0;

        if (!pawnsOutsideStart) {
            window.setMessage(`${activePlayerName} rolled ${currentDiceValue}. Needs a 6 to bring a pawn out. Turn passes.`);
            handleTurnCompletion(false);
            return;
        }
        window.setMessage(`${activePlayerName} rolled ${currentDiceValue}. Select your pawn.`);
    }

    const movablePawns = getMovablePawns(activePlayerWhoseTurnItIs, currentDiceValue);

    if (movablePawns.length === 0) {
        window.setMessage(`${activePlayerName} rolled ${currentDiceValue}, but no valid moves available.`);
        handleTurnCompletion(currentDiceValue === 6 && consecutiveSixes < 3);
    } else {
        waitingForPawnMove = true;
        highlightMovablePawns(movablePawns, true);
    }
}

function handleManualPawnClick(pawnId) {
    if (!window.gameActive || !waitingForPawnMove || !currentDiceValue) return;
    waitingForPawnMove = false; clearPawnHighlights();

    if (pawns[pawnId].color !== window.MANUAL_PLAYER_COLOR) return;

    executePawnMove(pawnId);
}

function automatedRollDice() { performDiceRollAnimation(processAutomatedRollResult); }

function processAutomatedRollResult() {
    const currentPlayerColor = getCurrentPlayerColor(); const currentPlayerName = window.getPlayerName(currentPlayerColor);

    const pawnsOutsideStart = playerPawns[currentPlayerColor].some(pId => pawns[pId].state !== 'start');
    if (currentDiceValue === 6) {
        consecutiveSixes++;
        if (consecutiveSixes === 3) { window.setMessage(`Rolled third 6! ${currentPlayerName}'s turn forfeited.`); handleTurnCompletion(false); return; }
        window.setMessage(`${currentPlayerName} rolled a 6! Will move. Gets another turn.`);
    } else {
        consecutiveSixes = 0;
        if (!pawnsOutsideStart) { window.setMessage(`${currentPlayerName} rolled ${currentDiceValue}. Needs 6. Turn passes.`); handleTurnCompletion(false); return; }
        window.setMessage(`${currentPlayerName} rolled ${currentDiceValue}. Will move pawn.`);
    }

    const movablePawns = getMovablePawns(currentPlayerColor, currentDiceValue);

    if (movablePawns.length === 0) {
        window.setMessage(`${currentPlayerName} rolled ${currentDiceValue}, no moves.`);
        handleTurnCompletion(currentDiceValue === 6 && consecutiveSixes < 3);
    }
    else {
        highlightMovablePawns(movablePawns, false);
        setTimeout(() => {
            clearPawnHighlights();
            executePawnMove(movablePawns[0]);
        }, PAWN_MOVE_VISUAL_DELAY);
    }
}

function executePawnMove(pawnId) {
    const targetInfo = calculateTargetPosition(pawnId, currentDiceValue);
    if (!targetInfo.isValid) {
         handleTurnCompletion(currentDiceValue === 6 && consecutiveSixes < 3); return;
    }

    const pawn = pawns[pawnId]; const oldPositionId = pawn.position; const newPositionId = targetInfo.positionId; const newState = targetInfo.state;
    let killedPawn = false;

    if (newState === 'path' && newPositionId) {
        const pathIndexIfPath = newPositionId.startsWith('path-') ? parseInt(newPositionId.split('-')[1]) : -1;
        const isTargetSafe = SAFE_ZONE_INDICES.includes(pathIndexIfPath);

        const pawnsOnTarget = getPawnsOnCell(newPositionId);
        const opponentPawnsOnTarget = pawnsOnTarget.filter(pId => pawns[pId].color !== pawn.color);

        if (opponentPawnsOnTarget.length > 0 && !isTargetSafe) {
            const killedPawnId = opponentPawnsOnTarget[0];
            sendPawnHome(killedPawnId); killedPawn = true;
            window.setMessage(`${window.getPlayerName(pawn.color)} killed ${window.getPlayerName(pawns[killedPawnId].color)}'s pawn!`);
        }
    }
    movePawnElement(pawnId, newPositionId);
    pawn.position = newPositionId; pawn.state = newState;
    if (oldPositionId && oldPositionId !== newPositionId) updateStackedPawnVisuals(oldPositionId);

    if (checkWinCondition(pawn.color)) {
        endGame(pawn.color); return;
    }
    handleTurnCompletion(currentDiceValue === 6 || killedPawn);
}

function handleTurnCompletion(extraTurnEarned) {
    if (!window.gameActive) return; clearPawnHighlights(); waitingForPawnMove = false;
    const currentPlayerName = window.getPlayerName(getCurrentPlayerColor());

    if (extraTurnEarned && consecutiveSixes < 3) {
        if (currentDiceValue !== 6) consecutiveSixes = 0;
        window.setMessage(`${currentPlayerName} gets another turn.`); setTimeout(startGameTurn, ACTION_DELAY / 2);
    } else {
        currentPlayerIndex = (currentPlayerIndex + 1) % PLAYERS.length; consecutiveSixes = 0;
        setTimeout(startGameTurn, ACTION_DELAY);
    }
}

// --- UPDATED endGame FUNCTION SIGNATURE ---
function endGame(winnerColor, isForfeit = false) {
    window.gameActive = false;
    diceElement.classList.remove('active', 'rolling'); 
    diceElement.textContent = isForfeit ? '🚪' : '🏆'; 
    clearPawnHighlights();

    if (exitButton) exitButton.style.display = 'none'; 

    if (window.currentUser) {
        if (isForfeit) {
            window.handleGameEndBetting(null, true); 
        } else {
            window.handleGameEndBetting(winnerColor, false);
        }
    } else {
        window.setMessage(`${window.getPlayerName(winnerColor || 'opponent')} wins! Refresh to play again.`);
    }

    startButton.style.display = 'block';
    diceElement.style.display = 'none';
    window.checkGameEligibility();
}

// --- Remaining Utility Logic ---

function recreateStaticBoardElements() {
    const staticHTML = ` <div class="start-area green" id="start-area-green"> <div class="inner-yard"> <div class="pawn-start-spot" id="green-start-0"></div> <div class="pawn-start-spot" id="green-start-1"></div> <div class="pawn-start-spot" id="green-start-2"></div> <div class="pawn-start-spot" id="green-start-3"></div> </div> </div> <div class="start-area yellow" id="start-area-yellow"> <div class="inner-yard"> <div class="pawn-start-spot" id="yellow-start-0"></div> <div class="pawn-start-spot" id="yellow-start-1"></div> <div class="pawn-start-spot" id="yellow-start-2"></div> <div class="pawn-start-spot" id="yellow-start-3"></div> </div> </div> <div class="home-area"> <div class="home-triangle green"></div> <div class="home-triangle yellow"></div> <div class="home-triangle blue"></div> <div class="home-triangle red"></div> </div> <div class="start-area red" id="start-area-red"> <div class="inner-yard"> <div class="pawn-start-spot" id="red-start-0"></div> <div class="pawn-start-spot" id="red-start-1"></div> <div class="pawn-start-spot" id="red-start-2"></div> <div class="pawn-start-spot" id="red-start-3"></div> </div> </div> <div class="start-area blue" id="start-area-blue"> <div class="inner-yard"> <div class="pawn-start-spot" id="blue-start-0"></div> <div class="pawn-start-spot" id="blue-start-1"></div> <div class="pawn-start-spot" id="blue-start-2"></div> <div class="pawn-start-spot" id="blue-start-3"></div> </div> </div> `;
    boardElement.insertAdjacentHTML('afterbegin', staticHTML);
}

function movePawnElement(pawnId, targetElementId) { 
    const pawnElement = document.getElementById(pawnId); 
    const targetElement = document.getElementById(targetElementId) || getCellElement(targetElementId); 
    if (pawnElement && targetElement) { 
        pawnElement.style.position = 'absolute'; 
        pawnElement.style.top = '50%'; 
        pawnElement.style.left = '50%'; 
        pawnElement.style.transform = 'translate(-50%, -50%)'; 
        targetElement.appendChild(pawnElement); 
        updateStackedPawnVisuals(targetElementId); 
    } else { 
        console.error(`Could not move pawn ${pawnId} to target ${targetElementId}. Element not found.`); 
    } 
}
function updateStackedPawnVisuals(cellId) { 
    const cellElement = document.getElementById(cellId) || getCellElement(cellId); 
    if (!cellElement) return; 
    const childPawns = cellElement.querySelectorAll('.pawn'); 
    childPawns.forEach(p => p.classList.remove('stacked')); 
    if (childPawns.length > 1) { 
        childPawns.forEach(p => p.classList.add('stacked')); 
    } 
}
function createCellElement(row, col, cellId, classes = []) { 
    const cell = document.createElement('div'); 
    cell.classList.add('cell', ...classes); 
    cell.style.gridRowStart = row; 
    cell.style.gridColumnStart = col; 
    cell.dataset.cellId = cellId; 
    boardElement.appendChild(cell); 
    return cell; 
}
function createPawnElement(pawnId, color) { 
    const pawn = document.createElement('div'); 
    pawn.id = pawnId; 
    pawn.classList.add('pawn', color); 
    boardElement.appendChild(pawn); 
    return pawn; 
}

function getMovablePawns(playerWhoseTurnItIs, diceValue) {
    const movable = [];
    const pawnActualColor = playerWhoseTurnItIs;
    if (playerPawns[pawnActualColor]) {
        playerPawns[pawnActualColor].forEach(pawnId => {
            const pawn = pawns[pawnId];
            if (pawn.state === 'finished') return;
            if (pawn.state === 'start') {
                if (diceValue === 6) {
                    const targetPositionId = `path-${START_INDICES[pawn.color]}`;
                    if (!isOwnBlock(targetPositionId, pawn.color)) { movable.push(pawnId); }
                }
            } else {
                const targetInfo = calculateTargetPosition(pawnId, diceValue);
                if (targetInfo.isValid) { movable.push(pawnId); }
            }
        });
    }
    return movable;
}

function calculateTargetPosition(pawnId, diceValue) {
    const pawn = pawns[pawnId];
    const color = pawn.color;
    if (pawn.state === 'finished') return { isValid: false };

    if (pawn.state === 'start') {
        if (diceValue === 6) {
            const targetPositionId = `path-${START_INDICES[color]}`;
            if (isOwnBlock(targetPositionId, color)) { return { isValid: false }; }
            return { positionId: targetPositionId, state: 'path', isValid: true };
        }
        return { isValid: false };
    }

    if (pawn.state === 'path') {
        const currentPathIndex = parseInt(pawn.position.split('-')[1]);
        const homeEntryIndex = HOME_ENTRY_INDICES[color];

        let distanceToHomeEntry = 0;
        let tempScanIdx = currentPathIndex;
        while(tempScanIdx !== homeEntryIndex) {
            tempScanIdx = (tempScanIdx + 1) % TOTAL_PATH_CELLS;
            distanceToHomeEntry++;
            if (distanceToHomeEntry > TOTAL_PATH_CELLS) return {isValid: false};
        }

        if (diceValue > distanceToHomeEntry) {
            const stepsIntoHomePath = diceValue - distanceToHomeEntry;
            if (stepsIntoHomePath > 0 && stepsIntoHomePath <= HOME_COLUMN_LENGTH) {
                for (let h = 0; h < stepsIntoHomePath - 1; h++) {
                    if (getPawnsOnCell(`${color}-home-${h}`).length > 0) return { isValid: false };
                }
                const targetHomeIndex = stepsIntoHomePath - 1;
                return {
                    positionId: `${color}-home-${targetHomeIndex}`,
                    state: (targetHomeIndex === HOME_COLUMN_LENGTH - 1) ? 'finished' : 'home',
                    isValid: true
                };
            } else {
                return { isValid: false };
            }
        } else {
            let finalTargetPathIndex = currentPathIndex;
            for (let i = 0; i < diceValue; i++) {
                finalTargetPathIndex = (finalTargetPathIndex + 1) % TOTAL_PATH_CELLS;
            }
            const finalCellId = `path-${finalTargetPathIndex}`;
            const isFinalCellSafe = SAFE_ZONE_INDICES.includes(finalTargetPathIndex);
            if (isOwnBlock(finalCellId, color) && !isFinalCellSafe) return { isValid: false };

            return { positionId: finalCellId, state: 'path', isValid: true };
        }
    }

    if (pawn.state === 'home') {
        const currentHomeIndex = parseInt(pawn.position.split('-')[2]);
        const targetHomeIndex = currentHomeIndex + diceValue;

        if (targetHomeIndex >= HOME_COLUMN_LENGTH) { return { isValid: false }; }
        if (getPawnsOnCell(`${color}-home-${targetHomeIndex}`).length > 0) { return { isValid: false }; }
        return {
            positionId: `${color}-home-${targetHomeIndex}`,
            state: (targetHomeIndex === HOME_COLUMN_LENGTH - 1) ? 'finished' : 'home',
            isValid: true
        };
    }
    return { isValid: false };
}

function isBlocked(cellId, pawnBeingMovedColor) {
    const pawnsOnCell = getPawnsOnCell(cellId); if (pawnsOnCell.length < 2) return false;
    const firstPawnColorOnCell = pawns[pawnsOnCell[0]].color;
    const isUniformBlock = pawnsOnCell.every(pId => pawns[pId].color === firstPawnColorOnCell);
    if (!isUniformBlock) return false;
    return firstPawnColorOnCell !== pawnBeingMovedColor;
}
function isOwnBlock(cellId, pawnBeingMovedColor) {
    const pawnsOnCell = getPawnsOnCell(cellId);
    if (pawnsOnCell.length < 1) return false;
    const firstPawnColorOnCell = pawns[pawnsOnCell[0]].color;
    if (firstPawnColorOnCell !== pawnBeingMovedColor) return false;
    if (cellId.startsWith('path-') && SAFE_ZONE_INDICES.includes(parseInt(cellId.split('-')[1]))) return false;
    return pawnsOnCell.every(pId => pawns[pId].color === pawnBeingMovedColor);
}

function highlightMovablePawns(movablePawnIds, forManualClick) {
    clearPawnHighlights();
    movablePawnIds.forEach(pawnId => {
        const pawnElement = document.getElementById(pawnId);
        if (pawnElement) {
            pawnElement.classList.add('movable');
            if (forManualClick) {
                pawnElement.onclick = () => handleManualPawnClick(pawnId);
            }
        }
    });
}
function clearPawnHighlights() {  document.querySelectorAll('.pawn').forEach(p => { p.classList.remove('movable'); p.onclick = null; }); }
function sendPawnHome(pawnId) {  const pawn = pawns[pawnId]; const color = pawn.color; let targetStartSpotId = null; for (let i = 0; i < 4; i++) { const spotId = `${color}-start-${i}`; if (getPawnsOnCell(spotId).length === 0) { targetStartSpotId = spotId; break; } } if (!targetStartSpotId) targetStartSpotId = `${color}-start-0`; const oldPositionId = pawn.position; pawn.position = targetStartSpotId; pawn.state = 'start'; movePawnElement(pawnId, targetStartSpotId); if (oldPositionId) updateStackedPawnVisuals(oldPositionId); }
