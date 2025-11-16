// --- FIREBASE CONFIGURATION AND INITIALIZATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
    measurementId: "G-HJQ46RQNZS"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- CONSTANTS (Exchange Rates) ---
const COIN_TO_PKR_RATE = 1; // 4 Coins = 1 PKR
const PKR_TO_COIN_RATE = 1; // 10 PKR = 1 Coin

// PKR to Specific Currency Rates (PKR required per 1 unit)
const EXCHANGE_RATES = {
    TIKTOK: { rate: 1, field: 'tiktokCoins', unit: 'TikTok Coins', fixed: 1 },
    AMAZON: { rate: 2, field: 'amazonCoins', unit: 'USD', fixed: 1 }, // Amazon value tracked in USD
    PUBG: { rate: 1, field: 'pubgUC', unit: 'UC', fixed: 1 },
    FREEFIRE: { rate: 1, field: 'freeFireDiamonds', unit: 'Diamonds', fixed: 1 },
    USDT: { rate: 1, field: 'bitgetUSDT', unit: 'USDT', fixed: 1 }
};


// --- DOM ELEMENTS ---
const authContainer = document.getElementById('authContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const appHeader = document.getElementById('appHeader');

// Auth elements
const authTitle = document.getElementById('authTitle');
const authButton = document.getElementById('authButton');
const toggleText = document.getElementById('toggleText');
const authNameInput = document.getElementById('authName');
const authForm = document.getElementById('authForm');

// Dashboard elements
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileUid = document.getElementById('profileUid');
const profileInitials = document.getElementById('profileInitials');

// Wallet Balances (Used for updating the rotating slides)
const coinsBalance = document.getElementById('coinsBalance');
const pkrBalance = document.getElementById('pkrBalance');
const tiktokCoinsBalance = document.getElementById('tiktokCoinsBalance');
const amazonCoinsBalance = document.getElementById('amazonCoinsBalance');
const pubgUCBalance = document.getElementById('pubgUCBalance');
const freeFireDiamondsBalance = document.getElementById('freeFireDiamondsBalance');
const bitgetUSDTBalance = document.getElementById('bitgetUSDTBalance');
const logoutButton = document.getElementById('logoutButton');

// Wallet Rotation Elements
const balanceTrack = document.getElementById('balance-track');
const prevSlideButton = document.getElementById('prevSlide');
const nextSlideButton = document.getElementById('nextSlide');
const totalSlides = 7; // Total number of balance slides
let currentSlideIndex = 0;
let rotationInterval;


// Exchange elements (Forms and Inputs)
const coinsToPkrForm = document.getElementById('coinsToPkrForm');
const exchangeCoinsInput = document.getElementById('exchangeCoins');
const exchangeResultCoinsToPkr = document.getElementById('exchangeResultCoinsToPkr');
const exchangeButton = document.getElementById('exchangeButton');

const pkrToCoinForm = document.getElementById('pkrToCoinForm');
const pkrAmountInput = document.getElementById('pkrAmount');
const exchangeResultPkrToCoins = document.getElementById('exchangeResultPkrToCoins');
const pkrToCoinButton = document.getElementById('pkrToCoinButton');

// Exchange forms for new currencies (defined in HTML)
const pkrToTiktokForm = document.getElementById('pkrToTiktokForm');
const pkrToAmazonForm = document.getElementById('pkrToAmazonForm');
const pkrToPubgForm = document.getElementById('pkrToPubgForm');
const pkrToFreeFireForm = document.getElementById('pkrToFreeFireForm');
const pkrToUsdtForm = document.getElementById('pkrToUsdtForm');


let isSignupMode = false;
let currentCoins = 0;
let currentPkr = 0;
let currentTiktokCoins = 0;
let currentAmazonCoins = 0;
let currentPubgUC = 0;
let currentFreeFireDiamonds = 0;
let currentBitgetUSDT = 0;
let currentUser = null;

// --- PROFILE HELPER ---
function generateInitials(fullName) {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return firstInitial + lastInitial;
}

// --- VIEW MANAGEMENT ---
function showView(viewId) {
    authContainer.style.display = 'none';
    dashboardContainer.style.display = 'none';
    appHeader.style.display = 'none';

    if (viewId === 'dashboard') {
        dashboardContainer.style.display = 'block';
        appHeader.style.display = 'flex';
        document.querySelector('.main-content').style.alignItems = 'flex-start'; 
        startWalletRotation(); // Start rotation when dashboard is shown
    } else {
        authContainer.style.display = 'block';
        document.querySelector('.main-content').style.alignItems = 'center';
        stopWalletRotation(); // Stop rotation when logged out
    }
}

// --- WALLET ROTATION LOGIC ---

function updateSlidePosition() {
    const slideWidth = 100 / totalSlides; // 14.28%
    const offset = currentSlideIndex * slideWidth;
    balanceTrack.style.transform = `translateX(-${offset}%)`;
}

function nextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
    updateSlidePosition();
}

