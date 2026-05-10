import { supabase } from './client'
import { isSupabaseConfigured } from './mode'

const SEED_PRODUCTS = [
  { name: 'ثلاجة سامسونج 14 قدم', category: 'أجهزة كهربائية', default_price: 14000 },
  { name: 'غسالة LG أوتوماتيك 7 كيلو', category: 'أجهزة كهربائية', default_price: 9000 },
  { name: 'تكييف سبليت جري 1.5 حصان', category: 'أجهزة كهربائية', default_price: 18000 },
  { name: 'تلفزيون سوني 55 بوصة', category: 'أجهزة كهربائية', default_price: 15000 },
  { name: 'بوتاجاز بوش 5 شعلة', category: 'أجهزة كهربائية', default_price: 7500 },
  { name: 'ميكروويف باناسونيك 25 لتر', category: 'أجهزة كهربائية', default_price: 5000 },
  { name: 'غسالة أطباق بوش 60 سم', category: 'أجهزة كهربائية', default_price: 22000 },
  { name: 'ثلاجة شارب 16 قدم', category: 'أجهزة كهربائية', default_price: 11000 },
  { name: 'تكييف ويندوز هاير 2 حصان', category: 'أجهزة كهربائية', default_price: 10000 },
  { name: 'تلفزيون TCL 43 بوصة', category: 'أجهزة كهربائية', default_price: 8000 },
  { name: 'سخان مياه كهربائي 60 لتر', category: 'أجهزة كهربائية', default_price: 4000 },
  { name: 'مكنسة كهربائية لاسلكية', category: 'أجهزة كهربائية', default_price: 4500 },
  { name: 'فرن بلت إن كهربائي', category: 'أجهزة كهربائية', default_price: 14000 },
  { name: 'ديب فريزر نورديز 300 لتر', category: 'أجهزة كهربائية', default_price: 12000 },
  { name: 'تكييف سبليت كاريير 2.25 حصان', category: 'أجهزة كهربائية', default_price: 22000 },
  { name: 'ثلاجة نون 18 قدم', category: 'أجهزة كهربائية', default_price: 13000 },
  { name: 'بوتاجاز 5 شعلة تكنوجاز', category: 'أجهزة كهربائية', default_price: 6000 },
  { name: 'شاشة سامسونج 65 بوصة LED', category: 'أجهزة كهربائية', default_price: 26000 },
  { name: 'سامسونج جالاكسي A54', category: 'موبايلات', default_price: 12000 },
  { name: 'آيفون 15 برو ماكس', category: 'موبايلات', default_price: 45000 },
  { name: 'شاومي ريدمي نوت 12', category: 'موبايلات', default_price: 7500 },
  { name: 'أوبو Reno 10', category: 'موبايلات', default_price: 11000 },
  { name: 'هواوي Nova 12i', category: 'موبايلات', default_price: 8500 },
  { name: 'ريلمي C55', category: 'موبايلات', default_price: 5500 },
  { name: 'إنفينيكس Hot 40', category: 'موبايلات', default_price: 4500 },
  { name: 'تكنو Camon 20', category: 'موبايلات', default_price: 6000 },
  { name: 'بطانية قطن مزدوجة', category: 'مشمعات ومفروشات', default_price: 1800 },
  { name: 'لحاف سنتكوين مزدوج', category: 'مشمعات ومفروشات', default_price: 2800 },
  { name: 'مشمع أرضية 4 متر', category: 'مشمعات ومفروشات', default_price: 3500 },
  { name: 'غطاء سرير كينج', category: 'مشمعات ومفروشات', default_price: 2000 },
  { name: 'سجادة صلاة فاخرة', category: 'مشمعات ومفروشات', default_price: 600 },
  { name: 'ستارة بلاك أوت 3 متر', category: 'مشمعات ومفروشات', default_price: 1500 },
  { name: 'وسادة ميموري فوم طبية', category: 'مشمعات ومفروشات', default_price: 900 },
  { name: 'نيو كونكريت بطانية شتوي', category: 'مشمعات ومفروشات', default_price: 2200 },
  { name: 'مفارش سرير 6 قطع', category: 'مشمعات ومفروشات', default_price: 1600 },
  { name: 'سجادة أرضية 6×4', category: 'مشمعات ومفروشات', default_price: 4500 },
  { name: 'مخدة سحاب 50×70', category: 'مشمعات ومفروشات', default_price: 350 },
  { name: 'خزانة ملابس 3 أبواب', category: 'أثاث ومنزلية', default_price: 9000 },
  { name: 'سرير خشب زان مزدوج', category: 'أثاث ومنزلية', default_price: 7000 },
  { name: 'طاولة سفرة 6 كراسي', category: 'أثاث ومنزلية', default_price: 6000 },
  { name: 'ركنة أمريكي 3 قطع', category: 'أثاث ومنزلية', default_price: 15000 },
  { name: 'غرفة نوم كاملة 5 قطع', category: 'أثاث ومنزلية', default_price: 25000 },
  { name: 'ترابيزة تلفزيون', category: 'أثاث ومنزلية', default_price: 3000 },
  { name: 'دولاب مطبخ ألمنيوم', category: 'أثاث ومنزلية', default_price: 12000 },
  { name: 'سفرة خشب زان 8 كراسي', category: 'أثاث ومنزلية', default_price: 18000 },
  { name: 'مكتب كمبيوتر', category: 'أثاث ومنزلية', default_price: 3500 },
  { name: 'دفاية غاز تكنوجاز', category: 'أجهزة كهربائية', default_price: 3500 },
  { name: 'مكواة بخار فيليبس', category: 'أجهزة كهربائية', default_price: 2800 },
  { name: 'خلاط مولينكس 1000 واط', category: 'أجهزة كهربائية', default_price: 1500 },
  { name: 'شاشة LG 50 بوصة', category: 'إلكترونيات', default_price: 14000 },
  { name: 'مشغل أقراص سوني', category: 'إلكترونيات', default_price: 2500 },
  { name: 'سماعة بلوتوث JBL', category: 'إلكترونيات', default_price: 1800 },
  { name: 'لاب توب HP 15 بوصة', category: 'إلكترونيات', default_price: 18000 },
  { name: 'تابلت سامسونج A9', category: 'إلكترونيات', default_price: 8000 },
  { name: 'كاميرا مراقبة منزلية', category: 'إلكترونيات', default_price: 2200 },
  { name: 'طقم حلل جرانيت 10 قطع', category: 'أدوات مطبخ', default_price: 3500 },
  { name: 'طقم كاسات بلور 12 قطعة', category: 'أدوات مطبخ', default_price: 800 },
  { name: 'طبق ستانلس ستيل 6 قطع', category: 'أدوات مطبخ', default_price: 600 },
  { name: 'حلة ضغط برستو 6 لتر', category: 'أدوات مطبخ', default_price: 1200 },
  { name: 'مصفاة استيل كبيرة', category: 'أدوات مطبخ', default_price: 250 },
  { name: 'طقم سكاكين 6 قطعة', category: 'أدوات مطبخ', default_price: 450 },
  { name: 'جهاز قياس ضغط زئبقي', category: 'مستلزمات طبية', default_price: 350 },
  { name: 'ميزان حرارة رقمي', category: 'مستلزمات طبية', default_price: 150 },
  { name: 'جهاز بخار استنشاق', category: 'مستلزمات طبية', default_price: 800 },
  { name: 'عكاز طبي قابل للتعديل', category: 'مستلزمات طبية', default_price: 400 },
  { name: 'كرسي متحرك طبي', category: 'مستلزمات طبية', default_price: 4500 },
  { name: 'سماعة أذن طبية', category: 'مستلزمات طبية', default_price: 250 },
  { name: 'سرير عناية مركزي', category: 'مستلزمات طبية', default_price: 8500 },
  { name: 'جهاز أكسجين محمول', category: 'مستلزمات طبية', default_price: 12000 },
  { name: 'مشاية طبية 4 عجلات', category: 'مستلزمات طبية', default_price: 1800 },
]

const DEFAULT_SETTINGS = {
  shop_name: 'معرض الأهلي للأجهزة الكهربائية',
  logo_url: '',
  show_logo: false,
  last_receipt_number: 0,
  receipt_prefix: 'RCPT',
  receipt_year: new Date().getFullYear(),
}

export async function seedInitialData() {
  if (!isSupabaseConfigured) return

  const { data: existingSettings } = await supabase
    .from('settings')
    .select('id')
    .eq('id', 'app_settings')
    .maybeSingle()

  if (!existingSettings) {
    const { error: settingsErr } = await supabase
      .from('settings')
      .insert({ id: 'app_settings', ...DEFAULT_SETTINGS })

    if (settingsErr) console.error('Error seeding settings:', settingsErr)
  }

  const { data: existingProducts } = await supabase
    .from('products')
    .select('id')
    .limit(1)

  if (!existingProducts || existingProducts.length === 0) {
    const { error: productsErr } = await supabase
      .from('products')
      .insert(SEED_PRODUCTS)

    if (productsErr) console.error('Error seeding products:', productsErr)
  }
}
