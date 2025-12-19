import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, get, update, off, remove } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA_aPVxJBhy3-ldzzGoBA-qboCucu9mV98",
    authDomain: "facebook-colon-6a549.firebaseapp.com",
    projectId: "facebook-colon-6a549",
    storageBucket: "facebook-colon-6a549.firebasestorage.app",
    messagingSenderId: "258603317441",
    appId: "1:258603317441:web:51d610f3f6ebeab928fc40",
    measurementId: "G-TM0KMGN5RM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const fs = getFirestore(app);

let currentUserData = null, chatMode = 'personal', targetID = null, activeChatRef = null, pressTimer = null;

// --- NAVIGATION ---
window.next = (s) => {
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    const el = document.getElementById('step-' + s);
    if(el) el.classList.add('active');
    const footerSteps = ['7', '10', '9'];
    document.getElementById('main-footer').style.display = footerSteps.includes(s.toString()) ? 'flex' : 'none';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if(s == 7) document.querySelectorAll('.nav-item')[0].classList.add('active');
    if(s == 10) document.querySelectorAll('.nav-item')[1].classList.add('active');
    if(s == 9) document.querySelectorAll('.nav-item')[2].classList.add('active');
};

window.showChats = () => next(7);
window.showGroups = () => next(10);
window.showProfile = () => next(9);
window.goBackFromChat = () => { if(chatMode === 'personal') next(7); else next(10); };

// --- AUTH LOGIC ---
window.handleLogin = async () => {
    const e = document.getElementById('l-email').value, p = document.getElementById('l-pass').value;
    try { await signInWithEmailAndPassword(auth, e, p); } catch (e) { alert(e.message); }
};

document.getElementById('signup-btn').onclick = async () => {
    const e = document.getElementById('f-email').value, p = document.getElementById('f-pass').value, n = document.getElementById('f-name').value, c = document.getElementById('f-cat').value, d = document.getElementById('f-desc').value;
    try {
        const res = await createUserWithEmailAndPassword(auth, e, p);
        const data = { uid: res.user.uid, email: e.toLowerCase(), password: p, name: n, category: c, desc: d, lastUpdated: 0 };
        await set(ref(db, 'users/' + res.user.uid), data);
        await setDoc(doc(fs, "users", res.user.uid), data);
    } catch (err) { alert(err.message); }
};

window.logout = () => signOut(auth).then(() => location.reload());

// --- CHAT SYSTEM ---
window.handleSendMessage = async () => {
    const text = document.getElementById('msg-input').value.trim();
    if(!text || !currentUserData) return;
    const now = Date.now(), myUid = auth.currentUser.uid;
    const msgData = { senderId: myUid, senderName: currentUserData.name, text, time: now };

    if(chatMode === 'personal') {
        const chatId = myUid < targetID ? myUid+"_"+targetID : targetID+"_"+myUid;
        await push(ref(db, 'chats/'+chatId), msgData);
        await update(ref(db, `conversations/${myUid}/${targetID}`), { uid: targetID, name: document.getElementById('chat-title').innerText, lastMsg: text, time: now });
        await update(ref(db, `conversations/${targetID}/${myUid}`), { uid: myUid, name: currentUserData.name, lastMsg: text, time: now });
    } else if(chatMode === 'public') {
        await push(ref(db, 'public_group'), msgData);
    } else if(chatMode === 'group') {
        await push(ref(db, 'group_messages/'+targetID), msgData);
    }
    document.getElementById('msg-input').value = "";
};

function loadMsgs(path) {
    if(activeChatRef) off(activeChatRef);
    activeChatRef = ref(db, path);
    onValue(activeChatRef, (snap) => {
        const cont = document.getElementById('msg-container');
        cont.innerHTML = "";
        snap.forEach(child => {
            const m = child.val();
            const div = document.createElement('div');
            div.className = `msg ${m.senderId === auth.currentUser.uid ? 'sent' : 'received'}`;
            div.innerHTML = `${(m.senderId !== auth.currentUser.uid && chatMode !== 'personal') ? `<span class="msg-sender">${m.senderName}</span>` : ''}${m.text}<span class="msg-time">${new Date(m.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>`;
            div.onmousedown = div.ontouchstart = () => { pressTimer = window.setTimeout(() => { if(confirm("Delete message?")) remove(ref(db, path + '/' + child.key)); }, 1000); };
            div.onmouseup = div.onmouseleave = div.ontouchend = () => clearTimeout(pressTimer);
            cont.appendChild(div);
        });
        cont.scrollTop = cont.scrollHeight;
    });
}

