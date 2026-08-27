/*
  ========================================================
  MAIN JAVASCRIPT FILE - E-COMMERCE FUNCTIONALITY
  ========================================================

  Handles:
  - Loading products and categories
  - Searching and filtering products
  - Shopping cart
  - Product reviews and ratings
  - Featured products
  - Discounts
  - Orders / checkout
  - User interactions

  ========================================================
*/


// ========================================================
// API CONFIGURATION
// ========================================================

// PRODUCTION BACKEND
const API_URL = 'https://karma-s-website-1.onrender.com/api';

// If you want to test locally again, change it to:
// const API_URL = 'http://localhost:5000/api';

console.log('API URL:', API_URL);


// ========================================================
// GLOBAL VARIABLES
// ========================================================

let products = [];

let cart = JSON.parse(localStorage.getItem("cart")) || [];

let productRatings = {};

let filteredProducts = [];

let currentSort = 'default';

let currentPriceFilter = 2000;

let currentCategoryFilter = null;


// ========================================================
// CATEGORY LOADING
// ========================================================

async function loadCategories() {

  try {

    const response = await fetch(`${API_URL}/categories`);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      displayCategories(data.data);
    } else {
      console.error('Error loading categories:', data.error);
    }

  } catch (error) {

    console.error('Error loading categories:', error);

  }

}


// ========================================================
// DISPLAY CATEGORIES
// ========================================================

function displayCategories(categories) {

  const filterGroup = document.getElementById('categoriesFilter');

  if (!filterGroup) {
    console.warn('categoriesFilter element not found');
    return;
  }

  // Clear existing categories
  filterGroup.innerHTML = '';


  // ======================================================
  // ALL CATEGORIES BUTTON
  // ======================================================

  const allCategoriesBtn = document.createElement('div');

  allCategoriesBtn.className = 'category-thumbnail active';

  allCategoriesBtn.innerHTML = `
    <div class="category-thumbnail-img">🏪</div>
    <div class="category-thumbnail-name">All</div>
  `;


  allCategoriesBtn.onclick = () => {

    if (window.location.pathname.includes('category-results')) {

      window.location.href = 'index.html';

    } else {

      filterByCategory(null);

    }

  };


  filterGroup.appendChild(allCategoriesBtn);


  // ======================================================
  // CATEGORY BUTTONS
  // ======================================================

  categories.forEach(category => {

    const categoryEmoji = getCategoryEmoji(category);

    const thumbnail = document.createElement('div');

    thumbnail.className = 'category-thumbnail';

    thumbnail.innerHTML = `
      <div class="category-thumbnail-img">
        ${categoryEmoji}
      </div>

      <div class="category-thumbnail-name">
        ${String(category).charAt(0).toUpperCase() + String(category).slice(1)}
      </div>
    `;


    thumbnail.onclick = () => {

      const isHomePage =
        window.location.pathname.includes('index.html') ||
        window.location.pathname.endsWith('/');


      if (isHomePage) {

        window.location.href =
          `category-results.html?category=${encodeURIComponent(category)}`;

      } else {

        filterByCategory(category);

      }

    };


    filterGroup.appendChild(thumbnail);

  });

}


// ========================================================
// CATEGORY EMOJIS
// ========================================================

function getCategoryEmoji(category) {

  const emojiMap = {

    electronics: '📱',

    clothing: '👕',

    books: '📚',

    home: '🏠',

    sports: '⚽',

    toys: '🧸',

    food: '🍔',

    beauty: '💄',

    furniture: '🛋️',

    accessories: '👜',

    default: '📦'

  };


  return (
    emojiMap[String(category).toLowerCase()] ||
    emojiMap.default
  );

}


// ========================================================
// CATEGORY FILTER
// ========================================================

function filterByCategory(category) {

  currentCategoryFilter = category;


  document
    .querySelectorAll('.category-thumbnail')
    .forEach(thumb => {

      thumb.classList.remove('active');

    });


  const thumbnails =
    document.querySelectorAll('.category-thumbnail');


  if (category === null) {

    if (thumbnails[0]) {
      thumbnails[0].classList.add('active');
    }

  } else {

    thumbnails.forEach(thumb => {

      if (
        thumb.textContent
          .toLowerCase()
          .includes(String(category).toLowerCase())
      ) {

        thumb.classList.add('active');

      }

    });

  }


  applyFilters();

}


