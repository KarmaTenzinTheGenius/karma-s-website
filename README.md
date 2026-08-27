# E-Commerce Backend API

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Products

#### Get All Products
```
GET /api/products
Query Parameters:
  - category: Filter by category
  - minPrice: Minimum price filter
  - maxPrice: Maximum price filter
  - search: Search by product name
```

#### Get Single Product
```
GET /api/products/:id
```

#### Get Categories
```
GET /api/categories
```

### Search

#### Search Products
```
POST /api/search
Body: { "query": "laptop" }
```

### Cart

#### Validate Cart Items
```
POST /api/validate-cart
Body: { 
  "items": [
    { "name": "laptop", "quantity": 1, "price": 1199.99 }
  ]
}
```

### Orders

#### Create Order
```
POST /api/orders
Body: {
  "items": [
    { "name": "laptop", "quantity": 1, "price": 1199.99 }
  ],
  "total": 1199.99,
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Get Order Details
```
GET /api/orders/:orderId
```

#### Get All Orders
```
GET /api/orders
```

### Health

#### Health Check
```
GET /api/health
```

## Example Usage

### Frontend Integration

```javascript
// Fetch products
fetch('http://localhost:5000/api/products')
  .then(res => res.json())
  .then(data => console.log(data));

// Create order
fetch('http://localhost:5000/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [...],
    total: 100,
    customer: { name: 'User' }
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## Features

✅ Product listing with filters
✅ Search functionality
✅ Cart validation
✅ Order management
✅ Category management
✅ CORS enabled
✅ JSON responses
✅ Error handling

## Architecture

- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **In-memory storage** - For demo purposes (use database in production)

## Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication
- [ ] Payment processing
- [ ] Order tracking
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Inventory management
