// ========== SEARCH RESULTS PAGE ==========

// ========== DEPLOYED BACKEND API ==========
const API_URL = 'https://karma-s-website-1.onrender.com/api';


// ========== GET SEARCH QUERY FROM URL PARAMETERS ==========

function getSearchQueryFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('query') || '';
}


// ========== LOAD AND DISPLAY SEARCH RESULTS ==========

async function loadSearchResults() {

  const searchQuery = getSearchQueryFromURL();

  // Update the page header
  document.getElementById('searchQuery').textContent = searchQuery;


  // Load all products from deployed backend

  try {

    const response = await fetch(`${API_URL}/products`);

    const data = await response.json();


    if (data.success) {

      products = data.data;


      // Filter products based on search query

      if (searchQuery) {

        const filtered = performSearchFilter(
          products,
          searchQuery
        );

        document.getElementById('resultCount').textContent =
          `Found ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;


        // Display products
        renderProducts(filtered);


        // Load ratings for filtered products

        for (let product of filtered) {
          await loadProductRatings(product.id);
        }


        // Render again after ratings load

        renderProducts(filtered);

      } else {

        document.getElementById('resultCount').textContent =
          'No search query provided';

        renderProducts([]);

      }


      // Initialize search functionality
      initializeSearch();

      // Update cart count
      updateCartCount();

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
      'Error loading products:',
      error
    );

    showAlert(
      'Failed to connect to production server',
      'error'
    );
  }
}


// ========== FILTER PRODUCTS BASED ON SEARCH QUERY ==========

function performSearchFilter(
  productsToFilter,
  searchTerm
) {

  const searchLower =
    searchTerm.toLowerCase();


  return productsToFilter.filter(p => {

    const nameMatch =
      p.name &&
      p.name.toLowerCase().includes(searchLower);

    const categoryMatch =
      p.category &&
      p.category.toLowerCase().includes(searchLower);

    const descriptionMatch =
      p.description &&
      p.description.toLowerCase().includes(searchLower);

    const brandMatch =
      p.brand &&
      p.brand.toLowerCase().includes(searchLower);


    return (
      nameMatch ||
      categoryMatch ||
      descriptionMatch ||
      brandMatch
    );

  });
}


// ========== INITIALIZE PAGE ==========

document.addEventListener(
  "DOMContentLoaded",
  function() {
    loadSearchResults();
  }
);