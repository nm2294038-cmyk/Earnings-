// script.js

// --- GLOBAL STATE ---
let currentUser = null;
let currentRoomId = 'general';
let usernameSubscription = null; 
let messageListener = null; 
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_AGO = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
let isSignUpMode = true;

// --- DOM ELEMENTS ---
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messageFormContainer = document.getElementById('messageFormContainer');
const currentRoomDisplay = document.getElementById('currentRoomDisplay'); 

// Header & Navigation
const profileBtn = document.getElementById('profileBtn');
const menuBtn = document.getElementById('menuBtn');
const groupMenuPanel = document.getElementById('groupMenuPanel');
// ... (Typing indicator element can be accessed globally if needed)

// Auth Modal Elements
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authUsername = document.getElementById('authUsername');
const authFirstName = document.getElementById('authFirstName');
const authLastName = document.getElementById('authLastName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const authError = document.getElementById('authError');
const usernameField = document.getElementById('usernameField');
const firstNameField = document.getElementById('firstNameField');
const lastNameField = document.getElementById('lastNameField');

// Profile Modal
const profileModal = document.getElementById('profileModal');
const profileEmail = document.getElementById('profileEmail');
const profileUid = document.getElementById('profileUid');
const profileUsernameInput = document.getElementById('profileUsernameInput');
const updateUsernameBtn = document.getElementById('updateUsernameBtn');
const usernameStatus = document.getElementById('usernameStatus');
const copyUidBtn = document.getElementById('copyUidBtn');
const profileSignOutBtn = document.getElementById('profileSignOutBtn');
const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
const publicRoomsList = document.getElementById('publicRoomsList');
const profileFullName = document.getElementById('profileFullName');


// --- UTILITY FUNCTIONS ---

function generateColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '...';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// --- CHAT ROOM MANAGEMENT ---

function stopListening() {
    if (messageListener) {
        messageListener();
        messageListener = null;
    }
}

function switchRoom(newRoomId, roomName = 'Room') {
    if (!currentUser) return;

    stopListening();
    currentRoomId = newRoomId;
    chatContainer.innerHTML = `<div class="text-center text-gray-500 pt-10">Loading chat for: ${roomName}...</div>`;
    
    groupMenuPanel.classList.add('hidden');
    
    currentRoomDisplay.textContent = roomName;
    document.title = `${roomName} | Chat`;

    // Start listening to the new room's messages
    messageListener = db.collection('messages')
        .where('roomId', '==', currentRoomId)
        .where('createdAt', '>', firebase.firestore.Timestamp.fromDate(SEVEN_DAYS_AGO))
        .orderBy('createdAt') 
        .limit(100)
        .onSnapshot(snapshot => {
            if (chatContainer.querySelector('.text-center') && chatContainer.classList.contains('flex-col-reverse')) {
                 chatContainer.innerHTML = '';
            }

            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    displayMessage(change.doc.data());
                }
            });
            
            // Set scroll to 0 for the bottom-up display
            chatContainer.scrollTop = 0; 
        }, err => {
            console.error("Message listener error (Check Indexes/Rules):", err);
        });
}

function displayMessage(msg) {
    const isMe = currentUser && msg.userId === currentUser.uid;
    
    const messageElement = document.createElement('div');
    // Added mt-3 for spacing in the flex-col-reverse flow
    messageElement.className = `flex ${isMe ? 'justify-end' : 'justify-start'} mt-3`; 
    
    const bubble = `
        <div class="max-w-xs sm:max-w-md lg:max-w-lg p-3 rounded-xl shadow-md ${isMe ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'}">
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-semibold" style="color: ${isMe ? 'white' : msg.color || generateColor(msg.userId)}">
                    ${isMe ? 'You' : msg.username || 'Anonymous'}
                </span>
                <span class="text-xs opacity-75 ml-2">${formatTimestamp(msg.createdAt)}</span>
            </div>
            <p class="whitespace-pre-wrap break-words">${msg.text}</p>
        </div>
    `;
    
    messageElement.innerHTML = bubble;
    // Appending pushes new message to the bottom (start of the reverse list)
    chatContainer.appendChild(messageElement);
}

// --- AUTHENTICATION (Includes Uniqueness Check) ---

function toggleAuthUI(toSignUp) {
    isSignUpMode = toSignUp;
    authTitle.textContent = isSignUpMode ? 'Sign Up' : 'Log In';
    authSubmitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Log In';
    
    usernameField.classList.toggle('hidden', !isSignUpMode);
    firstNameField.classList.toggle('hidden', !isSignUpMode);
    lastNameField.classList.toggle('hidden', !isSignUpMode);
    
    toggleAuthMode.textContent = isSignUpMode 
        ? 'Already have an account? Log In' 
        : 'Need an account? Sign Up';
    authError.classList.add('hidden');
}