// ========================================================
// PRICE FILTER
// ========================================================

function filterByPrice(value) {

  currentPriceFilter = Number(value);


  const priceValue =
    document.getElementById('priceValue');

  if (priceValue) {
    priceValue.textContent = value;
  }


  applyFilters();

}


// ========================================================
// SORT PRODUCTS
// ========================================================

function sortProducts(sortType) {

  currentSort = sortType;

  applyFilters();

}


// ========================================================
// APPLY FILTERS
// ========================================================

function applyFilters() {

  let filtered = [...products];


  // ======================================================
  // CATEGORY FILTER
  // ======================================================

  if (currentCategoryFilter) {

    filtered = filtered.filter(product =>

      String(product.category).toLowerCase() ===
      String(currentCategoryFilter).toLowerCase()

    );

  }


  // ======================================================
  // PRICE FILTER
  // ======================================================

  const discountedPrice = product => {

    const price = Number(product.price) || 0;

    const discount = Number(product.discount) || 0;

    return price * (1 - discount / 100);

  };


  filtered = filtered.filter(product =>

    discountedPrice(product) <= currentPriceFilter

  );


  // ======================================================
  // SORTING
  // ======================================================

  switch (currentSort) {

    case 'name':

      filtered.sort((a, b) =>

        String(a.name || '')
          .localeCompare(String(b.name || ''))

      );

      break;


    case 'price-low':

      filtered.sort((a, b) =>

        discountedPrice(a) - discountedPrice(b)

      );

      break;


    case 'price-high':

      filtered.sort((a, b) =>

        discountedPrice(b) - discountedPrice(a)

      );

      break;


    case 'rating':

      filtered.sort((a, b) => {

        const ratingA =
          productRatings[a.id]?.averageRating || 0;

        const ratingB =
          productRatings[b.id]?.averageRating || 0;

        return ratingB - ratingA;

      });

      break;

  }


  filteredProducts = filtered;

  renderProducts(filteredProducts);

}


// ========================================================
// RESET FILTERS
// ========================================================

function resetFilters() {

  currentSort = 'default';

  currentPriceFilter = 2000;

  currentCategoryFilter = null;


  const priceRange =
    document.getElementById('priceRange');

  if (priceRange) {
    priceRange.value = 2000;
  }


  const priceValue =
    document.getElementById('priceValue');

  if (priceValue) {
    priceValue.textContent = 2000;
  }


  document
    .querySelectorAll('.category-thumbnail')
    .forEach((thumb, index) => {

      if (index === 0) {

        thumb.classList.add('active');

      } else {

        thumb.classList.remove('active');

      }

    });


  filteredProducts = [...products];

  renderProducts(products);

}


// ========================================================
// SHOW ALL PRODUCTS
// ========================================================

function showAllProducts() {

  resetFilters();


  const productContainer =
    document.querySelector('.product-container');


  if (productContainer) {

    window.scrollTo({

      top: productContainer.offsetTop - 100,

      behavior: 'smooth'

    });

  }

}


// ========================================================
// LOAD PRODUCTS
// ========================================================

