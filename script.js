
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, setDoc, addDoc, getDoc, getCountFromServer, Timestamp, query, where, deleteDoc, writeBatch, orderBy, limit, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4",
    authDomain: "traffic-exchange-62a58.firebaseapp.com",
    projectId: "traffic-exchange-62a58",
    storageBucket: "traffic-exchange-62a58.appspot.com",
    messagingSenderId: "474999317287",
    appId: "1:474999317287:web:8e28a2f5f1a959d8ce3f02",
    measurementId: "G-HJQ46RQNZS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

// --- Global Constants and Configuration ---
const adminEmail = "mn1691316@gmail.com";
const whatsappNumber = "+923495144924";
const MIN_WITHDRAWAL_AMOUNT = 1200;
const TASK_EARNING_AMOUNT = 0.01;
const TASK_LINK_COOLDOWN_MS = 1 * 60 * 1000; // 5 minutes cooldown
const REFERRAL_COMMISSION_RATE = 0.05; // 5%
const DEFAULT_MIN_CLICKS_BEFORE_COOLDOWN = 1; // Default minimum clicks before cooldown activates
const WEB_CATEGORY_MIN_CLICKS_BEFORE_COOLDOWN = 50; // Minimum clicks for 'Web' category before cooldown activates


const CATEGORY_EARNINGS = {
    "YouTube": 0.01, "Instagram": 0.01, "Facebook": 0.01, "TikTok": 0.10,
    "App": 0.50, "Web": 0.05, "Channel": 0.05, "Products": 10,
};

const PLATFORM_PRICES = {
    "YouTube Task": 2300, "Instagram Task": 1500, "Facebook Task": 1900,
    "TikTok Task": 600, "Web Task": 350, "For You": 7000
};
const CATEGORIES = ["YouTube", "TikTok", "Instagram", "Facebook", "App", "Products", "Channel", "Web"];
CATEGORIES.forEach(cat => {
    if (PLATFORM_PRICES[cat] === undefined) PLATFORM_PRICES[cat] = 500;
});
const MAX_USER_LINKS = 80;

