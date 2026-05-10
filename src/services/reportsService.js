import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData from '../demo/demoStore';
import { formatLocalDateString } from '../utils/dateUtils';

export async function fetchMonthlyReport(month, year) {
  if (!isSupabaseConfigured) {
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

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEnd = formatLocalDateString(new Date(year, month + 1, 0));

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

export async function fetchVillageBreakdown(month, year) {
  if (!isSupabaseConfigured) {
    const relevant = demoData.installments.filter(inst => {
      const d = inst.due_date;
      return d && d.getMonth() === month && d.getFullYear() === year;
    });
    const villageMap = {};
    relevant.forEach(inst => {
      const customer = demoData.customers.find(c => c.id === inst.customer_id && !c.isdeleted);
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

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEnd = formatLocalDateString(new Date(year, month + 1, 0));

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
    .eq('isdeleted', false);

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

export async function fetchLateCustomers() {
  if (!isSupabaseConfigured) {
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
  const { data: custs } = await supabase
    .from('customers')
    .select('id, full_name, phone, village')
    .in('id', customerIds.length ? customerIds : ['none']);
  const custMap = {};
  (custs || []).forEach(c => { custMap[c.id] = c; });
  return customerIds.map(cid => {
    const cust = custMap[cid];
    return { id: cid, full_name: cust?.full_name || '', phone: cust?.phone || '', village: cust?.village || '', lateCount: lateMap[cid].lateCount };
  }).sort((a, b) => b.lateCount - a.lateCount);
}

export async function fetchGrandTotals() {
  if (!isSupabaseConfigured) {
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

  const { data, error } = await supabase.rpc('get_grand_totals');
  if (error) throw error;
  return data;
}
