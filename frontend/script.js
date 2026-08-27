/*
  ========================================================
  MAIN JAVASCRIPT FILE - E-COMMERCE FUNCTIONALITY
  ========================================================
  
  This file contains all the JavaScript logic that makes the e-commerce store work.
  It handles:
  - Loading products and categories from the backend
  - Searching and filtering products
  - Managing the shopping cart
  - Displaying and handling product reviews
  - User interactions (clicks, form submissions, etc.)
  
  ========================================================
*/

// ========== API CONFIGURATION ==========
// Production backend deployed on Render
const API_URL = 'https://karma-s-website-1.onrender.com/api';

// ========== PRODUCT DATABASE & CART VARIABLES ==========
let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let productRatings = {};
let filteredProducts = [];
let currentSort = 'default';
let currentPriceFilter = 2000;
let currentCategoryFilter = null;

// ========== CATEGORY LOADING & DISPLAY FUNCTIONS ==========

async function loadCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`);
    const data = await response.json();
    
    if (data.success) {
      displayCategories(data.data);
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

function displayCategories(categories) {
  const filterGroup = document.getElementById('categoriesFilter');
  
  const allCategoriesBtn = document.createElement('div');
  allCategoriesBtn.className = 'category-thumbnail';
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
  
  categories.forEach(category => {
    const categoryEmoji = getCategoryEmoji(category);
    const thumbnail = document.createElement('div');
    thumbnail.className = 'category-thumbnail';

    thumbnail.innerHTML = `
      <div class="category-thumbnail-img">${categoryEmoji}</div>
      <div class="category-thumbnail-name">
        ${category.charAt(0).toUpperCase() + category.slice(1)}
      </div>
    `;

    thumbnail.onclick = () => {
      if (
        window.location.pathname.includes('index.html') ||
        window.location.pathname.endsWith('/')
      ) {
        window.location.href =
          `category-results.html?category=${category}`;
      } else {
        filterByCategory(category);
      }
    };

    filterGroup.appendChild(thumbnail);
  });
}

function getCategoryEmoji(category) {
  const emojiMap = {
    'electronics': '📱',
    'clothing': '👕',
    'books': '📚',
    'home': '🏠',
    'sports': '⚽',
    'toys': '🧸',
    'food': '🍔',
    'beauty': '💄',
    'furniture': '🛋️',
    'accessories': '👜',
    'default': '📦'
  };

  return emojiMap[category.toLowerCase()] || emojiMap['default'];
}

function filterByCategory(category) {
  currentCategoryFilter = category;

  document.querySelectorAll('.category-thumbnail').forEach(thumb => {
    thumb.classList.remove('active');
  });

  if (category === null) {
    document.querySelectorAll('.category-thumbnail')[0]
      .classList.add('active');
  } else {
    document.querySelectorAll('.category-thumbnail').forEach(thumb => {
      if (
        thumb.textContent
          .toLowerCase()
          .includes(category.toLowerCase())
      ) {
        thumb.classList.add('active');
      }
    });
  }

  applyFilters();
}

function filterByPrice(value) {
  currentPriceFilter = value;
  document.getElementById('priceValue').textContent = value;
  applyFilters();
}

function sortProducts(sortType) {
  currentSort = sortType;
  applyFilters();
}

function applyFilters() {
  let filtered = [...products];

  if (currentCategoryFilter) {
    filtered = filtered.filter(
      p => p.category === currentCategoryFilter
    );
  }

  const discountedPrice = product =>
    product.price * (1 - (product.discount || 0) / 100);

  filtered = filtered.filter(
    p => discountedPrice(p) <= currentPriceFilter
  );

  switch (currentSort) {
    case 'name':
      filtered.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      break;

    case 'price-low':
      filtered.sort(
        (a, b) => discountedPrice(a) - discountedPrice(b)
      );
      break;

    case 'price-high':
      filtered.sort(
        (a, b) => discountedPrice(b) - discountedPrice(a)
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

function resetFilters() {
  currentSort = 'default';
  currentPriceFilter = 2000;
  currentCategoryFilter = null;

  document.getElementById('priceRange').value = 2000;
  document.getElementById('priceValue').textContent = 2000;

  document.querySelectorAll('.category-thumbnail').forEach(
    (thumb, index) => {
      if (index === 0) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    }
  );

  renderProducts(products);
}

function showAllProducts() {
  resetFilters();

  window.scrollTo({
    top:
      document.querySelector('.product-container').offsetTop - 100,
    behavior: 'smooth'
  });
}

// ========== FETCH PRODUCTS FROM BACKEND ==========

async function loadProducts(filters = {}) {
  try {
    let url = `${API_URL}/products`;

    const params = new URLSearchParams();

    if (filters.search)
      params.append('search', filters.search);

    if (filters.category)
      params.append('category', filters.category);

    if (filters.minPrice)
      params.append('minPrice', filters.minPrice);

    if (filters.maxPrice)
      params.append('maxPrice', filters.maxPrice);

    if (params.toString()) {
      url += '?' + params.toString();
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      products = data.data;

      console.log(
        'Products loaded:',
        products.length
      );

      renderProducts(products);

      for (let product of products) {
        await loadProductRatings(product.id);
      }

      renderProducts(products);

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
    console.error('Error:', error);

    showAlert(
      'Failed to connect to server',
      'error'
    );
  }
}

// ========== RENDER PRODUCTS ==========

function renderProducts(productsToRender) {
  const container =
    document.querySelector('.product-container');

  if (productsToRender.length === 0) {
    container.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No products found</p>';

    return;
  }

  container.innerHTML = productsToRender.map(product => {
    const rating =
      productRatings[product.id] || {
        averageRating: 0,
        totalReviews: 0
      };

    const stars =
      generateStarRating(rating.averageRating);

    const discountBadge =
      product.discount
        ? `<div class="discount-badge">${product.discount}% OFF</div>`
        : '';

    return `
      <div
        class="product-card"
        data-name="${product.name}"
        data-id="${product.id}"
        data-price="${product.price}"
      >

        ${discountBadge}

        <img
          src="${product.image}"
          alt="${product.name}"
          width="200"
          height="200"
          onerror="this.src='https://via.placeholder.com/200?text=No+Image'"
        >

        <h2>${product.name}</h2>

        <p>${product.category}</p>

        <div class="price-section">

          ${
            product.discount
              ? `<p class="original-price">$${product.price.toFixed(2)}</p>`
              : ''
          }

          <p class="final-price">
            Price: $${(
              product.price *
              (1 - (product.discount || 0) / 100)
            ).toFixed(2)}
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
              '${product.name.replace(/'/g, "\\'")}'
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
  }).join('');
}