// --- DOM Elements ---
const nav = document.querySelector("nav");
const adminPanelBtn = document.getElementById("adminPanelBtn");
const adminPanelSection = document.getElementById("adminPanel");
const authSection = document.getElementById("authSection");
const signupNameInput = document.getElementById("signupName");
const signupEmailInput = document.getElementById("signupEmail");
const signupPasswordInput = document.getElementById("signupPassword");
const signupReferralCodeInput = document.getElementById("signupReferralCode");
const signupBtn = document.getElementById("signupBtn");
const loginEmailInput = document.getElementById("loginEmail");
const loginPasswordInput = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const refLinkInput = document.getElementById("refLink");
const depositForm = document.getElementById("depositForm");
const transactionIdInput = document.getElementById("transactionId");
const depositAmountInput = document.getElementById("depositAmount");
const depositListContainer = document.getElementById("depositList");
const adminAddForm = document.getElementById("adminAddForm");
const adminItemTypeSelect = document.getElementById("adminItemType");
const adminCategorySelect = document.getElementById("adminCategory");
const adminDescriptionInput = document.getElementById("adminDescription");
const adminBaseUrlInput = document.getElementById("adminBaseUrl");
const adminRewardInput = document.getElementById("adminReward");
const adminTasksContainer = document.getElementById("adminTasksContainer");
const adminLinksContainer = document.getElementById("adminLinksContainer");
const modal = document.getElementById("detailsModal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const closeBtn = modal.querySelector(".modal-close-btn");
const privacyBtn = document.getElementById("privacyBtn");
const termsBtn = document.getElementById("termsBtn");
const aboutBtn = document.getElementById("aboutBtn");
const taskDetailsBtn = document.getElementById("taskDetailsBtn");
const withdrawalProfileBtn = document.getElementById("withdrawalProfileBtn");
const contactEmailLink = document.getElementById("contactEmailLink");
const contactWhatsappLink = document.getElementById("contactWhatsappLink");
const userProfilePic = document.getElementById("userProfilePic");
const userNameDisplay = document.getElementById("userName");
const userEmailDisplay = document.getElementById("userEmail");
const userRefDisplay = document.getElementById("userRef");
const walletBalanceDisplay = document.getElementById("walletBalance");
const walletBalanceProfileDisplay = document.getElementById("walletBalanceProfile");
const totalReferralsCountDisplay = document.getElementById("totalReferralsCount");
const totalReferralEarningsDisplay = document.getElementById("totalReferralEarnings");
const totalUsersDisplay = document.getElementById("totalUsers");
const totalTasksDisplay = document.getElementById("totalTasks");
const totalWithdrawalsDisplay = document.getElementById("totalWithdrawals");
const totalEarningsDisplay = document.getElementById("totalEarnings");
const dynamicLinkInputsContainer = document.getElementById("dynamicLinkInputs");
const addUserLinkForm = document.getElementById("addUserLinkForm");
const userLinkUrlInput = document.getElementById("userLinkUrl");
const userLinkDescriptionInput = document.getElementById("userLinkDescription");
const userLinksContainer = document.getElementById("userLinksContainer");
const forYouTasksContainer = document.getElementById("forYouTasksContainer");
const taskCategoryFilters = document.getElementById("taskCategoryFilters");
const priceSelectionModal = document.getElementById("priceSelectionModal");
const priceOptionsContainer = document.getElementById("priceOptionsContainer");
const confirmPriceSelectionBtn = document.getElementById("confirmPriceSelectionBtn");
const priceSelectionModalCloseBtn = priceSelectionModal.querySelector(".modal-close-btn");
const publicLinksContainer = document.getElementById("publicLinksContainer"); // NEW

// New elements for location
const useMyLocationBtn = document.getElementById("useMyLocationBtn");
const userLocationInput = document.getElementById("userLocationInput");

// --- Elements for Agent Section ---
const agentFormSection = document.getElementById("agentFormSection");
const agentNameInput = document.getElementById("agentName");
const agentFatherNameInput = document.getElementById("agentFatherName");
const showAgentFormBtn = document.getElementById("showAgentFormBtn");
const familyMembersInputWrapper = document.getElementById("familyMembersInputWrapper"); // Corrected ID
const addFamilyMemberBtn = document.getElementById("addFamilyMemberBtn");
const agentIdCardInput = document.getElementById("agentIdCard");
const agentWhatsAppInput = document.getElementById("agentWhatsApp");

// --- Elements for Add Balance Feature ---
const addBalanceForm = document.getElementById("addBalanceForm");
const recipientEmailInput = document.getElementById("recipientEmail");
const transferAmountInput = document.getElementById("transferAmount");
const addBalanceMessage = document.getElementById("addBalanceMessage");
const balanceAdditionHistoryContainer = document.getElementById("balanceAdditionHistory");

// --- Define allowed amounts for the "Add Balance" feature ---
const ALLOWED_ADD_BALANCE_AMOUNTS = [100, 200, 350, 500, 600, 800, 1000, 1100, 1300, 1500, 1800, 2000, 2200, 2500, 8000];

// --- Elements for Send Balance Feature ---
const sendBalanceForm = document.getElementById("sendBalanceForm");
const recipientSendEmailInput = document.getElementById("recipientSendEmail");
const sendAmountInput = document.getElementById("sendAmount");
const sendBalanceMessage = document.getElementById("sendBalanceMessage");
const sendBalanceHistoryContainer = document.getElementById("sendBalanceHistory");
// --- END NEW ---

// --- Elements for Anusement Admin Management ---
const anusementTitleInput = document.getElementById("anusementTitle");
const anusementDescriptionInput = document.getElementById("anusementDescription");
const anusementURLInput = document.getElementById("anusementURL");
const addAnusementBtn = document.getElementById("addAnusementBtn");
const anusementListContainer = document.getElementById("anusementList");


let editingAnusementId = null; // State to track if we are editing anusement content
let currentLinkToAdd = null;

// --- Helper Functions ---
function updateYouTubeVideoDisplay(videoDocs) {
    const videoContainer = document.getElementById("videoPlayerContainer");
    const videoSection = document.getElementById("youtubeVideoSection");
    if (!videoContainer || !videoSection) return;
    videoContainer.innerHTML = '';
    if (videoDocs && videoDocs.length > 0) {
        videoDocs.forEach(videoDoc => {
            const videoData = videoDoc.data();
            const videoUrl = videoData.url;
            if (videoUrl) {
                let videoId = '';
                if (videoUrl.includes("youtu.be/")) videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
                else if (videoUrl.includes("youtube.com/watch?v=")) videoId = videoUrl.split("v=")[1].split("&")[0];
                else if (videoUrl.includes("youtube.com/embed/")) videoId = videoUrl.split("/embed/")[1].split("?")[0];
                if (videoId) {
                    const videoItemDiv = document.createElement('div');
                    videoItemDiv.classList.add('video-item');
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${videoId}`;
                    iframe.frameBorder = "0";
                    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                    iframe.allowFullscreen = true;
                    videoItemDiv.appendChild(iframe);
                    videoContainer.appendChild(videoItemDiv);
                }
            }
        });
        videoSection.style.display = "block";
    } else {
        videoSection.style.display = "none";
    }
}

function clearAllCountdowns() {
    document.querySelectorAll('button[data-interval-id]').forEach(btn => {
        if (btn.dataset.intervalId) {
            clearInterval(parseInt(btn.dataset.intervalId));
            btn.dataset.intervalId = '';
        }
    });
}

// MODIFIED: updateButtonState to incorporate category-specific click thresholds
function updateButtonState(button, itemId, itemType, taskCategory) {
    const rewardAmount = parseFloat(button.dataset.reward);
    
    // Clear any existing interval to prevent multiple timers running for the same button
    if (button.dataset.intervalId) {
        clearInterval(parseInt(button.dataset.intervalId));
        button.dataset.intervalId = '';
    }

    // Determine the minimum clicks before cooldown based on category
    let currentMinClicksBeforeCooldown = DEFAULT_MIN_CLICKS_BEFORE_COOLDOWN;
    if (taskCategory === "Web") {
        currentMinClicksBeforeCooldown = WEB_CATEGORY_MIN_CLICKS_BEFORE_COOLDOWN;
    }

    // Check click count first
    const itemClicksKey = `${itemType}_${itemId}_clicks`;
    const currentClicks = parseInt(localStorage.getItem(itemClicksKey) || '0');

    if (currentClicks < currentMinClicksBeforeCooldown) {
        button.disabled = false;
        button.innerText = `Open & Earn ₹${rewardAmount.toFixed(2)} (Clicks: ${currentClicks}/${currentMinClicksBeforeCooldown})`; // Show click progress
        return;
    }

    // If minimum clicks threshold is met, apply the cooldown logic
    const lastOpenedKey = `${itemType}_${itemId}`;
    const lastOpenedTimestamp = localStorage.getItem(lastOpenedKey);
    
    if (!lastOpenedTimestamp) {
        button.disabled = false;
        button.innerText = `Open & Earn ₹${rewardAmount.toFixed(2)}`;
        return;
    }

    const lastOpened = parseInt(lastOpenedTimestamp);
    const timeElapsed = new Date().getTime() - lastOpened;

    if (timeElapsed < TASK_LINK_COOLDOWN_MS) {
        button.disabled = true;
        const countdownInterval = setInterval(() => {
            const newTimeElapsed = new Date().getTime() - lastOpened;
            if (newTimeElapsed >= TASK_LINK_COOLDOWN_MS) {
                clearInterval(countdownInterval);
                button.disabled = false;
                button.innerText = `Open & Earn ₹${rewardAmount.toFixed(2)}`;
                localStorage.removeItem(lastOpenedKey);
                // Reset clicks for this task after cooldown
                localStorage.setItem(itemClicksKey, '0'); // Reset clicks after cooldown
                button.dataset.intervalId = '';
            } else {
                const timeLeftMs = TASK_LINK_COOLDOWN_MS - newTimeElapsed;
                const minutes = Math.floor(timeLeftMs / 60000);
                const seconds = Math.floor((timeLeftMs % 60000) / 1000).toString().padStart(2, '0');
                button.innerText = `Wait ${minutes}:${seconds}`;
            }
        }, 1000);
        button.dataset.intervalId = countdownInterval;
    } else {
        button.disabled = false;
        button.innerText = `Open & Earn ₹${rewardAmount.toFixed(2)}`;
        localStorage.removeItem(lastOpenedKey);
        // Reset clicks for this task after cooldown
        localStorage.setItem(itemClicksKey, '0'); // Reset clicks after cooldown
    }
}

function showSection(id) {
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    const sectionToShow = document.getElementById(id);
    if (sectionToShow) sectionToShow.classList.add('active');
}

function showToast(message) { alert(message); }

function openLinkSafely(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        showToast("Invalid URL provided.");
        return false;
    }
    try {
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
            newWindow.focus();
            return true;
        } else {
            showToast("Pop-up blocked. Please allow pop-ups for this site or click the link directly.");
            createAndClickAnchor(url);
            return false;
        }
    } catch (e) {
        console.error("Error using window.open:", e);
        showToast("Could not open link directly. Trying an alternative method.");
        createAndClickAnchor(url);
        return false;
    }
}

function createAndClickAnchor(url) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateReferralCode(uid) {
    const prefix = uid.substring(0, 4).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${suffix}`;
}

function getCategoryFromDescription(description) {
    const lowerCaseDesc = description.toLowerCase();
    const CATEGORY_KEYWORDS = {
        "YouTube": ["youtube", "ytview", "ytlike", "ytshare", "ytcomment", "ytsaved"],
        "TikTok": ["tiktok", "ttview", "ttlike", "ttcomment", "ttshare"],
        "Instagram": ["instagram", "igview", "iglike", "igfollow", "igcomment"],
        "Facebook": ["facebook", "fbview", "fblike", "fbshare", "fbcomment"],
        "App": ["app"], "Products": ["products", "product"], "Channel": ["channel", "subscribe"],
        "Web": ["web", "website", "visit", "click"]
    };
    for (const mainCategory in CATEGORY_KEYWORDS) {
        if (CATEGORY_KEYWORDS[mainCategory].some(keyword => lowerCaseDesc.includes(keyword))) {
            return mainCategory;
        }
    }
    return "Web"; // Default category
}

function filterTasks() {
    const activeMainBtn = document.querySelector("#taskCategoryFilters button.active");
    const mainCategory = activeMainBtn ? activeMainBtn.dataset.filter : 'all';
    const taskBoxes = document.querySelectorAll("#tasksContainer .taskBox");
    taskBoxes.forEach(box => {
        const taskMainCategory = box.dataset.category;
        const matchesMain = (mainCategory === 'all') || (taskMainCategory === mainCategory);
        
        if (matchesMain) {
            box.style.display = 'block';
        } else {
            box.style.display = 'none';
        }
    });
}

// Function to get user's current location
function useCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const locationString = `${latitude}, ${longitude}`;
                userLocationInput.value = locationString; // Update hidden input
                console.log("Location obtained:", locationString);
                showToast("Your current location has been recorded.");
            },
            (error) => {
                console.error("Error getting location:", error);
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        showToast("User denied the request for Geolocation. Please allow location access to use this feature.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        showToast("Location information is unavailable.");
                        break;
                    case error.TIMEOUT:
                        showToast("The request to get user location timed out.");
                        break;
                    case error.UNKNOWN_ERROR:
                        showToast("An unknown error occurred while getting location.");
                        break;
                }
                userLocationInput.value = ""; // Clear input if error occurs
            }
        );
    } else {
        showToast("Geolocation is not supported by this browser.");
        userLocationInput.value = ""; // Clear input if not supported
    }
}


// --- Authentication and UI State Management ---
onAuthStateChanged(auth, async user => {
    clearAllCountdowns();
    if (user) {
        authSection.style.display = "none";
        nav.style.display = "flex";
        showSection('tasks'); // Default view changed to 'tasks'
        if (user.email === adminEmail) {
            adminPanelBtn.style.display = "block";
            loadAdminDataIfAdmin(user);
            showSection('adminPanel'); // Default to admin dashboard if admin
        } else {
            adminPanelBtn.style.display = "none";
            if (adminPanelSection.classList.contains('active')) {
                showSection('tasks'); // If admin panel was active, switch to tasks
            }
        }
        loadUserData(user);
        loadUserDepositHistory(user.uid);
        loadUserAddedLinks(user.uid);
        loadPublicLinks();
        loadForYouContent(user.uid);
        loadBalanceAdditionHistory(user.uid); // Load history for the current user
        loadSendBalanceHistory(user.uid); // Load send balance history
        
        // Fetch and display user's own withdrawal history with status
        const withdrawalsCol = collection(db, "withdrawals");
        onSnapshot(query(withdrawalsCol, where("userId", "==", user.uid), orderBy("timestamp", "desc")), snap => {
            const container = document.getElementById("withdrawList");
            container.innerHTML = "";
            if (snap.empty) {
                container.innerHTML = "<p>No withdrawal history yet.</p>";
                return;
            }
            snap.forEach(doc => {
                const w = doc.data();
                const withdrawDiv = document.createElement("div");
                withdrawDiv.classList.add("withdrawBox");
                const statusClass = 'status-' + w.status.toLowerCase().replace(/\s+/g, '-');
                let requestDate = 'N/A';
                if (w.timestamp && typeof w.timestamp.toDate === 'function') {
                    requestDate = w.timestamp.toDate().toLocaleString();
                } else if (w.timestamp) {
                    requestDate = new Date(w.timestamp).toLocaleString();
                }
                // Display withdrawal history with status
                withdrawDiv.innerHTML = `<p><strong>Method:</strong> ${w.method}</p><p><strong>Account:</strong> ${w.accountNumber}</p><p><strong>Amount:</strong> ₹${w.amount.toFixed(2)}</p><p><strong>Status:</strong> <span class="${statusClass}">${w.status}</span></p><p><small>Requested: ${requestDate}</small></p>`;
                container.appendChild(withdrawDiv);
            });
        });
    } else { // User is not logged in
        authSection.style.display = "block";
        nav.style.display = "none";
        showSection('authSection'); // Show login/signup section
        adminPanelBtn.style.display = "none";
        // Clear all user-specific data
        userNameDisplay.innerText = ""; userEmailDisplay.innerText = ""; userRefDisplay.innerText = "";
        walletBalanceDisplay.innerText = "0.00"; walletBalanceProfileDisplay.innerText = "0.00";
        totalReferralsCountDisplay.innerText = "0"; refLinkInput.value = "";
        if (totalReferralEarningsDisplay) totalReferralEarningsDisplay.innerText = "0.00";
        userProfilePic.innerText = "?"; userProfilePic.style.backgroundImage = 'none'; userProfilePic.style.backgroundColor = '#333';
        totalUsersDisplay.innerText = "0"; totalTasksDisplay.innerText = "0";
        totalWithdrawalsDisplay.innerText = "0"; totalEarningsDisplay.innerText = "₹0.00";
        document.getElementById("withdrawList").innerHTML = "";
        depositListContainer.innerHTML = "";
        userLinksContainer.innerHTML = "";
        publicLinksContainer.innerHTML = "";
        forYouTasksContainer.innerHTML = "";
        document.getElementById("tasksContainer").innerHTML = "";
        balanceAdditionHistoryContainer.innerHTML = "";
        sendBalanceHistoryContainer.innerHTML = "";
    }
});

// --- Event Listeners for Authentication ---
signupBtn.addEventListener("click", async () => {
    const name = signupNameInput.value.trim();
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value.trim();
    const referralCode = signupReferralCodeInput.value.trim();
    const locationData = userLocationInput.value; // Get location data

    // Agent-related inputs
    const agentName = agentNameInput ? agentNameInput.value.trim() : '';
    const agentFatherName = agentFatherNameInput ? agentFatherNameInput.value.trim() : '';
    const agentIdCard = agentIdCardInput ? agentIdCardInput.value.trim() : '';
    const agentWhatsApp = agentWhatsAppInput ? agentWhatsAppInput.value.trim() : '';
    const familyMembers = [];
    const familyMemberInputGroups = document.querySelectorAll('#familyMembersInputWrapper .family-member-input-group');
    familyMemberInputGroups.forEach((group, index) => {
        const nameInput = group.querySelector('input[placeholder*="Name"]');
        const relationInput = group.querySelector('input[placeholder*="Relation"]');
        if (nameInput && relationInput && nameInput.value.trim() && relationInput.value.trim()) {
            familyMembers.push({ name: nameInput.value.trim(), relation: relationInput.value.trim() });
        }
    });

    if (!name || !email || !password) { showToast("Please fill in all required fields."); return; }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        
        let referrerDoc = null;
        let referredByUserId = null;
        if (referralCode) {
            const usersCol = collection(db, "users");
            const q = query(usersCol, where("referralCode", "==", referralCode));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                referrerDoc = querySnapshot.docs[0];
                referredByUserId = referrerDoc.id;
                showToast(`Welcome! You were referred by ${referrerDoc.data().name}.`);
            } else {
                showToast("Referral code not found. You will not be credited for a referral.");
            }
        }

        const newUserRefCode = generateReferralCode(user.uid);
        const newUserDocData = {
            name: name,
            email: email,
            wallet: 0,
            referralCode: newUserRefCode,
            referredBy: referredByUserId,
            createdAt: Timestamp.now(),
            referralCount: 0,
            userLinkCount: 0,
            totalReferralEarnings: 0,
            location: locationData ? { raw: locationData, geo: { latitude: parseFloat(locationData.split(',')[0]), longitude: parseFloat(locationData.split(',')[1]) } } : null,
            agentName: agentName || null,
            agentFatherName: agentFatherName || null,
            agentIdCard: agentIdCard || null,
            agentWhatsApp: agentWhatsApp || null,
            familyMembers: familyMembers.length > 0 ? familyMembers : null
        };
        
        await setDoc(doc(db, "users", user.uid), newUserDocData);
        
        if (referrerDoc) {
            const batch = writeBatch(db);
            const referrerRef = doc(db, "users", referrerDoc.id);
            const currentReferralCount = referrerDoc.data().referralCount || 0;
            batch.update(referrerRef, { referralCount: currentReferralCount + 1 });
            await batch.commit();
        }
        
        showToast("Sign up successful! Please log in.");
        signupNameInput.value = ''; signupEmailInput.value = ''; signupPasswordInput.value = ''; signupReferralCodeInput.value = '';
        if(agentNameInput) agentNameInput.value = '';
        if(agentFatherNameInput) agentFatherNameInput.value = '';
        if(agentIdCardInput) agentIdCardInput.value = '';
        if(agentWhatsAppInput) agentWhatsAppInput.value = '';
        if (agentFormSection) agentFormSection.style.display = 'none';
        userLocationInput.value = '';
        useMyLocationBtn.innerText = "Use My Current Location";
    } catch (error) {
        console.error("Sign up error:", error);
        showToast(`Sign up failed: ${error.message}`);
    }
});

// Event listener for the Agent Registration button
if (showAgentFormBtn) {
    showAgentFormBtn.addEventListener('click', () => {
        const agentForm = document.getElementById('agentFormSection');
        if (agentForm) {
            agentForm.style.display = agentForm.style.display === 'none' ? 'block' : 'none';
        }
    });
}

