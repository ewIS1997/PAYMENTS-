import { useState, useRef, useEffect } from 'react';
import { addCustomer } from '../services/customerService';
import { IconX, IconCheck } from './Icons';

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  village: '',
  national_id: '',
  address: '',
  notes: '',
  photo: '',
};

export default function AddCustomerModal({ isOpen, onClose, villages, existingPhones, onCreated }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState('');
  const wrapperRef = useRef(null);
  const nameRef = useRef(null);
  const showSuggestionsRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (nameRef.current) {
        setTimeout(() => nameRef.current.focus(), 150);
      }
    } else {
      document.body.style.overflow = '';
      setFormData(EMPTY_FORM);
      setErrors({});
      setPhoneWarning('');
      setShowSuggestions(false);
      showSuggestionsRef.current = false;
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    showSuggestionsRef.current = showSuggestions;
  }, [showSuggestions]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (showSuggestionsRef.current) {
          setShowSuggestions(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVillages = villages.filter(v =>
    v.toLowerCase().includes(formData.village.toLowerCase()) &&
    v !== formData.village
  );

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'phone' && existingPhones) {
      const match = existingPhones[value.trim()];
      setPhoneWarning(match ? `هذا الرقم مسجل باسم: ${match}` : '');
    }
  };

  const handleVillageSelect = (village) => {
    setFormData(prev => ({ ...prev, village }));
    setShowSuggestions(false);
    if (errors.village) {
      setErrors(prev => ({ ...prev, village: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'الاسم مطلوب';
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^01[0-9]{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'يجب أن يبدأ بـ 01 ويتكون من 11 رقم';
    }
    if (!formData.village.trim()) newErrors.village = 'المدينة مطلوبة';
    if (formData.national_id.trim() && !/^\d{14}$/.test(formData.national_id.trim())) {
      newErrors.national_id = 'يجب أن يتكون من 14 رقم';
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
      const customer = await addCustomer({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        village: formData.village.trim(),
        national_id: formData.national_id.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim(),
        photo: formData.photo,
      });
      onCreated(customer);
      onClose();
    } catch (err) {
      console.error('Error adding customer:', err);
      setErrors({ general: 'حدث خطأ أثناء حفظ البيانات' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputBase = 'w-full px-3 py-2.5 text-base font-semibold border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-colors bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600';
  const inputError = 'border-red-400 bg-red-50 dark:bg-red-900/30 focus:bg-white dark:focus:bg-gray-600';
  const inputNormal = 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500';
  const labelClass = 'block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        ref={wrapperRef}
        className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">إضافة عميل جديد</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-xl text-sm font-bold">
              {errors.general}
            </div>
          )}

          {phoneWarning && !errors.phone && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 px-3 py-2 rounded-xl text-sm font-bold">
              {phoneWarning}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            {/* Photo */}
            <div className="md:col-span-2 flex justify-center">
              {formData.photo ? (
                <div className="relative">
                  <img 
                    src={formData.photo} 
                    alt="صورة العميل" 
                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                  <span className="text-2xl text-gray-400 pointer-events-none">+</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, photo: reader.result }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {/* Name */}
            <div>
              <label className={labelClass}>الاسم الكامل <span className="text-red-500">*</span></label>
              <input
                ref={nameRef}
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="أحمد محمد علي"
                className={`${inputBase} ${errors.full_name ? inputError : inputNormal}`}
              />
              {errors.full_name && <p className="text-red-500 text-xs font-bold mt-0.5">{errors.full_name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>رقم الهاتف <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="01012345678"
                className={`${inputBase} ${errors.phone ? inputError : inputNormal}`}
                dir="ltr"
                maxLength={11}
              />
              {errors.phone && <p className="text-red-500 text-xs font-bold mt-0.5">{errors.phone}</p>}
            </div>

            {/* Village */}
            <div>
              <label className={labelClass}>المدينة <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.village}
                onChange={(e) => {
                  handleChange('village', e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="ابدأ الكتابة..."
                className={`${inputBase} ${errors.village ? inputError : inputNormal}`}
              />
              {showSuggestions && filteredVillages.length > 0 && (
                <div className="mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-28 overflow-y-auto">
                  {filteredVillages.slice(0, 6).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleVillageSelect(v)}
                      className="w-full px-3 py-2 text-right text-sm font-semibold hover:bg-blue-50 dark:hover:bg-gray-600 dark:text-gray-200 transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
              {errors.village && <p className="text-red-500 text-xs font-bold mt-0.5">{errors.village}</p>}
            </div>

            {/* National ID */}
            <div>
              <label className={labelClass}>الرقم القومي</label>
              <input
                type="text"
                value={formData.national_id}
                onChange={(e) => handleChange('national_id', e.target.value)}
                placeholder="14 رقم (اختياري)"
                className={`${inputBase} ${errors.national_id ? inputError : inputNormal}`}
                dir="ltr"
                maxLength={14}
              />
              {errors.national_id && <p className="text-red-500 text-xs font-bold mt-0.5">{errors.national_id}</p>}
            </div>

            {/* Address */}
            <div>
              <label className={labelClass}>العنوان</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="اختياري"
                className={`${inputBase} ${inputNormal}`}
              />
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
                placeholder="اختياري"
                className={`${inputBase} ${inputNormal} resize-none`}
              />
            </div>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="submit"
            form="add-customer-form"
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
            className="px-5 py-2.5 text-base font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 transition-colors min-h-[44px]"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
