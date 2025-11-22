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
        let currentUser = null;
        let currentCoinBalance = 0;
        const COIN_RATE_PKR = 80; // 80 Coins = 1 PKR
        const MIN_WITHDRAWAL_COINS = 2000;
        const WITHDRAWAL_PACKAGES = [2000, 2400, 2800, 3000, 3400, 3800];
        let isSignupMode = false;

        // --- DOM ELEMENTS ---
        const currentWithdrawalBalance = document.getElementById('currentWithdrawalBalance');
        const withdrawalForm = document.getElementById('withdrawalForm');
        const withdrawalSection = document.getElementById('withdrawalSection');
        const authModal = document.getElementById('authModal');
        const historyList = document.getElementById('historyList');
        const authTitle = document.getElementById('authTitle');
        const authButton = document.getElementById('authButton');
        const toggleText = document.getElementById('toggleText');
        const logoutButton = document.getElementById('logoutButton');
        const profileIconButton = document.getElementById('profileIconButton');
        const articleSection = document.querySelector('.article');
        const withdrawalAmountInput = document.getElementById('withdrawalAmount');
        const pkrEquivalentDisplay = document.getElementById('pkrEquivalent');
        const withdrawalPackagesContainer = document.getElementById('withdrawalPackages');


        // --- INITIAL SETUP: RENDER WITHDRAWAL PACKAGES ---
        function renderWithdrawalPackages() {
            withdrawalPackagesContainer.innerHTML = '';
            WITHDRAWAL_PACKAGES.forEach(coins => {
                const pkr = coins / COIN_RATE_PKR;
                const button = document.createElement('button');
                button.className = 'withdrawal-btn';
                button.setAttribute('type', 'button');
                button.setAttribute('data-coins', coins);
                button.textContent = `${coins} Coins (${pkr} PKR)`;
                withdrawalPackagesContainer.appendChild(button);
            });
        }
        renderWithdrawalPackages();

        // --- WITHDRAWAL PACKAGE SELECTION LOGIC ---
        withdrawalPackagesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('withdrawal-btn')) {
                const selectedCoins = Number(e.target.getAttribute('data-coins'));
                
                // 1. Update Input Field
                withdrawalAmountInput.value = selectedCoins;
                
                // 2. Update Visual Selection
                document.querySelectorAll('.withdrawal-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                e.target.classList.add('selected');
                
                // 3. Update PKR Equivalent Display
                updatePkrEquivalent(selectedCoins);
            }
        });
        
        // --- PKR EQUIVALENT CALCULATION ---
        function updatePkrEquivalent(coins) {
            const pkr = coins / COIN_RATE_PKR;
            pkrEquivalentDisplay.textContent = `Yeh lagbhag ${pkr.toFixed(2)} PKR banenge.`;
        }

        withdrawalAmountInput.addEventListener('input', (e) => {
            const coins = Number(e.target.value);
            updatePkrEquivalent(coins);
            
            // Remove selection from buttons if user types manually
            document.querySelectorAll('.withdrawal-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
        });


        // --- EVENT LISTENER TO OPEN MODAL VIA ICON ---
        profileIconButton.addEventListener('click', () => {
            authModal.style.display = 'flex';
            if (!auth.currentUser) {
                isSignupMode = false;
                toggleAuthMode();
            }
        });


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


        // --- AUTH CHECK AND WALLET LISTENER ---
        auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
                // Logged In: Show Withdrawal Section, Hide Article Guide
                articleSection.style.display = 'none';
                withdrawalSection.style.display = 'block';
                authModal.style.display = 'none';
                logoutButton.style.display = 'block';
                toggleText.style.display = 'none';
                
                listenToWallet(user.uid);
                listenToWithdrawalHistory(user.uid);
                updatePkrEquivalent(Number(withdrawalAmountInput.value) || MIN_WITHDRAWAL_COINS); // Initial PKR calculation

            } else {
                // Logged Out: Show Article Guide, Hide Withdrawal Section
                articleSection.style.display = 'block';
                withdrawalSection.style.display = 'none';
                logoutButton.style.display = 'none';
                toggleText.style.display = 'block';
                currentCoinBalance = 0;
            }
        });

        function listenToWallet(uid) {
            db.collection('users').doc(uid).onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    const coins = data.coins ? Number(data.coins) : 0; 
                    currentCoinBalance = coins;
                    currentWithdrawalBalance.textContent = `${coins} Coins`;
                } else {
                    currentWithdrawalBalance.textContent = `0 Coins`;
                }
            }, error => {
                console.error("Error listening to wallet:", error);
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

        // --- HISTORY LOGIC ---

        function formatTimestamp(timestamp) {
            if (timestamp && timestamp.toDate) {
                return timestamp.toDate().toLocaleDateString('en-PK', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
            }
            return 'N/A';
        }

        function renderHistory(requests) {
            if (requests.length === 0) {
                historyList.innerHTML = '<p>Aapne abhi tak koi withdrawal request nahi bheji hai.</p>';
                return;
            }

            let html = `
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Coins</th>
                            <th>PKR</th>
                            <th>Method</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            requests.forEach(req => {
                const statusClass = req.status.toLowerCase();
                // Display PKR amount in history
                const pkrAmount = req.pkrEquivalent ? req.pkrEquivalent.toFixed(2) : (req.coinsRequested / COIN_RATE_PKR).toFixed(2);
                
                html += `
                    <tr>
                        <td>${req.coinsRequested}</td>
                        <td>${pkrAmount} PKR</td>
                        <td>${req.paymentMethod}</td>
                        <td>${formatTimestamp(req.timestamp)}</td>
                        <td><span class="status-${statusClass}">${req.status}</span></td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
            historyList.innerHTML = html;
        }

        function listenToWithdrawalHistory(uid) {
            db.collection('withdrawal_requests')
              .where('userId', '==', uid)
              .orderBy('timestamp', 'desc')
              .onSnapshot(snapshot => {
                  const requests = [];
                  snapshot.forEach(doc => {
                      requests.push(doc.data());
                  });
                  renderHistory(requests);
              }, error => {
                  console.error("Error fetching history:", error);
                  historyList.innerHTML = '<p style="color: var(--danger-color);">History load karne mein masla hua.</p>';
              });
        }


        // --- WITHDRAWAL LOGIC ---
        withdrawalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentUser) return;

            const coinsRequested = Number(withdrawalAmountInput.value);
            const method = document.getElementById('paymentMethod').value;
            const accountNum = document.getElementById('accountNumber').value;
            const holderName = document.getElementById('accountHolderName').value;
            
            // Calculate PKR equivalent
            const pkrEquivalent = coinsRequested / COIN_RATE_PKR;

            if (coinsRequested < MIN_WITHDRAWAL_COINS) {
                alert(`Withdrawal ke liye kam az kam ${MIN_WITHDRAWAL_COINS} Coins chahiye.`);
                return;
            }
            
            // Check if coins are divisible by 4 to ensure whole PKR amount
            if (coinsRequested % COIN_RATE_PKR !== 0) {
                alert(`Coins ki miqdar ${COIN_RATE_PKR} se taqseem (divide) honi chahiye taake sahi PKR amount ban sake. Maslan: 1200, 1204, 1208, etc.`);
                return;
            }

            if (coinsRequested > currentCoinBalance) {
                alert("Aapke paas itne coins nahi hain.");
                return;
            }

            try {
                await db.collection('withdrawal_requests').add({
                    userId: currentUser.uid,
                    email: currentUser.email,
                    coinsRequested: coinsRequested,
                    pkrEquivalent: pkrEquivalent, // Store PKR amount
                    paymentMethod: method,
                    accountNumber: accountNum,
                    accountHolderName: holderName,
                    status: 'Pending',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Deduct coins
                await addCoinsToWallet(currentUser.uid, -coinsRequested);

                alert(`Withdrawal Request Bhej Di Gayi Hai! ${coinsRequested} Coins (${pkrEquivalent} PKR) aapke balance se kaat liye gaye hain.`);
                withdrawalForm.reset();
                updatePkrEquivalent(0); // Reset PKR display

            } catch (error) {
                console.error("Withdrawal failed:", error);
                alert("Withdrawal Request bhejte waqt koi masla hua. Dobara koshish karen.");
            }
        });
