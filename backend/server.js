const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();

const PORT = process.env.PORT || 5000;

// ========================================================
// MIDDLEWARE
// ========================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// ========================================================
// SERVE FRONTEND
// ========================================================

// Your frontend files are in the main ecommerce folder
//
// ecommerce/
// ├── index.html
// ├── script.js
// ├── style.css
// ├── admin.html
// ├── image/
// └── server.js

app.use(express.static(__dirname));


// Serve images from /image
app.use(
  '/image',
  express.static(path.join(__dirname, 'image'))
);


// ========================================================
// TEMPORARY DATABASES
// ========================================================

// NOTE:
// These are temporary in-memory databases.
// Data will disappear when the server restarts.

let users = [];

let orders = [];

let reviews = [];

let orderIdCounter = 1000;

let reviewIdCounter = 100;


// ========================================================
// PRODUCT DATABASE
// ========================================================

const products = [
  {
    id: 1,
    name: "running shoes",
    price: 79.99,
    category: "footwear",
    image: "image/shoe.jpg",
    discount: 15
  },

  {
    id: 2,
    name: "smartphone",
    price: 899.99,
    category: "electronics",
    image: "image/phone.jpg",
    discount: 0
  },

  {
    id: 3,
    name: "guitar",
    price: 199.99,
    category: "instruments",
    image: "image/guitar.jpg",
    discount: 10
  },

  {
    id: 4,
    name: "jeans",
    price: 49.99,
    category: "clothing",
    image: "image/jeans.jpg",
    discount: 20
  },

  {
    id: 5,
    name: "shirt",
    price: 29.99,
    category: "clothing",
    image: "image/shirt.jpg",
    discount: 0
  },

  {
    id: 6,
    name: "laptop",
    price: 1199.99,
    category: "electronics",
    image: "image/laptop.png",
    discount: 5
  },

  {
    id: 7,
    name: "backpack",
    price: 59.99,
    category: "accessories",
    image: "image/backpack.webp",
    discount: 25
  },

  {
    id: 8,
    name: "boot",
    price: 89.99,
    category: "footwear",
    image: "image/boot.png",
    discount: 12
  },

  {
    id: 9,
    name: "headphones",
    price: 149.99,
    category: "electronics",
    image: "image/headphone2.jpeg",
    discount: 0
  },

  {
    id: 10,
    name: "hoodie",
    price: 39.99,
    category: "clothing",
    image: "image/hoodie.jpg",
    discount: 18
  },

  {
    id: 11,
    name: "jersey",
    price: 39.99,
    category: "clothing",
    image: "image/jersey.webp",
    discount: 0
  },

  {
    id: 12,
    name: "backpack2",
    price: 39.99,
    category: "accessories",
    image: "image/backpack2.jpg",
    discount: 30
  },

  {
    id: 13,
    name: "football-shirt",
    price: 39.99,
    category: "clothing",
    image: "image/football-shirt.webp",
    discount: 8
  },

  {
    id: 14,
    name: "jacket",
    price: 79.99,
    category: "clothing",
    image: "image/jacket.jpg",
    discount: 0
  },

  {
    id: 15,
    name: "sniker",
    price: 39.99,
    category: "footwear",
    image: "image/snicker.jpg",
    discount: 22
  }
];


// ========================================================
// AUTHENTICATION
// ========================================================


// ---------------- SIGNUP ----------------

app.post('/api/signup', async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {

      return res.status(400).json({
        success: false,
        message: "Email & password required"
      });

    }

    const existingUser = users.find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {

      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });

    }

    const passwordHash = await bcrypt.hash(password, 10);

    users.push({
      email: email,
      passwordHash: passwordHash,
      role: "customer"
    });

    res.status(201).json({
      success: true,
      message: "Signup successful"
    });

  } catch (error) {

    console.error("Signup error:", error);

    res.status(500).json({
      success: false,
      error: "Signup failed"
    });

  }

});


// ---------------- LOGIN ----------------

app.post('/api/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {

      return res.status(400).json({
        success: false,
        message: "Email & password required"
      });

    }

    const user = users.find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {

      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });

    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {

      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });

    }

    res.json({
      success: true,
      message: "Login successful",

      user: {
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {

    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      error: "Login failed"
    });

  }

});


