// 1. **YOUR FIREBASE CONFIGURATION**
const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
    measurementId: "G-HJQ46RQNZS"
};

// Firebase Imports (Note: These assume the script is imported as a module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, query, onSnapshot, doc, getDoc, addDoc, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM Elements ---
const walletDisplay = document.getElementById('walletDisplay');
const profileIcon = document.getElementById('profileIcon');
const authPrompt = document.getElementById('authPrompt');
const mainContent = document.getElementById('mainContent');
const userFooter = document.getElementById('userFooter');
const categorySelectionView = document.getElementById('categorySelectionView');
const taskListingView = document.getElementById('taskListingView');
const categoriesGrid = document.getElementById('categoriesGrid');
const taskListGrid = document.getElementById('taskListGrid');
const listingTitle = document.getElementById('listingTitle');
const historyListDiv = document.getElementById('historyList');

// --- Data Storage ---
let allTasks = [];
let allProducts = [];
let currentUserData = {};

// --- View Mapping ---
const VIEWS = { 
    tasksView: document.getElementById('tasksView'), 
    proofView: document.getElementById('proofView'), 
    toolsView: document.getElementById('toolsView') 
};
const CATEGORIES = {
    'YT': { title: 'YouTube Tasks', icon: 'subscriptions', class: 'youtube-icon' },
    'IG': { title: 'Instagram Tasks', icon: 'camera_alt', class: 'instagram-icon' },
    'TT': { title: 'TikTok Tasks', icon: 'music_video', class: 'tiktok-icon' },
    'WA_C': { title: 'WhatsApp Channel', icon: 'chat', class: 'whatsapp-icon' },
    'WA_G': { title: 'WhatsApp Group', icon: 'group', class: 'whatsapp-icon' },
    'APP': { title: 'App Install', icon: 'cloud_download', class: 'app-icon' },
    'WEB': { title: 'Website Visit', icon: 'language', class: 'web-icon' },
    'PROD': { title: 'Product Buy/Visit', icon: 'shopping_cart', class: 'other-icon' },
};

// ----------------------------------------------------------------------
// 2. CORE FLOW AND AUTHENTICATION
// ----------------------------------------------------------------------

onAuthStateChanged(auth, (user) => {
    if (user) {
        profileIcon.classList.remove('hidden');
        profileIcon.textContent = user.email[0].toUpperCase();
        userFooter.classList.remove('hidden');

        authPrompt.classList.add('hidden');
        mainContent.classList.remove('hidden');
        
        listenForUserData(user.uid);
        listenForTasksAndProducts();
        listenForProofHistory(user.uid); 
        changeUserView('tasksView');
    } else {
        currentUserData = {};
        authPrompt.classList.remove('hidden');
        mainContent.classList.add('hidden');
        profileIcon.classList.add('hidden');
        userFooter.classList.add('hidden');
        walletDisplay.classList.add('hidden');
    }
});

profileIcon.addEventListener('click', () => {
    if (auth.currentUser) {
        const userEmail = currentUserData.email || "Loading...";
        if (confirm(`Logged in as: ${userEmail}\nDo you want to logout?`)) {
            signOut(auth);
            alert("Logging out.");
        }
    }
});

document.getElementById('authBtn').addEventListener('click', () => {
    alert("Redirecting to Login/Signup page.");
});

// Footer Navigation Handler
userFooter.addEventListener('click', (e) => {
    if (e.target.closest('.footer-btn')) {
        const viewId = e.target.closest('.footer-btn').dataset.view;
        if (viewId !== 'toolsView') {
            changeUserView(viewId);
        }
    }
});

window.openToolsLink = (event) => {
    if (event) event.preventDefault(); 
    window.open('https://toolswebsite205.blogspot.com', '_blank');
}

function changeUserView(viewId) {
    Object.keys(VIEWS).forEach(key => VIEWS[key].classList.add('hidden'));
    VIEWS[viewId].classList.remove('hidden');
    
    document.querySelectorAll('.footer-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === viewId) {
            btn.classList.add('active');
        }
    });
}

// ----------------------------------------------------------------------
// 3. LISTENERS AND DATA FETCHING
// ----------------------------------------------------------------------

