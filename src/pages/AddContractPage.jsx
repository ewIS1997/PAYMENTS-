import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { IconWarning, IconCheck, IconSearch, IconCube } from '../components/Icons';
import { getCustomer } from '../services/customerService';
import { addContractWithInstallments } from '../services/contractService';
import { getAllProducts, getUniqueCategories } from '../services/productService';
import { formatCurrency } from '../utils/currencyUtils';
import { getArabicMonthName } from '../utils/dateUtils';

export default function AddContractPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const productPickerRef = useRef(null);
  const [formData, setFormData] = useState({
    product_name: '',
    total_amount: '',
    monthly_amount: '',
    months_count: '',
    start_date: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [cust, prods, cats] = await Promise.all([
          getCustomer(id),
          getAllProducts(),
          getUniqueCategories(),
        ]);
        if (!cust) {
          navigate('/customers');
          return;
        }
        setCustomer(cust);
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, navigate]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (productPickerRef.current && !productPickerRef.current.contains(event.target)) {
        setShowProductPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (product) => {
    setFormData(prev => ({
      ...prev,
      product_name: product.name,
      total_amount: product.default_price?.toString() || prev.total_amount,
    }));
    setProductSearch('');
    setShowProductPicker(false);
    if (errors.product_name) setErrors(prev => ({ ...prev, product_name: '' }));
    if (errors.total_amount) setErrors(prev => ({ ...prev, total_amount: '' }));
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const calculatedEndDate = (() => {
    if (formData.start_date && formData.months_count) {
      const start = new Date(formData.start_date);
      const months = parseInt(formData.months_count);
      return new Date(start.getFullYear(), start.getMonth() + months - 1, 1);
    }
    return null;
  })();

  const totalFromMonthly = (() => {
    if (formData.monthly_amount && formData.months_count) {
      return parseFloat(formData.monthly_amount) * parseInt(formData.months_count);
    }
    return null;
  })();

  const remainder = (() => {
    if (formData.total_amount && totalFromMonthly !== null) {
      return parseFloat(formData.total_amount) - totalFromMonthly;
    }
    return null;
  })();

  const validate = () => {
    const newErrors = {};
    if (!formData.product_name.trim()) newErrors.product_name = 'اسم المنتج مطلوب';
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) newErrors.total_amount = 'الإجمالي مطلوب ويجب أن يكون أكبر من صفر';
    if (!formData.monthly_amount || parseFloat(formData.monthly_amount) <= 0) newErrors.monthly_amount = 'القسط الشهري مطلوب ويجب أن يكون أكبر من صفر';
    if (!formData.months_count || parseInt(formData.months_count) <= 0) newErrors.months_count = 'عدد الأشهر مطلوب ويجب أن يكون أكبر من صفر';
    if (!formData.start_date) newErrors.start_date = 'تاريخ البداية مطلوب';
    
    const total = parseFloat(formData.total_amount);
    const monthly = parseFloat(formData.monthly_amount);
    const months = parseInt(formData.months_count);
    if (total && monthly && months) {
      const expected = monthly * months;
      if (Math.abs(expected - total) > total * 0.1) {
        newErrors.monthly_amount = `الإجمالي لا يتوافق مع (${months} شهر × ${monthly}) = ${expected}. ملاحظة: القسط الأخير قد يختلف.`;
      }
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const contract = await addContractWithInstallments(formData, customer);
      navigate(`/customers/${id}/contract/${contract.id}`);
    } catch (err) {
      console.error('Error adding contract:', err);
      setErrors({ general: 'حدث خطأ أثناء إنشاء العقد' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-5">
          <div className="bg-gray-200 rounded h-8 w-48"></div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded h-14"></div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate(-1)}
        className="text-lg text-blue-600 mb-4 hover:underline"
      >
        → رجوع
      </button>

      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">إضافة عقد جديد</h1>
      <p className="text-xl text-gray-500 dark:text-gray-400 mb-6">للعميل: {customer?.full_name}</p>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-lg mb-4">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        {/* Product Picker */}
        <div ref={productPickerRef} className="relative">
          <div className="flex items-center justify-between mb-2">
            <label className="text-lg font-medium text-gray-700 dark:text-gray-300">
              اسم المنتج <span className="text-red-500">*</span>
            </label>
            {products.length > 0 && (
              <button
                type="button"
                onClick={() => setShowProductPicker(!showProductPicker)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <IconCube className="w-4 h-4" />
                اختر من قاعدة البيانات
              </button>
            )}
          </div>
          <input
            type="text"
            value={formData.product_name}
            onChange={(e) => handleChange('product_name', e.target.value)}
            placeholder="اكتب اسم المنتج أو اختر من القائمة"
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.product_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.product_name && (
            <p className="text-red-500 text-base mt-1">{errors.product_name}</p>
          )}

          {showProductPicker && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-72 overflow-hidden">
              <div className="p-3 border-b border-gray-100 space-y-2">
                <div className="relative">
                  <IconSearch className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="ابحث عن منتج..."
                    className="w-full pr-9 pl-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                </div>
                {categories.length > 1 && (
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        selectedCategory === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      الكل
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="overflow-y-auto max-h-48">
                {filteredProducts.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-4">لا توجد منتجات مطابقة</p>
                ) : (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className="w-full px-4 py-2.5 text-right hover:bg-blue-50 transition-colors flex items-center justify-between border-b border-gray-50 last:border-b-0"
                    >
                      <div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{product.name}</span>
                        {product.category && (
                          <span className="text-xs text-gray-400 mr-2">({product.category})</span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-blue-600">{formatCurrency(product.default_price)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            الإجمالي (جنيه) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.total_amount}
            onChange={(e) => handleChange('total_amount', e.target.value)}
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.total_amount ? 'border-red-500' : 'border-gray-300'
            }`}
            dir="ltr"
            min="0"
          />
          {errors.total_amount && (
            <p className="text-red-500 text-base mt-1">{errors.total_amount}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            القسط الشهري (جنيه) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.monthly_amount}
            onChange={(e) => handleChange('monthly_amount', e.target.value)}
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.monthly_amount ? 'border-red-500' : 'border-gray-300'
            }`}
            dir="ltr"
            min="0"
          />
          {errors.monthly_amount && (
            <p className="text-red-500 text-base mt-1">{errors.monthly_amount}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            عدد الأشهر <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.months_count}
            onChange={(e) => handleChange('months_count', e.target.value)}
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.months_count ? 'border-red-500' : 'border-gray-300'
            }`}
            dir="ltr"
            min="1"
          />
          {errors.months_count && (
            <p className="text-red-500 text-base mt-1">{errors.months_count}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            تاريخ البداية <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.start_date ? 'border-red-500' : 'border-gray-300'
            }`}
            dir="ltr"
          />
          {errors.start_date && (
            <p className="text-red-500 text-base mt-1">{errors.start_date}</p>
          )}
        </div>

        {(formData.start_date || formData.monthly_amount || formData.total_amount || formData.months_count) && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">ملخص العقد</h3>
            {calculatedEndDate && (
              <p className="text-base text-gray-600 dark:text-gray-400">
                تاريخ النهاية:{' '}
                <span className="font-medium">
                  {getArabicMonthName(calculatedEndDate.getMonth())} {calculatedEndDate.getFullYear()}
                </span>
              </p>
            )}
            {formData.months_count && (
              <p className="text-base text-gray-600 dark:text-gray-400">
                سيتم إنشاء <span className="font-medium">{formData.months_count}</span> قسط
              </p>
            )}
            {remainder !== null && remainder !== 0 && (
              <p className="text-base text-amber-600 flex items-center gap-1">
                <IconWarning className="w-4 h-4 flex-shrink-0" />
                هناك فرق قدره {formatCurrency(Math.abs(remainder))} سيُضاف للقسط الأخير
              </p>
            )}
            {remainder === 0 && formData.total_amount && (
              <p className="text-base text-green-600 flex items-center gap-1">
                <IconCheck className="w-4 h-4 flex-shrink-0" />
                الأقساط متساوية ومطابقة للإجمالي
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xl font-semibold py-4 rounded-lg transition-colors"
        >
          {submitting ? 'جاري الإنشاء...' : 'إنشاء العقد والأقساط'}
        </button>
      </form>
    </AppShell>
  );
}
