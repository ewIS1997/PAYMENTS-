import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData from '../demo/demoStore';

export async function fetchInstallmentsForCollection(village, month, year) {
  if (!isSupabaseConfigured) {
    return demoData.installments.filter(inst => {
      if (inst.status === 'paid' || inst.status === 'partial') return false;
      const d = inst.due_date;
      if (!d) return false;
      return d.getMonth() === month && d.getFullYear() === year;
    }).filter(inst => {
      if (!village) return true;
      const customer = demoData.customers.find(c => c.id === inst.customer_id && !c.isdeleted);
      return customer && customer.village === village;
    });
  }

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { data: installments, error } = await supabase
    .from('installments')
    .select('*')
    .in('status', ['pending', 'late'])
    .gte('due_date', monthStart)
    .lte('due_date', monthEnd);
  if (error) throw error;

  const customerIds = [...new Set((installments || []).map(i => i.customer_id))];
  const { data: customers } = await supabase
    .from('customers')
    .select('id, village')
    .in('id', customerIds.length ? customerIds : ['none'])
    .eq('isdeleted', false);

  const customersMap = {};
  (customers || []).forEach(c => { customersMap[c.id] = c; });

  return (installments || [])
    .filter(inst => {
      const cust = customersMap[inst.customer_id];
      if (!cust) return false;
      if (!village) return true;
      return cust.village === village;
    })
    .map(i => ({
      ...i,
      due_date: new Date(i.due_date),
      payment_date: i.payment_date ? new Date(i.payment_date) : null,
    }));
}

export async function bulkMarkInstallmentsAsPaid(installmentIds) {
  if (!isSupabaseConfigured) {
    let count = 0;
    for (const id of installmentIds) {
      const idx = demoData.installments.findIndex(i => i.id === id);
      if (idx >= 0 && demoData.installments[idx].status !== 'paid') {
        demoData.installments[idx].status = 'paid';
        demoData.installments[idx].payment_date = new Date();
        delete demoData.installments[idx].carryover_from_partial;
        count++;
      }
    }
    return count;
  }
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('installments')
    .update({ status: 'paid', payment_date: now, carryover_from_partial: null, updated_at: now })
    .in('id', installmentIds)
    .neq('status', 'paid');
  if (error) throw error;
  return installmentIds.length;
}

export async function undoMarkInstallmentAsPaid(installmentId) {
  if (!isSupabaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) {
      const inst = demoData.installments[idx];
      const carryover = inst.carryover_from_partial || 0;
      inst.status = 'pending';
      inst.payment_date = null;
      inst.paid_amount = null;
      if (carryover > 0) {
        const nextInstIdx = demoData.installments.findIndex(i =>
          i.contract_id === inst.contract_id &&
          i.id !== installmentId &&
          i.due_date &&
          i.due_date.getTime() > (inst.due_date?.getTime() || 0) &&
          (i.status === 'pending' || i.status === 'late')
        );
        if (nextInstIdx >= 0) {
          const existingCarryover = demoData.installments[nextInstIdx].carryover_from_partial || 0;
          demoData.installments[nextInstIdx].amount -= carryover;
          if (existingCarryover > carryover) {
            demoData.installments[nextInstIdx].carryover_from_partial = existingCarryover - carryover;
          } else {
            delete demoData.installments[nextInstIdx].carryover_from_partial;
          }
        }
      }
      delete inst.carryover_from_partial;
    }
    return;
  }
  const { data: inst } = await supabase
    .from('installments')
    .select('*')
    .eq('id', installmentId)
    .single();
  if (!inst) return;

  const carryover = inst.carryover_from_partial || 0;
  const now = new Date().toISOString();

  await supabase
    .from('installments')
    .update({ status: 'pending', payment_date: null, paid_amount: null, carryover_from_partial: null, updated_at: now })
    .eq('id', installmentId);

  if (carryover > 0) {
    const { data: nextInsts } = await supabase
      .from('installments')
      .select('*')
      .eq('contract_id', inst.contract_id)
      .neq('id', installmentId)
      .gt('due_date', inst.due_date)
      .in('status', ['pending', 'late'])
      .order('due_date', { ascending: true })
      .limit(1);

    if (nextInsts && nextInsts.length > 0) {
      const next = nextInsts[0];
      const existingCO = next.carryover_from_partial || 0;
      const newAmount = (next.amount || 0) - carryover;
      if (existingCO > carryover) {
        await supabase.from('installments').update({ amount: newAmount, carryover_from_partial: existingCO - carryover }).eq('id', next.id);
      } else {
        await supabase.from('installments').update({ amount: newAmount, carryover_from_partial: null }).eq('id', next.id);
      }
    }
  }
}