async function loadProducts(filters = {}) {

  try {

    let url = `${API_URL}/products`;


    const params = new URLSearchParams();


    if (filters.search) {

      params.append(
        'search',
        filters.search
      );

    }


    if (filters.category) {

      params.append(
        'category',
        filters.category
      );

    }


    if (filters.minPrice) {

      params.append(
        'minPrice',
        filters.minPrice
      );

    }


    if (filters.maxPrice) {

      params.append(
        'maxPrice',
        filters.maxPrice
      );

    }


    if (params.toString()) {

      url += `?${params.toString()}`;

    }


    console.log('Loading products from:', url);


    const response = await fetch(url);


    if (!response.ok) {

      throw new Error(
        `HTTP error: ${response.status}`
      );

    }


    const data = await response.json();


    if (data.success) {

      products = data.data || [];

      console.log(
        'Products loaded:',
        products.length
      );


      renderProducts(products);


      // ==================================================
      // LOAD PRODUCT RATINGS
      // ==================================================

      await Promise.all(

        products.map(product =>
          loadProductRatings(product.id)
        )

      );


      renderProducts(products);


      // ==================================================
      // INITIALIZE SEARCH
      // ==================================================

      if (!window.searchInitialized) {

        initializeSearch();

        window.searchInitialized = true;

      }

    } else {

      console.error(
        'Error loading products:',
        data.error
      );

      showAlert(
        'Error loading products',
        'error'
      );

    }

  } catch (error) {

    console.error(
      'Failed to load products:',
      error
    );


    showAlert(
      'Failed to connect to the backend server',
      'error'
    );

  }

}


// ========================================================
// RENDER PRODUCTS
// ========================================================

function renderProducts(productsToRender) {

  const container =
    document.querySelector('.product-container');


  if (!container) {

    console.warn(
      'product-container not found'
    );

    return;

  }


  if (!productsToRender ||
      productsToRender.length === 0) {

    container.innerHTML = `
      <p style="
        grid-column: 1/-1;
        text-align: center;
        padding: 40px;
      ">
        No products found
      </p>
    `;

    return;

  }


  container.innerHTML = productsToRender
    .map(product => {


      const rating =
        productRatings[product.id] || {

          averageRating: 0,

          totalReviews: 0

        };


      const stars =
        generateStarRating(
          rating.averageRating
        );


      const discount =
        Number(product.discount) || 0;


      const finalPrice =
        Number(product.price) *
        (1 - discount / 100);


      const discountBadge =
        discount > 0
          ? `<div class="discount-badge">
               ${discount}% OFF
             </div>`
          : '';


      const productName =
        String(product.name || 'Product');


      const escapedName =
        productName.replace(
          /'/g,
          "\\'"
        );


      return `

        <div
          class="product-card"
          data-name="${productName}"
          data-id="${product.id}"
          data-price="${product.price}"
        >

          ${discountBadge}


          <img
            src="${product.image || ''}"
            alt="${productName}"
            width="200"
            height="200"
            onerror="this.src='https://via.placeholder.com/200?text=No+Image'"
          >


          <h2>
            ${productName}
          </h2>


          <p>
            ${product.category || ''}
          </p>


          <div class="price-section">

            ${
              discount > 0
                ? `<p class="original-price">
                     $${Number(product.price).toFixed(2)}
                   </p>`
                : ''
            }


            <p class="final-price">
              Price: $${finalPrice.toFixed(2)}
            </p>

          </div>


          <div class="rating-section">

            <span class="stars">
              ${stars}
            </span>


            <span class="rating-info">

              ${
                rating.averageRating > 0
                  ? rating.averageRating
                  : 'No'
              }

              (${rating.totalReviews} reviews)

            </span>


            <button
              class="review-btn"
              onclick="openReviewModal(
                ${product.id},
                '${escapedName}'
              )"
            >
              📝 Reviews
            </button>

          </div>


          <button
            class="add-to-cart-btn"
            onclick="addToCartFromProduct(this)"
          >
            Add to Cart
          </button>

        </div>

      `;

    })
    .join('');

}


// ========================================================
// PRODUCT CAROUSEL
// ========================================================

