const FIRST_NAMES_M = [
  'أحمد', 'محمد', 'محمود', 'علي', 'حسن', 'إبراهيم', 'خالد', 'عمر', 'يوسف', 'كريم',
  'طارق', 'هشام', 'سعيد', 'حسين', 'عبدالرحمن', 'ياسر', 'مصطفى', 'عمرو', 'وليد', 'رامي',
  'أشرف', 'سمير', 'فادي', 'نادر', 'شريف', 'محسن', 'جمال', 'صلاح', 'سامح', 'حاتم',
  'مجدي', 'علاء', 'رأفت', 'عباس', 'فوزي', 'ممدوح', 'سيف', 'حامد', 'رشيد', 'كمال',
  'فهمي', 'أنور', 'صلاح الدين', 'عبدالله', 'ناصر', 'مروان', 'زياد', 'باسم', 'رائد', 'عادل',
];

const FIRST_NAMES_F = [
  'فاطمة', 'سارة', 'نور', 'هدى', 'آية', 'مريم', 'أمينة', 'زينب', 'صفاء', 'منى',
  'هناء', 'سمر', 'دينا', 'رنا', 'ليلى', 'أمل', 'لمياء', 'إيمان', 'نادية', 'هبة',
  'شيماء', 'رania', 'غادة', 'مها', 'بثينة', 'نجلاء', 'سحر', 'وداد', 'فوزية', 'عطيات',
  'نجوية', 'فريدة', 'لطيفة', 'جميلة', 'خديجة', 'عائشة', 'رقيقة', 'سمية', 'حنان', 'رحاب',
];

const LAST_NAMES = [
  'محمد', 'أحمد', 'حسن', 'إبراهيم', 'علي', 'خالد', 'عمر', 'سعيد', 'حسين', 'عبدالرحمن',
  'شاهين', 'المنصوري', 'الدسوقي', 'البنا', 'شريف', 'مصطفى', 'رمضان', 'القاوقجي', 'سلامة', 'عثمان',
  'الفقي', 'جبريل', 'زهران', 'مرسي', 'طه', 'عبدالحميد', 'النجار', 'بدوي', 'الحسيني', 'الشرقاوي',
  'الدغري', 'العتر', 'كشك', 'حافظ', 'السيد', 'أبو زيد', 'الجمال', 'رشوان', 'السباعي', 'عز العرب',
];

const VILLAGES = [
  'المنصورة', 'المنزلة', 'ميت غمر', 'أجا', 'بلقاس', 'شربين', 'تمي الأمديد', 'السنبلاوين',
  'منية النصر', 'المطرية', 'دكرنس', 'بني عبيد', 'الجمالية', 'المحلة الكبرى', 'طنطا', 'كفر الشيخ',
  'دسوق', 'قها', 'بلبيس', 'أبو حماد', 'فايد', 'الإسماعيلية', 'بورسعيد', 'دمياط',
];

const PRODUCT_CATEGORIES = [
  'أجهزة كهربائية',
  'موبايلات',
  'أثاث ومنزلية',
  'مشمعات ومفروشات',
];

