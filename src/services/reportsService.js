import { isFirebaseConfigured } from '../firebase/demoMode';
import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData from '../firebase/demoStore';

export async function fetchMonthlyReport(month, year) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const relevant = demoData.installments.filter(inst => {
      const d = inst.due_date;
      return d && d.getMonth() === month && d.getFullYear() === year;
    });
    const paid = relevant.filter(i => i.status === 'paid');
    const partial = relevant.filter(i => i.status === 'partial');
    const unpaid = relevant.filter(i => i.status === 'pending' || i.status === 'late');
    const collectedFromPaid = paid.reduce((s, i) => s + (i.amount || 0), 0);
    const collectedFromPartial = partial.reduce((s, i) => s + (i.paid_amount || 0), 0);
    return {
      totalCollected: collectedFromPaid + collectedFromPartial,
      paidCount: paid.length + partial.length,
      unpaidCount: unpaid.length,
    };
  }

  if (isSupabaseConfigured) {
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data: allDue } = await supabase
      .from('installments')
      .select('*')
      .gte('due_date', monthStart)
      .lte('due_date', monthEnd);

    const paid = (allDue || []).filter(i => i.status === 'paid');
    const partial = (allDue || []).filter(i => i.status === 'partial');
    const unpaid = (allDue || []).filter(i => i.status === 'pending' || i.status === 'late');

    const collectedFromPaid = paid.reduce((s, i) => s + (i.amount || 0), 0);
    const collectedFromPartial = partial.reduce((s, i) => s + (i.paid_amount || 0), 0);

    return {
      totalCollected: collectedFromPaid + collectedFromPartial,
      paidCount: paid.length + partial.length,
      unpaidCount: unpaid.length,
    };
  }

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const [paidSnap, unpaidSnap] = await Promise.all([
    getDocs(query(collection(db, 'installments'), where('status', '==', 'paid'), where('payment_date', '>=', monthStart), where('payment_date', '<=', monthEnd))),
    getDocs(query(collection(db, 'installments'), where('status', 'in', ['pending', 'late']), where('due_date', '>=', monthStart), where('due_date', '<=', monthEnd))),
  ]);
  let totalCollected = 0;
  paidSnap.forEach(docSnap => { totalCollected += docSnap.data().amount || 0; });
  return { totalCollected, paidCount: paidSnap.size, unpaidCount: unpaidSnap.size };
}

export async function fetchVillageBreakdown(month, year) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const relevant = demoData.installments.filter(inst => {
      const d = inst.due_date;
      return d && d.getMonth() === month && d.getFullYear() === year;
    });
    const villageMap = {};
    relevant.forEach(inst => {
      const customer = demoData.customers.find(c => c.id === inst.customer_id && !c.isDeleted);
      const village = customer?.village || 'غير محدد';
      if (!villageMap[village]) villageMap[village] = { village, paidCount: 0, unpaidCount: 0, totalCollected: 0 };
      if (inst.status === 'paid') {
        villageMap[village].paidCount += 1;
        villageMap[village].totalCollected += inst.amount || 0;
      } else if (inst.status === 'partial') {
        villageMap[village].paidCount += 1;
        villageMap[village].totalCollected += inst.paid_amount || 0;
      } else {
        villageMap[village].unpaidCount += 1;
      }
    });
    return Object.values(villageMap).sort((a, b) => b.totalCollected - a.totalCollected);
  }

  if (isSupabaseConfigured) {
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data: allDue } = await supabase
      .from('installments')
      .select('customer_id, status, amount, paid_amount')
      .gte('due_date', monthStart)
      .lte('due_date', monthEnd);

    const customerIds = [...new Set((allDue || []).map(i => i.customer_id))];
    const { data: customers } = await supabase
      .from('customers')
      .select('id, village')
      .in('id', customerIds.length ? customerIds : ['none'])
      .eq('isDeleted', false);

    const villageMap = {};
    const custVillage = {};
    (customers || []).forEach(c => { custVillage[c.id] = c.village || 'غير محدد'; });

    (allDue || []).forEach(inst => {
      const village = custVillage[inst.customer_id] || 'غير محدد';
      if (!villageMap[village]) villageMap[village] = { village, paidCount: 0, unpaidCount: 0, totalCollected: 0 };
      if (inst.status === 'paid') {
        villageMap[village].paidCount += 1;
        villageMap[village].totalCollected += inst.amount || 0;
      } else if (inst.status === 'partial') {
        villageMap[village].paidCount += 1;
        villageMap[village].totalCollected += inst.paid_amount || 0;
      } else {
        villageMap[village].unpaidCount += 1;
      }
    });

    return Object.values(villageMap).sort((a, b) => b.totalCollected - a.totalCollected);
  }

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const allInstallmentsSnap = await getDocs(query(collection(db, 'installments'), where('due_date', '>=', monthStart), where('due_date', '<=', monthEnd)));
  const customerIds = new Set();
  const installments = [];
  allInstallmentsSnap.forEach(docSnap => {
    const data = docSnap.data();
    customerIds.add(data.customer_id);
    installments.push(data);
  });
  const customersMap = {};
  for (const cid of customerIds) {
    const custSnap = await getDoc(doc(db, 'customers', cid));
    if (custSnap.exists()) customersMap[cid] = custSnap.data();
  }
  const villageMap = {};
  installments.forEach(inst => {
    const customer = customersMap[inst.customer_id];
    if (!customer) return;
    const village = customer.village || 'غير محدد';
    if (!villageMap[village]) villageMap[village] = { village, paidCount: 0, unpaidCount: 0, totalCollected: 0 };
    if (inst.status === 'paid') {
      villageMap[village].paidCount += 1;
      villageMap[village].totalCollected += inst.amount || 0;
    } else {
      villageMap[village].unpaidCount += 1;
    }
  });
  return Object.values(villageMap).sort((a, b) => b.totalCollected - a.totalCollected);
}

