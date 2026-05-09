const DEMO_PRODUCTS = [];

const PRODUCTS = [];

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateDemoData() {
  return { customers: [], contracts: [], installments: [], receipts: [] };
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
