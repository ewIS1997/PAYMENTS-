import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { addCustomer } from '../services/customerService';
import { useCustomers } from '../hooks/useCustomers';

export default function AddCustomerPage() {
  const navigate = useNavigate();
  const { villages } = useCustomers();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    village: '',
    national_id: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

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
    if (!formData.phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب';
    if (!formData.village.trim()) newErrors.village = 'القرية مطلوبة';
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

      <h1 className="text-3xl font-bold text-gray-800 mb-6">إضافة عميل جديد</h1>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-lg mb-4">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
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
          <label className="block text-lg font-medium text-gray-700 mb-2">
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
          />
          {errors.phone && (
            <p className="text-red-500 text-base mt-1">{errors.phone}</p>
          )}
        </div>

        <div ref={wrapperRef}>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            القرية <span className="text-red-500">*</span>
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
            <div className="mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredVillages.slice(0, 10).map(village => (
                <button
                  key={village}
                  type="button"
                  onClick={() => handleVillageSelect(village)}
                  className="w-full px-4 py-3 text-right text-lg hover:bg-gray-100 transition-colors"
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
          <label className="block text-lg font-medium text-gray-700 mb-2">
            الرقم القومي
          </label>
          <input
            type="text"
            value={formData.national_id}
            onChange={(e) => handleChange('national_id', e.target.value)}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
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
          <label className="block text-lg font-medium text-gray-700 mb-2">
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