function renderProductCarousel(
  productsToRender,
  containerId,
  isDiscount = false
) {

  const container =
    document.getElementById(containerId);


  if (!container) {
    return;
  }


  if (
    !productsToRender ||
    productsToRender.length === 0
  ) {

    container.innerHTML = `
      <p style="
        text-align:center;
        padding:40px;
      ">
        No products found
      </p>
    `;

    return;

  }


  container.innerHTML =
    productsToRender.map(product => {


      const rating =
        productRatings[product.id] || {

          averageRating: 0,

          totalReviews: 0

        };


      const stars =
        generateStarRating(
          rating.averageRating
        );


      const discount =
        Number(product.discount) || 0;


      const finalPrice =
        Number(product.price) *
        (1 - discount / 100);


      const discountBadge =
        discount > 0
          ? `<div class="discount-badge">
               ${discount}% OFF
             </div>`
          : '';


      let priceHtml = '';


      if (
        isDiscount &&
        product.discountedPrice
      ) {

        priceHtml = `

          <div class="price-section">

            <p class="original-price">
              $${Number(
                product.originalPrice
              ).toFixed(2)}
            </p>


            <p class="final-price">
              $${Number(
                product.discountedPrice
              ).toFixed(2)}
            </p>


            <p class="savings">
              Save: $${Number(
                product.savings || 0
              ).toFixed(2)}
            </p>

          </div>

        `;

      } else {

        priceHtml = `

          <p class="final-price">
            $${finalPrice.toFixed(2)}
          </p>

        `;

      }


      return `

        <div
          class="product-card carousel-card"
          data-name="${product.name}"
          data-id="${product.id}"
          data-price="${product.price}"
        >

          ${discountBadge}


          <img
            src="${product.image || ''}"
            alt="${product.name}"
            width="180"
            height="180"
            onerror="this.src='https://via.placeholder.com/180?text=No+Image'"
          >


          <h3>
            ${product.name}
          </h3>


          ${priceHtml}


          <div class="rating-section">

            <span class="stars">
              ${stars}
            </span>


            <span class="rating-info">

              ${
                rating.averageRating > 0
                  ? rating.averageRating
                  : 'N/A'
              }

            </span>

          </div>


          <button
            class="add-to-cart-btn"
            onclick="addToCartFromProduct(this)"
          >
            Add to Cart
          </button>

        </div>

      `;

    }).join('');

}


// ========================================================
// CART MANAGEMENT
// ========================================================

function saveCart() {

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );


  updateCartCount();

}


// ========================================================
// ADD TO CART
// ========================================================

function addToCartFromProduct(button) {

  const card =
    button.closest('.product-card');


  if (!card) {
    return;
  }


  const productName =
    card.getAttribute("data-name");


  const price =
    parseFloat(
      card.getAttribute("data-price")
    );


  const productId =
    card.getAttribute("data-id");


  const existingItem =
    cart.find(
      item =>
        String(item.id) ===
        String(productId)
    );


  if (existingItem) {

    existingItem.quantity += 1;

  } else {

    cart.push({

      id: productId,

      name: productName,

      price: price,

      quantity: 1

    });

  }


  saveCart();


  showCartNotification(
    productName
  );


  button.textContent = "Added!";

  button.style.backgroundColor =
    "#4caf50";


  setTimeout(() => {

    button.textContent =
      "Add to Cart";

    button.style.backgroundColor =
      "";

  }, 1500);

}


// ========================================================
// REMOVE FROM CART
// ========================================================

function removeFromCart(productName) {

  cart = cart.filter(
    item => item.name !== productName
  );


  saveCart();

  displayCart();

}


// ========================================================
// UPDATE CART QUANTITY
// ========================================================

function updateCartQuantity(
  productName,
  quantity
) {

  const item =
    cart.find(
      item =>
        item.name === productName
    );


  if (!item) {
    return;
  }


  const newQuantity =
    parseInt(quantity);


  if (
    isNaN(newQuantity) ||
    newQuantity <= 0
  ) {

    removeFromCart(productName);

    return;

  }


  item.quantity =
    newQuantity;


  saveCart();

  displayCart();

}


// ========================================================
// CART NOTIFICATION
// ========================================================

function showCartNotification(
  productName
) {

  const notification =
    document.createElement("div");


  notification.className =
    "cart-notification";


  notification.textContent =
    `✓ ${productName} added to cart!`;


  document.body.appendChild(
    notification
  );


  setTimeout(() => {

    notification.remove();

  }, 2000);

}


// ========================================================
// CART TOTAL
// ========================================================

function getCartTotal() {

  return cart.reduce(
    (total, item) =>
      total +
      (
        Number(item.price) *
        Number(item.quantity)
      ),
    0
  );

}


