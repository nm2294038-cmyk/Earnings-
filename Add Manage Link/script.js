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

        // --- CONSTANTS (Task Costs) ---
        const DEFAULT_RATES = {
            YouTube: {
                'Subscriber': 28000,
                'Like': 2400,
              'Comment': 5000,
                'View': 2400
            },
            TikTok: {
                'View': 6,
                'Like': 30,
                'Comment': 100,
                'Share': 4,
                'Saved': 2,
                'Follow': 100
            },
            Instagram: {
                'Follower': 3800,
                'Like': 2400,
                'View': 250
            },
            Facebook: {
                'Follower': 1600,
                'Post Reaction': 1200
            }
        };

        // --- GLOBAL STATE ---
        let currentUser = null;
        let currentCoinBalance = 0;
        let requiredCoins = 0;
        let isSignupMode = false;

        // --- DOM ELEMENTS ---
        const authModal = document.getElementById('authModal');
        const authTitle = document.getElementById('authTitle');
        const authButton = document.getElementById('authButton');
        const toggleText = document.getElementById('toggleText');
        const logoutButton = document.getElementById('logoutButton');
        const profileIconButton = document.getElementById('profileIconButton');
        const currentBalanceDisplay = document.getElementById('currentBalanceDisplay');
        const articleSection = document.getElementById('articleSection'); // New element
        const taskSubmissionSection = document.getElementById('taskSubmissionSection');
        const taskForm = document.getElementById('taskForm');
        const platformSelect = document.getElementById('platformSelect');
        const taskTypeSelect = document.getElementById('taskTypeSelect');
        const requiredCoinsDisplay = document.getElementById('coinsRequiredDisplay');
        const submitTaskButton = document.getElementById('submitTaskButton');
        const taskHistoryList = document.getElementById('taskHistoryList');


        // --- AUTH MODAL LOGIC ---
        function toggleAuthMode() {
            isSignupMode = !isSignupMode;
            if (isSignupMode) {
                authTitle.textContent = "Signup Karen";
                authButton.textContent = "Signup";
                toggleText.innerHTML = 'Account hai? <a onclick="toggleAuthMode()">Login Karen</a>';
            } else {
                authTitle.textContent = "Login Karen";
                authButton.textContent = "Login";
                toggleText.innerHTML = 'Account nahi hai? <a onclick="toggleAuthMode()">Signup Karen</a>';
            }
        }

        document.getElementById('authForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            try {
                if (isSignupMode) {
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    await db.collection('users').doc(userCredential.user.uid).set({ coins: 0 });
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
            alert("Logout Successful.");
        });

        profileIconButton.addEventListener('click', () => {
            authModal.style.display = 'flex';
            if (!auth.currentUser) {
                isSignupMode = false;
                toggleAuthMode();
            }
        });


        // --- WALLET LISTENER ---
        function listenToWallet(uid) {
            db.collection('users').doc(uid).onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    const coins = data.coins ? Number(data.coins) : 0; 
                    currentCoinBalance = coins;
                    currentBalanceDisplay.textContent = `${coins} Coins`;
                    checkSubmissionEligibility();
                } else {
                    currentBalanceDisplay.textContent = `0 Coins`;
                    currentCoinBalance = 0;
                }
            });
        }

        async function addCoinsToWallet(uid, amount) {
            const userRef = db.collection('users').doc(uid);
            try {
                await userRef.update({
                    coins: firebase.firestore.FieldValue.increment(amount) 
                });
            } catch (error) {
                console.error("Error updating wallet:", error);
            }
        }

        // --- AUTH CHECK ---
        auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
                // Logged In: Show Task Section, Hide Article
                articleSection.style.display = 'none';
                taskSubmissionSection.style.display = 'block';
                currentBalanceDisplay.style.display = 'block';
                authModal.style.display = 'none';
                logoutButton.style.display = 'block';
                toggleText.style.display = 'none';
                
                listenToWallet(user.uid);
                listenToTaskHistory(user.uid);

            } else {
                // Logged Out: Show Article, Hide Task Section
                articleSection.style.display = 'block';
                taskSubmissionSection.style.display = 'none';
                currentBalanceDisplay.style.display = 'none';
                logoutButton.style.display = 'none';
                toggleText.style.display = 'block';
                currentCoinBalance = 0;
            }
        });

        // --- TASK FORM LOGIC ---

        platformSelect.addEventListener('change', () => {
            const platform = platformSelect.value;
            taskTypeSelect.innerHTML = '<option value="">--- Select Task Type ---</option>';
            taskTypeSelect.disabled = true;
            requiredCoins = 0;
            requiredCoinsDisplay.textContent = '0 Coins';

            if (platform && DEFAULT_RATES[platform]) {
                for (const taskType in DEFAULT_RATES[platform]) {
                    const coins = DEFAULT_RATES[platform][taskType];
                    const option = document.createElement('option');
                    option.value = taskType;
                    option.textContent = `${taskType} (${coins} Coins)`;
                    taskTypeSelect.appendChild(option);
                }
                taskTypeSelect.disabled = false;
            }
            checkSubmissionEligibility();
        });

        taskTypeSelect.addEventListener('change', () => {
            const platform = platformSelect.value;
            const type = taskTypeSelect.value;
            
            if (platform && type && DEFAULT_RATES[platform] && DEFAULT_RATES[platform][type]) {
                requiredCoins = DEFAULT_RATES[platform][type];
                requiredCoinsDisplay.textContent = `${requiredCoins} Coins`;
            } else {
                requiredCoins = 0;
                requiredCoinsDisplay.textContent = '0 Coins';
            }
            checkSubmissionEligibility();
        });
        
        function checkSubmissionEligibility() {
            if (requiredCoins > 0 && currentCoinBalance >= requiredCoins) {
                submitTaskButton.disabled = false;
                submitTaskButton.textContent = `Submit Karen (${requiredCoins} Coins Deduct Honge)`;
            } else {
                submitTaskButton.disabled = true;
                if (requiredCoins > 0) {
                    submitTaskButton.textContent = `Coins Kam Hain (${requiredCoins} Chahiye)`;
                } else {
                    submitTaskButton.textContent = `Task Submit Karen`;
                }
            }
        }


        // --- TASK SUBMISSION ---
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentUser || requiredCoins === 0 || currentCoinBalance < requiredCoins) {
                alert("Coins kam hain ya task select nahi kiya gaya.");
                return;
            }

            const platform = platformSelect.value;
            const type = taskTypeSelect.value;
            const link = document.getElementById('taskLink').value;
            const coins = requiredCoins;

            if (!confirm(`Kya aap ${coins} Coins kharch karke yeh task submit karna chahte hain?`)) {
                return;
            }

            try {
                // 1. Deduct Coins from Wallet (Negative amount)
                await addCoinsToWallet(currentUser.uid, -coins);

                // 2. Create Task Request Record
                await db.collection('user_tasks').add({
                    userId: currentUser.uid,
                    email: currentUser.email,
                    platform: platform,
                    type: type,
                    link: link,
                    coinsDeducted: coins,
                    status: 'Pending', // Admin will approve/reject this
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert(`Task Request Bhej Di Gayi! ${coins} Coins aapke wallet se kaat liye gaye hain.`);
                taskForm.reset();
                requiredCoins = 0;
                requiredCoinsDisplay.textContent = '0 Coins';
                platformSelect.dispatchEvent(new Event('change')); // Reset task type dropdown

            } catch (error) {
                console.error("Task submission failed:", error);
                alert("Task Request bhejte waqt koi masla hua. Dobara koshish karen.");
            }
        });
        
        // --- HISTORY LOGIC ---

        function formatTimestamp(timestamp) {
            if (timestamp && timestamp.toDate) {
                return timestamp.toDate().toLocaleDateString('en-PK', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
            }
            return 'N/A';
        }

        function renderTaskHistory(requests) {
            if (requests.length === 0) {
                taskHistoryList.innerHTML = '<p>Aapne abhi tak koi task request nahi bheji hai.</p>';
                return;
            }

            let html = `
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Platform</th>
                            <th>Task Type</th>
                            <th>Coins Spent</th>
                            <th>Link</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            requests.forEach(req => {
                const statusClass = (req.status || 'Pending').toLowerCase();
                html += `
                    <tr>
                        <td>${req.platform}</td>
                        <td>${req.type}</td>
                        <td>${req.coinsDeducted}</td>
                        <td><a href="${req.link}" target="_blank">View Link</a></td>
                        <td>${formatTimestamp(req.timestamp)}</td>
                        <td><span class="status-${statusClass}">${req.status || 'Pending'}</span></td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
            taskHistoryList.innerHTML = html;
        }

        function listenToTaskHistory(uid) {
            // NOTE: This query requires a composite index in Firestore: (userId Ascending, timestamp Descending)
            db.collection('user_tasks')
              .where('userId', '==', uid)
              .orderBy('timestamp', 'desc')
              .onSnapshot(snapshot => {
                  const requests = [];
                  snapshot.forEach(doc => {
                      requests.push(doc.data());
                  });
                  renderTaskHistory(requests);
              }, error => {
                  console.error("Error fetching task history:", error);
                  taskHistoryList.innerHTML = '<p style="color: var(--danger-color);">History load karne mein masla hua. (Masla hal karne ke liye Firebase Console mein Index banaen: user_tasks collection, userId Asc, timestamp Desc)</p>';
              });
        }
