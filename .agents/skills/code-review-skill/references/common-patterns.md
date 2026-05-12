# Common Anti-Patterns in This Project

## Date Timezone Bug

```js
// ❌ WRONG — shifts date by timezone offset
const dateStr = new Date(2025, 4, 1).toISOString().split('T')[0];
// In Egypt (UTC+2): returns "2025-04-30" instead of "2025-05-01"

// ✅ CORRECT
import { formatLocalDateString } from '../utils/dateUtils';
const dateStr = formatLocalDateString(new Date(2025, 4, 1));
// Always returns "2025-05-01"

// ❌ WRONG — new Date("2025-05-01") parses as UTC midnight
const d = new Date("2025-05-01");
d.getMonth(); // Could be 3 (April) in UTC+2

// ✅ CORRECT
import { parseLocalDate } from '../utils/dateUtils';
const d = parseLocalDate("2025-05-01");
d.getMonth(); // Always 4 (May)
```

## N+1 Query Pattern

```js
// ❌ WRONG — 1 query per customer
for (const cid of customerIds) {
  const { data } = await supabase.from('customers').select('*').eq('id', cid);
}

// ✅ CORRECT — 1 query for all
const { data } = await supabase.from('customers').select('*').in('id', customerIds);
```

## Empty Array .in() Guard

```js
// ❌ WRONG — empty array returns nothing, may error
.in('id', [])

// ✅ CORRECT — use a sentinel value
.in('id', customerIds.length ? customerIds : ['none'])
```

## Column Projection

```js
// ❌ WRONG — fetches all columns including heavy ones (photo, notes)
.select('*')

// ✅ CORRECT — only fetch what's needed
.select('id, full_name, phone, village')
```

## isdeleted Column

```js
// ❌ WRONG — PostgreSQL folds column names to lowercase
.eq('isDeleted', false)

// ✅ CORRECT
.eq('isdeleted', false)
```

## React State in Async

```js
// ❌ WRONG — stale closure over installments
const handlePay = async (id) => {
  await markPaid(id);
  setInstallments(installments.filter(i => i.id !== id)); // 'installments' is stale
};

// ✅ CORRECT — functional update
const handlePay = async (id) => {
  await markPaid(id);
  setInstallments(prev => prev.filter(i => i.id !== id));
};
```

## useEffect Dependency

```js
// ❌ WRONG — missing dependency, value never updates
useEffect(() => {
  fetchData(customers);
}, []); // 'customers' not in deps

// ✅ CORRECT — but guard with ref to prevent re-fetch
const prevIdsRef = useRef('');
useEffect(() => {
  const ids = customers.map(c => c.id).join(',');
  if (prevIdsRef.current === ids) return;
  prevIdsRef.current = ids;
  fetchData(customers);
}, [customers]);
```
