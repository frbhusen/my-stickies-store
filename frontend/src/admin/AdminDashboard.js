import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/AdminDashboard.css';
import logo from '../assets/logo.png';

const AdminDashboard = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchImages, setBatchImages] = useState('');
  const [batchCategory, setBatchCategory] = useState('');

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    discount: '',
    image: '',
    category: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    defaultPrice: '',
    defaultDiscount: '',
    applyDefaultsToProducts: false
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      const normalized = (response.data || []).map(p => ({
        ...p,
        image: normalizeImageUrl(p.image) || logo
      }));
      setProducts(normalized);
    } catch (error) {
      alert('Error fetching products');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      alert('Error fetching categories');
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      alert('Error fetching orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImageUrlChange = (url) => {
    const normalized = normalizeImageUrl(url);
    setProductForm({...productForm, image: normalized});
  };

  const applyCategoryDefaultsToProduct = useCallback((categoryId, form) => {
    const cat = categories.find(c => c._id === categoryId);
    if (!cat) return form;
    const updated = { ...form };
    if (!updated.price && cat.defaultPrice !== undefined && cat.defaultPrice !== null) {
      updated.price = cat.defaultPrice;
    }
    if ((updated.discount === '' || updated.discount === null || typeof updated.discount === 'undefined')
      && typeof cat.defaultDiscount !== 'undefined' && cat.defaultDiscount !== null) {
      updated.discount = cat.defaultDiscount;
    }
    if (!updated.description && cat.description) {
      updated.description = cat.description;
    }
    return updated;
  }, [categories]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchCategories();
    } else if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchCategories, fetchOrders, fetchProducts]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      discount: '',
      image: '',
      category: ''
    });
    setShowProductForm(true);
  };

  const handleBatchAdd = () => {
    setBatchImages('');
    setBatchCategory('');
    setShowBatchForm(true);
  };

  const handleSaveBatchProducts = async (e) => {
    e.preventDefault();
    
    if (!batchCategory) {
      alert('Please select a category');
      return;
    }
    
    const urls = batchImages.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    
    if (urls.length === 0) {
      alert('Please enter at least one image URL');
      return;
    }
    
    // Find category defaults
    const cat = categories.find(c => c._id === batchCategory);
    const defaults = {
      price: cat?.defaultPrice || '',
      discount: cat?.defaultDiscount || '',
      description: cat?.description || ''
    };
    
    try {
      let successCount = 0;
      let index = 1;
      
      for (const url of urls) {
        const normalized = normalizeImageUrl(url);
        
        const productData = {
          name: `Product ${index}`,
          image: normalized,
          category: batchCategory,
          ...defaults
        };
        
        await api.post('/products', productData);
        successCount++;
        index++;
      }
      
      alert(`Successfully added ${successCount} product(s)`);
      setShowBatchForm(false);
      setBatchImages('');
      setBatchCategory('');
      fetchProducts();
    } catch (error) {
      alert('Error adding products: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      discount: product.discount,
      image: normalizeImageUrl(product.image),
      category: product.category._id
    });
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const payload = {
      ...productForm,
      image: normalizeImageUrl(productForm.image)
    };
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowProductForm(false);
      fetchProducts();
    } catch (error) {
      alert('Error saving product: ' + error.response?.data?.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        alert('Error deleting product');
      }
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', defaultPrice: '', defaultDiscount: '', applyDefaultsToProducts: false });
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      defaultPrice: category.defaultPrice ?? '',
      defaultDiscount: category.defaultDiscount ?? '',
      applyDefaultsToProducts: false
    });
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, categoryForm);
      } else {
        await api.post('/categories', categoryForm);
      }
      setShowCategoryForm(false);
      fetchCategories();
    } catch (error) {
      alert('Error saving category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (error) {
        alert('Error deleting category');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      alert('Error updating order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Delete this order permanently?')) return;
    try {
      await api.delete(`/orders/${orderId}`);
      fetchOrders();
    } catch (error) {
      alert('Error deleting order');
    }
  };

  const handlePrintOrders = () => {
    if (!orders || orders.length === 0) {
      alert('No orders to export');
      return;
    }

    const rows = orders.map(order => {
      const name = order.customer?.fullName || '';
      const city = order.customer?.city || '';
      const phone = order.customer?.phoneNumber || '';
      const total = order.totalAmount?.toFixed ? order.totalAmount.toFixed(2) : order.totalAmount;
      return `<tr>
        <td>${order.orderNumber || ''}</td>
        <td>${name}</td>
        <td>${city}</td>
        <td>${phone}</td>
        <td>SYP ${total}</td>
      </tr>`;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Orders Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
            h1 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px 10px; font-size: 14px; }
            th { background: #f3f6fa; text-align: left; }
            tr:nth-child(every) { background: #fafafa; }
            .meta { margin-bottom: 12px; font-size: 12px; color: #555; }
          </style>
        </head>
        <body>
          <h1>Orders Export</h1>
          <div class="meta">Generated: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Name</th>
                <th>City</th>
                <th>Phone</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Use a Blob URL to avoid about:blank quirks and ensure styles load
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank', 'noopener,noreferrer,width=1000,height=800');
    if (!printWindow) {
      URL.revokeObjectURL(url);
      return;
    }

    const checkReady = setInterval(() => {
      try {
        if (printWindow.document && printWindow.document.readyState === 'complete') {
          clearInterval(checkReady);
          printWindow.focus();
          printWindow.print();
          setTimeout(() => {
            URL.revokeObjectURL(url);
            printWindow.close();
          }, 500);
        }
      } catch (err) {
        // ignore cross-origin while loading
      }
    }, 150);
  };

  const handlePrintSingleOrder = (order) => {
    if (!order) return;
    const name = order.customer?.fullName || '';
    const city = order.customer?.city || '';
    const phone = order.customer?.phoneNumber || '';
    const total = order.totalAmount?.toFixed ? order.totalAmount.toFixed(2) : order.totalAmount;
    const items = order.items || [];

    const itemRows = items.map(item => `
      <tr>
        <td>${item.productName || ''}</td>
        <td>${item.quantity || 0}</td>
        <td>SYP ${(item.price || 0).toFixed(2)}</td>
        <td>SYP ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Order ${order.orderNumber || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
            h1 { margin-bottom: 12px; }
            .meta { margin-bottom: 8px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px 10px; font-size: 14px; }
            th { background: #f3f6fa; text-align: left; }
            tr:nth-child(odd) { background: #fafafa; }
            .total { margin-top: 14px; font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body>
          <h1>Order ${order.orderNumber || ''}</h1>
          <div class="meta">Generated: ${new Date().toLocaleString()}</div>
          <div class="meta">Name: ${name}</div>
          <div class="meta">City: ${city}</div>
          <div class="meta">Phone: ${phone}</div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          <div class="total">Full Price: SYP ${total}</div>
        </body>
      </html>
    `;

    // Use a Blob URL to avoid about:blank CSP quirks and ensure content loads
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank', 'noopener,noreferrer,width=1000,height=800');
    if (!printWindow) {
      URL.revokeObjectURL(url);
      return;
    }

    const checkReady = setInterval(() => {
      try {
        if (printWindow.document && printWindow.document.readyState === 'complete') {
          clearInterval(checkReady);
          printWindow.focus();
          printWindow.print();
          setTimeout(() => {
            URL.revokeObjectURL(url);
            printWindow.close();
          }, 500);
        }
      } catch (err) {
        // ignore cross-origin while loading
      }
    }, 150);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin');
  };

  // Convert Google Drive share links to direct viewable URLs
  const extractDriveId = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    const fileMatch = trimmed.match(/\/file\/d\/([^/]+)/);
    const idParamMatch = trimmed.match(/[?&]id=([^&]+)/);
    return fileMatch?.[1] || idParamMatch?.[1] || '';
  };

  const normalizeImageUrl = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    const id = extractDriveId(trimmed);
    if (id) return `https://lh3.googleusercontent.com/d/${id}=s400`;
    return trimmed;
  };

  const handleTableImageError = (e, url) => {
    const id = extractDriveId(url);
    if (!id) {
      e.target.src = logo;
      return;
    }
    
    const fallbacks = [
      `https://lh3.googleusercontent.com/d/${id}=s400`,
      `https://drive.google.com/thumbnail?id=${id}&sz=w400`,
      `https://drive.google.com/uc?export=view&id=${id}`,
      logo
    ];
    
    const idx = Number(e.target.getAttribute('data-fallback-idx') || 0);
    const next = idx + 1;
    if (next < fallbacks.length) {
      e.target.setAttribute('data-fallback-idx', next);
      e.target.src = fallbacks[next];
    }
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            📦 Products
          </button>
          <button
            className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            🏷️ Categories
          </button>
          <button
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Orders
          </button>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </nav>
      </aside>

      <main className="admin-content">
        {/* Products Section */}
        {activeTab === 'products' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Products Management</h2>
              <div className="header-buttons">
                <button className="btn-primary" onClick={handleAddProduct}>
                  + Add Product
                </button>
                <button className="btn-secondary" onClick={handleBatchAdd}>
                  📦 Batch Add
                </button>
              </div>
            </div>

            {showBatchForm && (
              <form className="form-card" onSubmit={handleSaveBatchProducts}>
                <h3>Batch Add Products</h3>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={batchCategory}
                    onChange={(e) => setBatchCategory(e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  <small style={{color: '#666', fontSize: '12px'}}>All products will use this category's default price, discount, and description</small>
                </div>
                <div className="form-group">
                  <label>Image URLs (one per line)</label>
                  <textarea
                    value={batchImages}
                    onChange={(e) => setBatchImages(e.target.value)}
                    rows="10"
                    placeholder="Paste Google Drive image URLs here, one per line:\nhttps://drive.google.com/file/d/.../view\nhttps://drive.google.com/file/d/.../view\n...\n\nProducts will be named 'Product 1', 'Product 2', etc. You can rename them after creation."
                    required
                    style={{fontFamily: 'monospace', fontSize: '13px'}}
                  />
                </div>
                <div className="form-buttons">
                  <button type="submit" className="btn-primary">Add All Products</button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowBatchForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {showProductForm && (
              <form className="form-card" onSubmit={handleSaveProduct}>
                <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.discount}
                      onChange={(e) => setProductForm({...productForm, discount: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Image URL (Google Drive)</label>
                  <input
                    type="text"
                    value={productForm.image}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="Paste Google Drive image URL"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(applyCategoryDefaultsToProduct(e.target.value, {...productForm, category: e.target.value}))}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-buttons">
                  <button type="submit" className="btn-primary">Save</button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowProductForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <p>Loading products...</p>
            ) : (
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => {
                      const imgSrc = normalizeImageUrl(product.image) || logo;
                      return (
                      <tr key={product._id}>
                        <td>
                          <img 
                            src={imgSrc} 
                            alt={product.name} 
                            className="table-image"
                            onError={(e) => handleTableImageError(e, product.image)}
                            data-fallback-idx="0"
                          />
                        </td>
                        <td>{product.name}</td>
                        <td>SYP {Number(product.price || 0).toFixed(2)}</td>
                        <td>{product.discount}%</td>
                        <td>{product.category?.name}</td>
                        <td>
                          <button
                            className="btn-edit"
                            onClick={() => handleEditProduct(product)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Categories Section */}
        {activeTab === 'categories' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Categories Management</h2>
              <button className="btn-primary" onClick={handleAddCategory}>
                + Add Category
              </button>
            </div>

            {showCategoryForm && (
              <form className="form-card" onSubmit={handleSaveCategory}>
                <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category Description (applied to products)</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category Price (optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={categoryForm.defaultPrice}
                      onChange={(e) => setCategoryForm({...categoryForm, defaultPrice: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Category Discount (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={categoryForm.defaultDiscount}
                      onChange={(e) => setCategoryForm({...categoryForm, defaultDiscount: e.target.value})}
                    />
                  </div>
                </div>
                {editingCategory && (
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={categoryForm.applyDefaultsToProducts}
                        onChange={(e) => setCategoryForm({...categoryForm, applyDefaultsToProducts: e.target.checked})}
                      />
                      Apply these values to all products in this category now
                    </label>
                  </div>
                )}
                <div className="form-buttons">
                  <button type="submit" className="btn-primary">Save</button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCategoryForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="categories-grid">
              {categories.map(category => (
                <div key={category._id} className="category-card">
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <p className="meta">Price: {category.defaultPrice ? `SYP ${Number(category.defaultPrice).toFixed(2)}` : '—'}</p>
                  <p className="meta">Discount: {typeof category.defaultDiscount !== 'undefined' ? `${category.defaultDiscount}%` : '—'}</p>
                  <div className="card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditCategory(category)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteCategory(category._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Section */}
        {activeTab === 'orders' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Orders Management</h2>
              <button className="btn-secondary" onClick={handlePrintOrders}>
                Export / Print
              </button>
            </div>

            {loading ? (
              <p>Loading orders...</p>
            ) : orders.length === 0 ? (
              <p>No orders yet</p>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <h3>Order #{order.orderNumber}</h3>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="order-customer">
                      <p><strong>Customer:</strong> {order.customer.fullName}</p>
                      <p><strong>Phone:</strong> {order.customer.phoneNumber}</p>
                      <p><strong>City:</strong> {order.customer.city}</p>
                    </div>

                    <div className="order-items">
                      <h4>Items:</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.productName}</td>
                              <td>{item.quantity}</td>
                              <td>SYP {item.price.toFixed(2)}</td>
                              <td>SYP {(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="order-total">
                      <strong>Total Amount: SYP {order.totalAmount.toFixed(2)}</strong>
                    </div>

                    <div className="order-actions">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        className="btn-secondary"
                        onClick={() => handlePrintSingleOrder(order)}
                      >
                        Export / Print
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteOrder(order._id)}
                      >
                        Delete
                      </button>
                    </div>

                    <div className="order-footer">
                      <p>Ordered: {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