// ========================================================
// PRODUCTS
// ========================================================


// ---------------- GET ALL PRODUCTS ----------------

app.get('/api/products', (req, res) => {

  try {

    const {
      category,
      minPrice,
      maxPrice,
      search
    } = req.query;

    let filteredProducts = [...products];


    // Category filter

    if (category) {

      filteredProducts = filteredProducts.filter(
        product =>
          product.category.toLowerCase() ===
          category.toLowerCase()
      );

    }


    // Minimum price

    if (minPrice) {

      const minimum = parseFloat(minPrice);

      if (!isNaN(minimum)) {

        filteredProducts = filteredProducts.filter(
          product => product.price >= minimum
        );

      }

    }


    // Maximum price

    if (maxPrice) {

      const maximum = parseFloat(maxPrice);

      if (!isNaN(maximum)) {

        filteredProducts = filteredProducts.filter(
          product => product.price <= maximum
        );

      }

    }


    // Search

    if (search) {

      const searchTerm = search.toLowerCase();

      filteredProducts = filteredProducts.filter(
        product =>

          product.name.toLowerCase().includes(searchTerm) ||

          product.category.toLowerCase().includes(searchTerm)
      );

    }


    res.json({
      success: true,
      count: filteredProducts.length,
      data: filteredProducts
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});


// ---------------- GET SINGLE PRODUCT ----------------

app.get('/api/products/:id', (req, res) => {

  try {

    const productId = parseInt(req.params.id);

    const product = products.find(
      product => product.id === productId
    );

    if (!product) {

      return res.status(404).json({
        success: false,
        error: "Product not found"
      });

    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});


// ---------------- GET CATEGORIES ----------------

app.get('/api/categories', (req, res) => {

  try {

    const categories = [
      ...new Set(
        products.map(product => product.category)
      )
    ];

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});


// ========================================================
// SEARCH
// ========================================================

app.post('/api/search', (req, res) => {

  try {

    const { query } = req.body;

    if (!query) {

      return res.status(400).json({
        success: false,
        error: "Search query required"
      });

    }

    const searchTerm = query.toLowerCase();

    const results = products.filter(product =>

      product.name.toLowerCase().includes(searchTerm) ||

      product.category.toLowerCase().includes(searchTerm)

    );

    res.json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});


// ========================================================
// CART VALIDATION
// ========================================================

app.post('/api/validate-cart', (req, res) => {

  try {

    const { items } = req.body;

    if (!items || !Array.isArray(items)) {

      return res.status(400).json({
        success: false,
        error: "Invalid cart items"
      });

    }

    const validatedItems = items.map(item => {

      const product = products.find(
        product =>

          product.name.toLowerCase() ===
          String(item.name).toLowerCase()
      );

      if (!product) {

        return {
          ...item,
          valid: false,
          error: "Product not found"
        };

      }

      return {

        ...item,

        valid: true,

        id: product.id,

        price: product.price

      };

    });


    const allValid = validatedItems.every(
      item => item.valid
    );


    res.json({

      success: allValid,

      allValid: allValid,

      data: validatedItems

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ========================================================
// ORDERS
// ========================================================


// ---------------- CREATE ORDER ----------------

app.post('/api/orders', (req, res) => {

  try {

    const {
      items,
      total,
      customer
    } = req.body;


    if (!items || !Array.isArray(items) || items.length === 0) {

      return res.status(400).json({

        success: false,

        error: "Cart is empty"

      });

    }


    if (
      total === undefined ||
      total === null ||
      Number(total) <= 0
    ) {

      return res.status(400).json({

        success: false,

        error: "Invalid total"

      });

    }


    const order = {

      orderId: `ORD-${orderIdCounter++}`,

      items: items,

      total: Number(Number(total).toFixed(2)),

      customer: customer || {},

      status: "confirmed",

      timestamp: new Date().toISOString(),

      estimatedDelivery: new Date(

        Date.now() +
        7 * 24 * 60 * 60 * 1000

      ).toISOString()

    };


    orders.push(order);


    res.status(201).json({

      success: true,

      message: "Order placed successfully",

      data: order

    });

  } catch (error) {

    console.error("Order error:", error);

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ---------------- GET ORDER ----------------

app.get('/api/orders/:orderId', (req, res) => {

  try {

    const order = orders.find(

      order =>
        order.orderId === req.params.orderId

    );


    if (!order) {

      return res.status(404).json({

        success: false,

        error: "Order not found"

      });

    }


    res.json({

      success: true,

      data: order

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ---------------- GET ALL ORDERS ----------------

app.get('/api/orders', (req, res) => {

  try {

    res.json({

      success: true,

      count: orders.length,

      data: orders

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ========================================================
// REVIEWS
// ========================================================


// ---------------- GET REVIEWS FOR PRODUCT ----------------

app.get('/api/reviews/:productId', (req, res) => {

  try {

    const productId =
      parseInt(req.params.productId);


    const productReviews = reviews.filter(

      review =>
        review.productId === productId

    );


    const averageRating =

      productReviews.length > 0

        ? productReviews.reduce(

            (sum, review) =>
              sum + review.rating,

            0

          ) / productReviews.length

        : 0;


    res.json({

      success: true,

      productId: productId,

      averageRating:
        Number(averageRating.toFixed(1)),

      totalReviews:
        productReviews.length,

      data: productReviews

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ---------------- ADD REVIEW ----------------

app.post('/api/reviews', (req, res) => {

  try {

    const {
      productId,
      customerName,
      rating,
      title,
      comment
    } = req.body;


    if (
      !productId ||
      !customerName ||
      rating === undefined ||
      rating === null ||
      !title
    ) {

      return res.status(400).json({

        success: false,

        error:
          "productId, customerName, rating, and title are required"

      });

    }


    const numericRating =
      parseInt(rating);


    if (
      isNaN(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {

      return res.status(400).json({

        success: false,

        error:
          "Rating must be between 1 and 5"

      });

    }


    const product = products.find(

      product =>
        product.id === parseInt(productId)

    );


    if (!product) {

      return res.status(404).json({

        success: false,

        error: "Product not found"

      });

    }


    const review = {

      reviewId:
        `REV-${reviewIdCounter++}`,

      productId:
        parseInt(productId),

      customerName:
        customerName,

      rating:
        numericRating,

      title:
        title,

      comment:
        comment || "",

      timestamp:
        new Date().toISOString(),

      helpful:
        0

    };


    reviews.push(review);


    res.status(201).json({

      success: true,

      message:
        "Review added successfully",

      data:
        review

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ---------------- GET ALL REVIEWS ----------------

app.get('/api/reviews', (req, res) => {

  try {

    res.json({

      success: true,

      count: reviews.length,

      data: reviews

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ========================================================
// TOP RATED PRODUCTS
// ========================================================

app.get('/api/top-rated', (req, res) => {

  try {

    const limit =
      parseInt(req.query.limit) || 6;


    const productRatings = products.map(
      product => {

        const productReviews =
          reviews.filter(

            review =>
              review.productId ===
              product.id

          );


        const averageRating =

          productReviews.length > 0

            ? productReviews.reduce(

                (sum, review) =>
                  sum + review.rating,

                0

              ) / productReviews.length

            : 0;


        return {

          ...product,

          rating:
            Number(averageRating.toFixed(1)),

          reviewCount:
            productReviews.length

        };

      }
    );


    const topRated = productRatings

      .filter(
        product =>
          product.reviewCount > 0
      )

      .sort(
        (a, b) =>
          b.rating - a.rating
      )

      .slice(0, limit);


    res.json({

      success: true,

      count:
        topRated.length,

      data:
        topRated

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ========================================================
// DISCOUNTED PRODUCTS
// ========================================================

app.get('/api/discounts', (req, res) => {

  try {

    const limit =
      parseInt(req.query.limit) || 6;


    const discounted =
      products

        .filter(
          product =>
            product.discount > 0
        )

        .sort(
          (a, b) =>
            b.discount - a.discount
        )

        .slice(0, limit)

        .map(product => ({

          ...product,

          originalPrice:
            product.price,

          discountedPrice:
            (
              product.price *
              (1 - product.discount / 100)
            ).toFixed(2),

          savings:
            (
              product.price *
              product.discount /
              100
            ).toFixed(2)

        }));


    res.json({

      success: true,

      count:
        discounted.length,

      data:
        discounted

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ========================================================
// PRODUCT RECOMMENDATIONS
// ========================================================

app.get('/api/recommendations/:productId', (req, res) => {

  try {

    const productId =
      parseInt(req.params.productId);


    const limit =
      parseInt(req.query.limit) || 4;


    const product =
      products.find(

        product =>
          product.id === productId

      );


    if (!product) {

      return res.status(404).json({

        success: false,

        error: "Product not found"

      });

    }


    const recommendations =

      products

        .filter(

          item =>

            item.category ===
              product.category &&

            item.id !== productId

        )

        .slice(0, limit);


    res.json({

      success: true,

      count:
        recommendations.length,

      baseProduct:
        product.name,

      data:
        recommendations

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ========================================================
// PRODUCT SUGGESTIONS
// ========================================================

app.get('/api/suggestions', (req, res) => {

  try {

    const limit =
      parseInt(req.query.limit) || 8;


    const productRatings =
      products.map(product => {

        const productReviews =
          reviews.filter(

            review =>
              review.productId ===
              product.id

          );


        const averageRating =

          productReviews.length > 0

            ? productReviews.reduce(

                (sum, review) =>
                  sum + review.rating,

                0

              ) / productReviews.length

            : 0;


        const score =

          averageRating * 0.7 +

          productReviews.length * 0.3;


        return {

          ...product,

          rating:
            Number(averageRating.toFixed(1)),

          reviewCount:
            productReviews.length,

          score:
            Number(score.toFixed(2))

        };

      });


    const suggestions =

      productRatings

        .sort(
          (a, b) =>
            b.score - a.score
        )

        .slice(0, limit);


    res.json({

      success: true,

      count:
        suggestions.length,

      data:
        suggestions

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});


// ========================================================
// HEALTH CHECK
// ========================================================

app.get('/api/health', (req, res) => {

  res.json({

    success: true,

    message:
      "Server is running",

    timestamp:
      new Date().toISOString()

  });

});


// ========================================================
// FRONTEND ROUTES
// ========================================================

// Homepage

app.get('/', (req, res) => {

  res.sendFile(
    path.join(__dirname, 'index.html')
  );

});


// Optional frontend pages

app.get('/admin', (req, res) => {

  res.sendFile(
    path.join(__dirname, 'admin.html')
  );

});


// ========================================================
// 404 ERROR HANDLER
// ========================================================

app.use((req, res) => {

  res.status(404).json({

    success: false,

    error: "Route not found",

    path: req.originalUrl

  });

});


// ========================================================
// GLOBAL ERROR HANDLER
// ========================================================

app.use((err, req, res, next) => {

  console.error("Server error:", err);

  res.status(500).json({

    success: false,

    error: "Internal server error"

  });

});


// ========================================================
// START SERVER
// ========================================================

app.listen(PORT, '0.0.0.0', () => {

  console.log(`
╔══════════════════════════════════════╗
║      E-Commerce Server Running       ║
║      Port: ${PORT}                     ║
║      URL: http://localhost:${PORT}     ║
╚══════════════════════════════════════╝
`);

  console.log("Available API Endpoints:");

  console.log("  POST /api/signup");

  console.log("  POST /api/login");

  console.log("  GET  /api/products");

  console.log("  GET  /api/products/:id");

  console.log("  GET  /api/categories");

  console.log("  POST /api/orders");

  console.log("  GET  /api/orders/:orderId");

  console.log("  GET  /api/orders");

  console.log("  POST /api/search");

  console.log("  POST /api/validate-cart");

  console.log("  GET  /api/reviews/:productId");

  console.log("  POST /api/reviews");

  console.log("  GET  /api/reviews");

  console.log("  GET  /api/top-rated");

  console.log("  GET  /api/discounts");

  console.log("  GET  /api/recommendations/:productId");

  console.log("  GET  /api/suggestions");

  console.log("  GET  /api/health");

  console.log("\nFrontend:");

  console.log("  http://localhost:" + PORT);

  console.log("");

});


// ========================================================
// EXPORT
// ========================================================

module.exports = app;