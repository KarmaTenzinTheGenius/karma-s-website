/*
  ========================================================
  CATEGORY RESULTS PAGE JAVASCRIPT
  ========================================================

  This file handles the category results page.
  When a user clicks on a category from the home page,
  they are redirected here with the category name in the URL.

  This page filters and displays only products from that category.

  ========================================================
*/

// ========== API CONFIGURATION ==========

const API_URL = 'https://karma-s-website-1.onrender.com/api';


// ========== GET CATEGORY NAME FROM URL ==========

function getCategoryFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('category') || '';
}


// ========== LOAD AND DISPLAY CATEGORY RESULTS ==========

async function loadCategoryResults() {

  const categoryName = getCategoryFromURL();

  // Capitalize category name for display
  const displayName = categoryName
    ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
    : '';

  // Update page header with category name and emoji
  const categoryEmoji = getCategoryEmoji(categoryName);

  document.getElementById('categoryIcon').textContent = categoryEmoji;
  document.getElementById('categoryName').textContent = displayName;


  // ========== LOAD PRODUCTS FROM DEPLOYED BACKEND ==========

  try {

    const response = await fetch(`${API_URL}/products`);

    const data = await response.json();

    if (data.success) {

      products = data.data;


      // ========== FILTER PRODUCTS BY CATEGORY ==========

      if (categoryName) {

        const filtered = products.filter(
          p =>
            p.category &&
            p.category.toLowerCase() === categoryName.toLowerCase()
        );


        // Update product count
        document.getElementById('resultCount').textContent =
          `Found ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;


        // Display filtered products
        renderProducts(filtered);


        // Load ratings for filtered products
        for (let product of filtered) {
          await loadProductRatings(product.id);
        }

        // Render again after ratings are loaded
        renderProducts(filtered);

      } else {

        // No category selected, show all products

        document.getElementById('resultCount').textContent =
          `Found ${products.length} products`;

        renderProducts(products);
      }


      // Initialize search functionality
      initializeSearch();

      // Update cart count
      updateCartCount();

    } else {

      console.error('Error loading products:', data.error);

      showAlert('Error loading products', 'error');
    }

  } catch (error) {

    console.error('Error loading products:', error);

    showAlert(
      'Failed to connect to production server',
      'error'
    );
  }
}


// ========== CATEGORY EMOJI MAPPING ==========

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


// ========== INITIALIZE PAGE ==========

document.addEventListener(
  "DOMContentLoaded",
  function() {
    loadCategoryResults();
  }
);