// Event listener for adding family members
if (addFamilyMemberBtn) {
    addFamilyMemberBtn.addEventListener('click', () => {
        const familyMembersDiv = document.getElementById('familyMembersInputWrapper');
        if (familyMembersDiv) {
            const memberCount = familyMembersDiv.querySelectorAll('.family-member-input-group').length + 1;
            const newGroup = document.createElement('div');
            newGroup.classList.add('family-member-input-group');
            newGroup.innerHTML = `
                <input type="text" placeholder="Family Member ${memberCount} Name"><br>
                <input type="text" placeholder="Family Member ${memberCount} Relation"><br>
            `;
            familyMembersDiv.appendChild(newGroup);
        }
    });
}

loginBtn.addEventListener("click", async () => {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if (!email || !password) { showToast("Please enter your email and password."); return; }
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("Login successful!");
    } catch (error) {
        console.error("Login error:", error); showToast(`Login failed: ${error.message}`);
    }
});

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        showToast("Logged out successfully.");
    } catch (error) {
        console.error("Logout error:", error); showToast(`Logout failed: ${error.message}`);
    }
});

// Event listener for the new location button
if (useMyLocationBtn) {
    useMyLocationBtn.addEventListener("click", useCurrentLocation);
}

// --- User Data Loading and Real-time Updates ---
function loadUserData(user) {
    const usersCol = collection(db, "users");
    const userRef = doc(db, "users", user.uid);
    const tasksCol = collection(db, "tasks");
    const youtubeVideosCol = collection(db, "youtubeVideos");
    const latestVideosQuery = query(youtubeVideosCol, orderBy("addedAt", "desc"), limit(30));
    onSnapshot(latestVideosQuery, (snapshot) => {
        updateYouTubeVideoDisplay(snapshot.docs);
    }, (error) => {
        console.error("Error fetching YouTube videos:", error);
        updateYouTubeVideoDisplay([]);
    });
    onSnapshot(userRef, async snap => {
        if (snap.exists()) {
            const data = snap.data();
            userNameDisplay.innerText = data.name || user.displayName || "N/A";
            userEmailDisplay.innerText = data.email || user.email;
            const referralCode = data.referralCode || generateReferralCode(user.uid);
            userRefDisplay.innerText = referralCode;
            refLinkInput.value = `${window.location.origin}${window.location.pathname}?ref=${referralCode}`;
            walletBalanceDisplay.innerText = (data.wallet || 0).toFixed(2);
            walletBalanceProfileDisplay.innerText = (data.wallet || 0).toFixed(2);
            totalReferralEarningsDisplay.innerText = (data.totalReferralEarnings || 0).toFixed(2);
            if (data.profilePicUrl) {
                userProfilePic.innerHTML = '';
                userProfilePic.style.backgroundImage = `url(${data.profilePicUrl})`;
                userProfilePic.style.backgroundSize = 'cover'; userProfilePic.style.backgroundPosition = 'center';
                userProfilePic.style.color = 'transparent';
            } else if (data.name) {
                const initials = data.name.trim().split(' ').map(word => word[0]).join('').toUpperCase();
                userProfilePic.innerText = initials;
                userProfilePic.style.backgroundImage = 'none';
                const colors = ['#1abc9c', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c'];
                userProfilePic.style.backgroundColor = colors[initials.charCodeAt(0) % colors.length];
            } else {
                userProfilePic.innerText = '?'; userProfilePic.style.backgroundColor = '#333';
                userProfilePic.style.backgroundImage = 'none';
            }
            const referralQuery = query(usersCol, where("referredBy", "==", user.uid));
            getCountFromServer(referralQuery).then(querySnapshot => {
                totalReferralsCountDisplay.innerText = querySnapshot.data().count;
            }).catch(error => console.error("Error getting referral count: ", error));
        } else {
            const referralCode = generateReferralCode(user.uid);
            await setDoc(userRef, {
                name: user.displayName || "New User", email: user.email, wallet: 0, referralCode: referralCode,
                referredBy: null, createdAt: Timestamp.now(), referralCount: 0, userLinkCount: 0,
                earningsHistory: {}, totalReferralEarnings: 0, location: null
            });
            showToast("Your profile data was initialized.");
            loadUserData(user);
        }
    });
    const tasksColRef = collection(db, "tasks");
    onSnapshot(tasksColRef, snap => {
        const container = document.getElementById("tasksContainer");
        container.innerHTML = "";
        snap.forEach(taskDoc => {
            const t = taskDoc.data();
            const taskId = taskDoc.id;
            const taskCategory = getCategoryFromDescription(t.description);
            const reward = t.reward || CATEGORY_EARNINGS[taskCategory] || TASK_EARNING_AMOUNT;

            const taskDiv = document.createElement("div");
            taskDiv.classList.add("taskBox");
            taskDiv.dataset.category = taskCategory;
            
            taskDiv.innerHTML = `
                <p>${t.description}</p>
                <div class="task-warning">
                    <strong>لازمی انتباہ:</strong> اگر ٹاسک ہدایات کے مطابق مکمل نہیں کیا گیا تو آپ کا وتھڈراول مسترد کر دیا جائے گا۔<br>
                    <strong>Warning:</strong> If the task isn't completed correctly, your withdrawal will be rejected.
                </div>
                <button class="submitBtn" data-reward="${reward.toFixed(2)}" data-task-id="${taskId}">Open & Earn ₹${reward.toFixed(2)}</button>
            `;
            
            const button = taskDiv.querySelector("button");
            updateButtonState(button, taskId, 'task', taskCategory); // Initial state with click count
            
            button.addEventListener("click", async () => {
                const currentUserId = auth.currentUser.uid;
                if (!currentUserId) { showToast("Please log in to complete tasks."); return; }

                const itemClicksKey = `task_${taskId}_clicks`;
                let currentClicks = parseInt(localStorage.getItem(itemClicksKey) || '0');
                
                let effectiveMinClicks = DEFAULT_MIN_CLICKS_BEFORE_COOLDOWN;
                if (taskCategory === "Web") {
                    effectiveMinClicks = WEB_CATEGORY_MIN_CLICKS_BEFORE_COOLDOWN;
                }

                currentClicks++;
                localStorage.setItem(itemClicksKey, currentClicks.toString());

                updateButtonState(button, taskId, 'task', taskCategory);

                if (currentClicks < effectiveMinClicks) {
                    const linkOpened = openLinkSafely(t.url);
                    if (linkOpened) {
                        try {
                            await addEarning(currentUserId, taskCategory, reward);
                            showToast(`You earned ₹${reward.toFixed(2)} from ${taskCategory}! (Clicks: ${currentClicks}/${effectiveMinClicks})`);
                        } catch (error) {
                            console.error("An unexpected error occurred during task completion:", error);
                            showToast(`An error occurred: ${error.message}. Please try again.`);
                        }
                    } else {
                        showToast("Could not open the task link. Please ensure the URL is valid.");
                    }
                } else {
                    const lastOpenedKey = `task_${taskId}`;
                    const lastOpenedTimestamp = localStorage.getItem(lastOpenedKey);
                    const lastOpened = lastOpenedTimestamp ? parseInt(lastOpenedTimestamp) : 0;
                    const timeElapsed = new Date().getTime() - lastOpened;

                    if (timeElapsed < TASK_LINK_COOLDOWN_MS) {
                        showToast("Please wait for the cooldown period to finish.");
                        return;
                    }
                    
                    const linkOpened = openLinkSafely(t.url);
                    if (linkOpened || !document.getElementById('popup-blocker-message')) {
                        localStorage.setItem(lastOpenedKey, new Date().getTime().toString());
                        try {
                            await addEarning(currentUserId, taskCategory, reward);
                            showToast(`You earned ₹${reward.toFixed(2)} from ${taskCategory}! Cooldown activated.`);
                        } catch (error) {
                            console.error("An unexpected error occurred during task completion:", error);
                            showToast(`An error occurred: ${error.message}. Please try again.`);
                        }
                    } else {
                        showToast("Could not open the task link. Please ensure the URL is valid.");
                    }
                }
            });
            container.appendChild(taskDiv);
        });
        filterTasks();
    });
    onSnapshot(usersCol, snap => { totalUsersDisplay.innerText = snap.size; });
    onSnapshot(tasksCol, snap => { totalTasksDisplay.innerText = snap.size; });
    onSnapshot(collection(db, "withdrawals"), snap => {
        totalWithdrawalsDisplay.innerText = snap.size;
        let totalApprovedWithdrawals = 0;
        snap.forEach(doc => {
            if (doc.data().status === "Approved") {
                totalApprovedWithdrawals += parseFloat(doc.data().amount || 0);
            }
        });
        totalEarningsDisplay.innerText = "₹" + totalApprovedWithdrawals.toFixed(2);
    });
}

// --- Deposit History Loading ---
function loadUserDepositHistory(userId) {
    const depositsCol = collection(db, "deposits");
    onSnapshot(query(depositsCol, where("userId", "==", userId), orderBy("timestamp", "desc")), snap => {
        depositListContainer.innerHTML = "";
        if (snap.empty) {
            depositListContainer.innerHTML = "<p>No deposit history yet.</p>";
            return;
        }
        snap.forEach(doc => {
            const d = doc.data();
            const depositDiv = document.createElement("div");
            depositDiv.classList.add("withdrawBox");
            const statusClass = 'status-' + d.status.toLowerCase().replace(/\s+/g, '-');
            let requestDate = 'N/A';
            if (d.timestamp && typeof d.timestamp.toDate === 'function') {
                requestDate = d.timestamp.toDate().toLocaleString();
            } else if (d.timestamp) {
                requestDate = new Date(d.timestamp).toLocaleString();
            }
            depositDiv.innerHTML = `<p><strong>Tx ID:</strong> ${d.transactionId}</p><p><strong>Amount:</strong> ₹${d.amount.toFixed(2)}</p><p><strong>Status:</strong> <span class="${statusClass}">${d.status}</span></p><p><small>Submitted: ${requestDate}</small></p>`;
            depositListContainer.appendChild(depositDiv);
        });
    });
}

// --- Public Links Loading (UPDATED with OPEN BUTTON) ---
function loadPublicLinks() {
    const user = auth.currentUser;
    if (!user) {
        publicLinksContainer.innerHTML = "<p>Please log in to see public links.</p>";
        return;
    }
    const userAddedLinksCol = collection(db, "userAddedLinks");
    const q = query(userAddedLinksCol, orderBy("addedAt", "desc"));
    onSnapshot(q, snap => {
        publicLinksContainer.innerHTML = "";
        if (snap.empty) {
            publicLinksContainer.innerHTML = "<p>No public links have been added yet.</p>";
            return;
        }
        snap.forEach(doc => {
            const linkData = doc.data();
            const linkId = doc.id;
            const linkDiv = document.createElement("div");
            linkDiv.classList.add("userLinkBox");
            let buttonsHTML = '';
            // Check if the current user is the owner of the link
            if (linkData.addedByUserId === user.uid) {
                buttonsHTML = `
                    <div class="edit-delete-buttons">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </div>
                `;
            }
            linkDiv.innerHTML = `
                <p><strong>${linkData.description}</strong></p>
                <button class="submitBtn" style="margin-bottom: 10px; padding: 8px 20px; font-size: 14px;">Follow to Follow </button>
                <small>Category: ${linkData.category || 'N/A'}</small><br>
                <small>Added: ${linkData.addedAt ? linkData.addedAt.toDate().toLocaleDateString() : 'N/A'}</small>
                ${buttonsHTML}
            `;
            
            const openBtn = linkDiv.querySelector('button:not(.edit-btn):not(.delete-btn)');
            openBtn.addEventListener('click', () => openLinkSafely(linkData.url));

            // Add event listeners ONLY if buttons were rendered for the owner
            if (linkData.addedByUserId === user.uid) {
                linkDiv.querySelector('.edit-btn').addEventListener('click', () => editUserLink(linkId, linkData));
                linkDiv.querySelector('.delete-btn').addEventListener('click', () => deleteUserLink(linkId));
            }
            publicLinksContainer.appendChild(linkDiv);
        });
    });
}

// --- User Added Links Functions (for "My Links" section) ---
function loadUserAddedLinks(userId) {
    const userAddedLinksCol = collection(db, "userAddedLinks");
    const q = query(userAddedLinksCol, where("addedByUserId", "==", userId), orderBy("addedAt", "desc"));
    onSnapshot(q, snap => {
        userLinksContainer.innerHTML = "";
        if (snap.empty) {
            userLinksContainer.innerHTML = "<p>You haven't added any links yet.</p>";
            return;
        }
        snap.forEach(doc => {
            const linkData = doc.data();
            const linkId = doc.id;
            const linkDiv = document.createElement("div");
            linkDiv.classList.add("userLinkBox");
            linkDiv.innerHTML = `<p><strong>${linkData.description}</strong></p><p><a href="${linkData.url}" target="_blank" style="color: #0ff; text-decoration: none;">${linkData.url}</a></p><small>Category: ${linkData.category || 'N/A'}</small><br><small>Added: ${linkData.addedAt ? linkData.addedAt.toDate().toLocaleDateString() : 'N/A'}</small><br><div class="edit-delete-buttons"><button class="edit-btn">Edit</button><button class="delete-btn">Delete</button></div>`;
            linkDiv.querySelector('.edit-btn').addEventListener('click', () => editUserLink(linkId, linkData));
            linkDiv.querySelector('.delete-btn').addEventListener('click', () => deleteUserLink(linkId));
            userLinksContainer.appendChild(linkDiv);
        });
    });
}

async function editUserLink(linkId, currentData) {
    const newUrl = prompt("Edit Link URL:", currentData.url);
    if (newUrl === null) return;
    const newDescription = prompt("Edit Link Description:", currentData.description);
    if (newDescription === null) return;
    if (!newUrl.trim() || !newDescription.trim()) {
        showToast("URL and description cannot be empty."); return;
    }
    if (!newUrl.startsWith('http')) {
        showToast("Please enter a valid URL starting with http or https."); return;
    }
    try {
        await setDoc(doc(db, "userAddedLinks", linkId), {
            ...currentData, url: newUrl.trim(), description: newDescription.trim(),
            updatedAt: Timestamp.now()
        }, { merge: true });
        showToast("Link updated successfully!");
    } catch (error) {
        console.error("Error updating link:", error);
        showToast("Failed to update link. Please try again.");
    }
}

async function deleteUserLink(linkId) {
    if (!confirm("Are you sure you want to delete this link? This action cannot be undone.")) return;
    try {
        await deleteDoc(doc(db, "userAddedLinks", linkId));
        showToast("Link deleted successfully!");
    } catch (error) {
        console.error("Error deleting link:", error);
        showToast("Failed to delete link. Please try again.");
    }
}

// --- "For You" Page Logic ---
async function loadForYouContent(userId) {
    forYouTasksContainer.innerHTML = "";
    const tasksCol = collection(db, "tasks");
    const linksCol = collection(db, "links");
    let itemsToDisplay = [];

    const tasksSnapshot = await getDocs(tasksCol);
    tasksSnapshot.forEach(doc => {
        const item = doc.data();
        const description = item.description ? item.description.toLowerCase() : "";
        // MODIFIED LOGIC FOR TASKS
        if (description.includes("for you") && !description.includes("umar") && !description.includes("nazim")) {
            itemsToDisplay.push({ ...item, id: doc.id, type: 'task' });
        }
    });

    const linksSnapshot = await getDocs(linksCol);
    linksSnapshot.forEach(doc => {
        const item = doc.data();
        const description = item.description ? item.description.toLowerCase() : "";
        // MODIFIED LOGIC FOR LINKS
        if (description.includes("for you") && !description.includes("umar") && !description.includes("nazim")) {
            itemsToDisplay.push({ ...item, id: doc.id, type: 'link' });
        }
    });

    if (itemsToDisplay.length === 0) {
        forYouTasksContainer.innerHTML = "<p>No specific tasks or links matching your criteria are available right now.</p>";
        return;
    }

    itemsToDisplay.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("taskBox");
        itemDiv.innerHTML = `<p>${item.description}</p><button class="submitBtn">Visit</button>`;
        const button = itemDiv.querySelector("button");
        button.addEventListener("click", async () => {
            const urlToOpen = (item.type === 'task' && item.url) ? item.url :
                (item.type === 'link' && item.urls && item.urls.length > 0) ? item.urls[0] : null;
            if (!urlToOpen) { showToast("Invalid URL for this item."); return; }
            openLinkSafely(urlToOpen);
        });
        forYouTasksContainer.appendChild(itemDiv);
    });
}

