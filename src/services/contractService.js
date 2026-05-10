import { isFirebaseConfigured } from '../firebase/demoMode';
import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData, { getNextDemoId } from '../firebase/demoStore';
import { generateInstallments } from '../utils/installmentUtils';

export async function addContractWithInstallments(contractData, customer) {
  const start = new Date(contractData.start_date);
  const months = Number(contractData.months_count);
  const end = new Date(start.getFullYear(), start.getMonth() + months - 1, 1);

  const contractDoc = {
    customer_id: customer.id,
    customer_name: customer.full_name,
    customer_phone: customer.phone,
    customer_village: customer.village,
    product_name: contractData.product_name,
    total_amount: Number(contractData.total_amount),
    monthly_amount: Number(contractData.monthly_amount),
    months_count: months,
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
    status: 'active',
  };

  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const id = getNextDemoId('contract');
    const newContract = { id, ...contractDoc };
    demoData.contracts.push(newContract);
    const total = Number(contractData.total_amount);
    const monthly = Number(contractData.monthly_amount);
    const installments = generateInstallments(id, customer.id, start, total, monthly, months);
    installments.forEach(inst => {
      const instId = getNextDemoId('inst');
      demoData.installments.push({ id: instId, ...inst });
    });
    return newContract;
  }

  if (isSupabaseConfigured) {
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert(contractDoc)
      .select()
      .single();
    if (contractError) throw contractError;

    const total = Number(contractData.total_amount);
    const monthly = Number(contractData.monthly_amount);
    const instRows = generateInstallments(contract.id, customer.id, start, total, monthly, months);
    const dbInsts = instRows.map(inst => ({
      contract_id: inst.contract_id,
      customer_id: inst.customer_id,
      amount: inst.amount,
      status: 'pending',
      due_date: inst.due_date.toISOString().split('T')[0],
      payment_date: null,
      receipt_id: null,
    }));

    const { error: instError } = await supabase.from('installments').insert(dbInsts);
    if (instError) throw instError;

    return contract;
  }

  const batch = writeBatch(db);
  const contractRef = doc(collection(db, CONTRACTS_COLLECTION));
  batch.set(contractRef, { ...contractDoc, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  const installments = generateInstallments(contractRef.id, customer.id, start, Number(contractData.total_amount), Number(contractData.monthly_amount), months);
  installments.forEach(inst => {
    const instRef = doc(collection(db, INSTALLMENTS_COLLECTION));
    batch.set(instRef, { ...inst, contract_id: contractRef.id, due_date: Timestamp.fromDate(inst.due_date) });
  });
  await batch.commit();
  return { id: contractRef.id, ...contractDoc };
}

export async function getContract(contractId) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    return demoData.contracts.find(c => c.id === contractId) || null;
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  const contractRef = doc(db, CONTRACTS_COLLECTION, contractId);
  const snapshot = await getDoc(contractRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function getContractsByCustomerId(customerId) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    return demoData.contracts.filter(c => c.customer_id === customerId);
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  const q = query(collection(db, CONTRACTS_COLLECTION), where('customer_id', '==', customerId), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getInstallmentsByContractId(contractId) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    return demoData.installments.filter(i => i.contract_id === contractId);
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('contract_id', contractId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(i => ({
      ...i,
      due_date: new Date(i.due_date),
      payment_date: i.payment_date ? new Date(i.payment_date) : null,
    }));
  }
  const q = query(collection(db, INSTALLMENTS_COLLECTION), where('contract_id', '==', contractId), orderBy('due_date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { id: doc.id, ...data, due_date: data.due_date?.toDate?.() || data.due_date };
  });
}

export async function getInstallmentsByCustomerId(customerId) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    return demoData.installments
      .filter(i => i.customer_id === customerId)
      .map(i => ({ ...i, payment_date: i.payment_date || null, receipt_id: i.receipt_id || null }));
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('customer_id', customerId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(i => ({
      ...i,
      due_date: new Date(i.due_date),
      payment_date: i.payment_date ? new Date(i.payment_date) : null,
    }));
  }
  const q = query(collection(db, INSTALLMENTS_COLLECTION), where('customer_id', '==', customerId), orderBy('due_date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      due_date: data.due_date?.toDate?.() || data.due_date,
      payment_date: data.payment_date?.toDate?.() || data.payment_date || null,
    };
  });
}

export async function updateInstallmentStatus(installmentId, status, paymentDate = null) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) {
      demoData.installments[idx].status = status;
      if (paymentDate) demoData.installments[idx].payment_date = paymentDate;
    }
    return;
  }
  if (isSupabaseConfigured) {
    const updates = { status, updated_at: new Date().toISOString() };
    if (paymentDate) updates.payment_date = paymentDate.toISOString();
    const { error } = await supabase
      .from('installments')
      .update(updates)
      .eq('id', installmentId);
    if (error) throw error;
    return;
  }
  const installmentRef = doc(db, INSTALLMENTS_COLLECTION, installmentId);
  await updateDoc(installmentRef, {
    status,
    payment_date: paymentDate ? Timestamp.fromDate(paymentDate) : null,
    updated_at: serverTimestamp(),
  });
}
