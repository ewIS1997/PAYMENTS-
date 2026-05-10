import { isFirebaseConfigured } from '../firebase/demoMode';
import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData from '../firebase/demoStore';

export async function fetchInstallmentsForCollection(village, month, year) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    return demoData.installments.filter(inst => {
      if (inst.status === 'paid' || inst.status === 'partial') return false;
      const d = inst.due_date;
      if (!d) return false;
      return d.getMonth() === month && d.getFullYear() === year;
    }).filter(inst => {
      if (!village) return true;
      const customer = demoData.customers.find(c => c.id === inst.customer_id && !c.isDeleted);
      return customer && customer.village === village;
    });
  }

  if (isSupabaseConfigured) {
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
      .eq('isDeleted', false);

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

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const installmentsSnap = await getDocs(
    query(collection(db, 'installments'), where('due_date', '>=', monthStart), where('due_date', '<=', monthEnd), where('status', 'in', ['pending', 'late']))
  );
  const customerIds = new Set();
  const installments = [];
  installmentsSnap.forEach(docSnap => {
    const data = docSnap.data();
    customerIds.add(data.customer_id);
    installments.push({ id: docSnap.id, ...data, due_date: data.due_date?.toDate?.() || data.due_date });
  });
  const customersMap = {};
  for (const customerId of customerIds) {
    const customerSnap = await getDoc(doc(db, 'customers', customerId));
    if (customerSnap.exists()) {
      const customerData = customerSnap.data();
      if (!village || customerData.village === village) {
        customersMap[customerId] = customerData;
      }
    }
  }
  return installments.filter(inst => customersMap[inst.customer_id]);
}

export async function bulkMarkInstallmentsAsPaid(installmentIds) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
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
  if (isSupabaseConfigured) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('installments')
      .update({ status: 'paid', payment_date: now, carryover_from_partial: null, updated_at: now })
      .in('id', installmentIds)
      .neq('status', 'paid');
    if (error) throw error;
    return installmentIds.length;
  }
  let count = 0;
  for (const id of installmentIds) {
    const ref = doc(db, 'installments', id);
    try {
      await updateDoc(ref, { status: 'paid', payment_date: Timestamp.fromDate(new Date()), updated_at: serverTimestamp() });
      count++;
    } catch (e) {
      console.error('Error marking installment as paid:', e);
    }
  }
  return count;
}

export async function undoMarkInstallmentAsPaid(installmentId) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
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
  if (isSupabaseConfigured) {
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
    return;
  }

  const instSnap = await getDoc(doc(db, 'installments', installmentId));
  const instData = instSnap.data();
  const carryover = instData.carryover_from_partial || 0;
  const ref = doc(db, 'installments', installmentId);
  await updateDoc(ref, { status: 'pending', payment_date: null, paid_amount: null, updated_at: serverTimestamp() });
  if (carryover > 0) {
    const currentDueDate = instData.due_date;
    const nextSnap = await getDocs(query(
      collection(db, 'installments'),
      where('contract_id', '==', instData.contract_id),
      where('due_date', '>', currentDueDate),
      where('status', 'in', ['pending', 'late'])
    ));
    if (!nextSnap.empty) {
      const nextDoc = nextSnap.docs[0];
      const nextData = nextDoc.data();
      await updateDoc(doc(db, 'installments', nextDoc.id), {
        amount: (nextData.amount || 0) - carryover,
      });
    }
  }
}

export async function recordPartialPayment(installmentId, paidAmount) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
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
  if (isSupabaseConfigured) {
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
    return;
  }

  const instSnap = await getDoc(doc(db, 'installments', installmentId));
  const instData = instSnap.data();
  const remaining = (instData.amount || 0) - paidAmount;
  const ref = doc(db, 'installments', installmentId);
  await updateDoc(ref, { paid_amount: paidAmount, status: 'partial', payment_date: Timestamp.fromDate(new Date()), updated_at: serverTimestamp() });
  if (remaining > 0) {
    const currentDueDate = instData.due_date;
    const nextSnap = await getDocs(query(
      collection(db, 'installments'),
      where('contract_id', '==', instData.contract_id),
      where('due_date', '>', currentDueDate),
      where('status', 'in', ['pending', 'late'])
    ));
    if (!nextSnap.empty) {
      const nextDoc = nextSnap.docs[0];
      const nextData = nextDoc.data();
      const existingCarryover = nextData.carryover_from_partial || 0;
      await updateDoc(doc(db, 'installments', nextDoc.id), {
        amount: (nextData.amount || 0) + remaining,
        carryover_from_partial: existingCarryover + remaining,
      });
    }
  }
}

export async function markInstallmentAsPaid(installmentId) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) {
      demoData.installments[idx].status = 'paid';
      demoData.installments[idx].payment_date = new Date();
      delete demoData.installments[idx].carryover_from_partial;
    }
    return;
  }
  if (isSupabaseConfigured) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('installments')
      .update({ status: 'paid', payment_date: now, carryover_from_partial: null, updated_at: now })
      .eq('id', installmentId);
    if (error) throw error;
    return;
  }
  const ref = doc(db, 'installments', installmentId);
  await updateDoc(ref, { status: 'paid', payment_date: Timestamp.fromDate(new Date()), updated_at: serverTimestamp(), carryover_from_partial: null });
}

export async function markInstallmentAsLate(installmentId) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) demoData.installments[idx].status = 'late';
    return;
  }
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('installments')
      .update({ status: 'late', updated_at: new Date().toISOString() })
      .eq('id', installmentId);
    if (error) throw error;
    return;
  }
  const ref = doc(db, 'installments', installmentId);
  await updateDoc(ref, { status: 'late', updated_at: serverTimestamp() });
}

export async function getAllVillages() {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const villages = new Set();
    demoData.customers.filter(c => !c.isDeleted).forEach(c => {
      if (c.village) villages.add(c.village);
    });
    return Array.from(villages).sort();
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('customers')
      .select('village')
      .eq('isDeleted', false)
      .not('village', 'is', null);
    if (error) throw error;
    const villages = [...new Set((data || []).map(r => r.village).filter(Boolean))];
    return villages.sort();
  }
  const customersSnap = await getDocs(query(collection(db, 'customers'), where('isDeleted', '==', false)));
  const villages = new Set();
  customersSnap.forEach(docSnap => {
    const v = docSnap.data().village;
    if (v) villages.add(v);
  });
  return Array.from(villages).sort();
}

export async function getCustomerPaymentHistory(customerId) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
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
  if (isSupabaseConfigured) {
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

  const installmentsSnap = await getDocs(query(collection(db, 'installments'), where('customer_id', '==', customerId)));
  const installments = [];
  for (const docSnap of installmentsSnap.docs) {
    const data = docSnap.data();
    installments.push({
      id: docSnap.id,
      ...data,
      due_date: data.due_date?.toDate?.() || data.due_date,
      payment_date: data.payment_date?.toDate?.() || data.payment_date,
    });
  }
  const result = [];
  for (const inst of installments) {
    let receiptNumber = null;
    if (inst.receipt_id) {
      const receiptSnap = await getDoc(doc(db, 'receipts', inst.receipt_id));
      if (receiptSnap.exists()) {
        receiptNumber = receiptSnap.data().receipt_number;
      }
    }
    result.push({ ...inst, receipt_number: receiptNumber });
  }
  return result.sort((a, b) => {
    const dateA = a.due_date || new Date(0);
    const dateB = b.due_date || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
}