// --- Event Listeners for Forms and Buttons ---
addUserLinkForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { showToast("Please log in to add links."); return; }
    const url = userLinkUrlInput.value.trim();
    const description = userLinkDescriptionInput.value.trim();
    if (!url || !description) {
        showToast("Please enter both URL and description."); return;
    }
    if (!url.startsWith('http')) {
        showToast("Please enter a valid URL starting with http or https."); return;
    }
    currentLinkToAdd = { url, description };
    populatePriceSelectionModal();
    priceSelectionModal.style.display = "flex";
});

function populatePriceSelectionModal() {
    priceOptionsContainer.innerHTML = '';
    const sortedCategories = Object.keys(PLATFORM_PRICES).sort((a, b) => PLATFORM_PRICES[a] - PLATFORM_PRICES[b]);
    sortedCategories.forEach(category => {
        const price = PLATFORM_PRICES[category];
        const priceOptionDiv = document.createElement('div');
        priceOptionDiv.classList.add('price-option');
        priceOptionDiv.dataset.category = category;
        priceOptionDiv.dataset.price = price;
        priceOptionDiv.innerHTML = `<p>${category}</p><span>₹${price}</span>`;
        priceOptionDiv.addEventListener('click', () => selectPriceOption(priceOptionDiv));
        priceOptionsContainer.appendChild(priceOptionDiv);
    });
}

function selectPriceOption(selectedDiv) {
    priceOptionsContainer.querySelectorAll('.price-option').forEach(div => {
        div.style.backgroundColor = '#222';
        div.style.transform = 'translateY(0)';
        div.style.borderColor = '#333';
    });
    selectedDiv.style.backgroundColor = '#333';
    selectedDiv.style.borderColor = '#0ff';
    confirmPriceSelectionBtn.dataset.selectedPrice = selectedDiv.dataset.price;
    confirmPriceSelectionBtn.dataset.selectedCategory = selectedDiv.dataset.category;
    confirmPriceSelectionBtn.disabled = false;
}

confirmPriceSelectionBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user || !currentLinkToAdd) {
        showToast("Error: User not logged in or link details missing.");
        priceSelectionModal.style.display = "none"; return;
    }
    const selectedPrice = parseInt(confirmPriceSelectionBtn.dataset.selectedPrice);
    const selectedCategory = confirmPriceSelectionBtn.dataset.selectedCategory;
    if (isNaN(selectedPrice) || !selectedCategory) {
        showToast("Please select a valid category."); return;
    }
    const userRef = doc(db, "users", user.uid);
    let userDocSnap;
    try {
        userDocSnap = await getDoc(userRef);
    } catch (error) {
        console.error("Error fetching user document for adding link:", error);
        showToast("Failed to retrieve your account data. Please try again."); return;
    }
    if (!userDocSnap.exists()) {
        showToast("User profile not found. Please contact support."); return;
    }
    const userData = userDocSnap.data();
    const currentUserLinkCount = userData.userLinkCount || 0;
    if (currentUserLinkCount >= MAX_USER_LINKS) {
        showToast(`You have reached the maximum limit of ${MAX_USER_LINKS} added links.`);
        priceSelectionModal.style.display = "none"; return;
    }
    if ((userData.wallet || 0) < selectedPrice) {
        showToast(`Insufficient balance. You need at least ₹${selectedPrice} for ${selectedCategory}.`);
        priceSelectionModal.style.display = "none"; return;
    }
    try {
        const batch = writeBatch(db);
        batch.update(userRef, { wallet: (userData.wallet || 0) - selectedPrice });
        batch.update(userRef, { userLinkCount: currentUserLinkCount + 1 });
        const userAddedLinksCol = collection(db, "userAddedLinks");
        const newLinkRef = doc(userAddedLinksCol);
        batch.set(newLinkRef, {
            addedByUserId: user.uid, url: currentLinkToAdd.url, description: currentLinkToAdd.description,
            category: selectedCategory, addedAt: Timestamp.now(), status: "Active"
        });
        await batch.commit();
        showToast(`Link added to ${selectedCategory} successfully! ₹${selectedPrice} deducted from your wallet.`);
        addUserLinkForm.reset();
        priceSelectionModal.style.display = "none";
        currentLinkToAdd = null;
        confirmPriceSelectionBtn.disabled = true;
        confirmPriceSelectionBtn.dataset.selectedPrice = '';
        confirmPriceSelectionBtn.dataset.selectedCategory = '';
        priceOptionsContainer.querySelectorAll('.price-option').forEach(div => {
            div.style.backgroundColor = '#222'; div.style.borderColor = '#333';
        });
    } catch (error) {
        console.error("Error adding user link:", error);
        showToast("Failed to add link. Please try again.");
        priceSelectionModal.style.display = "none";
    }
});

document.getElementById("withdrawForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { showToast("Please log in to request withdrawal."); return; }

    // --- Withdrawal Date Check ---
    const today = new Date();
    const dayOfMonth = today.getDate();
    const allowedDays = [19, 20, 21, 22, 28, 29, 30, 31];

    if (!allowedDays.includes(dayOfMonth)) {
        showToast("Withdrawal requests can only be submitted on the 19th-22nd and 28th-31st of each month. Please check the current date.");
        return;
    }
    // --- End Withdrawal Date Check ---

    const method = document.getElementById("withdrawMethod").value;
    const accountNumber = document.getElementById("withdrawAccount").value.trim();
    const amount = parseFloat(document.getElementById("withdrawAmount").value);
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
        showToast(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}.`); return;
    }
    if (!accountNumber) {
        showToast("Please enter your account details."); return;
    }
    const userRef = doc(db, "users", user.uid);
    let userDocSnap;
    try {
        userDocSnap = await getDoc(userRef);
    } catch (error) {
        console.error("Error fetching user document for withdrawal:", error);
        showToast("Failed to retrieve your account balance. Please try again."); return;
    }
    if (!userDocSnap.exists()) {
        showToast("User profile not found. Please contact support."); return;
    }
    const userData = userDocSnap.data();
    const currentWalletBalance = userData.wallet || 0;
    if (currentWalletBalance < amount) {
        showToast("Insufficient wallet balance for this withdrawal."); return;
    }
    try {
        const batch = writeBatch(db);
        batch.update(userRef, { wallet: currentWalletBalance - amount });
        const withdrawalRef = doc(collection(db, "withdrawals"));
        batch.set(withdrawalRef, {
            userId: user.uid, method: method, accountNumber: accountNumber, amount: amount,
            status: "Pending", // Set initial status to Pending
            timestamp: Timestamp.now()
        });
        await batch.commit();
        showToast("Withdrawal request submitted successfully and wallet balance deducted. It will be processed soon.");
        e.target.reset();
    } catch (error) {
        console.error("Error submitting withdrawal request or deducting balance:", error);
        showToast("Failed to submit withdrawal request or deduct balance. Please try again.");
    }
});

depositForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { showToast("Please log in to deposit funds."); return; }
    const txId = transactionIdInput.value.trim();
    const amount = parseFloat(depositAmountInput.value);
    if (!txId || isNaN(amount) || amount <= 0) {
        showToast("Please enter a valid transaction ID and deposit amount."); return;
    }
    try {
        await addDoc(collection(db, "deposits"), {
            userId: user.uid, userName: user.displayName || user.email, transactionId: txId,
            amount: amount, status: "Pending Verification", timestamp: Timestamp.now()
        });
        showToast("Deposit request submitted successfully. Please wait for verification.");
        depositForm.reset();
    } catch (error) {
        console.error("Error submitting deposit request:", error); showToast("Failed to submit deposit request. Please try again.");
    }
});

adminAddForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const itemType = adminItemTypeSelect.value;
    const mainUrl = adminBaseUrlInput.value.trim();
    if (itemType === "youtubeVideo") {
        if (!mainUrl || !mainUrl.startsWith("http")) {
            showToast("Please enter a valid YouTube URL."); return;
        }
        try {
            await addDoc(collection(db, "youtubeVideos"), { url: mainUrl, addedAt: Timestamp.now() });
            showToast(`YouTube Video added successfully!`);
            adminAddForm.reset();
        } catch (error) {
            console.error("Error adding YouTube video:", error);
            showToast(`Failed to add YouTube video. Please try again.`);
        }
        return;
    }
    const selectedCategory = adminCategorySelect.value;
    const description = adminDescriptionInput.value.trim();
    const reward = adminRewardInput.value ? parseFloat(adminRewardInput.value) : null;
    const linkInputs = adminAddForm.querySelectorAll('.dynamic-link-input input');
    const urls = Array.from(linkInputs).map(input => input.value.trim()).filter(url => url);
    if (!description) {
        showToast("Please provide a description for tasks/links."); return;
    }
    if (reward !== null && (isNaN(reward) || reward <= 0)) {
        showToast("If providing a reward, it must be a valid positive number."); return;
    }
    const categoryFromDesc = getCategoryFromDescription(description);
    const finalCategory = (categoryFromDesc !== "Web") ? categoryFromDesc : selectedCategory;
    let itemData = { description, category: finalCategory, createdAt: Timestamp.now() };
    if (reward) itemData.reward = reward;
    let collectionRef;
    if (itemType === "task") {
        if (!mainUrl || !mainUrl.startsWith("http")) {
            showToast("Please enter a valid URL for tasks."); return;
        }
        collectionRef = collection(db, "tasks");
        itemData.url = mainUrl;
    } else if (itemType === "link") {
        if (!urls || urls.length === 0) {
            showToast("Please enter at least one URL for links."); return;
        }
        collectionRef = collection(db, "links");
        itemData.urls = urls;
    } else {
        showToast("Invalid item type selected."); return;
    }
    try {
        await addDoc(collectionRef, itemData);
        showToast(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} added successfully!`);
        adminAddForm.reset();
        linkInputs.forEach(input => input.value = '');
    } catch (error) {
        console.error("Error adding item:", error); showToast(`Failed to add ${itemType}. Please try again.`);
    }
});

