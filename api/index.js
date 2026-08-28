const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/image', express.static(path.join(__dirname, '..', 'image')));
app.use(express.static(path.join(__dirname, '..')));

// ========== TEMP DATABASES ==========
let users = [];
let orders = [];
let reviews = [];
let orderIdCounter = 1000;
let reviewIdCounter = 100;

// ========== PRODUCT DATABASE ==========
const products = [
  { id: 1, name: "running shoes", price: 79.99, category: "footwear", image: "image/shoe.jpg", discount: 15 },
  { id: 2, name: "smartphone", price: 899.99, category: "electronics", image: "image/phone.jpg", discount: 0 },
  { id: 3, name: "guitar", price: 199.99, category: "instruments", image: "image/guitar.jpg", discount: 10 },
  { id: 4, name: "jeans", price: 49.99, category: "clothing", image: "image/jeans.jpg", discount: 20 },
  { id: 5, name: "shirt", price: 29.99, category: "clothing", image: "image/shirt.jpg", discount: 0 },
  { id: 6, name: "laptop", price: 1199.99, category: "electronics", image: "image/laptop.png", discount: 5 },
  { id: 7, name: "backpack", price: 59.99, category: "accessories", image: "image/backpack.webp", discount: 25 },
  { id: 8, name: "boot", price: 89.99, category: "footwear", image: "image/boot.png", discount: 12 },
  { id: 9, name: "headphones", price: 149.99, category: "electronics", image: "image/headphone2.jpeg", discount: 0 },
  { id: 10, name: "hoodie", price: 39.99, category: "clothing", image: "image/hoodie.jpg", discount: 18 },
  { id: 11, name: "jersey", price: 39.99, category: "clothing", image: "image/jersey.webp", discount: 0 },
  { id: 12, name: "backpack2", price: 39.99, category: "accessories", image: "image/backpack2.jpg", discount: 30 },
  { id: 13, name: "football-shirt", price: 39.99, category: "clothing", image: "image/football-shirt.webp", discount: 8 },
  { id: 14, name: "jacket", price: 79.99, category: "clothing", image: "image/jacket.jpg", discount: 0 },
  { id: 15, name: "sniker", price: 39.99, category: "footwear", image: "image/snicker.jpg", discount: 22 }
];

// ================= AUTH =================

// SIGNUP
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email & password required"
    });
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Email already registered"
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  users.push({
    email,
    passwordHash,
    role: "customer"
  });

  res.json({
    success: true,
    message: "Signup successful"
  });
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email & password required"
    });
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }

  const match = await bcrypt.compare(password, user.passwordHash);

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }

  res.json({
    success: true,
    user: {
      email: user.email,
      role: user.role
    }
  });
});

// ================= PRODUCTS =================

app.get('/api/products', (req, res) => {
  const { category, minPrice, maxPrice, search } = req.query;

  let filtered = [...products];

  if (category) {
    filtered = filtered.filter(
      p => p.category === category
    );
  }

  if (minPrice) {
    filtered = filtered.filter(
      p => p.price >= parseFloat(minPrice)
    );
  }

  if (maxPrice) {
    filtered = filtered.filter(
      p => p.price <= parseFloat(maxPrice)
    );
  }

  if (search) {
    filtered = filtered.filter(
      p => p.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.json({
    success: true,
    data: filtered
  });
});

app.get('/api/products/:id', (req, res) => {
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
});

app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    data: [...new Set(products.map(p => p.category))]
  });
});

// ================= ORDERS =================

app.post('/api/orders', (req, res) => {
  const { items, customer } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Cart empty"
    });
  }

  // Calculate total securely from server-side product prices
  let total = 0;

  items.forEach(item => {
    const product = products.find(
      p => p.id === item.id
    );

    if (product) {
      total += product.price * item.quantity;
    }
  });

  const order = {
    orderId: `ORD-${orderIdCounter++}`,
    items,
    total: Number(total.toFixed(2)),
    customer: customer || {},
    status: "confirmed",
    timestamp: new Date().toISOString()
  };

  orders.push(order);

  res.status(201).json({
    success: true,
    data: order
  });
});

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: orders
  });
});

// ================= REVIEWS =================

app.post('/api/reviews', (req, res) => {
  const {
    productId,
    customerName,
    rating,
    title,
    comment
  } = req.body;

  if (!productId || !customerName || !rating || !title) {
    return res.status(400).json({
      success: false,
      error: "Missing fields"
    });
  }

  const review = {
    reviewId: `REV-${reviewIdCounter++}`,
    productId: parseInt(productId),
    customerName,
    rating: parseInt(rating),
    title,
    comment: comment || "",
    timestamp: new Date().toISOString()
  };

  reviews.push(review);

  res.status(201).json({
    success: true,
    data: review
  });
});

app.get('/api/reviews/:productId', (req, res) => {
  const productReviews = reviews.filter(
    r => r.productId === parseInt(req.params.productId)
  );

  res.json({
    success: true,
    data: productReviews
  });
});

app.get('/api/top-rated', (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const topRated = products.map(product => {
    const productReviews = reviews.filter(r => r.productId === product.id);
    const rating = productReviews.length
      ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
      : 0;

    return {
      ...product,
      rating: Number(rating.toFixed(1)),
      reviewCount: productReviews.length
    };
  })
    .filter(product => product.reviewCount > 0)
    .sort((first, second) => second.rating - first.rating)
    .slice(0, limit);

  res.json({ success: true, count: topRated.length, data: topRated });
});

app.get('/api/discounts', (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const discounted = products
    .filter(product => product.discount > 0)
    .sort((first, second) => second.discount - first.discount)
    .slice(0, limit)
    .map(product => ({
      ...product,
      originalPrice: product.price,
      discountedPrice: (product.price * (1 - product.discount / 100)).toFixed(2),
      savings: (product.price * product.discount / 100).toFixed(2)
    }));

  res.json({ success: true, count: discounted.length, data: discounted });
});

app.get('/api/suggestions', (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const suggestions = products.map(product => {
    const productReviews = reviews.filter(review => review.productId === product.id);
    const rating = productReviews.length
      ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
      : 0;

    return {
      ...product,
      rating: Number(rating.toFixed(1)),
      reviewCount: productReviews.length,
      score: rating * 0.7 + productReviews.length * 0.3
    };
  })
    .sort((first, second) => second.score - first.score)
    .slice(0, limit);

  res.json({ success: true, count: suggestions.length, data: suggestions });
});

// ================= HEALTH CHECK =================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: "Server running"
  });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}