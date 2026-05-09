const FIRST_NAMES_M = [
  'أحمد', 'محمد', 'محمود', 'علي', 'حسن', 'إبراهيم', 'خالد', 'عمر', 'يوسف', 'كريم',
  'طارق', 'هشام', 'سعيد', 'حسين', 'عبدالرحمن', 'ياسر', 'مصطفى', 'عمرو', 'وليد', 'رامي',
  'أشرف', 'سمير', 'فادي', 'نادر', 'شريف', 'محسن', 'جمال', 'صلاح', 'سامح', 'حاتم',
  'مجدي', 'علاء', 'رأفت', 'عباس', 'فوزي', 'ممدوح', 'سيف', 'حامد', 'رشيد', 'كمال',
  'فهمي', 'أنور', 'صلاح الدين', 'عبدالله', 'ناصر', 'مروان', 'زياد', 'باسم', 'رائد', 'عادل',
  'إيهاب', 'أكرم', 'ثروت', 'جابر', 'جلال', 'جمعة', 'حجازي', 'حمدي', 'خضر', 'رجب',
  'زكريا', 'سراج', 'شعبان', 'صابر', 'صالح', 'ضاحي', 'طاهر', 'عاصم', 'عبدالرؤوف', 'عزت',
  'غريب', 'فتحي', 'قاسم', 'لطفي', 'مأمون', 'متولي', 'مسعد', 'معتز', 'منصور', 'ناجي',
];

const FIRST_NAMES_F = [
  'فاطمة', 'سارة', 'نور', 'هدى', 'آية', 'مريم', 'أمينة', 'زينب', 'صفاء', 'منى',
  'هناء', 'سمر', 'دينا', 'رنا', 'ليلى', 'أمل', 'لمياء', 'إيمان', 'نادية', 'هبة',
  'شيماء', 'رانيا', 'غادة', 'مها', 'بثينة', 'نجلاء', 'سحر', 'وداد', 'فوزية', 'عطيات',
  'نجوية', 'فريدة', 'لطيفة', 'جميلة', 'خديجة', 'عائشة', 'رقيقة', 'سمية', 'حنان', 'رحاب',
  'إيناس', 'بشرى', 'تسنيم', 'جهاد', 'حليمة', 'خولة', 'دعاء', 'رؤى', 'زهرة', 'سلوى',
  'شروق', 'صباح', 'ضحى', 'عزة', 'عفاف', 'علياء', 'غفران', 'مروة', 'ناهد', 'هند',
  'وردة', 'ياسمين', 'إسراء', 'بسنت', 'تقوى', 'جنة', 'حواء', 'رانية', 'سماح', 'عبير',
];

const LAST_NAMES = [
  'محمد', 'أحمد', 'حسن', 'إبراهيم', 'علي', 'خالد', 'عمر', 'سعيد', 'حسين', 'عبدالرحمن',
  'شاهين', 'المنصوري', 'الدسوقي', 'البنا', 'شريف', 'مصطفى', 'رمضان', 'القاوقجي', 'سلامة', 'عثمان',
  'الفقي', 'جبريل', 'زهران', 'مرسي', 'طه', 'عبدالحميد', 'النجار', 'بدوي', 'الحسيني', 'الشرقاوي',
  'الدغري', 'العتر', 'كشك', 'حافظ', 'السيد', 'أبو زيد', 'الجمال', 'رشوان', 'السباعي', 'عز العرب',
  'الديب', 'الطوخي', 'النقيب', 'بدر', 'جابر', 'حجاج', 'خطاب', 'داوود', 'رزق', 'زكي',
  'سرحان', 'شلبي', 'صادق', 'ضرغام', 'طالب', 'عبدالقادر', 'عفيفي', 'غنيم', 'فضل', 'قنديل',
  'كامل', 'ماضي', 'نوح', 'هاشم', 'وهبة', 'يحيى', 'الأنصاري', 'البرقي', 'التميمي', 'الجزائري',
];

