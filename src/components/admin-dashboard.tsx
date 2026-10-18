'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import type { Product } from '@/lib/products';
import { discountedPrice } from '@/lib/products';
import { formatMoney } from '@/lib/currency';

type Tab = 'overview' | 'products' | 'inventory' | 'categories' | 'orders' | 'customers' | 'settings';
type VariantDraft = { size: string; colorName: string; colorHex: string; sku: string; stock: number };
type ProductDraft = {
  name: string;
  description: string;
  sku: string;
  category: string;
  subcategory: string;
  price: string;
  mrp: string;
  stock: string;
  image: string;
  images: string[];
  brand: string;
  material: string;
  gender: string;
  tags: string;
  featured: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  variants: VariantDraft[];
};
type Category = { id: string; name: string; slug: string; isActive?: boolean };
type Order = { orderId: string; email: string; status: string; paymentMethod: string; paymentStatus: string; total: number; itemCount: number; timestamp: string };
type Customer = { id: string; name: string | null; email: string; phone: string | null; createdAt: string; _count: { orders: number } };

const NAVIGATION: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'categories', label: 'Categories' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
  { id: 'settings', label: 'Store settings' },
];

const EMPTY_DRAFT: ProductDraft = {
  name: '', description: '', sku: '', category: '', subcategory: '', price: '', mrp: '', stock: '0',
  image: '/image/shirt.jpg', images: [], brand: '', material: '', gender: '', tags: '', featured: false, status: 'DRAFT', variants: [],
};

const MAX_IMAGE_UPLOAD_SIZE = 4 * 1024 * 1024;
const MAX_SOURCE_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp']);

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const result = await response.json().catch(() => null) as { success?: boolean; message?: string; data?: T } | null;
  if (!response.ok || !result?.success) throw new Error(result?.message || 'The request could not be completed.');
  return result.data as T;
}

async function prepareProductImage(file: File): Promise<File> {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP, GIF, AVIF, or BMP image.');
  }
  if (file.size < 1 || file.size > MAX_SOURCE_IMAGE_SIZE) {
    throw new Error('Each selected image must be smaller than 20 MB.');
  }
  if (file.type === 'image/gif') {
    if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
      throw new Error('Animated GIFs must be 4 MB or smaller so their animation is preserved.');
    }
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`The image "${file.name}" could not be read. Try saving it as JPG, PNG, or WebP.`);
  }

  try {
    if (bitmap.width * bitmap.height > 60_000_000) {
      throw new Error('This image has too many pixels to process. Resize it and try again.');
    }
    let scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Your browser could not prepare this image.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const quality = Math.max(0.55, 0.86 - attempt * 0.07);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
      if (!blob) throw new Error('Your browser could not convert this image.');
      if (!['image/webp', 'image/png', 'image/jpeg'].includes(blob.type)) {
        throw new Error('Your browser does not support the required image format. Try JPG or PNG.');
      }
      if (blob.size <= MAX_IMAGE_UPLOAD_SIZE) {
        const extension = blob.type === 'image/jpeg' ? 'jpg' : blob.type.split('/')[1];
        const name = `${file.name.replace(/\.[^.]+$/, '') || 'product-image'}.${extension}`;
        return new File([blob], name, { type: blob.type, lastModified: Date.now() });
      }
      scale *= 0.8;
    }
    throw new Error(`The image "${file.name}" could not be reduced below 4 MB.`);
  } finally {
    bitmap.close();
  }
}

function toDraft(product: Product): ProductDraft {
  return {
    name: product.name,
    description: product.description,
    sku: product.sku,
    category: product.category,
    subcategory: product.subcategory ?? '',
    price: String(discountedPrice(product)),
    mrp: String(product.mrp ?? (product.discount ? product.price : '')),
    stock: String(product.stock),
    image: product.image,
    images: product.images?.length ? product.images.map(({ url }) => url) : [product.image],
    brand: product.brand ?? '',
    material: product.material ?? '',
    gender: product.gender ?? '',
    tags: product.tags?.join(', ') ?? '',
    featured: product.featured ?? false,
    status: product.status ?? 'ACTIVE',
    variants: (product.variants ?? []).map((variant) => ({
      size: variant.size ?? '',
      colorName: variant.colorName ?? '',
      colorHex: variant.colorHex ?? '',
      sku: variant.sku ?? '',
      stock: variant.stock,
    })),
  };
}

