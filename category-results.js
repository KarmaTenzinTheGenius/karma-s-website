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

// Get category name from URL parameters
function getCategoryFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('category') || '';
}

// Load and display category results
async function loadCategoryResults() {
  const categoryName = getCategoryFromURL();
  
  // Capitalize category name for display
  const displayName = categoryName ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1) : '';
  
  // Update the page header with category name and emoji
  const categoryEmoji = getCategoryEmoji(categoryName);
  document.getElementById('categoryIcon').textContent = categoryEmoji;
  document.getElementById('categoryName').textContent = displayName;
  
  // Load all products from the backend
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();
    
    if (data.success) {
      products = data.data;
      
      // Filter products to show only the selected category
      if (categoryName) {
        const filtered = products.filter(p => p.category.toLowerCase() === categoryName.toLowerCase());
        
        // Update the count display
        document.getElementById('resultCount').textContent = `Found ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
        
        // Display filtered products
        renderProducts(filtered);
        
        // Load ratings for filtered products
        for (let product of filtered) {
          await loadProductRatings(product.id);
        }
        renderProducts(filtered);
      } else {
        // No category selected, show all products
        document.getElementById('resultCount').textContent = `Found ${products.length} products`;
        renderProducts(products);
      }
      
      // Initialize search functionality on this page
      initializeSearch();
      updateCartCount();
    }
  } catch (error) {
    console.error('Error loading products:', error);
    showAlert('Failed to load products', 'error');
  }
}

// Map category names to emoji icons
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

// Initialize page when loaded
document.addEventListener("DOMContentLoaded", function() {
  loadCategoryResults();
});