const VILLAGES = [
  'المنصورة', 'المنزلة', 'ميت غمر', 'أجا', 'بلقاس', 'شربين', 'تمي الأمديد', 'السنبلاوين',
  'منية النصر', 'المطرية', 'دكرنس', 'بني عبيد', 'الجمالية', 'المحلة الكبرى', 'طنطا', 'كفر الشيخ',
  'دسوق', 'قها', 'بلبيس', 'أبو حماد', 'فايد', 'الإسماعيلية', 'بورسعيد', 'دمياط',
  'الزقازيق', 'بنها', 'شبرا الخيمة', 'قليوب', 'كفر الزيات', 'ميت حبيش', 'نبروه', 'بسنديلة',
  'كفر سعد', 'الرياض', 'محلة دمنة', 'شابات', 'سمنود', 'المحلة', 'بيلة', 'الخارجة',
  'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'الغردقة', 'شرم الشيخ', 'مرسى مطروح',
  'العريش', 'رفح', 'الشيخ زويد', 'بئر العبد', 'نويبع', 'دهب', 'طابا', 'الطور',
  'رأس غارب', 'سفاجا', 'القصير', 'مرسى علم', 'حلايب', 'شلاتين', 'أبو رماد', 'أبو سنبل',
];

const PRODUCT_CATEGORIES = [
  'أجهزة كهربائية',
  'موبايلات',
  'أثاث ومنزلية',
  'مشمعات ومفروشات',
  'إلكترونيات',
  'أدوات مطبخ',
  'مستلزمات طبية',
];

