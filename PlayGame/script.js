// --- 1. Firebase Setup and Global Variables ---

// Firebase Configuration (Same as provided)
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

// Firebase Imports (Modular v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, increment, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global state variables
window.currentUser = null;
window.userWalletBalance = 0;
window.userName = 'Guest';
window.gameActive = false;
window.GAME_BET_AMOUNT = 100;
window.GAME_WIN_REWARD = 50;
window.MANUAL_PLAYER_COLOR = 'yellow';
const WORKER_EARNINGS_COLLECTION = "worker_earnings"; // Admin logging collection

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

// --- Ludo Game State Variables ---
const boardElement = document.getElementById('ludo-board');
const diceElement = document.getElementById('dice');
const messageElement = document.getElementById('message');
const startButton = document.getElementById('start-game-button');

let currentPlayerIndex = 0; let currentDiceValue = null; let consecutiveSixes = 0;
let pawns = {}; let playerPawns = { green: [], yellow: [], blue: [], red: [] };
let waitingForPawnMove = false;
let diceAnimationTimeout = null; let diceAnimationInterval = null;
let gameTurnCount = 0;

const pathCoords = [ { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 }, { row: 6, col: 7 }, { row: 5, col: 7 }, { row: 4, col: 7 }, { row: 3, col: 7 }, { row: 2, col: 7 }, { row: 1, col: 7 }, { row: 1, col: 8 }, { row: 1, col: 9 }, { row: 2, col: 9 }, { row: 3, col: 9 }, { row: 4, col: 9 }, { row: 5, col: 9 }, { row: 6, col: 9 }, { row: 7, col: 10 }, { row: 7, col: 11 }, { row: 7, col: 12 }, { row: 7, col: 13 }, { row: 7, col: 14 }, { row: 7, col: 15 }, { row: 8, col: 15 }, { row: 9, col: 15 }, { row: 9, col: 14 }, { row: 9, col: 13 }, { row: 9, col: 12 }, { row: 9, col: 11 }, { row: 9, col: 10 }, { row: 10, col: 9 }, { row: 11, col: 9 }, { row: 12, col: 9 }, { row: 13, col: 9 }, { row: 14, col: 9 }, { row: 15, col: 9 }, { row: 15, col: 8 }, { row: 15, col: 7 }, { row: 14, col: 7 }, { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 }, { row: 10, col: 7 }, { row: 9, col: 6 }, { row: 9, col: 5 }, { row: 9, col: 4 }, { row: 9, col: 3 }, { row: 9, col: 2 }, { row: 9, col: 1 }, { row: 8, col: 1 }, { row: 7, col: 1 } ];
const finalHomePathCoords = { green:  [{ row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 }, { row: 6, col: 8 }, { row: 7, col: 8 }], yellow: [{ row: 8, col: 2 }, { row: 8, col: 3 }, { row: 8, col: 4 }, { row: 8, col: 5 }, { row: 8, col: 6 }, { row: 8, col: 7 }], blue:   [{ row: 14, col: 8 }, { row: 13, col: 8 }, { row: 12, col: 8 }, { row: 11, col: 8 }, { row: 10, col: 8 }, { row: 9, col: 8 }], red:    [{ row: 8, col: 14 }, { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 }] };


// --- 2. Ludo Utility Functions (Globalized) ---
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
}
window.getPlayerName = function(color) {
    switch(color.toLowerCase()) {
        case 'green': return 'Nazim';
        case 'yellow': return window.userName;
        case 'blue': return 'hassan';
        case 'red': return 'Kazim';
        default: return capitalize(color);
    }
}
window.setMessage = function(text) { messageElement.textContent = text; }
function highlightActivePlayerArea() {
    document.querySelectorAll('.start-area').forEach(area => area.classList.remove('active-player'));
    document.querySelectorAll('.player-display').forEach(pd => pd.classList.remove('active-player-info'));
    const color = getCurrentPlayerColor();
    const activeBoardArea = document.getElementById(`start-area-${color}`); if (activeBoardArea) activeBoardArea.classList.add('active-player');
    const activePlayerInfoDiv = document.getElementById(`player-info-${color}`); if(activePlayerInfoDiv) activePlayerInfoDiv.classList.add('active-player-info');
}

