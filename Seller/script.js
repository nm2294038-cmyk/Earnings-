// 1. **YOUR FIREBASE CONFIGURATION**
const firebaseConfig = {
    // SECURITY WARNING: Replace this placeholder with your actual keys.
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4", 
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
    measurementId: "G-HJQ46RQNZS"
};

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, addDoc, serverTimestamp, getDoc, updateDoc, query, where, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM Elements ---
const loginForm = document.getElementById('loginForm');
const sellerDashboard = document.getElementById('sellerDashboard');
const dashboardFooter = document.getElementById('dashboardFooter');
const statusMessage = document.getElementById('statusMessage');
const profileIcon = document.getElementById('profileIcon');
const loginBtn = document.getElementById('loginBtn');
const walletDisplay = document.getElementById('walletDisplay');
const taskListDiv = document.getElementById('taskList');
const productListDiv = document.getElementById('productList');
const socialLinkListDiv = document.getElementById('socialLinkList');
const proofListDiv = document.getElementById('proofList');
const taskIdToEdit = document.getElementById('taskIdToEdit');
const taskFormTitle = document.getElementById('taskFormTitle');
const addTaskBtn = document.getElementById('addTaskBtn');

const views = {
    taskManagementView: document.getElementById('taskManagementView'),
    productManagementView: document.getElementById('productManagementView'),
    socialLinksView: document.getElementById('socialLinksView'),
    proofSubmissionView: document.getElementById('proofSubmissionView')
};

// --- Constants & Variables ---
const QATestQuestions = [
  { q: "What is the policy on misleading product links?", a: "accurate" },
  { q: "What should you do if an order is cancelled?", a: "contact support" },
];
let userWalletBalance = 0;


// ----------------------------------------------------------------------
// 2. AUTHENTICATION & CORE FLOW
// ----------------------------------------------------------------------

document.getElementById('signUpBtn').addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Initialize user data, including wallet
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email, role: "user", sellerStatus: "none", wallet: 0, createdAt: serverTimestamp()
        });
        alert("Signup successful! Please proceed to fill out the Seller form.");
    } catch (error) {
        alert("Signup Failed: " + error.message);
    }
});

document.getElementById('signInBtn').addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert("Login Failed: " + error.message);
    }
});

loginBtn.addEventListener('click', () => { if (auth.currentUser) signOut(auth); else renderStage('login'); });
profileIcon.addEventListener('click', () => { if (auth.currentUser) alert(`Logged in as: ${auth.currentUser.email}`); });

function hideAllStages() {
    [loginForm, document.getElementById('sellerForm'), document.getElementById('statusView'), document.getElementById('qaTestView'), sellerDashboard].forEach(el => el.classList.add('hidden'));
    dashboardFooter.classList.add('hidden');
}

function renderStage(stage, userData = {}) {
    hideAllStages();
    
    if (stage === 'login') loginForm.classList.remove('hidden');
    else if (stage === 'seller_form') document.getElementById('sellerForm').classList.remove('hidden');
    else if (stage === 'pending_approval') { document.getElementById('statusView').classList.remove('hidden'); statusMessage.className = 'status pending'; statusMessage.textContent = 'Status: Pending Admin Approval. Please wait.'; }
    else if (stage === 'qa_test') { document.getElementById('qaTestView').classList.remove('hidden'); setupQATest(); }
    else if (stage === 'rejected') { document.getElementById('statusView').classList.remove('hidden'); statusMessage.className = 'status rejected'; statusMessage.textContent = `Status: Rejected. Reason: ${userData.rejectionReason || 'Please contact support.'}`; }
    
    else if (stage === 'approved') {
        sellerDashboard.classList.remove('hidden');
        dashboardFooter.classList.remove('hidden');
        changeDashboardView('taskManagementView');
        loadDataForApprovedUser(); 
    } 
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginBtn.classList.add('hidden'); profileIcon.classList.remove('hidden'); profileIcon.textContent = user.email[0].toUpperCase();
        walletDisplay.classList.remove('hidden');

        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.data();

        if(userData) {
            userWalletBalance = userData.wallet || 0;
            walletDisplay.textContent = `Wallet: ${userWalletBalance.toFixed(2)} COINS`;
        }

        if (userData && userData.sellerStatus) {
            const status = userData.sellerStatus;
            renderStage(status === 'none' ? 'seller_form' : 
                        status === 'pending' ? 'pending_approval' : 
                        status === 'qa_pending' ? 'qa_test' : 
                        status === 'approved' ? 'approved' : 
                        'seller_form', userData);
        } else {
            renderStage('seller_form');
        }
    } else {
        loginBtn.classList.remove('hidden'); profileIcon.classList.add('hidden');
        walletDisplay.classList.add('hidden');
        renderStage('login');
    }
});

