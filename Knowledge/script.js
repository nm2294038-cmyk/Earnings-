    // ====================================================================
    // 1. FIREBASE CONFIGURATION & CORE STATE
    // ====================================================================
    
    const firebaseConfig = {
      // !!! IMPORTANT: REPLACE WITH YOUR ACTUAL FIREBASE CONFIGURATION !!!
      apiKey: "AIzaSyDNYv9SNUjMAHlaPzfovyYefoBNDgx4Gd4", 
      authDomain: "traffic-exchange-62a58.firebaseapp.com",
      projectId: "traffic-exchange-62a58",
      // Firestore does not require databaseURL, but RTDB does. Since we use Firestore, we omit it.
    };

    // Initialize Firebase
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();
        window.auth = auth;
        window.db = db;
    } else {
        console.error("Firebase SDKs not loaded. Running in local mode only.");
    }

    const USERS_COLLECTION = "users";
    const localStorageKey = 'matchGame_unlockedLevel_v_local';
    
    // Game State Variables
    let currentLevelIndex = -1, selectedItem = null, matchedCount = 0, gameLocked = false;
    let pairsInCurrentLevel = [];
    let audioCtx;
    const totalLevels = 250; 
    const COIN_REWARD = 10;
    const initialRewardLevels = 10; // Give reward for the first 10 levels
    
    // User State Variables
    let currentUser = null;
    let userUnlockedLevel = 1; // Highest level unlocked by the user
    let coinsListener = null; // Firestore listener for coins
    let levelProgressListener = null; // Firestore listener for game progress
    let authMode = 'login';
    
    // ====================================================================
    // 2. LEVEL DATA GENERATION (250 LEVELS)
    // ====================================================================

    // Base data sets for meaningful levels
    let levelConfigs = [
        { pairs: [{ l: 'A', p: '🍎' }, { l: 'B', p: '🎈' }, { l: 'C', p: '🐱' }, { l: 'D', p: '🐶' }, { l: 'E', p: '🐘' }] },
        { pairs: [{ l: 'One', p: '1' }, { l: 'Two', p: '2' }, { l: 'Three', p: '3' }, { l: 'Four', p: '4' }, { l: 'Five', p: '5' }] },
        { pairs: [{ p: 'Red', l: '🟥' }, { p: 'Blue', l: '🟦' }, { p: 'Green', l: '🟩' }, { p: 'Yellow', l: '🟨' }, { p: 'Orange', l: '🟧' }] },
        // Add more base levels or categories here...
    ];

    const dataSets = {
        food: [ ['🍔','Burger'], ['🍕','Pizza'], ['🍣','Sushi'], ['🌮','Taco'], ['🍩','Donut'], ['🍟','Fries'], ['🧀','Cheese'], ['🍞','Bread'], ['🥚','Egg'], ['🥦','Broccoli'], ['🌽','Corn'], ['🥕','Carrot'], ['🍇','Grapes'], ['🍌','Banana'], ['🍓','Strawberry'] ],
        animals: [ ['🦁','Lion'], ['🐯','Tiger'], ['🐻','Bear'], ['🦊','Fox'], ['🐰','Rabbit'], ['🐸','Frog'], ['🐧','Penguin'], ['🦉','Owl'], ['🦋','Butterfly'], ['🐜','Ant'], ['🐝','Bee'], ['🐄','Cow'], ['🐕','Dog'], ['🐈','Cat'], ['🐒','Monkey'] ],
        transport: [ ['🚗','Car'], ['🚌','Bus'], ['✈️','Plane'], ['⛵','Boat'], ['🚲','Bicycle'], ['🚂','Train'], ['🚀','Rocket'], ['🚁','Helicopter'], ['🚢','Ship'], ['🛵','Scooter'], ['🚨','Ambulance'], ['🚔','Police'], ['🚖','Taxi'], ['🚜','Tractor'], ['🚚','Truck'] ],
        emotions: [ ['😃','Happy'], ['😢','Sad'], ['😠','Angry'], ['😱','Fear'], ['🤢','Disgust'], ['😲','Surprise'], ['😴','Tired'], ['😕','Confused'], ['🥰','Love'], ['😷','Sick'], ['😭','Crying'], ['🧐','Thoughtful'], ['🥳','Party'], ['😎','Cool'], ['😇','Angel'] ],
        objects: [ ['📚','Books'], ['✏️','Pencil'], ['📏','Ruler'], ['🔑','Key'], ['✂️','Scissors'], ['🚪','Door'], ['💡','Bulb'], ['⏰','Clock'], ['☎️','Phone'], ['📺','TV'], ['⚽','Ball'], ['🪁','Kite'], ['🧸','Teddy'], ['🎁','Gift'], ['🎉','Pop'] ]
    };

    function shuffleArray(array) { 
        for (let i = array.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; 
        } return array; 
    }

    function generateLevelsFromData(dataArray) {
        let shuffledData = shuffleArray([...dataArray]);
        for (let i = 0; i + 5 <= shuffledData.length; i += 5) {
            const chunk = shuffledData.slice(i, i + 5);
            levelConfigs.push({ pairs: chunk.map(([p, l]) => ({ p, l })) });
        }
    }

    // Generate levels from all data sets
    Object.keys(dataSets).forEach(key => generateLevelsFromData(dataSets[key]));

    // Add unique IDs and structure to existing levels
    levelConfigs = levelConfigs.map((level, index) => ({
        pairs: level.pairs.map((pair, pIndex) => ({
            letter: pair.l || pair.l, // Changed from l/p to letter/picture for clarity
            picture: pair.p || pair.p,
            id: `l${index+1}_p${pIndex+1}`
        }))
    }));
    
    // Fill remaining levels up to 250 with placeholders
    const currentLevelCount = levelConfigs.length;
    for (let i = currentLevelCount; i < totalLevels; i++) {
        const levelNum = i + 1;
        levelConfigs.push({
            pairs: [
                { letter: `L${levelNum} Item 1`, picture: `Placeholder A`, id: `l${levelNum}_p1`},
                { letter: `L${levelNum} Item 2`, picture: `Placeholder B`, id: `l${levelNum}_p2`},
                { letter: `L${levelNum} Item 3`, picture: `Placeholder C`, id: `l${levelNum}_p3`},
                { letter: `L${levelNum} Item 4`, picture: `Placeholder D`, id: `l${levelNum}_p4`},
                { letter: `L${levelNum} Item 5`, picture: `Placeholder E`, id: `l${levelNum}_p5`},
            ]
        });
    }

    // ====================================================================
    // 3. FIREBASE/FIRESTORE INTEGRATION
    // ====================================================================

    function getHighestUnlockedLevel() {
        // Return Firestore progress if logged in, otherwise local storage
        return currentUser ? userUnlockedLevel : parseInt(localStorage.getItem(localStorageKey) || '1', 10);
    }

    async function initializeUserDataDisplay() {
        const coinCountSpan = document.getElementById('coin-count');
        const userMaxLevelDisplay = document.getElementById('user-max-level');

        if (!currentUser || !window.db) {
            // Not logged in mode
            coinCountSpan.textContent = '0';
            userUnlockedLevel = parseInt(localStorage.getItem(localStorageKey) || '1', 10);
            userMaxLevelDisplay.textContent = '1';
            renderLevelSelectScreen();
            return;
        }

        // Clear previous listeners
        if (coinsListener) coinsListener();
        if (levelProgressListener) levelProgressListener();
        
        const userRef = db.collection(USERS_COLLECTION).doc(currentUser.uid);
        
        // Setup listener for user data
        levelProgressListener = userRef.onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                
                // --- Level Progress Update ---
                userUnlockedLevel = data.unlockedLevel || 1;
                userMaxLevelDisplay.textContent = userUnlockedLevel;
                
                // --- Coin/Wallet Update ---
                coinCountSpan.textContent = parseFloat(data.coins || 0).toFixed(0);
            } else {
                // Initialize new user document
                userRef.set({
                    email: currentUser.email,
                    coins: 0,
                    unlockedLevel: 1,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                userUnlockedLevel = 1;
            }
            renderLevelSelectScreen(); // Re-render levels after data sync
        }, error => {
            console.error("Firestore Listener Error:", error);
            // Fallback to local data
            userUnlockedLevel = parseInt(localStorage.getItem(localStorageKey) || '1', 10);
            renderLevelSelectScreen();
        });
    }

    async function unlockLevel(levelNumber) {
        const currentMax = getHighestUnlockedLevel();
        if (levelNumber > currentMax) {
            if (currentUser && window.db) {
                // Logged in: Update Firestore
                const userRef = db.collection(USERS_COLLECTION).doc(currentUser.uid);
                try {
                    await userRef.update({ unlockedLevel: levelNumber });
                } catch (error) {
                    console.error("Error updating level in Firestore:", error);
                }
            } else {
                // Not logged in: Update local storage
                localStorage.setItem(localStorageKey, levelNumber.toString());
                userUnlockedLevel = levelNumber; // Update local state immediately
            }
        }
        // Re-render level screen to show new unlock (though listener does this if logged in)
        if (!currentUser) renderLevelSelectScreen();
    }

    async function addCoins(amount) {
        if (!currentUser || !window.db) return;
        
        const userRef = db.collection(USERS_COLLECTION).doc(currentUser.uid);
        
        // Use transaction to safely update coins
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);
            if (!doc.exists) {
                // Should not happen if data is initialized, but safety check
                transaction.set(userRef, { coins: amount }, { merge: true });
            } else {
                const newCoins = (doc.data().coins || 0) + amount;
                transaction.update(userRef, { coins: newCoins });
            }
        });
    }

    // --- AUTHENTICATION HANDLERS ---
    
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            document.getElementById('auth-form-container').style.display = 'none';
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('user-email-display').textContent = `Logged in as: ${user.email}`;
            document.getElementById('logout-btn').style.display = 'block';
            document.getElementById('wallet-container').style.display = 'flex';
            initializeUserDataDisplay();
        } else {
            currentUser = null;
            document.getElementById('auth-form-container').style.display = 'block';
            document.getElementById('user-info').style.display = 'none';
            document.getElementById('logout-btn').style.display = 'none';
            document.getElementById('wallet-container').style.display = 'none';
            if (levelProgressListener) levelProgressListener(); // Detach listener
            initializeUserDataDisplay(); // Load local storage progress
        }
        closeAuthModal();
    });
    
    function showAuthModal() {
        document.getElementById('auth-modal').style.display = 'flex';
        setAuthMode('login'); 
    }

    function closeAuthModal() {
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('auth-error').textContent = '';
    }
    
    function setAuthMode(mode) {
        authMode = mode;
        document.getElementById('auth-title').textContent = (mode === 'signup' ? "Create Account" : "Log In");
        document.getElementById('auth-submit-btn').textContent = (mode === 'signup' ? "Sign Up" : "Login");
        document.getElementById('switch-text').textContent = (mode === 'signup' ? "Already have an account?" : "Don't have an account?");
        document.getElementById('switch-link').textContent = (mode === 'signup' ? "Login" : "Sign Up");
    }

    function toggleAuthMode() {
        setAuthMode(authMode === 'signup' ? 'login' : 'signup');
    }

    async function handleAuthSubmit() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = document.getElementById('auth-submit-btn');

        if (!email || password.length < 6) {
            document.getElementById('auth-error').textContent = 'Enter valid email & password (min 6 chars).';
            return;
        }

        submitBtn.disabled = true;
        document.getElementById('auth-error').textContent = '';

        try {
            if (authMode === 'signup') {
                await auth.createUserWithEmailAndPassword(email, password);
            } else {
                await auth.signInWithEmailAndPassword(email, password);
            }
        } catch (error) {
            document.getElementById('auth-error').textContent = error.message;
        } finally {
            submitBtn.disabled = false;
        }
    }

    function handleAuthLogout() {
        auth.signOut();
    }
    
    // ====================================================================
    // 4. GAME VIEW AND LOGIC FUNCTIONS
    // ====================================================================

    function initAudio() { 
        if (!audioCtx) { 
            audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
        } 
    }
    function playSound(type) { 
        if (!audioCtx) return; 
        // Simple sound generation (omitted for brevity, assume proper implementation exists)
    }

    function showScreen(screenToShow) { 
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenToShow).classList.add('active');
    }

    function renderLevelSelectScreen() {
        const highestUnlocked = getHighestUnlockedLevel();
        const container = document.getElementById('level-buttons-container');
        container.innerHTML = '';
        
        levelConfigs.forEach((config, index) => {
            const levelNum = index + 1;
            const button = document.createElement('button');
            button.className = 'level-button';
            button.textContent = `${levelNum}`;
            button.dataset.levelIndex = index;
            
            if (levelNum <= highestUnlocked) {
                button.classList.add('unlocked');
                button.addEventListener('click', () => startGame(index));
            } else {
                button.classList.add('locked');
            }
            container.appendChild(button);
        });
    }

    function createItemElement(itemData, type) { 
        const div = document.createElement('div');
        div.className = 'item'; 
        div.dataset.id = itemData.id; 
        div.dataset.type = type; 
        const content = (type === 'letter') ? itemData.letter : itemData.picture;
        div.textContent = content; 
        div.addEventListener('click', handleItemClick); 
        return div; 
    }

    function loadLevelData(levelIndex) { 
        if (levelIndex < 0 || levelIndex >= levelConfigs.length) return false;
        
        currentLevelIndex = levelIndex;
        pairsInCurrentLevel = levelConfigs[currentLevelIndex].pairs;
        selectedItem = null; matchedCount = 0; gameLocked = false;
        
        document.getElementById('letters').innerHTML = '';
        document.getElementById('pictures').innerHTML = '';
        document.getElementById('connector-lines').innerHTML = '';
        document.getElementById('message').textContent = 'Select first item...';
        document.getElementById('level-display').textContent = `Level ${currentLevelIndex + 1}`;
        
        const leftItems = pairsInCurrentLevel.map(p => ({id: p.id, letter: p.letter}));
        const rightItems = pairsInCurrentLevel.map(p => ({id: p.id, picture: p.picture}));
        
        shuffleArray(leftItems).forEach(item => document.getElementById('letters').appendChild(createItemElement(item, 'letter')));
        shuffleArray(rightItems).forEach(item => document.getElementById('pictures').appendChild(createItemElement(item, 'picture')));
        
        return true;
    }

    function startGame(levelIndex) { 
        initAudio();
        if (loadLevelData(levelIndex)) {
            showScreen('game-screen');
        } else {
            goToLevelSelect();
        }
    }

    function getElementCenter(el) { 
        const rect = el.getBoundingClientRect();
        const cRect = document.querySelector('.columns-container').getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - cRect.left, y: rect.top + rect.height / 2 - cRect.top }; 
    }
    
    function drawLine(e1, e2) { 
        const p1 = getElementCenter(e1);
        const p2 = getElementCenter(e2); 
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y); 
        line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y); 
        document.getElementById('connector-lines').appendChild(line); 
    }

    async function handleItemClick(event) { 
        initAudio(); 
        playSound('click'); 
        if (gameLocked) return; 
        const clickedEl = event.target.closest('.item'); 
        if (!clickedEl || clickedEl.classList.contains('matched')) return; 
        
        if (!selectedItem) {
            selectedItem = clickedEl; selectedItem.classList.add('selected'); 
            document.getElementById('message').textContent = `Selected ${clickedEl.textContent}. Find the match!`;
        } else { 
            if (selectedItem === clickedEl || selectedItem.dataset.type === clickedEl.dataset.type) { 
                selectedItem.classList.remove('selected'); selectedItem = null; 
                document.getElementById('message').textContent = 'Select first item...'; 
                return;
            } 
            
            gameLocked = true; 
            
            if (selectedItem.dataset.id === clickedEl.dataset.id) { 
                // Correct Match
                playSound('correct'); 
                selectedItem.classList.remove('selected'); selectedItem.classList.add('matched'); 
                clickedEl.classList.add('matched'); 
                drawLine(selectedItem, clickedEl); 
                matchedCount++; 
                document.getElementById('message').textContent = 'Match! ✨';
                
                selectedItem = null; 
                
                if (matchedCount === pairsInCurrentLevel.length) { 
                    // Level Complete Logic
                    playSound('win'); 
                    
                    const nextLevelNum = currentLevelIndex + 2; 
                    if (nextLevelNum <= totalLevels) {
                        await unlockLevel(nextLevelNum); 
                    }
                    
                    // Coin Reward
                    if (currentUser && (currentLevelIndex + 1) <= initialRewardLevels) {
                        await addCoins(COIN_REWARD);
                        document.getElementById('message').textContent += ` +${COIN_REWARD} Coins! 🪙`;
                    }
                    
                    triggerCelebration(); 
                    document.getElementById('message').textContent = nextLevelNum <= totalLevels ? `Level ${currentLevelIndex + 1} Complete! 🎉` : `All ${totalLevels} levels complete! 🥳`;
                    
                    setTimeout(goToLevelSelect, 3500); 
                } else { 
                    setTimeout(() => { gameLocked = false; document.getElementById('message').textContent = 'Select first item...'; }, 700); 
                } 
            } else { 
                // Incorrect Match
                playSound('incorrect'); 
                document.getElementById('message').textContent = 'Incorrect match 🤔. Try again!';
                selectedItem.classList.add('incorrect'); clickedEl.classList.add('incorrect'); 
                
                setTimeout(() => { 
                    selectedItem?.classList.remove('selected', 'incorrect'); 
                    clickedEl.classList.remove('incorrect'); 
                    selectedItem = null; 
                    document.getElementById('message').textContent = 'Select first item...'; 
                    gameLocked = false; 
                }, 800); 
            } 
        } 
    }

    function triggerCelebration() { 
        const container = document.getElementById('celebration-container');
        container.innerHTML = '';
        for (let i = 0; i < 50; i++) { 
            const c = document.createElement('div');
            c.className = 'confetti'; 
            c.style.left = `${Math.random()*100}vw`; 
            c.style.animationDelay = `${Math.random()*0.5}s`; 
            container.appendChild(c); 
        } 
        container.classList.add('active'); 
        setTimeout(() => container.classList.remove('active'), 3000); 
    }
    
    function goToLevelSelect() {
        showScreen('level-select-screen');
        gameLocked = false;
        renderLevelSelectScreen();
    }
    
    function restartLevel() {
        if (currentLevelIndex !== -1) loadLevelData(currentLevelIndex);
    }
    
    // --- Initial Load ---
    document.addEventListener('DOMContentLoaded', () => { 
        // Attach static events
        document.getElementById('profile-icon').addEventListener('click', showAuthModal);
        document.getElementById('auth-submit-btn').addEventListener('click', handleAuthSubmit);
        
        // Initial rendering depends on auth state (handled by onAuthStateChanged)
        if (!currentUser) {
            renderLevelSelectScreen();
            showScreen('level-select-screen');
        }
        
        // Initialize Audio context on first user interaction
        document.body.addEventListener('click', initAudio, { once: true });
    });
