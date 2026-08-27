/*
  ========================================================
  E-COMMERCE STORE DOCUMENTATION & CODE EXPLANATION
  ========================================================
  
  This document explains how the entire e-commerce store works,
  perfect for understanding the code and explaining to customers.
  
  ========================================================
*/

// ========== SYSTEM OVERVIEW ==========
/*
  The e-commerce store has 3 main parts:

  1. FRONTEND (Browser)
     - What the customer sees and interacts with
     - Built with HTML (structure), CSS (styling), JavaScript (functionality)
     - Files: index.html, search-results.html, style.css, script.js

  2. BACKEND (Server)
     - Stores all product data, customer info, orders
     - Runs at http://localhost:5000/api
     - Handles database operations

  3. STORAGE (Browser's Memory)
     - Shopping cart saved in browser (localStorage)
     - Ratings and reviews stored in backend
*/

// ========== HOW THE STORE WORKS ==========

/*
  STEP 1: PAGE LOADS
  ─────────────────
  When customer opens the website:
  1. index.html loads (the main page structure)
  2. style.css loads (makes it look pretty)
  3. script.js loads and runs the initialization code
  4. JavaScript automatically:
     - Fetches all products from the backend
     - Fetches all categories from the backend
     - Displays products in a grid
     - Shows categories as clickable buttons
     - Checks if customer has items in their cart
     - Updates the cart counter in the navbar
*/

// ========== KEY FEATURES EXPLAINED ==========

// FEATURE 1: PRODUCT CATALOG
/*
  What it does:
  - Displays all products available for sale
  - Shows product image, name, category, price
  - Shows star ratings (⭐) based on customer reviews
  - Shows discount badges if product is on sale
  
  How it works:
  1. JavaScript fetches product list from backend
  2. For each product, it creates an HTML card with:
     - Product image
     - Product name and category
     - Original price (if on sale)
     - Discounted price (final price customer pays)
     - Star rating from customer reviews
     - "Add to Cart" button
     - "Write Review" button
  3. These cards are displayed in a grid layout
*/

// FEATURE 2: CATEGORY FILTERING
/*
  What it does:
  - Lets customers filter products by category
  - Instead of showing 1000 items, show only electronics (or clothing, etc.)
  
  How it works:
  1. Categories are fetched from backend (Electronics, Clothing, Books, etc.)
  2. Each category is shown as a thumbnail with an emoji icon:
     - 📱 Electronics
     - 👕 Clothing
     - 📚 Books
     - 🏠 Home
     - etc.
  3. When customer clicks a category:
     - JavaScript filters products to match that category
     - Product grid updates to show only those products
     - Category thumbnail highlights in blue to show it's selected
  4. Clicking "All" category shows all products again
*/

// FEATURE 3: SEARCH FUNCTIONALITY
/*
  What it does:
  - Let customers find products by typing a product name or keyword
  
  How it works:
  
  ON HOME PAGE (index.html):
  1. Customer types in search bar and clicks "Search"
  2. Page redirects to search-results.html with the search query
  3. Example: if you search "laptop", you go to: search-results.html?query=laptop
  
  ON SEARCH RESULTS PAGE (search-results.html):
  1. Page loads with the search query from URL
  2. JavaScript searches through all products for matches
  3. It searches in:
     - Product name (exact word match or partial)
     - Product category
     - Product description
     - Product brand
  4. Only matching products are displayed
  5. Shows count: "Found 3 products"
  6. Customer can search again to refine results
  7. "Back to Home" button takes them back to main store
*/

// FEATURE 4: SHOPPING CART
/*
  What it does:
  - Customers can add products to cart
  - View all items they want to buy
  - See total price
  - Proceed to checkout
  
  How it works:
  
  ADDING TO CART:
  1. Customer clicks "Add to Cart" button on a product
  2. Item is added to the cart array in memory
  3. Cart is saved to browser's localStorage (persists after page refresh)
  4. Cart count updates in navbar (e.g., "Cart 3" means 3 items)
  
  VIEWING CART:
  1. Customer clicks cart button in navbar
  2. A modal popup appears showing:
     - All items in cart with quantity and price
     - Calculate total: Sum of (price × quantity) for all items
     - Total price in bold
     - "Proceed to Checkout" button
     - "Clear Cart" button
  
  CART PERSISTENCE:
  - Cart is saved in browser's localStorage with the key "cart"
  - Even if customer closes browser, cart items are remembered
  - When page loads, it checks localStorage for saved cart
*/

// FEATURE 5: PRODUCT REVIEWS & RATINGS
/*
  What it does:
  - Customers can read reviews from other customers
  - Customers can write their own reviews
  - Products show average star rating based on reviews
  
  How it works:
  
  VIEWING REVIEWS:
  1. Customer clicks "Reviews" button on a product
  2. A modal popup shows:
     - All existing reviews from customers
     - Each review shows: star rating, reviewer name, comment
     - Average rating calculated from all reviews
  
  WRITING A REVIEW:
  1. Customer fills out review form:
     - Their name (required)
     - Star rating (1-5 stars)
     - Review title
     - Review comment/description
  2. Clicks "Submit Review"
  3. Review is sent to backend and stored in database
  4. Next time anyone views this product, they'll see the new review
  5. Average rating updates to include new review
*/