// --- NEW/MODIFIED: Logging Function for Admin Panel ---
async function logLudoTransaction(amount, type, winnerColor = null) {
    if (!window.currentUser || !amount || amount === 0) return;

    try {
        await addDoc(collection(db, WORKER_EARNINGS_COLLECTION), {
            userId: window.currentUser.uid,
            email: window.currentUser.email,
            amount: amount,
            source: "Ludo Game",
            type: type, // "WIN", "LOSS", "BET"
            reference: `Winner: ${winnerColor || 'N/A'}`,
            timestamp: serverTimestamp()
        });
        console.log(`Ludo transaction logged: ${type}, Amount: ${amount}`);
    } catch (error) {
        console.error("Error logging Ludo transaction:", error);
    }
}


// --- 3. Wallet/Eligibility Logic (Globalized) ---

function updateYellowPlayerDisplay(name) {
    document.getElementById('yellow-player-name').textContent = `${name} (You)`;
    const initial = name.charAt(0).toUpperCase();
    // Assuming you have a standard image setup
    // document.getElementById('yellow-player-pic').src = `...`; 
}

function startWalletListener(uid) {
    const userDocRef = doc(db, "users", uid);

    onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
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
    const userDocRef = doc(db, "users", window.currentUser.uid);
    try {
        // Deduct the bet amount
        await updateDoc(userDocRef, { coins: increment(-window.GAME_BET_AMOUNT) });
        // Log the bet as a Loss (Deduction)
        await logLudoTransaction(-window.GAME_BET_AMOUNT, "BET_DEDUCTED", "Loss");
        return true;
    } catch (error) {
        console.error("Error deducting bet:", error);
        alert("Transaction failed. Try again.");
        return false;
    }
}

window.handleGameEndBetting = async function(winnerColor) {
    if (!window.currentUser) return;
    const userColor = window.MANUAL_PLAYER_COLOR;
    let amountChange = 0;

    if (winnerColor === userColor) {
        // User wins: Total return = Bet + Reward (e.g., 100 + 50 = 150)
        // Since the bet was already deducted (-100), we credit (Bet + Reward)
        amountChange = window.GAME_BET_AMOUNT + window.GAME_WIN_REWARD; 
        window.setMessage(`VICTORY! ${window.userName} won! You received ${amountChange} coins.`);
    } else {
        // User loses: Already lost the bet (-100). Final change is 0.
        amountChange = 0;
        window.setMessage(`DEFEAT. ${window.getPlayerName(winnerColor)} won. You lost your ${window.GAME_BET_AMOUNT} coin bet.`);
    }

    if (amountChange > 0) {
        const userDocRef = doc(db, "users", window.currentUser.uid);
        try {
            await updateDoc(userDocRef, { coins: increment(amountChange) });
            // Log the total winning credit (Bet + Reward)
            await logLudoTransaction(amountChange, "WIN_CREDITED", winnerColor);
        } catch (error) {
            console.error("Error crediting reward:", error);
        }
    }
    
    // If the user lost, the BET_DEDUCTED log entry already covers the loss.
}

// --- 4. Authentication Functions (Globalized) ---

onAuthStateChanged(auth, (user) => {
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
    signInWithEmailAndPassword(auth, email, password)
        .then(() => { window.closeAuthModal(); })
        .catch((error) => { alert("Login Failed: " + error.message); });
}

window.signupUser = function(name, email, password) {
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const userDocRef = doc(db, "users", userCredential.user.uid);
            // Initialize user with some coins
            setDoc(userDocRef, { coins: 200, email: email, name: name }); 
            window.closeAuthModal();
        })
        .catch((error) => { alert("Sign Up Failed: " + error.message); });
}