// --- Admin Specific Functions ---
function loadAdminDataIfAdmin(user) {
    if (user.email === adminEmail) {
        adminPanelBtn.style.display = "block";
        displayAdminItems(collection(db, "tasks"), adminTasksContainer, "tasks");
        displayAdminItems(collection(db, "links"), adminLinksContainer, "links");
        loadAdminAnusementData(); // Load anusement data for admin
    } else {
        adminPanelBtn.style.display = "none";
    }
}

async function displayAdminItems(collectionRef, container, itemType) {
    container.innerHTML = '';
    const q = query(collectionRef, orderBy("createdAt", "desc"), limit(1000));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
        const item = doc.data();
        const itemDiv = document.createElement("div");
        itemDiv.classList.add(itemType === "tasks" ? "taskBox" : "linkBox");
        itemDiv.style.maxWidth = "300px"; itemDiv.style.flexGrow = "0";
        let reward;
        if (itemType === "tasks") {
            const taskCategory = getCategoryFromDescription(item.description);
            reward = item.reward || CATEGORY_EARNINGS[taskCategory] || TASK_EARNING_AMOUNT;
        } else {
            reward = item.reward || TASK_EARNING_AMOUNT;
        }
        let displayContent = `<p><strong>${item.description}</strong></p><p>Reward: ₹${reward.toFixed(2)}</p><p>Category: <strong>${item.category || getCategoryFromDescription(item.description)}</strong></p><small>Created: ${item.createdAt ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}</small><br>`;
        if (itemType === "tasks") {
            displayContent += `<p>URL: <a href="${item.url}" target="_blank" style="color: #0ff; text-decoration: none;">${item.url}</a></p>`;
        } else if (itemType === "links" && item.urls && Array.isArray(item.urls)) {
            displayContent += `<p>Links:</p><ul>`;
            item.urls.forEach((url, index) => {
                displayContent += `<li><a href="${url}" target="_blank" style="color: #0ff; text-decoration: none;">Link ${index + 1}</a></li>`;
            });
            displayContent += `</ul>`;
        }
        itemDiv.innerHTML = displayContent;
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.style.cssText = "background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; margin-top: 10px;";
        deleteButton.onclick = async () => {
            if (confirm(`Are you sure you want to delete this ${itemType.slice(0, -1)}?`)) {
                try {
                    await deleteDoc(doc.ref);
                    showToast(`${itemType.slice(0, -1)} deleted successfully.`);
                    itemDiv.remove();
                } catch (error) {
                    console.error("Error deleting item:", error); showToast("Failed to delete item.");
                }
            }
        };
        itemDiv.appendChild(deleteButton);
        container.appendChild(itemDiv);
    });
}