// --- Seller Form Submission Logic ---
document.getElementById('submitSellerBtn').addEventListener('click', async () => { 
    const user = auth.currentUser;
    if (!user) return alert("Please login first.");
    
    const payload = {
        fullName: document.getElementById('s_fullName').value.trim(),
        cnic: document.getElementById('s_cnic').value.trim(),
        address: document.getElementById('s_address').value.trim(),
        country: document.getElementById('s_country').value.trim(),
        fatherName: document.getElementById('s_fatherName').value.trim(),
        familyDetails: document.getElementById('s_familyDetails').value.trim(),
        state: document.getElementById('s_state').value.trim(),
        district: document.getElementById('s_district').value.trim(),
        postalCode: document.getElementById('s_postalCode').value.trim(),
    };

    if (!payload.fullName || !payload.cnic || !payload.address) {
        return alert("Error: Please fill in all required address and name fields.");
    }
    
    try {
        await addDoc(collection(db, "sellerApplications"), {...payload, userId: user.uid, email: user.email, status: 'pending', submittedAt: serverTimestamp()});
        await updateDoc(doc(db, "users", user.uid), { sellerStatus: 'pending' });
        alert("Application submitted successfully. Waiting for Admin review.");
        renderStage('pending_approval');
    } catch (e) { console.error("Error submitting application:", e); alert("Failed to submit application."); }
});

// --- Q&A Logic ---
function setupQATest() {
    document.getElementById('questionsList').innerHTML = QATestQuestions.map((item, index) => 
        `<div><label style="margin-top:15px;">Q${index + 1}: ${item.q}</label><input type="text" id="ans_${index}" placeholder="Your answer"></div>`
    ).join('');
}
document.getElementById('submitQaBtn').addEventListener('click', async () => { 
    const user = auth.currentUser;
    let score = 0;
    QATestQuestions.forEach((item, index) => {
        const userAnswer = document.getElementById(`ans_${index}`).value.trim().toLowerCase();
        if (userAnswer.includes(item.a)) score++;
    });

    const requiredScore = Math.ceil(QATestQuestions.length * 0.7);
    const passed = score >= requiredScore;
    const qaResult = document.getElementById('qaResult');

    if (passed) {
        qaResult.className = 'status approved';
        qaResult.textContent = `Test Passed! Score: ${score}/${QATestQuestions.length}.`;
        await updateDoc(doc(db, "users", user.uid), { sellerStatus: 'approved', qaScore: score, approvedAt: serverTimestamp() });
        setTimeout(() => renderStage('approved'), 1500);
    } else {
        qaResult.className = 'status rejected';
        qaResult.textContent = `Test Failed. Score: ${score}/${QATestQuestions.length}.`;
    }
    qaResult.classList.remove('hidden');
});

// ----------------------------------------------------------------------
// 3. DASHBOARD NAVIGATION & DATA MANAGEMENT
// ----------------------------------------------------------------------

function changeDashboardView(viewId) {
    Object.keys(views).forEach(key => views[key].classList.add('hidden'));
    views[viewId].classList.remove('hidden');

    document.querySelectorAll('.footer-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === viewId) {
            btn.classList.add('active');
        }
    });
    document.getElementById('dashboardTitle').textContent = viewId.replace('View', ' ').replace(/([A-Z])/g, ' $1').trim();
}

dashboardFooter.addEventListener('click', (e) => {
    if (e.target.classList.contains('footer-btn')) {
        changeDashboardView(e.target.getAttribute('data-view'));
    }
});