export async function fetchLateCustomers() {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const lateMap = {};
    demoData.installments.filter(i => i.status === 'late').forEach(inst => {
      if (!lateMap[inst.customer_id]) lateMap[inst.customer_id] = { lateCount: 0 };
      lateMap[inst.customer_id].lateCount += 1;
    });
    return Object.entries(lateMap).map(([cid, info]) => {
      const cust = demoData.customers.find(c => c.id === cid);
      return { id: cid, full_name: cust?.full_name || '', phone: cust?.phone || '', village: cust?.village || '', lateCount: info.lateCount };
    }).sort((a, b) => b.lateCount - a.lateCount);
  }

  if (isSupabaseConfigured) {
    const { data: lateInsts } = await supabase
      .from('installments')
      .select('customer_id')
      .eq('status', 'late');

    const lateMap = {};
    (lateInsts || []).forEach(inst => {
      if (!lateMap[inst.customer_id]) lateMap[inst.customer_id] = { lateCount: 0 };
      lateMap[inst.customer_id].lateCount += 1;
    });

    const customerIds = Object.keys(lateMap);
    const results = [];
    for (const cid of customerIds) {
      const { data: cust } = await supabase
        .from('customers')
        .select('id, full_name, phone, village')
        .eq('id', cid)
        .maybeSingle();
      if (cust) {
        results.push({ ...cust, lateCount: lateMap[cid].lateCount });
      }
    }
    return results.sort((a, b) => b.lateCount - a.lateCount);
  }

  const lateSnap = await getDocs(query(collection(db, 'installments'), where('status', '==', 'late')));
  const customerLateMap = {};
  for (const docSnap of lateSnap.docs) {
    const data = docSnap.data();
    if (!customerLateMap[data.customer_id]) customerLateMap[data.customer_id] = { lateCount: 0 };
    customerLateMap[data.customer_id].lateCount += 1;
  }
  const results = [];
  for (const [cid, info] of Object.entries(customerLateMap)) {
    const custSnap = await getDoc(doc(db, 'customers', cid));
    if (custSnap.exists()) {
      const cust = custSnap.data();
      results.push({ id: cid, full_name: cust.full_name, phone: cust.phone, village: cust.village, lateCount: info.lateCount });
    }
  }
  return results.sort((a, b) => b.lateCount - a.lateCount);
}

export async function fetchGrandTotals() {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const paid = demoData.installments.filter(i => i.status === 'paid');
    const partial = demoData.installments.filter(i => i.status === 'partial');
    const unpaid = demoData.installments.filter(i => i.status === 'pending' || i.status === 'late');
    const collectedFromPaid = paid.reduce((s, i) => s + (i.amount || 0), 0);
    const collectedFromPartial = partial.reduce((s, i) => s + (i.paid_amount || 0), 0);
    const remainingFromPartial = partial.reduce((s, i) => s + ((i.amount || 0) - (i.paid_amount || 0)), 0);
    return {
      totalCollected: collectedFromPaid + collectedFromPartial,
      totalOutstanding: unpaid.reduce((s, i) => s + (i.amount || 0), 0) + remainingFromPartial,
    };
  }

  if (isSupabaseConfigured) {
    const { data: all } = await supabase.from('installments').select('status, amount, paid_amount');
    const paid = (all || []).filter(i => i.status === 'paid');
    const partial = (all || []).filter(i => i.status === 'partial');
    const unpaid = (all || []).filter(i => i.status === 'pending' || i.status === 'late');
    const collectedFromPaid = paid.reduce((s, i) => s + (i.amount || 0), 0);
    const collectedFromPartial = partial.reduce((s, i) => s + (i.paid_amount || 0), 0);
    const remainingFromPartial = partial.reduce((s, i) => s + ((i.amount || 0) - (i.paid_amount || 0)), 0);
    return {
      totalCollected: collectedFromPaid + collectedFromPartial,
      totalOutstanding: unpaid.reduce((s, i) => s + (i.amount || 0), 0) + remainingFromPartial,
    };
  }

  const [allPaidSnap, allUnpaidSnap] = await Promise.all([
    getDocs(query(collection(db, 'installments'), where('status', '==', 'paid'))),
    getDocs(query(collection(db, 'installments'), where('status', 'in', ['pending', 'late']))),
  ]);
  let totalCollected = 0;
  allPaidSnap.forEach(docSnap => { totalCollected += docSnap.data().amount || 0; });
  let totalOutstanding = 0;
  allUnpaidSnap.forEach(docSnap => { totalOutstanding += docSnap.data().amount || 0; });
  return { totalCollected, totalOutstanding };
}
