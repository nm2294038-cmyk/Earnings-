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
        const COIN_TO_PKR_RATE = 5; 
        const PKR_TO_COIN_RATE = 10; 
        const PKR_TO_TIKTOK_RATE = 20; 
        const PKR_TO_YOUTUBE_RATE =50 ; 
        const PKR_TO_INSTAGRAM_RATE = 45; 
        
        // International Currency Rates (PKR required per 1 unit)
        const INT_RATES = {
            USD: { rate: 280, unit: 'USD', balanceField: 'usdBalance', reverseRate: 12 },
            EUR: { rate: 300, unit: 'EUR', balanceField: 'eurBalance', reverseRate: 15 },
            GBP: { rate: 350, unit: 'GBP', balanceField: 'gbpBalance', reverseRate: 20 },
            AED: { rate: 75, unit: 'AED', balanceField: 'aedBalance', reverseRate: 3 },
            SAR: { rate: 70, unit: 'SAR', balanceField: 'sarBalance', reverseRate: 3 },
            JPY: { rate: 2, unit: 'JPY', balanceField: 'jpyBalance', reverseRate: 0.5 }
        };


        // --- DOM ELEMENTS ---
        const authContainer = document.getElementById('authContainer');
        const dashboardContainer = document.getElementById('dashboardContainer');
        const appHeader = document.getElementById('appHeader');
        
        // Auth elements
        const authTitle = document.getElementById('authTitle');
        const authButton = document.getElementById('authButton');
        const toggleText = document.getElementById('toggleText');
        const authNameInput = document.getElementById('authName');
        const authForm = document.getElementById('authForm');
        
        // Dashboard elements
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileUid = document.getElementById('profileUid');
        const profileInitials = document.getElementById('profileInitials');
        const coinsBalance = document.getElementById('coinsBalance');
        const pkrBalance = document.getElementById('pkrBalance');
        const tiktokCoinsBalance = document.getElementById('tiktokCoinsBalance');
        const youtubeCoinsBalance = document.getElementById('youtubeCoinsBalance');
        const instagramCoinsBalance = document.getElementById('instagramCoinsBalance');
        const usdBalance = document.getElementById('usdBalance');
        const eurBalance = document.getElementById('eurBalance');
        const gbpBalance = document.getElementById('gbpBalance');
        const aedBalance = document.getElementById('aedBalance');
        const sarBalance = document.getElementById('sarBalance');
        const jpyBalance = document.getElementById('jpyBalance');
        const logoutButton = document.getElementById('logoutButton');
        
        // Exchange elements (Coins to PKR)
        const coinsToPkrForm = document.getElementById('coinsToPkrForm');
        const exchangeCoinsInput = document.getElementById('exchangeCoins');
        const exchangeResultCoinsToPkr = document.getElementById('exchangeResultCoinsToPkr');
        const exchangeButton = document.getElementById('exchangeButton');

        // Exchange elements (PKR to Coins)
        const pkrToCoinForm = document.getElementById('pkrToCoinForm');
        const pkrAmountInput = document.getElementById('pkrAmount');
        const exchangeResultPkrToCoins = document.getElementById('exchangeResultPkrToCoins');
        const pkrToCoinButton = document.getElementById('pkrToCoinButton');
        
        // Exchange elements (PKR to TikTok Coins)
        const pkrToTiktokForm = document.getElementById('pkrToTiktokForm');
        const pkrAmountTiktokInput = document.getElementById('pkrAmountTiktok');
        const exchangeResultPkrToTiktok = document.getElementById('exchangeResultPkrToTiktok');
        const pkrToTiktokButton = document.getElementById('pkrToTiktokButton');
        
        // Exchange elements (PKR to YouTube Coins)
        const pkrToYoutubeForm = document.getElementById('pkrToYoutubeForm');
        const pkrAmountYoutubeInput = document.getElementById('pkrAmountYoutube');
        const exchangeResultPkrToYoutube = document.getElementById('exchangeResultPkrToYoutube');
        const pkrToYoutubeButton = document.getElementById('pkrToYoutubeButton');
        
        // Exchange elements (PKR to Instagram Coins)
        const pkrToInstagramForm = document.getElementById('pkrToInstagramForm');
        const pkrAmountInstagramInput = document.getElementById('pkrAmountInstagram');
        const exchangeResultPkrToInstagram = document.getElementById('exchangeResultPkrToInstagram');
        const pkrToInstagramButton = document.getElementById('pkrToInstagramButton');
        
        // International Exchange Inputs (PKR -> INT)
        const pkrToUsdForm = document.getElementById('pkrToUsdForm');
        const pkrAmountUsdInput = document.getElementById('pkrAmountUsd');
        const exchangeResultPkrToUsd = document.getElementById('exchangeResultPkrToUsd');
        
        // International Exchange Inputs (INT -> PKR REVERSE)
        const usdToPkrForm = document.getElementById('usdToPkrForm');
        const usdAmountToPkrInput = document.getElementById('usdAmountToPkr');
        const exchangeResultUsdToPkr = document.getElementById('exchangeResultUsdToPkr');
        
        // All other international exchange forms/inputs are also defined here...


        let isSignupMode = false;
        let currentCoins = 0;
        let currentPkr = 0;
        let currentTiktokCoins = 0;
        let currentYoutubeCoins = 0;
        let currentInstagramCoins = 0;
        let currentUsd = 0;
        let currentEur = 0;
        let currentGbp = 0;
        let currentAed = 0;
        let currentSar = 0;
        let currentJpy = 0;
        let currentUser = null;

        // --- PROFILE HELPER ---
        function generateInitials(fullName) {
            if (!fullName) return 'U';
            const parts = fullName.trim().split(/\s+/);
            
            if (parts.length === 1) {
                return parts[0].charAt(0).toUpperCase();
            }
            
            const firstInitial = parts[0].charAt(0).toUpperCase();
            const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
            return firstInitial + lastInitial;
        }

        // --- VIEW MANAGEMENT ---
        function showView(viewId) {
            authContainer.style.display = 'none';
            dashboardContainer.style.display = 'none';
            appHeader.style.display = 'none';

            if (viewId === 'dashboard') {
                dashboardContainer.style.display = 'block';
                appHeader.style.display = 'flex';
                document.querySelector('.main-content').style.alignItems = 'flex-start'; 
            } else {
                authContainer.style.display = 'block';
                document.querySelector('.main-content').style.alignItems = 'center';
            }
        }

        // --- AUTH LOGIC ---
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

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = authNameInput.value.trim();
            const email = document.getElementById('authEmail').value.trim();
            const password = document.getElementById('authPassword').value;

            try {
                if (isSignupMode) {
                    if (!name) {
                        alert("Barah-e-meherbani apna naam darj karen.");
                        return;
                    }
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    
                    await userCredential.user.updateProfile({ displayName: name });

                    // Initialize all balances including new currencies
                    await db.collection('users').doc(userCredential.user.uid).set({ 
                        name: name,
                        email: email,
                        coins: 0,
                        pkrBalance: 0,
                        tiktokCoins: 0,
                        youtubeCoins: 0,
                        instagramCoins: 0,
                        usdBalance: 0,
                        eurBalance: 0,
                        gbpBalance: 0,
                        aedBalance: 0,
                        sarBalance: 0,
                        jpyBalance: 0,
                        uid: userCredential.user.uid
                    });

                    alert("Signup Successful!");

                } else {
                    await auth.signInWithEmailAndPassword(email, password);
                    alert("Login Successful!");
                }
            } catch (error) {
                alert(`Authentication Failed: ${error.message}`);
            }
        });

        logoutButton.addEventListener('click', async () => {
            await auth.signOut();
            alert("Logout Successful.");
        });

        // --- WALLET LISTENER (Real-time) ---
        function listenToWallet(uid) {
            db.collection('users').doc(uid).onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    currentCoins = Number(data.coins) || 0;
                    currentPkr = Number(data.pkrBalance) || 0;
                    currentTiktokCoins = Number(data.tiktokCoins) || 0;
                    currentYoutubeCoins = Number(data.youtubeCoins) || 0;
                    currentInstagramCoins = Number(data.instagramCoins) || 0;
                    currentUsd = Number(data.usdBalance) || 0;
                    currentEur = Number(data.eurBalance) || 0;
                    currentGbp = Number(data.gbpBalance) || 0;
                    currentAed = Number(data.aedBalance) || 0;
                    currentSar = Number(data.sarBalance) || 0;
                    currentJpy = Number(data.jpyBalance) || 0;

                    coinsBalance.textContent = currentCoins.toLocaleString();
                    pkrBalance.textContent = `${currentPkr.toFixed(2)} PKR`;
                    tiktokCoinsBalance.textContent = currentTiktokCoins.toLocaleString();
                    youtubeCoinsBalance.textContent = currentYoutubeCoins.toLocaleString();
                    instagramCoinsBalance.textContent = currentInstagramCoins.toLocaleString();
                    usdBalance.textContent = `${currentUsd.toFixed(2)} USD`;
                    eurBalance.textContent = `${currentEur.toFixed(2)} EUR`;
                    gbpBalance.textContent = `${currentGbp.toFixed(2)} GBP`;
                    aedBalance.textContent = `${currentAed.toFixed(2)} AED`;
                    sarBalance.textContent = `${currentSar.toFixed(2)} SAR`;
                    jpyBalance.textContent = `${currentJpy.toFixed(2)} JPY`;
                } else {
                    // Reset all balances if document is missing
                    coinsBalance.textContent = '0'; pkrBalance.textContent = '0.00 PKR'; tiktokCoinsBalance.textContent = '0';
                    youtubeCoinsBalance.textContent = '0'; instagramCoinsBalance.textContent = '0';
                    usdBalance.textContent = '0.00 USD'; eurBalance.textContent = '0.00 EUR'; gbpBalance.textContent = '0.00 GBP';
                    aedBalance.textContent = '0.00 AED'; sarBalance.textContent = '0.00 SAR'; jpyBalance.textContent = '0.00 JPY';
                    currentCoins = currentPkr = currentTiktokCoins = currentYoutubeCoins = currentInstagramCoins = 0;
                    currentUsd = currentEur = currentGbp = currentAed = currentSar = currentJpy = 0;
                }
            }, error => {
                console.error("Error listening to wallet:", error);
            });
        }

        // --- AUTH CHECK & VIEW RENDER ---
        auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
                const displayName = user.displayName || 'N/A';
                
                profileName.textContent = displayName;
                profileEmail.textContent = user.email;
                profileUid.textContent = user.uid.substring(0, 10) + '...';
                profileInitials.textContent = generateInitials(displayName);

                listenToWallet(user.uid);
                showView('dashboard');
            } else {
                showView('auth');
            }
        });

        // ===================================================
        // --- GENERIC EXCHANGE LOGIC ---
        // ===================================================

        // Generic PKR to Specific Currency Converter
        function setupPkrToCurrencyExchange(formId, inputId, resultId, targetRate, targetField, targetUnit) {
            const form = document.getElementById(formId);
            const input = document.getElementById(inputId);
            const resultDisplay = document.getElementById(resultId);
            const button = form.querySelector('button');

            input.addEventListener('input', () => {
                const pkrToConvert = Number(input.value);
                const isDivisible = pkrToConvert % targetRate === 0;

                if (pkrToConvert >= targetRate && isDivisible) {
                    const receivedAmount = pkrToConvert / targetRate;
                    const displayAmount = targetUnit === 'JPY' || targetUnit === 'Coins' || targetUnit.includes('Coins') ? receivedAmount.toFixed(0) : receivedAmount.toFixed(2);
                    resultDisplay.textContent = `${pkrToConvert.toFixed(2)} PKR = ${displayAmount} ${targetUnit}`;
                    button.disabled = false;
                } else {
                    resultDisplay.textContent = `Minimum ${targetRate} PKR Required (Divisible by ${targetRate})`;
                    button.disabled = true;
                }
            });

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const pkrToConvert = Number(input.value);
                const user = auth.currentUser;

                if (!user || pkrToConvert > currentPkr) {
                    alert("Aapke paas itna PKR balance nahi hai.");
                    return;
                }
                
                const receivedAmount = pkrToConvert / targetRate;

                if (receivedAmount === 0) {
                    alert(`PKR ki miqdar ${targetRate} se kam hai. Koi ${targetUnit} nahi milenge.`);
                    return;
                }

                if (confirm(`Kya aap ${pkrToConvert.toFixed(2)} PKR kharch karke ${receivedAmount.toFixed(2)} ${targetUnit} banana chahte hain?`)) {
                    
                    const userRef = db.collection('users').doc(user.uid);

                    try {
                        await db.runTransaction(async (transaction) => {
                            const userDoc = await transaction.get(userRef);
                            const data = userDoc.data();
                            
                            const newPkrBalance = (data.pkrBalance || 0) - pkrToConvert;
                            const newTargetBalance = (data[targetField] || 0) + receivedAmount;

                            if (newPkrBalance < 0) {
                                throw new Error("Insufficient PKR balance during transaction.");
                            }

                            transaction.update(userRef, {
                                [targetField]: newTargetBalance,
                                pkrBalance: newPkrBalance
                            });
                        });

                        alert(`Conversion Successful! ${receivedAmount.toFixed(2)} ${targetUnit} aapke wallet mein add ho gaye.`);
                        form.reset();
                        resultDisplay.textContent = `0 PKR = 0 ${targetUnit}`;

                    } catch (error) {
                        console.error("Transaction failed:", error);
                        alert(`Conversion failed: ${error.message}.`);
                    }
                }
            });
        }
        
        // Generic International Currency to PKR Converter (Reverse Exchange)
        function setupIntToPkrExchange(formId, inputId, resultId, sourceRate, sourceField, sourceUnit) {
            const form = document.getElementById(formId);
            const input = document.getElementById(inputId);
            const resultDisplay = document.getElementById(resultId);
            const button = form.querySelector('button');

            input.addEventListener('input', () => {
                const sourceAmount = Number(input.value);
                
                // Calculate PKR received: Source Amount / Reverse Rate (PKR per unit)
                const pkrReceived = sourceAmount / sourceRate; 

                if (sourceAmount >= sourceRate) {
                    resultDisplay.textContent = `${sourceAmount.toFixed(2)} ${sourceUnit} = ${pkrReceived.toFixed(2)} PKR`;
                    button.disabled = false;
                } else {
                    resultDisplay.textContent = `Minimum ${sourceRate} ${sourceUnit} Required`;
                    button.disabled = true;
                }
            });

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const sourceAmount = Number(input.value);
                const user = auth.currentUser;
                
                // Get current balance of the source currency dynamically
                const currentSourceBalance = eval(`current${sourceField.charAt(0).toUpperCase() + sourceField.slice(1)}`);

                if (!user || sourceAmount > currentSourceBalance) {
                    alert(`Aapke paas itna ${sourceUnit} balance nahi hai.`);
                    return;
                }
                
                const pkrToReceive = sourceAmount / sourceRate;

                if (pkrToReceive === 0) {
                    alert(`Miqdar ${sourceRate} se kam hai. Koi PKR nahi milenge.`);
                    return;
                }

                if (confirm(`Kya aap ${sourceAmount.toFixed(2)} ${sourceUnit} kharch karke ${pkrToReceive.toFixed(2)} PKR banana chahte hain?`)) {
                    
                    const userRef = db.collection('users').doc(user.uid);

                    try {
                        await db.runTransaction(async (transaction) => {
                            const userDoc = await transaction.get(userRef);
                            const data = userDoc.data();
                            
                            const newSourceBalance = (data[sourceField] || 0) - sourceAmount;
                            const newPkrBalance = (data.pkrBalance || 0) + pkrToReceive;

                            if (newSourceBalance < 0) {
                                throw new Error(`Insufficient ${sourceUnit} balance during transaction.`);
                            }

                            transaction.update(userRef, {
                                [sourceField]: newSourceBalance,
                                pkrBalance: newPkrBalance
                            });
                        });

                        alert(`Conversion Successful! ${pkrToReceive.toFixed(2)} PKR aapke balance mein add ho gaye.`);
                        form.reset();
                        resultDisplay.textContent = `0 ${sourceUnit} = 0.00 PKR`;

                    } catch (error) {
                        console.error("Transaction failed:", error);
                        alert(`Conversion failed: ${error.message}.`);
                    }
                }
            });
        }


        // ===================================================
        // --- INITIALIZE EXCHANGES ---
        // ===================================================

        // --- A. Coins to PKR Exchange ---
        
        exchangeCoinsInput.addEventListener('input', () => {
            const coinsToConvert = Number(exchangeCoinsInput.value);
            const isDivisible = coinsToConvert % COIN_TO_PKR_RATE === 0;

            if (coinsToConvert >= COIN_TO_PKR_RATE && isDivisible) {
                const pkr = coinsToConvert / COIN_TO_PKR_RATE;
                exchangeResultCoinsToPkr.textContent = `${coinsToConvert.toLocaleString()} Coins = ${pkr.toFixed(2)} PKR`;
                exchangeButton.disabled = false;
            } else {
                exchangeResultCoinsToPkr.textContent = `Minimum ${COIN_TO_PKR_RATE} Coins Required (Must be divisible by ${COIN_TO_PKR_RATE})`;
                exchangeButton.disabled = true;
            }
        });

        coinsToPkrForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const coinsToConvert = Number(exchangeCoinsInput.value);
            const user = auth.currentUser;

            if (!user || coinsToConvert > currentCoins) {
                alert("Aapke paas itne coins nahi hain.");
                return;
            }

            const pkrToReceive = coinsToConvert / COIN_TO_PKR_RATE;
            const userRef = db.collection('users').doc(user.uid);

            if (confirm(`Kya aap ${coinsToConvert.toLocaleString()} Coins kharch karke ${pkrToReceive.toFixed(2)} PKR banana chahte hain?`)) {
                try {
                    await db.runTransaction(async (transaction) => {
                        const userDoc = await transaction.get(userRef);
                        const data = userDoc.data();
                        const newCoins = (data.coins || 0) - coinsToConvert;
                        const newPkrBalance = (data.pkrBalance || 0) + pkrToReceive;
                        if (newCoins < 0) throw new Error("Insufficient coins during transaction.");
                        transaction.update(userRef, { coins: newCoins, pkrBalance: newPkrBalance });
                    });

                    alert(`Conversion Successful! ${pkrToReceive.toFixed(2)} PKR aapke withdrawal balance mein add ho gaye.`);
                    coinsToPkrForm.reset();
                    exchangeResultCoinsToPkr.textContent = '0 Coins = 0.00 PKR';

                } catch (error) {
                    console.error("Transaction failed:", error);
                    alert(`Conversion failed: ${error.message}.`);
                }
            }
        });
        
        // --- B. PKR to Main Coins Exchange ---
        setupPkrToCurrencyExchange('pkrToCoinForm', 'pkrAmount', 'exchangeResultPkrToCoins', PKR_TO_COIN_RATE, 'coins', 'Coins');
        
        // --- C. PKR to TikTok Coins Exchange Logic ---
        setupPkrToCurrencyExchange('pkrToTiktokForm', 'pkrAmountTiktok', 'exchangeResultPkrToTiktok', PKR_TO_TIKTOK_RATE, 'tiktokCoins', 'TikTok Coins');
        
        // --- D. PKR to YouTube Coins Exchange Logic ---
        setupPkrToCurrencyExchange('pkrToYoutubeForm', 'pkrAmountYoutube', 'exchangeResultPkrToYoutube', PKR_TO_YOUTUBE_RATE, 'youtubeCoins', 'YouTube Coins');
        
        // --- E. PKR to Instagram Coins Exchange Logic ---
        setupPkrToCurrencyExchange('pkrToInstagramForm', 'pkrAmountInstagram', 'exchangeResultPkrToInstagram', PKR_TO_INSTAGRAM_RATE, 'instagramCoins', 'Instagram Coins');
        
        // --- F. PKR to USD Exchange Logic ---
        setupPkrToCurrencyExchange('pkrToUsdForm', 'pkrAmountUsd', 'exchangeResultPkrToUsd', INT_RATES.USD.rate, INT_RATES.USD.balanceField, INT_RATES.USD.unit);
        
        // --- G. USD to PKR Reverse Exchange Logic ---
        setupIntToPkrExchange('usdToPkrForm', 'usdAmountToPkr', 'exchangeResultUsdToPkr', INT_RATES.USD.reverseRate, INT_RATES.USD.balanceField, INT_RATES.USD.unit);
        
        // --- H. PKR to EUR Exchange Logic ---
        setupPkrToCurrencyExchange('pkrToEurForm', 'pkrAmountEur', 'exchangeResultPkrToEur', INT_RATES.EUR.rate, INT_RATES.EUR.balanceField, INT_RATES.EUR.unit);
        
        // --- I. EUR to PKR Reverse Exchange Logic ---
        setupIntToPkrExchange('eurToPkrForm', 'eurAmountToPkr', 'exchangeResultEurToPkr', INT_RATES.EUR.reverseRate, INT_RATES.EUR.balanceField, INT_RATES.EUR.unit);
        
        // --- J. PKR to GBP Exchange Logic ---
        setupPkrToCurrencyExchange('pkrAmountGbpForm', 'pkrAmountGbp', 'exchangeResultPkrToGbp', INT_RATES.GBP.rate, INT_RATES.GBP.balanceField, INT_RATES.GBP.unit);
        
        // --- K. GBP to PKR Reverse Exchange Logic ---
        setupIntToPkrExchange('gbpToPkrForm', 'gbpAmountToPkr', 'exchangeResultGbpToPkr', INT_RATES.GBP.reverseRate, INT_RATES.GBP.balanceField, INT_RATES.GBP.unit);
        
        // --- L. PKR to AED Exchange Logic ---
        setupPkrToCurrencyExchange('pkrAmountAedForm', 'pkrAmountAed', 'exchangeResultPkrToAed', INT_RATES.AED.rate, INT_RATES.AED.balanceField, INT_RATES.AED.unit);
        
        // --- M. AED to PKR Reverse Exchange Logic ---
        setupIntToPkrExchange('aedToPkrForm', 'aedAmountToPkr', 'exchangeResultAedToPkr', INT_RATES.AED.reverseRate, INT_RATES.AED.balanceField, INT_RATES.AED.unit);
        
        // --- N. PKR to SAR Exchange Logic ---
        setupPkrToCurrencyExchange('pkrAmountSarForm', 'pkrAmountSar', 'exchangeResultPkrToSar', INT_RATES.SAR.rate, INT_RATES.SAR.balanceField, INT_RATES.SAR.unit);
        
        // --- O. SAR to PKR Reverse Exchange Logic ---
        setupIntToPkrExchange('sarToPkrForm', 'sarAmountToPkr', 'exchangeResultSarToPkr', INT_RATES.SAR.reverseRate, INT_RATES.SAR.balanceField, INT_RATES.SAR.unit);
        
        // --- P. PKR to JPY Exchange Logic ---
        setupPkrToCurrencyExchange('pkrAmountJpyForm', 'pkrAmountJpy', 'exchangeResultPkrToJpy', INT_RATES.JPY.rate, INT_RATES.JPY.balanceField, INT_RATES.JPY.unit);
        
        // --- Q. JPY to PKR Reverse Exchange Logic ---
        setupIntToPkrExchange('jpyToPkrForm', 'jpyAmountToPkr', 'exchangeResultJpyToPkr', INT_RATES.JPY.reverseRate, INT_RATES.JPY.balanceField, INT_RATES.JPY.unit);
        