const DEMO_PRODUCTS = [
  { id: 'prod-0', name: 'ثلاجة سامسونج 14 قدم', category: 'أجهزة كهربائية', default_price: 14000, isDeleted: false },
  { id: 'prod-1', name: 'غسالة LG أوتوماتيك 7 كيلو', category: 'أجهزة كهربائية', default_price: 9000, isDeleted: false },
  { id: 'prod-2', name: 'تكييف سبليت جري 1.5 حصان', category: 'أجهزة كهربائية', default_price: 18000, isDeleted: false },
  { id: 'prod-3', name: 'تلفزيون سوني 55 بوصة', category: 'أجهزة كهربائية', default_price: 15000, isDeleted: false },
  { id: 'prod-4', name: 'بوتاجاز بوش 5 شعلة', category: 'أجهزة كهربائية', default_price: 7500, isDeleted: false },
  { id: 'prod-5', name: 'ميكروويف باناسونيك 25 لتر', category: 'أجهزة كهربائية', default_price: 5000, isDeleted: false },
  { id: 'prod-6', name: 'غسالة أطباق بوش 60 سم', category: 'أجهزة كهربائية', default_price: 22000, isDeleted: false },
  { id: 'prod-7', name: 'ثلاجة شارب 16 قدم', category: 'أجهزة كهربائية', default_price: 11000, isDeleted: false },
  { id: 'prod-8', name: 'تكييف ويندوز هاير 2 حصان', category: 'أجهزة كهربائية', default_price: 10000, isDeleted: false },
  { id: 'prod-9', name: 'تلفزيون TCL 43 بوصة', category: 'أجهزة كهربائية', default_price: 8000, isDeleted: false },
  { id: 'prod-10', name: 'سخان مياه كهربائي 60 لتر', category: 'أجهزة كهربائية', default_price: 4000, isDeleted: false },
  { id: 'prod-11', name: 'مكنسة كهربائية لاسلكية', category: 'أجهزة كهربائية', default_price: 4500, isDeleted: false },
  { id: 'prod-12', name: 'فرن بلت إن كهربائي', category: 'أجهزة كهربائية', default_price: 14000, isDeleted: false },
  { id: 'prod-13', name: 'ديب فريزر نورديز 300 لتر', category: 'أجهزة كهربائية', default_price: 12000, isDeleted: false },
  { id: 'prod-14', name: 'تكييف سبليت كاريير 2.25 حصان', category: 'أجهزة كهربائية', default_price: 22000, isDeleted: false },
  { id: 'prod-15', name: 'ثلاجة نون 18 قدم', category: 'أجهزة كهربائية', default_price: 13000, isDeleted: false },
  { id: 'prod-16', name: 'بوتاجاز 5 شعلة تكنوجاز', category: 'أجهزة كهربائية', default_price: 6000, isDeleted: false },
  { id: 'prod-17', name: 'شاشة سامسونج 65 بوصة LED', category: 'أجهزة كهربائية', default_price: 26000, isDeleted: false },
  { id: 'prod-18', name: 'سامسونج جالاكسي A54', category: 'موبايلات', default_price: 12000, isDeleted: false },
  { id: 'prod-19', name: 'آيفون 15 برو ماكس', category: 'موبايلات', default_price: 45000, isDeleted: false },
  { id: 'prod-20', name: 'شاومي ريدمي نوت 12', category: 'موبايلات', default_price: 7500, isDeleted: false },
  { id: 'prod-21', name: 'أوبو Reno 10', category: 'موبايلات', default_price: 11000, isDeleted: false },
  { id: 'prod-22', name: 'هواوي Nova 12i', category: 'موبايلات', default_price: 8500, isDeleted: false },
  { id: 'prod-23', name: 'ريلمي C55', category: 'موبايلات', default_price: 5500, isDeleted: false },
  { id: 'prod-24', name: 'إنفينيكس Hot 40', category: 'موبايلات', default_price: 4500, isDeleted: false },
  { id: 'prod-25', name: 'تكنو Camon 20', category: 'موبايلات', default_price: 6000, isDeleted: false },
  { id: 'prod-26', name: 'بطانية قطن مزدوجة', category: 'مشمعات ومفروشات', default_price: 1800, isDeleted: false },
  { id: 'prod-27', name: 'لحاف سنتكوين مزدوج', category: 'مشمعات ومفروشات', default_price: 2800, isDeleted: false },
  { id: 'prod-28', name: 'مشمع أرضية 4 متر', category: 'مشمعات ومفروشات', default_price: 3500, isDeleted: false },
  { id: 'prod-29', name: 'غطاء سرير كينج', category: 'مشمعات ومفروشات', default_price: 2000, isDeleted: false },
  { id: 'prod-30', name: 'سجادة صلاة فاخرة', category: 'مشمعات ومفروشات', default_price: 600, isDeleted: false },
  { id: 'prod-31', name: 'ستارة بلاك أوت 3 متر', category: 'مشمعات ومفروشات', default_price: 1500, isDeleted: false },
  { id: 'prod-32', name: 'وسادة ميموري فوم طبية', category: 'مشمعات ومفروشات', default_price: 900, isDeleted: false },
  { id: 'prod-33', name: 'نيو كونكريت بطانية شتوي', category: 'مشمعات ومفروشات', default_price: 2200, isDeleted: false },
  { id: 'prod-34', name: 'مفارش سرير 6 قطع', category: 'مشمعات ومفروشات', default_price: 1600, isDeleted: false },
  { id: 'prod-35', name: 'سجادة أرضية 6×4', category: 'مشمعات ومفروشات', default_price: 4500, isDeleted: false },
  { id: 'prod-36', name: 'مخدة سحاب 50×70', category: 'مشمعات ومفروشات', default_price: 350, isDeleted: false },
  { id: 'prod-37', name: 'خزانة ملابس 3 أبواب', category: 'أثاث ومنزلية', default_price: 9000, isDeleted: false },
  { id: 'prod-38', name: 'سرير خشب زان مزدوج', category: 'أثاث ومنزلية', default_price: 7000, isDeleted: false },
  { id: 'prod-39', name: 'طاولة سفرة 6 كراسي', category: 'أثاث ومنزلية', default_price: 6000, isDeleted: false },
  { id: 'prod-40', name: 'ركنة أمريكي 3 قطع', category: 'أثاث ومنزلية', default_price: 15000, isDeleted: false },
  { id: 'prod-41', name: 'غرفة نوم كاملة 5 قطع', category: 'أثاث ومنزلية', default_price: 25000, isDeleted: false },
  { id: 'prod-42', name: 'ترابيزة تلفزيون', category: 'أثاث ومنزلية', default_price: 3000, isDeleted: false },
  { id: 'prod-43', name: 'دولاب مطبخ ألمنيوم', category: 'أثاث ومنزلية', default_price: 12000, isDeleted: false },
  { id: 'prod-44', name: 'سفرة خشب زان 8 كراسي', category: 'أثاث ومنزلية', default_price: 18000, isDeleted: false },
  { id: 'prod-45', name: 'مكتب كمبيوتر', category: 'أثاث ومنزلية', default_price: 3500, isDeleted: false },
  { id: 'prod-46', name: 'دفاية غاز تكنوجاز', category: 'أجهزة كهربائية', default_price: 3500, isDeleted: false },
  { id: 'prod-47', name: 'مكواة بخار فيليبس', category: 'أجهزة كهربائية', default_price: 2800, isDeleted: false },
  { id: 'prod-48', name: 'خلاط مولينكس 1000 واط', category: 'أجهزة كهربائية', default_price: 1500, isDeleted: false },
  { id: 'prod-49', name: 'شاشة LG 50 بوصة', category: 'إلكترونيات', default_price: 14000, isDeleted: false },
  { id: 'prod-50', name: 'مشغل أقراص سوني', category: 'إلكترونيات', default_price: 2500, isDeleted: false },
  { id: 'prod-51', name: 'سماعة بلوتوث JBL', category: 'إلكترونيات', default_price: 1800, isDeleted: false },
  { id: 'prod-52', name: 'لاب توب HP 15 بوصة', category: 'إلكترونيات', default_price: 18000, isDeleted: false },
  { id: 'prod-53', name: 'تابلت سامسونج A9', category: 'إلكترونيات', default_price: 8000, isDeleted: false },
  { id: 'prod-54', name: 'كاميرا مراقبة منزلية', category: 'إلكترونيات', default_price: 2200, isDeleted: false },
  { id: 'prod-55', name: 'طقم حلل جرانيت 10 قطع', category: 'أدوات مطبخ', default_price: 3500, isDeleted: false },
  { id: 'prod-56', name: 'طقم كاسات بلور 12 قطعة', category: 'أدوات مطبخ', default_price: 800, isDeleted: false },
  { id: 'prod-57', name: 'طبق ستانلس ستيل 6 قطع', category: 'أدوات مطبخ', default_price: 600, isDeleted: false },
  { id: 'prod-58', name: 'حلة ضغط برستو 6 لتر', category: 'أدوات مطبخ', default_price: 1200, isDeleted: false },
  { id: 'prod-59', name: 'مصفاة استيل كبيرة', category: 'أدوات مطبخ', default_price: 250, isDeleted: false },
  { id: 'prod-60', name: 'طقم سكاكين 6 قطعة', category: 'أدوات مطبخ', default_price: 450, isDeleted: false },
  { id: 'prod-61', name: 'جهاز قياس ضغط زئبقي', category: 'مستلزمات طبية', default_price: 350, isDeleted: false },
  { id: 'prod-62', name: 'ميزان حرارة رقمي', category: 'مستلزمات طبية', default_price: 150, isDeleted: false },
  { id: 'prod-63', name: 'جهاز بخار استنشاق', category: 'مستلزمات طبية', default_price: 800, isDeleted: false },
  { id: 'prod-64', name: 'عكاز طبي قابل للتعديل', category: 'مستلزمات طبية', default_price: 400, isDeleted: false },
  { id: 'prod-65', name: 'كرسي متحرك طبي', category: 'مستلزمات طبية', default_price: 4500, isDeleted: false },
  { id: 'prod-66', name: 'سماعة أذن طبية', category: 'مستلزمات طبية', default_price: 250, isDeleted: false },
  { id: 'prod-67', name: 'سرير عناية مركزي', category: 'مستلزمات طبية', default_price: 8500, isDeleted: false },
  { id: 'prod-68', name: 'جهاز أكسجين محمول', category: 'مستلزمات طبية', default_price: 12000, isDeleted: false },
  { id: 'prod-69', name: 'مشاية طبية 4 عجلات', category: 'مستلزمات طبية', default_price: 1800, isDeleted: false },
  { id: 'prod-70', name: 'أجهزة كهربائية', category: 'مستلزمات طبية', default_price: 5000, isDeleted: true },
];

