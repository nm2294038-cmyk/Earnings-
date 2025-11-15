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

        // --- GLOBAL STATE AND CONSTANTS ---
        let isSignupMode = false;
        let currentUser = null;
        const REWARD_TIME_SECONDS = 250;
        const REWARD_COINS = 10; 
        
        const rewardedVideos = {}; 

        // Aapke diye gaye links (10 sections ke liye)
        const sectionLinks = [
            "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", 
            "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", 
            "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", 
            "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", 
            "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", 
            "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", 
            "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", 
            "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", 
            "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42", 
            "https://youtu.be/fjHXG7brtso?si=JCqnjpNiCagLIj42"
        ];

        // --- DOM ELEMENTS ---
        const authModal = document.getElementById('authModal');
        const authTitle = document.getElementById('authTitle');
        const authButton = document.getElementById('authButton');
        const toggleText = document.getElementById('toggleText');
        const logoutButton = document.getElementById('logoutButton');
        const walletDisplay = document.getElementById('walletDisplay');
        const newBalanceDisplay = document.getElementById('newBalanceDisplay');
        const rewardCoinsDisplay = document.getElementById('rewardCoinsDisplay');
        const container = document.getElementById('mainContainer');
        const authNameInput = document.getElementById('authName');


        // --- AUTH MODAL FUNCTIONS ---

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

        document.getElementById('authForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            const name = document.getElementById('authName').value;


            try {
                if (isSignupMode) {
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    
                    // Update Auth Profile
                    await userCredential.user.updateProfile({ displayName: name });
                    
                    // Initialize Firestore Wallet
                    await db.collection('users').doc(userCredential.user.uid).set({
                        coins: 0,
                        email: email,
                        name: name,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    alert("Signup Successful! Welcome.");
                } else {
                    await auth.signInWithEmailAndPassword(email, password);
                    alert("Login Successful!");
                }
                authModal.style.display = 'none';
            } catch (error) {
                alert(`Authentication Failed: ${error.message}`);
            }
        });

        logoutButton.addEventListener('click', async () => {
            await auth.signOut();
            Object.keys(rewardedVideos).forEach(key => rewardedVideos[key] = false);
            alert("Logout Successful.");
        });

        // Real-time Auth State Listener
        auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
                document.getElementById('profileIcon').textContent = '✅';
                walletDisplay.style.display = 'block';
                logoutButton.style.display = 'block';
                toggleText.style.display = 'none';
                
                listenToWallet(user.uid);
                updateVideoOverlays(true);

            } else {
                document.getElementById('profileIcon').textContent = '👤';
                walletDisplay.style.display = 'none';
                logoutButton.style.display = 'none';
                toggleText.style.display = 'block';
                
                updateVideoOverlays(false);
            }
        });

        // --- WALLET AND FIRESTORE FUNCTIONS ---

        function listenToWallet(uid) {
            db.collection('users').doc(uid).onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    const coins = data.coins ? Number(data.coins) : 0; 
                    walletDisplay.textContent = `Coins: ${coins.toLocaleString()}`;
                    newBalanceDisplay.textContent = coins.toLocaleString(); 
                } else {
                    db.collection('users').doc(uid).set({ coins: 0 });
                }
            }, error => {
                console.error("Error listening to wallet:", error);
            });
        }

        async function addCoinsToWallet(uid, amount, sourceDetails) {
            const userRef = db.collection('users').doc(uid);
            const userEmail = currentUser.email;

            try {
                // 1. Update Wallet
                await userRef.update({
                    coins: firebase.firestore.FieldValue.increment(amount) 
                });

                // 2. Log Earning for Admin Panel (NEW LOGGING)
                await db.collection('worker_earnings').add({
                    userId: uid,
                    email: userEmail,
                    amount: amount,
                    source: sourceDetails.source,
                    reference: sourceDetails.reference,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

            } catch (error) {
                console.error("Error updating wallet/logging earning:", error);
                alert("Coins add nahi ho paye. Database connection ya permissions check karen.");
            }
        }

        // --- VIDEO AND TIMER LOGIC ---

        function getYouTubeId(url) {
            let match = url.match(/[?&]v=([^&]+)/);
            if (match) return match[1];
            match = url.match(/youtu\.be\/([^?]+)/);
            if (match) return match[1];
            return 'fjHXG7brtso';
        }
        
        function updateVideoOverlays(isLoggedIn) {
            document.querySelectorAll('.video-overlay').forEach(overlay => {
                if (isLoggedIn) {
                    overlay.classList.remove('disabled');
                    overlay.querySelector('.video-overlay-text').textContent = 'Video Play Karen Aur Coins Kamaen';
                } else {
                    overlay.classList.add('disabled');
                    overlay.querySelector('.video-overlay-text').textContent = 'Login Karen Coins Kamane Ke Liye';
                }
            });
        }

        function showRewardPopup(coins) {
            document.getElementById('rewardModal').style.display = "flex"; // Use flex for centering
            rewardCoinsDisplay.textContent = coins.toLocaleString();
        }

        function startTimer(sectionId, overlayElement, videoLink) {
            if (!currentUser || rewardedVideos[sectionId]) return; 

            const timerDisplay = document.getElementById(`timer-${sectionId}`);
            timerDisplay.style.display = 'block';
            let timeLeft = REWARD_TIME_SECONDS;
            
            timerDisplay.textContent = `Timer: ${timeLeft} seconds remaining...`;

            const timerInterval = setInterval(async () => {
                timeLeft--;
                timerDisplay.textContent = `Timer: ${timeLeft} seconds remaining...`;

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    
                    rewardedVideos[sectionId] = true; 
                    
                    // --- 1. Coins add karna ---
                    const sourceDetails = {
                        source: "Video Reward",
                        reference: `Section ${sectionId} (${videoLink})`
                    };
                    await addCoinsToWallet(currentUser.uid, REWARD_COINS, sourceDetails);
                    
                    // --- 2. UI update ---
                    timerDisplay.textContent = `Mubarak! ${REWARD_COINS.toLocaleString()} Coins Mil Gaye!`;
                    timerDisplay.style.backgroundColor = '#d4edda';
                    timerDisplay.style.color = '#155724';
                    
                    // --- 3. Popup dikhana ---
                    showRewardPopup(REWARD_COINS);
                    
                    // --- 4. Overlay ko wapas lana ---
                    overlayElement.style.display = 'flex';
                    overlayElement.style.opacity = '1';
                    overlayElement.querySelector('.video-overlay-text').textContent = 'Reward Mil Chuka Hai!';
                    overlayElement.classList.add('disabled');
                }
            }, 1000);
        }

        // Function to handle the click on the overlay
        function handleVideoClick(event, sectionId) {
            const overlay = event.currentTarget;
            
            if (!currentUser) {
                alert("Coins kamane ke liye pehle Login ya Signup karen.");
                document.getElementById('authModal').style.display = 'flex';
                return;
            }
            
            if (rewardedVideos[sectionId]) {
                alert("Aap is video ka reward pehle hi le chuke hain.");
                return;
            }
            
            if (overlay.classList.contains('disabled')) {
                 return;
            }

            const iframe = overlay.nextElementSibling;
            
            // 1. Overlay remove karna
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);

            // 2. Video ko autoplay karna
            const videoLink = sectionLinks[sectionId - 1];
            const videoId = getYouTubeId(videoLink);
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0`;

            // 3. Timer shuru karna
            startTimer(sectionId, overlay, videoLink);
        }


        // --- INITIAL SECTION GENERATION ---
        function generateSections() {
            container.innerHTML = '';
            for (let i = 1; i <= 10; i++) {
                const currentLink = sectionLinks[i - 1]; 
                const videoId = getYouTubeId(currentLink);
                const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`;
                
                const section = document.createElement('div');
                section.classList.add('section');
                section.id = `section${i}`;
                
                section.innerHTML = `
                    <h2>Section ${i}: Watch & Earn ${REWARD_COINS.toLocaleString()} Coins</h2>
                    <div class="video-wrapper">
                        
                        <!-- Overlay for click detection -->
                        <div class="video-overlay" id="overlay-${i}">
                            <span class="video-overlay-text">Video Play Karen Aur Coins Kamaen</span>
                        </div>

                        <!-- Iframe -->
                        <iframe 
                            src="${embedUrl}" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    
                    <!-- Timer Display -->
                    <div class="timer-display" id="timer-${i}">
                        Timer: ${REWARD_TIME_SECONDS} seconds remaining...
                    </div>
                `;
                
                container.appendChild(section);
                rewardedVideos[i] = false; 

                const overlayElement = document.getElementById(`overlay-${i}`);
                overlayElement.addEventListener('click', (e) => handleVideoClick(e, i));
            }
            updateVideoOverlays(false);
        }

        // --- EVENT LISTENERS ---
        document.getElementById('profileIcon').addEventListener('click', () => {
            document.getElementById('authModal').style.display = 'flex';
        });

        // Start the app
        generateSections();
        