// --- Modal Content Definitions ---
const modalContent = {
    privacy: {
        title: "Privacy Policy (رازداری کی پالیسی)",
        text: `
            <h3>1. Introduction (تعارف)</h3>
            <p>Welcome to Free Earnings App. We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy policy sets out how we will collect, use, process, and disclose your information across the platform. By using our service, you agree to the collection and use of information in accordance with this policy.</p>
            <p> Yeh policy batati hai ke hum aapki maloomat (information) kaise jama karte, istemal karte, aur mehfooz rakhte hain. Is app ko istemal karke, aap is Privacy Policy se ittefaq karte hain.</p>
            
            <h3>2. Information We Collect (معلومات جو ہم جمع کرتے ہیں)</h3>
            <p>We collect various types of information to provide and improve our Service to you.</p>
            <ul>
                <li><strong>Personal Identification Information:</strong> When you register, we collect your name, email address, and password. For withdrawals, we may collect your payment details such as Easypaisa/JazzCash number or bank account information. This information is essential for creating and managing your account and processing payments. We also collect your location if you choose to provide it.</li>
                <li><strong>Usage Data:</strong> We automatically collect information on how the Service is accessed and used. This may include your IP address, browser type, device type, pages visited, time spent on pages, and task completion data. This helps us understand user behavior and improve our platform.</li>
                <li><strong>Referral Information:</strong> If you were referred by another user, we store a connection to that user's account to manage referral commissions.</li>
            </ul>

            <h3>3. How We Use Your Information (آپ کی معلومات کا استعمال)</h3>
            <p>Your data is used for the following purposes:</p>
            <ul>
                <li><strong>To Provide and Maintain our Service:</strong> Your account details are used to log you in, display your balance, and manage your profile.</li>
                <li><strong>To Process Transactions:</strong> Your payment information is used exclusively for sending you your earnings.</li>
                <li><strong>To Communicate With You:</strong> We may use your email address to send you important updates, notifications about your account, or promotional information.</li>
                <li><strong>For Security and Fraud Prevention:</strong> We analyze usage data and location data (if provided) to detect and prevent fraudulent activities, such as the use of bots, VPNs, or multiple accounts, ensuring a fair platform for everyone.</li>
                <li><strong>To Improve Our Platform:</strong> By understanding how you use our app, we can identify areas for improvement and develop new features.</li>
            </ul>
            <p>Hum apni maloomat kisi teesre fareeq (third party) ko farokht nahi karte hain. Sirf payment process karne ke liye zaroori maloomat payment provider ke sath share ki jaati hai.</p>

            <h3>4. Data Security (ڈیٹا کی حفاظت)</h3>
            <p>The security of your data is a top priority. We use a variety of industry-standard security technologies and procedures to help protect your personal information from unauthorized access, use, or disclosure. All data is transmitted over secure channels (HTTPS), and sensitive information like passwords is encrypted. Location data, if provided, is stored securely. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.</p>
            
            <h3>5. Your Rights (آپ کے حقوق)</h3>
            <p>You have certain rights regarding your personal data. You have the right to access, update, or delete the information we have on you. You can update your profile information directly within your account settings. If you wish to delete your account, please contact our support.</p>
        `
    },
    terms: {
        title: "Terms of Service (سروس کی شرائط)",
        text: `
            <p>Please read these Terms of Service ("Terms") carefully before using the Free Earnings App ("Service"). Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.</p>
            
            <h3>1. Account Eligibility & Responsibilities (اکاؤنٹ کی اہلیت اور ذمہ داریاں)</h3>
            <ul>
                <li><strong>Eligibility:</strong> You must be at least 18 years old to use this service.</li>
                <li><strong>One Account Rule:</strong> Each user is strictly limited to one account per person, per household, and per IP address. Creating multiple accounts to abuse the system or referral program will result in the permanent ban of all associated accounts and forfeiture of all earnings.</li>
                <li><strong>Account Security:</strong> You are responsible for safeguarding the password that you use to access the Service and for any actions or actions under your password. We are not liable for any loss or damage arising from your failure to comply with this security obligation.</li>
                <li><strong>Location Data:</strong> If you choose to provide your location, it will be used for verification and security purposes to ensure fair play and prevent fraud. Providing accurate location data is part of your responsibility as a user.</li>
            </ul>

            <h3>2. Prohibited Conduct (ممنوعہ سرگرمیاں)</h3>
            <p>Engaging in any of the following activities is strictly prohibited and will lead to immediate account termination without any payment:</p>
            <ul>
                <li><strong>Automation:</strong> Using any bots, scripts, spiders, or any other automated means to complete tasks or interact with the platform.</li>
                <li><strong>Fraudulent Activity:</strong> Falsifying task completion, using VPNs or proxies to hide your location, or any other method to deceive the system. This includes providing false location data.</li>
                <li><strong>Multiple Accounts:</strong> As stated above, creating or using more than one account is strictly forbidden.</li>
                <li><strong>Exploiting Bugs:</strong> Abusing any vulnerability or bug in the system for personal gain.</li>
                <li><strong>Harassment:</strong> Abusing or harassing other users or the support staff.</li>
            </ul>
             <p><strong>Khulasa:</strong> Koi bhi gair qanooni, fraudulent, ya aisi sargarmi jis se system ko nuqsan ho, sakhti se mana hai. Is mein bots, scripts, VPN, ya multiple accounts ka istemal shamil hai. Aisa karne par aapka account foran block kar diya jayega aur aapki tamam earnings z-bat (forfeit) kar li jayengi.</p>

            <h3>3. Earnings, Withdrawals, and Payments (کمائی اور ادائیگی)</h3>
            <ul>
                <li><strong>Task Verification:</strong> All completed tasks are subject to verification. The decision of our verification team is final. Earnings will only be credited for tasks that are completed correctly and fully according to the provided instructions.</li>
                <li><strong>Payment Schedule:</strong> Withdrawals are processed during specific periods each month as mentioned in the withdrawal section. We reserve the right to change this schedule.</li>
                <li><strong>Minimum Withdrawal:</strong> A minimum balance is required to be eligible for a withdrawal. This amount is specified in the withdrawal section.</li>
                <li><strong>Forfeiture on Violation:</strong> If your account is terminated due to a breach of these Terms, you will lose all rights to any balance in your account.</li>
                <li><strong>Task Compliance is Mandatory:</strong> As stated in our withdrawal policy, failure to follow task instructions precisely will result in withdrawal rejection. This is a core condition of using our service.</li>
            </ul>

            <h3>4. Termination (اکاؤنٹ کی برطرفی)</h3>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>

            <h3>5. Limitation of Liability (ذمہ داری کی حد)</h3>
            <p>In no event shall Free Earnings App, nor its directors, employees, partners, or agents, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
        `
    },
    about: {
        title: "About Us (ہمارے بارے میں)",
        text: `
            <h3>Our Mission (ہمارا مقصد)</h3>
            <p>At Free Earnings App, our mission is to create a reliable and accessible bridge between individuals seeking supplementary income and businesses looking for genuine online engagement. In a rapidly evolving digital world, we aim to empower people from all walks of life by providing them with a simple, secure, and transparent platform to monetize their free time. We believe in the dignity of work and strive to offer legitimate micro-earning opportunities that are fair and rewarding. We aim to provide a secure platform where users can earn and securely manage their digital assets.</p>
            <p>Free Earnings App ka maqsad logon ko online extra income hasil karne ke liye ek aasan aur aitemad-mand (reliable) platform faraham karna hai. Hum is safar mein aapki madad karna chahte hain.</p>
            
            <h3>What We Do (ہم کیا کرتے ہیں؟)</h3>
            <p>We partner with businesses, marketers, and content creators who need to promote their products, services, and content online. We break down their requirements into simple, manageable digital tasks. Our users, from across the country, can then choose from a variety of these tasks, complete them according to clear instructions, and earn real money. Whether it's visiting a website, watching a video, engaging with a social media post, or testing an app, our platform provides a constant stream of opportunities. We are committed to ensuring that the earning process is transparent and that user data, including location (if shared), is handled responsibly.</p>
            
            <h3>Our Core Values (ہماری اقدار)</h3>
            <ul>
                <li><strong>Transparency (شفافیت):</strong> We believe in clear communication. All task rewards, withdrawal policies, and rules are clearly stated. There are no hidden fees or confusing terms. What you see is what you get.</li>
                <li><strong>Fairness (انصاف):</strong> We ensure that the rewards for tasks are fair and competitive. We have a robust verification system to ensure that every correctly completed task is rewarded, and we have strict anti-fraud measures to protect the integrity of the platform for our honest users.</li>
                <li><strong>Security (تحفظ):</strong> The security of your account and your data is paramount. We employ modern security practices to protect your information and ensure that your earnings are safe. This includes secure handling of any location data provided.</li>
                <li><strong>Empowerment (بااختیار بنانا):</strong> We are passionate about providing a tool that can help people achieve small financial goals, whether it's paying for a utility bill, saving up for something special, or simply having a bit of extra disposable income.</li>
            </ul>

            <h3>Our Vision for the Future (مستقبل کا وژن)</h3>
            <p>We are continuously working to enhance our platform, expand the variety of tasks available, and build a thriving community of earners. Our vision is to become the most trusted and user-friendly micro-tasking platform in the region, known for its reliability and commitment to its users.</p>
        `
    },
    taskDetails: {
        title: "Task Details & Earnings Guide (ٹاسک کی تفصیلات)",
        text: `
            <h3>The Golden Rules of Task Completion (ٹاسک مکمل کرنے کے سنہری اصول)</h3>
            <p>Your success on this platform depends entirely on your ability to follow instructions correctly. Cheating the system will only lead to termination. Follow these golden rules to ensure you get paid for your hard work.</p>
            <ol>
                <li><strong>Read Every Instruction Carefully (ہر ہدایت کو غور سے پڑھیں):</strong> Before starting a task, read the description from start to finish. Do not assume you know what to do. Every task is different. The description is your contract; fulfilling it is how you earn.</li>
                <li><strong>Respect Timers and Delays (ٹائمر کا احترام کریں):</strong> If a task says "Wait for 30 seconds," you must wait for the full 30 seconds. Our system has mechanisms to verify this. Closing the page early will invalidate the task, and you will not be paid.</li>
                <li><strong>Perform the EXACT Action Required (صرف مطلوبہ کام کریں):</strong> If the task is to "Like the video," then only liking it is required. If it says "Like and Comment," you must do both. Do not do less than what is asked.</li>
                <li><strong>No Cheating (دھوکہ دہی نہیں):</strong> Do not use VPNs, proxies, ad-blockers that interfere with tasks, or any kind of automation (bots/scripts). Our system is designed to detect such activities. Attempting to cheat is the fastest way to get your account permanently banned and lose all your earnings.</li>
                <li><strong>Honesty is Key (ایمانداری کلید ہے):</strong> If a task asks for a screenshot or proof, provide genuine proof. Fabricated proof will be caught during withdrawal review and will lead to rejection and a potential ban.</li>
            </ol>

            <h3>Understanding the Verification Process (تصدیق کا عمل)</h3>
            <p>After you complete a task, it goes through a verification process:</p>
            <ul>
                <li><strong>Automated Checks:</strong> Our system performs initial checks, such as verifying visit duration, clicks, or if an action was registered.</li>
                <li><strong>Manual Review:</strong> For some tasks, and especially during a withdrawal request, our team may manually review your task history to ensure compliance. This is where we check for patterns of abuse or failure to follow instructions.</li>
                <li><strong>Why Tasks Get Rejected:</strong> A task can be rejected if you:
                    <ul>
                        <li>Did not wait for the full duration.</li>
                        <li>Did not perform all the required actions (e.g., forgot to comment).</li>
                        <li>Used a VPN or other forbidden tools.</li>
                        <li>The link was not working, and you did not report it (if applicable).</li>
                    </ul>
                </li>
            </ul>
             <p><strong>یاد رکھیں:</strong> آپ کی کمائی کا انحصار آپ کی ایمانداری اور ہدایات پر عمل کرنے پر ہے۔</p>
        `
    },
    withdrawalProfile: {
        title: "Withdrawal Profile & Rules (پیسے نکالنے کے اصول)",
        text: `
            <h3>1. The Importance of Accuracy (درست معلومات کی اہمیت)</h3>
            <p>Your Withdrawal Profile is the most critical part of getting paid. Providing 100% accurate information is your responsibility. Any error in your payment details can lead to significant delays or even the permanent loss of your funds. Double-check every digit and every letter before submitting a withdrawal request.</p>
            <p>Withdrawal request karte waqt, Apna account number, account title (naam), aur mobile number bilkul sahi likhein. Ek choti si ghalti se aapki payment ghalat jagah ja sakti hai ya ruk sakti hai. Ghalat maloomat faraham karne ki soorat mein, hum payment ke nuqsan ke zimmedar nahi honge.</p>
            
            <h3>2. The Withdrawal Process Flow (پیسے نکالنے کا مکمل عمل)</h3>
            <p>When you request a withdrawal, it goes through several stages:</p>
            <ol>
                <li><strong>Request Submitted (درخواست جمع ہوگئی):</strong> You submit a request from the withdrawal page. The amount is deducted from your wallet and is now locked for processing.</li>
                <li><strong>Pending Review (جائزے کے لیے زیر التوا):</strong> Your request enters a queue. During this stage, our team has not yet started reviewing it.</li>
                <li><strong>In-Depth Review & Processing (تفصیلی جائزہ):</strong> This is the most important stage. Our team performs a rigorous audit of your account, which includes:
                    <ul>
                        <li><strong>Task Compliance Check:</strong> We manually and automatically review your recent task history. We check if you have followed all instructions, respected timers, and completed tasks honestly. <strong>This is the number one reason for rejection. Any evidence of cutting corners or violating task rules will result in immediate rejection.</strong></li>
                        <li><strong>Fraud Check:</strong> We check your account for any signs of prohibited activities, such as multiple accounts from the same IP, VPN usage, or bot-like activity. Location data may be used to verify consistent and legitimate usage patterns.</li>
                        <li><strong>Payment Detail Verification:</strong> We ensure your provided payment details are in the correct format.</li>
                    </ul>
                </li>
                <li><strong>Approved / Rejected (منظور / مسترد):</strong> Based on the review, your request is either approved or rejected.
                    <ul>
                        <li><strong>Approved:</strong> If approved, the funds are sent to your specified account. Please allow 24-72 business hours for the funds to reflect.</li>
                        <li><strong>Rejected:</strong> If rejected, the funds are returned to your app wallet (unless the rejection was due to severe fraud, in which case the account is banned). You will see the "Rejected" status in your history.</li>
                    </ul>
                </li>
            </ol>

            <h3>3. Common Reasons for Withdrawal Rejection (مسترد ہونے کی عام وجوہات)</h3>
            <ul>
                <li><strong>FAILURE TO FOLLOW TASK INSTRUCTIONS: This is the most common reason.</strong></li>
                <li>Providing incorrect payment details (wrong account number, name mismatch).</li>
                <li>Suspicion of using bots, VPNs, or multiple accounts.</li>
                <li>Not meeting the minimum withdrawal threshold.</li>
                <li>Requesting withdrawal before any mandatory holding period is over.</li>
            </ul>
            <p><strong>Final Decision:</strong> The decision made by our review team regarding any withdrawal request is final and not subject to appeal, especially in cases of clear violation of our terms and task rules.</p>
        `
    }
};

function openModal(type) {
    modalTitle.innerText = modalContent[type].title;
    modalText.innerHTML = modalContent[type].text;
    modal.style.display = "block";
}

privacyBtn.onclick = () => openModal('privacy');
termsBtn.onclick = () => openModal('terms');
aboutBtn.onclick = () => openModal('about');
taskDetailsBtn.onclick = () => openModal('taskDetails');
withdrawalProfileBtn.onclick = () => openModal('withdrawalProfile');