async function handleAuthSubmit() {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    const username = authUsername.value.trim();
    const firstName = authFirstName.value.trim();
    const lastName = authLastName.value.trim();
    
    if (!email || !password || (isSignUpMode && (!username || !firstName || !lastName))) {
        authError.textContent = "Please fill in all required fields.";
        authError.classList.remove('hidden');
        return;
    }

    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = isSignUpMode ? 'Processing...' : 'Processing...';
    authError.classList.add('hidden');

    try {
        if (isSignUpMode) {
            // Client-side Uniqueness Check
            const existingUsername = await db.collection('users').where('username', '==', username).get();
            if (!existingUsername.empty) {
                authError.textContent = "Error: This username is already taken. Choose another.";
                authError.classList.remove('hidden');
                return;
            }

            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await setupUser(userCredential.user, {username, firstName, lastName}); 
            
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }

        // Clear fields and close modal
        authEmail.value = '';
        authPassword.value = '';
        authUsername.value = '';
        authFirstName.value = '';
        authLastName.value = '';
        authModal.classList.add('hidden');

    } catch (error) {
        console.error("Auth error:", error);
        authError.textContent = error.message.replace('Firebase:', '').trim();
        authError.classList.remove('hidden');
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Log In';
    }
}

async function setupUser(user, profileData = {}) {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        const newUserData = {
            uid: user.uid,
            email: user.email,
            username: profileData.username || user.email.split('@')[0],
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            color: generateColor(user.uid),
            usernameLastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await userRef.set(newUserData);
        return newUserData;
    }
    return userDoc.data();
}

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userData = await setupUser(user);
        currentUser = { ...user, ...userData };
        
        profileBtn.disabled = false;
        menuBtn.disabled = false;

        authModal.classList.add('hidden');
        messageFormContainer.classList.remove('hidden');
        
        switchRoom('general', 'General Chat');
        
        if (usernameSubscription) usernameSubscription();
        usernameSubscription = db.collection('users').doc(currentUser.uid)
            .onSnapshot(doc => {
                if (doc.exists) {
                    currentUser = { ...currentUser, ...doc.data() };
                    if (!profileModal.classList.contains('hidden')) {
                        initUserProfile();
                    }
                }
            });

    } else {
        currentUser = null;
        stopListening();
        
        profileBtn.disabled = true;
        menuBtn.disabled = true;
        
        authModal.classList.remove('hidden'); 
        messageFormContainer.classList.add('hidden');
        chatContainer.innerHTML = '<div class="text-center text-gray-500 pt-10">Please sign in to start chatting.</div>';
        currentRoomDisplay.textContent = 'General Chat';
        
        profileModal.classList.add('hidden');
        groupMenuPanel.classList.add('hidden');
    }
});

// --- SEND MESSAGE LOGIC ---
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser || !currentRoomId) return;

    const message = {
        roomId: currentRoomId,
        userId: currentUser.uid,
        username: currentUser.username,
        color: currentUser.color,
        text: text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('messages').add(message);
        messageInput.value = '';
    } catch (error) {
        console.error("Error sending message (Check Rules): ", error);
    }
}

// --- PROFILE MODAL LOGIC (7-DAY LOCK & Full Name Display) ---

function openProfileModal() {
    if (!currentUser) return;
    initUserProfile();
    profileModal.classList.remove('hidden');
}

function initUserProfile() {
    profileEmail.textContent = currentUser.email;
    profileUid.value = currentUser.uid;
    profileUsernameInput.value = currentUser.username;
    
    const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
    profileFullName.textContent = fullName || 'Not set';

    const lastUpdate = currentUser.usernameLastUpdatedAt ? 
        (currentUser.usernameLastUpdatedAt.toDate ? currentUser.usernameLastUpdatedAt.toDate() : currentUser.usernameLastUpdatedAt) : new Date(0);
    
    const now = new Date();
    const timeSinceLastUpdate = now.getTime() - lastUpdate.getTime();
    
    if (timeSinceLastUpdate < SEVEN_DAYS_MS) {
        const remainingTimeMs = SEVEN_DAYS_MS - timeSinceLastUpdate;
        const remainingDays = Math.ceil(remainingTimeMs / (1000 * 60 * 60 * 24));
        
        profileUsernameInput.disabled = true;
        updateUsernameBtn.disabled = true;
        usernameStatus.textContent = `Username can only be changed every 7 days. Remaining: ${remainingDays} day(s).`;
        usernameStatus.classList.remove('text-green-500');
        usernameStatus.classList.add('text-red-500');
    } else {
        profileUsernameInput.disabled = false;
        updateUsernameBtn.disabled = false;
        usernameStatus.textContent = `You can update your username.`;
        usernameStatus.classList.remove('text-red-500');
        usernameStatus.classList.add('text-green-500');
    }
}

