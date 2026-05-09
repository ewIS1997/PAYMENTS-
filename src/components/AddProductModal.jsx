import { useState, useRef, useEffect } from 'react';
import { addProduct, updateProduct } from '../services/productService';
import { IconX, IconCheck } from './Icons';

const EMPTY_FORM = {
  name: '',
  category: '',
  default_price: '',
};

export default function AddProductModal({ isOpen, onClose, categories, editProduct, onSaved }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (editProduct) {
        setFormData({
          name: editProduct.name || '',
          category: editProduct.category || '',
          default_price: editProduct.default_price?.toString() || '',
        });
      } else {
        setFormData(EMPTY_FORM);
      }
      setErrors({});
      setTimeout(() => nameRef.current?.focus(), 150);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, editProduct]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'اسم المنتج مطلوب';
    if (!formData.category.trim()) newErrors.category = 'الفئة مطلوبة';
    if (!formData.default_price || parseFloat(formData.default_price) <= 0) {
      newErrors.default_price = 'السعر مطلوب ويجب أن يكون أكبر من صفر';
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

    setLoading(true);
    try {
      const data = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        default_price: parseFloat(formData.default_price),
      };

      if (editProduct) {
        await updateProduct(editProduct.id, data);
      } else {
        await addProduct(data);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      setErrors({ general: 'حدث خطأ أثناء حفظ البيانات' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputBase = 'w-full px-3 py-2.5 text-base font-semibold border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-colors bg-gray-50 focus:bg-white';
  const inputError = 'border-red-400 bg-red-50 focus:bg-white';
  const inputNormal = 'border-gray-200 hover:border-gray-300';
  const labelClass = 'block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl z-10 flex flex-col"
        style={{ maxHeight: 'min(85vh, 480px)' }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            {editProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-3.5">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm font-bold">
              {errors.general}
            </div>
          )}

          <div>
            <label className={labelClass}>اسم المنتج <span className="text-red-500">*</span></label>
            <input
              ref={nameRef}
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="مثال: ثلاجة سامسونج 18 قدم"
              className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
            />
            {errors.name && <p className="text-red-500 text-xs font-bold mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <label className={labelClass}>الفئة <span className="text-red-500">*</span></label>
            <input
              list="category-list"
              type="text"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="اختر أو اكتب فئة جديدة"
              className={`${inputBase} ${errors.category ? inputError : inputNormal}`}
            />
            <datalist id="category-list">
              {categories.map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {errors.category && <p className="text-red-500 text-xs font-bold mt-0.5">{errors.category}</p>}
          </div>

          <div>
            <label className={labelClass}>السعر الافتراضي (جنيه) <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={formData.default_price}
              onChange={(e) => handleChange('default_price', e.target.value)}
              placeholder="0"
              className={`${inputBase} ${errors.default_price ? inputError : inputNormal}`}
              dir="ltr"
              min="0"
            />
            {errors.default_price && <p className="text-red-500 text-xs font-bold mt-0.5">{errors.default_price}</p>}
          </div>
        </form>

        <div className="flex gap-2.5 px-5 py-3.5 border-t border-gray-100 flex-shrink-0">
          <button
            type="submit"
            form="add-product-form"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-base font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            {loading ? (
              <span>جاري الحفظ...</span>
            ) : (
              <>
                <IconCheck className="w-5 h-5" />
                حفظ
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-base font-bold border-2 border-gray-200 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors min-h-[44px]"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
