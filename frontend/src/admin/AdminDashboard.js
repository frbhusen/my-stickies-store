import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/AdminDashboard.css';
import logo from '../assets/logo.png';

// Utility functions for image URL processing
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

const truncate = (text, len = 120) => {
  if (!text) return '';
  return text.length > len ? text.slice(0, len - 1) + '…' : text;
};

const AdminDashboard = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [inlineEditProductId, setInlineEditProductId] = useState(null);
  const [inlineEditCategoryId, setInlineEditCategoryId] = useState(null);
  const [inlineEditSubCategoryId, setInlineEditSubCategoryId] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchMode, setBatchMode] = useState('add'); // 'add' | 'edit'
  const [batchImages, setBatchImages] = useState('');
  const [batchCategory, setBatchCategory] = useState('');
  const [batchSubCategory, setBatchSubCategory] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [settingsCurrency, setSettingsCurrency] = useState('SYP');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    type: 'product',
    discount: '',
    image: '',
    category: '',
    subCategory: '',
    currency: null
  });

  const [subCategoryForm, setSubCategoryForm] = useState({
    name: '',
    description: '',
    image: '',
    category: '',
    defaultPrice: '',
    defaultDiscount: '',
    currency: null
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: '',
    defaultPrice: '',
    type: 'product',
    defaultDiscount: '',
    applyDefaultsToProducts: false,
    currency: null
  });

  const isEservicesTab = activeTab === 'eservices';
  const currentType = isEservicesTab ? 'eservice' : (activeTab === 'products' ? 'product' : undefined);
  const currentTypeLabel = isEservicesTab ? 'E-Service' : 'Product';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  // If the stored admin token is missing, force re-login to avoid unauthorized requests
  useEffect(() => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        // Token missing — navigate to login so user can re-authenticate
        alert('Your session has expired or you are not logged in. Please log in.');
        navigate('/admin');
      }
    } catch (err) {
      // ignore storage errors
    }
  }, [navigate]);

  const fetchProducts = useCallback(async (type) => {
    setLoading(true);
    try {
      const params = type ? { type } : {};
      const response = await api.get('/products', { params });
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

  const fetchCategories = useCallback(async (type) => {
    try {
      const params = type ? { type } : {};
      const response = await api.get('/categories', { params });
      setCategories(response.data);
    } catch (error) {
      alert('Error fetching categories');
    }
  }, []);

  const fetchSubCategories = useCallback(async (type, categoryId) => {
    try {
      const params = {};
      if (type) params.type = type;
      if (categoryId) params.category = categoryId;
      const response = await api.get('/subcategories', { params });
      setSubCategories(response.data);
      return response.data;
    } catch (error) {
      alert('Error fetching sub-categories');
      return [];
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

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const response = await api.get('/settings');
      setSettingsCurrency(response.data?.currency || 'SYP');
    } catch (error) {
      alert('Error fetching settings');
    } finally {
      setSettingsLoading(false);
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
    if (activeTab === 'products' || activeTab === 'eservices') {
      const type = activeTab === 'eservices' ? 'eservice' : 'product';
      fetchProducts(type);
      fetchCategories(type);
      // fetch sub-categories for the current type so admin can manage them for both products and e-services
      fetchSubCategories(type);
    } else if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'settings') {
      fetchSettings();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchCategories, fetchOrders, fetchProducts, fetchSubCategories, fetchSettings]);

  useEffect(() => {
    setSelectedProducts([]);
    setProductSearchTerm('');
    setProductCategoryFilter('');
  }, [activeTab]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setInlineEditProductId(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      type: isEservicesTab ? 'eservice' : 'product',
      discount: '',
      image: '',
      category: '',
      subCategory: ''
    });
    setShowProductForm(true);
  };

  const handleBatchAdd = () => {
    setBatchImages('');
    setBatchCategory('');
    setBatchSubCategory('');
    setBatchDescription('');
    setBatchMode('add');
    setShowBatchForm(true);
  };

  const handleOpenBatchEdit = async () => {
    if (selectedProducts.length === 0) {
      alert('Select products to batch edit first');
      return;
    }
    // Ensure sub-categories are loaded for current type
    try {
      await fetchSubCategories(currentType);
    } catch (err) { /* ignore */ }
    setBatchCategory('');
    setBatchSubCategory('');
    setBatchDescription('');
    setBatchMode('edit');
    console.debug('Opening batch edit for products:', selectedProducts);
    setShowBatchForm(true);
    // scroll to top where the form is rendered so it's visible
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        const el = document.getElementById('batch-edit-form');
        if (el) el.querySelector('select')?.focus();
      }, 300);
    } catch (err) { /* ignore in non-browser env */ }
  };

  const handleSaveBatchProducts = async (e) => {
    e.preventDefault();
    
    if (isEservicesTab) {
      if (!batchSubCategory) {
        alert('Please select a sub-category');
        return;
      }
    } else if (!batchCategory) {
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
    const subCat = subCategories.find(s => s._id === batchSubCategory);
    const parentCat = subCat?.category || null;
    const defaults = {
      price: isEservicesTab ? (parentCat?.defaultPrice || '') : (cat?.defaultPrice || ''),
      discount: isEservicesTab ? (parentCat?.defaultDiscount || '') : (cat?.defaultDiscount || ''),
      description: isEservicesTab ? (parentCat?.description || '') : (cat?.description || '')
    };
    const resolvedType = isEservicesTab ? 'eservice' : (cat?.type || 'product');
    
    try {
      let successCount = 0;
      let index = 1;
      
      for (const url of urls) {
        const normalized = normalizeImageUrl(url);
        
        const baseName = isEservicesTab ? 'Service' : 'Product';
        const productData = {
          name: `${baseName} ${index}`,
          image: normalized,
          category: isEservicesTab ? undefined : batchCategory,
          subCategory: isEservicesTab ? batchSubCategory : undefined,
          type: resolvedType,
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
      setBatchSubCategory('');
      fetchProducts(resolvedType);
    } catch (error) {
      alert('Error adding products: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveBatchEdit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      alert('No products selected');
      return;
    }

    const trimmedDescription = (batchDescription || '').trim();
    if (!batchCategory && !batchSubCategory && !trimmedDescription) {
      alert('Please enter a description or select a target category/sub-category');
      return;
    }

    try {
      const payload = {
        ids: selectedProducts,
        category: batchCategory || undefined,
        subCategory: batchSubCategory || undefined,
        description: trimmedDescription || undefined
      };
      await api.put('/products/batch', payload);
      alert('Batch update successful');
      setSelectedProducts([]);
      setShowBatchForm(false);
      fetchProducts(isEservicesTab ? 'eservice' : 'product');
    } catch (error) {
      alert('Error performing batch update: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      type: product.type || 'product',
      discount: product.discount,
      image: normalizeImageUrl(product.image),
      category: product.category?._id || '',
      subCategory: product.subCategory?._id || '',
      currency: product.currency || null
    });
    setShowProductForm(false);
    setInlineEditProductId(product._id);
    // load sub-categories for this product's type and category so the select is populated
    try { fetchSubCategories(product.type || (product.category?.type ? product.category.type : (product.type || 'product')), product.category?._id); } catch (err) { /* ignore */ }
  };

  const handleCopyProduct = async (product) => {
    if (!product) return;
    const resolvedType = product.type || product.category?.type || (isEservicesTab ? 'eservice' : 'product');
    const payload = {
      name: `${product.name} (Copy)`,
      description: product.description,
      price: product.price,
      discount: product.discount,
      image: normalizeImageUrl(product.image),
      type: resolvedType,
      category: product.category?._id,
      subCategory: product.subCategory?._id,
      currency: product.currency || null
    };

    if (resolvedType === 'eservice' && !payload.subCategory) {
      alert('Cannot copy: e-services must have a sub-category');
      return;
    }
    if (resolvedType === 'eservice') {
      payload.category = undefined;
    }

    try {
      await api.post('/products', payload);
      fetchProducts(resolvedType);
    } catch (error) {
      alert('Error copying product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleBatchCopy = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products to copy');
      return;
    }

    const productsToCopy = products.filter(p => selectedProducts.includes(p._id));
    if (productsToCopy.length === 0) {
      alert('No matching products found');
      return;
    }

    const resolvedType = isEservicesTab ? 'eservice' : 'product';

    try {
      for (const product of productsToCopy) {
        const payload = {
          name: `${product.name} (Copy)`,
          description: product.description,
          price: product.price,
          discount: product.discount,
          image: normalizeImageUrl(product.image),
          type: product.type || resolvedType,
          category: product.category?._id,
          subCategory: product.subCategory?._id,
          currency: product.currency || null
        };

        if ((payload.type === 'eservice' || resolvedType === 'eservice') && !payload.subCategory) {
          continue;
        }
        if (payload.type === 'eservice' || resolvedType === 'eservice') {
          payload.category = undefined;
        }

        await api.post('/products', payload);
      }

      fetchProducts(resolvedType);
    } catch (error) {
      alert('Error copying products: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const resolvedType = productForm.type || (isEservicesTab ? 'eservice' : 'product');
    const payload = {
      ...productForm,
      type: resolvedType,
      image: normalizeImageUrl(productForm.image)
    };
    if (payload.price === '' || payload.price === null) delete payload.price;
    if (payload.discount === '' || payload.discount === null) delete payload.discount;
    if (resolvedType === 'eservice') {
      payload.category = undefined;
    }
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowProductForm(false);
      setInlineEditProductId(null);
      setEditingProduct(null);
      fetchProducts(resolvedType);
    } catch (error) {
      alert('Error saving product: ' + error.response?.data?.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts(isEservicesTab ? 'eservice' : 'product');
      } catch (error) {
        alert('Error deleting product');
      }
    }
  };

  const handleMoveProduct = async (id, direction) => {
    try {
      // include current filter scope so move is limited to visible list
      const params = {};
      if (isEservicesTab) {
        if (productCategoryFilter) params.subCategory = productCategoryFilter;
      } else {
        if (productCategoryFilter) params.category = productCategoryFilter;
      }

      await api.post(`/products/${id}/move`, { direction }, { params });
      fetchProducts(isEservicesTab ? 'eservice' : 'product');
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired — please log in again');
        handleLogout();
        return;
      }
      alert('Error moving product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) {
      try {
        await Promise.all(selectedProducts.map(id => api.delete(`/products/${id}`)));
        setSelectedProducts([]);
        fetchProducts(isEservicesTab ? 'eservice' : 'product');
        alert(`Successfully deleted ${selectedProducts.length} product(s)`);
      } catch (error) {
        alert('Error deleting products: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    const filteredProducts = getFilteredProducts();
    const filteredIds = filteredProducts.map(p => p._id);
    const allFilteredSelected = filteredIds.every(id => selectedProducts.includes(id));
    
    if (allFilteredSelected) {
      setSelectedProducts(selectedProducts.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedProducts([...new Set([...selectedProducts, ...filteredIds])]);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', image: '', defaultPrice: '', type: 'product', defaultDiscount: '', applyDefaultsToProducts: false });
    setShowCategoryForm(true);
  };

  const handleAddEserviceCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', image: '', defaultPrice: '', type: 'eservice', defaultDiscount: '', applyDefaultsToProducts: false });
    setShowCategoryForm(true);
  };

  const handleAddSubCategory = () => {
    setEditingCategory(null);
    setSubCategoryForm({ name: '', description: '', image: '', category: '', defaultPrice: '', defaultDiscount: '', currency: null });
    setShowSubCategoryForm(true);
  };

  const handleEditSubCategory = (subCategory) => {
    setEditingCategory(subCategory);
    setSubCategoryForm({
      name: subCategory.name,
      description: subCategory.description || '',
      image: subCategory.image || '',
      category: subCategory.category?._id || '',
      defaultPrice: subCategory.defaultPrice ?? '',
      defaultDiscount: subCategory.defaultDiscount ?? '',
      currency: subCategory.currency || null
    });
    setShowSubCategoryForm(false);
    setInlineEditSubCategoryId(subCategory._id);
  };

  const handleSaveSubCategory = async (e) => {
    e.preventDefault();
    if (!subCategoryForm.category) {
      alert('Please select a parent category');
      return;
    }
    try {
      const parentCat = categories.find(c => c._id === subCategoryForm.category);
      const payload = { ...subCategoryForm, type: parentCat?.type || currentType };
      if (editingCategory && editingCategory.category) {
        await api.put(`/subcategories/${editingCategory._id}`, payload);
      } else {
        await api.post('/subcategories', payload);
      }
      setShowSubCategoryForm(false);
      setInlineEditSubCategoryId(null);
      setEditingCategory(null);
      // refresh sub-categories for this type
      fetchSubCategories(payload.type);
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired or unauthorized — please log in again');
        handleLogout();
        return;
      }
      alert('Error saving sub-category: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteSubCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sub-category?')) return;
    try {
      await api.delete(`/subcategories/${id}`);
      const sc = subCategories.find(s => s._id === id);
      const typeToRefresh = sc?.category?.type || sc?.type || currentType;
      fetchSubCategories(typeToRefresh);
    } catch (error) {
      alert('Error deleting sub-category');
    }
  };

  const handleMoveSubCategory = async (id, direction) => {
    try {
      await api.post(`/subcategories/${id}/move`, { direction });
      const sc = subCategories.find(s => s._id === id);
      const typeToRefresh = sc?.category?.type || sc?.type || currentType;
      fetchSubCategories(typeToRefresh);
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired — please log in again');
        handleLogout();
        return;
      }
      alert('Error moving sub-category: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', { currency: settingsCurrency });
      alert('Settings saved');
    } catch (error) {
      alert('Error saving settings');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      defaultPrice: category.defaultPrice ?? '',
      type: category.type || 'product',
      defaultDiscount: category.defaultDiscount ?? '',
      applyDefaultsToProducts: false,
      currency: category.currency || null
    });
    setShowCategoryForm(false);
    setInlineEditCategoryId(category._id);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...categoryForm };
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, payload);
      } else {
        await api.post('/categories', payload);
      }
      setShowCategoryForm(false);
      setInlineEditCategoryId(null);
      const type = activeTab === 'eservices' ? 'eservice' : (activeTab === 'products' ? 'product' : undefined);
      fetchCategories(type);
    } catch (error) {
      alert('Error saving category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/categories/${id}`);
        const type = activeTab === 'eservices' ? 'eservice' : (activeTab === 'products' ? 'product' : undefined);
        fetchCategories(type);
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
      const email = order.customer?.email || '';
      const status = order.status || '';
      const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
      const itemsCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
      const total = order.totalAmount?.toFixed ? order.totalAmount.toFixed(2) : order.totalAmount;
      return `<tr>
        <td>${order.orderNumber || ''}</td>
        <td>${created}</td>
        <td>${status}</td>
        <td>${name}</td>
        <td>${phone}</td>
        <td>${city}</td>
        <td>${email}</td>
        <td>${itemsCount}</td>
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
                <th>Date</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>City</th>
                <th>Email</th>
                <th>Items</th>
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

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = !productSearchTerm || 
        product.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(productSearchTerm.toLowerCase());
      
      const matchesCategory = !productCategoryFilter || 
        product.category?._id === productCategoryFilter ||
        product.subCategory?._id === productCategoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  };

  const renderProductForm = (onCancel) => (
    <form className="form-card" onSubmit={handleSaveProduct}>
      <h3>{editingProduct ? (isEservicesTab ? 'Edit E-Service' : 'Edit Product') : (isEservicesTab ? 'Add New E-Service' : 'Add New Product')}</h3>
      <div className="form-group">
        <label>{isEservicesTab ? 'Service Name' : 'Product Name'}</label>
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
      <div className="form-group">
        <label>Type</label>
        <select
          value={productForm.type}
          onChange={(e) => setProductForm({...productForm, type: e.target.value})}
          disabled={activeTab === 'products' || activeTab === 'eservices'}
        >
          <option value="product">Physical Product</option>
          <option value="eservice">E-Service</option>
        </select>
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
          placeholder={'Paste Google Drive image URL'}
          required
        />
      </div>
      <div className="form-group">
        <label>Category</label>
        <select
          value={productForm.category}
          onChange={async (e) => {
            const catId = e.target.value;
            const updated = applyCategoryDefaultsToProduct(catId, {...productForm, category: catId});
            setProductForm(updated);
            // fetch sub-categories for this category and current product type
            try {
              await fetchSubCategories(productForm.type || currentType, catId);
            } catch (err) {
              // ignore
            }
          }}
          required
        >
          <option value="">Select Category</option>
          {categories
            .filter(cat => !productForm.type || cat.type === productForm.type)
            .map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
        </select>
      </div>

      {productForm.category && subCategories.filter(s => s.category?._id === productForm.category).length > 0 && (
        <div className="form-group">
          <label>Sub-Category{productForm.type === 'eservice' ? ' (required)' : ' (optional)'}</label>
          <select
            value={productForm.subCategory}
            onChange={(e) => {
              const subId = e.target.value;
              const sub = subCategories.find(s => s._id === subId);
              const updated = { ...productForm, subCategory: subId };
              if (sub) {
                if (!updated.price && typeof sub.defaultPrice !== 'undefined' && sub.defaultPrice !== null) {
                  updated.price = sub.defaultPrice;
                }
                if ((updated.discount === '' || updated.discount === null || typeof updated.discount === 'undefined')
                  && typeof sub.defaultDiscount !== 'undefined' && sub.defaultDiscount !== null) {
                  updated.discount = sub.defaultDiscount;
                }
                if (!updated.description && sub.description) {
                  updated.description = sub.description;
                }
              }
              setProductForm(updated);
            }}
            required={productForm.type === 'eservice'}
          >
            <option value="">{productForm.type === 'eservice' ? 'Select Sub-Category' : 'None'}</option>
            {subCategories.filter(s => s.category?._id === productForm.category).map(sub => (
              <option key={sub._id} value={sub._id}>{sub.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="form-group">
        <label>Currency Override (optional)</label>
        <select
          value={productForm.currency || ''}
          onChange={(e) => setProductForm({...productForm, currency: e.target.value || null})}
        >
          <option value="">Use Global Setting</option>
          <option value="SYP">SYP</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <div className="form-buttons">
        <button type="submit" className="btn-primary">Save</button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  const renderCategoryForm = (onCancel) => (
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
      <div className="form-group">
        <label>Category Type</label>
        <select
          value={categoryForm.type}
          onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}
        >
          <option value="product">Physical Products</option>
          <option value="eservice">E-Services</option>
        </select>
      </div>
      <div className="form-group">
        <label>Category Image URL (Google Drive)</label>
        <input
          type="text"
          value={categoryForm.image}
          onChange={(e) => setCategoryForm({...categoryForm, image: e.target.value})}
          placeholder="Paste Google Drive image URL"
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
      <div className="form-group">
        <label>Currency Override (optional)</label>
        <select
          value={categoryForm.currency || ''}
          onChange={(e) => setCategoryForm({...categoryForm, currency: e.target.value || null})}
        >
          <option value="">Use Global Setting</option>
          <option value="SYP">SYP</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <div className="form-buttons">
        <button type="submit" className="btn-primary">Save</button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  const renderSubCategoryForm = (onCancel) => (
    <form className="form-card" onSubmit={handleSaveSubCategory}>
      <h3>{editingCategory && editingCategory.category ? 'Edit Sub-Category' : 'Add New Sub-Category'}</h3>
      <div className="form-group">
        <label>Sub-Category Name</label>
        <input
          type="text"
          value={subCategoryForm.name}
          onChange={(e) => setSubCategoryForm({...subCategoryForm, name: e.target.value})}
          required
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={subCategoryForm.description}
          onChange={(e) => setSubCategoryForm({...subCategoryForm, description: e.target.value})}
        />
      </div>
      <div className="form-group">
        <label>Parent Category</label>
        <select
          value={subCategoryForm.category}
          onChange={(e) => setSubCategoryForm({...subCategoryForm, category: e.target.value})}
          required
        >
          <option value="">Select Parent Category</option>
          {categories
            .filter(cat => !currentType || cat.type === currentType)
            .map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
        </select>
      </div>
      <div className="form-group">
        <label>Sub-Category Image URL (Google Drive)</label>
        <input
          type="text"
          value={subCategoryForm.image}
          onChange={(e) => setSubCategoryForm({...subCategoryForm, image: e.target.value})}
          placeholder="Paste Google Drive image URL"
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Sub-Category Default Price (optional)</label>
          <input
            type="number"
            step="0.01"
            value={subCategoryForm.defaultPrice || ''}
            onChange={(e) => setSubCategoryForm({...subCategoryForm, defaultPrice: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Sub-Category Default Discount (%)</label>
          <input
            type="number"
            step="0.1"
            value={subCategoryForm.defaultDiscount || ''}
            onChange={(e) => setSubCategoryForm({...subCategoryForm, defaultDiscount: e.target.value})}
          />
        </div>
      </div>
      <div className="form-group">
        <label>Currency Override (optional)</label>
        <select
          value={subCategoryForm.currency || ''}
          onChange={(e) => setSubCategoryForm({...subCategoryForm, currency: e.target.value || null})}
        >
          <option value="">Use Global Setting</option>
          <option value="SYP">SYP</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <div className="form-buttons">
        <button type="submit" className="btn-primary">Save</button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );

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
            className={`nav-item ${activeTab === 'eservices' ? 'active' : ''}`}
            onClick={() => setActiveTab('eservices')}
          >
            💻 E-Services
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
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </nav>
      </aside>

      <main className="admin-content">
        {/* Products Section */}
        {(activeTab === 'products' || activeTab === 'eservices') && (
          <div className="tab-content">
            <div className="content-header">
              <h2>{isEservicesTab ? 'E-Services Management' : 'Products Management'}</h2>
              <div className="header-buttons">
                <button className="btn-primary" onClick={handleAddProduct}>
                  {isEservicesTab ? '+ Add E-Service' : '+ Add Product'}
                </button>
                <button className="btn-secondary" onClick={handleBatchAdd}>
                  {isEservicesTab ? '💻 Batch Add' : '📦 Batch Add'}
                </button>
                {selectedProducts.length > 0 && (
                  <button className="btn-secondary" onClick={handleBatchCopy}>
                    📄 Copy Selected ({selectedProducts.length})
                  </button>
                )}
                {selectedProducts.length > 0 && (
                  <button className="btn-delete" onClick={handleBatchDelete}>
                    🗑️ Delete Selected ({selectedProducts.length})
                  </button>
                )}
              </div>
            </div>

            {showBatchForm && batchMode === 'add' && (
              <form className="form-card" onSubmit={handleSaveBatchProducts}>
                <h3>{isEservicesTab ? 'Batch Add E-Services' : 'Batch Add Products'}</h3>
                <div className="form-group">
                  <label>{isEservicesTab ? 'Sub-Category' : 'Category'}</label>
                  <select
                    value={isEservicesTab ? batchSubCategory : batchCategory}
                    onChange={(e) => isEservicesTab ? setBatchSubCategory(e.target.value) : setBatchCategory(e.target.value)}
                    required
                  >
                    <option value="">Select {isEservicesTab ? 'Sub-Category' : 'Category'}</option>
                    {(isEservicesTab ? subCategories : categories).map(cat => (
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
                    placeholder={isEservicesTab ? "Paste Google Drive image URLs here, one per line:\nhttps://drive.google.com/file/d/.../view\nhttps://drive.google.com/file/d/.../view\n...\n\nServices will be named 'Service 1', 'Service 2', etc. You can rename them after creation." : "Paste Google Drive image URLs here, one per line:\nhttps://drive.google.com/file/d/.../view\nhttps://drive.google.com/file/d/.../view\n...\n\nProducts will be named 'Product 1', 'Product 2', etc. You can rename them after creation."}
                    required
                    style={{fontFamily: 'monospace', fontSize: '13px'}}
                  />
                </div>
                <div className="form-buttons">
                  <button type="submit" className="btn-primary">{isEservicesTab ? 'Add All Services' : 'Add All Products'}</button>
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

            {showBatchForm && batchMode === 'edit' && (
              <form id="batch-edit-form" className="form-card" onSubmit={handleSaveBatchEdit}>
                <h3>Batch Edit Selected Products</h3>
                <div className="form-group">
                  <label>Target Category</label>
                  <select
                    value={batchCategory}
                    onChange={(e) => setBatchCategory(e.target.value)}
                    disabled={!!batchSubCategory}
                  >
                    <option value="">No change</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  {batchSubCategory && (
                    <small style={{color:'#666',fontSize:'12px'}}>Category is set automatically from selected sub-category</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Target Sub-Category</label>
                  <select
                    value={batchSubCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBatchSubCategory(val);
                      if (val) {
                        const sc = subCategories.find(s => s._id === val);
                        if (sc && sc.category) setBatchCategory(sc.category._id);
                      }
                    }}
                  >
                    <option value="">No change</option>
                    {subCategories.map(sc => (
                      <option key={sc._id} value={sc._id}>{sc.name} (Parent: {sc.category?.name})</option>
                    ))}
                  </select>
                  <small style={{color: '#666', fontSize: '12px'}}>If you set a sub-category, its parent category will be applied automatically.</small>
                </div>
                <div className="form-group">
                  <label>Update Description</label>
                  <textarea
                    value={batchDescription}
                    onChange={(e) => setBatchDescription(e.target.value)}
                    rows="4"
                    placeholder="Leave empty to keep current descriptions"
                  />
                </div>
                <div className="form-buttons">
                  <button type="submit" className="btn-primary">Apply to Selected ({selectedProducts.length})</button>
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

            {showProductForm && renderProductForm(() => setShowProductForm(false))}

            {!loading && products.length > 0 && (
              <div className="filter-section" style={{marginBottom: '1.5rem'}}>
                <div className="search-filter-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="form-group" style={{margin: 0}}>
                    <input
                      type="text"
                      placeholder={`Search ${isEservicesTab ? 'services' : 'products'}...`}
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      style={{
                        padding: '0.8rem',
                        border: '2px solid var(--color-light)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        width: '100%'
                      }}
                    />
                  </div>
                  <div className="form-group" style={{margin: 0}}>
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      style={{
                        padding: '0.8rem',
                        border: '2px solid var(--color-light)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        width: '100%'
                      }}
                    >
                      <option value="">All {isEservicesTab ? 'Sub-Categories' : 'Categories/Sub-Categories'}</option>
                      {isEservicesTab ? (
                        subCategories.map(sub => (
                          <option key={sub._id} value={sub._id}>{sub.name}</option>
                        ))
                      ) : (
                        categories.filter(cat => cat.type === 'product').map(cat => (
                          <React.Fragment key={cat._id}>
                            <option value={cat._id}>{cat.name}</option>
                            {subCategories.filter(s => s.category?._id === cat._id).map(sub => (
                              <option key={sub._id} value={sub._id}>— {cat.name} › {sub.name}</option>
                            ))}
                          </React.Fragment>
                        ))
                      )}
                    </select>
                  </div>
                </div>
                {(productSearchTerm || productCategoryFilter) && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#666'
                  }}>
                    Showing {getFilteredProducts().length} of {products.length} {isEservicesTab ? 'services' : 'products'}
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <p>{isEservicesTab ? 'Loading e-services...' : 'Loading products...'}</p>
            ) : (
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox" 
                          checked={(() => {
                            const filteredIds = getFilteredProducts().map(p => p._id);
                            return filteredIds.length > 0 && filteredIds.every(id => selectedProducts.includes(id));
                          })()}
                          onChange={toggleSelectAll}
                          title="Select all visible products"
                        />
                      </th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredProducts().map(product => {
                      const imgSrc = normalizeImageUrl(product.image) || logo;
                      const isSelected = selectedProducts.includes(product._id);
                      return (
                      <React.Fragment key={product._id}>
                        <tr className={isSelected ? 'selected-row' : ''}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleProductSelection(product._id)}
                            />
                          </td>
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
                          <td style={{maxWidth: '28ch', whiteSpace: 'normal'}}>{truncate(product.description, 140)}</td>
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
                              className="btn-secondary"
                              onClick={() => handleCopyProduct(product)}
                            >
                              Copy
                            </button>
                              <button
                                className="btn-move"
                                title="Move up"
                                onClick={() => handleMoveProduct(product._id, 'up')}
                              >
                                ▲
                              </button>
                              <button
                                className="btn-move"
                                title="Move down"
                                onClick={() => handleMoveProduct(product._id, 'down')}
                              >
                                ▼
                              </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                        {inlineEditProductId === product._id && (
                          <tr className="inline-edit-row">
                            <td colSpan="7">
                              {renderProductForm(() => setInlineEditProductId(null))}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                {getFilteredProducts().length === 0 && products.length > 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#666',
                    background: '#f7f7f7',
                    borderRadius: '8px',
                    marginTop: '1rem'
                  }}>
                    No {isEservicesTab ? 'services' : 'products'} match your filters. Try adjusting your search or category filter.
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'eservices' || activeTab === 'products') && (
              <div className="tab-content" style={{ marginTop: '2rem' }}>
                <div className="content-header">
                  <h2>{currentTypeLabel} Categories</h2>
                  <div className="header-buttons">
                      <button className="btn-primary" onClick={() => currentType === 'eservice' ? handleAddEserviceCategory() : handleAddCategory()}>
                        + Add Top Category
                      </button>
                      <button className="btn-secondary" onClick={handleOpenBatchEdit} disabled={selectedProducts.length === 0} style={{marginLeft: '8px'}}>
                        Batch Edit Selected
                      </button>
                    </div>
                </div>
                {showCategoryForm && renderCategoryForm(() => setShowCategoryForm(false))}
                <h3 style={{ marginTop: '1rem' }}>Top-Level Categories</h3>
                <div className="categories-grid">
                  {categories.filter(cat => cat.type === currentType).length === 0 ? (
                    <p>No top-level categories yet.</p>
                  ) : (
                    categories.filter(cat => cat.type === currentType).map(category => (
                      <React.Fragment key={category._id}>
                          <div className="category-card">
                            <div className="category-image-wrapper">
                              <img
                                src={normalizeImageUrl(category.image) || logo}
                                alt={category.name}
                                className="table-image"
                                data-fallback-idx="0"
                                onError={(e) => handleTableImageError(e, category.image)}
                              />
                            </div>
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
                        {inlineEditCategoryId === category._id && (
                          <div className="category-card inline-edit-card">
                            {renderCategoryForm(() => setInlineEditCategoryId(null))}
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </div>

                <div className="content-header" style={{ marginTop: '1.5rem' }}>
                  <h2>Sub-Categories</h2>
                  <button className="btn-secondary" onClick={handleAddSubCategory}>
                    + Add Sub-Category
                  </button>
                </div>
                {showSubCategoryForm && renderSubCategoryForm(() => setShowSubCategoryForm(false))}
                <div className="categories-grid">
                  {subCategories.filter(sc => sc.category?.type === currentType).length === 0 ? (
                    <p>No sub-categories yet.</p>
                    ) : (
                    subCategories.filter(sc => sc.category?.type === currentType).map((sub, idx) => (
                      <React.Fragment key={sub._id}>
                        <div className="category-card">
                          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                            <h3 style={{margin: 0}}>{sub.name}</h3>
                            <div className="sub-order-badge admin">{sub.order ?? (idx + 1)}</div>
                          </div>
                          <p>{sub.description}</p>
                          <p className="meta">Parent: {sub.category?.name || '—'}</p>
                          <div className="card-actions">
                            <button
                              className="btn-edit"
                              onClick={() => handleEditSubCategory(sub)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-move"
                              title="Move up"
                              onClick={() => handleMoveSubCategory(sub._id, 'up')}
                            >
                              ▲
                            </button>
                            <button
                              className="btn-move"
                              title="Move down"
                              onClick={() => handleMoveSubCategory(sub._id, 'down')}
                            >
                              ▼
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteSubCategory(sub._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {inlineEditSubCategoryId === sub._id && (
                          <div className="category-card inline-edit-card">
                            {renderSubCategoryForm(() => setInlineEditSubCategoryId(null))}
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </div>
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

            {showCategoryForm && renderCategoryForm(() => setShowCategoryForm(false))}

            <div className="categories-grid">
              {categories.map(category => (
                <React.Fragment key={category._id}>
                  <div className="category-card">
                    <div className="category-image-wrapper">
                      <img
                        src={normalizeImageUrl(category.image) || logo}
                        alt={category.name}
                        className="table-image"
                        data-fallback-idx="0"
                        onError={(e) => handleTableImageError(e, category.image)}
                      />
                    </div>
                    <h3>{category.name}</h3>
                    <p>{category.description}</p>
                    <p className="meta">Type: {category.type === 'eservice' ? 'E-Service' : 'Product'}</p>
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
                  {inlineEditCategoryId === category._id && (
                    <div className="category-card inline-edit-card">
                      {renderCategoryForm(() => setInlineEditCategoryId(null))}
                    </div>
                  )}
                </React.Fragment>
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
                              <td>
                                <div style={{fontWeight: 600}}>{item.productName}</div>
                                {item.productDescription && (
                                  <div style={{fontSize: '12px', color: '#555', marginTop: '6px'}}>{item.productDescription}</div>
                                )}
                                {item.categoryName && (
                                  <div style={{fontSize: '12px', color: '#555', marginTop: '6px'}}><strong>Category:</strong> {item.categoryName}</div>
                                )}
                                {item.subCategoryName && (
                                  <div style={{fontSize: '12px', color: '#555'}}><strong>Sub-Category:</strong> {item.subCategoryName}</div>
                                )}
                                {item.subCategoryDescription && (
                                  <div style={{fontSize: '12px', color: '#555', marginTop: '4px'}}>{item.subCategoryDescription}</div>
                                )}
                              </td>
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

        {/* Settings Section */}
        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Settings</h2>
            </div>
            <form className="form-card" onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label>Store Currency</label>
                <select
                  value={settingsCurrency}
                  onChange={(e) => setSettingsCurrency(e.target.value)}
                  disabled={settingsLoading}
                >
                  <option value="SYP">SYP</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-primary" disabled={settingsLoading}>
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