function loadDataForApprovedUser() {
    const user = auth.currentUser;
    if (!user) return;
    
    listenToCollection('sellerTasks', user.uid, renderTasks); 
    listenToCollection('sellerProducts', user.uid, renderProducts);
    listenToCollection('sellerSocialLinks', user.uid, renderSocialLinks);
    listenToCollection('sellerProofs', user.uid, renderProofSubmissions);
}

function listenToCollection(collectionName, userId, renderer) {
    const q = query(collection(db, collectionName), where("userId", "==", userId));
    onSnapshot(q, (snapshot) => {
        const dataArray = [];
        snapshot.forEach(doc => { dataArray.push({ id: doc.id, ...doc.data() }); });
        renderer(dataArray);
    });
}

// --- RENDERERS ---
function renderTasks(tasks) {
    taskListDiv.innerHTML = tasks.map(t => `
        <div>
            <span><strong>${t.taskType}</strong> | Qty: ${t.quantity} | Coin: ${t.coins.toFixed(2)}</span>
            <div class="item-actions">
                <button class="action-btn btn-link" onclick="window.open('${t.link}', '_blank')">Link</button>
                <button class="action-btn btn-edit" data-id="${t.id}" data-type="task">Edit</button>
                <button class="action-btn btn-delete" data-id="${t.id}" data-type="task">Delete</button>
            </div>
        </div>
    `).join('') || '<p class="sub">No active tasks added yet.</p>';
}

function renderProducts(products) {
    productListDiv.innerHTML = products.map(p => `
        <div>
            <span><strong>${p.title}</strong> (${p.price}) | Reward: ${p.coins.toFixed(2)} COINS</span>
            <div class="item-actions">
                <button class="action-btn btn-link" onclick="window.open('${p.link}', '_blank')">View Link</button>
                <button class="action-btn btn-delete" data-id="${p.id}" data-type="product">Delete</button>
            </div>
        </div>
    `).join('') || '<p class="sub">No products added yet.</p>';
}

function renderSocialLinks(links) {
    socialLinkListDiv.innerHTML = links.map(l => `
        <div>
            <span>${l.platform}: <a href="${l.url}" target="_blank" style="color:#30c7ff;">Link</a></span>
            <div class="item-actions">
                <button class="action-btn btn-delete" data-id="${l.id}" data-type="social">Delete</button>
            </div>
        </div>
    `).join('') || '<p class="sub">No social links added yet.</p>';
}

function renderProofSubmissions(proofs) {
    proofListDiv.innerHTML = proofs.map(p => `
        <div>
            <span>${p.description.substring(0, 30)}...</span>
            <div class="item-actions">
                <a href="${p.proofLink}" target="_blank" class="action-btn btn-link">Proof</a>
            </div>
        </div>
    `).join('') || '<p class="sub">No proofs submitted today.</p>';
}

// --- EDIT / DELETE MASTER LISTENER ---
document.getElementById('mainContainer').addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    const type = target.dataset.type;

    if (target.classList.contains('btn-delete')) {
        let collectionName = type === 'task' ? 'sellerTasks' : type === 'product' ? 'sellerProducts' : type === 'social' ? 'sellerSocialLinks' : null;
        if (collectionName && confirm(`Are you sure you want to delete this ${type} item?`)) {
            try { await deleteDoc(doc(db, collectionName, id)); alert("Deleted."); } catch (error) { alert("Failed to delete item."); }
        }
    }
    
    if (target.classList.contains('btn-edit') && type === 'task') {
        const taskSnap = await getDoc(doc(db, 'sellerTasks', id));
        if (!taskSnap.exists()) return alert("Task not found.");
        const data = taskSnap.data();
        
        // Populate Form
        document.getElementById('taskType').value = data.taskType;
        document.getElementById('taskLink').value = data.link;
        document.getElementById('taskQty').value = data.quantity;
        document.getElementById('taskCoins').value = data.coins;
        
        taskIdToEdit.value = id; 
        taskFormTitle.textContent = "Editing Existing Task";
        addTaskBtn.textContent = "Update Task";
        addTaskBtn.style.background = '#2563eb';
        changeDashboardView('taskManagementView');
        views.taskManagementView.scrollIntoView({ behavior: 'smooth' });
    }
});