// FEATURE 6: DISCOUNTED PRODUCTS
/*
  What it does:
  - Shows a special section with products on sale
  - Highlights products with discounts
  
  How it works:
  1. Backend stores discount percentage for each product
  2. If discount exists:
     - Show original price (with strikethrough)
     - Show discount percentage badge (e.g., "20% OFF")
     - Show final price (original price - discount)
  3. Special "Hot Discounts" section shows products with highest discounts
  4. Customers can sort by discount percentage
*/

// FEATURE 7: ADMIN PANEL
/*
  What it does:
  - Allows store administrators to manage products and orders
  
  How it works:
  1. Click admin button (🔐) in navbar
  2. Goes to admin.html (separate admin page)
  3. Admin can:
     - Add new products
     - Edit existing products
     - Delete products
     - View customer orders
     - See product inventory
     - Manage discounts
*/

// ========== TECHNICAL DETAILS ==========

// HOW DATA FLOWS
/*
  1. Backend Database contains:
     - All products (name, price, image, category, discount, etc.)
     - All categories
     - All customer reviews and ratings
     - All customer orders
  
  2. Frontend (JavaScript) fetches data from backend:
     - const response = await fetch(`${API_URL}/products`)
     - This gets all products from backend
  
  3. Data is stored in JavaScript variables:
     - let products = [...] (all products in memory)
     - let cart = [...] (items customer wants to buy)
  
  4. JavaScript displays data as HTML:
     - Creates product cards from the data
     - Shows categories as buttons
     - Shows cart items when clicked
  
  5. When customer interacts:
     - Adds to cart -> saved to localStorage
     - Writes review -> sent to backend
     - Clicks category -> JavaScript filters products
     - Searches -> JavaScript searches through products
*/

// HOW FILTERING WORKS
/*
  Example: Customer filters by "Electronics" category
  
  Before filtering: products = [iPhone, Laptop, Book, Shirt, Desk, ...]
  
  JavaScript code:
  if (categoryFilter === "Electronics") {
    filtered = products.filter(p => p.category === "Electronics")
  }
  
  After filtering: filtered = [iPhone, Laptop, ...]
  
  Then displays only filtered products
*/

// HOW SEARCH WORKS
/*
  Example: Customer searches for "blue shirt"
  
  JavaScript looks through all products:
  - iPhone? No (doesn't contain "blue" or "shirt")
  - Blue Shirt? Yes! (contains both words)
  - Red Shirt? Maybe (contains "shirt" but not "blue")
  - Blue Pants? Maybe (contains "blue" but not "shirt")
  
  Shows matching products based on:
  1. Product name match
  2. Category match
  3. Description match
  4. Brand match
*/

// ========== FILE STRUCTURE ==========
/*
  frontend/
  ├── index.html              (Main home page)
  ├── search-results.html     (Search results page)
  ├── admin.html              (Admin panel page)
  ├── style.css               (All styling/design)
  ├── script.js               (Main JavaScript functionality)
  ├── search-results.js       (Search page specific code)
  └── image/                  (Product images folder)
  
  backend/ (separate folder on server)
  ├── server.js               (Runs the backend)
  ├── package.json            (Backend dependencies)
  └── database/               (Stores all data)
*/

// ========== EXPLAINING TO CUSTOMERS ==========
/*
  SIMPLE EXPLANATION:
  
  "Our store is like a shopping mall on your computer:
  - When you visit, you see all our products
  - You can search for what you want
  - You can filter by category (like shopping aisles)
  - You add items to your cart
  - You can read reviews from other customers
  - You can write your own reviews
  - When ready, you checkout and pay"
  
  KEY BENEFITS:
  ✓ Easy to find products (search & filter)
  ✓ See what other customers think (reviews)
  ✓ Save cart and come back later (localStorage)
  ✓ Secure checkout process
  ✓ Mobile friendly (works on phones)
*/

// ========== TROUBLESHOOTING COMMON ISSUES ==========
/*
  Q: Products not showing?
  A: Check if backend server is running at http://localhost:5000/api
     Check browser console (F12) for errors
  
  Q: Cart empties after refresh?
  A: Check if browser allows localStorage
     Private/Incognito mode doesn't save cart
  
  Q: Search not working?
  A: Make sure you click "Search" or press Enter
     Search works on search-results.html page
  
  Q: Reviews not showing?
  A: First time loading reviews takes a moment
     If issue persists, check backend connection
  
  Q: Images not loading?
  A: Check if image URLs in database are correct
     Make sure image files exist in /image folder
*/