export function AdminDashboard({ signOut }: { signOut: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState({ products: 0, variants: 0, lowStock: 0, outOfStock: 0, orders: 0, customers: 0 });
  const [settings, setSettings] = useState({ store_name: '', store_description: '', support_email: '', low_stock_threshold: '5' });
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState('date');
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [categoryName, setCategoryName] = useState('');

  const loadOverview = useCallback(async () => {
    const [statistics, productRows, categoryRows, orderRows] = await Promise.all([
      api<typeof summary>('/api/admin/summary'),
      api<Product[]>('/api/products?manage=true&pageSize=100&sort=date'),
      api<Category[]>('/api/categories?manage=true'),
      api<Order[]>('/api/orders'),
    ]);
    setSummary(statistics);
    setProducts(productRows);
    setCategories(categoryRows);
    setOrders(orderRows);
  }, []);

  useEffect(() => {
    loadOverview().catch((error: unknown) => setLoadError(error instanceof Error ? error.message : 'Dashboard data could not be loaded.')).finally(() => setLoading(false));
  }, [loadOverview]);

  const refreshProducts = useCallback(async () => {
    const params = new URLSearchParams({ manage: 'true', pageSize: '100', sort, search });
    if (availability) params.set('availability', availability);
    if (categoryFilter) params.set('category', categoryFilter);
    setProducts(await api<Product[]>(`/api/products?${params}`));
  }, [availability, categoryFilter, search, sort]);

  useEffect(() => {
    if (tab === 'products' || tab === 'inventory') refreshProducts().catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Products could not be loaded.'));
  }, [refreshProducts, tab]);

  useEffect(() => {
    if (tab === 'customers') api<Customer[]>('/api/admin/customers').then(setCustomers).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Customers could not be loaded.'));
    if (tab === 'settings') api<Record<string, string>>('/api/admin/settings').then((data) => setSettings((current) => ({ ...current, ...data }))).catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Settings could not be loaded.'));
  }, [tab]);

  const lowStockProducts = useMemo(() => products.filter((product) => product.stock <= Number(settings.low_stock_threshold || 5)), [products, settings.low_stock_threshold]);

  function beginCreate() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setFormOpen(true);
    setTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function beginEdit(product: Product) {
    setEditing(product);
    setDraft(toDraft(product));
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const payload = {
      ...draft,
      price: Number(draft.price),
      mrp: draft.mrp ? Number(draft.mrp) : null,
      stock: Number(draft.stock),
      tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      variants: draft.variants.map((variant) => ({ ...variant, stock: Number(variant.stock) })),
    };
    try {
      await api(editing ? `/api/products/${editing.id}` : '/api/products', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast.success(editing ? 'Product updated.' : 'Product created.');
      setEditing(null);
      setDraft(EMPTY_DRAFT);
      setFormOpen(false);
      await Promise.all([refreshProducts(), loadOverview()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Product could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (uploadProgress !== null) return;
    if (selected.length > 8 - draft.images.length) {
      toast.error('A product can have up to 8 images.');
      return;
    }
    setUploadProgress(0);
    try {
      for (const file of selected) {
        const preparedFile = await prepareProductImage(file);
        const formData = new FormData();
        formData.append('file', preparedFile);
        const imageUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/admin/uploads');
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) setUploadProgress(Math.round(event.loaded / event.total * 100));
          };
          xhr.onload = () => {
            let result: { success?: boolean; message?: string; data?: { url: string } };
            try {
              result = JSON.parse(xhr.responseText) as typeof result;
            } catch {
              reject(new Error('Image upload returned an invalid response.'));
              return;
            }
            if (xhr.status < 200 || xhr.status >= 300 || !result.success || !result.data?.url) {
              reject(new Error(result.message || 'Image upload failed.'));
              return;
            }
            resolve(result.data.url);
          };
          xhr.onerror = () => reject(new Error('Image upload failed. Check your connection and try again.'));
          xhr.send(formData);
        });
        setDraft((current) => ({
          ...current,
          images: [...current.images, imageUrl],
          image: current.images.length ? current.image : imageUrl,
        }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setUploadProgress(null);
    }
  }

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
    try {
      await api(`/api/products/${product.id}`, { method: 'DELETE' });
      toast.success('Product deleted.');
      await Promise.all([refreshProducts(), loadOverview()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Product could not be deleted.');
    }
  }

  async function changeOrderStatus(orderId: string, status: string) {
    try {
      await api(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      toast.success(`Order ${orderId} updated.`);
      const rows = await api<Order[]>('/api/orders');
      setOrders(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Order status could not be updated.');
    }
  }

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: categoryName }) });
      setCategoryName('');
      setCategories(await api<Category[]>('/api/categories?manage=true'));
      toast.success('Category created.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Category could not be created.');
    }
  }

  async function toggleCategory(category: Category) {
    try {
      await api(`/api/categories/${category.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !category.isActive }) });
      setCategories(await api<Category[]>('/api/categories?manage=true'));
      toast.success(category.isActive ? 'Category unpublished.' : 'Category published.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Category could not be updated.');
    }
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      toast.success('Store settings saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Store settings could not be saved.');
    }
  }

  function addVariant() {
    setDraft((current) => ({ ...current, variants: [...current.variants, { size: '', colorName: '', colorHex: '#333333', sku: '', stock: 0 }] }));
  }

  return (
    <section className="admin-page admin-dashboard">
      <div className="admin-heading"><div><span className="eyebrow">Restricted area</span><h1>Store administration</h1></div><form action={signOut}><button className="button button-outline" type="submit">Sign out</button></form></div>
      {loadError && <p className="admin-warning" role="alert">{loadError}</p>}
      <nav className="admin-tabs" aria-label="Admin sections">{NAVIGATION.map((item) => <button className={tab === item.id ? 'active' : ''} type="button" key={item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>
      {loading ? <p className="admin-empty">Loading store data…</p> : <>
        {tab === 'overview' && <section><div className="admin-summary admin-metrics">{[
          ['Products', summary.products], ['Variants', summary.variants], ['Low stock', summary.lowStock], ['Out of stock', summary.outOfStock], ['Orders', summary.orders], ['Customers', summary.customers],
        ].map(([label, count]) => <article key={label}><span>{label}</span><strong>{count}</strong></article>)}</div><div className="admin-section-heading"><h2>Recent orders</h2><button className="text-link" type="button" onClick={() => setTab('orders')}>View orders</button></div><OrderList orders={orders.slice(0, 6)} onChangeStatus={changeOrderStatus} /><div className="admin-quick-action"><h2>Ready to update your catalogue?</h2><p>Add a new product with sizes, colours, stock and images.</p><button className="button button-dark" type="button" onClick={beginCreate}>Add product</button></div></section>}
        {tab === 'products' && <section>
          <div className="admin-section-heading"><div><h2>Products</h2><span>{products.length} matching product(s)</span></div><button className="button button-dark" type="button" onClick={beginCreate}>Add product</button></div>
          {formOpen && <ProductForm draft={draft} setDraft={setDraft} editing={editing} busy={busy} progress={uploadProgress} categories={categories} onSubmit={saveProduct} onUpload={uploadImages} onAddVariant={addVariant} onCancel={() => { setEditing(null); setDraft(EMPTY_DRAFT); setFormOpen(false); }} />}
          <div className="admin-filters"><label>Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Product name or SKU" /></label><label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label><label>Availability<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="">All stock</option><option value="in-stock">In stock</option><option value="out-of-stock">Out of stock</option></select></label><label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="date">Newest</option><option value="name">Name</option><option value="price">Price</option><option value="stock">Stock</option></select></label></div>
          <ProductList products={products} lowStockThreshold={Number(settings.low_stock_threshold || 5)} onEdit={beginEdit} onDelete={deleteProduct} />
        </section>}
        {tab === 'inventory' && <section><div className="admin-section-heading"><div><h2>Inventory</h2><span>{lowStockProducts.length} product(s) at or below the configured warning threshold</span></div></div><div className="inventory-list">{products.map((product) => <article key={product.id}><Image src={product.image} alt="" width={58} height={58} /><div><strong>{product.name}</strong><small>{product.variants?.length ? `${product.variants.length} variants · ${product.stock} total units` : `${product.sku} · ${product.stock} units`}</small>{product.variants?.map((variant) => <small key={variant.id}>{[variant.size, variant.colorName].filter(Boolean).join(' / ')} — {variant.stock} in stock{variant.sku ? ` · ${variant.sku}` : ''}</small>)}</div><span className={product.stock === 0 ? 'inventory-out' : product.stock <= Number(settings.low_stock_threshold || 5) ? 'inventory-low' : 'inventory-good'}>{product.stock === 0 ? 'Out of stock' : product.stock <= Number(settings.low_stock_threshold || 5) ? 'Low stock' : 'In stock'}</span><button className="button button-outline" type="button" onClick={() => { setTab('products'); beginEdit(product); }}>Edit stock</button></article>)}</div></section>}
        {tab === 'categories' && <section><div className="admin-section-heading"><div><h2>Categories</h2><span>Categories used by products are created automatically.</span></div></div><form className="admin-inline-form" onSubmit={createCategory}><label>New category<input required maxLength={80} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. New arrivals" /></label><button className="button button-dark" type="submit">Create category</button></form><div className="admin-category-list">{categories.map((category) => <article key={category.id}><span><strong>{category.name}</strong><small>/{category.slug}</small></span><button className="button button-outline" type="button" onClick={() => toggleCategory(category)}>{category.isActive === false ? 'Publish' : 'Unpublish'}</button></article>)}</div></section>}
        {tab === 'orders' && <section><div className="admin-section-heading"><div><h2>Orders</h2><span>Latest 100 orders</span></div></div><OrderList orders={orders} onChangeStatus={changeOrderStatus} /></section>}
        {tab === 'customers' && <section><div className="admin-section-heading"><div><h2>Customers</h2><span>Latest 100 accounts</span></div></div><div className="admin-customer-list">{customers.map((customer) => <article key={customer.id}><div><strong>{customer.name || 'Customer'}</strong><span>{customer.email}</span></div><div>{customer.phone || 'No phone'}<small>{customer._count.orders} order(s)</small></div><time>{new Date(customer.createdAt).toLocaleDateString()}</time></article>)}</div></section>}
        {tab === 'settings' && <section><div className="admin-section-heading"><div><h2>Store settings</h2><span>Contact and inventory display preferences</span></div></div><form className="admin-settings-form" onSubmit={saveSettings}><label>Store name<input maxLength={120} value={settings.store_name} onChange={(event) => setSettings({ ...settings, store_name: event.target.value })} /></label><label>Store description<textarea rows={4} maxLength={500} value={settings.store_description} onChange={(event) => setSettings({ ...settings, store_description: event.target.value })} /></label><label>Support email<input type="email" value={settings.support_email} onChange={(event) => setSettings({ ...settings, support_email: event.target.value })} /></label><label>Low-stock warning threshold<input type="number" min="0" max="100000" value={settings.low_stock_threshold} onChange={(event) => setSettings({ ...settings, low_stock_threshold: event.target.value })} /></label><button className="button button-dark" type="submit">Save settings</button></form></section>}
      </>}
    </section>
  );
}

function ProductList({ products, lowStockThreshold, onEdit, onDelete }: { products: Product[]; lowStockThreshold: number; onEdit: (product: Product) => void; onDelete: (product: Product) => void }) {
  if (!products.length) return <p className="admin-empty">No products match these filters. Add your first product to get started.</p>;
  return <div className="admin-product-list">{products.map((product) => <article key={product.id}><Image src={product.image} alt="" width={74} height={74} /><div className="admin-product-main"><strong>{product.name}</strong><small>{product.sku} · {product.category}</small><span>{formatMoney(discountedPrice(product))}{product.discount ? ` · ${Math.round(product.discount)}% off` : ''}</span></div><span className={`product-status status-${product.status?.toLowerCase() ?? 'active'}`}>{product.status ?? 'ACTIVE'}</span><span className={product.stock === 0 ? 'inventory-out' : product.stock <= lowStockThreshold ? 'inventory-low' : 'inventory-good'}>{product.stock} in stock</span><div className="admin-row-actions"><button className="button button-outline" type="button" onClick={() => onEdit(product)}>Edit</button><button className="button button-danger" type="button" onClick={() => onDelete(product)}>Delete</button></div></article>)}</div>;
}

function ProductForm({ draft, setDraft, editing, busy, progress, categories, onSubmit, onUpload, onAddVariant, onCancel }: {
  draft: ProductDraft;
  setDraft: React.Dispatch<React.SetStateAction<ProductDraft>>;
  editing: Product | null;
  busy: boolean;
  progress: number | null;
  categories: Category[];
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpload: (files: FileList | null) => void;
  onAddVariant: () => void;
  onCancel: () => void;
}) {
  const update = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  return <form className="admin-product-form" onSubmit={onSubmit}>
    <div className="admin-section-heading"><div><h2>{editing ? `Edit ${editing.name}` : 'Add a product'}</h2><span>Product information and publication controls</span></div>{editing && <button className="button button-outline" type="button" onClick={onCancel}>Cancel edit</button>}</div>
    <div className="admin-form-grid">
      <label>Product name *<input required maxLength={120} value={draft.name} onChange={(event) => update('name', event.target.value)} /></label>
      <label>SKU *<input required maxLength={80} value={draft.sku} onChange={(event) => update('sku', event.target.value.toUpperCase())} /></label>
      <label className="admin-span">Description *<textarea required rows={5} maxLength={4000} value={draft.description} onChange={(event) => update('description', event.target.value)} /></label>
      <label>Category *<input required list="product-categories" maxLength={80} value={draft.category} onChange={(event) => update('category', event.target.value.toLowerCase())} /><datalist id="product-categories">{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</datalist></label>
      <label>Subcategory<input maxLength={80} value={draft.subcategory} onChange={(event) => update('subcategory', event.target.value)} /></label>
      <label>Selling price *<input required type="number" min="0.01" max="10000000" step="0.01" value={draft.price} onChange={(event) => update('price', event.target.value)} /></label>
      <label>Original price / MRP<input type="number" min="0.01" max="10000000" step="0.01" value={draft.mrp} onChange={(event) => update('mrp', event.target.value)} /><small>Discount is calculated from the MRP and selling price.</small></label>
      <label>Stock (used when no variants)<input type="number" min="0" max="1000000" step="1" value={draft.stock} onChange={(event) => update('stock', event.target.value)} /></label>
      <label>Brand<input maxLength={80} value={draft.brand} onChange={(event) => update('brand', event.target.value)} /></label>
      <label>Material / fabric<input maxLength={120} value={draft.material} onChange={(event) => update('material', event.target.value)} /></label>
      <label>Gender / target audience<input maxLength={40} value={draft.gender} onChange={(event) => update('gender', event.target.value)} /></label>
      <label>Tags (comma separated)<input maxLength={500} value={draft.tags} onChange={(event) => update('tags', event.target.value)} /></label>
      <label>Publication status<select value={draft.status} onChange={(event) => update('status', event.target.value as ProductDraft['status'])}><option value="DRAFT">Draft / unpublished</option><option value="ACTIVE">Active / published</option><option value="ARCHIVED">Archived</option></select></label>
      <label className="admin-checkbox"><input type="checkbox" checked={draft.featured} onChange={(event) => update('featured', event.target.checked)} /> Feature this product</label>
    </div>
    <fieldset className="admin-image-field"><legend>Product images (optional, up to 8)</legend><p>JPG, PNG, WebP, AVIF, and BMP images are automatically resized and compressed. Animated GIFs are preserved (up to 4 MB). Images are stored in the product database; no separate image-storage token is required.</p><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp" multiple disabled={progress !== null} onChange={(event) => { onUpload(event.target.files); event.currentTarget.value = ''; }} />{progress !== null && <><small>Preparing or uploading image…</small><progress value={progress} max="100">{progress}%</progress></>}<div className="admin-image-list">{draft.images.map((url) => <article key={url}><Image src={url} alt="Product image preview" width={90} height={90} /><label><input type="radio" name="primary-image" checked={draft.image === url} onChange={() => update('image', url)} /> Main image</label><button className="button button-danger" type="button" onClick={() => { const next = draft.images.filter((item) => item !== url); update('images', next); if (draft.image === url) update('image', next[0] ?? '/image/shirt.jpg'); }}>Remove</button></article>)}</div></fieldset>
    <fieldset className="admin-variant-field"><legend>Size and colour inventory</legend><p>Add one row for each sellable size/colour combination. Variant stock replaces the product-level stock quantity.</p>{draft.variants.map((variant, index) => <div className="admin-variant-row" key={`${index}-${variant.sku}`}><label>Size<input list="standard-sizes" value={variant.size} onChange={(event) => update('variants', draft.variants.map((item, row) => row === index ? { ...item, size: event.target.value } : item))} /><datalist id="standard-sizes">{['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => <option value={size} key={size} />)}</datalist></label><label>Color name<input value={variant.colorName} onChange={(event) => update('variants', draft.variants.map((item, row) => row === index ? { ...item, colorName: event.target.value } : item))} /></label><label>Swatch<input type="color" value={variant.colorHex || '#333333'} onChange={(event) => update('variants', draft.variants.map((item, row) => row === index ? { ...item, colorHex: event.target.value } : item))} /></label><label>Variant SKU<input value={variant.sku} onChange={(event) => update('variants', draft.variants.map((item, row) => row === index ? { ...item, sku: event.target.value.toUpperCase() } : item))} /></label><label>Stock<input type="number" min="0" max="1000000" step="1" value={variant.stock} onChange={(event) => update('variants', draft.variants.map((item, row) => row === index ? { ...item, stock: Number(event.target.value) } : item))} /></label><button className="button button-danger" type="button" onClick={() => update('variants', draft.variants.filter((_, row) => row !== index))}>Remove</button></div>)}<button className="button button-outline" type="button" onClick={onAddVariant}>Add size / colour</button></fieldset>
    <div className="admin-form-actions"><button className="button button-dark" type="submit" disabled={busy || progress !== null}>{busy ? 'Saving…' : editing ? 'Save product' : 'Create product'}</button><button className="button button-outline" type="button" onClick={onCancel} disabled={busy || progress !== null}>Clear form</button></div>
  </form>;
}

function OrderList({ orders, onChangeStatus }: { orders: Order[]; onChangeStatus: (id: string, status: string) => void }) {
  if (!orders.length) return <p className="admin-empty">No orders yet.</p>;
  const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
  return <div className="admin-order-list">{orders.map((order) => <article className="admin-order" key={order.orderId}><div><strong>{order.orderId}</strong><span>{new Date(order.timestamp).toLocaleString()}</span></div><div><strong>{order.email}</strong><span>{order.itemCount} item(s) · {order.paymentMethod}</span></div><div><strong>{formatMoney(order.total)}</strong><span>{order.paymentStatus}</span></div><label className="admin-order-status">Status<select value={order.status} onChange={(event) => onChangeStatus(order.orderId, event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label></article>)}</div>;
}