// --- SEARCH & LISTS ---
window.searchUser = async () => {
    const q = document.getElementById('search-input').value.trim().toLowerCase();
    const resDiv = document.getElementById('search-results');
    if(!q) { resDiv.innerHTML = ""; resDiv.style.display="none"; return; }
    const snap = await get(ref(db, 'users'));
    let found = false;
    resDiv.innerHTML = "<div class='section-title'>Search Results</div>";
    snap.forEach(child => {
        const u = child.val();
        if(u.email && u.email.includes(q) && u.uid !== auth.currentUser?.uid) {
            found = true;
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `<i class="fas fa-circle-user icon"></i><div class="item-info"><b>${u.name}</b><small>${u.email}</small></div>`;
            div.onclick = () => { chatMode='personal'; targetID=u.uid; document.getElementById('chat-title').innerText=u.name; document.getElementById('header-add-icon').style.display='none'; next(8); loadMsgs('chats/'+(auth.currentUser.uid < u.uid ? auth.currentUser.uid+"_"+u.uid : u.uid+"_"+auth.currentUser.uid)); };
            resDiv.appendChild(div);
        }
    });
    resDiv.style.display = found ? "block" : "none";
};

function loadRecentChats() {
    onValue(ref(db, 'conversations/'+auth.currentUser.uid), (snap) => {
        const cont = document.getElementById('recent-chats');
        cont.innerHTML = "";
        if(!snap.exists()) { cont.innerHTML="<p style='padding:40px; color:gray; text-align:center;'>No conversations found.</p>"; return; }
        snap.forEach(c => {
            const d = c.val(), div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `<i class="fas fa-circle-user icon" style="color:var(--wa-teal)"></i><div class="item-info"><b>${d.name}</b><small>${d.lastMsg}</small></div>`;
            div.onmousedown = div.ontouchstart = () => { pressTimer = window.setTimeout(() => { if(confirm(`Delete chat with ${d.name}?`)) remove(ref(db, `conversations/${auth.currentUser.uid}/${d.uid}`)); }, 1000); };
            div.onmouseup = div.onmouseleave = div.ontouchend = () => clearTimeout(pressTimer);
            div.onclick = () => { chatMode='personal'; targetID=d.uid; document.getElementById('chat-title').innerText=d.name; document.getElementById('header-add-icon').style.display='none'; next(8); loadMsgs('chats/'+(auth.currentUser.uid < d.uid ? auth.currentUser.uid+"_"+d.uid : d.uid+"_"+auth.currentUser.uid)); };
            cont.appendChild(div);
        });
    });
}

// --- GROUPS ---
window.openPublicGroup = () => { chatMode='public'; document.getElementById('chat-title').innerText="Global Lounge"; document.getElementById('header-add-icon').style.display='none'; next(8); loadMsgs('public_group'); };
window.handleCreateGroup = async () => {
    const name = document.getElementById('g-name').value;
    const emails = document.getElementById('g-members').value.split(',').map(e => e.trim().toLowerCase()).filter(e => e !== "");
    if(!name) return;
    const gId = "group_" + Date.now();
    await set(ref(db, 'groups/'+gId), { id: gId, name, admin: auth.currentUser.uid, members: [currentUserData.email, ...emails] });
    alert("Created!"); next(10);
};
window.handleAddMember = async () => {
    const email = document.getElementById('new-member-email').value.trim().toLowerCase();
    const snap = await get(ref(db, 'groups/'+targetID));
    if(snap.exists()){
        let g = snap.val();
        if(!g.members.includes(email)){ g.members.push(email); await update(ref(db, 'groups/'+targetID), {members: g.members}); alert("Added!"); next(8); }
    }
};
function loadPrivateGroups() {
    onValue(ref(db, 'groups'), (snap) => {
        const cont = document.getElementById('private-groups-list');
        cont.innerHTML = "";
        snap.forEach(child => {
            const g = child.val();
            if(g.members && g.members.includes(currentUserData.email)) {
                const div = document.createElement('div');
                div.className = 'item-row';
                div.innerHTML = `<i class="fas fa-users icon" style="color:#00a884"></i><div class="item-info"><b>${g.name}</b><small>${g.members.length} Members</small></div>`;
                div.onclick = () => { 
                    chatMode='group'; targetID=g.id; document.getElementById('chat-title').innerText=g.name; 
                    document.getElementById('header-add-icon').style.display=(g.admin === auth.currentUser.uid)?'block':'none'; next(8); loadMsgs('group_messages/'+g.id); 
                };
                cont.appendChild(div);
            }
        });
    });
}

// --- PROFILE ---
window.updateProfile = async () => {
    const upd = { name: document.getElementById('p-name').value, category: document.getElementById('p-cat').value, desc: document.getElementById('p-desc').value };
    await update(ref(db, 'users/'+auth.currentUser.uid), upd);
    await updateDoc(doc(fs, "users", auth.currentUser.uid), upd);
    alert("Saved!"); next(7);
};

onAuthStateChanged(auth, async (user) => {
    if(user) {
        const snap = await get(ref(db, 'users/'+user.uid));
        currentUserData = snap.val();
        if(currentUserData) {
            document.getElementById('p-name').value = currentUserData.name || "";
            document.getElementById('p-cat').value = currentUserData.category || "";
            document.getElementById('p-desc').value = currentUserData.desc || "";
            document.getElementById('p-email').value = currentUserData.email || "";
            document.getElementById('p-pass').value = currentUserData.password || "******";
        }
        next(7); loadRecentChats(); loadPrivateGroups();
    } else next(1);
});
