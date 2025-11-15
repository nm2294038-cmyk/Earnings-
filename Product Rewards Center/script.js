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

        // --- CONSTANTS ---
        const LOCK_DURATION_MS = 3600000; // 1 hour

        // --- DOM ELEMENTS ---
        const guideSection = document.getElementById('guideSection');
        const productListSection = document.getElementById('productListSection');
        const productList = document.getElementById('productList');
        const profileIconButton = document.getElementById('profileIconButton');
        const authModal = document.getElementById('authModal');
        const walletDisplay = document.getElementById('walletDisplay');
        const successPopup = document.getElementById('successPopup');

        let currentUser = null;
        let userLockStatus = {};
        let lockIntervals = {};


        // --- WALLET & LOGGING FUNCTION ---
        async function addCoinsToWallet(uid, amount, productName, productLink) {
            if (!uid) return false;
            const userRef = db.collection('users').doc(uid);
            const userEmail = currentUser.email;

            try {
                // 1. Update Wallet
                await userRef.update({
                    coins: firebase.firestore.FieldValue.increment(amount) 
                });

                // 2. Log Earning for Admin Panel (worker_earnings collection)
                await db.collection('worker_earnings').add({
                    userId: uid,
                    email: userEmail,
                    amount: amount,
                    source: "Product Reward",
                    type: productName,
                    reference: productLink,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return true;
            } catch (error) {
                console.error("Error updating wallet/logging earning:", error);
                return false;
            }
        }

        // --- UI POPUP FUNCTION ---
        function showSuccessPopup(message) {
            successPopup.textContent = message;
            successPopup.style.display = 'block';
            setTimeout(() => {
                successPopup.style.display = 'none';
            }, 3000);
        }

        // --- AUTH HANDLING ---
        profileIconButton.addEventListener('click', () => {
            if (currentUser) {
                if (confirm("Aap pehle se logged in hain. Kya aap logout karna chahte hain?")) {
                    auth.signOut();
                }
            } else {
                authModal.style.display = 'flex';
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

        auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
                guideSection.style.display = 'none';
                productListSection.style.display = 'block';
                walletDisplay.style.display = 'block';
                listenToWallet(user.uid);
                fetchProductsAndLocks(user.uid); // Fetch products and locks
            } else {
                guideSection.style.display = 'block';
                productListSection.style.display = 'none';
                walletDisplay.style.display = 'none';
            }
        });

        // --- WALLET LISTENER ---
        function listenToWallet(uid) {
            db.collection('users').doc(uid).onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    const coins = Number(data.coins) || 0;
                    walletDisplay.textContent = `${coins.toLocaleString()} Coins`;
                } else {
                    walletDisplay.textContent = `0 Coins`;
                }
            });
        }
        
        // --- LOCK TIMER LOGIC ---
        function startLockTimer(productId, unlockTime) {
            const timerElement = document.getElementById(`timer-${productId}`);
            const cardElement = document.getElementById(`card-${productId}`);
            
            if (!timerElement || !cardElement) return; 

            if (lockIntervals[productId]) {
                clearInterval(lockIntervals[productId]);
            }

            lockIntervals[productId] = setInterval(() => {
                const remainingTimeMs = unlockTime - Date.now();
                
                if (remainingTimeMs <= 0) {
                    clearInterval(lockIntervals[productId]);
                    
                    // Remove lock overlay and timer
                    const overlay = document.getElementById(`overlay-${productId}`);
                    if (overlay) overlay.remove();
                    timerElement.textContent = '';
                    
                    delete userLockStatus[productId];
                    fetchProductsAndLocks(currentUser.uid); // Re-render to ensure clean state
                    return;
                }

                const seconds = Math.floor((remainingTimeMs / 1000) % 60);
                const minutes = Math.floor((remainingTimeMs / (1000 * 60)) % 60);
                const hours = Math.floor((remainingTimeMs / (1000 * 60 * 60)));

                timerElement.textContent = `Lock: ${hours}h ${minutes}m ${seconds}s`;
            }, 1000);
        }


        // --- PRODUCT FETCHING (Real-time) ---
        async function fetchProductsAndLocks(uid) {
            productList.innerHTML = '<p style="text-align: center;">Products load ho rahe hain...</p>';
            
            // 1. Fetch Products
            const productsPromise = db.collection('products').orderBy('createdAt', 'desc').get();
            
            // 2. Fetch User Locks
            const lockPromise = db.collection('user_locks').doc(uid).get();
            
            const [productsSnapshot, lockDoc] = await Promise.all([productsPromise, lockPromise]);
            
            if (lockDoc.exists) {
                userLockStatus = lockDoc.data();
            } else {
                userLockStatus = {};
            }

            if (productsSnapshot.empty) {
                productList.innerHTML = `<p style="text-align: center;">Abhi koi product maujood nahi hai.</p>`;
                return;
            }
            
            productList.innerHTML = '';
            productsSnapshot.forEach(doc => {
                const product = doc.data();
                product.id = doc.id;
                renderProductCard(product);
            });
        }

        // --- PRODUCT RENDERING ---
        function renderProductCard(product) {
            const productId = product.id;
            const lockTime = userLockStatus[productId] || 0;
            const isLocked = lockTime > Date.now();
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.id = `card-${productId}`;
            
            // Use a wrapper div for the details and button
            const detailsWrapper = document.createElement('div');
            detailsWrapper.innerHTML = `
                <div class="product-image">
                    ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}">` : '🖼️ Image Missing'}
                </div>
                <div class="product-details">
                    <h3>${product.name}</h3>
                    <p class="price-tag">Price: ${product.price || 'N/A'} PKR</p>
                    <span class="earn-coins">Click & Earn ${product.rewardCoins.toLocaleString()} Coins</span>
                    <div id="timer-${productId}" style="color: var(--danger-color); margin-top: 5px;"></div>
                </div>
            `;
            
            card.appendChild(detailsWrapper);

            if (isLocked) {
                const overlay = document.createElement('div');
                overlay.className = 'lock-overlay';
                overlay.id = `overlay-${productId}`;
                overlay.innerHTML = `<i class="fas fa-lock"></i> Locked`;
                card.appendChild(overlay);
                
                startLockTimer(productId, lockTime);
            } else {
                // Attach click handler only if unlocked
                card.setAttribute('onclick', `handleProductClick(this, '${product.link}', '${product.name}', ${product.rewardCoins}, '${productId}')`);
            }

            productList.appendChild(card);
        }
        
        // --- HANDLE PRODUCT CLICK (Earning Logic - INSTANT) ---
        window.handleProductClick = async function(cardElement, link, productName, coinsToEarn, productId) {
            if (!currentUser) {
                alert("Product reward lene ke liye pehle login karen.");
                profileIconButton.click();
                return;
            }

            if (coinsToEarn <= 0) {
                 alert("Is product ki earning 0 hai.");
                 return;
            }
            
            // 1. Disable card and show processing
            cardElement.style.pointerEvents = 'none';
            cardElement.style.opacity = '0.7';
            
            // 2. Open the product link in a new tab
            window.open(link, '_blank');
            
            // 3. INSTANT COIN ADDITION & LOGGING
            const success = await addCoinsToWallet(currentUser.uid, coinsToEarn, productName, link);
            
            if (success) {
                showSuccessPopup(`✅ ${coinsToEarn.toLocaleString()} Coins aapke Wallet mein fori taur par add kar diye gaye hain!`);
                
                // 4. Apply 1-hour lock
                const unlockTime = Date.now() + LOCK_DURATION_MS;
                await db.collection('user_locks').doc(currentUser.uid).set({
                    [productId]: unlockTime
                }, { merge: true });
                
                // 5. Re-fetch to update UI with lock status
                fetchProductsAndLocks(currentUser.uid);
                
                // 6. Show Warning
                alert(`IMPORTANT WARNING: Aapko ${coinsToEarn.toLocaleString()} Coins mil chuke hain. Agar aap 24 ghante ke andar yeh product nahi kharidte, to aapka account suspended ho jayega.`);
                
            } else {
                alert("Coins add karne mein masla hua.");
                // If transaction failed, re-enable card
                cardElement.style.pointerEvents = 'auto';
                cardElement.style.opacity = '1';
            }
        }