window.logoutUser = function() {
    signOut(auth).then(() => {
        window.gameActive = false;
        window.checkGameEligibility();
        window.closeAuthModal();
    }).catch((error) => { console.error("Logout Error:", error); });
}

// --- 5. Modal Control Functions (Globalized) ---
// (These functions remain the same, assuming associated HTML is present)
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

// --- 6. Ludo Game Logic ---

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
    // ... (Board Initialization logic remains the same) ...
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
    diceElement.style.display = 'flex';
    startGameTurn();
}

function startGameTurn() {
    if (!window.gameActive) return; highlightActivePlayerArea();
    const currentPlayerColor = getCurrentPlayerColor();
    const currentPlayerName = window.getPlayerName(currentPlayerColor);
    window.setMessage(`${currentPlayerName} (${capitalize(currentPlayerColor)}), your turn.`); diceElement.textContent = '👑';

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

function performDiceRollAnimation(callback) {
    diceElement.classList.remove('active'); diceElement.classList.add('rolling');
    clearTimeout(diceAnimationTimeout); clearInterval(diceAnimationInterval);
    
    const currentPlayerColor = getCurrentPlayerColor();
    let finalDiceValue;

    if (gameTurnCount < PLAYERS.length && currentPlayerColor !== window.MANUAL_PLAYER_COLOR) {
        finalDiceValue = 6;
    } else if (gameTurnCount < PLAYERS.length && currentPlayerColor === window.MANUAL_PLAYER_COLOR) {
        finalDiceValue = Math.floor(Math.random() * 5) + 1;
    } else {
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

function endGame(winnerColor) {
    window.gameActive = false;
    diceElement.classList.remove('active', 'rolling'); diceElement.textContent = '🏆'; clearPawnHighlights();

    if (window.currentUser) {
        // Handle financial logic and logging
        window.handleGameEndBetting(winnerColor); 
    } else {
        window.setMessage(`${window.getPlayerName(winnerColor)} wins! Refresh to play again.`);
    }

    startButton.style.display = 'block';
    diceElement.style.display = 'none';
    window.checkGameEligibility();
}

// --- Remaining Utility Logic (Pawn movement, blocks, etc.) ---
function recreateStaticBoardElements() { /* ... existing implementation ... */ }
function movePawnElement(pawnId, targetElementId) { /* ... existing implementation ... */ }
function updateStackedPawnVisuals(cellId) { /* ... existing implementation ... */ }
function createCellElement(row, col, cellId, classes = []) { /* ... existing implementation ... */ }
function createPawnElement(pawnId, color) { /* ... existing implementation ... */ }
function getMovablePawns(playerWhoseTurnItIs, diceValue) { /* ... existing implementation ... */ }
function calculateTargetPosition(pawnId, diceValue) { /* ... existing implementation ... */ }
function isBlocked(cellId, pawnBeingMovedColor) { /* ... existing implementation ... */ }
function isOwnBlock(cellId, pawnBeingMovedColor) { /* ... existing implementation ... */ }
function highlightMovablePawns(movablePawnIds, forManualClick) { /* ... existing implementation ... */ }
function clearPawnHighlights() {  document.querySelectorAll('.pawn').forEach(p => { p.classList.remove('movable'); p.onclick = null; }); }
function sendPawnHome(pawnId) {  /* ... existing implementation ... */ }
function automatedRollDice() { performDiceRollAnimation(processAutomatedRollResult); }
function processAutomatedRollResult() { /* ... existing implementation ... */ }
function handleManualDiceRoll() { /* ... existing implementation ... */ }
function processManualRollResult() { /* ... existing implementation ... */ }
function handleManualPawnClick(pawnId) { /* ... existing implementation ... */ }
function executePawnMove(pawnId) { /* ... existing implementation ... */ }
// Note: All supporting functions must be fully implemented in the final module export for the game to work.