function prevSlide() {
    currentSlideIndex = (currentSlideIndex - 1 + totalSlides) % totalSlides;
    updateSlidePosition();
}

function startWalletRotation() {
    if (rotationInterval) clearInterval(rotationInterval);
    rotationInterval = setInterval(nextSlide, 5000); // Rotate every 5 seconds
}

function stopWalletRotation() {
    if (rotationInterval) clearInterval(rotationInterval);
}

// Manual navigation setup
prevSlideButton.addEventListener('click', () => {
    stopWalletRotation();
    prevSlide();
    startWalletRotation();
});

nextSlideButton.addEventListener('click', () => {
    stopWalletRotation();
    nextSlide();
    startWalletRotation();
});


// --- AUTH LOGIC ---
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

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = authNameInput.value.trim();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;

    try {
        if (isSignupMode) {
            if (!name) {
                alert("Barah-e-meherbani apna naam darj karen.");
                return;
            }
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            await userCredential.user.updateProfile({ displayName: name });

            // Initialize all balances
            await db.collection('users').doc(userCredential.user.uid).set({ 
                name: name,
                email: email,
                coins: 0,
                pkrBalance: 0,
                tiktokCoins: 0,
                amazonCoins: 0,
                pubgUC: 0,
                freeFireDiamonds: 0,
                bitgetUSDT: 0,
                uid: userCredential.user.uid
            });

            alert("Signup Successful!");

        } else {
            await auth.signInWithEmailAndPassword(email, password);
            alert("Login Successful!");
        }
    } catch (error) {
        alert(`Authentication Failed: ${error.message}`);
    }
});

logoutButton.addEventListener('click', async () => {
    await auth.signOut();
    alert("Logout Successful.");
});

// --- WALLET LISTENER (Real-time) ---
function listenToWallet(uid) {
    db.collection('users').doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            
            // Update local state
            currentCoins = Number(data.coins) || 0;
            currentPkr = Number(data.pkrBalance) || 0;
            currentTiktokCoins = Number(data.tiktokCoins) || 0;
            currentAmazonCoins = Number(data.amazonCoins) || 0;
            currentPubgUC = Number(data.pubgUC) || 0;
            currentFreeFireDiamonds = Number(data.freeFireDiamonds) || 0;
            currentBitgetUSDT = Number(data.bitgetUSDT) || 0;

            // Update DOM
            coinsBalance.textContent = currentCoins.toLocaleString();
            pkrBalance.textContent = `${currentPkr.toFixed(2)} PKR`;
            tiktokCoinsBalance.textContent = currentTiktokCoins.toLocaleString();
            amazonCoinsBalance.textContent = `${currentAmazonCoins.toFixed(2)} USD`;
            pubgUCBalance.textContent = currentPubgUC.toLocaleString();
            freeFireDiamondsBalance.textContent = currentFreeFireDiamonds.toLocaleString();
            bitgetUSDTBalance.textContent = `${currentBitgetUSDT.toFixed(2)} USDT`;
            
        } else {
            // Reset all balances if document is missing
            coinsBalance.textContent = '0'; pkrBalance.textContent = '0.00 PKR'; tiktokCoinsBalance.textContent = '0';
            amazonCoinsBalance.textContent = '0.00 USD'; pubgUCBalance.textContent = '0';
            freeFireDiamondsBalance.textContent = '0'; bitgetUSDTBalance.textContent = '0.00 USDT';
            currentCoins = currentPkr = currentTiktokCoins = currentAmazonCoins = currentPubgUC = currentFreeFireDiamonds = currentBitgetUSDT = 0;
        }
    }, error => {
        console.error("Error listening to wallet:", error);
    });
}

