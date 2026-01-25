// ========== SEARCH RESULTS PAGE ==========

// Get search query from URL parameters
function getSearchQueryFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('query') || '';
}

// Load and display search results
async function loadSearchResults() {
  const searchQuery = getSearchQueryFromURL();
  
  // Update the page header
  document.getElementById('searchQuery').textContent = searchQuery;
  
  // Load all products first
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();
    
    if (data.success) {
      products = data.data;
      
      // Filter products based on search query
      if (searchQuery) {
        const filtered = performSearchFilter(products, searchQuery);
        document.getElementById('resultCount').textContent = `Found ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
        renderProducts(filtered);
        
        // Load ratings for filtered products
        for (let product of filtered) {
          await loadProductRatings(product.id);
        }
        renderProducts(filtered);
      } else {
        document.getElementById('resultCount').textContent = 'No search query provided';
        renderProducts([]);
      }
      
      // Initialize search functionality for the new search
      initializeSearch();
      updateCartCount();
    }
  } catch (error) {
    console.error('Error loading products:', error);
    showAlert('Failed to load products', 'error');
  }
}

// Filter products based on search query
function performSearchFilter(productsToFilter, searchTerm) {
  const searchLower = searchTerm.toLowerCase();
  return productsToFilter.filter(p => {
    const nameMatch = p.name && p.name.toLowerCase().includes(searchLower);
    const categoryMatch = p.category && p.category.toLowerCase().includes(searchLower);
    const descriptionMatch = p.description && p.description.toLowerCase().includes(searchLower);
    const brandMatch = p.brand && p.brand.toLowerCase().includes(searchLower);
    
    return nameMatch || categoryMatch || descriptionMatch || brandMatch;
  });
}

// Initialize page when loaded
document.addEventListener("DOMContentLoaded", function() {
  loadSearchResults();
});