const DEMO_PRODUCTS = [
  { id: 'prod-0', name: 'ثلاجة سامسونج', category: 'أجهزة كهربائية', default_price: 12000, isDeleted: false },
  { id: 'prod-1', name: 'غسالة LG', category: 'أجهزة كهربائية', default_price: 8000, isDeleted: false },
  { id: 'prod-2', name: 'تكييف سبليت جري', category: 'أجهزة كهربائية', default_price: 18000, isDeleted: false },
  { id: 'prod-3', name: 'تلفزيون سوني 55 بوصة', category: 'أجهزة كهربائية', default_price: 15000, isDeleted: false },
  { id: 'prod-4', name: 'بوتاجاز بوش', category: 'أجهزة كهربائية', default_price: 6000, isDeleted: false },
  { id: 'prod-5', name: 'ميكروويف باناسونيك', category: 'أجهزة كهربائية', default_price: 5000, isDeleted: false },
  { id: 'prod-6', name: 'غسالة أطباق بوش', category: 'أجهزة كهربائية', default_price: 22000, isDeleted: false },
  { id: 'prod-7', name: 'ثلاجة شارب', category: 'أجهزة كهربائية', default_price: 10000, isDeleted: false },
  { id: 'prod-8', name: 'تكييف ويندوز هاير', category: 'أجهزة كهربائية', default_price: 10000, isDeleted: false },
  { id: 'prod-9', name: 'تلفزيون TCL 43 بوصة', category: 'أجهزة كهربائية', default_price: 8000, isDeleted: false },
  { id: 'prod-10', name: 'سخان مياه كهربائي', category: 'أجهزة كهربائية', default_price: 3500, isDeleted: false },
  { id: 'prod-11', name: 'مكنسة كهربائية', category: 'أجهزة كهربائية', default_price: 4000, isDeleted: false },
  { id: 'prod-12', name: 'فرن بلت إن', category: 'أجهزة كهربائية', default_price: 14000, isDeleted: false },
  { id: 'prod-13', name: 'ديب فريزر نورديز', category: 'أجهزة كهربائية', default_price: 11000, isDeleted: false },
  { id: 'prod-14', name: 'تكييف سبليت كاريير', category: 'أجهزة كهربائية', default_price: 20000, isDeleted: false },
  { id: 'prod-15', name: 'ثلاجة نون 18 قدم', category: 'أجهزة كهربائية', default_price: 13000, isDeleted: false },
  { id: 'prod-16', name: 'بوتاجاز 5 شعلة تكنوجاز', category: 'أجهزة كهربائية', default_price: 5500, isDeleted: false },
  { id: 'prod-17', name: 'شاشة سامسونج 65 بوصة', category: 'أجهزة كهربائية', default_price: 25000, isDeleted: false },
  { id: 'prod-18', name: 'سامسونج جالاكسي A54', category: 'موبايلات', default_price: 12000, isDeleted: false },
  { id: 'prod-19', name: 'آيفون 15', category: 'موبايلات', default_price: 35000, isDeleted: false },
  { id: 'prod-20', name: 'شاومي ريدمي نوت 12', category: 'موبايلات', default_price: 7000, isDeleted: false },
  { id: 'prod-21', name: 'أوبو Reno 10', category: 'موبايلات', default_price: 10000, isDeleted: false },
  { id: 'prod-22', name: 'بطانية قطن مزدوجة', category: 'مشمعات ومفروشات', default_price: 1500, isDeleted: false },
  { id: 'prod-23', name: 'لحاف سنتكوين مزدوج', category: 'مشمعات ومفروشات', default_price: 2500, isDeleted: false },
  { id: 'prod-24', name: 'مشمع أرضية 4 متر', category: 'مشمعات ومفروشات', default_price: 3000, isDeleted: false },
  { id: 'prod-25', name: 'غطاء سرير كينج', category: 'مشمعات ومفروشات', default_price: 1800, isDeleted: false },
  { id: 'prod-26', name: 'سجادة صلاة فاخرة', category: 'مشمعات ومفروشات', default_price: 500, isDeleted: false },
  { id: 'prod-27', name: 'ستارة بلاك أوت', category: 'مشمعات ومفروشات', default_price: 1200, isDeleted: false },
  { id: 'prod-28', name: 'وسادة ميموري فوم', category: 'مشمعات ومفروشات', default_price: 800, isDeleted: false },
  { id: 'prod-29', name: 'مكواة بخار فيليبس', category: 'أجهزة كهربائية', default_price: 2500, isDeleted: false },
  { id: 'prod-30', name: 'خزانة ملابس 3 أبواب', category: 'أثاث ومنزلية', default_price: 8000, isDeleted: false },
  { id: 'prod-31', name: 'سرير خشب زان مزدوج', category: 'أثاث ومنزلية', default_price: 6000, isDeleted: false },
  { id: 'prod-32', name: 'طاولة سفرة 6 كراسي', category: 'أثاث ومنزلية', default_price: 5000, isDeleted: false },
  { id: 'prod-33', name: 'نيو كونكريت بطانية', category: 'مشمعات ومفروشات', default_price: 2000, isDeleted: false },
  { id: 'prod-34', name: 'دفاية غاز تكنوجاز', category: 'أجهزة كهربائية', default_price: 3000, isDeleted: false },
];

