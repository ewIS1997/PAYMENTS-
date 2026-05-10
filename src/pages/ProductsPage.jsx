import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import AddProductModal from '../components/AddProductModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import EmptyState from '../components/EmptyState';
import { IconCube, IconPlus, IconSearch, IconPencil, IconTrash } from '../components/Icons';
import { getAllProducts, softDeleteProduct, getUniqueCategories } from '../services/productService';
import { formatCurrency } from '../utils/currencyUtils';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const [prods, cats] = await Promise.all([getAllProducts(), getUniqueCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      await softDeleteProduct(deleteProduct.id);
      setDeleteProduct(null);
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const grouped = {};
  filtered.forEach(p => {
    const cat = p.category || 'بدون فئة';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/settings')} className="text-lg text-blue-600 hover:underline">→ رجوع</button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">قاعدة بيانات المنتجات</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-20 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} className="text-lg text-blue-600 hover:underline">→ رجوع</button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">قاعدة بيانات المنتجات</h1>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <IconSearch className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full pr-10 pl-4 py-2.5 text-base border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600"
            />
          </div>
          <button
            onClick={() => { setEditProduct(null); setShowAddModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 min-h-[44px] transition-colors"
          >
            <IconPlus className="w-5 h-5" />
            <span className="hidden sm:inline">إضافة منتج</span>
          </button>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                selectedCategory === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              الكل ({products.length})
            </button>
            {categories.map(cat => {
              const count = products.filter(p => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Products List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📄"
          message={searchQuery || selectedCategory ? 'لا توجد منتجات مطابقة للبحث' : 'لا توجد منتجات بعد'}
          actionLabel={!searchQuery && !selectedCategory ? 'إضافة أول منتج' : undefined}
          onAction={!searchQuery && !selectedCategory ? () => { setEditProduct(null); setShowAddModal(true); } : undefined}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <IconCube className="w-5 h-5 text-blue-500" />
                {category}
                <span className="text-sm font-normal text-gray-400">({items.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(product => (
                  <div
                    key={product.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-snug">{product.name}</h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => { setEditProduct(product); setShowAddModal(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="تعديل"
                        >
                          <IconPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteProduct(product)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="حذف"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(product.default_price)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-gray-400 mt-6">
        إجمالي المنتجات: {filtered.length} منتج
      </p>

      <AddProductModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditProduct(null); }}
        categories={categories}
        editProduct={editProduct}
        onSaved={loadProducts}
      />

      <ConfirmationDialog
        isOpen={!!deleteProduct}
        title="حذف المنتج"
        message={`هل أنت متأكد من حذف "${deleteProduct?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteProduct(null)}
        danger
      />
    </AppShell>
  );
}