// ========== RENDER PRODUCT CAROUSEL ==========

function renderProductCarousel(
  productsToRender,
  containerId,
  isDiscount = false
) {
  const container =
    document.getElementById(containerId);

  if (!container) return;

  if (productsToRender.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; padding: 40px; grid-column: 1/-1;">No products found</p>';

    return;
  }

  container.innerHTML = productsToRender.map(product => {
    const rating =
      productRatings[product.id] || {
        averageRating: 0,
        totalReviews: 0
      };

    const stars =
      generateStarRating(rating.averageRating);

    const discountBadge =
      product.discount
        ? `<div class="discount-badge">${product.discount}% OFF</div>`
        : '';

    let priceHtml = '';

    if (isDiscount && product.discountedPrice) {
      priceHtml = `
        <div class="price-section">
          <p class="original-price">
            $${product.originalPrice}
          </p>

          <p class="final-price">
            $${product.discountedPrice}
          </p>

          <p class="savings">
            Save: $${product.savings}
          </p>
        </div>
      `;
    } else {
      priceHtml = `
        <p class="final-price">
          $${(
            product.price *
            (1 - (product.discount || 0) / 100)
          ).toFixed(2)}
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
          src="${product.image}"
          alt="${product.name}"
          width="180"
          height="180"
          onerror="this.src='https://via.placeholder.com/180?text=No+Image'"
        >

        <h3>${product.name}</h3>

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

// ========== CART MANAGEMENT ==========

function saveCart() {
  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  updateCartCount();
}

function addToCartFromProduct(button) {
  const card =
    button.closest('.product-card');

  const productName =
    card.getAttribute("data-name");

  const price =
    parseFloat(card.getAttribute("data-price"));

  const productId =
    card.getAttribute("data-id");

  const existingItem =
    cart.find(item => item.name === productName);

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

  showCartNotification(productName);

  button.textContent = "Added!";
  button.style.backgroundColor = "#4caf50";

  setTimeout(() => {
    button.textContent = "Add to Cart";
    button.style.backgroundColor = "";
  }, 1500);
}

function removeFromCart(productName) {
  cart = cart.filter(
    item => item.name !== productName
  );

  saveCart();
  displayCart();
}

function updateCartQuantity(
  productName,
  quantity
) {
  const item =
    cart.find(item => item.name === productName);

  if (item) {
    if (quantity <= 0) {
      removeFromCart(productName);
    } else {
      item.quantity = parseInt(quantity);

      saveCart();
      displayCart();
    }
  }
}

function showCartNotification(productName) {
  const notification =
    document.createElement("div");

  notification.className =
    "cart-notification";

  notification.textContent =
    `✓ ${productName} added to cart!`;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}

function getCartTotal() {
  return cart.reduce(
    (total, item) =>
      total + (item.price * item.quantity),
    0
  );
}

function getCartCount() {
  return cart.reduce(
    (count, item) =>
      count + item.quantity,
    0
  );
}

function updateCartCount() {
  const cartCountElement =
    document.getElementById("cartCount");

  if (cartCountElement) {
    cartCountElement.textContent =
      getCartCount();
  }
}

// ========== CART MODAL FUNCTIONS ==========

function openCart() {
  document.getElementById(
    "cartModal"
  ).style.display = "block";

  displayCart();
}

function closeCart() {
  document.getElementById(
    "cartModal"
  ).style.display = "none";
}

function displayCart() {
  const cartItemsDiv =
    document.getElementById("cartItems");

  const cartTotalSpan =
    document.getElementById("cartTotal");

  if (cart.length === 0) {
    cartItemsDiv.innerHTML =
      "<p class='empty-cart'>Your cart is empty</p>";

    cartTotalSpan.textContent = "0.00";

    return;
  }

  let html =
    "<div class='cart-items-responsive'>";

  let total = 0;

  cart.forEach((item) => {
    const subtotal =
      item.price * item.quantity;

    total += subtotal;

    html += `
      <div class="cart-item">

        <div class="cart-item-details">

          <h4>${item.name}</h4>

          <p>
            $${item.price.toFixed(2)} x

            <input
              type="number"
              min="1"
              value="${item.quantity}"
              onchange="updateCartQuantity(
                '${item.name}',
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
            onclick="removeFromCart('${item.name}')"
          >
            Remove
          </button>

        </div>

      </div>
    `;
  });

  html += "</div>";

  cartItemsDiv.innerHTML = html;

  cartTotalSpan.textContent =
    total.toFixed(2);
}

// ========== CHECKOUT ==========

async function checkout() {
  if (cart.length === 0) {
    showAlert(
      "Your cart is empty!",
      'error'
    );

    return;
  }

  const total = getCartTotal();
  const itemsCount = getCartCount();

  const confirmed = confirm(
    `Total Items: ${itemsCount}\n` +
    `Total Amount: $${total.toFixed(2)}\n\n` +
    `Proceed to payment?`
  );

  if (confirmed) {
    try {
      const response =
        await fetch(`${API_URL}/orders`, {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            items: cart,
            total: total,

            customer: {
              name: "Customer",
              email: "customer@example.com"
            }
          })
        });

      const data =
        await response.json();

      if (data.success) {
        const orderInfo =
          data.data;

        showAlert(
          `✓ Order placed successfully!\n\n` +
          `Order ID: ${orderInfo.orderId}\n` +
          `Total: $${total.toFixed(2)}\n\n` +
          `Estimated Delivery: ${
            new Date(
              orderInfo.estimatedDelivery
            ).toLocaleDateString()
          }`,
          'success'
        );

        cart = [];

        saveCart();
        closeCart();

      } else {
        showAlert(
          'Error placing order: ' +
          data.error,
          'error'
        );
      }

    } catch (error) {
      console.error('Error:', error);

      showAlert(
        'Failed to place order',
        'error'
      );
    }
  }
}

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

function showAlert(
  message,
  type = 'info'
) {
  const alertDiv =
    document.createElement('div');

  alertDiv.className =
    `custom-alert alert-${type}`;

  alertDiv.textContent = message;

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// ========== FEATURED SECTIONS FUNCTIONS ==========

async function loadTopRated() {
  try {
    const response =
      await fetch(
        `${API_URL}/top-rated?limit=6`
      );

    const data =
      await response.json();

    if (data.success) {
      renderProductCarousel(
        data.data,
        'topRatedContainer'
      );
    }

  } catch (error) {
    console.error(
      'Error loading top-rated:',
      error
    );
  }
}

async function loadDiscounts() {
  try {
    const response =
      await fetch(
        `${API_URL}/discounts?limit=6`
      );

    const data =
      await response.json();

    if (data.success) {
      renderProductCarousel(
        data.data,
        'discountsContainer',
        true
      );
    }

  } catch (error) {
    console.error(
      'Error loading discounts:',
      error
    );
  }
}

async function loadSuggestions() {
  try {
    const response =
      await fetch(
        `${API_URL}/suggestions?limit=8`
      );

    const data =
      await response.json();

    if (data.success) {
      renderProductCarousel(
        data.data,
        'suggestionsContainer'
      );
    }

  } catch (error) {
    console.error(
      'Error loading suggestions:',
      error
    );
  }
}

function scrollToSection(sectionId) {
  const section =
    document.getElementById(sectionId);

  if (section) {
    section.scrollIntoView({
      behavior: 'smooth'
    });
  }
}

// ========== REVIEW FUNCTIONS ==========

function generateStarRating(rating) {
  const fullStars =
    Math.floor(rating);

  const hasHalfStar =
    rating % 1 >= 0.5;

  let stars =
    '⭐'.repeat(fullStars);

  if (
    hasHalfStar &&
    fullStars < 5
  ) {
    stars += '⭐';
  }

  return stars ||
    '✦ No rating yet';
}

async function loadProductRatings(productId) {
  try {
    const response =
      await fetch(
        `${API_URL}/reviews/${productId}`
      );

    const data =
      await response.json();

    if (data.success) {
      productRatings[productId] = {
        averageRating:
          data.averageRating,

        totalReviews:
          data.totalReviews,

        reviews:
          data.data
      };
    }

  } catch (error) {
    console.error(
      'Error loading ratings:',
      error
    );
  }
}

async function openReviewModal(
  productId,
  productName
) {
  document.getElementById(
    'reviewModal'
  ).style.display = 'block';

  document.getElementById(
    'reviewProductId'
  ).value = productId;

  document.getElementById(
    'reviewProductName'
  ).textContent =
    `Reviews for ${productName}`;

  document.getElementById(
    'reviewForm'
  ).reset();

  await loadProductReviews(productId);
}

function closeReviewModal() {
  document.getElementById(
    'reviewModal'
  ).style.display = 'none';
}

async function loadProductReviews(productId) {
  try {
    const response =
      await fetch(
        `${API_URL}/reviews/${productId}`
      );

    const data =
      await response.json();

    if (data.success) {
      displayReviews(
        data.data,
        data.averageRating,
        data.totalReviews
      );
    }

  } catch (error) {
    console.error(
      'Error loading reviews:',
      error
    );
  }
}

function displayReviews(
  reviews,
  avgRating,
  totalReviews
) {
  const container =
    document.getElementById(
      'reviewsContainer'
    );

  let html = `
    <div class="reviews-header">
      <h4>
        Average Rating:
        ${
          avgRating > 0
            ? avgRating + '/5'
            : 'No ratings yet'
        }
      </h4>

      <p>
        Total Reviews:
        ${totalReviews}
      </p>
    </div>
  `;

  if (reviews.length === 0) {

    html +=
      '<p style="text-align: center; color: #999;">' +
      'No reviews yet. Be the first to review!' +
      '</p>';

  } else {

    html +=
      '<div class="reviews-list">';

    reviews.forEach(review => {

      html += `
        <div class="review-item">

          <div class="review-header">

            <strong>
              ${review.customerName}
            </strong>

            <span class="review-rating">
              ${generateStarRating(review.rating)}
            </span>

          </div>

          <p class="review-title">
            ${review.title}
          </p>

          <p class="review-comment">
            ${review.comment}
          </p>

          <small class="review-date">
            ${
              new Date(
                review.timestamp
              ).toLocaleDateString()
            }
          </small>

        </div>
      `;
    });

    html += '</div>';
  }

  container.innerHTML = html;
}

async function submitReview(event) {
  event.preventDefault();

  const productId =
    document.getElementById(
      'reviewProductId'
    ).value;

  const customerName =
    document.getElementById(
      'reviewCustomerName'
    ).value;

  const rating =
    document.getElementById(
      'reviewRating'
    ).value;

  const title =
    document.getElementById(
      'reviewTitle'
    ).value;

  const comment =
    document.getElementById(
      'reviewComment'
    ).value;

  try {

    const response =
      await fetch(
        `${API_URL}/reviews`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
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

    const data =
      await response.json();

    if (data.success) {

      showAlert(
        '✓ Review submitted successfully!',
        'success'
      );

      document.getElementById(
        'reviewForm'
      ).reset();

      await loadProductRatings(
        productId
      );

      await loadProductReviews(
        productId
      );

      renderProducts(products);

    } else {

      showAlert(
        'Error submitting review: ' +
        data.error,
        'error'
      );
    }

  } catch (error) {

    console.error(
      'Error:',
      error
    );

    showAlert(
      'Failed to submit review',
      'error'
    );
  }
}

// ========== SEARCH FUNCTIONALITY ==========

function initializeSearch() {
  const searchForm =
    document.querySelector(
      ".search-bar"
    );

  const isSearchResultsPage =
    window.location.pathname.includes(
      'search-results'
    );

  if (!isSearchResultsPage) {
    return;
  }

  const searchInput =
    searchForm.querySelector(
      "input[name='query']"
    );

  searchForm.addEventListener(
    "submit",
    function(e) {
      e.preventDefault();

      const searchValue =
        searchInput.value
          .toLowerCase()
          .trim();

      if (searchValue === "") {
        renderProducts(products);
      } else {
        performSearch(searchValue);
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

      if (searchValue === "") {
        renderProducts(products);
      } else {
        performSearch(searchValue);
      }
    }
  );
}

function performSearch(searchTerm) {
  console.log(
    'Searching for:',
    searchTerm
  );

  console.log(
    'Available products:',
    products.length
  );

  const searchLower =
    searchTerm.toLowerCase();

  const filtered =
    products.filter(p => {

      const nameMatch =
        p.name &&
        p.name
          .toLowerCase()
          .includes(searchLower);

      const categoryMatch =
        p.category &&
        p.category
          .toLowerCase()
          .includes(searchLower);

      const descriptionMatch =
        p.description &&
        p.description
          .toLowerCase()
          .includes(searchLower);

      const brandMatch =
        p.brand &&
        p.brand
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
    'Filtered products:',
    filtered.length
  );

  if (filtered.length === 0) {
    showAlert(
      'No products found matching "' +
      searchTerm +
      '"',
      'info'
    );
  }

  renderProducts(filtered);
}

// ========== MODAL CLOSE ON OUTSIDE CLICK ==========

window.onclick = function(event) {

  const cartModal =
    document.getElementById(
      "cartModal"
    );

  const reviewModal =
    document.getElementById(
      "reviewModal"
    );

  if (event.target == cartModal) {
    cartModal.style.display =
      "none";
  }

  if (event.target == reviewModal) {
    reviewModal.style.display =
      "none";
  }
};

// ========== INITIALIZATION ==========

document.addEventListener(
  "DOMContentLoaded",
  function() {

    loadProducts();
    loadCategories();
    updateCartCount();

    setTimeout(() => {
      loadDiscounts();
    }, 1000);

    document.addEventListener(
      "keydown",
      function(e) {

        if (
          e.key === "c" &&
          e.ctrlKey
        ) {
          openCart();
        }

      }
    );

  }
);