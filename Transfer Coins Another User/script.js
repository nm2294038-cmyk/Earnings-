// --- FIREBASE CONFIGURATION AND INITIALIZATION ---
// NOTE: Make sure the Firebase SDKs are loaded in index.html HEAD before this script runs.
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

// --- CONSTANTS ---
const TRANSFER_AMOUNTS = [100, 1200, 2400, 3600, 4800, 5800, 7800, 15000, 25000, 35000];

// --- GLOBAL STATE ---
let currentUser = null;
let currentCoinBalance = 0;
let recipientUserId = null;

// --- DOM ELEMENTS ---
const currentBalanceDisplay = document.getElementById('currentBalanceDisplay');
const guideArticle = document.getElementById('guideArticle');
const transferSection = document.getElementById('transferSection');
const transferForm = document.getElementById('transferForm');
const recipientEmailInput = document.getElementById('recipientEmail');
const recipientInfoDiv = document.getElementById('recipientInfo');
const recipientNameDisplay = document.getElementById('recipientNameDisplay');
const transferAmountInput = document.getElementById('transferAmount');
const sendButton = document.getElementById('sendButton');
const profileIconButton = document.getElementById('profileIconButton');
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authButton = document.getElementById('authButton');
const logoutButton = document.getElementById('logoutButton');
const transferHistoryList = document.getElementById('transferHistoryList');
const coinButtonsContainer = document.getElementById('coinButtonsContainer');


// --- INITIAL SETUP: RENDER COIN BUTTONS ---
function renderCoinButtons() {
    coinButtonsContainer.innerHTML = '';
    TRANSFER_AMOUNTS.forEach(amount => {
        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.textContent = `${amount.toLocaleString()} Coins`;
        button.setAttribute('data-amount', amount);
        button.addEventListener('click', () => {
            transferAmountInput.value = amount;
            transferAmountInput.dispatchEvent(new Event('input')); // Trigger validation
        });
        coinButtonsContainer.appendChild(button);
    });
}
renderCoinButtons();


// --- AUTH MODAL LOGIC ---
function toggleAuthMode() {
    authTitle.textContent = "Login Karen";
    authButton.textContent = "Login";
    document.getElementById('authForm').reset();
}

profileIconButton.addEventListener('click', () => {
    if (currentUser) {
        if (confirm("Aap pehle se logged in hain. Kya aap logout karna chahte hain?")) {
            auth.signOut();
        }
    } else {
        authModal.style.display = 'flex';
        toggleAuthMode();
    }
});

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        authModal.style.display = 'none';
    } catch (error) {
        alert(`Login Failed: ${error.message}`);
    }
});

logoutButton.addEventListener('click', async () => {
    await auth.signOut();
});


// --- WALLET LISTENER ---
function listenToWallet(uid) {
    db.collection('users').doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            currentCoinBalance = Number(data.coins) || 0;
            currentBalanceDisplay.textContent = `${currentCoinBalance.toLocaleString()} Coins`;
        } else {
            currentCoinBalance = 0;
            currentBalanceDisplay.textContent = `0 Coins`;
        }
        checkFormValidity();
    });
}

// --- AUTH CHECK & VIEW MANAGEMENT ---
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        // Logged In: Show Transfer Section
        guideArticle.style.display = 'none';
        transferSection.style.display = 'block';
        currentBalanceDisplay.style.display = 'block';
        
        // Hide login button in modal
        document.getElementById('authForm').style.display = 'none';
        document.getElementById('toggleText').style.display = 'none';
        logoutButton.style.display = 'block';

        listenToWallet(user.uid);
        listenToTransferHistory(user.uid, user.email);
    } else {
        // Logged Out: Show Guide Article
        guideArticle.style.display = 'block';
        transferSection.style.display = 'none';
        currentBalanceDisplay.style.display = 'none';
        currentCoinBalance = 0;

        // Show login button in modal
        document.getElementById('authForm').style.display = 'block';
        document.getElementById('toggleText').style.display = 'block';
        logoutButton.style.display = 'none';
    }
});

// --- RECIPIENT VALIDATION (Real-time check on email input) ---
let emailCheckTimeout;

recipientEmailInput.addEventListener('input', () => {
    clearTimeout(emailCheckTimeout);
    recipientInfoDiv.style.display = 'none';
    recipientNameDisplay.textContent = 'Loading...';
    recipientUserId = null;
    checkFormValidity();

    const email = recipientEmailInput.value.trim();
    if (email.length < 5 || !email.includes('@')) return;

    emailCheckTimeout = setTimeout(() => {
        validateRecipient(email);
    }, 1000);
});

async function validateRecipient(email) {
    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
        recipientInfoDiv.style.display = 'block';
        recipientNameDisplay.textContent = 'Aap khud ko coins nahi bhej sakte!';
        recipientInfoDiv.style.backgroundColor = '#ffcccc';
        recipientUserId = null;
        checkFormValidity();
        return;
    }

    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();

        if (!snapshot.empty) {
            const recipientDoc = snapshot.docs[0];
            const recipientData = recipientDoc.data();
            
            recipientUserId = recipientDoc.id;
            // Assuming user doc might have a 'name' field, otherwise show email
            const name = recipientData.name ? recipientData.name : recipientData.email; 
            recipientNameDisplay.textContent = name;
            recipientInfoDiv.style.display = 'block';
            recipientInfoDiv.style.backgroundColor = '#e6ffe6';
        } else {
            recipientNameDisplay.textContent = 'Yeh email address registered nahi hai.';
            recipientInfoDiv.style.display = 'block';
            recipientInfoDiv.style.backgroundColor = '#ffcccc';
            recipientUserId = null;
        }
    } catch (error) {
        console.error("Recipient validation failed:", error);
        recipientNameDisplay.textContent = 'Verification mein masla hua.';
        recipientInfoDiv.style.display = 'block';
        recipientInfoDiv.style.backgroundColor = '#ffcccc';
        recipientUserId = null;
    }
    checkFormValidity();
}