export async function recordPartialPayment(installmentId, paidAmount) {
  if (!isSupabaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) {
      const inst = demoData.installments[idx];
      const remaining = (inst.amount || 0) - paidAmount;
      inst.paid_amount = paidAmount;
      inst.payment_date = new Date();
      inst.status = 'partial';
      if (remaining > 0) {
        const currentDueDate = inst.due_date;
        const nextInstIdx = demoData.installments.findIndex(i =>
          i.contract_id === inst.contract_id &&
          i.id !== installmentId &&
          i.due_date &&
          i.due_date.getTime() > currentDueDate.getTime() &&
          (i.status === 'pending' || i.status === 'late')
        );
        if (nextInstIdx >= 0) {
          const existingCarryover = demoData.installments[nextInstIdx].carryover_from_partial || 0;
          demoData.installments[nextInstIdx].amount += remaining;
          demoData.installments[nextInstIdx].carryover_from_partial = existingCarryover + remaining;
        }
      }
    }
    return;
  }
  const { data: inst } = await supabase
    .from('installments')
    .select('*')
    .eq('id', installmentId)
    .single();
  if (!inst) return;

  const remaining = (inst.amount || 0) - paidAmount;
  const now = new Date().toISOString();

  await supabase
    .from('installments')
    .update({ paid_amount: paidAmount, status: 'partial', payment_date: now, updated_at: now })
    .eq('id', installmentId);

  if (remaining > 0) {
    const { data: nextInsts } = await supabase
      .from('installments')
      .select('*')
      .eq('contract_id', inst.contract_id)
      .neq('id', installmentId)
      .gt('due_date', inst.due_date)
      .in('status', ['pending', 'late'])
      .order('due_date', { ascending: true })
      .limit(1);

    if (nextInsts && nextInsts.length > 0) {
      const next = nextInsts[0];
      const existingCarryover = next.carryover_from_partial || 0;
      await supabase
        .from('installments')
        .update({
          amount: (next.amount || 0) + remaining,
          carryover_from_partial: existingCarryover + remaining,
        })
        .eq('id', next.id);
    }
  }
}

export async function markInstallmentAsPaid(installmentId) {
  if (!isSupabaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) {
      demoData.installments[idx].status = 'paid';
      demoData.installments[idx].payment_date = new Date();
      delete demoData.installments[idx].carryover_from_partial;
    }
    return;
  }
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('installments')
    .update({ status: 'paid', payment_date: now, carryover_from_partial: null, updated_at: now })
    .eq('id', installmentId);
  if (error) throw error;
}

export async function markInstallmentAsLate(installmentId) {
  if (!isSupabaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) demoData.installments[idx].status = 'late';
    return;
  }
  const { error } = await supabase
    .from('installments')
    .update({ status: 'late', updated_at: new Date().toISOString() })
    .eq('id', installmentId);
  if (error) throw error;
}

export async function getAllVillages() {
  if (!isSupabaseConfigured) {
    const villages = new Set();
    demoData.customers.filter(c => !c.isdeleted).forEach(c => {
      if (c.village) villages.add(c.village);
    });
    return Array.from(villages).sort();
  }
  const { data, error } = await supabase
    .from('customers')
    .select('village')
    .eq('isdeleted', false)
    .not('village', 'is', null);
  if (error) throw error;
  const villages = [...new Set((data || []).map(r => r.village).filter(Boolean))];
  return villages.sort();
}

export async function getCustomerPaymentHistory(customerId) {
  if (!isSupabaseConfigured) {
    return demoData.installments
      .filter(i => i.customer_id === customerId)
      .map(i => {
        const receipt = demoData.receipts.find(r => r.installment_id === i.id);
        return { ...i, receipt_number: receipt?.receipt_number || null };
      })
      .sort((a, b) => {
        const dateA = a.due_date || new Date(0);
        const dateB = b.due_date || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  }
  const { data: installments, error } = await supabase
    .from('installments')
    .select('*')
    .eq('customer_id', customerId)
    .order('due_date', { ascending: false });
  if (error) throw error;

  const result = [];
  for (const inst of (installments || [])) {
    let receiptNumber = null;
    if (inst.receipt_id) {
      const { data: receipt } = await supabase
        .from('receipts')
        .select('receipt_number')
        .eq('id', inst.receipt_id)
        .maybeSingle();
      if (receipt) receiptNumber = receipt.receipt_number;
    }
    result.push({
      ...inst,
      due_date: new Date(inst.due_date),
      payment_date: inst.payment_date ? new Date(inst.payment_date) : null,
      receipt_number: receiptNumber,
    });
  }
  return result;
}
