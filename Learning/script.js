// jQuery Tabs Initialization
$(document).ready(function(){
 if (typeof $.fn.tabs === 'function') { 
    $("ul.tabs").tabs("div.panes > div");
 } else {
    console.warn("jQuery Tools 'tabs' function not found. Tabs feature might not work.");
 }
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDn3w9ruBoM8fj1xPZWe06RU34fNU_QTvQ", 
    authDomain: "pakistanvsindiama.firebaseapp.com",
    projectId: "pakistanvsindiama",
    storageBucket: "pakistanvsindiama.firebasestorage.app",
    messagingSenderId: "1092908411292",
    appId: "1:1092908411292:web:ed74ca3b2162f4b55ec059",
    measurementId: "G-2YKGPMJWEJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app);
const gamesCollection = collection(db, 'games');

const authSection = document.getElementById('auth-section');
const homeSection = document.getElementById('home-section');
const gameSection = document.getElementById('game-section');
const categoryMenuButton = document.getElementById('category-menu-button');
const categoryDropdown = document.getElementById('category-dropdown');
const currentCategoryTitleElement = document.getElementById('current-category-title');
const dashboardGameListContainer = document.getElementById('dashboard-game-list');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const gameTitleElement = document.getElementById('game-title');
const gameIframe = document.getElementById('game-iframe');
const backToHomeButtonGame = document.querySelector('#game-section #back-to-home'); 

const bloggerPostsSection = document.getElementById('blogger-posts-section');
const showBloggerPostsButton = document.getElementById('show-blogger-posts-button');
const bloggerPostsListContainer = document.getElementById('blogger-posts-list-container');
const bloggerPostsListUL = document.getElementById('blogger-posts-list'); 
const bloggerPostIframeContainer = document.getElementById('blogger-post-iframe-container');
const bloggerPostIframe = document.getElementById('blogger-post-iframe');
const backToHomeFromBlogButton = document.getElementById('back-to-home-from-blog');
const backToBlogListButton = document.getElementById('back-to-blog-list-button');

const webInterstitialModal = document.getElementById('web-interstitial-modal');
const webInterstitialCloseButton = document.getElementById('web-interstitial-close-button');

const YOUR_BLOG_URL = "https://www.taleemkidunya.xyz"; 
const MAX_BLOG_POSTS_TO_SHOW = 1000; 
const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/100x75/3a3a5a/e0e0e0?text=No+Image';

const basePath = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/'; 


let allGames = []; 
let currentSelectedCategory = "Show All"; 
const categoriesForMenu = ["Show All","Nazim Mustafa " ,"Despenser", "Anatomy and Physiology", "Applied Science", "Physics", "Chemistry", "Game", "Tools", "News", "11 Class", "12 Class", "Past Paper", "Download APK File"];
const apkDownloadLink = "https://apkpure.com/taleem-ki-dunya/com.taleem.duniya?utm_source=whatsapp&utm_campaign=share&utm_medium=social_network"; 

const INTERSTITIAL_DISPLAY_INTERVAL = 90000; 
let lastInterstitialShowTime = 0;

function safeSetDisplay(element, displayValue) { if (element) element.style.display = displayValue; }
function safeSetTextContent(element, text) { if (element) element.textContent = text; }
function safeSetInnerHTML(element, html) { if (element) element.innerHTML = html; }
function safeSetValue(element, value) { if (element) element.value = value; }

function updateCurrentCategoryTitle(categoryName) {
    if (currentCategoryTitleElement) {
        if (categoryName === "Show All") safeSetInnerHTML(currentCategoryTitleElement, "All Learning Apps & Games");
        else if (categoryName !== "Download APK File") safeSetTextContent(currentCategoryTitleElement, categoryName);
    }
}

function tryShowWebInterstitial(onAdClosedCallback) {
    const now = Date.now();
    if (now - lastInterstitialShowTime < INTERSTITIAL_DISPLAY_INTERVAL) {
        console.log("Web Interstitial: Too soon, skipping.");
        if (onAdClosedCallback) onAdClosedCallback();
        return;
    }

    if (webInterstitialModal && webInterstitialCloseButton) {
        console.log("Showing Web Interstitial Modal");
        webInterstitialModal.style.display = 'flex';
        lastInterstitialShowTime = now;

        webInterstitialCloseButton.disabled = true;
        setTimeout(() => {
            webInterstitialCloseButton.disabled = false;
        }, 2500); 

        const closeHandler = () => {
            hideWebInterstitial();
            if (onAdClosedCallback) onAdClosedCallback();
            webInterstitialCloseButton.removeEventListener('click', closeHandler);
        };
        webInterstitialCloseButton.addEventListener('click', closeHandler);
    } else {
        console.warn("Web interstitial modal or close button not found.");
        if (onAdClosedCallback) onAdClosedCallback(); 
    }
}

function hideWebInterstitial() {
    if (webInterstitialModal) {
        webInterstitialModal.style.display = 'none';
    }
}

function originalNavigateToState(stateTarget, gameData = null, postData = null) {
    let newState = {};
    let newTitle = "Taleem Ki Dunya";
    let newPath = basePath; 

    if (gameSection) gameSection.classList.remove('fullscreen-active');
    document.body.style.overflow = ''; 
    if(gameIframe) { gameIframe.srcdoc = ''; gameIframe.src = 'about:blank'; }
    if(bloggerPostIframe) { bloggerPostIframe.srcdoc = ''; bloggerPostIframe.src = 'about:blank'; }

    safeSetDisplay(authSection, 'none'); 
    safeSetDisplay(homeSection, 'none');
    safeSetDisplay(gameSection, 'none');
    safeSetDisplay(bloggerPostsSection, 'none'); 
    safeSetDisplay(bloggerPostIframeContainer, 'none'); 
    if(bloggerPostsListContainer) safeSetDisplay(bloggerPostsListContainer, 'block');


    switch(stateTarget) {
        case 'home':
            newState = { appSection: 'home' };
            newTitle = "Home - Taleem Ki Dunya";
            safeSetDisplay(homeSection, 'flex');
            updateCurrentCategoryTitle(currentSelectedCategory); 
            document.body.style.overflow = ''; 
            break;
        case 'game': 
            if (gameData && gameData.id) {
                newState = { appSection: 'game', gameId: gameData.id, name: gameData.name || 'Game', htmlCode: gameData.htmlCode || '' };
                newTitle = (gameData.name || 'Game') + " - Game";
                newPath = basePath + '#game/' + gameData.id;
            } else {
                console.warn("Game data missing or invalid for game state.");
                originalNavigateToState('home'); return; 
            }
            break;
        case 'bloglist':
            newState = { appSection: 'bloglist' };
            newTitle = "Blog Posts - Taleem Ki Dunya";
            newPath = basePath + '#bloglist';
            safeSetDisplay(bloggerPostsSection, 'flex');
            if(bloggerPostsListContainer) safeSetDisplay(bloggerPostsListContainer, 'block');
            safeSetDisplay(bloggerPostIframeContainer, 'none');
            if (bloggerPostsListUL && (!bloggerPostsListUL.hasChildNodes() || (bloggerPostsListUL.firstChild && bloggerPostsListUL.firstChild.textContent && bloggerPostsListUL.firstChild.textContent.includes("Loading")))) {
                 fetchAndDisplayBloggerPosts(); 
            }
            document.body.style.overflow = ''; 
            break;
        case 'blogpost':
            if (postData && postData.url) {
                newState = { appSection: 'blogpost', url: postData.url, title: postData.title || 'Blog Post' };
                newTitle = (postData.title || 'Blog Post') + " - Blog Post";
                newPath = basePath + '#blogpost?url=' + encodeURIComponent(postData.url); 
                safeSetDisplay(bloggerPostsSection, 'flex');
                if(bloggerPostsListContainer) safeSetDisplay(bloggerPostsListContainer, 'none');
                safeSetDisplay(bloggerPostIframeContainer, 'flex');
                if(bloggerPostIframe) bloggerPostIframe.src = postData.url;
                document.body.style.overflow = 'hidden'; 
            } else {
                console.warn("Post data missing or invalid for blogpost state.");
                originalNavigateToState('bloglist'); return; 
            }
            break;
        default: 
            newState = { appSection: 'home' };
            safeSetDisplay(homeSection, 'flex');
            document.body.style.overflow = '';
            break;
    }
    
    const currentFullUrl = window.location.pathname + window.location.search + window.location.hash;
    const targetFullUrl = newPath; 

    if (currentFullUrl !== targetFullUrl) { 
        if (history.state && history.state.appSection === newState.appSection && 
            ((newState.appSection === 'game' && history.state.gameId === newState.gameId) || 
             (newState.appSection === 'blogpost' && history.state.url === newState.url) ||
             (newState.appSection !== 'game' && newState.appSection !== 'blogpost' )
            )
        ) { 
            history.replaceState(newState, newTitle, targetFullUrl);
        } else {
            history.pushState(newState, newTitle, targetFullUrl);
        }
    } else if (!history.state && newState.appSection === 'home') { 
        history.replaceState(newState, newTitle, targetFullUrl);
    }
    document.title = newTitle;
    if (categoryDropdown) safeSetDisplay(categoryDropdown, 'none');
}

function proceedToGameDisplay(gameData) {
    if (!gameData || !gameData.id) {
        console.error("Game data missing for proceedToGameDisplay");
        originalNavigateToState('home'); 
        return;
    }
    originalNavigateToState('game', gameData); 

    safeSetDisplay(gameSection, 'flex');
    if (gameSection) gameSection.classList.add('fullscreen-active');
    document.body.style.overflow = 'hidden'; 
    safeSetTextContent(gameTitleElement, gameData.name || 'Game');
    if(gameIframe) gameIframe.srcdoc = gameData.htmlCode || '<p>Error loading game content.</p>';
}

function navigateToState(stateTarget, gameData = null, postData = null) {
    if (stateTarget === 'game' && gameData) {
        tryShowWebInterstitial(() => {
            proceedToGameDisplay(gameData);
        });
    } else if (stateTarget === 'bloglist') { 
         tryShowWebInterstitial(() => {
            originalNavigateToState(stateTarget, gameData, postData);
        });
    }
    else { 
        originalNavigateToState(stateTarget, gameData, postData);
    }
}

function showHomeSectionFunc() { navigateToState('home'); }
function showBloggerPostsView() { navigateToState('bloglist'); }

window.addEventListener('popstate', function(event) {
    if (event.state && event.state.appSection) {
        const section = event.state.appSection;
        const gameDataFromState = (section === 'game' && event.state.gameId) ? { id: event.state.gameId, name: event.state.name, htmlCode: event.state.htmlCode } : null;
        const postDataFromState = (section === 'blogpost' && event.state.url) ? { url: event.state.url, title: event.state.title } : null;

        if (section === 'game' && gameDataFromState) {
            proceedToGameDisplay(gameDataFromState); 
        } else {
            originalNavigateToState(section, gameDataFromState, postDataFromState);
        }
    } else { 
        originalNavigateToState('home'); 
    }
});

function extractFirstImageUrl(htmlContent) {
    if (!htmlContent) return null;
    const match = htmlContent.match(/<\s*img [^>]*src\s*=\s*["']([^"']+)["'][^>]*>/i);
    return match ? match[1] : null;
}

async function fetchAndDisplayBloggerPosts() {
    if (!bloggerPostsListUL) return;
    safeSetInnerHTML(bloggerPostsListUL, '<li>Aapke blog posts load ho rahi hain...</li>');
    const feedUrl = `${YOUR_BLOG_URL.replace(/\/$/, "")}/feeds/posts/default?alt=json&max-results=${MAX_BLOG_POSTS_TO_SHOW}&orderby=published`;
    try {
        const response = await fetch(feedUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}.`);
        const data = await response.json();
        safeSetInnerHTML(bloggerPostsListUL, ''); 
        if (data.feed && data.feed.entry && data.feed.entry.length > 0) {
            data.feed.entry.forEach(post => {
                const postTitle = post.title.$t;
                const fullPostContent = post.content ? post.content.$t : '';
                const firstImageUrl = extractFirstImageUrl(fullPostContent) || PLACEHOLDER_IMAGE_URL;
                let postUrl = ''; 
                if (post.link) { for (let i = 0; i < post.link.length; i++) { if (post.link[i].rel === 'alternate' && post.link[i].type === 'text/html') { postUrl = post.link[i].href; break; } } }
                if (postTitle && postUrl) { 
                    const listItem = document.createElement('li');
                    listItem.setAttribute('data-post-url', postUrl); 
                    listItem.setAttribute('data-post-title', postTitle); 
                    listItem.innerHTML = `<div class="post-list-item-image-container"><img src="${firstImageUrl}" alt="${postTitle}" loading="lazy"/></div><div class="post-list-item-details"><h4 class="post-list-item-title"><a href="${postUrl}" title="${postTitle}" target="_blank">${postTitle}</a></h4></div>`;
                    listItem.addEventListener('click', (event) => {
                        event.preventDefault(); 
                        const clickedListItem = event.currentTarget;
                        originalNavigateToState('blogpost', null, { url: clickedListItem.getAttribute('data-post-url'), title: clickedListItem.getAttribute('data-post-title') });
                    });
                    bloggerPostsListUL.appendChild(listItem);
                }
            });
        } else { safeSetInnerHTML(bloggerPostsListUL, '<li>Koi posts nahi mili.</li>'); }
    } catch (error) { console.error("Blogger posts fetch error:", error); safeSetInnerHTML(bloggerPostsListUL, `<li>Posts load karne mein error.</li>`); }
}

function setupEventListeners() {
    if (categoryMenuButton && categoryDropdown) {
        categoryMenuButton.addEventListener('click', (event) => { 
            event.stopPropagation(); 
            categoryDropdown.style.display = categoryDropdown.style.display === 'block' ? 'none' : 'block'; 
        });
        document.addEventListener('click', (event) => { 
            if (categoryDropdown && categoryDropdown.style.display === 'block' && categoryMenuButton && !categoryMenuButton.contains(event.target) && !categoryDropdown.contains(event.target)) { 
                categoryDropdown.style.display = 'none'; 
            } 
        });
    }
    if(searchButton) searchButton.addEventListener('click', performSearch);
    if(searchInput) searchInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { event.preventDefault(); performSearch(); } });
    if(backToHomeButtonGame) backToHomeButtonGame.addEventListener('click', showHomeSectionFunc); 
    if (showBloggerPostsButton) showBloggerPostsButton.addEventListener('click', showBloggerPostsView);
    if (backToHomeFromBlogButton) backToHomeFromBlogButton.addEventListener('click', showHomeSectionFunc);
    if (backToBlogListButton) { backToBlogListButton.addEventListener('click', () => { if (history.state && history.state.appSection === 'blogpost') { history.back(); } else { navigateToState('bloglist'); } }); }
}

function populateCategoryDropdown() {
    if (!categoryDropdown) return;
    const ul = document.createElement('ul');
    categoriesForMenu.forEach(categoryName => {
        const li = document.createElement('li');
        li.textContent = categoryName;
        if (categoryName === "Download APK File") { 
            li.addEventListener('click', () => { window.open(apkDownloadLink, '_blank'); if(categoryDropdown) safeSetDisplay(categoryDropdown, 'none'); }); 
        } else { 
            li.addEventListener('click', () => { 
                currentSelectedCategory = categoryName; 
                updateCurrentCategoryTitle(categoryName); 
                if(searchInput) safeSetValue(searchInput, ''); 
                displayGamesForCategory(allGames); 
                if(categoryDropdown) safeSetDisplay(categoryDropdown, 'none'); 
            }); 
        }
        ul.appendChild(li);
    });
    safeSetInnerHTML(categoryDropdown, ''); categoryDropdown.appendChild(ul);
}

async function fetchAllGamesAndDisplay() {
    if (!dashboardGameListContainer) return;
    safeSetInnerHTML(dashboardGameListContainer, '<p class="no-items-message">Loading apps & games...</p>');
    try {
        const gamesQuery = query(gamesCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(gamesQuery);
        allGames = []; 
        if (querySnapshot.empty) { safeSetInnerHTML(dashboardGameListContainer, '<p class="no-items-message">No apps & games available.</p>'); } 
        else { 
            querySnapshot.forEach((docSnap) => { 
                allGames.push({ 
                    id: docSnap.id, 
                    name: docSnap.data().name || 'Game', 
                    imageUrl: docSnap.data().imageUrl || PLACEHOLDER_IMAGE_URL,
                    category: docSnap.data().category || '', // Ensure category exists
                    categories: docSnap.data().categories || [] // Ensure categories array exists
                }); 
            }); 
        }
        displayGamesForCategory(allGames); 
    } catch (error) { console.error("Firebase games fetch error: ", error); safeSetInnerHTML(dashboardGameListContainer, '<p class="no-items-message" style="color: red;">Error loading apps/games.</p>'); allGames = []; }
}

function displayGamesForCategory(gamesToFilter) {
    if (!dashboardGameListContainer) return;
    let gamesToShow = [];
    const lowerCatInput = currentSelectedCategory.toLowerCase().trim();
    
    if (lowerCatInput === "show all") { 
        gamesToShow = gamesToFilter; 
    } else {
        gamesToShow = gamesToFilter.filter(game => {
            const gameNameLower = game.name ? game.name.toLowerCase() : '';
            const gameCategoryLower = game.category ? game.category.toLowerCase() : '';
            const gameCategoriesLower = Array.isArray(game.categories) ? game.categories.map(cat => typeof cat === 'string' ? cat.toLowerCase() : '') : [];
            
            return gameNameLower.includes(lowerCatInput) || 
                   gameCategoryLower.includes(lowerCatInput) ||
                   gameCategoriesLower.some(cat => cat.includes(lowerCatInput));
        });
    }
    
    renderGamesToDashboard(gamesToShow);
}

function renderGamesToDashboard(gamesToRender) {
    if (!dashboardGameListContainer) return;
    safeSetInnerHTML(dashboardGameListContainer, ''); 
    if (gamesToRender.length === 0) { safeSetInnerHTML(dashboardGameListContainer, `<p class="no-items-message">No items found in "${currentSelectedCategory === "Show All" ? "All Categories" : currentSelectedCategory}".</p>`); return; }
    gamesToRender.forEach(game => {
        const gameElement = document.createElement('div');
        gameElement.classList.add('game-item');
        gameElement.innerHTML = `<img src="${game.imageUrl}" alt="${game.name || 'Game'}" loading="lazy"/><h3>${game.name || 'Game'}</h3><button class="play-button" data-game-id="${game.id}">Open</button>`;
        dashboardGameListContainer.appendChild(gameElement);
    });
    dashboardGameListContainer.querySelectorAll('.game-item .play-button').forEach(button => { button.addEventListener('click', (event) => loadSelectedGame(event.target.dataset.gameId)); });
}

async function loadSelectedGame(gameId) {
    if (!gameId) { console.error("loadSelectedGame called with undefined gameId"); navigateToState('home'); return; }
    try {
        const docRef = doc(db, 'games', gameId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) { 
            const gameData = docSnap.data(); 
            navigateToState('game', { 
                id: gameId, 
                name: gameData.name || 'Game', 
                htmlCode: gameData.htmlCode || '<p>Error loading game content.</p>' 
            });
        } else { 
            console.warn("Game not found with ID:", gameId);
            navigateToState('home'); 
        } 
    } catch (error) { 
        console.error("Error fetching game details:", error); 
        alert("Error loading game."); 
        navigateToState('home'); 
    } 
}

function performSearch() {
    if(!searchInput) return;
    const searchQuery = searchInput.value.trim().toLowerCase();
    if (searchQuery === '') { 
        currentSelectedCategory = "Show All"; // Reset to show all if search is cleared
        updateCurrentCategoryTitle(currentSelectedCategory);
        displayGamesForCategory(allGames); 
    } else { 
        const filteredGamesFromAll = allGames.filter(game => (game.name && game.name.toLowerCase().includes(searchQuery))); 
        updateCurrentCategoryTitle(`Search: "${searchInput.value.trim()}"`); 
        renderGamesToDashboard(filteredGamesFromAll); 
    }
}

onAuthStateChanged(auth, async (user) => {
    // Your existing auth logic can go here if you implement sign-in/sign-up features
    // For now, it will proceed to initialize the app content
    if (user) {
        console.log("User is signed in:", user.uid);
    } else {
        console.log("User is signed out or not signed in.");
    }

    console.log('App initializing content...');
    if(authSection) safeSetDisplay(authSection, 'none'); // Keep auth hidden by default as per original
    populateCategoryDropdown();
    setupEventListeners();
    await fetchAllGamesAndDisplay(); 

    const currentHash = window.location.hash;
    let navigatedFromHash = false;

    if (currentHash) {
        if (currentHash.startsWith('#game/')) {
            const gameIdFromHash = currentHash.substring('#game/'.length);
            if (gameIdFromHash) { 
                const gameToLoad = allGames.find(g => g.id === gameIdFromHash);
                if (gameToLoad) {
                    // Fetch full game data for htmlCode if not already in allGames
                    const docRef = doc(db, 'games', gameIdFromHash);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const gameData = docSnap.data();
                         proceedToGameDisplay({ id: gameIdFromHash, name: gameData.name || 'Game', htmlCode: gameData.htmlCode || '<p>Error loading game content.</p>' });
                    } else { originalNavigateToState('home'); }
                } else { originalNavigateToState('home'); }
                navigatedFromHash = true; 
            }
        } else if (currentHash === '#bloglist') {
            originalNavigateToState('bloglist');
            navigatedFromHash = true;
        } else if (currentHash.startsWith('#blogpost?url=')) {
            try {
                const urlParams = new URLSearchParams(currentHash.substring(currentHash.indexOf('?') + 1));
                const postUrlInHash = urlParams.get('url');
                if (postUrlInHash) {
                    originalNavigateToState('blogpost', null, {url: decodeURIComponent(postUrlInHash), title: "Blog Post"});
                    navigatedFromHash = true;
                }
            } catch (e) { console.error("Error parsing blogpost hash:", e); }
        }
    }

    if (!navigatedFromHash) {
        if (history.state && history.state.appSection) {
             const { appSection, gameId, name, htmlCode, url, title } = history.state;
             const gameData = gameId ? { id: gameId, name, htmlCode } : null;
             const postData = url ? { url, title } : null;
             originalNavigateToState(appSection, gameData, postData);
        } else {
             originalNavigateToState('home'); 
        }
    }
});