transferAmountInput.addEventListener('input', checkFormValidity);

function checkFormValidity() {
    const amount = Number(transferAmountInput.value);
    const isRecipientValid = recipientUserId && amount > 0;
    const isBalanceSufficient = amount <= currentCoinBalance;

    if (isRecipientValid && isBalanceSufficient) {
        sendButton.disabled = false;
        sendButton.textContent = `Transfer ${amount.toLocaleString()} Coins`;
    } else {
        sendButton.disabled = true;
        if (amount > currentCoinBalance) {
            sendButton.textContent = `Balance Kam Hai (${currentCoinBalance.toLocaleString()} Available)`;
        } else if (amount <= 0 || !amount) {
            sendButton.textContent = `Miqdar Darj Karen`;
        } else if (!recipientUserId) {
            sendButton.textContent = `Receiver Verify Karen`;
        } else {
            sendButton.textContent = `Coins Transfer Karen`;
        }
    }
}

// --- TRANSFER TRANSACTION LOGIC ---

transferForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const amount = Number(transferAmountInput.value);
    const senderUid = currentUser.uid;
    const receiverUid = recipientUserId;
    
    if (!receiverUid || amount <= 0 || amount > currentCoinBalance) {
        alert("Transaction ke liye data sahi nahi hai ya balance kam hai.");
        return;
    }

    if (!confirm(`Kya aap waqai ${amount.toLocaleString()} Coins ${recipientNameDisplay.textContent} ko transfer karna chahte hain?`)) {
        return;
    }

    sendButton.disabled = true;
    sendButton.textContent = 'Transferring...';

    const senderRef = db.collection('users').doc(senderUid);
    const receiverRef = db.collection('users').doc(receiverUid);

    try {
        await db.runTransaction(async (transaction) => {
            const senderDoc = await transaction.get(senderRef);
            
            // Check sender existence and balance again (crucial for security)
            if (!senderDoc.exists) {
                throw new Error("Sender ka account nahi mila.");
            }
            const senderCoins = senderDoc.data().coins || 0;
            if (senderCoins < amount) {
                throw new Error("Insufficient Balance (Coins).");
            }
            
            // 1. Deduct from Sender
            transaction.update(senderRef, {
                coins: firebase.firestore.FieldValue.increment(-amount)
            });

            // 2. Add to Receiver (Receiver existence is already confirmed by recipientUserId)
            transaction.update(receiverRef, {
                coins: firebase.firestore.FieldValue.increment(amount)
            });
            
            // 3. Log the transaction 
            db.collection('transfers').add({
                senderId: senderUid,
                receiverId: receiverUid,
                senderEmail: currentUser.email,
                receiverEmail: recipientEmailInput.value.trim(),
                amount: amount,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        alert(`Transfer Successful! ${amount.toLocaleString()} Coins ${recipientNameDisplay.textContent} ko bhej diye gaye.`);
        transferForm.reset();
        recipientInfoDiv.style.display = 'none';
        recipientUserId = null;
        checkFormValidity();

    } catch (error) {
        console.error("Transaction failed:", error);
        alert(`Transfer failed: ${error.message}`);
        checkFormValidity();
    }
});

// --- HISTORY LOGIC ---

function formatTimestamp(timestamp) {
    if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toLocaleTimeString('en-PK', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }
    return 'N/A';
}

function renderTransferHistory(combinedHistory, userEmail) {
    if (combinedHistory.length === 0) {
        transferHistoryList.innerHTML = '<p>Abhi tak koi transfer record maujood nahi hai.</p>';
        return;
    }

    let html = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Coins</th>
                    <th>Sender/Receiver</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    combinedHistory.forEach(t => {
        const isSent = t.senderEmail === userEmail;
        const typeClass = isSent ? 'sent' : 'received';
        const typeText = isSent ? 'SENT (-)' : 'RECEIVED (+)';
        const relatedUser = isSent ? t.receiverEmail : t.senderEmail;
        
        html += `
            <tr>
                <td><span class="${typeClass}">${typeText}</span></td>
                <td>${t.amount.toLocaleString()}</td>
                <td>${relatedUser}</td>
                <td>${formatTimestamp(t.timestamp)}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    transferHistoryList.innerHTML = html;
}


function listenToTransferHistory(uid, email) {
    // Note: These listeners require specific Firestore Composite Indexes to work correctly.
    
    const sentQuery = db.collection('transfers')
        .where('senderId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(10);
    
    const receivedQuery = db.collection('transfers')
        .where('receiverId', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(10);

    let sentTransfers = [];
    let receivedTransfers = [];
    let loadedCount = 0;

    const processHistory = () => {
        // Combine and sort all transactions
        const combinedHistory = [...sentTransfers, ...receivedTransfers].sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
            const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
            return timeB - timeA; // Sort descending by time
        });
        renderTransferHistory(combinedHistory, email);
    };

    const updateHistory = () => {
        loadedCount++;
        if (loadedCount === 2) {
            processHistory();
        }
    };

    // Listener for Sent Transfers
    sentQuery.onSnapshot(snapshot => {
        sentTransfers = snapshot.docs.map(doc => doc.data());
        updateHistory();
    }, error => {
        console.error("Error fetching sent history:", error);
        updateHistory(); 
    });

    // Listener for Received Transfers
    receivedQuery.onSnapshot(snapshot => {
        receivedTransfers = snapshot.docs.map(doc => doc.data());
        updateHistory();
    }, error => {
        console.error("Error fetching received history:", error);
        updateHistory(); 
    });
}