// ========================================================
// CART COUNT
// ========================================================

function getCartCount() {

  return cart.reduce(
    (count, item) =>
      count +
      Number(item.quantity),
    0
  );

}


// ========================================================
// UPDATE CART COUNT
// ========================================================

function updateCartCount() {

  const cartCountElement =
    document.getElementById(
      "cartCount"
    );


  if (cartCountElement) {

    cartCountElement.textContent =
      getCartCount();

  }

}


// ========================================================
// OPEN CART
// ========================================================

function openCart() {

  const cartModal =
    document.getElementById(
      "cartModal"
    );


  if (!cartModal) {
    return;
  }


  cartModal.style.display =
    "block";


  displayCart();

}


// ========================================================
// CLOSE CART
// ========================================================

function closeCart() {

  const cartModal =
    document.getElementById(
      "cartModal"
    );


  if (cartModal) {

    cartModal.style.display =
      "none";

  }

}


// ========================================================
// DISPLAY CART
// ========================================================

function displayCart() {

  const cartItemsDiv =
    document.getElementById(
      "cartItems"
    );


  const cartTotalSpan =
    document.getElementById(
      "cartTotal"
    );


  if (
    !cartItemsDiv ||
    !cartTotalSpan
  ) {

    return;

  }


  if (cart.length === 0) {

    cartItemsDiv.innerHTML =
      "<p class='empty-cart'>Your cart is empty</p>";


    cartTotalSpan.textContent =
      "0.00";


    return;

  }


  let html =
    "<div class='cart-items-responsive'>";


  let total = 0;


  cart.forEach(item => {

    const subtotal =
      Number(item.price) *
      Number(item.quantity);


    total += subtotal;


    const safeName =
      String(item.name)
        .replace(/'/g, "\\'");


    html += `

      <div class="cart-item">

        <div class="cart-item-details">

          <h4>
            ${item.name}
          </h4>


          <p>

            $${Number(
              item.price
            ).toFixed(2)}

            x

            <input
              type="number"
              min="1"
              value="${item.quantity}"
              onchange="updateCartQuantity(
                '${safeName}',
                this.value
              )"
              class="quantity-input"
            >

          </p>

        </div>


        <div class="cart-item-actions">

          <p class="subtotal">

            $${subtotal.toFixed(2)}

          </p>


          <button
            class="remove-btn"
            onclick="removeFromCart(
              '${safeName}'
            )"
          >
            Remove
          </button>

        </div>

      </div>

    `;

  });


  html += "</div>";


  cartItemsDiv.innerHTML =
    html;


  cartTotalSpan.textContent =
    total.toFixed(2);

}


// ========================================================
// CHECKOUT
// ========================================================

async function checkout() {

  if (cart.length === 0) {

    showAlert(
      "Your cart is empty!",
      "error"
    );

    return;

  }


  const total =
    getCartTotal();


  const itemsCount =
    getCartCount();


  const confirmed =
    confirm(

      `Total Items: ${itemsCount}\n` +
      `Total Amount: $${total.toFixed(2)}\n\n` +
      `Proceed to payment?`

    );


  if (!confirmed) {
    return;
  }


  try {

    showAlert(
      "Processing your order...",
      "info"
    );


    const response =
      await fetch(
        `${API_URL}/orders`,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            items: cart,

            total: total,

            customer: {

              name: "Customer",

              email:
                "customer@example.com"

            }

          })

        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP error: ${response.status}`
      );

    }


    const data =
      await response.json();


    if (data.success) {

      const orderInfo =
        data.data;


      const deliveryDate =
        orderInfo.estimatedDelivery
          ? new Date(
              orderInfo.estimatedDelivery
            ).toLocaleDateString()
          : "To be confirmed";


      showAlert(

        `✓ Order placed successfully!\n\n` +

        `Order ID: ${
          orderInfo.orderId
        }\n` +

        `Total: $${total.toFixed(2)}\n\n` +

        `Estimated Delivery: ${
          deliveryDate
        }`,

        "success"

      );


      cart = [];


      saveCart();


      closeCart();


    } else {

      showAlert(

        "Error placing order: " +
        (data.error ||
          "Unknown error"),

        "error"

      );

    }

  } catch (error) {

    console.error(
      "Checkout error:",
      error
    );


    showAlert(
      "Failed to place order. Please try again.",
      "error"
    );

  }

}


// ========================================================
// CLEAR CART
// ========================================================

function clearCart() {

  if (
    confirm(
      "Are you sure you want to clear your cart?"
    )
  ) {

    cart = [];


    saveCart();


    displayCart();

  }

}


// ========================================================
// ALERT SYSTEM
// ========================================================

function showAlert(
  message,
  type = "info"
) {

  const alertDiv =
    document.createElement(
      "div"
    );


  alertDiv.className =
    `custom-alert alert-${type}`;


  alertDiv.textContent =
    message;


  document.body.appendChild(
    alertDiv
  );


  setTimeout(() => {

    if (alertDiv.parentNode) {

      alertDiv.remove();

    }

  }, 5000);

}


// ========================================================
// FEATURED PRODUCTS
// ========================================================

async function loadTopRated() {

  try {

    const response =
      await fetch(
        `${API_URL}/top-rated?limit=6`
      );


    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status}`
      );
    }


    const data =
      await response.json();


    if (data.success) {

      renderProductCarousel(
        data.data,
        "topRatedContainer"
      );

    }

  } catch (error) {

    console.error(
      "Error loading top-rated:",
      error
    );

  }

}


