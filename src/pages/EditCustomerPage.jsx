import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { getCustomer, updateCustomer, softDeleteCustomer, getUniqueVillages } from '../services/customerService';
import { getContractsByCustomerId } from '../services/contractService';

export default function EditCustomerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [fetchLoading, setFetchLoading] = useState(true);
  const [hasContracts, setHasContracts] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [allVillages, setAllVillages] = useState([]);
  const wrapperRef = useRef(null);

  const filteredVillages = allVillages.filter(v =>
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

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const [customer, villages, contracts] = await Promise.all([
          getCustomer(id),
          getUniqueVillages(),
          getContractsByCustomerId(id),
        ]);
        if (!customer) {
          navigate('/customers');
          return;
        }
        setFormData({
          full_name: customer.full_name || '',
          phone: customer.phone || '',
          village: customer.village || '',
          national_id: customer.national_id || '',
          address: customer.address || '',
          notes: customer.notes || '',
          photo: customer.photo || '',
        });
        setAllVillages(villages);
        setHasContracts(contracts.length > 0);
      } catch (err) {
        console.error('Error fetching customer:', err);
      } finally {
        setFetchLoading(false);
      }
    }
    if (id) fetchCustomer();
  }, [id, navigate]);

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
      await updateCustomer(id, {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        village: formData.village.trim(),
        national_id: formData.national_id.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim(),
        photo: formData.photo,
      });
      navigate(`/customers/${id}`);
    } catch (err) {
      console.error('Error updating customer:', err);
      setErrors({ general: 'حدث خطأ أثناء تحديث البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await softDeleteCustomer(id);
      navigate('/customers');
    } catch (err) {
      console.error('Error deleting customer:', err);
      setErrors({ general: 'حدث خطأ أثناء حذف العميل' });
    } finally {
      setDeleteDialog(false);
    }
  };

  if (fetchLoading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-5">
          <div className="bg-gray-200 rounded h-8 w-48"></div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            {[...Array(4)].map((_, i) => (
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
        onClick={() => navigate(`/customers/${id}`)}
        className="text-lg text-blue-600 mb-4 hover:underline"
      >
        → رجوع
      </button>

      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">تعديل بيانات العميل</h1>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-lg mb-4">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        {/* Photo Upload */}
        <div className="flex justify-center">
          {formData.photo ? (
            <div className="relative">
              <img 
                src={formData.photo} 
                alt="صورة العميل" 
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
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

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            الاسم الكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white ${
              errors.full_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white ${
              errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            dir="ltr"
            maxLength={11}
          />
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
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white ${
              errors.village ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {showSuggestions && filteredVillages.length > 0 && (
            <div className="mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredVillages.slice(0, 10).map(village => (
                <button
                  key={village}
                  type="button"
                  onClick={() => handleVillageSelect(village)}
                  className="w-full px-4 py-3 text-right text-lg hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 transition-colors"
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
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">الرقم القومي</label>
          <input
            type="text"
            value={formData.national_id}
            onChange={(e) => handleChange('national_id', e.target.value)}
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white ${
              errors.national_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            dir="ltr"
            maxLength={14}
          />
          {errors.national_id && (
            <p className="text-red-500 text-base mt-1">{errors.national_id}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">العنوان</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">ملاحظات</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xl font-semibold py-4 rounded-lg transition-colors"
        >
          {loading ? 'جاري التحديث...' : 'تحديث البيانات'}
        </button>

        <div className="border-t border-gray-200 pt-6 mt-6">
          {hasContracts ? (
            <div className="text-center">
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">لا يمكن حذف هذا العميل لأنه لديه عقود</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteDialog(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-xl font-semibold py-4 rounded-lg transition-colors"
            >
              حذف العميل
            </button>
          )}
        </div>
      </form>

      <ConfirmationDialog
        isOpen={deleteDialog}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(false)}
        danger
      />
    </AppShell>
  );
}
