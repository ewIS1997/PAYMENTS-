import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { IconCube } from '../components/Icons';
import { getSettings, updateSettings, uploadLogo, resetReceiptSequence } from '../services/settingsService';
import { formatCurrency } from '../utils/currencyUtils';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);

  const [shopName, setShopName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [logoError, setLogoError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        setSettings(data);
        setShopName(data.shop_name || '');
        setShowLogo(data.show_logo !== false);
        setLogoPreview(data.logo_url || '');
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('حدث خطأ أثناء تحميل الإعدادات');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogoError('');
    if (file) {
      if (!file.type.startsWith('image/')) {
        setLogoError('يجب اختيار ملف صورة فقط');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setLogoError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let logoUrl = settings?.logo_url || '';

      if (logoFile) {
        setUploadingLogo(true);
        logoUrl = await uploadLogo(logoFile);
        setUploadingLogo(false);
      }

      await updateSettings({
        shop_name: shopName,
        logo_url: logoUrl,
        show_logo: showLogo,
      });

      setSettings(prev => ({ ...prev, shop_name: shopName, logo_url: logoUrl, show_logo: showLogo }));
      setLogoFile(null);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSequence = async () => {
    setResetting(true);
    try {
      await resetReceiptSequence();
      setSettings(prev => ({ ...prev, last_receipt_number: 0, receipt_year: new Date().getFullYear() }));
    } catch (err) {
      console.error('Error resetting sequence:', err);
      setError('حدث خطأ أثناء إعادة تعيين التسلسل');
    } finally {
      setResetting(false);
      setShowResetDialog(false);
    }
  };

  const handleRetry = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
      setShopName(data.shop_name || '');
      setShowLogo(data.show_logo !== false);
      setLogoPreview(data.logo_url || '');
    } catch (err) {
      console.error('Error retrying:', err);
      setError('حدث خطأ أثناء تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">الإعدادات</h1>
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-7 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-7 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">الإعدادات</h1>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-lg mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={handleRetry} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-base font-semibold min-h-[44px]">
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Section 1: Shop Identity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">هوية المتجر</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">اسم المتجر</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="أدخل اسم المتجر"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">شعار المتجر</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="w-full text-base py-3"
            />
            {logoError && (
              <p className="text-red-500 text-base mt-1">{logoError}</p>
            )}
          </div>

          {logoPreview && (
            <div className="mt-2">
              <p className="text-base text-gray-600 mb-2">معاينة الشعار:</p>
              <img src={logoPreview} alt="شعار المتجر" className="max-h-[120px] rounded-lg border border-gray-200" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-lg font-medium text-gray-700">إظهار الشعار في الإيصالات</span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || uploadingLogo}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xl font-semibold py-3 rounded-lg transition-colors min-h-[44px]"
          >
            {saving ? (uploadingLogo ? 'جاري رفع الشعار...' : 'جاري الحفظ...') : 'حفظ'}
          </button>
        </div>
      </div>

      {/* Section 2: Product Database */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">قاعدة بيانات المنتجات</h2>
        <p className="text-base text-gray-500 mb-4">إدارة المنتجات المتاحة للاختيار السريع عند إنشاء العقود</p>
        <button
          onClick={() => navigate('/products')}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white text-xl font-semibold py-3 rounded-lg transition-colors min-h-[44px] flex items-center justify-center gap-2"
        >
          <IconCube className="w-6 h-6" />
          إدارة المنتجات
        </button>
      </div>

      {/* Section 3: Receipt Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">إعدادات الإيصالات</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-base text-gray-600 mb-1">بادئة الإيصال</label>
              <div className="px-4 py-3 text-xl font-semibold bg-gray-50 border border-gray-200 rounded-lg">
                {settings?.receipt_prefix || 'RCPT'}
              </div>
            </div>
            <div>
              <label className="block text-base text-gray-600 mb-1">آخر رقم إيصال</label>
              <div className="px-4 py-3 text-xl font-semibold bg-gray-50 border border-gray-200 rounded-lg" dir="ltr">
                {settings?.last_receipt_number || 0}
              </div>
            </div>
            <div>
              <label className="block text-base text-gray-600 mb-1">السنة</label>
              <div className="px-4 py-3 text-xl font-semibold bg-gray-50 border border-gray-200 rounded-lg" dir="ltr">
                {settings?.receipt_year || new Date().getFullYear()}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowResetDialog(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-xl font-semibold py-3 rounded-lg transition-colors min-h-[44px]"
          >
            إعادة تعيين تسلسل الأرقام
          </button>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showResetDialog}
        title="إعادة تعيين التسلسل"
        message="هل أنت متأكد من إعادة تعيين تسلسل أرقام الإيصالات؟ سيبدأ العد من 00001 مرة أخرى. يجب القيام بذلك فقط في بداية سنة جديدة."
        onConfirm={handleResetSequence}
        onCancel={() => setShowResetDialog(false)}
      />
    </AppShell>
  );
}