const PRODUCTS = DEMO_PRODUCTS.filter(p => !p.isDeleted).map(p => ({ name: p.name, price: p.default_price }));

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
  const receipts = [];
  let receiptCounter = 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const phoneOperators = ['10', '11', '12', '15', '10', '11', '12', '10', '15', '11'];

  for (let i = 0; i < 200; i++) {
    const isMale = rng() > 0.3;
    const firstName = isMale ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
    const lastName = pick(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const village = pick(VILLAGES);
    const phone = `01${pick(phoneOperators)}${String(randInt(1000000, 9999999)).padStart(7, '0')}`;
    const hasNationalId = rng() > 0.3;
    const nationalId = hasNationalId ? String(randInt(28001010000000, 30212319999999)) : '';
    const hasSecondPhone = rng() > 0.7;
    const secondPhone = hasSecondPhone ? `01${pick(phoneOperators)}${String(randInt(1000000, 9999999)).padStart(7, '0')}` : '';

    const customer = {
      id: `cust-${i}`,
      full_name: fullName,
      phone,
      second_phone: secondPhone,
      village,
      national_id: nationalId,
      address: rng() > 0.4 ? `${pick(['شارع', 'حي', 'زقاق', 'منطقة', 'ميدان'])} ${randInt(1, 99)}${rng() > 0.5 ? ` عمارة ${randInt(1, 20)}` : ''}` : '',
      notes: rng() > 0.85 ? pick(['عميل منتظم', 'صاحب محل', 'موظف حكومة', 'صاحب معاش', 'أستاذ جامعي', 'صاحب ورشة', 'تاجر', 'مزارع']) : '',
      isDeleted: false,
    };
    customers.push(customer);

    const numContracts = rng() > 0.75 ? (rng() > 0.5 ? 2 : 3) : 1;
    for (let c = 0; c < numContracts; c++) {
      const product = pick(PRODUCTS);
      const monthsCount = pick([3, 4, 6, 8, 10, 12, 15, 18, 24, 30, 36]);
      const priceVariation = Math.floor(product.price * (0.8 + rng() * 0.4));
      const totalAmount = priceVariation;
      const monthlyAmount = Math.ceil(totalAmount / monthsCount);
      const startMonthOffset = randInt(-24, 0);
      const startDate = new Date(currentYear, currentMonth + startMonthOffset, randInt(1, 28));
      const endDate = new Date(currentYear, currentMonth + startMonthOffset + monthsCount - 1, 1);

      const contractStatusRoll = rng();
      let contractStatus = 'active';
      if (contractStatusRoll > 0.92) contractStatus = 'completed';
      else if (contractStatusRoll > 0.85) contractStatus = 'defaulted';

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
        if (monthsFromNow < -2) {
          status = rng() > 0.12 ? 'paid' : 'late';
        } else if (monthsFromNow === -2) {
          status = rng() > 0.2 ? 'paid' : rng() > 0.5 ? 'late' : 'pending';
        } else if (monthsFromNow === -1) {
          status = rng() > 0.35 ? 'paid' : rng() > 0.4 ? 'late' : 'pending';
        } else if (monthsFromNow === 0) {
          status = rng() > 0.45 ? 'paid' : rng() > 0.35 ? 'pending' : 'late';
        } else {
          status = 'pending';
        }

        if (contractStatus === 'completed') status = 'paid';
        if (contractStatus === 'defaulted' && monthsFromNow < 0) status = 'late';

        const inst = {
          id: `inst-${i}-${c}-${m}`,
          contract_id: contractId,
          customer_id: customer.id,
          amount,
          status,
          due_date: dueDate,
        };

        if (status === 'paid') {
          inst.payment_date = new Date(dueDate.getTime() + randInt(0, 15) * 86400000);
          if (rng() > 0.7 && monthsFromNow < -3) {
            const receiptId = `receipt-${inst.id}`;
            receipts.push({
              id: receiptId,
              receipt_number: `RCPT-${currentYear}-${String(receiptCounter + 1).padStart(4, '0')}`,
              installment_id: inst.id,
              customer_id: customer.id,
              customer_name: fullName,
              contract_id: contractId,
              issue_date: inst.payment_date,
              month: dueDate.getMonth(),
              year: dueDate.getFullYear(),
              amount: amount,
            });
            inst.receipt_id = receiptId;
            receiptCounter += 1;
          }
        }

        if (status === 'paid' && rng() > 0.85 && monthsFromNow < -1) {
          const partialAmount = Math.floor(amount * (0.4 + rng() * 0.5));
          inst.paid_amount = partialAmount;
          inst.payment_date = new Date(dueDate.getTime() + randInt(0, 10) * 86400000);
        }

        installments.push(inst);
      }
    }
  }

  return { customers, contracts, installments, receipts };
}

const generated = generateDemoData();

const demoData = {
  customers: generated.customers,
  contracts: generated.contracts,
  installments: generated.installments,
  receipts: [],
  products: [...DEMO_PRODUCTS.filter(p => !p.isDeleted)],
  settings: {
    shop_name: 'معرض الأهلي للأجهزة الكهربائية',
    logo_url: '',
    show_logo: false,
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
