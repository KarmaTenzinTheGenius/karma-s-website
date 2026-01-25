// ========== API CONFIGURATION ==========
const API_URL = 'http://localhost:5000/api';

// ========== ADMIN DATA ==========
let allProducts = [];
let allOrders = [];
let filteredOrders = [];

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
  loadAdminData();
  setInterval(loadAdminData, 10000); // Refresh every 10 seconds
});

// ========== LOAD ALL ADMIN DATA ==========
async function loadAdminData() {
  await loadProducts();
  await loadOrders();
  updateDashboard();
}

// ========== LOAD PRODUCTS ==========
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();
    if (data.success) {
      allProducts = data.data;
      displayProducts();
      updateCategoryStats();
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// ========== LOAD ORDERS ==========
async function loadOrders() {
  try {
    const response = await fetch(`${API_URL}/orders`);
    const data = await response.json();
    if (data.success) {
      allOrders = data.data;
      filteredOrders = data.data;
      displayOrders();
      updateDashboard();
    }
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

// ========== UPDATE DASHBOARD ==========
function updateDashboard() {
  // Total Orders
  document.getElementById('totalOrders').textContent = allOrders.length;
  
  // Total Revenue
  const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
  document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
  
  // Total Products
  document.getElementById('totalProducts').textContent = allProducts.length;
  
  // Average Order Value
  const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
  document.getElementById('avgOrderValue').textContent = `$${avgOrderValue.toFixed(2)}`;
  
  // Recent Orders
  const recentOrders = allOrders.slice(-5).reverse();
  const recentOrdersBody = document.getElementById('recentOrdersBody');
  recentOrdersBody.innerHTML = recentOrders.map(order => `
    <tr>
      <td>${order.orderId}</td>
      <td>$${order.total.toFixed(2)}</td>
      <td>${order.items.length}</td>
      <td>${new Date(order.timestamp).toLocaleDateString()}</td>
      <td><span class="status-badge status-${order.status}">${order.status}</span></td>
    </tr>
  `).join('');
  
  // Sales Data
  document.getElementById('salesData').textContent = `Total: $${totalRevenue.toFixed(2)} from ${allOrders.length} orders`;
  
  // Top Products
  updateTopProducts();
}

// ========== DISPLAY PRODUCTS ==========
function displayProducts() {
  const productsBody = document.getElementById('productsBody');
  productsBody.innerHTML = allProducts.map(product => `
    <tr>
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>$${product.price.toFixed(2)}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editProduct(${product.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

// ========== DISPLAY ORDERS ==========
function displayOrders() {
  const ordersBody = document.getElementById('ordersBody');
  ordersBody.innerHTML = filteredOrders.map(order => `
    <tr>
      <td>${order.orderId}</td>
      <td>$${order.total.toFixed(2)}</td>
      <td>${order.items.length}</td>
      <td>${new Date(order.timestamp).toLocaleDateString()}</td>
      <td><span class="status-badge status-${order.status}">${order.status}</span></td>
      <td>
        <button class="action-btn view-btn" onclick="viewOrderDetails('${order.orderId}')">View</button>
      </td>
    </tr>
  `).join('');
}

// ========== VIEW ORDER DETAILS ==========
function viewOrderDetails(orderId) {
  const order = allOrders.find(o => o.orderId === orderId);
  if (!order) return;
  
  const detailContent = document.getElementById('orderDetailContent');
  const itemsList = order.items.map(item => `
    <div class="order-detail-item">
      <strong>${item.name}</strong>
      <span class="order-detail-item-text">× ${item.quantity} @ $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');
  
  detailContent.innerHTML = `
    <div class="order-detail-item">
      <strong>Order ID:</strong>
      <span class="order-detail-item-text">${order.orderId}</span>
    </div>
    <div class="order-detail-item">
      <strong>Date:</strong>
      <span class="order-detail-item-text">${new Date(order.timestamp).toLocaleString()}</span>
    </div>
    <div class="order-detail-item">
      <strong>Status:</strong>
      <span class="order-detail-item-text"><span class="status-badge status-${order.status}">${order.status}</span></span>
    </div>
    <div class="order-detail-item">
      <strong>Items:</strong>
    </div>
    ${itemsList}
    <div class="order-detail-item">
      <strong>Total:</strong>
      <span class="order-detail-item-text">$${order.total.toFixed(2)}</span>
    </div>
    <div class="order-detail-item">
      <strong>Estimated Delivery:</strong>
      <span class="order-detail-item-text">${new Date(order.estimatedDelivery).toLocaleDateString()}</span>
    </div>
  `;
  
  document.getElementById('orderDetailModal').style.display = 'block';
}

function closeOrderDetail() {
  document.getElementById('orderDetailModal').style.display = 'none';
}

// ========== FILTER ORDERS ==========
function filterOrders() {
  const status = document.getElementById('statusFilter').value;
  
  if (status === '') {
    filteredOrders = allOrders;
  } else {
    filteredOrders = allOrders.filter(order => order.status === status);
  }
  
  displayOrders();
}

// ========== UPDATE CATEGORY STATS ==========
function updateCategoryStats() {
  const categories = {};
  allProducts.forEach(product => {
    categories[product.category] = (categories[product.category] || 0) + 1;
  });
  
  const categoryData = document.getElementById('categoryData');
  categoryData.innerHTML = Object.entries(categories).map(([cat, count]) => `
    <div>${cat}: ${count} products</div>
  `).join('');
}

// ========== UPDATE TOP PRODUCTS ==========
function updateTopProducts() {
  const productCounts = {};
  
  allOrders.forEach(order => {
    order.items.forEach(item => {
      productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
    });
  });
  
  const topList = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `<li>${name} (${count} units)</li>`)
    .join('');
  
  document.getElementById('topProductsList').innerHTML = topList || '<li>No sales yet</li>';
}

// ========== EDIT PRODUCT ==========
function editProduct(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  const newPrice = prompt(`Edit price for "${product.name}":\nCurrent: $${product.price}`, product.price);
  
  if (newPrice !== null && !isNaN(newPrice)) {
    alert(`✓ Price for "${product.name}" updated to $${newPrice}\n\n(Note: Persistent database needed for permanent changes)`);
  }
}

// ========== DELETE PRODUCT ==========
function deleteProduct(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
    alert(`✓ Product "${product.name}" deleted\n\n(Note: Persistent database needed for permanent changes)`);
  }
}

// ========== SHOW SECTION ==========
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Remove active from all menu items
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Show selected section
  document.getElementById(sectionId).classList.add('active');
  
  // Add active to clicked menu item
  event.target.classList.add('active');
}

// ========== LOGOUT ==========
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'index.html';
  }
}

// ========== GO BACK ==========
function goBack() {
  window.location.href = 'index.html';
}

// ========== CLOSE MODAL ON OUTSIDE CLICK ==========
window.onclick = function(event) {
  const modal = document.getElementById('orderDetailModal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }
}