function listenForUserData(userId) {
    onSnapshot(doc(db, "users", userId), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            currentUserData = data;
            const wallet = data.wallet || 0;
            walletDisplay.textContent = `${wallet.toFixed(2)} Coins`;
            walletDisplay.classList.remove('hidden');
        }
    });
}

function listenForTasksAndProducts() {
    const tasksQuery = collection(db, "sellerTasks"); 
    onSnapshot(tasksQuery, (snapshot) => {
        allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCategorySelection();
        if (taskListingView.classList.contains('active')) {
            const currentPrefix = taskListingView.dataset.prefix;
            if (currentPrefix) displayTasksByPrefix(currentPrefix);
        }
    });

    const productsQuery = collection(db, "sellerProducts");
    onSnapshot(productsQuery, (snapshot) => {
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCategorySelection();
    });
}

// Proof History Listener
function listenForProofHistory(userId) {
    const q = query(collection(db, "sellerProofs"), where("userId", "==", userId));
    onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProofHistory(history);
        
        // --- PAYMENT LOGIC SIMULATION ---
        history.forEach(item => {
            if (item.status === 'approved' && !item.paidOut) {
                // IMPORTANT: This should be handled by a secure Cloud Function or Admin process.
                // updateWalletBalance(item.coinsToAward, item.id); // Example function call
            }
        });
    });
}

// ----------------------------------------------------------------------
// 4. NAVIGATION AND RENDERING
// ----------------------------------------------------------------------

window.showCategorySelection = () => {
    taskListingView.classList.add('hidden');
    categorySelectionView.classList.remove('hidden');
    taskListingView.classList.remove('active');
}

function getTaskPrefix(taskType) {
    if (taskType.startsWith('WA_Channel')) return 'WA_C';
    if (taskType.startsWith('WA_Group')) return 'WA_G';
    if (taskType === 'PROD') return 'PROD';
    const underscoreIndex = taskType.indexOf('_');
    return underscoreIndex > 0 ? taskType.substring(0, underscoreIndex) : null;
}

function renderCategorySelection() {
    let html = '';
    const prefixes = new Set();
    
    allTasks.forEach(t => {
        const prefix = getTaskPrefix(t.taskType);
        if (prefix) prefixes.add(prefix);
    });
    if (allProducts.length > 0) prefixes.add('PROD');

    Object.keys(CATEGORIES).forEach(prefix => {
        if (prefixes.has(prefix)) {
            const cat = CATEGORIES[prefix];
            let count = (prefix === 'PROD') 
                ? allProducts.length 
                : allTasks.filter(t => getTaskPrefix(t.taskType) === prefix).length;
            
            if (count > 0) {
                html += `
                    <div class="category-card" data-prefix="${prefix}" onclick="displayTasksByPrefix('${prefix}')">
                        <span class="category-icon material-icons ${cat.class}">${cat.icon}</span>
                        <div>${cat.title}</div>
                        <small>(${count} Tasks)</small>
                    </div>
                `;
            }
        }
    });
    categoriesGrid.innerHTML = html;
}

window.displayTasksByPrefix = (prefix) => {
    const isProduct = prefix === 'PROD';
    const title = CATEGORIES[prefix].title;
    let filteredData = isProduct 
        ? allProducts 
        : allTasks.filter(task => getTaskPrefix(task.taskType) === prefix);
    
    listingTitle.textContent = title;
    taskListGrid.innerHTML = filteredData.map(item => isProduct ? renderProductCard(item) : renderTaskCard(item)).join('');
    
    categorySelectionView.classList.add('hidden');
    taskListingView.classList.remove('hidden');
    taskListingView.classList.add('active'); 
    taskListingView.dataset.prefix = prefix;
}

function renderTaskCard(task) {
    const taskActionText = task.taskType.replace(getTaskPrefix(task.taskType) + '_', '').replace(/([A-Z])/g, ' $1').trim();
    const sellerTitle = task.title || (getTaskPrefix(task.taskType) + ' Task'); 
    const descriptionText = `لازمی انتباہ: اگر ٹاسک ہدایات کے مطابق مکمل نہیں کیا گیا تو آپ کا انخلا وصول مسترد کر دیا جائے گا۔`;

    return `
        <div class="task-card-detail">
            <h4>${sellerTitle}</h4> 
            <p style="color:#30c7ff;">${getTaskPrefix(task.taskType)} - ${taskActionText}</p>
            
            <div class="task-description">
               <span class="material-icons">warning</span> 
               <div>${descriptionText}</div>
            </div>

            <a href="${task.link}" target="_blank" class="btn-open-earn" data-task-id="${task.id}" data-coins="${task.coins.toFixed(2)}" onclick="handleTaskAction(this)">
                Open & Earn ${task.coins.toFixed(0)} Coins
            </a>
        </div>
    `;
}