const PRODUCTS = DEMO_PRODUCTS.map(p => ({ name: p.name, price: p.default_price }));

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateDemoData() {
  const rng = seededRandom(42);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

  const customers = [];
  const contracts = [];
  const installments = [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  for (let i = 0; i < 200; i++) {
    const isMale = rng() > 0.35;
    const firstName = isMale ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
    const lastName = pick(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const village = pick(VILLAGES);
    const phone = `01${randInt(0, 4)}${String(randInt(10000000, 99999999))}`;
    const hasNationalId = rng() > 0.4;
    const nationalId = hasNationalId ? String(randInt(28001010000000, 30212319999999)) : '';

    const customer = {
      id: `cust-${i}`,
      full_name: fullName,
      phone,
      village,
      national_id: nationalId,
      address: rng() > 0.5 ? `${pick(['شارع', 'حي', 'زقاق'])} ${randInt(1, 50)}` : '',
      notes: '',
      isDeleted: false,
    };
    customers.push(customer);

    const numContracts = rng() > 0.8 ? 2 : 1;
    for (let c = 0; c < numContracts; c++) {
      const product = pick(PRODUCTS);
      const monthsCount = pick([3, 6, 8, 10, 12, 15, 18, 24]);
      const totalAmount = product.price + randInt(-1000, 3000);
      const monthlyAmount = Math.ceil(totalAmount / monthsCount);
      const startMonthOffset = randInt(-18, 0);
      const startDate = new Date(currentYear, currentMonth + startMonthOffset, 1);
      const endDate = new Date(currentYear, currentMonth + startMonthOffset + monthsCount - 1, 1);

      const contractStatusRoll = rng();
      let contractStatus = 'active';
      if (contractStatusRoll > 0.95) contractStatus = 'completed';
      else if (contractStatusRoll > 0.9) contractStatus = 'defaulted';

      const contractId = `contract-${i}-${c}`;
      contracts.push({
        id: contractId,
        customer_id: customer.id,
        customer_name: fullName,
        customer_phone: phone,
        customer_village: village,
        product_name: product.name,
        total_amount: totalAmount,
        monthly_amount: monthlyAmount,
        months_count: monthsCount,
        start_date: startDate,
        end_date: endDate,
        status: contractStatus,
      });

      const remainder = totalAmount - monthlyAmount * (monthsCount - 1);
      for (let m = 0; m < monthsCount; m++) {
        const dueDate = new Date(currentYear, currentMonth + startMonthOffset + m, 1);
        const amount = m === monthsCount - 1 && remainder > 0 ? remainder : monthlyAmount;

        const monthsFromNow = (dueDate.getFullYear() - currentYear) * 12 + (dueDate.getMonth() - currentMonth);
        let status;
        if (monthsFromNow < -1) {
          status = rng() > 0.15 ? 'paid' : 'late';
        } else if (monthsFromNow === -1) {
          status = rng() > 0.3 ? 'paid' : rng() > 0.5 ? 'late' : 'pending';
        } else if (monthsFromNow === 0) {
          status = rng() > 0.5 ? 'paid' : rng() > 0.4 ? 'pending' : 'late';
        } else {
          status = 'pending';
        }

        if (contractStatus === 'completed') status = 'paid';

        installments.push({
          id: `inst-${i}-${c}-${m}`,
          contract_id: contractId,
          customer_id: customer.id,
          amount,
          status,
          due_date: dueDate,
          ...(status === 'paid' ? { payment_date: new Date(dueDate.getTime() + randInt(0, 10) * 86400000) } : {}),
        });
      }
    }
  }

  return { customers, contracts, installments };
}

const generated = generateDemoData();

const demoData = {
  customers: generated.customers,
  contracts: generated.contracts,
  installments: generated.installments,
  receipts: [],
  products: [...DEMO_PRODUCTS],
  settings: {
    shop_name: '',
    logo_url: '',
    show_logo: true,
    last_receipt_number: 0,
    receipt_prefix: 'RCPT',
    receipt_year: new Date().getFullYear(),
  },
  _nextId: 10000,
};

export function getNextDemoId(prefix) {
  demoData._nextId += 1;
  return `${prefix}-${demoData._nextId}`;
}

export default demoData;
