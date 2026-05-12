import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { addCustomer, findPotentialDuplicates } from '../services/customerService';
import { useCustomers } from '../hooks/useCustomers';

export default function AddCustomerPage() {
  const navigate = useNavigate();
  const { villages, customers: existingCustomers } = useCustomers();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    village: '',
    national_id: '',
    address: '',
    notes: '',
    photo: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState('');
  const wrapperRef = useRef(null);

  const existingPhones = useMemo(() => {
    const map = {};
    existingCustomers.forEach(c => {
      if (c.phone) map[c.phone] = c.full_name;
    });
    return map;
  }, [existingCustomers]);

  const filteredVillages = villages.filter(v =>
    v.toLowerCase().includes(formData.village.toLowerCase()) &&
    v !== formData.village
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      navigate(`/customers/${customer.id}`);
    } catch (err) {
      console.error('Error adding customer:', err);
      setErrors({ general: 'حدث خطأ أثناء حفظ البيانات' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <button
        onClick={() => navigate(-1)}
        className="text-lg text-blue-600 mb-4 hover:underline"
      >
        → رجوع
      </button>

      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">إضافة عميل جديد</h1>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-lg mb-4">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        {/* Photo Upload */}
        <div className="flex flex-col items-center mb-4">
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">صورة العميل</label>
          <div className="relative">
            {formData.photo ? (
              <div className="relative w-24 h-24">
                <img 
                  src={formData.photo} 
                  alt="صورة العميل" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="w-24 h-24 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <span className="text-3xl text-gray-400 pointer-events-none">+</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        alert('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
                        return;
                      }
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
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            الاسم الكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.full_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.full_name && (
            <p className="text-red-500 text-base mt-1">{errors.full_name}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            رقم الهاتف <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            dir="ltr"
            maxLength={11}
          />
          {phoneWarning && !errors.phone && (
            <p className="text-amber-600 text-base mt-1">{phoneWarning}</p>
          )}
          {errors.phone && (
            <p className="text-red-500 text-base mt-1">{errors.phone}</p>
          )}
        </div>

        <div ref={wrapperRef}>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            المدينة <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.village}
            onChange={(e) => {
              handleChange('village', e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.village ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="اكتب اسم القرية..."
          />
          {showSuggestions && filteredVillages.length > 0 && (
            <div className="mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredVillages.slice(0, 10).map(village => (
                <button
                  key={village}
                  type="button"
                  onClick={() => handleVillageSelect(village)}
                  className="w-full px-4 py-3 text-right text-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {village}
                </button>
              ))}
            </div>
          )}
          {errors.village && (
            <p className="text-red-500 text-base mt-1">{errors.village}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            الرقم القومي
          </label>
          <input
            type="text"
            value={formData.national_id}
            onChange={(e) => handleChange('national_id', e.target.value)}
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.national_id ? 'border-red-500' : 'border-gray-300'
            }`}
            dir="ltr"
            maxLength={14}
          />
          {errors.national_id && (
            <p className="text-red-500 text-base mt-1">{errors.national_id}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            العنوان
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            ملاحظات
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xl font-semibold py-4 rounded-lg transition-colors"
        >
          {loading ? 'جاري الحفظ...' : 'حفظ العميل'}
        </button>
      </form>
    </AppShell>
  );
}
