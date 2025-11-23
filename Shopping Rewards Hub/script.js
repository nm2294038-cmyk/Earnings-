// Make sure to replace YOUR_FIREBASE_API_KEY and other config values with your actual Firebase project configuration.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, getDoc, getDocs, serverTimestamp, where, setDoc, increment, deleteDoc, limit } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
// import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-functions.js"; 

const firebaseConfig = {
  apiKey: "AIzaSyCVZ92FCDOkD2lMYpPAkTTQj-S5uQ46e6k",
  authDomain: "market-8c520.firebaseapp.com",
  databaseURL: "https://market-8c520-default-rtdb.firebaseio.com",
  projectId: "market-8c520",
  storageBucket: "market-8c520.firebasestorage.app",
  messagingSenderId: "684090576997",
  appId: "1:684090576997:web:b9681ed047645a03ba368c",
  measurementId: "G-0BY74WNNF3"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); 
const auth = getAuth(app);
const db = getFirestore(app);
// const functions = getFunctions(app); 

  const userViewMain = document.getElementById('user-view-main');
  const productDetailView = document.getElementById('product-detail-view');
  const orderFormView = document.getElementById('order-form-view');
  const accountView = document.getElementById('account-view');
  const myProductsView = document.getElementById('my-products-view');
  const editProductView = document.getElementById('edit-product-view');
  const sellerApplicationView = document.getElementById('seller-application-view'); // NEW
  const sellerProductsView = document.getElementById('seller-products-view'); 
  const depositView = document.getElementById('deposit-view');
  const withdrawalView = document.getElementById('withdrawal-view');
  const myOrdersView = document.getElementById('my-orders-view');
  const orderDetailUserView = document.getElementById('order-detail-user-view');
  const privacyPolicyView = document.getElementById('privacy-policy-view');
  const aboutUsView = document.getElementById('about-us-view');
  const refundPolicyView = document.getElementById('refund-policy-view');
  const withdrawalPolicyView = document.getElementById('withdrawal-policy-view'); 
  const headerMenuButton = document.getElementById('header-menu-button'); 
  const headerDropdownMenu = document.getElementById('header-dropdown-menu');
  const dropdownPrivacyPolicy = document.getElementById('dropdown-privacy-policy');
  const dropdownAboutUs = document.getElementById('dropdown-about-us');
  const dropdownRefundPolicy = document.getElementById('dropdown-refund-policy');
  const dropdownWithdrawalPolicy = document.getElementById('dropdown-withdrawal-policy'); 
  const dropdownRequestRefund = document.getElementById('dropdown-request-refund'); 
  const dropdownContactSupport = document.getElementById('dropdown-contact-support');
  const productsContainer = document.getElementById('products-container');
  const lightningDealsContainer = document.getElementById('lightning-deals-container');
  const featuredSliderSection = document.getElementById('featured-slider-section');
  const featuredSliderContainer = document.getElementById('featured-slider-container');
  const featuredSliderPrev = document.getElementById('featured-slider-prev');
  const featuredSliderNext = document.getElementById('featured-slider-next');
  const bonusBannerSection = document.getElementById('bonus-banner-section');
  const bonusBannerCtaBtn = document.getElementById('bonus-banner-cta-btn');
  const mainCategoriesNavContainer = document.getElementById('main-categories-nav-container');
  const headerCategoryTabs = document.getElementById('header-category-tabs');
  const loadingMessage = document.getElementById('loading-message');
  const searchInput = document.getElementById('search-input'); 
  const searchButton = document.getElementById('search-button'); 
  
  const backToHomeBtn = document.getElementById('back-to-home'); 
  const headerCartIconDetail = document.getElementById('header-cart-icon-detail');
  const detailProductImageContainer = document.getElementById('detail-product-image-container'); 
  const detailProductSliderDots = document.getElementById('detail-product-slider-dots'); 
  const sliderPrevBtn = document.getElementById('slider-prev-btn');
  const sliderNextBtn = document.getElementById('slider-next-btn');
  const sellerInitialsDisplay = document.getElementById('seller-initials-display'); 
  const detailWishlistBtn = document.getElementById('detail-wishlist-btn');
  const detailWishlistCount = document.getElementById('detail-wishlist-count');
  const detailPageShareBtnTop = document.getElementById('detail-page-share-btn-top');
  const detailProductPriceDisplay = document.getElementById('detail-product-price-display');
  const detailDiscountBanner = document.getElementById('detail-discount-banner');
  const detailDiscountText = document.getElementById('detail-discount-text');
  const detailProductNameMain = document.getElementById('detail-product-name-main');
  
  const detailDeliveryChargeDisplay = document.getElementById('detail-delivery-charge-display'); // NEW: Element reference for Delivery Charge Display

  const productRatingDisplayArea = document.getElementById('product-rating-display-area'); 
  const detailRatingValue = document.getElementById('detail-rating-value'); 
  const detailRatingCount = document.getElementById('detail-rating-count'); 
  const interactiveStarRater = document.getElementById('interactive-star-rater'); 
  const userSelectedRatingDisplay = document.getElementById('user-selected-rating-display'); 

  // Admin Rating Controls (NEW)
  const adminRatingControls = document.getElementById('admin-rating-controls');
  const adminProductRatingInput = document.getElementById('admin-product-rating');
  const adminRatingCountInput = document.getElementById('admin-rating-count');
  const updateProductRatingBtn = document.getElementById('update-product-rating-btn');
  const adminRatingMessage = document.getElementById('admin-rating-message');


  const detailProductSizeValue = document.getElementById('detail-product-size-value');
  const detailProductSizesContainer = document.getElementById('detail-product-sizes-container'); 
  const manualSizeInputContainer = document.getElementById('manual-size-input-container'); 
  const manualSizeInput = document.getElementById('manual-size-input'); 
  const detailProductDescriptionContent = document.getElementById('detail-product-description-content');
  const detailProductCategoryContent = document.getElementById('detail-product-category-content'); // Made clickable
  const detailProductStockContent = document.getElementById('detail-product-stock-content');
  const cheaperElsewhereLink = document.getElementById('cheaper-elsewhere-link');
  const addToCartBtnDetail = document.getElementById('add-to-cart-btn-detail'); 
  const whatsappContactBtn = document.getElementById('whatsapp-contact-btn'); 
  const finalPlaceOrderBtn = document.getElementById('final-place-order-btn');
  
  const backFromOrderFormBtn = document.getElementById('back-from-order-form');
  const orderSummaryItemsDiv = document.getElementById('order-summary-items');
  const orderSummaryTotalItemsCountSpan = document.getElementById('order-summary-total-items-count');
  // const orderSummarySubtotalSpan = document.getElementById('order-summary-subtotal'); // Not in HTML
  // const orderSummaryShippingTotalSpan = document.getElementById('order-summary-shipping-total'); // Not in HTML
  const orderSummaryGrandTotalSpan = document.getElementById('order-summary-grand-total'); // NEW: For grand total

  const orderFormWalletBalanceSpan = document.getElementById('order-form-wallet-balance');
  const orderFormDepositBalanceSpan = document.getElementById('order-form-deposit-balance');
  const orderFormBonusBalanceSpan = document.getElementById('order-form-bonus-balance');
  const orderFormWalletBalanceDetailsDiv = document.getElementById('order-form-wallet-balance-details');
  const orderFormBonusInfoP = document.getElementById('order-form-bonus-info');

  const detailProductColorsContainer = document.getElementById('detail-product-colors-container');
  const colorOptionsWrapper = document.getElementById('color-options-wrapper');


  const customerNameInput = document.getElementById('customer-name');
  const mobileNumberInput = document.getElementById('mobile-number');
  const streetAddressInput = document.getElementById('street-address');
  const countrySelect = document.getElementById('country-select');
  const stateSelect = document.getElementById('state-select');
  const cityInput = document.getElementById('city');
  const postalCodeInput = document.getElementById('postal-code');
  const orderForm = document.getElementById('order-form');
  const orderMessage = document.getElementById('order-message');
  const placeOrderButton = document.getElementById('place-order-button'); 
  const placeOrderCodButton = document.getElementById('place-order-cod-button'); 
  const codUnavailableMessage = document.getElementById('cod-unavailable-message'); 
  const adminPanelAccessBtn = document.getElementById('admin-panel-access-btn');
  const embeddedCartSection = document.getElementById('embedded-cart-section');
  const closeCartEmbeddedBtn = document.getElementById('close-cart-embedded-btn');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartTotalItemsSpan = document.getElementById('cart-total-items');
  // const cartSubtotalPriceSpan = document.getElementById('cart-subtotal-price'); // Not in HTML
  // const cartShippingTotalSpan = document.getElementById('cart-shipping-total'); // Not in HTML
  // const cartShippingInfoDiv = document.getElementById('cart-shipping-info'); // Not in HTML
  // const cartGrandTotalPriceSpan = document.getElementById('cart-grand-total-price'); // Not in HTML
  const proceedToCheckoutBtn = document.getElementById('proceed-to-checkout-btn');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  const cartCountBadge = document.getElementById('cart-count-badge');
  const cartNavItem = document.getElementById('cart-nav-item');
  const backFromAccountBtn = document.getElementById('back-from-account');
  const accountViewTitle = document.getElementById('account-view-title');
  const userInfoSection = document.getElementById('user-info-section');
  const displayUserNameProfile = document.getElementById('display-user-name-profile');
  const displayUserEmailProfile = document.getElementById('display-user-email-profile');
  const displayUserWallet = document.getElementById('display-user-wallet');
  const displayUserDepositBalance = document.getElementById('display-user-deposit-balance');
  const displayUserBonusBalance = document.getElementById('display-user-bonus-balance');
  const logoutButton = document.getElementById('logout-button');
  const myProductsBtn = document.getElementById('my-products-btn');
  const sellerStatusDisplay = document.getElementById('seller-status-display'); // NEW
  const authFormsSection = document.getElementById('auth-forms-section');
  const signupForm = document.getElementById('signup-form');
  const signupNameInput = document.getElementById('signup-name');
  const signupEmailInput = document.getElementById('signup-email');
  const signupPasswordInput = document.getElementById('signup-password');
  const signupMessage = document.getElementById('signup-message');
  const loginForm = document.getElementById('login-form');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const loginFormMessage = document.getElementById('login-form-message');
  const navAccountText = document.getElementById('nav-account-text');
  const withdrawFundsBtn = document.getElementById('withdraw-funds-btn');
  const depositFundsFromAccountBtn = document.getElementById('deposit-funds-from-account-btn');
  const dailyClaimButton = document.getElementById('daily-claim-button');
  const dailyClaimStatus = document.getElementById('daily-claim-status');
  const dailyClaimMessage = document.getElementById('daily-claim-message');
  const dailyClaimWrapper = document.getElementById('daily-claim-wrapper');
  const backFromPrivacyBtn = document.getElementById('back-from-privacy');
  const backFromAboutBtn = document.getElementById('back-from-about');
  const backFromRefundBtn = document.getElementById('back-from-refund');
  const backFromWithdrawalPolicyBtn = document.getElementById('back-from-withdrawal-policy'); 
  const backFromDepositBtn = document.getElementById('back-from-deposit');
  const depositRequestForm = document.getElementById('deposit-request-form');
  const depositNameInput = document.getElementById('deposit-name');
  const depositEmailInput = document.getElementById('deposit-email');
  const depositTransactionIdInput = document.getElementById('deposit-transaction-id');
  const depositPaymentInfoInput = document.getElementById('deposit-payment-info');
  const depositAmountInput = document.getElementById('deposit-amount');
  const submitDepositRequestBtn = document.getElementById('submit-deposit-request-btn');
  const depositRequestMessage = document.getElementById('deposit-request-message');
  const userDepositRequestsList = document.getElementById('user-deposit-requests-list');
  const backFromWithdrawalBtn = document.getElementById('back-from-withdrawal');
  const withdrawalRequestForm = document.getElementById('withdrawal-request-form');
  const withdrawalWalletBalanceSpan = document.getElementById('withdrawal-wallet-balance');
  const withdrawalNameInput = document.getElementById('withdrawal-name');
  const withdrawalEmailInput = document.getElementById('withdrawal-email');
  const withdrawalAccountTypeSelect = document.getElementById('withdrawal-account-type');
  const withdrawalAccountTitleInput = document.getElementById('withdrawal-account-title');
  const withdrawalAccountNumberInput = document.getElementById('withdrawal-account-number');
  const withdrawalIdCardInput = document.getElementById('withdrawal-id-card');
  const withdrawalAmountInput = document.getElementById('withdrawal-amount');
  const submitWithdrawalRequestBtn = document.getElementById('submit-withdrawal-request-btn');
  const withdrawalRequestMessage = document.getElementById('withdrawal-request-message');
  const userWithdrawalRequestsList = document.getElementById('user-withdrawal-requests-list');
  const backFromMyOrdersBtn = document.getElementById('back-from-my-orders');
  const userOrdersListContainer = document.getElementById('user-orders-list-container');
  const backFromOrderDetailUserBtn = document.getElementById('back-from-order-detail-user');
  const userOrderIdDisplay = document.getElementById('user-order-id-display');
  const userOrderTotalDisplay = document.getElementById('user-order-total-display');
  const userOrderDateDisplay = document.getElementById('user-order-date-display');
  const winnerListContainer = document.getElementById('winner-list-container');
  const viewMoreLightningDealsBtn = document.getElementById('view-more-lightning-deals');
  const privacyBackToHomeContentBtn = document.getElementById('privacy-back-to-home-content-btn');
  const aboutBackToHomeContentBtn = document.getElementById('about-back-to-home-content-btn');
  const refundBackToHomeContentBtn = document.getElementById('refund-back-to-home-content-btn');
  const withdrawalPolicyBackToHomeContentBtn = document.getElementById('withdrawal-policy-back-to-home-content-btn'); 
  const viewWithdrawalPolicyLinkFromWithdrawal = document.getElementById('view-withdrawal-policy-link-from-withdrawal');
  
  // My Products View
  const backFromMyProductsBtn = document.getElementById('back-from-my-products');
  const addProductForm = document.getElementById('add-product-form');
  const addProductMessage = document.getElementById('add-product-message');
  const userProductsList = document.getElementById('user-products-list');
  const sellerOrdersList = document.getElementById('seller-orders-list');
  const addImageUrlFieldBtn = document.getElementById('add-image-url-field-btn');
  const imageUrlInputsContainer = document.getElementById('image-url-inputs-container');
  // Removed rating inputs from add product form
  // const newProductAvgRatingInput = document.getElementById('new-product-avg-rating');
  // const newProductNumReviewsInput = document.getElementById('new-product-num-reviews');

  // Edit Product View
  const backFromEditProductBtn = document.getElementById('back-from-edit-product');
  const editProductForm = document.getElementById('edit-product-form');
  const editProductIdInput = document.getElementById('edit-product-id');
  const editImageUrlInputsContainer = document.getElementById('edit-image-url-inputs-container');
  const editAddImageUrlFieldBtn = document.getElementById('edit-add-image-url-field-btn');
  const editProductMessage = document.getElementById('edit-product-message');
  // Removed rating inputs from edit product form
  // const editProductAvgRatingInput = document.getElementById('edit-product-avg-rating');
  // const editProductNumReviewsInput = document.getElementById('edit-product-num-reviews');

  // Seller Application View
  const backFromSellerApplicationBtn = document.getElementById('back-from-seller-application');
  const sellerApplicationForm = document.getElementById('seller-application-form');
  const sellerApplicationMessage = document.getElementById('seller-application-message');

  const backFromSellerProductsBtn = document.getElementById('back-from-seller-products'); 
  const sellerViewName = document.getElementById('seller-view-name'); 
  const sellerProductsContainer = document.getElementById('seller-products-container'); 


  const userJoinCounterContainer = document.getElementById('user-join-counter-container');
  const userJoinCountValueSpan = document.getElementById('user-join-count-value');

  // Referral Program Elements
  const referralProgramCard = document.getElementById('referral-program-card');
  const referralLinkInput = document.getElementById('referral-link-input');
  const copyReferralLinkBtn = document.getElementById('copy-referral-link-btn');
  const referralMessage = document.getElementById('referral-message');

  // NEW: Comment System Elements
  const addCommentForm = document.getElementById('add-comment-form');
  const commentTextInput = document.getElementById('comment-text-input');
  const submitCommentBtn = document.getElementById('submit-comment-btn');
  const commentFormMessage = document.getElementById('comment-form-message');
  const productCommentsList = document.getElementById('product-comments-list');
  let unsubscribeProductComments = null; // Listener for comments

  // NEW: Dynamic Deposit Methods Container
  const dynamicDepositMethodsContainer = document.getElementById('dynamic-deposit-methods-container');


  let allProductsMap = {};
  let currentProductDetail = null;
  let cart = [];
  let currentCategoryFilter = 'For you';
  let currentSearchTerm = '';
  let orderSource = null; 
  let firebaseUser = null;
  let userProfile = null;
  let unsubscribeUserProfileListener = null;
  let unsubscribeDepositRequests = null;
  let unsubscribeDepositMethods = null; // NEW: Unsubscribe for deposit methods
  let unsubscribeWithdrawalRequests = null;
  let unsubscribeUserOrders = null;
  let unsubscribeWinnerAnnouncements = null;
  let unsubscribeProducts = null;
  let unsubscribeUserProducts = null;
  let unsubscribeSellerOrders = null;
  
  let previousViewBeforeAuth = null;
  let previousViewBeforePolicyAbout = null; 

  let productsLoadedFirstTime = false;
  const MEGA_GAME_TICKET_PRODUCT_ID = "MEGA_GAME_TICKET_V1";
  const MIN_WITHDRAWAL_AMOUNT = 150; 
  let isInitialAuthCheckDone = false;
  let lastProcessedHash = window.location.hash;

  let productRatingDisplayClickListener = null;
  let interactiveStarClickListeners = [];
  let currentImageIndex = 0; // For product detail slider
  let featuredSliderIndex = 0; // For new featured slider


  const countryStateData = {
      "Pakistan": ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Gilgit-Baltistan", "Azad Kashmir", "Islamabad Capital Territory"],
      "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"], // Major constituent countries
      "United Arab Emirates": ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"], // The 7 Emirates
      "Saudi Arabia": [
          "Riyadh Province",
          "Makkah Province",
          "Madinah Province",
          "Eastern Province",
          "Qassim Province",
          "Asir Province",
          "Tabuk Province",
          "Hail Province",
          "Northern Borders Province",
          "Jizan Province",
          "Najran Province",
          "Al Baha Province",
          "Al Jawf Province"
      ], // The 13 Provinces
      "Canada": [
          "Alberta",
          "British Columbia",
          "Manitoba",
          "New Brunswick",
          "Newfoundland and Labrador",
          "Nova Scotia",
          "Ontario",
          "Prince Edward Island",
          "Quebec",
          "Saskatchewan",
          "Northwest Territories", // Territories
          "Nunavut",
          "Yukon"
      ] // 10 Provinces and 3 Territories
  };

  // Function to detect mobile devices
  function isMobileDevice() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Function to get initials from a name
  function getInitials(name) {
      if (!name || typeof name !== 'string') return '';
      const parts = name.trim().split(' ').filter(Boolean);
      if (parts.length === 0) return '';
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  window.showView = function(viewId, updateHashBehavior = 'default') {
      document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
      const targetView = document.getElementById(viewId);
      if(targetView) targetView.style.display = 'block';
      else if (userViewMain) userViewMain.style.display = 'block'; 
      window.scrollTo(0,0);

      const bottomNav = document.querySelector('.bottom-nav');
      if (bottomNav) {
            if (viewId === 'user-view-main' || viewId === 'account-view' || viewId === 'my-orders-view' || viewId === 'deposit-view') {
                bottomNav.style.display = 'flex';
            } else {
                bottomNav.style.display = 'none';
            }
      }
      if (viewId !== 'product-detail-view') {
          document.querySelectorAll('#product-detail-view .accordion-content-detail').forEach(content => content.style.maxHeight = null);
          document.querySelectorAll('#product-detail-view .accordion-header-detail .toggle-icon').forEach(icon => {
              icon.classList.remove('fa-chevron-up');
              icon.classList.add('fa-chevron-down');
          });
          // Hide interactive star rater when not on product detail view
          if (interactiveStarRater) interactiveStarRater.style.display = 'none';
      }


      if (headerDropdownMenu && headerDropdownMenu.style.display === 'block') {
            if (event && event.target && headerDropdownMenu.contains(event.target) && ['privacy-policy-view', 'about-us-view', 'refund-policy-view', 'withdrawal-policy-view'].includes(viewId)) { 
            } else if (!['privacy-policy-view', 'about-us-view', 'refund-policy-view', 'withdrawal-policy-view'].includes(viewId)) { 
                headerDropdownMenu.style.display = 'none'; 
            }
      }
      
      if (updateHashBehavior === 'clear' && window.location.hash) {
            history.replaceState(null, null, window.location.pathname + window.location.search); 
      } else if (updateHashBehavior === 'default' && viewId !== 'product-detail-view' && window.location.hash) {
            history.replaceState(null, null, window.location.pathname + window.location.search);
      }
      
      if (firebaseUser && userProfile && !userProfile.isNewOrMissing && !userProfile.errorLoading) {
          if (viewId === 'deposit-view') {
              renderUserDepositRequests();
              renderDepositMethods(); // NEW: Render dynamic deposit methods
          } else if (viewId === 'withdrawal-view') renderUserWithdrawalRequests();
          else if (viewId === 'my-orders-view') renderUserOrders();
          else if (viewId === 'my-products-view' && userProfile.sellerProfile?.status === 'approved') {
              renderUserProducts();
              renderSellerOrders();
          }
      } else if (isInitialAuthCheckDone) { 
            if (viewId === 'deposit-view' && userDepositRequestsList) {
                userDepositRequestsList.innerHTML = '<p style="color:#ccc;">Please log in to see your deposit requests.</p>';
                dynamicDepositMethodsContainer.innerHTML = '<p style="text-align:center; color:#ccc;">Log in to view payment methods.</p>'; // NEW: Message for non-logged-in
            }
            if (viewId === 'withdrawal-view' && userWithdrawalRequestsList) userWithdrawalRequestsList.innerHTML = '<p style="color:#ccc;">Please log in to see your withdrawal requests.</p>';
            if (viewId === 'my-orders-view' && userOrdersListContainer) userOrdersListContainer.innerHTML = '<p style="color:#ccc;">Please log in to view your orders.</p>';
            if (viewId === 'my-products-view') {
              if(userProductsList) userProductsList.innerHTML = '<p style="color:#ccc;">Please log in to manage your products.</p>';
              if(sellerOrdersList) sellerOrdersList.innerHTML = '<p style="color:#ccc;">Please log in to see your orders.</p>';
            }
      }
  }
  window.setActiveNav = function(element) {
      document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
      if (element) element.classList.add('active');
  }
  function getCurrentVisibleViewId() {
      for (const view of document.querySelectorAll('.view-section')) { if (view.style.display === 'block' || view.style.display === 'flex') return view.id; }
      return 'user-view-main'; 
  }

  window.goHomeAndShowForYou = function() { 
      showView('user-view-main', 'clear'); 
      setActiveNav(document.querySelector('.bottom-nav .nav-item[onclick*="goHomeAndShowForYou()"]')); 
      hideEmbeddedCart();
      filterAndRenderProducts('For you'); 
      currentSearchTerm = ''; // Clear search term when going home
      if(searchInput) searchInput.value = ''; // Clear search input
      lastProcessedHash = ''; 
  }
  
  const homeNavItemToUpdate = document.querySelector('.nav-item[onclick*="goHome()"]');
  if (homeNavItemToUpdate) {
      homeNavItemToUpdate.setAttribute('onclick', "goHomeAndShowForYou();");
  }


  onAuthStateChanged(auth, async (user) => {
      if (user) { firebaseUser = user; await loadUserProfile(user.uid); }
      else {
          firebaseUser = null; userProfile = null;
          if (unsubscribeUserProfileListener) unsubscribeUserProfileListener(); unsubscribeUserProfileListener = null;
          if (unsubscribeDepositRequests) unsubscribeDepositRequests(); unsubscribeDepositRequests = null;
          if (unsubscribeDepositMethods) unsubscribeDepositMethods(); unsubscribeDepositMethods = null; // NEW: Unsubscribe deposit methods
          if (unsubscribeWithdrawalRequests) unsubscribeWithdrawalRequests(); unsubscribeWithdrawalRequests = null;
          if (unsubscribeUserOrders) unsubscribeUserOrders(); unsubscribeUserOrders = null;
          if (unsubscribeUserProducts) unsubscribeUserProducts(); unsubscribeUserProducts = null;
          if (unsubscribeSellerOrders) unsubscribeSellerOrders(); unsubscribeSellerOrders = null;
          if (unsubscribeProductComments) unsubscribeProductComments(); unsubscribeProductComments = null; // NEW: Unsubscribe comments
          isInitialAuthCheckDone = true; updateAuthUI();
      }
  });
  async function loadUserProfile(uid) {
      if (unsubscribeUserProfileListener) unsubscribeUserProfileListener();
      const userDocRef = doc(db, "users", uid);
      onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
              userProfile = { uid: docSnap.id, ...docSnap.data() };
              userProfile.walletBalance = Number(userProfile.walletBalance) || 0;
              userProfile.bonusBalance = Number(userProfile.bonusBalance) || 0; 
              userProfile.depositBalance = Number(userProfile.depositBalance) || 0;
              userProfile.sellerProfile = userProfile.sellerProfile || { status: 'not_applied' };
              userProfile.isAdmin = userProfile.isAdmin || false; // Ensure isAdmin is set
              userProfile.isNewOrMissing = false; userProfile.errorLoading = false;
          } else {
              const signupName = firebaseUser?.displayName || (signupNameInput ? signupNameInput.value : "") || "New User";
              const randomBonus = Math.floor(Math.random() * (2999 - 1000 + 1)) + 1000;
              userProfile = {
                  uid,
                  name: signupName,
                  email: firebaseUser?.email,
                  walletBalance: randomBonus, 
                  bonusBalance: randomBonus,   
                  depositBalance: 0,
                  sellerProfile: { status: 'not_applied' },
                  isAdmin: false, // Default to not admin for new users
                  initialBonusDetails: {
                      amount: randomBonus,
                      type: "signup_game_only",
                      message: "only for use Mega Win game no withdrawal and no reall products buy"
                  },
                  isNewOrMissing: true,
                  errorLoading: false,
                  createdAt: serverTimestamp(),
                  lastClaimTimestamp: null
              };
              setDoc(userDocRef, {
                  name: userProfile.name,
                  email: userProfile.email,
                  walletBalance: userProfile.walletBalance,
                  bonusBalance: userProfile.bonusBalance,
                  depositBalance: userProfile.depositBalance,
                  sellerProfile: userProfile.sellerProfile,
                  isAdmin: userProfile.isAdmin, // Save isAdmin status
                  initialBonusDetails: userProfile.initialBonusDetails,
                  createdAt: userProfile.createdAt
              })
                .then(() => {
                   if (userProfile && userProfile.initialBonusDetails && userProfile.initialBonusDetails.message) {
                      showTemporaryMessage(`Bonus PKR ${userProfile.initialBonusDetails.amount}! ${userProfile.initialBonusDetails.message}`, 'success', document.body, 5000);
                   }
                })
                .catch(err => { console.error("Error creating user doc:", err); userProfile.errorLoading = true; });
          }
          isInitialAuthCheckDone = true; updateAuthUI();
      }, (error) => {
          console.error("Error loading user profile:", error);
          userProfile = { uid, name: "Error User", email: "error@example.com", walletBalance: 0, bonusBalance: 0, depositBalance: 0, errorLoading: true, isNewOrMissing: false, isAdmin: false };
          isInitialAuthCheckDone = true; updateAuthUI();
      });
  }
  function updateAuthUI() {
      const isLoggedIn = firebaseUser && userProfile && !userProfile.isNewOrMissing && !userProfile.errorLoading;
      if (userInfoSection) userInfoSection.style.display = isLoggedIn ? 'block' : 'none';
      if (authFormsSection) authFormsSection.style.display = isLoggedIn ? 'none' : (isInitialAuthCheckDone ? 'block' : 'none');
      
      // Referral card visibility
      if (referralProgramCard) {
          referralProgramCard.style.display = isLoggedIn ? 'block' : 'none';
      }
      if (referralLinkInput) {
          referralLinkInput.value = isLoggedIn ? `https://jmscd.blogspot.com/?m=1` : 'Log in to get your link';
      }


      if (isLoggedIn) {
          if (displayUserNameProfile) displayUserNameProfile.textContent = userProfile.name; 
          if (displayUserEmailProfile) displayUserEmailProfile.textContent = userProfile.email;
          
          if (displayUserWallet) displayUserWallet.textContent = (userProfile.walletBalance || 0).toFixed(2);
          if (displayUserDepositBalance) displayUserDepositBalance.textContent = `PKR ${(userProfile.depositBalance || 0).toFixed(2)}`;
          if (displayUserBonusBalance) displayUserBonusBalance.textContent = `PKR ${(userProfile.bonusBalance || 0).toFixed(2)}`;

          if (navAccountText) navAccountText.textContent = userProfile.name.split(' ')[0];
          if (accountViewTitle) accountViewTitle.textContent = "My Account";
          if (adminPanelAccessBtn) adminPanelAccessBtn.style.display = userProfile.isAdmin ? 'flex' : 'none';
          if (myProductsBtn) myProductsBtn.style.display = 'flex';
          if (withdrawFundsBtn) withdrawFundsBtn.style.display = 'flex';
          if (depositFundsFromAccountBtn) depositFundsFromAccountBtn.style.display = 'flex';
          if (dailyClaimButton) dailyClaimButton.style.display = 'flex';

          // Seller status UI
          if (sellerStatusDisplay) {
              const status = userProfile.sellerProfile?.status || 'not_applied';
              let statusText = 'Seller Status: ';
              let statusColor = '#ccc';
              if (status === 'approved') {
                  statusText += 'Approved';
                  statusColor = '#28a745';
              } else if (status === 'pending') {
                  statusText += 'Pending Review';
                  statusColor = '#ffc107';
              } else if (status === 'rejected') {
                  statusText += 'Rejected';
                  statusColor = '#dc3545';
              } else {
                  statusText = 'Click "My Products" to become a seller.';
              }
              sellerStatusDisplay.textContent = statusText;
              sellerStatusDisplay.style.color = statusColor;
              sellerStatusDisplay.style.display = 'block';
          }

      } else {
          if (displayUserWallet) displayUserWallet.textContent = '0.00';
          if (displayUserDepositBalance) displayUserDepositBalance.textContent = 'PKR 0.00';
          if (displayUserBonusBalance) displayUserBonusBalance.textContent = 'PKR 0.00';

          if (navAccountText) navAccountText.textContent = "Account";
          if (accountViewTitle) accountViewTitle.textContent = "Login / Sign Up";
          if (signupForm && isInitialAuthCheckDone) signupForm.reset();
          if (loginForm && isInitialAuthCheckDone) loginForm.reset();
          if (signupMessage) signupMessage.style.display = 'none';
          if (loginFormMessage) loginFormMessage.style.display = 'none';
          if (adminPanelAccessBtn) adminPanelAccessBtn.style.display = 'none';
          if (myProductsBtn) myProductsBtn.style.display = 'none';
          if (sellerStatusDisplay) sellerStatusDisplay.style.display = 'none';
          if (withdrawFundsBtn) withdrawFundsBtn.style.display = 'none';
          if (depositFundsFromAccountBtn) depositFundsFromAccountBtn.style.display = 'none';
          if (dailyClaimButton) dailyClaimButton.style.display = 'none';
      }

      const currentView = getCurrentVisibleViewId();
      if (currentView === 'deposit-view') {
          if (depositNameInput && depositEmailInput) { depositNameInput.value = isLoggedIn ? userProfile.name : ""; depositEmailInput.value = isLoggedIn ? userProfile.email : ""; depositNameInput.readOnly = isLoggedIn; depositEmailInput.readOnly = isLoggedIn; }
          if (submitDepositRequestBtn) submitDepositRequestBtn.disabled = !isLoggedIn;
          if (depositRequestMessage && !isLoggedIn && isInitialAuthCheckDone) showAuthMessage(depositRequestMessage, 'Log in for deposits.', 'warning'); else if (depositRequestMessage) depositRequestMessage.style.display='none';
          if (isLoggedIn) {
              renderUserDepositRequests();
              renderDepositMethods(); // NEW: Render dynamic deposit methods
          } else if (userDepositRequestsList) {
              userDepositRequestsList.innerHTML = '<p style="color:#ccc;">Please log in to see your deposit requests.</p>';
              if(dynamicDepositMethodsContainer) dynamicDepositMethodsContainer.innerHTML = '<p style="text-align:center; color:#ccc;">Log in to view payment methods.</p>'; // NEW: Message for non-logged-in
          }
      }
      if (currentView === 'withdrawal-view') {
            if (withdrawalNameInput && withdrawalEmailInput) { withdrawalNameInput.value = isLoggedIn ? userProfile.name : ""; withdrawalEmailInput.value = isLoggedIn ? userProfile.email : ""; }
          if (withdrawalWalletBalanceSpan) withdrawalWalletBalanceSpan.textContent = isLoggedIn ? (userProfile.depositBalance || 0).toFixed(2) : '0.00'; 
          if (submitWithdrawalRequestBtn) submitWithdrawalRequestBtn.disabled = !isLoggedIn;
          if (withdrawalRequestMessage && !isLoggedIn && isInitialAuthCheckDone) showAuthMessage(withdrawalRequestMessage, 'Log in for withdrawals.', 'warning'); else if (withdrawalRequestMessage) withdrawalRequestMessage.style.display='none';
          if (isLoggedIn) renderUserWithdrawalRequests(); else if (userWithdrawalRequestsList) userWithdrawalRequestsList.innerHTML = '<p style="color:#ccc;">Please log in to see your withdrawal requests.</p>';
      }
      if (currentView === 'my-orders-view') { if (isLoggedIn) renderUserOrders(); else if (userOrdersListContainer) userOrdersListContainer.innerHTML = '<p style="color:#ccc;">Please log in to view your orders.</p>'; }
      if (currentView === 'my-products-view' && isLoggedIn && userProfile.sellerProfile?.status === 'approved') { 
          renderUserProducts();
          renderSellerOrders();
      }
      
      if (currentView === 'order-form-view' && orderFormWalletBalanceSpan && orderFormDepositBalanceSpan && orderFormBonusBalanceSpan && orderFormWalletBalanceDetailsDiv) {
          orderFormWalletBalanceSpan.textContent = (userProfile.walletBalance || 0).toFixed(2);
          orderFormDepositBalanceSpan.textContent = (userProfile.depositBalance || 0).toFixed(2);
          orderFormBonusBalanceSpan.textContent = (userProfile.bonusBalance || 0).toFixed(2);
          orderFormWalletBalanceDetailsDiv.style.display = isLoggedIn ? 'block' : 'none';
      }
      updateDailyClaimUI();
  }
  function showAuthMessage(element, message, type) {
      if(!element) return; element.textContent = message; element.className = `message ${type}`; element.style.display = 'block';
      setTimeout(() => { if(element) element.style.display = 'none'; }, 4000);
  }

  if(signupForm) signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = signupNameInput.value.trim();
      const email = signupEmailInput.value.trim().toLowerCase();
      const password = signupPasswordInput.value;
      if (password.length < 6) { showAuthMessage(signupMessage, 'Password min 6 chars.', 'error'); return; }
      if (!name) { showAuthMessage(signupMessage, 'Enter full name.', 'error'); return; }
      try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          const userDocRef = doc(db, "users", user.uid);
          
          const randomBonus = Math.floor(Math.random() * (2999 - 50 + 1)) + 50;
          await setDoc(userDocRef, {
              uid: user.uid,
              name: name,
              email: user.email,
              walletBalance: randomBonus, 
              bonusBalance: randomBonus,   
              depositBalance: 0,
              sellerProfile: { status: 'not_applied' },          
              isAdmin: false, // Default to false for new signups
              initialBonusDetails: {
                  amount: randomBonus,
                  type: "signup_game_only",
                  message: "only for use Mega Win game no withdrawal and no reall products buy"
                  // You might need to change this message based on your actual bonus terms
              },
              createdAt: serverTimestamp()
          });
          const successMessageText = `Sign up successful! PKR ${randomBonus} bonus. Logging in...`;
          showAuthMessage(signupMessage, successMessageText, 'success');
          
          setTimeout(() => {
              goHomeAndShowForYou(); 
              previousViewBeforeAuth = null;
          }, 2500); 
      } catch (error) {
          let msg = "Sign up failed. Try again.";
          if (error.code === 'auth/email-already-in-use') msg = "Email already registered. Try login.";
          else if (error.code === 'auth/weak-password') msg = "Password too weak.";
          showAuthMessage(signupMessage, msg, 'error');
      }
  });

  if(loginForm) loginForm.addEventListener('submit', async (e) => {
      e.preventDefault(); const email = loginEmailInput.value.trim().toLowerCase(), password = loginPasswordInput.value;
      try { await signInWithEmailAndPassword(auth, email, password); showAuthMessage(loginFormMessage, 'Login successful!', 'success'); setTimeout(() => { goHomeAndShowForYou(); previousViewBeforeAuth = null; }, 1500); }
      catch (error) { showAuthMessage(loginFormMessage, "Invalid email or password.", 'error'); }
  });
  if(logoutButton) logoutButton.addEventListener('click', async () => { try { await signOut(auth); goHomeAndShowForYou(); } catch (error) { alert("Error logging out."); } });
  
  if(backFromAccountBtn) backFromAccountBtn.addEventListener('click', () => {
      goHomeAndShowForYou();
      previousViewBeforeAuth = null;
  });
  
  function setActiveNavBasedOnView(viewId) { 
      let navElement = null;
      if (viewId === 'user-view-main') navElement = document.querySelector('.nav-item[onclick*="goHomeAndShowForYou()"]');
      else if (viewId === 'my-orders-view') navElement = document.getElementById('my-orders-nav-item');
      else if (viewId === 'account-view') navElement = document.getElementById('user-account-nav-item');
      else if (viewId === 'deposit-view') navElement = document.getElementById('deposit-nav-item');
      if (navElement) setActiveNav(navElement); else setActiveNav(document.querySelector('.nav-item[onclick*="goHomeAndShowForYou()"]'));
  }
  window.navigateToAccountView = function() { previousViewBeforeAuth = getCurrentVisibleViewId(); if (['deposit-view', 'withdrawal-view', 'my-orders-view', 'account-view'].includes(previousViewBeforeAuth)) previousViewBeforeAuth = 'user-view-main'; showView('account-view', 'clear'); };
  if(depositFundsFromAccountBtn) depositFundsFromAccountBtn.addEventListener('click', () => { navigateToDepositView(); setActiveNav(document.getElementById('deposit-nav-item')); });
  if (adminPanelAccessBtn) adminPanelAccessBtn.onclick = () => alert("Admin Panel access: This would typically lead to a separate admin interface or login.");
  window.navigateToDepositView = function() { if (!firebaseUser) { alert("Please log in to make a deposit."); navigateToAccountView(); setActiveNav(document.getElementById('user-account-nav-item')); return; } showView('deposit-view', 'clear'); }
  if(withdrawFundsBtn) withdrawFundsBtn.addEventListener('click', () => { if (!firebaseUser) { alert("Please log in to withdraw funds."); navigateToAccountView(); setActiveNav(document.getElementById('user-account-nav-item')); return; } showView('withdrawal-view', 'clear'); });
  
  // Navigation
  // These are the original back arrows. They go to account view.
  if(backFromWithdrawalBtn) backFromWithdrawalBtn.addEventListener('click', () => showView('account-view'));
  window.navigateToMyOrdersView = function() { if (!firebaseUser) { alert("Please log in to see your orders."); navigateToAccountView(); setActiveNav(document.getElementById('user-account-nav-item')); return;} showView('my-orders-view', 'clear'); }
  if(backFromDepositBtn) backFromDepositBtn.addEventListener('click', () => showView('account-view'));
  if(backFromMyOrdersBtn) backFromMyOrdersBtn.addEventListener('click', () => showView('account-view'));
  if(backFromOrderDetailUserBtn) backFromOrderDetailUserBtn.addEventListener('click', () => showView('my-orders-view'));
  
  // My Products Button Logic (NEW)
  if(myProductsBtn) myProductsBtn.addEventListener('click', handleMyProductsClick);
  
  // This is the original back arrow for My Products. It goes to account view.
  if(backFromMyProductsBtn) backFromMyProductsBtn.addEventListener('click', () => showView('account-view'));
  if(backFromEditProductBtn) backFromEditProductBtn.addEventListener('click', () => showView('my-products-view'));
  if(backFromSellerApplicationBtn) backFromSellerApplicationBtn.addEventListener('click', () => showView('account-view'));
  if(backFromSellerProductsBtn) backFromSellerProductsBtn.addEventListener('click', () => showView('product-detail-view'));

  if(backFromPrivacyBtn) backFromPrivacyBtn.addEventListener('click', () => showView(previousViewBeforePolicyAbout || 'user-view-main'));
  if(backFromAboutBtn) backFromAboutBtn.addEventListener('click', () => showView(previousViewBeforePolicyAbout || 'user-view-main'));
  if(backFromRefundBtn) backFromRefundBtn.addEventListener('click', () => showView(previousViewBeforePolicyAbout || 'user-view-main'));
  if(backFromWithdrawalPolicyBtn) backFromWithdrawalPolicyBtn.addEventListener('click', () => showView(previousViewBeforePolicyAbout || 'user-view-main'));

  if(privacyBackToHomeContentBtn) privacyBackToHomeContentBtn.addEventListener('click', goHomeAndShowForYou);
  if(aboutBackToHomeContentBtn) aboutBackToHomeContentBtn.addEventListener('click', goHomeAndShowForYou);
  if(refundBackToHomeContentBtn) refundBackToHomeContentBtn.addEventListener('click', goHomeAndShowForYou);
  if(withdrawalPolicyBackToHomeContentBtn) withdrawalPolicyBackToHomeContentBtn.addEventListener('click', goHomeAndShowForYou); 
  
  if (headerMenuButton) headerMenuButton.addEventListener('click', (event) => { event.stopPropagation(); headerDropdownMenu.style.display = headerDropdownMenu.style.display === 'block' ? 'none' : 'block'; });
  window.addEventListener('click', (event) => { if (headerDropdownMenu && headerDropdownMenu.style.display === 'block') if (!headerMenuButton.contains(event.target) && !headerDropdownMenu.contains(event.target)) headerDropdownMenu.style.display = 'none'; });
  
  const setupDropdownLinkInternal = (element, viewId) => { 
      if (element) element.addEventListener('click', (e) => { 
          e.preventDefault(); 
          previousViewBeforePolicyAbout = getCurrentVisibleViewId(); 
          if (previousViewBeforePolicyAbout === viewId) previousViewBeforePolicyAbout = 'user-view-main'; 
          showView(viewId, 'clear'); 
          if (headerDropdownMenu) headerDropdownMenu.style.display = 'none'; 
      }); 
  };
  setupDropdownLinkInternal(dropdownPrivacyPolicy, 'privacy-policy-view'); 
  setupDropdownLinkInternal(dropdownAboutUs, 'about-us-view'); 
  setupDropdownLinkInternal(dropdownRefundPolicy, 'refund-policy-view');
  setupDropdownLinkInternal(dropdownWithdrawalPolicy, 'withdrawal-policy-view'); 

  if (dropdownRequestRefund) {
      dropdownRequestRefund.addEventListener('click', (e) => {
          e.preventDefault();
          if (headerDropdownMenu) headerDropdownMenu.style.display = 'none'; 

          const nazimWhatsAppNumber = "923435641151"; 
          let userName = "Valued Customer"; 
          let greeting = "Hello Nazim Mustafa,";
          let refundRequestBody = "";

          if (firebaseUser && userProfile && userProfile.name) {
              userName = userProfile.name;
              refundRequestBody = `
I would like to request a refund for product(s) I purchased.

My Name: ${userName}

Reason for Refund:

Thank you.`;
          } else {
              alert("You are not logged in. Please log in to have your name pre-filled for the refund request. You can still proceed to WhatsApp to describe your refund request providing all necessary details manually.");
              refundRequestBody = `
I would like to inquire about a refund.


Thank you.`;
          }

          const fullMessage = `${greeting}\n${refundRequestBody}`;
          const whatsappUrl = `https://wa.me/${nazimWhatsAppNumber}?text=${encodeURIComponent(fullMessage)}`;
          window.open(whatsappUrl, '_blank');
      });
  }

  if (dropdownContactSupport) dropdownContactSupport.addEventListener('click', (e) => { e.preventDefault(); alert("Contact Support:\nPhone: 923435641151\nWhatsApp: Nazim Mustafa 03435641151"); if (headerDropdownMenu) headerDropdownMenu.style.display = 'none'; });

  if (viewWithdrawalPolicyLinkFromWithdrawal) {
      viewWithdrawalPolicyLinkFromWithdrawal.addEventListener('click', (e) => {
          e.preventDefault();
          previousViewBeforePolicyAbout = 'withdrawal-view'; 
          showView('withdrawal-policy-view', 'clear');
      });
  }
  
  // Daily Claim button click for enabled state
  if (dailyClaimButton) {
      dailyClaimButton.addEventListener('click', async () => {
          if (!firebaseUser || !userProfile) {
              return; // Should not happen if updateDailyClaimUI works, but good to have
          }

          // Always open the link when the button is clicked, as per "bounce claims hota jay"
          window.open('https://www.profitableratecpm.com/y8szbcsi?key=1def131c44bbb5dd9a9f4b40199af997', '_blank');

          // Temporarily disable button and show processing message
          dailyClaimButton.disabled = true;
          dailyClaimButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
          dailyClaimStatus.textContent = 'Processing your bonus...';

          try {
              const userDocRef = doc(db, "users", firebaseUser.uid);
              const dailyBonusAmount = 0.00000001000; // The current bonus amount
              
              // Only update balances, remove lastClaimTimestamp update
              await updateDoc(userDocRef, {
                  depositBalance: increment(dailyBonusAmount),
                  walletBalance: increment(dailyBonusAmount)
              });

              showAuthMessage(dailyClaimMessage, `PKR ${dailyBonusAmount} daily deposit bonus claimed!`, "success");
              // Re-enable button after processing
              dailyClaimButton.disabled = false;
              dailyClaimButton.innerHTML = '<i class="fas fa-check-circle"></i>Claim Again  available';
              dailyClaimStatus.textContent = ' bonus available! Click to claim again.';

          } catch (error) {
              console.error("Error during daily claim:", error);
              showAuthMessage(dailyClaimMessage, "Claim failed. Please try again.", "error");
              // Re-enable button if claim fails
              dailyClaimButton.disabled = false;
              dailyClaimButton.innerHTML = '<i class="fas fa-check-circle"></i>PKR 10 deposit Daily Bonus And Withdrawal available';
              dailyClaimStatus.textContent = 'Daily bonus available! Click to claim again.';
          }
      });
  }

  // Remove the dailyClaimWrapper click listener entirely as it's no longer needed
  // if (dailyClaimWrapper) {
  //     dailyClaimWrapper.addEventListener('click', () => {
  //         if (dailyClaimButton.disabled && isMobileDevice()) {
  //             window.open('https://www.profitableratecpm.com/y643ztd3?key=9c3eafe943b2b36916970a9af3e549db  ', '_blank');
  //         }
  //     });
  // }


  function updateDailyClaimUI() {
      if (!dailyClaimButton || !dailyClaimStatus) return;
      
      // Always enable the button and set its default text and status message
      dailyClaimButton.disabled = false;
      dailyClaimStatus.textContent = "Daily bonus available! Click to claim again.";
      dailyClaimButton.innerHTML = '<i class="fas fa-check-circle"></i>PKR 10 deposit Daily Bonus And Withdrawal available';

      // Clear any existing countdown interval if it somehow persists
      if (window.dailyClaimCountdownInterval) {
          clearInterval(window.dailyClaimCountdownInterval);
      }

      // If user is not logged in, set appropriate message and disable
      if (!firebaseUser || !userProfile || userProfile.isNewOrMissing || userProfile.errorLoading) {
          dailyClaimButton.disabled = true;
          dailyClaimStatus.textContent = "Log in for daily bonus.";
          dailyClaimButton.innerHTML = '<i class="fas fa-check-circle"></i>PKR 10 deposit Daily Bonus And Withdrawal available';
      }
  }
  
  // Referral Program Logic
  if (copyReferralLinkBtn) {
      copyReferralLinkBtn.addEventListener('click', () => {
          const link = referralLinkInput.value;
          if (link && link !== 'Log in to get your link') {
              navigator.clipboard.writeText(link).then(() => {
                  showAuthMessage(referralMessage, 'Link copied to clipboard!', 'success');
              }, (err) => {
                  showAuthMessage(referralMessage, 'Failed to copy link.', 'error');
              });
          } else {
              showAuthMessage(referralMessage, 'Please log in to get your link.', 'warning');
          }
      });
  }


  function getFirstImageUrl(p) { return p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : 'https://via.placeholder.com/150x120.png?text=No+Image'; }

  function createLightningDealCard(p) {
      const c=document.createElement('div');
      c.className='product-card-lightning';
      c.dataset.productId=p.id;
      const stockAvailable = p.stock - (p.soldCount || 0);
      const badge = stockAvailable > 0 ? `<div class="only-left">Only ${stockAvailable} left</div>` : '<div class="only-left" style="background-color:red;">Sold Out</div>';
      const soldText = ( (p.soldCount || 0) >=1000?`${((p.soldCount || 0)/1000).toFixed(1)}K+`:(p.soldCount || 0))+` sold`;
      
      let priceHtml = '';
      if (p.originalPrice && p.price < p.originalPrice) {
          priceHtml = `<div class="price" style="font-size:0.9em;">
                         <span style="font-weight: bold; color: #e94560;">PKR ${p.price.toFixed(0)}</span>
                         <del style="margin-left: 5px; color: #aaa; font-size: 0.8em;">PKR ${p.originalPrice.toFixed(0)}</del>
                      </div>`;
      } else {
          priceHtml = `<div class="price">PKR ${p.price.toFixed(0)}</div>`;
      }

      c.innerHTML=`<img src="${getFirstImageUrl(p)}" alt="${p.name}">${badge}<div class="info-bottom">${priceHtml}<div class="sold-count">${soldText}</div></div>`;
      return c;
  }
  function createGridProductCard(p) {
      const c = document.createElement('div');
      c.className = 'grid-product-card';
      c.dataset.productId = p.id;
      
      let priceHtml = '';
      if (p.originalPrice && p.price < p.originalPrice) {
          priceHtml = `<div class="price">
                         <span style="font-weight: bold; color: #e94560;">PKR ${p.price.toFixed(2)}</span>
                         <del style="margin-left: 5px; color: #aaa; font-size: 0.8em;">PKR ${p.originalPrice.toFixed(2)}</del>
                      </div>`;
      } else {
          priceHtml = `<div class="price">PKR ${p.price ? p.price.toFixed(2) : 'N/A'}</div>`;
      }

      // NEW: Rating display in grid card
      const ratingDisplay = p.averageRating !== undefined && p.numberOfReviews !== undefined && p.numberOfReviews > 0
          ? `<div class="rating"><i class="fas fa-star"></i> ${p.averageRating.toFixed(1)} <span>(${p.numberOfReviews})</span></div>`
          : `<div class="rating" style="opacity:0.7;"><i class="far fa-star"></i> <span>No reviews</span></div>`;


      c.innerHTML = `<img src="${getFirstImageUrl(p)}" alt="${p.name}"><div class="info"><div class="name">${p.name}</div>${priceHtml}${ratingDisplay}</div>`;
      c.onclick = () => showProductDetail(p.id);
      return c;
  }

  function renderHeaderCategoryTabs(categories) {
      if(!headerCategoryTabs) return; headerCategoryTabs.innerHTML = '';
      const createTabLink = (catText) => { const a = document.createElement('a'); a.href = "#"; a.textContent = catText; a.onclick = (e) => { e.preventDefault(); currentSearchTerm = ''; if(searchInput) searchInput.value = ''; filterAndRenderProducts(catText); hideEmbeddedCart(); showView('user-view-main', 'clear'); }; headerCategoryTabs.appendChild(a); };
      createTabLink('For you'); categories.forEach(cat => createTabLink(cat));
  }
  function renderMainCategoryNav(categories) {
      if(!mainCategoriesNavContainer) return; mainCategoriesNavContainer.innerHTML = '';
      const createFilterLink = (catKey, catText, iconClass) => { const a = document.createElement('a'); a.href = "#"; a.className = 'category-filter-item'; a.dataset.category = catKey; a.innerHTML = `<i class="${iconClass}"></i> ${catText}`; a.onclick = (e) => { e.preventDefault(); currentSearchTerm = ''; if(searchInput) searchInput.value = ''; filterAndRenderProducts(catKey); hideEmbeddedCart(); showView('user-view-main', 'clear'); }; mainCategoriesNavContainer.appendChild(a); };
      createFilterLink('All', 'All', 'fas fa-th-large'); categories.forEach(cat => createFilterLink(cat, cat, 'fas fa-tag'));
  }

  function filterAndRenderProducts(selectedCategory = currentCategoryFilter) {
      currentCategoryFilter = selectedCategory;
      if(!productsContainer) return;
      productsContainer.innerHTML = '';

      const winnerSectionEl = document.querySelector('.winner-announcement-section');
      const dealsSectionEl = document.querySelector('.deals-section');
      const temuBannerEl = document.querySelector('.temu-tcs-banner');

      const isForYouView = selectedCategory.toLowerCase() === 'for you' && !currentSearchTerm;
      const isSearchResultsView = !!currentSearchTerm;
      const showExtraSections = isForYouView && !isSearchResultsView;
      
      if (featuredSliderSection) featuredSliderSection.style.display = showExtraSections ? 'block' : 'none';
      if (bonusBannerSection) bonusBannerSection.style.display = showExtraSections ? 'block' : 'none';
      if (winnerSectionEl) winnerSectionEl.style.display = showExtraSections ? 'block' : 'none';
      if (dealsSectionEl) dealsSectionEl.style.display = showExtraSections ? 'block' : 'none';
      if (temuBannerEl) temuBannerEl.style.display = showExtraSections ? 'flex' : 'none';
      if (mainCategoriesNavContainer) mainCategoriesNavContainer.style.display = showExtraSections ? 'flex' : 'none';


      let baseProducts = [];
      if (selectedCategory.toLowerCase() === 'all') { 
          baseProducts = Object.values(allProductsMap).filter(p => !p.isMegaGame && !p.isFeatured && !p.isLightningDeal);
      } else if (isSearchResultsView) {
          baseProducts = Object.values(allProductsMap).filter(p => !p.isMegaGame);
      } else if (isForYouView) {
          baseProducts = Object.values(allProductsMap).filter(p => !p.isFeatured && !p.isLightningDeal && !p.isMegaGame);
      } else {
          baseProducts = Object.values(allProductsMap).filter(p => p.category && p.category.toLowerCase() === selectedCategory.toLowerCase() && !p.isFeatured && !p.isLightningDeal && !p.isMegaGame);
      }

      let finalProducts = baseProducts;
      if (currentSearchTerm) {
          finalProducts = baseProducts.filter(p =>
              (p.name.toLowerCase() + (p.category || '').toLowerCase() + (p.description || '').toLowerCase()).includes(currentSearchTerm)
          );
      }
      
      finalProducts.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

      if(headerCategoryTabs) {
          headerCategoryTabs.querySelectorAll('a').forEach(a => {
              if (isSearchResultsView) a.classList.remove('active');
              else if (a.textContent.toLowerCase() === selectedCategory.toLowerCase()) a.classList.add('active');
              else a.classList.remove('active');
          });
      }
      if(mainCategoriesNavContainer && mainCategoriesNavContainer.style.display !== 'none') {
          mainCategoriesNavContainer.querySelectorAll('.category-filter-item').forEach(a => {
              if (a.dataset.category.toLowerCase() === selectedCategory.toLowerCase() && !currentSearchTerm) a.classList.add('active');
              else a.classList.remove('active');
          });
      }

      if (finalProducts.length > 0) {
          finalProducts.forEach(p => productsContainer.appendChild(createGridProductCard(p)));
      } else {
          let msg = 'No products found.';
          if (currentSearchTerm) msg = `No products found for "${currentSearchTerm}".`;
          else if (!isForYouView && selectedCategory.toLowerCase() !== 'all') msg = `No products currently in "${selectedCategory}".`;
          else msg = 'No products available currently.';
          productsContainer.innerHTML = `<p style="text-align:center;grid-column:1/-1;color:#bbb; margin-top:20px;">${msg}</p>`;
      }
  }

  function performSearch() {
      if(searchInput) currentSearchTerm = searchInput.value.trim().toLowerCase();
      filterAndRenderProducts(currentCategoryFilter); 
      hideEmbeddedCart();
      showView('user-view-main', 'clear'); 
  }
  if(searchButton) searchButton.addEventListener('click', performSearch);
  if(searchInput) searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') performSearch(); });
  if(searchInput) searchInput.addEventListener('input', () => {
      if (searchInput.value.trim() === '') {
          currentSearchTerm = '';
          filterAndRenderProducts(currentCategoryFilter); 
      }
  });

  document.querySelectorAll('.accordion-header-detail').forEach(header => {
      const accordionItem = header.closest('.accordion-item-detail');
      if (!accordionItem.classList.contains('link-style')) {
          header.addEventListener('click', () => {
              const content = accordionItem.querySelector('.accordion-content-detail');
              const icon = header.querySelector('.toggle-icon');

              if (content.style.maxHeight) { 
                  content.style.maxHeight = null;
                  icon.classList.remove('fa-chevron-up');
                  icon.classList.add('fa-chevron-down');
              } else { 
                  content.style.maxHeight = content.scrollHeight + "px";
                  icon.classList.remove('fa-chevron-down');
                  icon.classList.add('fa-chevron-up');
              }
          });
      }
  });
  if (cheaperElsewhereLink) cheaperElsewhereLink.addEventListener('click', () => {
      alert('Reporting cheaper price feature: To be implemented. Please contact support via WhatsApp for now.');
  });
  
  // Category click on Product Detail View (NEW)
  if (detailProductCategoryContent) {
      detailProductCategoryContent.addEventListener('click', () => {
          const category = detailProductCategoryContent.textContent.trim();
          if (category && category !== 'N/A') {
              currentSearchTerm = ''; // Clear any active search
              if (searchInput) searchInput.value = ''; // Clear search input
              filterAndRenderProducts(category); // Filter by the clicked category
              goHomeAndShowForYou(); // Navigate to home view
          }
      });
  }

  // --- MODIFIED PRODUCT DETAIL SLIDER LOGIC ---
  function showSlide(index, totalImages) {
      if (!detailProductImageContainer || !detailProductSliderDots) return;
      currentImageIndex = (index + totalImages) % totalImages; // Wrap around
      
      // Move the container
      detailProductImageContainer.style.transform = `translateX(-${currentImageIndex * 100}%)`;

      // Update dots
      detailProductSliderDots.querySelectorAll('.dot').forEach((dot, i) => {
          dot.classList.toggle('active', i === currentImageIndex);
      });
  }
  
  function showProductDetail(productId) {
      const p = allProductsMap[productId];
      if(!p){ goHomeAndShowForYou(); return; }
      currentProductDetail = {...p}; 

      // --- Slider Image Population ---
      if (detailProductImageContainer && detailProductSliderDots) {
          detailProductImageContainer.innerHTML = '';
          detailProductSliderDots.innerHTML = '';
          const imageUrls = (p.imageUrls && p.imageUrls.length > 0) ? p.imageUrls : ['https://via.placeholder.com/300x350.png?text=No+Image'];
          
          imageUrls.forEach((url, index) => {
              // Create image
              const img = document.createElement('img');
              img.src = url;
              img.alt = `${p.name} - Image ${index + 1}`;
              img.className = 'slider-image';
              detailProductImageContainer.appendChild(img);

              // Create dot
              const dot = document.createElement('span');
              dot.className = 'dot';
              dot.dataset.index = index;
              dot.onclick = () => showSlide(index, imageUrls.length);
              detailProductSliderDots.appendChild(dot);
          });
          
          // Set initial state
          showSlide(0, imageUrls.length);

          // Show/hide nav buttons
          if (sliderPrevBtn && sliderNextBtn) {
              const showButtons = imageUrls.length > 1;
              sliderPrevBtn.style.display = showButtons ? 'flex' : 'none';
              sliderNextBtn.style.display = showButtons ? 'flex' : 'none';
          }
      }


      if (sellerInitialsDisplay) {
          if (p.userName && p.userId) {
              sellerInitialsDisplay.textContent = getInitials(p.userName);
              sellerInitialsDisplay.style.display = 'flex';
              sellerInitialsDisplay.onclick = () => showSellerProducts(p.userId, p.userName);
          } else {
              sellerInitialsDisplay.style.display = 'none';
              sellerInitialsDisplay.onclick = null;
          }
      }

      if(detailWishlistCount) detailWishlistCount.textContent = p.wishlistCount || 1975; 
      
      if (detailProductPriceDisplay) {
          if (p.originalPrice && p.price < p.originalPrice) {
              const discount = p.discountPercentage || Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
              detailProductPriceDisplay.innerHTML = `
                  <span style="font-size: 1.8em; font-weight: bold; color: #e94560;">PKR ${p.price.toFixed(2)}</span>
                  <del style="margin-left: 10px; font-size: 1.1em; color: #999;">PKR ${p.originalPrice.toFixed(2)}</del>
                  <span style="margin-left: 10px; font-size: 1em; color: #28a745; font-weight: bold;">(${discount}% off)</span>
              `;
          } else {
              detailProductPriceDisplay.innerHTML = `<span style="font-size: 1.8em; font-weight: bold; color: #222;">PKR ${p.price.toFixed(2)}</span>`;
          }
      }
      
      // Shipping price update: This is already linked to p.discountInfo
      // and updates in real-time due to onSnapshot listener on products.
      // No extra changes needed here, just ensuring p.discountInfo contains
      // the shipping message from the admin panel.
      if(detailDiscountText) detailDiscountText.textContent = p.discountInfo || "Delivery Charge PKR 200 (Default)";
      if(detailDiscountBanner) detailDiscountBanner.style.display = (p.discountInfo && p.discountInfo.trim() !== "") ? 'flex' : 'none'; 

      // Update Delivery Charge Display START
      if(detailDeliveryChargeDisplay) {
          if (p.deliveryCharge !== undefined && p.deliveryCharge > 0) {
              detailDeliveryChargeDisplay.textContent = `Delivery Charge PKR ${p.deliveryCharge.toFixed(2)}`;
              detailDeliveryChargeDisplay.style.display = 'inline-block'; // Ensure it's visible
          } else {
              detailDeliveryChargeDisplay.textContent = 'Free Delivery'; // Set text to 'Free Delivery' if charge is 0
              detailDeliveryChargeDisplay.style.display = 'inline-block'; // Or 'none' if you prefer to hide free delivery tag
          }
      }
      // Update Delivery Charge Display END

      if(detailProductNameMain) detailProductNameMain.textContent = p.name;
      
      // Update rating display (consistent with `averageRating` and `numberOfReviews`)
      if(detailRatingValue) detailRatingValue.textContent = p.averageRating ? p.averageRating.toFixed(1) : (4.9).toFixed(1); 
      if(detailRatingCount) detailRatingCount.textContent = `(${p.numberOfReviews || 9639} Ratings)`; 

      // Hide interactive star rater for sellers (and all users, as sellers cannot rate)
      if (interactiveStarRater) {
          interactiveStarRater.style.display = 'none'; 
          const stars = interactiveStarRater.querySelectorAll('.interactive-star');
          stars.forEach(star => { star.classList.remove('fas'); star.classList.add('far'); });
      }
      if (userSelectedRatingDisplay) userSelectedRatingDisplay.textContent = '';

      // Remove product rating display click listener (if it was added)
      if (productRatingDisplayArea && productRatingDisplayClickListener) {
          productRatingDisplayArea.removeEventListener('click', productRatingDisplayClickListener);
          productRatingDisplayClickListener = null; // Clear the reference
      }
      // Remove interactive star click listeners (if they were added)
      interactiveStarClickListeners.forEach(listener => {
          const starElement = listener.element; 
          if (starElement) starElement.removeEventListener('click', listener.handler);
      });
      interactiveStarClickListeners = []; // Clear the array

      // Admin Rating Controls visibility and population (NEW)
      // Only show if the user is an admin
      if (adminRatingControls) {
          if (userProfile && userProfile.isAdmin) {
              adminRatingControls.style.display = 'block';
              // Use p.averageRating and p.numberOfReviews for consistency
              if (adminProductRatingInput) adminProductRatingInput.value = p.averageRating || '';
              if (adminRatingCountInput) adminRatingCountInput.value = p.numberOfReviews || '';
          } else {
              adminRatingControls.style.display = 'none';
          }
      }

      // --- Size Options Logic ---
      if (detailProductSizesContainer) {
          detailProductSizesContainer.innerHTML = '';
          detailProductSizesContainer.style.display = 'none';
      }
      if (manualSizeInputContainer) manualSizeInputContainer.style.display = 'none';
      if (manualSizeInput) manualSizeInput.value = '';

      let hasPredefinedSizes = p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0;

      if (hasPredefinedSizes) {
          currentProductDetail.selectedSize = (p.size && p.sizes.includes(p.size)) ? p.size : p.sizes[0];
          if (detailProductSizeValue) detailProductSizeValue.textContent = currentProductDetail.selectedSize;

          if (detailProductSizesContainer) {
              detailProductSizesContainer.style.display = 'block';
              const sizeLabel = document.createElement('div');
              sizeLabel.textContent = "Select Size:";
              sizeLabel.className = 'size-label';
              detailProductSizesContainer.appendChild(sizeLabel);

              const sizeOptionsWrapper = document.createElement('div');
              sizeOptionsWrapper.className = 'size-options-wrapper';

              p.sizes.forEach(size => {
                  const sizeButton = document.createElement('button');
                  sizeButton.textContent = size;
                  sizeButton.className = 'size-option-btn';
                  sizeButton.dataset.size = size;
                  if (size === currentProductDetail.selectedSize) {
                      sizeButton.classList.add('selected');
                  }
                  sizeButton.onclick = () => {
                      currentProductDetail.selectedSize = size;
                      if(detailProductSizeValue) detailProductSizeValue.textContent = size;
                      detailProductSizesContainer.querySelectorAll('.size-option-btn').forEach(btn => btn.classList.remove('selected'));
                      sizeButton.classList.add('selected');
                      if (manualSizeInputContainer) manualSizeInputContainer.style.display = 'none';
                      if (manualSizeInput) manualSizeInput.value = '';
                  };
                  sizeOptionsWrapper.appendChild(sizeButton);
              });
              
              const otherSizeButton = document.createElement('button');
              otherSizeButton.textContent = "Other";
              otherSizeButton.className = 'size-option-btn';
              otherSizeButton.dataset.size = "Other";
              otherSizeButton.onclick = () => {
                  currentProductDetail.selectedSize = "Other"; 
                  if(detailProductSizeValue) detailProductSizeValue.textContent = "Other (Specify)";
                  detailProductSizesContainer.querySelectorAll('.size-option-btn').forEach(btn => btn.classList.remove('selected'));
                  otherSizeButton.classList.add('selected');
                  if (manualSizeInputContainer) manualSizeInputContainer.style.display = 'block';
                  if (manualSizeInput) manualSizeInput.focus();
              };
              sizeOptionsWrapper.appendChild(otherSizeButton);

              detailProductSizesContainer.appendChild(sizeOptionsWrapper);
          }
      } else if (p.allowManualSizeEntry === true) { 
            if (manualSizeInputContainer) manualSizeInputContainer.style.display = 'block';
            currentProductDetail.selectedSize = "Other"; 
            if (detailProductSizeValue) detailProductSizeValue.textContent = "Custom (Specify)";
            if (manualSizeInput) manualSizeInput.focus();
      } else { 
          currentProductDetail.selectedSize = p.size || "Unstitched"; 
          if (detailProductSizeValue) detailProductSizeValue.textContent = currentProductDetail.selectedSize;
      }

      // --- Colors Options Logic (NEW) ---
      if (detailProductColorsContainer) {
          detailProductColorsContainer.innerHTML = ''; // Clear previous colors
          detailProductColorsContainer.style.display = 'none'; // Hide by default
      }

      if (colorOptionsWrapper) {
          colorOptionsWrapper.innerHTML = '';
      }

      let hasColors = p.colors && Array.isArray(p.colors) && p.colors.length > 0;

      if (hasColors && detailProductColorsContainer) {
          currentProductDetail.selectedColor = p.colors[0]; // Select the first color by default

          detailProductColorsContainer.style.display = 'block';
          const colorLabel = document.createElement('span');
          colorLabel.textContent = "Select Color:";
          colorLabel.className = 'color-label';
          detailProductColorsContainer.appendChild(colorLabel);

          const newColorOptionsWrapper = document.createElement('div');
          newColorOptionsWrapper.className = 'color-options-wrapper';

          p.colors.forEach(color => {
              const colorButton = document.createElement('button');
              colorButton.textContent = color;
              colorButton.className = 'color-option-btn';
              colorButton.dataset.color = color;
              if (color === currentProductDetail.selectedColor) {
                  colorButton.classList.add('selected');
              }
              colorButton.onclick = () => {
                  currentProductDetail.selectedColor = color;
                  newColorOptionsWrapper.querySelectorAll('.color-option-btn').forEach(btn => btn.classList.remove('selected'));
                  colorButton.classList.add('selected');
              };
              newColorOptionsWrapper.appendChild(colorButton);
          });
          detailProductColorsContainer.appendChild(newColorOptionsWrapper);
      } else {
          currentProductDetail.selectedColor = null; // No colors available
      }


      if(detailProductDescriptionContent) detailProductDescriptionContent.innerHTML = p.description ? p.description.replace(/\n/g, '<br>') : "No description available.";
      if(detailProductCategoryContent) detailProductCategoryContent.textContent = p.category || 'N/A';
      
      const initialTotalStock = p.stock; 
      const remainingCurrentStock = p.stock - (p.soldCount || 0); 

      if(detailProductStockContent) {
          if (remainingCurrentStock > 0) {
              detailProductStockContent.textContent = `Pehly ${initialTotalStock} thy, ab ${remainingCurrentStock} reh gye hain.`;
              detailProductStockContent.style.color = '#28a745'; 
          } else {
              detailProductStockContent.textContent = `Pehly ${initialTotalStock} thy, ab Out of Stock!`;
              detailProductStockContent.style.color = '#dc3545'; 
          }
      }
      
      const isMegaGame = p.isMegaGame || p.id === MEGA_GAME_TICKET_PRODUCT_ID;
      if(finalPlaceOrderBtn) {
          finalPlaceOrderBtn.textContent = isMegaGame ? "Buy Game Ticket" : "Place Order";
          finalPlaceOrderBtn.disabled = remainingCurrentStock <= 0; 
      }
      if(addToCartBtnDetail) { 
          addToCartBtnDetail.disabled = remainingCurrentStock <= 0; 
      }
      if(whatsappContactBtn) {
          whatsappContactBtn.disabled = remainingCurrentStock <= 0;
      }

      showView('product-detail-view', false); 
      if (window.location.hash !== `#product=${productId}`) {
            window.location.hash = `product=${productId}`;
      }
      hideEmbeddedCart();

      // NEW: Render comments for the opened product
      renderProductComments(productId);
  }
  
  if(sliderPrevBtn) sliderPrevBtn.addEventListener('click', () => showSlide(currentImageIndex - 1, detailProductImageContainer.children.length));
  if(sliderNextBtn) sliderNextBtn.addEventListener('click', () => showSlide(currentImageIndex + 1, detailProductImageContainer.children.length));

  if(backToHomeBtn) backToHomeBtn.onclick = goHomeAndShowForYou;
  if(headerCartIconDetail) headerCartIconDetail.onclick = () => { goHomeAndShowForYou(); setTimeout(toggleEmbeddedCart, 100); };


  if (whatsappContactBtn) {
      whatsappContactBtn.addEventListener('click', () => {
          if (!currentProductDetail) {
              alert("Product details not loaded yet.");
              return;
          }

          let sellerNumber = (currentProductDetail.whatsappNumber || "03435641151").replace(/[^0-9]/g, '');
          
          if (sellerNumber.startsWith('0')) {
              sellerNumber = '92' + sellerNumber.substring(1);
          } else if (!sellerNumber.startsWith('92')) {
              sellerNumber = '92' + sellerNumber;
          }

          const productName = currentProductDetail.name;
          const productUrl = `${window.location.origin}${window.location.pathname}#product=${currentProductDetail.id}`;

          const message = `Hello, I'd like more details about this product:\n\n*${productName}*\n${productUrl}`;
          
          const whatsappUrl = `https://wa.me/${sellerNumber}?text=${encodeURIComponent(message)}`;

          window.open(whatsappUrl, '_blank');
      });
  }

  if(detailWishlistBtn) detailWishlistBtn.addEventListener('click', () => {
      const heartIcon = detailWishlistBtn.querySelector('i');
      heartIcon.classList.toggle('far'); 
      heartIcon.classList.toggle('fas'); 
      heartIcon.classList.toggle('active'); 
      alert("Wishlist functionality: To be implemented.");
  });

  // Admin Rating Update Logic (NEW)
  if (updateProductRatingBtn) {
      updateProductRatingBtn.addEventListener('click', async () => {
          if (!firebaseUser || !userProfile || !userProfile.isAdmin) {
              showTemporaryMessage(adminRatingMessage, "You are not authorized to update ratings.", "error"); // Changed to showTemporaryMessage
              return;
          }
          if (!currentProductDetail || !currentProductDetail.id) {
              showTemporaryMessage(adminRatingMessage, "No product selected.", "error"); // Changed to showTemporaryMessage
              return;
          }

          const newRating = parseFloat(adminProductRatingInput.value);
          const newRatingCount = parseInt(adminRatingCountInput.value);

          if (isNaN(newRating) || newRating < 0 || newRating > 5) {
              showTemporaryMessage(adminRatingMessage, "Average Rating must be between 0 and 5.", "error"); // Changed to showTemporaryMessage
              return;
          }
          if (isNaN(newRatingCount) || newRatingCount < 0) {
              showTemporaryMessage(adminRatingMessage, "Number of Reviews must be a non-negative number.", "error"); // Changed to showTemporaryMessage
              return;
          }

          updateProductRatingBtn.disabled = true;
          updateProductRatingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

          try {
              const productRef = doc(db, 'products', currentProductDetail.id);
              await updateDoc(productRef, {
                  averageRating: newRating, // Consistent field name
                  numberOfReviews: newRatingCount // Consistent field name
              });
              showTemporaryMessage(adminRatingMessage, "Product rating updated successfully!", "success"); // Changed to showTemporaryMessage
          } catch (error) {
              console.error("Error updating product rating:", error);
              showTemporaryMessage("Failed to update rating. " + error.message, "error"); // Changed to showTemporaryMessage
          } finally {
              updateProductRatingBtn.disabled = false;
              updateProductRatingBtn.innerHTML = '<i class="fas fa-magic"></i> Update Product Rating';
          }
      });
  }


  function loadCart(){ const storedCart = localStorage.getItem('shoppingCart'); cart = storedCart ? JSON.parse(storedCart) : []; updateCartUI(); }
  function saveCart(){ localStorage.setItem('shoppingCart',JSON.stringify(cart)); }
  function updateCartCountBadge(){ const total=cart.reduce((s,i)=>s+i.quantity,0); if(cartCountBadge){cartCountBadge.textContent=total; cartCountBadge.style.display=total>0?'block':'none';} }
  window.toggleEmbeddedCart = function() { if (!embeddedCartSection) return; const isCartVisible = embeddedCartSection.style.display === 'block'; if (isCartVisible) { hideEmbeddedCart(); setActiveNavBasedOnView(getCurrentVisibleViewId()); } else { if (userViewMain.style.display === 'block') { showEmbeddedCart(); setActiveNav(cartNavItem); } else alert("Cart can only be viewed from the Home screen in this layout."); } }
  function showEmbeddedCart() { if (embeddedCartSection) { embeddedCartSection.style.display = 'block'; updateCartUI(); } }
  window.hideEmbeddedCart = function() { if (embeddedCartSection) embeddedCartSection.style.display = 'none'; }
  if(closeCartEmbeddedBtn) closeCartEmbeddedBtn.onclick = () => { hideEmbeddedCart(); setActiveNavBasedOnView(getCurrentVisibleViewId()); };
  
  function showTemporaryMessage(message, type, parentElement = document.body, duration = 3000) {
      const msgDiv = document.createElement('div');
      msgDiv.textContent = message;
      msgDiv.style.position = 'fixed';
      msgDiv.style.bottom = '70px'; 
      msgDiv.style.left = '50%';
      msgDiv.style.transform = 'translateX(-50%)';
      msgDiv.style.padding = '10px 20px';
      msgDiv.style.borderRadius = '5px';
      msgDiv.style.zIndex = '2000';
      msgDiv.style.transition = 'opacity 0.5s ease-out';
      if (type === 'success') {
          msgDiv.style.backgroundColor = '#28a745'; 
          msgDiv.style.color = 'white';
      } else if (type === 'error') {
          msgDiv.style.backgroundColor = '#dc3545'; 
          msgDiv.style.color = 'white';
      } else { 
          msgDiv.style.backgroundColor = '#4f4f7a'; 
          msgDiv.style.color = 'white';
      }
      parentElement.appendChild(msgDiv);
      setTimeout(() => {
          msgDiv.style.opacity = '0';
          setTimeout(() => {
              msgDiv.remove();
          }, 500);
      }, duration - 500);
  }

  function addItemToCart(productId) {
      if (!allProductsMap[productId]) {
          showTemporaryMessage("Product not found!", "error", document.body);
          return;
      }
      const product = allProductsMap[productId];
      const stockAvailable = product.stock - (product.soldCount || 0);

      if (stockAvailable <= 0) {
          showTemporaryMessage(`${product.name} is out of stock!`, "error", document.body);
          return;
      }
      
      let finalSelectedSize = "Unstitched"; 
      if (currentProductDetail && currentProductDetail.id === productId) {
          if (currentProductDetail.selectedSize === "Other") {
              finalSelectedSize = manualSizeInput && manualSizeInput.value.trim() !== "" ? manualSizeInput.value.trim() : "Other (Not Specified)";
              if (finalSelectedSize === "Other (Not Specified)") {
                  showTemporaryMessage("Please specify your size in the 'Other' input field.", "warning", document.body);
                  return;
              }
          } else {
              finalSelectedSize = currentProductDetail.selectedSize;
          }
      } else { 
            finalSelectedSize = (product.sizes && product.sizes.length > 0 ? product.sizes[0] : (product.size || "Unstitched"));
      }

      // Get selected color for cart item
      let finalSelectedColor = null;
      if (currentProductDetail && currentProductDetail.id === productId && currentProductDetail.selectedColor) {
          finalSelectedColor = currentProductDetail.selectedColor;
      } else if (product.colors && product.colors.length > 0) {
          finalSelectedColor = product.colors[0]; // Default to first color if no specific selection was made on detail page
      }


      const existingItemIndex = cart.findIndex(item => 
          item.productId === productId && 
          item.selectedSize === finalSelectedSize && 
          item.selectedColor === finalSelectedColor
      );

      if (existingItemIndex > -1) {
          if (cart[existingItemIndex].quantity < stockAvailable) {
              cart[existingItemIndex].quantity++;
          } else {
              showTemporaryMessage(`Max stock for ${product.name} (Size: ${finalSelectedSize}, Color: ${finalSelectedColor || 'N/A'}) reached in cart.`, "warning", document.body, 2500);
              return;
          }
      } else {
          cart.push({
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: 1,
              imageUrl: getFirstImageUrl(product),
              selectedSize: finalSelectedSize, 
              selectedColor: finalSelectedColor, // Add selected color to cart item
              isFeatured: product.isFeatured || false,
              deliveryCharge: product.deliveryCharge || 0 // NEW: Add delivery charge to cart item
          });
      }
      updateCartUI();
      showTemporaryMessage(`${product.name} (Size: ${finalSelectedSize}, Color: ${finalSelectedColor || 'N/A'}) added to cart!`, "success", document.body);
        if (embeddedCartSection.style.display !== 'block' && getCurrentVisibleViewId() === 'user-view-main') {
            showEmbeddedCart();
            setActiveNav(cartNavItem);
        }
  }

  if (addToCartBtnDetail) {
      addToCartBtnDetail.addEventListener('click', () => {
          if (currentProductDetail) {
              addItemToCart(currentProductDetail.id);
          }
      });
  }

  function updateCartUI(){
      if(!cartItemsContainer || !emptyCartMessage || !proceedToCheckoutBtn || !cartTotalItemsSpan || !orderSummaryGrandTotalSpan) return; // Simplified check
      
      cartItemsContainer.innerHTML=''; 
      let totalItems=0, subtotalPrice=0, totalShipping=0; 
      
      emptyCartMessage.style.display = cart.length === 0 ? 'block' : 'none'; 
      proceedToCheckoutBtn.disabled = cart.length === 0;

      cart.sort((a,b)=>a.name.localeCompare(b.name)).forEach(item=>{ 
          const sizeDisplay = item.selectedSize ? ` (Size: ${item.selectedSize})` : '';
          const colorDisplay = item.selectedColor ? ` (Color: ${item.selectedColor})` : ''; 
          const itemDiv=document.createElement('div'); 
          itemDiv.className='cart-item'; 
          itemDiv.innerHTML=`<img src="${item.imageUrl}" alt="${item.name}">
                           <div class="cart-item-details">
                             <div class="name">${item.name}${sizeDisplay}${colorDisplay}</div> 
                             <div class="price">PKR ${(item.price * item.quantity).toFixed(2)} (PKR ${item.price.toFixed(2)} each)</div>
                             <div class="cart-item-controls">
                               <button class="decrease-quantity" data-id="${item.productId}" data-size="${item.selectedSize}" data-color="${item.selectedColor || ''}">-</button>
                               <input type="number" value="${item.quantity}" min="1" data-id="${item.productId}" data-size="${item.selectedSize}" data-color="${item.selectedColor || ''}" class="item-quantity-input">
                               <button class="increase-quantity" data-id="${item.productId}" data-size="${item.selectedSize}" data-color="${item.selectedColor || ''}">+</button>
                               <button class="remove-item" data-id="${item.productId}" data-size="${item.selectedSize}" data-color="${item.selectedColor || ''}"><i class="fas fa-trash"></i></button>
                             </div>
                           </div>`; 
          cartItemsContainer.appendChild(itemDiv); 
          
          totalItems += item.quantity; 
          subtotalPrice += item.price * item.quantity; 
          totalShipping += (item.deliveryCharge || 0); // NEW: Sum shipping for each item
      });

      // These are not present in the HTML, so comment them out or remove if not adding them.
      // if (cart.length > 0) {
      //      cartShippingInfoDiv.style.display = 'flex';
      // } else {
      //      cartShippingInfoDiv.style.display = 'none';
      //      totalShipping = 0; // Reset shipping if cart is empty
      // }

      const grandTotalPrice = subtotalPrice + totalShipping;

      cartTotalItemsSpan.textContent = totalItems; 
      // cartSubtotalPriceSpan.textContent = `PKR ${subtotalPrice.toFixed(2)}`; // Not in HTML
      // cartShippingTotalSpan.textContent = `PKR ${totalShipping.toFixed(2)}`; // Not in HTML
      if (document.getElementById('cart-total-price')) document.getElementById('cart-total-price').textContent = `PKR ${grandTotalPrice.toFixed(2)}`;
      updateCartCountBadge(); 
      saveCart();
  }
  if(cartItemsContainer) cartItemsContainer.addEventListener('click', (e)=>{ 
      const target = e.target; 
      const button = target.closest('button'); 
      if(!button) return; 
      const productId = button.dataset.id; 
      const productSize = button.dataset.size;
      const productColor = button.dataset.color || null; 
      if(!productId) return; 
      const itemIndex = cart.findIndex(item=>
          item.productId===productId && 
          item.selectedSize === productSize && 
          item.selectedColor === productColor 
      ); 
      if(itemIndex === -1) return; 
      const productData = allProductsMap[productId]; 
      const maxStock = productData ? productData.stock - (productData.soldCount || 0) : 0; 
      if(button.classList.contains('increase-quantity')){ if(cart[itemIndex].quantity < maxStock) cart[itemIndex].quantity++; else showTemporaryMessage(`Max stock for ${product.name} (Size: ${item.selectedSize}, Color: ${item.selectedColor || 'N/A'}) reached in cart.`, "warning", document.body, 2500); } 
      else if (button.classList.contains('decrease-quantity')){ if(cart[itemIndex].quantity > 1) cart[itemIndex].quantity--; else if (confirm(`Remove ${cart[itemIndex].name} (Size: ${cart[itemIndex].selectedSize}, Color: ${cart[itemIndex].selectedColor || 'N/A'}) from cart?`)) cart.splice(itemIndex, 1); } 
      else if (button.classList.contains('remove-item')){ if(confirm(`Remove ${cart[itemIndex].name} (Size: ${cart[itemIndex].selectedSize}, Color: ${cart[itemIndex].selectedColor || 'N/A'}) from cart?`)) cart.splice(itemIndex, 1); } 
      updateCartUI(); 
  });
  if(cartItemsContainer) cartItemsContainer.addEventListener('change', (e)=>{ 
      const target = e.target; 
      if(target.classList.contains('item-quantity-input')){ 
          const productId = target.dataset.id; 
          const productSize = target.dataset.size;
          const productColor = target.dataset.color || null; 
          let newQuantity = parseInt(target.value); 
          const itemIndex = cart.findIndex(item => 
              item.productId === productId && 
              item.selectedSize === productSize && 
              item.selectedColor === productColor 
          ); 
          if(itemIndex === -1) return; 
          const productData = allProductsMap[productId]; 
          const maxStock = productData ? productData.stock - (productData.soldCount || 0) : 0; 
          if(isNaN(newQuantity) || newQuantity < 1) newQuantity = 1; 
          if(newQuantity > maxStock){ newQuantity = maxStock; if(maxStock > 0) showTemporaryMessage(`Max stock is ${maxQuantity}.`, 'warning', document.body); else showTemporaryMessage('Product is out of stock.','error',document.body);} 
          if(maxStock === 0 && newQuantity > 0) cart.splice(itemIndex, 1); 
          else if (cart[itemIndex]) cart[itemIndex].quantity = newQuantity; 
          updateCartUI(); 
      } 
  });
  
  if(finalPlaceOrderBtn) finalPlaceOrderBtn.onclick = () => {
        if(!currentProductDetail) return;
        prepareOrderForm('direct'); 
  };


  function populateCountries() { 
      if (!countrySelect) return; 
      countrySelect.innerHTML = '<option value="">-- Select Country --</option>'; 
      Object.keys(countryStateData).sort().forEach(country => countrySelect.add(new Option(country, country))); 
      
      // If there's a stored country from a previous session, select it
      const storedCountry = localStorage.getItem('lastSelectedCountry');
      if (storedCountry && countryStateData[storedCountry]) {
          countrySelect.value = storedCountry;
          populateStates(storedCountry, localStorage.getItem('lastSelectedState'));
      } else {
          // Default to Pakistan if no stored country or stored country is invalid
          if (countryStateData["Pakistan"]) {
              countrySelect.value = "Pakistan";
              populateStates("Pakistan");
          }
      }
  }

  function populateStates(selectedCountry, selectedState = null) {
      if (!stateSelect) return;
      stateSelect.innerHTML = '<option value="">-- Select State/Province --</option>'; 
      stateSelect.disabled = true; 

      if (selectedCountry && countryStateData[selectedCountry] && countryStateData[selectedCountry].length > 0) { 
          stateSelect.disabled = false; 
          countryStateData[selectedCountry].forEach(state => stateSelect.add(new Option(state, state))); 
          if (selectedState && countryStateData[selectedCountry].includes(selectedState)) {
              stateSelect.value = selectedState;
          }
      }
  }

  if (countrySelect) countrySelect.addEventListener('change', () => { 
      populateStates(countrySelect.value);
      localStorage.setItem('lastSelectedCountry', countrySelect.value);
      localStorage.removeItem('lastSelectedState'); // Reset state when country changes
  });

  if (stateSelect) stateSelect.addEventListener('change', () => {
      localStorage.setItem('lastSelectedState', stateSelect.value);
  });

  // Call populateCountries on load
  populateCountries();
  
  function prepareOrderForm(source) {
      if(!firebaseUser || !userProfile){ showTemporaryMessage("Please sign up or log in to proceed.", 'error'); navigateToAccountView(); setActiveNav(document.getElementById('user-account-nav-item')); return; }
      
      let itemsForOrder = [], subtotalProducts = 0, totalShipping = 0; 
      let orderContainsNonFeaturedProduct = false; 

      if (source === 'direct' && currentProductDetail) { 
          if ((currentProductDetail.stock - (currentProductDetail.soldCount || 0)) <= 0) { showTemporaryMessage('This product is out of stock.', 'error'); return; } 
          
          let finalSelectedSize = "Unstitched";
          if (currentProductDetail.selectedSize === "Other") {
              finalSelectedSize = manualSizeInput && manualSizeInput.value.trim() !== "" ? manualSizeInput.value.trim() : "Other (Not Specified)";
              if (finalSelectedSize === "Other (Not Specified)") {
                  showTemporaryMessage("Please specify your size in the 'Other' input field.", "warning");
                  return; 
              }
          } else {
              finalSelectedSize = currentProductDetail.selectedSize;
          }

          let finalSelectedColor = null; 
          if (currentProductDetail.selectedColor) { 
              finalSelectedColor = currentProductDetail.selectedColor;
          } else if (currentProductDetail.colors && currentProductDetail.colors.length > 0) {
              finalSelectedColor = currentProductDetail.colors[0]; 
          }

          itemsForOrder.push({ 
              ...currentProductDetail, 
              productId: currentProductDetail.id, 
              imageUrl: getFirstImageUrl(currentProductDetail), 
              quantity: 1, 
              price: currentProductDetail.price, 
              selectedSize: finalSelectedSize,
              selectedColor: finalSelectedColor, 
              isFeatured: currentProductDetail.isFeatured || false,
              deliveryCharge: currentProductDetail.deliveryCharge || 0 // Include delivery charge
          }); 
          subtotalProducts = currentProductDetail.price; 
          totalShipping = currentProductDetail.deliveryCharge || 0; // Add this product's shipping to total
          if (!currentProductDetail.isFeatured) orderContainsNonFeaturedProduct = true;

      } else if (source === 'cart' && cart.length > 0) { 
          itemsForOrder = [...cart]; 
          subtotalProducts = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0); 
          totalShipping = cart.reduce((sum, item) => sum + (item.deliveryCharge || 0), 0); // Sum shipping from cart items
          orderContainsNonFeaturedProduct = itemsForOrder.some(item => item.isFeatured);
      } else { 
          showTemporaryMessage(source === 'cart' ? 'Your cart is empty!' : 'No product selected!', 'warning'); 
          return; 
      }

      const grandTotal = subtotalProducts + totalShipping; 

      orderSource = source; 
      // Auto-fill address from user profile if available
      if (customerNameInput && userProfile) customerNameInput.value = userProfile.name || "";
      
      if (userProfile && userProfile.shippingAddress) {
          mobileNumberInput.value = userProfile.shippingAddress.mobile || '';
          streetAddressInput.value = userProfile.shippingAddress.street || '';
          countrySelect.value = userProfile.shippingAddress.country || '';
          populateStates(userProfile.shippingAddress.country || '', userProfile.shippingAddress.state || ''); // Populate states based on saved country
          cityInput.value = userProfile.shippingAddress.city || '';
          postalCodeInput.value = userProfile.shippingAddress.postalAddress || ''; // Corrected property name for postal code
      } else {
          populateCountries(); 
      }


      if (orderSummaryItemsDiv) {
          orderSummaryItemsDiv.innerHTML = ''; 
          itemsForOrder.forEach(item => { 
              const itemP = document.createElement('p'); 
              const sizeDisplay = item.selectedSize ? ` (Size: ${item.selectedSize})` : '';
              const colorDisplay = item.selectedColor ? ` (Color: ${item.selectedColor})` : ''; 
              const featuredTag = item.isFeatured ? ' <small style="color:#ffc107;">(Featured)</small>' : '';
              itemP.innerHTML = `${item.name}${sizeDisplay}${colorDisplay}${featuredTag} (x${item.quantity}) - PKR ${(item.price * item.quantity).toFixed(2)}`; 
              orderSummaryItemsDiv.appendChild(itemP); 
          });
      }
      if (orderSummaryTotalItemsCountSpan) orderSummaryTotalItemsCountSpan.textContent = itemsForOrder.reduce((sum, item) => sum + item.quantity, 0);
      if (orderSummaryGrandTotalSpan) orderSummaryGrandTotalSpan.textContent = `PKR ${grandTotal.toFixed(2)}`; // Update to grand total

      if (orderFormWalletBalanceSpan) orderFormWalletBalanceSpan.textContent = (userProfile.walletBalance || 0).toFixed(2);
      if (orderFormDepositBalanceSpan) orderFormDepositBalanceSpan.textContent = (userProfile.depositBalance || 0).toFixed(2);
      if (orderFormBonusBalanceSpan) orderFormBonusBalanceSpan.textContent = (userProfile.bonusBalance || 0).toFixed(2);
      if (orderFormWalletBalanceDetailsDiv) orderFormWalletBalanceDetailsDiv.style.display = 'block';


      if (orderForm) orderForm.reset(); 
      // Manually re-populate fields that might be reset by form.reset()
      if (customerNameInput && userProfile) customerNameInput.value = userProfile.name || ""; 
      if (userProfile && userProfile.shippingAddress) {
          mobileNumberInput.value = userProfile.shippingAddress.mobile || '';
          streetAddressInput.value = userProfile.shippingAddress.street || '';
          countrySelect.value = userProfile.shippingAddress.country || '';
          populateStates(userProfile.shippingAddress.country || '', userProfile.shippingAddress.state || '');
          cityInput.value = userProfile.shippingAddress.city || '';
          postalCodeInput.value = userProfile.shippingAddress.postalCode || '';
      } else {
           populateCountries(); 
      }

      if (orderMessage) orderMessage.style.display = 'none'; 
      
      // Set initial button states to disabled
      if (placeOrderButton) placeOrderButton.disabled = true;
      if (placeOrderCodButton) placeOrderCodButton.disabled = true;

      // COD Button Logic
      if (codUnavailableMessage) codUnavailableMessage.style.display = 'none'; 
      if (!itemsForOrder.some(item => item.isFeatured)) { // COD allowed only if NO featured items
          if (placeOrderCodButton) {
              placeOrderCodButton.disabled = itemsForOrder.length === 0;
          }
      } else {
          if (codUnavailableMessage) {
              codUnavailableMessage.style.display = 'block'; // Show message if featured items are present
          }
      }

      // Wallet Button Logic
      if (placeOrderButton) {
          if (itemsForOrder.length === 0) {
              placeOrderButton.disabled = true; // No items, keep disabled
          } else if (orderContainsNonFeaturedProduct) { // Order has at least one non-featured item
              if ((userProfile.depositBalance || 0) < grandTotal) {
                  showTemporaryMessage(`Insufficient DEPOSIT balance (PKR ${(userProfile.depositBalance || 0).toFixed(2)}) for this order (PKR ${grandTotal.toFixed(2)}). Regular products require deposit funds.`, 'error');
                  placeOrderButton.disabled = true; // Keep disabled if deposit is low
              } else {
                  placeOrderButton.disabled = false; // Enable if deposit balance is sufficient
              }
              if (orderFormBonusInfoP) {
                   orderFormBonusInfoP.textContent = "Bonus funds cannot be used as this order contains regular (non-featured) products. Entire amount will be deducted from Deposit Balance.";
                   orderFormBonusInfoP.style.display = 'block';
              }
          } else { // Order contains ONLY featured products
              const availableTotalWalletForFeatured = (userProfile.bonusBalance || 0) + (userProfile.depositBalance || 0);
              if (availableTotalWalletForFeatured < grandTotal) {
                  showTemporaryMessage(`Insufficient total balance (Bonus PKR ${(userProfile.bonusBalance || 0).toFixed(2)} + Deposit PKR ${(userProfile.depositBalance || 0).toFixed(2)}) for these featured items. Need PKR ${grandTotal.toFixed(2)}, have PKR ${availableTotalWalletForFeatured.toFixed(2)}.`, 'error');
                  placeOrderButton.disabled = true; // Keep disabled if total wallet is low
              } else {
                  placeOrderButton.disabled = false; // Enable if total wallet is sufficient
              }
              if (orderFormBonusInfoP) orderFormBonusInfoP.style.display = 'none'; // Hide if previously shown
          }
      }
      
      hideEmbeddedCart(); 
      showView('order-form-view', 'clear'); 
  }

  if(proceedToCheckoutBtn) proceedToCheckoutBtn.onclick = () => prepareOrderForm('cart');
  
  if(backFromOrderFormBtn) backFromOrderFormBtn.onclick = () => {
      goHomeAndShowForYou();
      orderSource = null; 
  };
  
  async function processOrder(paymentType) {
      if (!firebaseUser || !userProfile) { 
          showTemporaryMessage(`You must be logged in to place an order.`, 'error'); // Changed to showTemporaryMessage
          return; 
      }
      
      let itemsToProcess = [], subtotalProducts = 0, totalShipping = 0; 
      let orderContainsNonFeaturedProduct = false;

      if(orderSource === 'direct' && currentProductDetail){ 
          if ((currentProductDetail.stock - (currentProductDetail.soldCount || 0)) <= 0) { showTemporaryMessage('This product is out of stock.', 'error'); return; } // Changed to showTemporaryMessage
          
          let finalSelectedSize = "Unstitched";
          if (currentProductDetail.selectedSize === "Other") {
              finalSelectedSize = manualSizeInput && manualSizeInput.value.trim() !== "" ? manualSizeInput.value.trim() : "Other (Not Specified)";
              if (finalSelectedSize === "Other (Not Specified)") {
                  showTemporaryMessage("Please specify your size in the 'Other' input field on product page.", "warning"); // Changed to showTemporaryMessage
                  prepareOrderForm(orderSource); 
                  return; 
              }
          } else {
              finalSelectedSize = currentProductDetail.selectedSize || (currentProductDetail.sizes && currentProductDetail.sizes.length > 0 ? currentProductDetail.sizes[0] : (currentProductDetail.size || "Unstitched"));
          }

          let finalSelectedColor = null; 
          if (currentProductDetail.selectedColor) { 
              finalSelectedColor = currentProductDetail.selectedColor;
          } else if (currentProductDetail.colors && currentProductDetail.colors.length > 0) {
              finalSelectedColor = currentProductDetail.colors[0]; 
          }

          itemsToProcess = [{ 
              ...currentProductDetail, 
              productId: currentProductDetail.id, 
              imageUrl: getFirstImageUrl(currentProductDetail), 
              quantity: 1, 
              price: currentProductDetail.price, 
              selectedSize: finalSelectedSize,
              selectedColor: finalSelectedColor, 
              isFeatured: currentProductDetail.isFeatured || false,
              deliveryCharge: currentProductDetail.deliveryCharge || 0 // Include delivery charge
          }]; 
          subtotalProducts = currentProductDetail.price; 
          totalShipping = currentProductDetail.deliveryCharge || 0; 
          if (!currentProductDetail.isFeatured) orderContainsNonFeaturedProduct = true;

      } else if (orderSource === 'cart' && cart.length > 0){ 
          itemsToProcess = cart.map(item => ({...item})); 
          subtotalProducts = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0); 
          totalShipping = cart.reduce((sum, item) => sum + (item.deliveryCharge || 0), 0);
          orderContainsNonFeaturedProduct = itemsToProcess.some(item => item.isFeatured);
      } else { 
          showTemporaryMessage('No items to order.','error'); // Changed to showTemporaryMessage
          return; 
      }

      const grandTotalOrderAmount = subtotalProducts + totalShipping; 

      if(itemsToProcess.length === 0){ showTemporaryMessage('Your order is empty.','error'); return; } // Changed to showTemporaryMessage
      
      if (paymentType === 'CashOnDelivery' && itemsToProcess.some(item => item.isFeatured)) {
          showTemporaryMessage('Cash on Delivery is not available if order contains featured items.', 'error'); // Changed to showTemporaryMessage
          if (placeOrderCodButton) placeOrderCodButton.disabled = true;
          if (codUnavailableMessage) codUnavailableMessage.style.display = 'block';
          prepareOrderForm(orderSource); 
          return;
      }

      const orderDetails = { 
          name: customerNameInput.value.trim(), 
          mobile: mobileNumberInput.value.trim(), 
          street: streetAddressInput.value.trim(), 
          country: countrySelect.value, 
          state: stateSelect.value, 
          city: cityInput.value.trim(), 
          postalCode: postalCodeInput.value.trim() 
      };
      const countryHasStates = countryStateData[orderDetails.country] && countryStateData[orderDetails.country].length > 0;
      if(!orderDetails.name || !orderDetails.mobile || !orderDetails.street || !orderDetails.country || (countryHasStates && !orderDetails.state) || !orderDetails.city || !orderDetails.postalCode){ showTemporaryMessage('Please fill all address fields.','error'); return; } // Changed to showTemporaryMessage
      if(!/^[0-9]{10,15}$/.test(orderDetails.mobile.replace(/[^0-9]/g, ''))){ showTemporaryMessage('Enter valid mobile number.','error'); return; } // Changed to showTemporaryMessage

      let amountToDeductFromBonus = 0;
      let amountToDeductFromDeposit = 0;

      if (paymentType === 'Wallet') {
          if (orderContainsNonFeaturedProduct) { 
              if ((userProfile.depositBalance || 0) < grandTotalOrderAmount) {
                  showTemporaryMessage(`Insufficient DEPOSIT balance (PKR ${(userProfile.depositBalance || 0).toFixed(2)}) for this order (PKR ${grandTotalOrderAmount.toFixed(2)}). Regular products require deposit funds.`, 'error'); // Changed to showTemporaryMessage
                  if(placeOrderButton) placeOrderButton.disabled = true;
                  return;
              }
              amountToDeductFromDeposit = grandTotalOrderAmount;
          } else { 
              const availableTotalWalletForFeatured = (userProfile.bonusBalance || 0) + (userProfile.depositBalance || 0);
              if (availableTotalWalletForFeatured < grandTotalOrderAmount) {
                  showTemporaryMessage(`Insufficient total balance (Bonus PKR ${(userProfile.bonusBalance || 0).toFixed(2)} + Deposit PKR ${(userProfile.depositBalance || 0).toFixed(2)}) for these featured items. Need PKR ${grandTotalOrderAmount.toFixed(2)}, have PKR ${availableTotalWalletForFeatured.toFixed(2)}.`, 'error'); // Changed to showTemporaryMessage
                  if(placeOrderButton) placeOrderButton.disabled = true;
                  return;
              }
              amountToDeductFromBonus = Math.min(grandTotalOrderAmount, (userProfile.bonusBalance || 0));
              amountToDeductFromDeposit = grandTotalOrderAmount - amountToDeductFromBonus;
          }
      }
      
      if(placeOrderButton) { placeOrderButton.disabled = true; placeOrderButton.textContent = "Processing..."; }
      if(placeOrderCodButton) { placeOrderCodButton.disabled = true; placeOrderCodButton.textContent = "Processing...";}

      try { 
          const stockUpdatesPromises = [], processedItemsForFirestore = []; 
          for(const item of itemsToProcess){ 
              const productRef = doc(db,'products',item.productId); 
              const productSnap = await getDoc(productRef); 
              if(!productSnap.exists()) throw new Error(`Product ${item.name} no longer available.`); 
              const productData = productSnap.data(); 
              if(item.quantity > (productData.stock - (productData.soldCount || 0) )) throw new Error(`Not enough stock for ${item.name}. Available: ${productData.stock - (productData.soldCount || 0)}.`); 
              stockUpdatesPromises.push(updateDoc(productRef, { soldCount: increment(item.quantity) })); 
              processedItemsForFirestore.push({ 
                  productId: item.productId, 
                  name: item.name, 
                  price: item.price, 
                  quantity: item.quantity, 
                  imageUrl: item.imageUrl, 
                  selectedSize: item.selectedSize || "N/A", 
                  selectedColor: item.selectedColor || "N/A", // Include color in order item
                  deliveryCharge: item.deliveryCharge || 0, // Include delivery charge in order item
                  isFeatured: item.isFeatured || false 
              }); 
          } 
          await Promise.all(stockUpdatesPromises); 
          
          const orderPayload = { 
              customerInfo: { ...orderDetails, userId: firebaseUser.uid, userEmail: firebaseUser.email }, 
              items: processedItemsForFirestore, 
              subtotalAmount: subtotalProducts, // Store subtotal
              shippingAmount: totalShipping, // Store shipping amount
              totalAmount: grandTotalOrderAmount, // Grand total
              orderDate: serverTimestamp(), 
              status: 'Pending',
              paymentMethod: paymentType,
              paymentStatus: paymentType === 'Wallet' ? 'Paid' : 'Unpaid (COD)',
              containsFeatured: itemsToProcess.some(item => item.isFeatured),
              deductedFromBonus: amountToDeductFromBonus,
              deductedFromDeposit: amountToDeductFromDeposit
          };
          await addDoc(collection(db,'orders'), orderPayload); 
          
          // Save user's shipping address to their profile
          const userDocRef = doc(db, "users", firebaseUser.uid);
          await updateDoc(userDocRef, {
              shippingAddress: orderDetails // Save the address for future use
          });

          if (paymentType === 'Wallet') {
              const newBonusBalance = (userProfile.bonusBalance || 0) - amountToDeductFromBonus;
              const newDepositBalance = (userProfile.depositBalance || 0) - amountToDeductFromDeposit;
              const newWalletBalance = newBonusBalance + newDepositBalance;

              await updateDoc(userDocRef, { 
                  bonusBalance: newBonusBalance,
                  depositBalance: newDepositBalance,
                  walletBalance: newWalletBalance
              }); 
              showTemporaryMessage('Order placed! Funds deducted from wallet.','success'); // Changed to showTemporaryMessage
          } else {
              showTemporaryMessage('Order placed with Cash on Delivery!','success'); // Changed to showTemporaryMessage
          }
          
          if(orderSource === 'cart'){ cart = []; updateCartUI(); } 
          orderForm.reset(); 
          if (countrySelect) countrySelect.value = ""; 
          if (stateSelect) { stateSelect.innerHTML = '<option value="">-- Select State/Province --</option>'; stateSelect.disabled = true; } 
          currentProductDetail = null; orderSource = null; 
          setTimeout(()=>{ goHomeAndShowForYou(); }, 2500); 
      }
      catch(error){ showTemporaryMessage(`Order failed: ${error.message}`,'error'); } // Changed to showTemporaryMessage
      finally { 
          const itemsStillInOrder = (orderSource === 'cart' && cart.length > 0) || (orderSource === 'direct' && currentProductDetail);
          if (itemsStillInOrder && getCurrentVisibleViewId() === 'order-form-view') {
              prepareOrderForm(orderSource); 
          } else {
              if(placeOrderButton) { placeOrderButton.disabled = false; placeOrderButton.textContent = "Place Order (Pay with Wallet)"; }
              if(placeOrderCodButton) { placeOrderCodButton.disabled = false; placeOrderCodButton.textContent = "Place Order (Cash on Delivery)";}
          }
      } 
  }

  if(orderForm) orderForm.onsubmit = async e => {
      e.preventDefault(); 
      await processOrder('Wallet');
  }
  if(placeOrderCodButton) placeOrderCodButton.addEventListener('click', async (e) => {
      e.preventDefault();
      await processOrder('CashOnDelivery');
  });


  function showMessageOrder(msg,type){ if(orderMessage){ orderMessage.textContent=msg; orderMessage.className=`message ${type}`; orderMessage.style.display='block'; setTimeout(()=>{orderMessage.style.display='none';}, 4000); } }

   
   // --- SELLER APPLICATION & PRODUCT MANAGEMENT ---

  async function handleMyProductsClick() {
      if (!firebaseUser) {
          alert("Please log in first.");
          navigateToAccountView();
          return;
      }
      
      const sellerStatus = userProfile.sellerProfile?.status;

      if (sellerStatus === 'approved') {
          showView('my-products-view');
      } else if (sellerStatus === 'pending') {
          alert("Your seller application is pending review. Please wait for admin approval.");
      } else if (sellerStatus === 'rejected') {
          alert("Your seller application was rejected. Please contact support for more information.");
      } else { // not_applied or undefined
          showView('seller-application-view');
      }
  }

  if (sellerApplicationForm) {
      sellerApplicationForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const submitBtn = document.getElementById('submit-seller-application-btn');
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

          const applicationData = {
              fullName: document.getElementById('seller-full-name').value.trim(),
              fatherName: document.getElementById('seller-father-name').value.trim(),
              cnic: document.getElementById('seller-cnic').value.trim(),
              address: document.getElementById('seller-address').value.trim(),
              whatsapp: document.getElementById('seller-whatsapp').value.trim(),
              cnicFrontUrl: document.getElementById('seller-cnic-front-url').value.trim(),
              cnicBackUrl: document.getElementById('seller-cnic-back-url').value.trim(),
              status: 'pending',
              requestDate: serverTimestamp()
          };

          // Basic validation
          for (const key in applicationData) {
              if (key !== 'requestDate' && !applicationData[key]) {
                  showAdminMessage(sellerApplicationMessage, `Please fill out the ${key} field.`, 'error');
                  submitBtn.disabled = false;
                  submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
                  return;
              }
          }

          try {
              const userDocRef = doc(db, 'users', firebaseUser.uid);
              await updateDoc(userDocRef, {
                  sellerProfile: applicationData
              });

              showAdminMessage(sellerApplicationMessage, 'Application submitted successfully! Please wait for admin approval.', 'success');
              setTimeout(() => showView('account-view'), 2000);
          } catch (error) {
              console.error("Error submitting seller application: ", error);
              showAdminMessage(sellerApplicationMessage, 'Submission failed. Please try again.', 'error');
          } finally {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
          }
      });
  }
  
  if (addImageUrlFieldBtn) {
      addImageUrlFieldBtn.addEventListener('click', () => {
          const currentInputs = imageUrlInputsContainer.querySelectorAll('.new-product-image-url-input');
          if (currentInputs.length < 8) {
              const newInput = document.createElement('input');
              newInput.type = 'text';
              newInput.className = 'new-product-image-url-input';
              newInput.placeholder = `URL ${currentInputs.length + 1}`;
              imageUrlInputsContainer.appendChild(newInput);
          }
          if (imageUrlInputsContainer.querySelectorAll('.new-product-image-url-input').length >= 8) {
              addImageUrlFieldBtn.disabled = true;
              addImageUrlFieldBtn.textContent = 'Max 8 Images';
          }
      });
  }

  if (addProductForm) {
      addProductForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (!firebaseUser) {
              showAdminMessage(addProductMessage, 'Please log in to add a product.', 'error');
              return;
          }

          const name = document.getElementById('new-product-name').value.trim();
          const description = document.getElementById('new-product-description').value.trim();
          const category = document.getElementById('new-product-category').value.trim();
          const price = parseFloat(document.getElementById('new-product-price').value);
          const originalPriceInput = document.getElementById('new-product-original-price');
          const originalPrice = originalPriceInput.value ? parseFloat(originalPriceInput.value) : null;
          const deliveryCharge = 0; // Fixed delivery charge as per request
          const stock = parseInt(document.getElementById('new-product-stock').value);
          const whatsappNumber = document.getElementById('new-product-whatsapp').value.trim();
          // Removed rating inputs from add product form: Default to 0/0 or handle on backend
          // const averageRating = parseFloat(newProductAvgRatingInput.value);
          // const numberOfReviews = parseInt(newProductNumReviewsInput.value);
          
          const imageUrls = Array.from(imageUrlInputsContainer.querySelectorAll('.new-product-image-url-input'))
                               .map(input => input.value.trim())
                               .filter(url => url !== '');

          if (!name || !description || !category || !whatsappNumber || imageUrls.length === 0 || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0 ) {
              showAdminMessage(addProductMessage, 'Please fill all required fields correctly, including WhatsApp number.', 'error');
              return;
          }
          // Delivery charge validation is removed as it's now fixed at 0.
          if (!/^(03)\d{9}$/.test(whatsappNumber)) {
              showAdminMessage(addProductMessage, 'Please enter a valid Pakistani WhatsApp number (e.g., 03123456789).', 'error');
              return;
          }
          if (originalPrice && isNaN(originalPrice)) {
              showAdminMessage(addProductMessage, 'Original price must be a valid number.', 'error');
              return;
          }
          if (originalPrice && originalPrice <= price) {
              showAdminMessage(addProductMessage, 'Original price must be greater than the discounted price.', 'error');
              return;
          }

          const submitBtn = document.getElementById('add-product-submit-btn');
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
          
          try {
              const newProduct = {
                  name: name,
                  description: description,
                  category: category,
                  price: price,
                  stock: stock,
                  whatsappNumber: whatsappNumber,
                  imageUrls: imageUrls,
                  userId: firebaseUser.uid,
                  userName: userProfile.name,
                  soldCount: 0,
                  timestamp: serverTimestamp(),
                  deliveryCharge: deliveryCharge, // Fixed at 0 as per request
                  averageRating: 0.0, // Default for new products, admin can set later
                  numberOfReviews: 0 // Default for new products, admin can set later
              };

              if (originalPrice) {
                  newProduct.originalPrice = originalPrice;
              }

              await addDoc(collection(db, 'products'), newProduct);

              showAdminMessage(addProductMessage, 'Product added successfully!', 'success');
              addProductForm.reset();
              imageUrlInputsContainer.innerHTML = '<input type="text" class="new-product-image-url-input" placeholder="URL 1 (Required Main Image)" required>';
              addImageUrlFieldBtn.disabled = false;
              addImageUrlFieldBtn.innerHTML = '<i class="fas fa-plus"></i> Add Another Image';
              // Resetting avg rating and num reviews no longer needed as inputs are removed.
              // newProductAvgRatingInput.value = 0.0; 
              // newProductNumReviewsInput.value = 0; 

          } catch (error) {
              console.error("Error adding product:", error);
              showAdminMessage(addProductMessage, 'Failed to add product. Please try again.', 'error');
          } finally {
              submitBtn.disabled = false;
              // Restore button text after a brief delay
              setTimeout(() => {
                 submitBtn.textContent = 'Add Product'; // Fixed to submitBtn
              }, 100);
          }
      });
  }
  
  function renderUserProducts() {
      if (!firebaseUser || !userProductsList) {
          if(userProductsList) userProductsList.innerHTML = '<p style="color:#ccc;">Please log in to manage your products.</p>';
          return;
      }
      if (unsubscribeUserProducts) unsubscribeUserProducts();
      
      userProductsList.innerHTML = '<p style="color:#ccc;"><i class="fas fa-spinner fa-spin"></i> Loading your products...</p>';

      const q = query(collection(db, "products"), where("userId", "==", firebaseUser.uid), orderBy("timestamp", "desc"));
      
      unsubscribeUserProducts = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
              userProductsList.innerHTML = '<p style="color:#ccc;">You have not uploaded any products yet.</p>';
              return;
          }
          
          let html = '';
          snapshot.forEach((docSnap) => {
              const product = { id: docSnap.id, ...docSnap.data() };
              const imageUrl = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://via.placeholder.com/150x120.png?text=No+Image';
              
              // Rating display in My Products list remains visible
              const ratingDisplay = product.averageRating !== undefined && product.numberOfReviews !== undefined && product.numberOfReviews > 0
                  ? `<br/>Avg Rating: ${product.averageRating.toFixed(1)} (${product.numberOfReviews} reviews)`
                  : '';


              html += `
                  <div class="my-product-item" data-product-id="${product.id}">
                      <img src="${imageUrl}" alt="${product.name}">
                      <div class="my-product-item-info">
                          <div class="name">${product.name}</div>
                          <div class="price-stock">
                              PKR ${product.price.toFixed(2)} | Stock: ${product.stock} | Delivery: PKR ${(product.deliveryCharge || 0).toFixed(2)}
                              ${ratingDisplay}
                          </div>
                      </div>
                      <div class="product-actions">
                          <button class="edit-product-btn" data-product-id="${product.id}">
                              <i class="fas fa-edit"></i> Edit
                          </button>
                          <button class="delete-product-btn" data-product-id="${product.id}">
                              <i class="fas fa-trash"></i> Delete
                          </button>
                      </div>
                  </div>
              `;
          });
          userProductsList.innerHTML = html;
      }, (error) => {
          console.error("Error fetching user products: ", error);
          userProductsList.innerHTML = '<p style="color:red;">Error loading your products.</p>';
          if(unsubscribeUserProducts) unsubscribeUserProducts();
      });
  }
  
  // --- SELLER'S ORDERS ---
  function renderSellerOrders() {
      if (!firebaseUser || !sellerOrdersList) {
          if(sellerOrdersList) sellerOrdersList.innerHTML = '<p style="color:#ccc;">Please log in to see your orders.</p>';
          return;
      }
      if (unsubscribeSellerOrders) unsubscribeSellerOrders();
      
      sellerOrdersList.innerHTML = '<p style="color:#ccc;"><i class="fas fa-spinner fa-spin"></i> Loading your orders...</p>';

      const q = query(collection(db, "orders"), orderBy("orderDate", "desc"), limit(50));
      
      unsubscribeSellerOrders = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
              sellerOrdersList.innerHTML = '<p style="color:#ccc;">No orders found yet.</p>';
              return;
          }

          const sellerId = firebaseUser.uid;
          let sellerOrdersHtml = '';
          let orderCount = 0;

          snapshot.forEach((docSnap) => {
              const order = { id: docSnap.id, ...docSnap.data() };
              
              const sellerItems = order.items.filter(item => {
                  const product = allProductsMap[item.productId];
                  return product && product.userId === sellerId;
              });

              if (sellerItems.length > 0) {
                  orderCount++;
                  const date = order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleDateString() : 'N/A';
                  const customerName = order.customerInfo.name || 'N/A';
                  
                  let itemsHtml = '<ul>';
                  sellerItems.forEach(item => {
                      itemsHtml += `<li>${item.name} (Qty: ${item.quantity})</li>`;
                  });
                  itemsHtml += '</ul>';

                  sellerOrdersHtml += `
                      <div class="order-list-item">
                          <p><strong>Order ID:</strong> ${order.id.substring(0, 8)}...</p>
                          <p><strong>Customer:</strong> ${customerName}</p>
                          <p><strong>Date:</strong> ${date}</p>
                          <p><strong>Your Items in this Order:</strong></p>
                          ${itemsHtml}
                          <p><strong>Status:</strong> <span class="order-status ${order.status.toLowerCase()}">${order.status}</span></p>
                      </div>
                  `;
              }
          });

          if (orderCount === 0) {
              sellerOrdersList.innerHTML = '<p style="color:#ccc;">No orders found for your products yet.</p>';
          } else {
              sellerOrdersList.innerHTML = sellerOrdersHtml;
          }

      }, (error) => {
          console.error("Error fetching seller orders: ", error);
          sellerOrdersList.innerHTML = '<p style="color:red;">Error loading your orders.</p>';
          if(unsubscribeSellerOrders) unsubscribeSellerOrders();
      });
  }


  // Event listener for Edit and Delete buttons
  if (userProductsList) {
      userProductsList.addEventListener('click', async (e) => {
          const button = e.target.closest('button');
          if (!button) return;

          const productId = button.dataset.productId;
          if (!productId) return;

          if (button.classList.contains('edit-product-btn')) {
              showEditProductForm(productId);
          } else if (button.classList.contains('delete-product-btn')) {
              if (confirm(`Are you sure you want to permanently delete this product? This action cannot be undone.`)) {
                  try {
                      const productDocRef = doc(db, 'products', productId);
                      await deleteDoc(productDocRef);
                      showTemporaryMessage('Product deleted successfully.', 'success', document.body);
                  } catch (error) {
                      console.error("Error deleting product:", error);
                      showTemporaryMessage('Failed to delete product.', 'error', document.body);
                  }
              }
          }
      });
  }
  
  // --- EDIT PRODUCT LOGIC ---
  function showEditProductForm(productId) {
      const product = allProductsMap[productId];
      if (!product) {
          alert("Could not find product details to edit.");
          return;
      }

      // Populate the form fields
      editProductIdInput.value = productId;
      document.getElementById('edit-product-name').value = product.name || '';
      
      // POPULATE PRICE FIELDS
      document.getElementById('edit-product-price').value = product.price;
      document.getElementById('edit-product-original-price').value = product.originalPrice || '';
      
      document.getElementById('edit-product-description').value = product.description || '';
      
      // Populate Delivery Charge field
      document.getElementById('edit-product-delivery-charge').value = product.deliveryCharge || 0;

      document.getElementById('edit-product-stock').value = product.stock;
      document.getElementById('edit-product-sold-count').value = product.soldCount; // Assuming there is an edit-product-sold-count input
      document.getElementById('edit-product-category').value = product.category;
      document.getElementById('edit-product-whatsapp').value = product.whatsappNumber || ''; // Populate WhatsApp
      // Assuming these are meant to be direct inputs for string, not arrays
      // You might need to adjust your HTML to make these into proper multi-selects or array inputs if they represent arrays
      // For now, convert array to comma-separated string for display
      document.getElementById('edit-product-sizes').value = (product.sizes && Array.isArray(product.sizes)) ? product.sizes.join(', ') : '';
      document.getElementById('edit-product-colors').value = (product.colors && Array.isArray(product.colors)) ? product.colors.join(', ') : ''; 
      
      // NEW: Populate Average Rating and Number of Reviews fields
      document.getElementById('edit-product-avg-rating').value = product.averageRating !== undefined ? product.averageRating : 0.0;
      document.getElementById('edit-product-num-reviews').value = product.numberOfReviews !== undefined ? product.numberOfReviews : 0;

      document.getElementById('edit-is-lightning-deal').checked = product.isLightningDeal || false; // Assuming edit-is-lightning-deal input
      document.getElementById('edit-is-featured').checked = product.isFeatured || false; // Assuming edit-is-featured input

      editImageUrlInputsContainer.innerHTML = '';
      // Populate image URLs, ensuring at least one if none are present
      (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : ['']).forEach(url => {
          const group = document.createElement('div');
          group.className = 'form-group image-url-group'; // Assuming you have this class for styling
          const input = document.createElement('input');
          input.type = 'url';
          input.className = 'edit-product-image-url-input'; // Use a class specific to edit form if needed
          input.placeholder = `URL ${editImageUrlInputsContainer.children.length + 1}`;
          input.value = url;
          input.required = editImageUrlInputsContainer.children.length === 0;

          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.innerHTML = '<i class="fas fa-times"></i>';
          removeBtn.className = 'action-button danger remove-image-url-button'; // Assuming admin-btn danger and remove-image-url-button classes
          removeBtn.style.marginLeft = '10px';
          removeBtn.style.padding = '8px';
          removeBtn.style.width = 'auto';
          removeBtn.style.backgroundColor = '#dc3545';


          removeBtn.onclick = () => {
              group.remove();
              if (editImageUrlInputsContainer.children.length === 0) {
                   // Ensure at least one input remains
                   const newEmptyInput = document.createElement('input');
                   newEmptyInput.type = 'url';
                   newEmptyInput.className = 'edit-product-image-url-input';
                   newEmptyInput.placeholder = 'URL 1 (Required)';
                   newEmptyInput.required = true;
                   editImageUrlInputsContainer.appendChild(newEmptyInput);
              } else {
                  // Ensure the first remaining input is required
                  const firstInput = editImageUrlInputsContainer.querySelector('.edit-product-image-url-input');
                  if (firstInput) firstInput.required = true;
              }
          };
          group.appendChild(input);
          group.appendChild(removeBtn);
          editImageUrlInputsContainer.appendChild(group);
      });
      // Ensure the first input is always required, even after adding multiple
      const firstInputAfterPopulate = editImageUrlInputsContainer.querySelector('.edit-product-image-url-input');
      if (firstInputAfterPopulate) firstInputAfterPopulate.required = true;

      editAddImageUrlFieldBtn.disabled = editImageUrlInputsContainer.children.length >= 8;

      showView('edit-product-view');
  }

  if (editAddImageUrlFieldBtn) {
      editAddImageUrlFieldBtn.addEventListener('click', () => {
          const currentInputs = editImageUrlInputsContainer.querySelectorAll('.edit-product-image-url-input');
          if (currentInputs.length < 8) {
              const newInput = document.createElement('input');
              newInput.type = 'text';
              newInput.className = 'edit-product-image-url-input';
              newInput.placeholder = `URL ${currentInputs.length + 1}`;
              editImageUrlInputsContainer.appendChild(newInput);
          }
          if (editImageUrlInputsContainer.querySelectorAll('.edit-product-image-url-input').length >= 8) {
              editAddImageUrlFieldBtn.disabled = true;
          }
      });
  }

  if (editProductForm) {
      editProductForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const productId = editProductIdInput.value;
          if (!productId) {
              showAdminMessage(editProductMessage, "Product ID is missing. Cannot update.", "error");
              return;
          }
          
          const name = document.getElementById('edit-product-name').value.trim();
          const description = document.getElementById('edit-product-description').value.trim();
          const category = document.getElementById('edit-product-category').value.trim();
          const price = parseFloat(document.getElementById('edit-product-price').value);
          const originalPriceInput = document.getElementById('edit-product-original-price');
          const originalPrice = originalPriceInput.value ? parseFloat(originalPriceInput.value) : null;
          const deliveryCharge = parseFloat(document.getElementById('edit-product-delivery-charge').value); // NEW: Get delivery charge
          const stock = parseInt(document.getElementById('edit-product-stock').value);
          const soldCount = parseInt(document.getElementById('edit-product-sold-count').value); // Assuming edit-product-sold-count
          const whatsappNumber = document.getElementById('edit-product-whatsapp').value.trim(); // Assuming edit-product-whatsapp
          
          // NEW: Get Average Rating and Number of Reviews fields
          const averageRating = parseFloat(document.getElementById('edit-product-avg-rating').value);
          const numberOfReviews = parseInt(document.getElementById('edit-product-num-reviews').value);
          
          // Assuming these inputs are for comma-separated strings
          const sizesString = document.getElementById('edit-product-sizes').value.trim();
          const sizes = sizesString ? sizesString.split(',').map(s => s.trim()).filter(s => s !== '') : [];

          const colorsString = document.getElementById('edit-product-colors').value.trim();
          const colors = colorsString ? colorsString.split(',').map(c => c.trim()).filter(c => c !== '') : [];


          const isLightningDeal = document.getElementById('edit-is-lightning-deal').checked; // Assuming edit-is-lightning-deal
          const isFeatured = document.getElementById('edit-is-featured').checked; // Assuming edit-is-featured

          const imageUrls = Array.from(editImageUrlInputsContainer.querySelectorAll('.edit-product-image-url-input'))
                               .map(input => input.value.trim())
                               .filter(url => url !== '');

          // Validation
          if (!name || !description || !category || !whatsappNumber || imageUrls.length === 0 || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0 || isNaN(soldCount) || soldCount < 0) {
              showAdminMessage(editProductMessage, 'Please fill all required fields correctly.', 'error');
              return;
          }
          if (!/^(03)\d{9}$/.test(whatsappNumber)) {
              showAdminMessage(editProductMessage, 'Please enter a valid Pakistani WhatsApp number (e.g., 03123456789).', 'error');
              return;
          }
          if (originalPrice && isNaN(originalPrice)) {
              showAdminMessage(editProductMessage, 'Original price must be a valid number.', 'error');
              return;
          }
          if (originalPrice && originalPrice <= price) {
              showAdminMessage(editProductMessage, 'Original price must be greater than the discounted price.', 'error');
              return;
          }
          if (soldCount > stock) {
              showAdminMessage(editProductMessage, 'Sold count cannot be greater than stock.', 'error', productFormMessage);
              return;
          }
          if (isNaN(deliveryCharge) || deliveryCharge < 0) {
            showAdminMessage(editProductMessage, 'Delivery Charge must be a valid non-negative number.', 'error', productFormMessage);
            return;
          }
          if (isNaN(averageRating) || averageRating < 0 || averageRating > 5 || isNaN(numberOfReviews) || numberOfReviews < 0) {
            showAdminMessage(editProductMessage, 'Average Rating must be between 0.0 and 5.0, and Number of Reviews must be a non-negative integer.', 'error', productFormMessage);
            return;
          }


          const submitBtn = document.getElementById('update-product-submit-btn');
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

          try {
              const productRef = doc(db, 'products', productId);
              const updateData = {
                  name,
                  description,
                  category,
                  price,
                  originalPrice: originalPrice > 0 ? originalPrice : null,
                  discountPercentage: originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
                  deliveryCharge: deliveryCharge,
                  stock,
                  soldCount,
                  whatsappNumber,
                  imageUrls,
                  averageRating: averageRating, 
                  numberOfReviews: numberOfReviews,
                  sizes: sizes, // Save parsed sizes array
                  colors: colors, // Save parsed colors array
                  isLightningDeal,
                  isFeatured
              };
              await updateDoc(productRef, updateData);
              showAdminMessage(editProductMessage, "Product updated successfully!", "success");
              setTimeout(() => {
                  showView('my-products-view');
              }, 1500);

          } catch (error) {
              console.error("Error updating product: ", error);
              showAdminMessage("Failed to update product. Please try again.", "error");
          } finally {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
          }
      });
  }

  // --- SELLER PRODUCTS LOGIC ---

  async function showSellerProducts(sellerId, sellerName) {
      if (!sellerId) return;

      showView('seller-products-view');
      if(sellerViewName) sellerViewName.textContent = sellerName ? `${sellerName}'s Products` : "Seller's Products";
      if(sellerProductsContainer) sellerProductsContainer.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:#bbb; margin-top:20px;">Loading products...</p>';
      
      try {
          const q = query(collection(db, "products"), where("userId", "==", sellerId), orderBy("timestamp", "desc"));
          const querySnapshot = await getDocs(q);
          
          if(sellerProductsContainer) sellerProductsContainer.innerHTML = '';
          
          if (querySnapshot.empty) {
              sellerProductsContainer.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:#bbb; margin-top:20px;">This seller has no other products listed.</p>';
              return;
          }

          querySnapshot.forEach((doc) => {
              const productData = { id: doc.id, ...doc.data() };
              const card = createGridProductCard(productData);
              sellerProductsContainer.appendChild(card);
          });

      } catch (error) {
          console.error("Error fetching seller products:", error);
          if(sellerProductsContainer) sellerProductsContainer.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:red; margin-top:20px;">Could not load seller products.</p>';
      }
  }


  // --- STANDARD APP LOGIC (DEPOSITS, ORDERS, ETC.) ---

  // NEW: Function to render deposit methods dynamically
  const PAYMENT_METHODS_COLLECTION_NAME = "paymentMethods"; // Consistent collection name

  async function renderDepositMethods() {
      if (!dynamicDepositMethodsContainer) return;

      // Detach previous listener if exists
      if (unsubscribeDepositMethods) {
          unsubscribeDepositMethods();
          unsubscribeDepositMethods = null; // Clear the reference
      }

      dynamicDepositMethodsContainer.innerHTML = '<p style="text-align:center; color:#ccc;"><i class="fas fa-spinner fa-spin"></i> Loading payment methods...</p>';

      const q = query(collection(db, PAYMENT_METHODS_COLLECTION_NAME), orderBy("order", "asc"));

      unsubscribeDepositMethods = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
              dynamicDepositMethodsContainer.innerHTML = '<p style="text-align:center; color:#ccc;">No deposit methods configured yet.</p>';
              return;
          }

          let html = '';
          snapshot.forEach((docSnap) => {
              const method = docSnap.data();
              if (method.isActive !== false) { // Only show active methods
                  html += `
                      <div class="deposit-method">
                          <h3>${method.name || 'N/A'}</h3>
                          <p><strong>Account Number:</strong> ${method.accountNumber || 'N/A'}</p>
                          ${method.notes ? `<p>${method.notes}</p>` : ''}
                      </div>
                  `;
              }
          });
          dynamicDepositMethodsContainer.innerHTML = html;
      }, (error) => {
          console.error("Error fetching deposit methods (real-time):", error);
          if (error.code === 'permission-denied') {
              dynamicDepositMethodsContainer.innerHTML = '<p style="color:red; text-align:center;">Error: Permission denied. Check your Firestore rules.</p>';
          } else if (error.code === 'failed-precondition') {
              dynamicDepositMethodsContainer.innerHTML = '<p style="color:red; text-align:center;">Error: Missing index for deposit methods. Check Firestore console for a link to create it.</p>';
          } else {
              dynamicDepositMethodsContainer.innerHTML = '<p style="color:red; text-align:center;">Error loading payment methods. Check console for details.</p>';
          }
          
          if (unsubscribeDepositMethods) { // Ensure listener is detached on error
              unsubscribeDepositMethods();
              unsubscribeDepositMethods = null;
          }
      });
  }


  if (depositRequestForm) depositRequestForm.addEventListener('submit', async (e) => {
      e.preventDefault(); if (!firebaseUser || !userProfile) { showAuthMessage(depositRequestMessage, 'Please log in.', 'error'); return; } const transactionIdVal = depositTransactionIdInput.value.trim(), paymentInfoVal = depositPaymentInfoInput.value.trim(), amount = parseFloat(depositAmountInput.value); if (!transactionIdVal || !paymentInfoVal || isNaN(amount) || amount <= 0) { showAuthMessage(depositRequestMessage, 'Fill all fields correctly.', 'error'); return; } if (amount < 10) { showAuthMessage(depositRequestMessage, 'Min deposit PKR 10.', 'error'); return; } if(submitDepositRequestBtn) { submitDepositRequestBtn.disabled = true; submitDepositRequestBtn.textContent = 'Submitting...';} try { await addDoc(collection(db, 'depositRequests'), { userId: firebaseUser.uid, userName: userProfile.name, userEmail: userProfile.email, transactionId: transactionIdVal, paymentInfo: paymentInfoVal, amount: amount, status: 'Pending', requestDate: serverTimestamp() }); showAdminMessage(depositRequestMessage, 'Deposit request submitted. An admin will review it.', 'success'); depositTransactionIdInput.value = ''; depositPaymentInfoInput.value = ''; depositAmountInput.value = ''; } catch (error) { showAdminMessage(depositRequestMessage, 'Failed to submit. Try again.', 'error'); } finally { if(submitDepositRequestBtn) { submitDepositRequestBtn.disabled = false; submitDepositRequestBtn.textContent = 'Submit Request';}} });
  async function renderUserDepositRequests() { if (!firebaseUser || !userDepositRequestsList) { if (userDepositRequestsList) userDepositRequestsList.innerHTML = '<p style="color:#ccc;">Log in to see requests.</p>'; return; } if (unsubscribeDepositRequests) unsubscribeDepositRequests(); userDepositRequestsList.innerHTML = '<p style="color:#ccc;"><i class="fas fa-spinner fa-spin"></i> Loading requests...</p>'; const q = query(collection(db, "depositRequests"), where("userId", "==", firebaseUser.uid), orderBy("requestDate", "desc")); unsubscribeDepositRequests = onSnapshot(q, (snapshot) => { if (snapshot.empty) { userDepositRequestsList.innerHTML = '<p style="color:#ccc;">No deposit requests.</p>'; return; } let html = ''; snapshot.forEach((docSnap) => { const req = docSnap.data(); const date = req.requestDate ? new Date(req.requestDate.seconds * 1000).toLocaleDateString() : 'N/A'; let borderColor = {'Pending': '#ffc107', 'Approved': '#28a745', 'Rejected': '#dc3545'}[req.status] || '#ccc'; html += `<div class="order-list-item" style="border-left-color: ${borderColor};"><p><strong>Date:</strong> ${date}</p><p><strong>Amount:</strong> PKR ${req.amount.toFixed(2)}</p><p><strong>ID:</strong> ${req.transactionId}</p><p><strong>Status:</strong> <span class="order-status ${req.status.toLowerCase()}">${req.status}</span></p>${req.adminNotes ? `<p style="font-size:0.85em; color: #aaa;"><em>Note: ${req.adminNotes}</em></p>` : ''}</div>`; }); userDepositRequestsList.innerHTML = html; }, (err) => { userDepositRequestsList.innerHTML = `<p style="color:red;">Error loading requests.</p>`; if(unsubscribeDepositRequests) unsubscribeDepositRequests(); }); }
  
  if (withdrawalRequestForm) withdrawalRequestForm.addEventListener('submit', async (e) => {
      e.preventDefault(); if (!firebaseUser || !userProfile) { showAdminMessage(withdrawalRequestMessage, 'Log in for withdrawals.', 'error'); return; } const accountType = withdrawalAccountTypeSelect.value, accountTitle = withdrawalAccountTitleInput.value.trim(), accountNumber = withdrawalAccountNumberInput.value.trim(), idCard = withdrawalIdCardInput.value.trim(), amount = parseFloat(withdrawalAmountInput.value); if (!accountType || !accountTitle || !accountNumber || !idCard || isNaN(amount)) { showAdminMessage(withdrawalRequestMessage, 'Fill all fields.', 'error'); return; } if (amount < MIN_WITHDRAWAL_AMOUNT) { showAdminMessage(withdrawalRequestMessage, `Min withdrawal PKR ${MIN_WITHDRAWAL_AMOUNT}.`, 'error'); return; } 
      
      if (amount > (userProfile.depositBalance || 0)) {
          showAdminMessage(withdrawalRequestMessage, `Withdrawal amount (PKR ${amount.toFixed(2)}) exceeds your withdrawable deposit balance (PKR ${(userProfile.depositBalance || 0).toFixed(2)}).`, 'error');
          return; 
      } 
      
      if(submitWithdrawalRequestBtn) { submitWithdrawalRequestBtn.disabled = true; submitWithdrawalRequestBtn.textContent = 'Submitting...';} try { await addDoc(collection(db, 'withdrawalRequests'), { userId: firebaseUser.uid, userName: userProfile.name, userEmail: firebaseUser.email, accountType, accountTitle, accountNumber, idCardNumber: idCard, amount, status: 'Pending', requestDate: serverTimestamp() }); showAdminMessage(withdrawalRequestMessage, 'Withdrawal request submitted.', 'success'); withdrawalRequestForm.reset(); if (withdrawalNameInput && userProfile) withdrawalNameInput.value = userProfile.name; if (withdrawalEmailInput && userProfile) withdrawalEmailUinput.value = userProfile.email; if (withdrawalWalletBalanceSpan && userProfile) withdrawalWalletBalanceSpan.textContent = (userProfile.depositBalance || 0).toFixed(2); } catch (error) { showAdminMessage(withdrawalRequestMessage, 'Failed. Try again.', 'error'); } finally { if(submitWithdrawalRequestBtn) { submitWithdrawalRequestBtn.disabled = false; submitWithdrawalRequestBtn.textContent = 'Submit Withdrawal Request';}} });

  async function renderUserWithdrawalRequests() { if (!firebaseUser || !userWithdrawalRequestsList) { if(userWithdrawalRequestsList) userWithdrawalRequestsList.innerHTML = '<p style="color:#ccc;">Log in to see requests.</p>'; return; } if (unsubscribeWithdrawalRequests) unsubscribeWithdrawalRequests(); userWithdrawalRequestsList.innerHTML = '<p style="color:#ccc;"><i class="fas fa-spinner fa-spin"></i> Loading requests...</p>'; const q = query(collection(db, "withdrawalRequests"), where("userId", "==", firebaseUser.uid), orderBy("requestDate", "desc")); unsubscribeWithdrawalRequests = onSnapshot(q, (snapshot) => { if (snapshot.empty) { userWithdrawalRequestsList.innerHTML = '<p style="color:#ccc;">No withdrawal requests.</p>'; return; } let html = ''; snapshot.forEach((docSnap) => { const req = docSnap.data(); const date = req.requestDate ? new Date(req.requestDate.seconds * 1000).toLocaleString() : 'N/A'; let borderColor = {'Pending': '#ffc107', 'Approved': '#28a745', 'Rejected': '#dc3545'}[req.status] || '#ccc'; html += `<div class="order-list-item" style="border-left-color: ${borderColor};"><p><strong>Date:</strong> ${date}</p><p><strong>Amount:</strong> PKR ${req.amount.toFixed(2)}</p><p><strong>To:</strong> ${req.accountType} - ...${req.accountNumber.slice(-4)}</p><p><strong>Status:</strong> <span class="order-status ${req.status.toLowerCase()}">${req.status}</span></p>${req.adminNotes ? `<p style="font-size:0.85em; color: #aaa;"><em>Note: ${req.adminNotes}</em></p>` : ''}</div>`; }); userWithdrawalRequestsList.innerHTML = html; }, (err) => { userWithdrawalRequestsList.innerHTML = `<p style="color:red;">Error loading requests.</p>`; if(unsubscribeWithdrawalRequests) unsubscribeWithdrawalRequests();}); }
  async function renderUserOrders() { if (!firebaseUser || !userOrdersListContainer) { if(userOrdersListContainer) userOrdersListContainer.innerHTML = '<p style="color:#ccc;">Log in to see orders.</p>'; return; } if (unsubscribeUserOrders) unsubscribeUserOrders(); userOrdersListContainer.innerHTML = '<p style="color:#ccc;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</p>'; const q = query(collection(db, "orders"), where("customerInfo.userId", "==", firebaseUser.uid), orderBy("orderDate", "desc")); unsubscribeUserOrders = onSnapshot(q, (snapshot) => { if (snapshot.empty) { userOrdersListContainer.innerHTML = '<p style="color:#ccc;">You have no orders.</p>'; return; } let html = ''; snapshot.forEach((docSnap) => { const order = { id: docSnap.id, ...docSnap.data() }; const date = order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleDateString() : 'N/A'; html += `<div class="order-list-item"><p><strong>Order ID:</strong> ${order.id.substring(0,8)}...</p><p><strong>Date:</strong> ${date}</p><p><strong>Total:</strong> PKR ${order.totalAmount.toFixed(2)}</p><p><strong>Status:</strong> <span class="order-status ${order.status.toLowerCase()}">${order.status}</span></p><p><strong>Payment:</strong> ${order.paymentMethod || 'N/A'} (${order.paymentStatus || 'N/A'})</p><button class="view-order-details-btn" data-order-id="${order.id}">View Details</button></div>`; }); userOrdersListContainer.innerHTML = html; userOrdersListContainer.querySelectorAll('.view-order-details-btn').forEach(btn => btn.addEventListener('click', (e) => showUserOrderDetail(e.target.dataset.orderId))); }, (err) => { userOrdersListContainer.innerHTML = `<p style="color:red;">Error loading orders.</p>`; if(unsubscribeUserOrders) unsubscribeUserOrders();}); }
  async function showUserOrderDetail(orderId) { 
      try { 
          const orderSnap = await getDoc(doc(db, "orders", orderId)); 
          if (orderSnap.exists()) { 
              const order = orderSnap.data(); 
              if(userOrderIdDisplay) userOrderIdDisplay.textContent = `Order ID: ${orderId}`; 
              if(userOrderTotalDisplay) userOrderTotalDisplay.textContent = order.totalAmount.toFixed(2); 
              if(userOrderStatusDisplay) { userOrderStatusDisplay.textContent = order.status; userOrderStatusDisplay.className = `order-status ${order.status.toLowerCase()}`; } 
              if(userOrderDateDisplay) userOrderDateDisplay.textContent = order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleString() : 'N/A'; 
              if(userOrderItemsContainer) { 
                  userOrderItemsContainer.innerHTML = ''; 
                  order.items.forEach(item => { 
                      const sizeDisplay = item.selectedSize ? `<p class="item-option"><strong>Size:</strong> ${item.selectedSize}</p>` : ''; 
                      const colorDisplay = item.selectedColor ? `<p class="item-option"><strong>Color:</strong> ${item.selectedColor}</p>` : ''; 
                      const featuredTag = item.isFeatured ? ' <small style="color:#ffc107;">(Featured)</small>' : '';
                      const deliveryChargeDisplay = (item.deliveryCharge !== undefined && item.deliveryCharge > 0) ? `<p class="item-option"><strong>Delivery:</strong> PKR ${item.deliveryCharge.toFixed(2)}</p>` : ''; // NEW: Delivery per item

                      userOrderItemsContainer.innerHTML += `<div class="order-item-card">
                                                              <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" alt="${item.name}">
                                                              <div class="info">
                                                                  <div class="name">${item.name}${featuredTag}</div>
                                                                  <div class="qty-price">Qty: ${item.quantity} - PKR ${item.price.toFixed(2)} each</div>
                                                                  ${sizeDisplay}
                                                                  ${colorDisplay}
                                                                  ${deliveryChargeDisplay}
                                                              </div>
                                                            </div>`; 
                  }); 
                  userOrderItemsContainer.innerHTML += `<p style="margin-top:10px;"><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p><p><strong>Payment Status:</strong> ${order.paymentStatus || 'N/A'}</p>`; 
                  if (order.paymentMethod === 'Wallet') {
                       userOrderItemsContainer.innerHTML += `<p><small>Paid with Bonus: PKR ${ (order.deductedFromBonus || 0).toFixed(2)}, Paid with Deposit: PKR ${(order.deductedFromDeposit || 0).toFixed(2)}</small></p>`;
                  }
              } 
              showView('order-detail-user-view'); 
          } else { 
              alert("Order not found."); 
          } 
      } catch (error) { 
          alert("Could not load order details."); 
      } 
  }

  function checkUrlForProduct() {
      const currentHash = window.location.hash;
      
      if (getCurrentVisibleViewId() === 'product-detail-view' && (!currentHash || !currentHash.startsWith('#product='))) {
          goHomeAndShowForYou(); 
          return; 
      }

      if (currentHash && currentHash.startsWith('#product=')) {
          const productIdFromUrl = currentHash.substring('#product='.length);
          if (allProductsMap[productIdFromUrl]) {
              if (getCurrentVisibleViewId() !== 'product-detail-view' || (currentProductDetail && currentProductDetail.id !== productIdFromUrl) ) {
                   showProductDetail(productIdFromUrl);
              }
          } else {
              console.warn(`Product ID ${productIdFromUrl} from URL not found.`);
              if(getCurrentVisibleViewId() !== 'user-view-main') {
                   goHomeAndShowForYou();
              }
          }
      }
  }

  function renderFeaturedSlider(featuredProducts) {
      if (!featuredSliderContainer) return;
      featuredSliderContainer.innerHTML = '';
      featuredSliderIndex = 0;

      if (featuredProducts.length === 0) {
          if (featuredSliderSection) featuredSliderSection.style.display = 'none';
          return;
      }
      if (featuredSliderSection) featuredSliderSection.style.display = 'block';

      featuredProducts.forEach(p => {
          const slide = document.createElement('div');
          slide.className = 'featured-slide';
          slide.dataset.productId = p.id;
          
          let priceHtml = `<span class="current-price">PKR ${p.price.toFixed(2)}</span>`;
          if (p.originalPrice && p.price < p.originalPrice) {
              priceHtml += `<span class="original-price">PKR ${p.originalPrice.toFixed(2)}</span>`;
          }

          let dealTagHtml = '';
          if (p.originalPrice && p.price < p.originalPrice) {
              const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
              dealTagHtml = `<div class="featured-tag">${discount}% OFF</div>`;
          }

          slide.innerHTML = `
              ${dealTagHtml}
              <img src="${getFirstImageUrl(p)}" alt="${p.name}">
              <div class="featured-slide-info">
                  <h4>${p.name}</h4>
                  <div class="price">${priceHtml}</div>
              </div>
          `;
          slide.addEventListener('click', () => showProductDetail(p.id));
          featuredSliderContainer.appendChild(slide);
      });
      updateSliderArrows();
      moveFeaturedSlider(0);
  }

  function updateSliderArrows() {
      if (!featuredSliderPrev || !featuredSliderNext || !featuredSliderContainer || featuredSliderContainer.children.length === 0) return;
      const slideCount = featuredSliderContainer.children.length;
      const slidesInView = Math.floor(featuredSliderContainer.parentElement.offsetWidth / (featuredSliderContainer.children[0].offsetWidth + 12));
      featuredSliderPrev.disabled = featuredSliderIndex === 0;
      featuredSliderNext.disabled = featuredSliderIndex >= slideCount - slidesInView;
  }

  function moveFeaturedSlider(newIndex) {
      if (!featuredSliderContainer || featuredSliderContainer.children.length === 0) return;
      const slideCount = featuredSliderContainer.children.length;
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= slideCount) newIndex = slideCount - 1;

      featuredSliderIndex = newIndex;
      const slideWidth = featuredSliderContainer.children[0].offsetWidth;
      const offset = -featuredSliderIndex * (slideWidth + 12); // slide width + gap
      featuredSliderContainer.style.transform = `translateX(${offset}px)`;
      updateSliderArrows();
  }

  if(featuredSliderPrev) featuredSliderPrev.addEventListener('click', () => moveFeaturedSlider(featuredSliderIndex - 1));
  if(featuredSliderNext) featuredSliderNext.addEventListener('click', () => moveFeaturedSlider(featuredSliderIndex + 1));
  
  if (bonusBannerCtaBtn) {
      bonusBannerCtaBtn.addEventListener('click', () => {
          if (!firebaseUser) {
              alert("Please log in or sign up to claim your bonus!");
              navigateToAccountView();
              setActiveNav(document.getElementById('user-account-nav-item'));
          } else {
              alert("You have already received your sign-up bonus! Deposit now to get more rewards.");
              navigateToDepositView();
              setActiveNav(document.getElementById('deposit-nav-item'));
          }
      });
  }

  function loadAndRenderHomepageProducts() {
      if (unsubscribeProducts) unsubscribeProducts(); if(loadingMessage) loadingMessage.style.display='block';
      const productsQuery = query(collection(db, 'products'), orderBy('timestamp', 'desc'));
      unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
          allProductsMap = {}; let featured = [], lightning = [], uniqueProductCategories = new Set();
          snapshot.forEach((docSnap) => { 
              const p = { id: docSnap.id, ...docSnap.data() }; 
              p.stock = Number(p.stock || 0); 
              p.soldCount = Number(p.soldCount || 0); 
              p.imageUrls = Array.isArray(p.imageUrls)?p.imageUrls:(p.imageUrls?[p.imageUrls]:[]); 
              p.averageRating = Number(p.averageRating || 0); // Ensure is number
              p.numberOfReviews = Number(p.numberOfReviews || 0); // Ensure is number
              allProductsMap[p.id] = p; 
              if(p.isMegaGame || p.id === MEGA_GAME_TICKET_PRODUCT_ID) {} 
              else if(p.isFeatured) featured.push(p); 
              else if(p.isLightningDeal) lightning.push(p); 
              if(p.category && p.category.trim() && !p.isMegaGame && !p.isFeatured && !p.isLightningDeal) uniqueProductCategories.add(p.category.trim()); 
          });

          renderFeaturedSlider(featured);

          if(lightningDealsContainer) {
              lightningDealsContainer.innerHTML = '';
              if (lightning.length > 0) {
                  lightning.sort((a,b)=>(a.stock-(a.soldCount||0))-(b.stock-(b.soldCount||0))).forEach(p => {
                      const card = createLightningDealCard(p);
                      card.addEventListener('click', () => showProductDetail(p.id));
                      lightningDealsContainer.appendChild(card);
                  });
              } else {
                  lightningDealsContainer.innerHTML = '<p style="text-align:center; color:#bbb; width:100%;" id="no-lightning-deals">No lightning deals.</p>';
              }
          }

          const sortedUniqueCats = Array.from(uniqueProductCategories).sort(); renderHeaderCategoryTabs(sortedUniqueCats); renderMainCategoryNav(sortedUniqueCats);
          
          if (!productsLoadedFirstTime) { 
              productsLoadedFirstTime = true;
              if (!window.location.hash.startsWith('#product=')) {
                  filterAndRenderProducts('For you'); 
              } else {
                  checkUrlForProduct(); 
              }
          } else {
              if (getCurrentVisibleViewId() !== 'product-detail-view' && getCurrentVisibleViewId() !== 'seller-products-view') {
                  filterAndRenderProducts(currentCategoryFilter);
              }
          }

          if(loadingMessage) loadingMessage.style.display='none';
          if (productDetailView.style.display === 'block' && currentProductDetail && allProductsMap[currentProductDetail.id]) {
              showProductDetail(allProductsMap[currentProductDetail.id].id); // Re-render current product detail with updated info
          }
          updateCartUI();
      }, (error) => { console.error("Error loading products: ", error); if(productsContainer) productsContainer.innerHTML = '<p style="color:red;text-align:center;">Error loading products.</p>'; if(loadingMessage) loadingMessage.style.display='none'; if(unsubscribeProducts) unsubscribeProducts(); });
  }

  async function renderWinnerAnnouncements() { if (!winnerListContainer) return; if (unsubscribeWinnerAnnouncements) unsubscribeWinnerAnnouncements(); const q = query(collection(db, "gameWinners"), where("announced", "==", true), orderBy("timestamp", "desc")); unsubscribeWinnerAnnouncements = onSnapshot(q, (snapshot) => { if (snapshot.empty) { winnerListContainer.innerHTML = "<p style='color:#ccc;'>No recent winners. Stay tuned!</p>"; return; } let html = ''; snapshot.forEach(doc => { const winner = doc.data(); const date = winner.timestamp ? new Date(winner.timestamp.seconds * 1000).toLocaleDateString() : 'Recently'; html += `<div class="winner-item">🎉 Congrats to <strong>${winner.userName || 'Lucky Player'}</strong> (Order: ...${winner.orderId ? winner.orderId.slice(-4) : 'N/A'}) who won ${winner.prize || 'a prize'} on ${date}!</div>`; }); winnerListContainer.innerHTML = html; }, (err) => { winnerListContainer.innerHTML = "<p style='color:red;'>Error loading announcements.</p>"; if(unsubscribeWinnerAnnouncements) unsubscribeAdminWinners();}); }

  function setStaticUserCounter() {
      if (userJoinCountValueSpan && userJoinCounterContainer) {
          const staticUserCount = 5437478373;
          userJoinCountValueSpan.textContent = staticUserCount.toLocaleString();
          userJoinCounterContainer.style.display = 'block';
      } else {
          console.warn("User counter elements not found for static display.");
      }
  }

  window.addEventListener('hashchange', () => {
      if (!productsLoadedFirstTime) return; 
      const currentHash = window.location.hash;
      if (currentHash === lastProcessedHash) return; 
      if (!currentHash || !currentHash.startsWith('#product=')) {
          if (getCurrentVisibleViewId() !== 'product-detail-view' || lastProcessedHash.startsWith('#product=')) {
              goHomeAndShowForYou();
          }
      } else {
          checkUrlForProduct(); 
      }
      lastProcessedHash = currentHash; 
  });

  loadCart();
  loadAndRenderHomepageProducts(); 
  renderWinnerAnnouncements();
  setStaticUserCounter(); 

  if(userDepositRequestsList) userDepositRequestsList.innerHTML = '<p style="color:#ccc;">Log in to view.</p>';
  if(userWithdrawalRequestsList) userWithdrawalRequestsList.innerHTML = '<p style="color:#ccc;">Log in to view.</p>';
  if(userOrdersListContainer) userOrdersListContainer.innerHTML = '<p style="color:#ccc;">Log in to view.</p>';
  if(userProductsList) userProductsList.innerHTML = '<p style="color:#ccc;">Log in to view.</p>';
  if(sellerOrdersList) sellerOrdersList.innerHTML = '<p style="color:#ccc;">Log in to view.</p>';

  if (!window.location.hash.startsWith('#product=')) {
       showView('user-view-main'); 
       setActiveNav(document.querySelector('.bottom-nav .nav-item[onclick*="goHomeAndShowForYou()"]'));
       lastProcessedHash = ''; 
  }

  // --- NEW: Product Comments System ---

  // Event listener for adding a new comment
  if (addCommentForm) {
    addCommentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!firebaseUser || !userProfile) {
        showAuthMessage(commentFormMessage, "Please log in to add a comment.", "error");
        return;
      }
      if (!currentProductDetail || !currentProductDetail.id) {
        showAuthMessage(commentFormMessage, "No product selected to comment on.", "error");
        return;
      }

      const commentText = commentTextInput.value.trim();
      if (!commentText) {
        showAuthMessage(commentFormMessage, "Comment cannot be empty.", "warning");
        return;
      }

      submitCommentBtn.disabled = true;
      submitCommentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

      try {
        await addDoc(collection(db, 'productComments'), {
          productId: currentProductDetail.id,
          userId: firebaseUser.uid,
          userName: userProfile.name || 'Anonymous User',
          userEmail: userProfile.email || 'N/A',
          commentText: commentText,
          timestamp: serverTimestamp(),
          // You could add fields like 'approved: false' for moderation if needed
        });

        showAuthMessage(commentFormMessage, "Comment added successfully!", "success");
        commentTextInput.value = ''; // Clear the input field
      } catch (error) {
        console.error("Error adding comment:", error);
        showAdminMessage(commentFormMessage, "Failed to add comment. Please try again.", "error"); // Use showAdminMessage as showAuthMessage might be for auth forms only
      } finally {
        submitCommentBtn.disabled = false;
        submitCommentBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Comment';
      }
    });
  }

  // Function to render product comments
  function renderProductComments(productId) {
    if (!productCommentsList) return;

    // Detach previous listener if exists
    if (unsubscribeProductComments) {
      unsubscribeProductComments();
    }

    productCommentsList.innerHTML = '<p style="text-align:center; color:#555;">Loading comments...</p>';

    const commentsQuery = query(
      collection(db, 'productComments'),
      where('productId', '==', productId),
      orderBy('timestamp', 'desc')
      // You might add where('approved', '==', true) if implementing moderation
    );

    unsubscribeProductComments = onSnapshot(commentsQuery, (snapshot) => {
      if (snapshot.empty) {
        productCommentsList.innerHTML = '<p style="text-align:center; color:#555;">No comments yet. Be the first to comment!</p>';
        return;
      }

      let commentsHtml = '';
      snapshot.forEach((docSnap) => {
        const comment = docSnap.data();
        const commentDate = comment.timestamp && comment.timestamp.seconds 
                           ? new Date(comment.timestamp.seconds * 1000).toLocaleString() 
                           : 'N/A';
        
        commentsHtml += `
          <div class="card" style="margin-bottom: 10px; background-color: #f0f0f0; border: 1px solid #ddd; color: #333;">
            <p><strong>${comment.userName || 'Anonymous'}</strong> <span style="font-size:0.8em; color:#777;">on ${commentDate}</span></p>
            <p style="margin-top: 5px;">${comment.commentText}</p>
          </div>
        `;
      });
      productCommentsList.innerHTML = commentsHtml;
    }, (error) => {
      console.error("Error fetching product comments:", error);
      if (error.code === 'failed-precondition') {
          productCommentsList.innerHTML = `<p style='color:red; text-align:center; padding: 20px;'><b>Error:</b> A database index is required for querying comments. Please check the browser console for a link to create it in Firebase (usually appears as a direct link in the error message).</p>`;
      } else {
          productCommentsList.innerHTML = "<p style='color:red; text-align:center;'>Error loading comments. Check console for details.</p>";
      }
      if (unsubscribeProductComments) unsubscribeProductComments(); // Ensure listener is detached on error
    });
  }