// ========================================================
// DISCOUNTS
// ========================================================

async function loadDiscounts() {

  try {

    const response =
      await fetch(
        `${API_URL}/discounts?limit=6`
      );


    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status}`
      );
    }


    const data =
      await response.json();


    if (data.success) {

      renderProductCarousel(
        data.data,
        "discountsContainer",
        true
      );

    }

  } catch (error) {

    console.error(
      "Error loading discounts:",
      error
    );

  }

}


// ========================================================
// SUGGESTIONS
// ========================================================

async function loadSuggestions() {

  try {

    const response =
      await fetch(
        `${API_URL}/suggestions?limit=8`
      );


    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status}`
      );
    }


    const data =
      await response.json();


    if (data.success) {

      renderProductCarousel(
        data.data,
        "suggestionsContainer"
      );

    }

  } catch (error) {

    console.error(
      "Error loading suggestions:",
      error
    );

  }

}


// ========================================================
// SCROLL TO SECTION
// ========================================================

function scrollToSection(
  sectionId
) {

  const section =
    document.getElementById(
      sectionId
    );


  if (section) {

    section.scrollIntoView({

      behavior: "smooth"

    });

  }

}


// ========================================================
// REVIEWS
// ========================================================

function generateStarRating(
  rating
) {

  const numericRating =
    Number(rating) || 0;


  const fullStars =
    Math.floor(numericRating);


  const hasHalfStar =
    numericRating % 1 >= 0.5;


  let stars =
    "⭐".repeat(
      Math.min(fullStars, 5)
    );


  if (
    hasHalfStar &&
    fullStars < 5
  ) {

    stars += "⭐";

  }


  return (
    stars ||
    "✦ No rating yet"
  );

}


// ========================================================
// LOAD PRODUCT RATINGS
// ========================================================

async function loadProductRatings(
  productId
) {

  try {

    const response =
      await fetch(
        `${API_URL}/reviews/${productId}`
      );


    if (!response.ok) {
      return;
    }


    const data =
      await response.json();


    if (data.success) {

      productRatings[productId] = {

        averageRating:
          Number(
            data.averageRating
          ) || 0,

        totalReviews:
          Number(
            data.totalReviews
          ) || 0,

        reviews:
          data.data || []

      };

    }

  } catch (error) {

    console.error(
      "Error loading ratings:",
      error
    );

  }

}


// ========================================================
// OPEN REVIEW MODAL
// ========================================================