function renderProductCard(product) {
    const descriptionText = `لازمی انتباہ: اس پروڈکٹ کو خریدنے پر ہی انعامی کوائنز دیے جائیں گے۔`;
    
    const imageHtml = product.imageLink && product.imageLink.startsWith('http')
                      ? `<img src="${product.imageLink}" alt="${product.title}" class="product-image" onerror="this.style.display='none'">`
                      : '';

    return `
        <div class="task-card-detail" style="border-left: 4px solid #f97316;">
            ${imageHtml}
            <h4>${product.title}</h4>
            <p style="color:#f97316;">Product - Price: ${product.price}</p>
            
            <div class="task-description">
               <span class="material-icons">warning</span> 
               <div>${descriptionText}</div>
            </div>

            <a href="${product.link}" target="_blank" class="btn-open-earn" style="background:#f97316; color:white;" data-product-id="${product.id}" data-coins="${product.coins.toFixed(2)}" onclick="handleProductAction(this)">
                View & Earn ${product.coins.toFixed(0)} Coins
            </a>
        </div>
    `;
}

// Render Proof History
function renderProofHistory(history) {
    if (history.length === 0) {
        historyListDiv.innerHTML = '<p style="text-align:center; color:#94a3b8;">Abhi tak koi proof submit nahi kiya gaya.</p>';
        return;
    }

    historyListDiv.innerHTML = history.map(item => {
        let statusClass = 'status-pending';
        if (item.status === 'approved') statusClass = 'status-approved';
        if (item.status === 'rejected') statusClass = 'status-rejected';
        
        const categoryTitle = CATEGORIES[item.category] ? CATEGORIES[item.category].title : 'N/A';

        return `
            <div class="proof-history-item">
                <div>
                    <strong>${item.description.substring(0, 50)}...</strong>
                    <p style="font-size: 11px; color: #7f8c8d;">Category: ${categoryTitle} | Coins: ${item.coinsToAward || '?'}</p>
                </div>
                <div>
                    <span class="proof-status-tag ${statusClass}">${item.status.toUpperCase()}</span>
                    <a href="${item.proofLink}" target="_blank" style="margin-left: 10px; color:#30c7ff;">View Proof</a>
                </div>
            </div>
        `;
    }).join('');
}

// ----------------------------------------------------------------------
// 5. ACTION HANDLERS
// ----------------------------------------------------------------------

window.handleTaskAction = (element) => {
    const coins = parseFloat(element.dataset.coins);
    alert(`Task initiated! You will earn ${coins} COINS after submitting proof and successful verification.`);
};

window.handleProductAction = (element) => {
    const coins = parseFloat(element.dataset.coins);
    alert(`Product view initiated! Purchase is required. You will earn ${coins} COINS after proof.`);
};

// Proof Submission Logic
document.getElementById('submitProofBtn').addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please login to submit proof.");

    const category = document.getElementById('proofTaskCategory').value;
    const description = document.getElementById('proofDescription').value.trim();
    const proofLink = document.getElementById('proofLink').value.trim();

    if (!category || !description || !proofLink) {
        return alert("Please fill all fields (Category, Description, and Proof Link).");
    }
    
    const coinsToAward = 5; // Placeholder value

    try {
        await addDoc(collection(db, "sellerProofs"), {
            userId: user.uid,
            email: currentUserData.email,
            category: category,
            description: description,
            proofLink: proofLink,
            status: 'pending',
            coinsToAward: coinsToAward, 
            submittedAt: serverTimestamp()
        });

        alert("Proof submitted successfully! It is now pending admin review.");
        document.getElementById('proofDescription').value = '';
        document.getElementById('proofLink').value = '';
        document.getElementById('proofTaskCategory').value = '';

    } catch (e) {
        console.error("Proof submission failed:", e);
        alert("Error submitting proof.");
    }
});
