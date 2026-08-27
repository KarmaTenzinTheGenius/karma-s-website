const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Render provides PORT automatically
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

// Serve everything inside frontend folder
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve frontend images
app.use(
  '/image',
  express.static(path.join(__dirname, 'frontend', 'image'))
);

// ========================================================
// TEMP DATABASES
// ========================================================

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
// PRODUCTS API
// ========================================================

// GET ALL PRODUCTS
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
        p =>
          p.category.toLowerCase() ===
          category.toLowerCase()
      );
    }

    // Minimum price
    if (minPrice) {
      filteredProducts = filteredProducts.filter(
        p => p.price >= parseFloat(minPrice)
      );
    }

    // Maximum price
    if (maxPrice) {
      filteredProducts = filteredProducts.filter(
        p => p.price <= parseFloat(maxPrice)
      );
    }

    // Search
    if (search) {
      const searchTerm = search.toLowerCase();

      filteredProducts = filteredProducts.filter(
        p =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.category.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      success: true,
      count: filteredProducts.length,
      data: filteredProducts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET SINGLE PRODUCT
app.get('/api/products/:id', (req, res) => {
  try {
    const product = products.find(
      p => p.id === parseInt(req.params.id)
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

// GET CATEGORIES
app.get('/api/categories', (req, res) => {
  try {
    const categories = [
      ...new Set(products.map(p => p.category))
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
// FEATURED PRODUCTS
// ========================================================

// DISCOUNTS
app.get('/api/discounts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const discounted = products
      .filter(p => p.discount > 0)
      .sort((a, b) => b.discount - a.discount)
      .slice(0, limit)
      .map(p => ({
        ...p,
        originalPrice: p.price,
        discountedPrice:
          (p.price * (1 - p.discount / 100)).toFixed(2),
        savings:
          (p.price * p.discount / 100).toFixed(2)
      }));

    res.json({
      success: true,
      count: discounted.length,
      data: discounted
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// TOP RATED
app.get('/api/top-rated', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const productRatings = products.map(product => {

      const productReviews = reviews.filter(
        r => r.productId === product.id
      );

      const avgRating =
        productReviews.length > 0
          ? productReviews.reduce(
              (sum, r) => sum + r.rating,
              0
            ) / productReviews.length
          : 0;

      return {
        ...product,
        rating: Number(avgRating.toFixed(1)),
        reviewCount: productReviews.length
      };
    });

    const topRated = productRatings
      .filter(p => p.reviewCount > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);

    res.json({
      success: true,
      count: topRated.length,
      data: topRated
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// SUGGESTIONS
app.get('/api/suggestions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const suggestions = products
      .slice(0, limit);

    res.json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// RECOMMENDATIONS
app.get('/api/recommendations/:productId', (req, res) => {
  try {
    const productId =
      parseInt(req.params.productId);

    const limit =
      parseInt(req.query.limit) || 4;

    const product =
      products.find(p => p.id === productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found"
      });
    }

    const recommendations = products
      .filter(
        p =>
          p.category === product.category &&
          p.id !== productId
      )
      .slice(0, limit);

    res.json({
      success: true,
      count: recommendations.length,
      baseProduct: product.name,
      data: recommendations
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

// CREATE ORDER
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

    if (!total || total <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid total"
      });
    }

    const order = {
      orderId: `ORD-${orderIdCounter++}`,
      items,
      total,
      customer: customer || {},
      status: "confirmed",
      timestamp: new Date().toISOString(),

      estimatedDelivery:
        new Date(
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET ALL ORDERS
app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// GET SINGLE ORDER
app.get('/api/orders/:orderId', (req, res) => {

  const order =
    orders.find(
      o => o.orderId === req.params.orderId
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

    const searchTerm =
      query.toLowerCase();

    const results =
      products.filter(
        p =>
          p.name
            .toLowerCase()
            .includes(searchTerm) ||

          p.category
            .toLowerCase()
            .includes(searchTerm)
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
// VALIDATE CART
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

    const validatedItems =
      items.map(item => {

        const product =
          products.find(
            p =>
              p.name.toLowerCase() ===
              item.name.toLowerCase()
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
          price: product.price,
          id: product.id
        };

      });

    const allValid =
      validatedItems.every(
        item => item.valid
      );

    res.json({
      success: allValid,
      data: validatedItems,
      allValid
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

// GET REVIEWS FOR PRODUCT
app.get('/api/reviews/:productId', (req, res) => {

  try {

    const productId =
      parseInt(req.params.productId);

    const productReviews =
      reviews.filter(
        r => r.productId === productId
      );

    const avgRating =
      productReviews.length > 0
        ? (
            productReviews.reduce(
              (sum, r) => sum + r.rating,
              0
            ) / productReviews.length
          ).toFixed(1)
        : 0;

    res.json({
      success: true,
      productId,
      averageRating: parseFloat(avgRating),
      totalReviews: productReviews.length,
      data: productReviews
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

// ADD REVIEW
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
      !rating ||
      !title
    ) {

      return res.status(400).json({
        success: false,
        error:
          "productId, customerName, rating, and title are required"
      });

    }

    if (rating < 1 || rating > 5) {

      return res.status(400).json({
        success: false,
        error:
          "Rating must be between 1 and 5"
      });

    }

    const product =
      products.find(
        p => p.id === parseInt(productId)
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

      customerName,

      rating:
        parseInt(rating),

      title,

      comment:
        comment || "",

      timestamp:
        new Date().toISOString(),

      helpful: 0
    };

    reviews.push(review);

    res.status(201).json({

      success: true,

      message:
        "Review added successfully",

      data: review

    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

// GET ALL REVIEWS
app.get('/api/reviews', (req, res) => {

  res.json({
    success: true,
    count: reviews.length,
    data: reviews
  });

});

// ========================================================
// HEALTH CHECK
// ========================================================

app.get('/api/health', (req, res) => {

  res.json({

    success: true,

    message:
      "E-Commerce server is running",

    timestamp:
      new Date().toISOString(),

    environment:
      process.env.NODE_ENV || "development"

  });

});

// ========================================================
// FRONTEND ROUTES
// ========================================================

// Homepage
app.get('/', (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'frontend',
      'index.html'
    )
  );

});

// Search page
app.get('/search-results.html', (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'frontend',
      'search-results.html'
    )
  );

});

// Category page
app.get('/category-results.html', (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'frontend',
      'category-results.html'
    )
  );

});

// ========================================================
// 404 HANDLER
// ========================================================

app.use((req, res) => {

  res.status(404).json({

    success: false,

    error:
      "Route not found",

    requestedPath:
      req.originalUrl

  });

});

// ========================================================
// START SERVER
// ========================================================

app.listen(PORT, '0.0.0.0', () => {

  console.log(`
╔══════════════════════════════════════╗
║      E-Commerce Server Running       ║
╠══════════════════════════════════════╣
║ Port: ${PORT}
║ Frontend: http://localhost:${PORT}
║ API: http://localhost:${PORT}/api
╚══════════════════════════════════════╝
  `);

  console.log("Available API Endpoints:");
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
  console.log("");
});

module.exports = app;