// --- AUTH CHECK & VIEW RENDER ---
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        const displayName = user.displayName || 'N/A';
        
        profileName.textContent = displayName;
        profileEmail.textContent = user.email;
        profileUid.textContent = user.uid.substring(0, 10) + '...';
        profileInitials.textContent = generateInitials(displayName);

        listenToWallet(user.uid);
        showView('dashboard');
    } else {
        showView('auth');
    }
});

// ===================================================
// --- GENERIC EXCHANGE LOGIC ---
// ===================================================

/**
 * Sets up the exchange logic for PKR to a specific target currency.
 * @param {string} formId - ID of the form element.
 * @param {string} inputId - ID of the input field.
 * @param {string} resultId - ID of the result display element.
 * @param {number} targetRate - PKR required per 1 unit of target currency.
 * @param {string} targetField - Firestore field name (e.g., 'tiktokCoins').
 * @param {string} targetUnit - Display unit (e.g., 'TikTok Coins', 'USDT').
 * @param {number} fixed - Number of decimal places for the received amount.
 */
function setupPkrToCurrencyExchange(formId, inputId, resultId, targetRate, targetField, targetUnit, fixed) {
    const form = document.getElementById(formId);
    const input = document.getElementById(inputId);
    const resultDisplay = document.getElementById(resultId);
    const button = form.querySelector('button');

    input.addEventListener('input', () => {
        const pkrToConvert = Number(input.value);
        const isDivisible = pkrToConvert % targetRate === 0;

        if (pkrToConvert >= targetRate && isDivisible) {
            const receivedAmount = pkrToConvert / targetRate;
            resultDisplay.textContent = `${pkrToConvert.toFixed(2)} PKR = ${receivedAmount.toFixed(fixed)} ${targetUnit}`;
            button.disabled = false;
        } else {
            resultDisplay.textContent = `Minimum ${targetRate} PKR Required (Divisible by ${targetRate})`;
            button.disabled = true;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pkrToConvert = Number(input.value);
        const user = auth.currentUser;

        if (!user || pkrToConvert > currentPkr) {
            alert("Aapke paas itna PKR balance nahi hai.");
            return;
        }
        
        const receivedAmount = pkrToConvert / targetRate;

        if (receivedAmount === 0) {
            alert(`PKR ki miqdar ${targetRate} se kam hai. Koi ${targetUnit} nahi milenge.`);
            return;
        }

        if (confirm(`Kya aap ${pkrToConvert.toFixed(2)} PKR kharch karke ${receivedAmount.toFixed(fixed)} ${targetUnit} banana chahte hain?`)) {
            
            const userRef = db.collection('users').doc(user.uid);

            try {
                await db.runTransaction(async (transaction) => {
                    const userDoc = await transaction.get(userRef);
                    const data = userDoc.data();
                    
                    const newPkrBalance = (data.pkrBalance || 0) - pkrToConvert;
                    const newTargetBalance = (data[targetField] || 0) + receivedAmount;

                    if (newPkrBalance < 0) {
                        throw new Error("Insufficient PKR balance during transaction.");
                    }

                    transaction.update(userRef, {
                        [targetField]: newTargetBalance,
                        pkrBalance: newPkrBalance
                    });
                });

                alert(`Conversion Successful! ${receivedAmount.toFixed(fixed)} ${targetUnit} aapke wallet mein add ho gaye.`);
                form.reset();
                resultDisplay.textContent = `0 PKR = 0 ${targetUnit}`;

            } catch (error) {
                console.error("Transaction failed:", error);
                alert(`Conversion failed: ${error.message}.`);
            }
        }
    });
}


// ===================================================
// --- INITIALIZE EXCHANGES ON DOM LOAD ---
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- A. Coins to PKR Exchange ---
    
    exchangeCoinsInput.addEventListener('input', () => {
        const coinsToConvert = Number(exchangeCoinsInput.value);
        const isDivisible = coinsToConvert % COIN_TO_PKR_RATE === 0;

        if (coinsToConvert >= COIN_TO_PKR_RATE && isDivisible) {
            const pkr = coinsToConvert / COIN_TO_PKR_RATE;
            exchangeResultCoinsToPkr.textContent = `${coinsToConvert.toLocaleString()} Coins = ${pkr.toFixed(2)} PKR`;
            exchangeButton.disabled = false;
        } else {
            exchangeResultCoinsToPkr.textContent = `Minimum ${COIN_TO_PKR_RATE} Coins Required (Must be divisible by ${COIN_TO_PKR_RATE})`;
            exchangeButton.disabled = true;
        }
    });

    coinsToPkrForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const coinsToConvert = Number(exchangeCoinsInput.value);
        const user = auth.currentUser;

        if (!user || coinsToConvert > currentCoins) {
            alert("Aapke paas itne coins nahi hain.");
            return;
        }

        const pkrToReceive = coinsToConvert / COIN_TO_PKR_RATE;
        const userRef = db.collection('users').doc(user.uid);

        if (confirm(`Kya aap ${coinsToConvert.toLocaleString()} Coins kharch karke ${pkrToReceive.toFixed(2)} PKR banana chahte hain?`)) {
            try {
                await db.runTransaction(async (transaction) => {
                    const userDoc = await transaction.get(userRef);
                    const data = userDoc.data();
                    const newCoins = (data.coins || 0) - coinsToConvert;
                    const newPkrBalance = (data.pkrBalance || 0) + pkrToReceive;
                    if (newCoins < 0) throw new Error("Insufficient coins during transaction.");
                    transaction.update(userRef, { coins: newCoins, pkrBalance: newPkrBalance });
                });

                alert(`Conversion Successful! ${pkrToReceive.toFixed(2)} PKR aapke withdrawal balance mein add ho gaye.`);
                coinsToPkrForm.reset();
                exchangeResultCoinsToPkr.textContent = '0 Coins = 0.00 PKR';

            } catch (error) {
                console.error("Transaction failed:", error);
                alert(`Conversion failed: ${error.message}.`);
            }
        }
    });
    
    // --- B. PKR to Main Coins Exchange ---
    setupPkrToCurrencyExchange('pkrToCoinForm', 'pkrAmount', 'exchangeResultPkrToCoins', PKR_TO_COIN_RATE, 'coins', 'Coins', 0);
    
    // --- C. PKR to TikTok Coins Exchange Logic ---
    setupPkrToCurrencyExchange(
        'pkrToTiktokForm', 
        'pkrAmountTiktok', 
        'exchangeResultPkrToTiktok', 
        EXCHANGE_RATES.TIKTOK.rate, 
        EXCHANGE_RATES.TIKTOK.field, 
        EXCHANGE_RATES.TIKTOK.unit,
        EXCHANGE_RATES.TIKTOK.fixed
    );
    
    // --- D. PKR to Amazon Coins Exchange Logic ---
    setupPkrToCurrencyExchange(
        'pkrToAmazonForm', 
        'pkrAmountAmazon', 
        'exchangeResultPkrToAmazon', 
        EXCHANGE_RATES.AMAZON.rate, 
        EXCHANGE_RATES.AMAZON.field, 
        EXCHANGE_RATES.AMAZON.unit,
        EXCHANGE_RATES.AMAZON.fixed
    );
    
    // --- E. PKR to PUBG UC Exchange Logic ---
    setupPkrToCurrencyExchange(
        'pkrToPubgForm', 
        'pkrAmountPubg', 
        'exchangeResultPkrToPubg', 
        EXCHANGE_RATES.PUBG.rate, 
        EXCHANGE_RATES.PUBG.field, 
        EXCHANGE_RATES.PUBG.unit,
        EXCHANGE_RATES.PUBG.fixed
    );
    
    // --- F. PKR to Free Fire Diamonds Exchange Logic ---
    setupPkrToCurrencyExchange(
        'pkrToFreeFireForm', 
        'pkrAmountFreeFire', 
        'exchangeResultPkrToFreeFire', 
        EXCHANGE_RATES.FREEFIRE.rate, 
        EXCHANGE_RATES.FREEFIRE.field, 
        EXCHANGE_RATES.FREEFIRE.unit,
        EXCHANGE_RATES.FREEFIRE.fixed
    );
    
    // --- G. PKR to Bitget USDT Exchange Logic ---
    setupPkrToCurrencyExchange(
        'pkrToUsdtForm', 
        'pkrAmountUsdt', 
        'exchangeResultPkrToUsdt', 
        EXCHANGE_RATES.USDT.rate, 
        EXCHANGE_RATES.USDT.field, 
        EXCHANGE_RATES.USDT.unit,
        EXCHANGE_RATES.USDT.fixed
    );
});