async function updateUsername() {
    const newUsername = profileUsernameInput.value.trim();
    if (!newUsername || newUsername === currentUser.username) return;

    try {
        const existing = await db.collection('users').where('username', '==', newUsername).get();
        if (!existing.empty && existing.docs[0].id !== currentUser.uid) {
            usernameStatus.textContent = "Username already taken by another user.";
            return;
        }

        updateUsernameBtn.disabled = true;
        updateUsernameBtn.textContent = 'Updating...';

        await db.collection('users').doc(currentUser.uid).update({
            username: newUsername,
            usernameLastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        usernameStatus.textContent = "Username updated successfully! Refreshing...";
        usernameStatus.classList.remove('text-red-500');
        usernameStatus.classList.add('text-green-500');

        setTimeout(initUserProfile, 2000); 

    } catch (error) {
        console.error("Error updating username:", error);
        usernameStatus.textContent = "Error updating username. Check Rules for /users.";
        updateUsernameBtn.disabled = false;
        updateUsernameBtn.textContent = 'Update';
    }
}

// --- GROUP MENU LOGIC (Private DMs Removed) ---

menuBtn.addEventListener('click', () => {
    if (!currentUser) return;
    groupMenuPanel.classList.toggle('hidden');
    if (!groupMenuPanel.classList.contains('hidden')) {
        loadGroupMenu();
    }
});

document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !groupMenuPanel.contains(e.target)) {
        groupMenuPanel.classList.add('hidden');
    }
});

async function loadGroupMenu() {
    if (!currentUser) return;
    
    publicRoomsList.innerHTML = '';
    
    try {
        // Load Public Rooms only
        const publicSnap = await db.collection('rooms')
            .where('isPrivate', '==', false)
            .orderBy('name')
            .get();

        publicSnap.forEach(doc => addGroupItem(doc.data(), publicRoomsList));
        if (publicSnap.empty) {
            publicRoomsList.innerHTML += '<p class="text-xs text-gray-400 p-1">No public groups found.</p>';
        }
    } catch (e) {
        publicRoomsList.innerHTML = '<p class="text-xs text-red-500 p-1">Error loading rooms (Check Indexes/Rules).</p>';
        console.error("Room load error:", e);
    }
}

function addGroupItem(room, listElement) {
    const item = document.createElement('div');
    item.className = `p-2 cursor-pointer rounded-lg hover:bg-gray-100 transition duration-100 ${room.roomId === currentRoomId ? 'bg-blue-100 font-semibold' : ''}`;
    item.textContent = room.name;
    item.addEventListener('click', () => switchRoom(room.roomId, room.name));
    listElement.appendChild(item);
}

// --- EVENT LISTENERS ---

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

// Auth Listeners
toggleAuthUI(true);
toggleAuthMode.addEventListener('click', () => { toggleAuthUI(!isSignUpMode); });
authSubmitBtn.addEventListener('click', handleAuthSubmit);

// Profile Listeners
profileBtn.addEventListener('click', openProfileModal);
closeProfileModalBtn.addEventListener('click', () => profileModal.classList.add('hidden'));
profileSignOutBtn.addEventListener('click', () => { auth.signOut(); profileModal.classList.add('hidden'); });
updateUsernameBtn.addEventListener('click', updateUsername);

copyUidBtn.addEventListener('click', () => {
    profileUid.select();
    document.execCommand('copy');
    copyUidBtn.textContent = 'Copied!';
    setTimeout(() => copyUidBtn.textContent = 'Copy', 2000);
});

// --- INITIAL SETUP ---

db.collection('rooms').doc('general').get().then(doc => {
    if (!doc.exists) {
        db.collection('rooms').doc('general').set({
            roomId: 'general',
            name: 'General Chat',
            isPrivate: false,
            participants: [] // Public rooms don't need participant list
        });
    }
});

console.warn("SERVER WARNING: Automatic message deletion (7 days) is NOT possible via client-side code alone. A Cloud Function is required to delete data on the server.");