contactEmailLink.addEventListener("click", () => {
    const userEmail = auth.currentUser ? auth.currentUser.email : 'N/A';
    const subject = "Inquiry from Free Earnings App User";
    const body = `Hello,\n\nMy Email: ${userEmail}\n\nMy Inquiry:\n`;
    window.location.href = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

contactWhatsappLink.addEventListener("click", () => {
    const userEmail = auth.currentUser ? auth.currentUser.email : 'N/A';
    const prefillText = `Asslam u Alikum, I'm contacting you from the Free Earnings App. My Email: ${userEmail}.`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(prefillText)}`, "_blank");
});

closeBtn.onclick = () => { modal.style.display = "none"; };
priceSelectionModalCloseBtn.onclick = () => {
    priceSelectionModal.style.display = "none";
    confirmPriceSelectionBtn.disabled = true;
    confirmPriceSelectionBtn.dataset.selectedPrice = '';
    confirmPriceSelectionBtn.dataset.selectedCategory = '';
    priceOptionsContainer.querySelectorAll('.price-option').forEach(div => {
        div.style.backgroundColor = '#222'; div.style.borderColor = '#333';
    });
};

window.onclick = (event) => {
    if (event.target == modal) modal.style.display = "none";
    if (event.target == priceSelectionModal) {
        priceSelectionModal.style.display = "none";
        confirmPriceSelectionBtn.disabled = true;
        confirmPriceSelectionBtn.dataset.selectedPrice = '';
        confirmPriceSelectionBtn.dataset.selectedCategory = '';
        priceOptionsContainer.querySelectorAll('.price-option').forEach(div => {
            div.style.backgroundColor = '#222'; div.style.borderColor = '#333';
        });
    }
};

document.querySelectorAll("nav button[data-section]").forEach(button => {
    button.addEventListener("click", () => {
        const sectionId = button.dataset.section;
        if (sectionId) {
            showSection(sectionId);
            if (sectionId === 'forYouPage' && auth.currentUser) {
                loadForYouContent(auth.currentUser.uid);
            }
            // --- NEW: Clear messages when switching sections ---
            if (sectionId === 'addBalanceSection') {
                if (addBalanceMessage) addBalanceMessage.textContent = "";
            }
            if (sectionId === 'sendBalanceSection') { // Clear message for send balance form
                if (sendBalanceMessage) sendBalanceMessage.textContent = "";
            }
            // --- Load Anusement Content when section is activated ---
            if (sectionId === 'anusement' && auth.currentUser) {
                loadAnusementContent();
            }
        }
    });
});

document.getElementById("taskCategoryFilters").addEventListener("click", (e) => {
    if (e.target.tagName === 'BUTTON') {
        document.querySelectorAll("#taskCategoryFilters button").forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        filterTasks();
    }
});

// --- Add Balance Feature Logic ---
if (addBalanceForm) {
  addBalanceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const senderUser = auth.currentUser;
    if (!senderUser) {
      showToast("Please log in to add balance.");
      return;
    }

    const recipientEmail = recipientEmailInput.value.trim().toLowerCase();
    const amountToAdd = parseFloat(transferAmountInput.value);

    // Basic input validation
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      addBalanceMessage.textContent = "Please enter a valid positive amount.";
      return;
    }
    if (!recipientEmail) {
      addBalanceMessage.textContent = "Please enter the recipient's email address.";
      return;
    }
    // Prevent sending to oneself
    if (recipientEmail === senderUser.email) {
        addBalanceMessage.textContent = "You cannot send balance to yourself.";
        return;
    }

    // NEW VALIDATION: Check if amountToAdd is in the allowed list
    if (!ALLOWED_ADD_BALANCE_AMOUNTS.includes(amountToAdd)) {
      addBalanceMessage.textContent = `Invalid amount. Please choose from: ${ALLOWED_ADD_BALANCE_AMOUNTS.join(', ')}.`;
      return;
    }

    addBalanceMessage.textContent = "Processing transaction...";

    try {
      const usersCol = collection(db, "users");
      const senderRef = doc(usersCol, senderUser.uid);
      const senderSnap = await getDoc(senderRef);

      if (!senderSnap.exists()) {
        addBalanceMessage.textContent = "Error: Your profile not found.";
        return;
      }

      const senderData = senderSnap.data();
      const senderBalance = senderData.wallet || 0;

      if (senderBalance < amountToAdd) {
        addBalanceMessage.textContent = "Error: Insufficient balance in your wallet.";
        return;
      }

      // Find recipient by email
      const recipientQuery = query(usersCol, where("email", "==", recipientEmail));
      const recipientSnapshot = await getDocs(recipientQuery);

      if (recipientSnapshot.empty) {
        addBalanceMessage.textContent = "Error: Recipient with this email not found.";
        return;
      }

      const recipientDoc = recipientSnapshot.docs[0];
      const recipientId = recipientDoc.id;
      const recipientData = recipientDoc.data();
      const recipientBalance = recipientData.wallet || 0;

      // Perform the atomic transaction using a batch write
      const batch = writeBatch(db);
      
      batch.update(senderRef, {
        wallet: senderBalance - amountToAdd
      });

      batch.update(doc(usersCol, recipientId), {
        wallet: recipientBalance + amountToAdd
      });

      // Record the transaction in a "balanceAdditions" subcollection under the recipient
      const balanceAdditionsRef = collection(db, "users", recipientId, "balanceAdditions");
      const newAdditionRef = doc(balanceAdditionsRef);
      batch.set(newAdditionRef, {
        addedBy: senderUser.uid,
        addedByEmail: senderUser.email,
        amount: amountToAdd,
        timestamp: Timestamp.now(),
        company: "Free Earnings App",
        recipientEmail: recipientEmail
      });

      await batch.commit(); // Commit the transaction

      addBalanceMessage.textContent = `Successfully added ₹${amountToAdd.toFixed(2)} to ${recipientEmail}'s wallet.`;
      addBalanceForm.reset();
      transferAmountInput.value = ""; // Clear amount specifically
      loadBalanceAdditionHistory(senderUser.uid); // Reload the history to show the new entry

    } catch (error) {
      console.error("Error adding balance:", error);
      addBalanceMessage.textContent = `Transaction failed: ${error.message}. Please try again.`;
    }
  });
}
// --- END Add Balance Feature Logic ---

// --- NEW FUNCTION: Load Balance Addition History ---
function loadBalanceAdditionHistory(userId) {
    const userRef = doc(db, "users", userId);
    const balanceAdditionsCol = collection(userRef, "balanceAdditions");
    
    onSnapshot(query(balanceAdditionsCol, orderBy("timestamp", "desc")), (snapshot) => {
        balanceAdditionHistoryContainer.innerHTML = ""; // Clear previous history
        if (snapshot.empty) {
            balanceAdditionHistoryContainer.innerHTML = "<p>No balance additions recorded yet.</p>";
            return;
        }
        snapshot.forEach(doc => {
            const addition = doc.data();
            const historyItemDiv = document.createElement("div");
            historyItemDiv.classList.add("withdrawBox"); // Reusing withdrawBox style for consistency
            
            let formattedTimestamp = 'N/A';
            if (addition.timestamp && typeof addition.timestamp.toDate === 'function') {
                formattedTimestamp = addition.timestamp.toDate().toLocaleString();
            } else if (addition.timestamp) {
                formattedTimestamp = new Date(addition.timestamp).toLocaleString();
            }

            historyItemDiv.innerHTML = `
                <p><strong>To Email:</strong> ${addition.recipientEmail || 'N/A'}</p>
                <p><strong>Amount:</strong> ₹${addition.amount.toFixed(2)}</p>
                <p><strong>Added By:</strong> ${addition.addedByEmail || 'N/A'}</p>
                <p><strong>Company:</strong> ${addition.company || 'N/A'}</p>
                <p><small>Time: ${formattedTimestamp}</small></p>
            `;
            balanceAdditionHistoryContainer.appendChild(historyItemDiv);
        });
    }, (error) => {
        console.error("Error loading balance addition history:", error);
        balanceAdditionHistoryContainer.innerHTML = "<p>Error loading history. Please try again.</p>";
    });
}
// --- END NEW FUNCTION ---


// --- NEW: Send Balance Feature Logic ---
if (sendBalanceForm) {
  sendBalanceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const senderUser = auth.currentUser;
    if (!senderUser) {
      showToast("Please log in to send balance.");
      return;
    }

    const recipientEmail = recipientSendEmailInput.value.trim().toLowerCase();
    const amountToSend = parseFloat(sendAmountInput.value);

    // Basic input validation
    if (isNaN(amountToSend) || amountToSend <= 0) {
      sendBalanceMessage.textContent = "Please enter a valid positive amount.";
      return;
    }
    if (!recipientEmail) {
      sendBalanceMessage.textContent = "Please enter the recipient's email address.";
      return;
    }
    // Prevent sending to oneself
    if (recipientEmail === senderUser.email) {
        sendBalanceMessage.textContent = "You cannot send balance to yourself.";
        return;
    }

    sendBalanceMessage.textContent = "Processing transaction...";

    try {
      const usersCol = collection(db, "users");
      const senderRef = doc(usersCol, senderUser.uid);
      const senderSnap = await getDoc(senderRef);

      if (!senderSnap.exists()) {
        sendBalanceMessage.textContent = "Error: Your profile not found.";
        return;
      }

      const senderData = senderSnap.data();
      const senderBalance = senderData.wallet || 0;

      if (senderBalance < amountToSend) {
        sendBalanceMessage.textContent = "Error: Insufficient balance in your wallet.";
        return;
      }

      // Find recipient by email
      const recipientQuery = query(usersCol, where("email", "==", recipientEmail));
      const recipientSnapshot = await getDocs(recipientQuery);

      if (recipientSnapshot.empty) {
        sendBalanceMessage.textContent = "Error: Recipient with this email not found.";
        return;
      }

      const recipientDoc = recipientSnapshot.docs[0];
      const recipientId = recipientDoc.id;
      const recipientData = recipientDoc.data();
      const recipientBalance = recipientData.wallet || 0;

      // Perform the atomic transaction using a batch write
      const batch = writeBatch(db);
      
      batch.update(senderRef, { wallet: senderBalance - amountToSend });
      batch.update(doc(usersCol, recipientId), { wallet: recipientBalance + amountToSend });

      // Record the transaction in a "transactions" collection
      const transactionsCol = collection(db, "transactions");
      const newTransactionRef = doc(transactionsCol);
      batch.set(newTransactionRef, {
        type: "send_balance", // Type of transaction: user sending to another user
        senderId: senderUser.uid,
        senderEmail: senderUser.email,
        recipientId: recipientId,
        recipientEmail: recipientEmail,
        amount: amountToSend,
        timestamp: Timestamp.now(),
        status: "completed"
      });

      await batch.commit(); // Commit the transaction

      sendBalanceMessage.textContent = `Successfully sent ₹${amountToSend.toFixed(2)} to ${recipientEmail}.`;
      sendBalanceForm.reset();
      sendAmountInput.value = ""; // Clear amount specifically
      loadSendBalanceHistory(senderUser.uid); // Load the send balance history

    } catch (error) {
      console.error("Error sending balance:", error);
      sendBalanceMessage.textContent = `Transaction failed: ${error.message}. Please try again.`;
    }
  });
}
// --- END Send Balance Feature Logic ---

// --- NEW FUNCTION: Load Send Balance History ---
function loadSendBalanceHistory(userId) {
    const transactionsCol = collection(db, "transactions");
    // Query for transactions where the current user is the sender OR recipient
    const sentQuery = query(transactionsCol, where("senderId", "==", userId), orderBy("timestamp", "desc"));
    const receivedQuery = query(transactionsCol, where("recipientId", "==", userId), orderBy("timestamp", "desc"));

    // Listener for sent transactions
    onSnapshot(sentQuery, (snapshot) => {
        const historyContainer = document.getElementById("sendBalanceHistory");
        if (!historyContainer) return; // Exit if container not found

        const existingSentItems = historyContainer.querySelectorAll(".sent-transaction");
        const existingSentIds = new Set(Array.from(existingSentItems).map(item => item.dataset.transactionId));
        
        snapshot.forEach(doc => {
            const transaction = doc.data();
            const transactionId = doc.id;
            if (!existingSentIds.has(transactionId)) {
                const historyItemDiv = document.createElement("div");
                historyItemDiv.classList.add("withdrawBox"); // Reusing withdrawBox style
                historyItemDiv.classList.add("sent-transaction"); // Add class for identification
                historyItemDiv.dataset.transactionId = transactionId;

                let formattedTimestamp = 'N/A';
                if (transaction.timestamp && typeof transaction.timestamp.toDate === 'function') {
                    formattedTimestamp = transaction.timestamp.toDate().toLocaleString();
                } else if (transaction.timestamp) {
                    formattedTimestamp = new Date(transaction.timestamp).toLocaleString();
                }

                historyItemDiv.innerHTML = `
                    <p><strong>To:</strong> ${transaction.recipientEmail || 'N/A'}</p>
                    <p><strong>Amount:</strong> -₹${transaction.amount.toFixed(2)}</p>
                    <p><strong>Type:</strong> ${transaction.type || 'N/A'}</p>
                    <p><small>Time: ${formattedTimestamp}</small></p>
                `;
                historyContainer.prepend(historyItemDiv); // Add new items at the top
            }
        });
    }, (error) => {
        console.error("Error loading sent balance history:", error);
    });

    // Listener for received transactions
    onSnapshot(receivedQuery, (snapshot) => {
        const historyContainer = document.getElementById("sendBalanceHistory");
        if (!historyContainer) return;

        const existingReceivedItems = historyContainer.querySelectorAll(".received-transaction");
        const existingReceivedIds = new Set(Array.from(existingReceivedItems).map(item => item.dataset.transactionId));

        snapshot.forEach(doc => {
            const transaction = doc.data();
            const transactionId = doc.id;
            if (!existingReceivedIds.has(transactionId)) {
                const historyItemDiv = document.createElement("div");
                historyItemDiv.classList.add("depositBox"); // Reusing depositBox style for received
                historyItemDiv.classList.add("received-transaction"); // Add class for identification
                historyItemDiv.dataset.transactionId = transactionId;

                let formattedTimestamp = 'N/A';
                if (transaction.timestamp && typeof transaction.timestamp.toDate === 'function') {
                    formattedTimestamp = transaction.timestamp.toDate().toLocaleString();
                } else if (transaction.timestamp) {
                    formattedTimestamp = new Date(transaction.timestamp).toLocaleString();
                }

                historyItemDiv.innerHTML = `
                    <p><strong>From:</strong> ${transaction.senderEmail || 'N/A'}</p>
                    <p><strong>Amount:</strong> +₹${transaction.amount.toFixed(2)}</p>
                    <p><strong>Type:</strong> ${transaction.type || 'N/A'}</p>
                    <p><small>Time: ${formattedTimestamp}</small></p>
                `;
                historyContainer.prepend(historyItemDiv); // Add new items at the top
            }
        });
    }, (error) => {
        console.error("Error loading received balance history:", error);
    });

    // Check if the container is empty after loading listeners, to show placeholder
    setTimeout(() => {
        if (historyContainer && historyContainer.innerHTML.trim() === "") {
            historyContainer.innerHTML = "<p>No balance transfers recorded yet.</p>";
        }
    }, 1500);
}
// --- END NEW FUNCTION ---