// ----------------------------------------------------------------------
// 4. SUBMISSION LOGIC
// ----------------------------------------------------------------------

// Add/Update Task Logic
addTaskBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    const id = taskIdToEdit.value;
    
    const taskPayload = {
        taskType: document.getElementById('taskType').value,
        link: document.getElementById('taskLink').value.trim(),
        quantity: parseInt(document.getElementById('taskQty').value) || 0,
        coins: parseFloat(document.getElementById('taskCoins').value) || 0,
        userId: user.uid,
        status: 'active',
    };

    if (!taskPayload.link || taskPayload.quantity <= 0 || taskPayload.coins <= 0) {
        return alert("Please provide valid Link, Quantity, and Coins.");
    }

    try {
        if (id) {
            await updateDoc(doc(db, "sellerTasks", id), taskPayload);
            alert("Task updated successfully!");
        } else {
            await addDoc(collection(db, "sellerTasks"), { ...taskPayload, createdAt: serverTimestamp() });
            alert("Task added successfully!");
        }
        // Reset form state
        document.getElementById('taskLink').value = '';
        document.getElementById('taskQty').value = '';
        document.getElementById('taskCoins').value = '';
        taskIdToEdit.value = '';
        taskFormTitle.textContent = "1. Add New Social/Digital Task";
        addTaskBtn.textContent = "Add Task";
        addTaskBtn.style.background = '#10b981';

    } catch (e) { console.error(e); alert("Failed to save/update task."); }
});

// Add/Update Product Listing Logic
document.getElementById('addProductBtn').addEventListener('click', async () => {
  const user = auth.currentUser;
  const productData = {
    userId: user.uid,
    title: document.getElementById('p_title').value.trim(),
    price: document.getElementById('p_price').value.trim(),
    link: document.getElementById('p_link').value.trim(),
    coins: parseFloat(document.getElementById('p_coins').value) || 0, 
    imageLink: document.getElementById('p_imageLink').value.trim(),
    description: document.getElementById('p_desc').value.trim(),
    createdAt: serverTimestamp()
  };

  if (!productData.title || !productData.price || !productData.link || productData.coins <= 0) {
      return alert("Product Title, Price, Link, and Coins (must be > 0) are required.");
  }

  try {
    await addDoc(collection(db, "sellerProducts"), productData);
    alert(`Product Listing added successfully: ${productData.title}`);
    // Clear fields
    document.getElementById('p_title').value = '';
    document.getElementById('p_price').value = '';
    document.getElementById('p_link').value = '';
    document.getElementById('p_coins').value = '';
    document.getElementById('p_imageLink').value = '';
    document.getElementById('p_desc').value = '';
  } catch (e) { console.error(e); alert("Failed to add product listing."); }
});

// Add Social Link
document.getElementById('addSocialLinkBtn').addEventListener('click', async () => {
    const user = auth.currentUser;
    const platform = document.getElementById('socialPlatform').value;
    const url = document.getElementById('socialUrl').value.trim();
    if (!url) return alert("Please provide a valid URL.");
    try {
        await addDoc(collection(db, "sellerSocialLinks"), { userId: user.uid, platform: platform, url: url, createdAt: serverTimestamp() });
        alert(`Social link for ${platform} saved.`);
        document.getElementById('socialUrl').value = '';
    } catch(e) { console.error(e); alert("Failed to save social link."); }
});

// Submit Daily Proof
document.getElementById('submitProofBtn').addEventListener('click', async () => {
    const user = auth.currentUser;
    const description = document.getElementById('proofDescription').value.trim();
    const proofLink = document.getElementById('proofLink').value.trim();
    
    if (!description || !proofLink) return alert("Description and Proof Link are mandatory.");

    try {
        await addDoc(collection(db, "sellerProofs"), { userId: user.uid, description: description, proofLink: proofLink, status: 'pending_review', submittedAt: serverTimestamp() });
        alert("Daily Proof submitted successfully to Admin.");
        document.getElementById('proofDescription').value = '';
        document.getElementById('proofLink').value = '';
    } catch(e) { console.error(e); alert("Failed to submit proof."); }
});