async function openReviewModal(
  productId,
  productName
) {

  const reviewModal =
    document.getElementById(
      "reviewModal"
    );


  const reviewProductId =
    document.getElementById(
      "reviewProductId"
    );


  const reviewProductName =
    document.getElementById(
      "reviewProductName"
    );


  const reviewForm =
    document.getElementById(
      "reviewForm"
    );


  if (!reviewModal) {
    return;
  }


  reviewModal.style.display =
    "block";


  if (reviewProductId) {

    reviewProductId.value =
      productId;

  }


  if (reviewProductName) {

    reviewProductName.textContent =
      `Reviews for ${productName}`;

  }


  if (reviewForm) {

    reviewForm.reset();

  }


  await loadProductReviews(
    productId
  );

}


// ========================================================
// CLOSE REVIEW MODAL
// ========================================================

function closeReviewModal() {

  const modal =
    document.getElementById(
      "reviewModal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }

}


// ========================================================
// LOAD PRODUCT REVIEWS
// ========================================================

async function loadProductReviews(
  productId
) {

  try {

    const response =
      await fetch(
        `${API_URL}/reviews/${productId}`
      );


    if (!response.ok) {

      throw new Error(
        `HTTP error: ${response.status}`
      );

    }


    const data =
      await response.json();


    if (data.success) {

      displayReviews(

        data.data || [],

        Number(
          data.averageRating
        ) || 0,

        Number(
          data.totalReviews
        ) || 0

      );

    }

  } catch (error) {

    console.error(
      "Error loading reviews:",
      error
    );

  }

}


// ========================================================
// DISPLAY REVIEWS
// ========================================================

function displayReviews(
  reviews,
  avgRating,
  totalReviews
) {

  const container =
    document.getElementById(
      "reviewsContainer"
    );


  if (!container) {
    return;
  }


  let html = `

    <div class="reviews-header">

      <h4>

        Average Rating:

        ${
          avgRating > 0
            ? `${avgRating}/5`
            : "No ratings yet"
        }

      </h4>


      <p>
        Total Reviews: ${totalReviews}
      </p>

    </div>

  `;


  if (reviews.length === 0) {

    html += `

      <p style="
        text-align:center;
        color:#999;
      ">

        No reviews yet.
        Be the first to review!

      </p>

    `;

  } else {

    html +=
      '<div class="reviews-list">';


    reviews.forEach(review => {

      html += `

        <div class="review-item">

          <div class="review-header">

            <strong>
              ${review.customerName || "Customer"}
            </strong>


            <span class="review-rating">

              ${generateStarRating(
                review.rating
              )}

            </span>

          </div>


          <p class="review-title">

            ${review.title || ""}

          </p>


          <p class="review-comment">

            ${review.comment || ""}

          </p>


          <small class="review-date">

            ${
              review.timestamp
                ? new Date(
                    review.timestamp
                  ).toLocaleDateString()
                : ""
            }

          </small>

        </div>

      `;

    });


    html +=
      "</div>";

  }


  container.innerHTML =
    html;

}


// ========================================================
// SUBMIT REVIEW
// ========================================================

async function submitReview(
  event
) {

  event.preventDefault();


  const productId =
    document.getElementById(
      "reviewProductId"
    )?.value;


  const customerName =
    document.getElementById(
      "reviewCustomerName"
    )?.value;


  const rating =
    document.getElementById(
      "reviewRating"
    )?.value;


  const title =
    document.getElementById(
      "reviewTitle"
    )?.value;


  const comment =
    document.getElementById(
      "reviewComment"
    )?.value;


  if (!productId) {

    showAlert(
      "Invalid product",
      "error"
    );

    return;

  }


  try {

    const response =
      await fetch(
        `${API_URL}/reviews`,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            productId:
              parseInt(productId),

            customerName:
              customerName,

            rating:
              parseInt(rating),

            title:
              title,

            comment:
              comment

          })

        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP error: ${response.status}`
      );

    }


    const data =
      await response.json();


    if (data.success) {

      showAlert(
        "✓ Review submitted successfully!",
        "success"
      );


      const reviewForm =
        document.getElementById(
          "reviewForm"
        );


      if (reviewForm) {
        reviewForm.reset();
      }


      await loadProductRatings(
        productId
      );


      await loadProductReviews(
        productId
      );


      renderProducts(
        products
      );


    } else {

      showAlert(

        "Error submitting review: " +
        (data.error ||
          "Unknown error"),

        "error"

      );

    }

  } catch (error) {

    console.error(
      "Review error:",
      error
    );


    showAlert(
      "Failed to submit review",
      "error"
    );

  }

}


// ========================================================
// SEARCH
// ========================================================

function initializeSearch() {

  const searchForm =
    document.querySelector(
      ".search-bar"
    );


  if (!searchForm) {
    return;
  }


  const isSearchResultsPage =
    window.location.pathname.includes(
      "search-results"
    );


  // ======================================================
  // SEARCH RESULTS PAGE
  // ======================================================

  if (!isSearchResultsPage) {

    return;

  }


  const searchInput =
    searchForm.querySelector(
      "input[name='query']"
    );


  if (!searchInput) {
    return;
  }


  searchForm.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      const searchValue =
        searchInput.value
          .toLowerCase()
          .trim();


      if (!searchValue) {

        renderProducts(
          products
        );

      } else {

        performSearch(
          searchValue
        );

      }

    }
  );


  searchInput.addEventListener(
    "keyup",
    function() {

      const searchValue =
        this.value
          .toLowerCase()
          .trim();


      if (!searchValue) {

        renderProducts(
          products
        );

      } else {

        performSearch(
          searchValue
        );

      }

    }
  );

}


// ========================================================
// PERFORM SEARCH
// ========================================================

function performSearch(
  searchTerm
) {

  console.log(
    "Searching for:",
    searchTerm
  );


  console.log(
    "Available products:",
    products.length
  );


  const searchLower =
    searchTerm.toLowerCase();


  const filtered =
    products.filter(product => {

      const nameMatch =
        product.name &&
        String(product.name)
          .toLowerCase()
          .includes(searchLower);


      const categoryMatch =
        product.category &&
        String(product.category)
          .toLowerCase()
          .includes(searchLower);


      const descriptionMatch =
        product.description &&
        String(product.description)
          .toLowerCase()
          .includes(searchLower);


      const brandMatch =
        product.brand &&
        String(product.brand)
          .toLowerCase()
          .includes(searchLower);


      return (
        nameMatch ||
        categoryMatch ||
        descriptionMatch ||
        brandMatch
      );

    });


  console.log(
    "Filtered products:",
    filtered.length
  );


  if (filtered.length === 0) {

    showAlert(
      `No products found matching "${searchTerm}"`,
      "info"
    );

  }


  renderProducts(
    filtered
  );

}


// ========================================================
// MODAL CLOSE ON OUTSIDE CLICK
// ========================================================

window.addEventListener(
  "click",
  function(event) {

    const cartModal =
      document.getElementById(
        "cartModal"
      );


    const reviewModal =
      document.getElementById(
        "reviewModal"
      );


    if (
      cartModal &&
      event.target === cartModal
    ) {

      cartModal.style.display =
        "none";

    }


    if (
      reviewModal &&
      event.target === reviewModal
    ) {

      reviewModal.style.display =
        "none";

    }

  }
);


// ========================================================
// INITIALIZATION
// ========================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "E-commerce application starting..."
    );


    // Load products
    loadProducts();


    // Load categories
    loadCategories();


    // Update cart
    updateCartCount();


    // ====================================================
    // LOAD FEATURED SECTIONS
    // ====================================================

    setTimeout(() => {

      loadDiscounts();

    }, 1000);


    setTimeout(() => {

      loadTopRated();

    }, 1500);


    setTimeout(() => {

      loadSuggestions();

    }, 2000);


    // ====================================================
    // KEYBOARD SHORTCUT
    // CTRL + C = OPEN CART
    // ====================================================

    document.addEventListener(
      "keydown",
      function(event) {

        if (
          event.ctrlKey &&
          event.key.toLowerCase() === "c"
        ) {

          event.preventDefault();

          openCart();

        }

      }
    );


    console.log(
      "E-commerce application initialized."
    );

  }
);