// --- EARNINGS MANAGEMENT FUNCTIONS (with Referral Logic) ---
async function addEarning(userId, category, amount) {
    if (!userId || !category || amount === undefined || isNaN(amount) || amount <= 0) {
        console.error("Invalid input for addEarning:", { userId, category, amount });
        showToast("Error adding earning: Invalid data provided.");
        return;
    }
    const userRef = doc(db, "users", userId);
    try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            console.error(`Earning update failed: User document ${userId} not found.`);
            showToast("Error: User profile not found. Please contact support.");
            return;
        }
        const userData = userSnap.data();
        const currentWallet = userData.wallet || 0;
        const currentEarningsHistory = userData.earningsHistory || {};
        currentEarningsHistory[category] = (currentEarningsHistory[category] || 0) + amount;
        
        const batch = writeBatch(db);
        batch.update(userRef, {
            wallet: currentWallet + amount,
            earningsHistory: currentEarningsHistory
        });

        // Referral Commission Logic
        if (userData.referredBy) {
            const referrerId = userData.referredBy;
            const referralCommission = amount * REFERRAL_COMMISSION_RATE;
            const referrerRef = doc(db, "users", referrerId);
            const referrerSnap = await getDoc(referrerRef);
            if (referrerSnap.exists()) {
                const referrerData = referrerSnap.data();
                const newReferrerWallet = (referrerData.wallet || 0) + referralCommission;
                const newTotalReferralEarnings = (referrerData.totalReferralEarnings || 0) + referralCommission;
                batch.update(referrerRef, {
                    wallet: newReferrerWallet,
                    totalReferralEarnings: newTotalReferralEarnings
                });
                console.log(`Referral commission of ₹${referralCommission.toFixed(4)} awarded to user ${referrerId}`);
            }
        }
        await batch.commit();
        console.log(`Earning added: User ${userId}, Category ${category}, Amount ${amount}`);
    } catch (error) {
        console.error(`Error adding earning for user ${userId}:`, error);
        showToast(`Failed to add earning: ${error.message}.`);
    }
}

// --- Function to load Anusement Content ---
function loadAnusementContent() {
  const anusementContainer = document.getElementById("anusementContainer");
  if (!anusementContainer) {
    console.error("Anusement container not found!");
    return;
  }
  anusementContainer.innerHTML = ""; // Clear previous content

  const anusementCollectionRef = collection(db, "anusement");
  const q = query(anusementCollectionRef, orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      anusementContainer.innerHTML = "<p>No anusement content available at the moment.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const anusementItem = doc.data();
      const anusementDiv = document.createElement("div");
      anusementDiv.classList.add("anusementBox");

      anusementDiv.innerHTML = `
        <h3 class="neon-text">${anusementItem.title || 'Untitled Anusement'}</h3>
        <p>${anusementItem.description || 'No description provided.'}</p>
        <p><a href="${anusementItem.url}" target="_blank">Visit Link</a></p>
        <small>Added: ${anusementItem.createdAt ? anusementItem.createdAt.toDate().toLocaleString() : 'N/A'}</small>
      `;
      anusementContainer.appendChild(anusementDiv);
    });
  }, (error) => {
    console.error("Error fetching anusement content:", error);
    anusementContainer.innerHTML = "<p>Error loading anusement content. Please try again later.</p>";
  });
}

// --- Admin Panel Anusement Logic ---
function loadAdminAnusementData() {
    onSnapshot(query(collection(db, "anusement"), orderBy("createdAt", "desc")), (snapshot) => {
        const anusementListContainer = document.getElementById("anusementList");
        if (!anusementListContainer) return; // Exit if container not found
        anusementListContainer.innerHTML = ""; // Clear existing list
        if (snapshot.empty) {
            anusementListContainer.innerHTML = "<p>No anusement content added yet.</p>";
            return;
        }
        snapshot.forEach((doc) => {
            const item = doc.data();
            const anusementDiv = document.createElement("div");
            anusementDiv.classList.add("anusement-list-item"); // Use the specific admin list item class
            const addedDate = item.createdAt ? item.createdAt.toDate().toLocaleString() : 'N/A';

            anusementDiv.innerHTML = `
                <p><strong class="neon-text">${item.title || 'No Title'}</strong><br>${item.description || 'No Description'}</p>
                <small>Added: ${addedDate}</small>
                <div class="action-buttons">
                  <button class="edit-anusement-btn" data-id="${doc.id}">Edit</button>
                  <button class="delete-anusement-btn" data-id="${doc.id}">Delete</button>
                </div>
            `;
            anusementListContainer.appendChild(anusementDiv);
        });
    });
}

// Event listener for the "Add Anusement" button in the admin panel
if (addAnusementBtn) { // Ensure the button exists
    addAnusementBtn.addEventListener("click", async () => {
        const title = anusementTitleInput.value.trim();
        const description = anusementDescriptionInput.value.trim();
        const url = anusementURLInput.value.trim();

        if (!title || !description || !url) {
            alert("Please fill in Title, Description, and URL for the anusement content.");
            return;
        }

        const anusementData = {
            title: title,
            description: description,
            url: url,
            createdAt: Timestamp.now() // Use createdAt for new items, consider adding updatedAt for updates
        };

        try {
            if (editingAnusementId) { // Update existing anusement content
                await updateDoc(doc(db, "anusement", editingAnusementId), anusementData);
                alert("Anusement content updated successfully!");
                // logUserActivity(auth.currentUser.uid, "anusement_updated", { anusementId: editingAnusementId, ...anusementData });
            } else { // Add new anusement content
                const docRef = await addDoc(collection(db, "anusement"), anusementData);
                alert("Anusement content added successfully!");
                // logUserActivity(auth.currentUser.uid, "anusement_added", { anusementId: docRef.id, ...anusementData });
            }
            // Reset form fields and state
            anusementTitleInput.value = "";
            anusementDescriptionInput.value = "";
            anusementURLInput.value = "";
            addAnusementBtn.innerText = "Add Anusement";
            editingAnusementId = null;
        } catch (error) {
            console.error("Error saving anusement content:", error);
            alert("Failed to save anusement content. Please try again.");
        }
    });
}

// Event listener for edit/delete buttons (using event delegation)
document.addEventListener('click', async (event) => {
    const target = event.target;
    const id = target.dataset.id;

    if (target.matches('.delete-anusement-btn')) {
        if (confirm("Delete this Anusement content?")) {
            try {
                await deleteDoc(doc(db, "anusement", id));
                alert("Anusement content deleted.");
                // Note: The onSnapshot listener in loadAdminAnusementData will automatically refresh the list.
            } catch (error) {
                console.error("Error deleting anusement content:", error);
                alert("Failed to delete anusement content. Check console for details.");
            }
        }
    } else if (target.matches('.edit-anusement-btn')) {
        const anusementSnap = await getDoc(doc(db, "anusement", id));
        if (anusementSnap.exists()) {
            const anusementData = anusementSnap.data();
            anusementTitleInput.value = anusementData.title || '';
            anusementDescriptionInput.value = anusementData.description || '';
            anusementURLInput.value = anusementData.url || '';
            addAnusementBtn.innerText = "Update Anusement";
            editingAnusementId = id;
            // Optionally, scroll to the form or show a confirmation
            window.scrollTo(0, document.getElementById('adminPanel').offsetTop);
        }
    }
});

// ---------- Initial Load and Auth State Check ----------
onAuthStateChanged(auth, user => {
    if (user) { // Always show the main content if user is logged in
        authSection.style.display = "none";
        nav.style.display = "flex";
        
        // Determine if the user is an admin
        if (user.email === adminEmail) {
            adminPanelBtn.style.display = "block";
            loadAdminDataIfAdmin(user);
            showSection('adminPanel'); // Default to admin panel if admin
        } else {
            adminPanelBtn.style.display = "none";
            if (adminPanelSection.classList.contains('active')) {
                showSection('tasks'); // Default to tasks for regular users
            }
        }
        loadUserData(user); // Load user-specific data
        loadUserDepositHistory(user.uid); // Load deposit history
        loadUserAddedLinks(user.uid); // Load user's own links
        loadPublicLinks(); // Load general public links
        loadForYouContent(user.uid); // Load "For You" content
        loadBalanceAdditionHistory(user.uid); // Load balance addition history
        loadSendBalanceHistory(user.uid); // Load send balance history

        // Make dashboard items clickable
        document.querySelectorAll('.dashboard-item').forEach(item => {
            item.addEventListener('click', () => {
                const targetSection = item.dataset.targetSection;
                if (targetSection) {
                    showSection(targetSection);
                }
            });
        });
    } else { // User is not logged in
        authSection.style.display = "block";
        nav.style.display = "none";
        showSection('authSection'); // Show login/signup section
        adminPanelBtn.style.display = "none";
        // Clear all user-specific data
        userNameDisplay.innerText = ""; userEmailDisplay.innerText = ""; userRefDisplay.innerText = "";
        walletBalanceDisplay.innerText = "0.00"; walletBalanceProfileDisplay.innerText = "0.00";
        totalReferralsCountDisplay.innerText = "0"; refLinkInput.value = "";
        if (totalReferralEarningsDisplay) totalReferralEarningsDisplay.innerText = "0.00";
        userProfilePic.innerText = "?"; userProfilePic.style.backgroundImage = 'none'; userProfilePic.style.backgroundColor = '#333';
        totalUsersDisplay.innerText = "0"; totalTasksDisplay.innerText = "0";
        totalWithdrawalsDisplay.innerText = "0"; totalEarningsDisplay.innerText = "₹0.00";
        document.getElementById("withdrawList").innerHTML = "";
        depositListContainer.innerHTML = "";
        userLinksContainer.innerHTML = "";
        publicLinksContainer.innerHTML = "";
        forYouTasksContainer.innerHTML = "";
        document.getElementById("tasksContainer").innerHTML = "";
        balanceAdditionHistoryContainer.innerHTML = "";
        sendBalanceHistoryContainer.innerHTML = "";
    }
});

// --- Initialize Anusement section loading listener ---
function setupAnusementSectionListener() { 
  const anusementNavButton = document.querySelector('nav button[data-section="anusement"]');
  if (anusementNavButton) {
    anusementNavButton.addEventListener('click', () => {
      if (auth.currentUser) {
        loadAnusementContent();
      }
    });
  }
}

// --- Call the setup function on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
  // If the page loads directly to the anusement section (though unlikely without auth), also load.
  const currentUser = auth.currentUser;
  if (currentUser && nav.style.display !== 'none' && document.getElementById('anusement')?.classList.contains('active')) {
    loadAnusementContent();
  }
  // Load admin anusement data if user is admin and admin panel is shown
  if (currentUser && currentUser.email === adminEmail && nav.style.display !== 'none' && document.getElementById('adminPanel')?.classList.contains('active')) {
      loadAdminAnusementData();
  }
});
