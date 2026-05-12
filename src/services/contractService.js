import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData, { getNextDemoId } from '../demo/demoStore';
import { generateInstallments } from '../utils/installmentUtils';
import { formatLocalDateString, parseLocalDate } from '../utils/dateUtils';
import { generateReceipts } from './receiptService';

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
    start_date: formatLocalDateString(start),
    end_date: formatLocalDateString(end),
    status: 'active',
  };

  if (!isSupabaseConfigured) {
    const id = getNextDemoId('contract');
    const newContract = { id, ...contractDoc };
    demoData.contracts.push(newContract);
    const total = Number(contractData.total_amount);
    const monthly = Number(contractData.monthly_amount);
    const installments = generateInstallments(id, customer.id, start, total, monthly, months);
    const instsWithIds = [];
    installments.forEach(inst => {
      const instId = getNextDemoId('inst');
      const newInst = { id: instId, ...inst };
      demoData.installments.push(newInst);
      instsWithIds.push(newInst);
    });
    if (instsWithIds.length > 0) {
      const customersMap = { [customer.id]: customer };
      const contractsMap = { [id]: newContract };
      await generateReceipts(instsWithIds, customersMap, contractsMap);
    }
    return newContract;
  }

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
    due_date: formatLocalDateString(inst.due_date),
    payment_date: null,
    receipt_id: null,
  }));

  const { data: insertedInsts, error: instError } = await supabase.from('installments').insert(dbInsts).select();
  if (instError) throw instError;

  if (insertedInsts && insertedInsts.length > 0) {
    const customersMap = { [customer.id]: customer };
    const contractsMap = { [contract.id]: contract };
    await generateReceipts(insertedInsts, customersMap, contractsMap);
  }

  return contract;
}

export async function getContract(contractId) {
  if (!isSupabaseConfigured) {
    return demoData.contracts.find(c => c.id === contractId) || null;
  }
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getContractsByCustomerId(customerId) {
  if (!isSupabaseConfigured) {
    return demoData.contracts.filter(c => c.customer_id === customerId);
  }
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getInstallmentsByContractId(contractId) {
  if (!isSupabaseConfigured) {
    return demoData.installments.filter(i => i.contract_id === contractId);
  }
  const { data, error } = await supabase
    .from('installments')
    .select('*')
    .eq('contract_id', contractId)
    .order('due_date', { ascending: true });
  if (error) throw error;
    return (data || []).map(i => ({
    ...i,
    due_date: parseLocalDate(i.due_date),
    payment_date: i.payment_date ? new Date(i.payment_date) : null,
  }));
}

export async function getInstallmentsByCustomerId(customerId) {
  if (!isSupabaseConfigured) {
    return demoData.installments
      .filter(i => i.customer_id === customerId)
      .map(i => ({ ...i, payment_date: i.payment_date || null, receipt_id: i.receipt_id || null }));
  }
  const { data, error } = await supabase
    .from('installments')
    .select('*')
    .eq('customer_id', customerId)
    .order('due_date', { ascending: true });
  if (error) throw error;
    return (data || []).map(i => ({
      ...i,
      due_date: parseLocalDate(i.due_date),
      payment_date: i.payment_date ? new Date(i.payment_date) : null,
    }));
}

export async function updateInstallmentStatus(installmentId, status, paymentDate = null) {
  if (!isSupabaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) {
      demoData.installments[idx].status = status;
      if (paymentDate) demoData.installments[idx].payment_date = paymentDate;
    }
    return;
  }
  const updates = { status, updated_at: new Date().toISOString() };
  if (paymentDate) updates.payment_date = formatLocalDateString(paymentDate);
  const { error } = await supabase
    .from('installments')
    .update(updates)
    .eq('id', installmentId);
  if (error) throw error;
}
