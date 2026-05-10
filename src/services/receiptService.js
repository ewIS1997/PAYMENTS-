import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData, { getNextDemoId } from '../demo/demoStore';
import { formatReceiptNumber } from '../utils/receiptUtils';

export async function generateReceipts(selectedInstallments, customersMap, contractsMap) {
  const alreadyReceipted = [];
  const toGenerate = [];

  for (const inst of selectedInstallments) {
    if (inst.receipt_id) {
      alreadyReceipted.push(inst);
    } else {
      toGenerate.push(inst);
    }
  }

  const today = new Date();
  const count = toGenerate.length;

  if (count === 0) {
    return { alreadyReceipted, generated: [], receiptIds: [] };
  }

  if (!isSupabaseConfigured) {
    demoData.settings.last_receipt_number += count;
    const generated = toGenerate.map((inst, i) => {
      const seq = demoData.settings.last_receipt_number - count + i + 1;
      const dueDate = inst.due_date?.toDate?.() || inst.due_date;
      const customer = customersMap?.[inst.customer_id] || {};
      const contract = contractsMap?.[inst.contract_id] || {};
      const receiptObj = {
        id: getNextDemoId('receipt'),
        receipt_number: formatReceiptNumber('RCPT', today.getFullYear(), seq),
        installment_id: inst.id,
        customer_id: inst.customer_id,
        customer_name: customer.full_name || '',
        contract_id: inst.contract_id,
        issue_date: today,
        month: dueDate ? dueDate.getMonth() : today.getMonth(),
        year: dueDate ? dueDate.getFullYear() : today.getFullYear(),
        amount: inst.paid_amount || inst.amount,
        customer: { full_name: customer.full_name || '', phone: customer.phone || '', village: customer.village || '', address: customer.address || '' },
        contract: { product_name: contract.product_name || '' },
      };
      demoData.receipts.push(receiptObj);
      const instIdx = demoData.installments.findIndex(di => di.id === inst.id);
      if (instIdx >= 0) demoData.installments[instIdx].receipt_id = receiptObj.id;
      return receiptObj;
    });
    return { alreadyReceipted, generated, receiptIds: generated.map(r => r.id) };
  }

  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'app_settings')
    .single();

  if (!settings) throw new Error('Settings not found');

  let lastNumber = settings.last_receipt_number || 0;
  let receiptYear = settings.receipt_year || today.getFullYear();
  const prefix = settings.receipt_prefix || 'RCPT';

  if (receiptYear !== today.getFullYear()) {
    lastNumber = 0;
    receiptYear = today.getFullYear();
  }

  lastNumber += count;
  const receiptDocs = toGenerate.map((inst, i) => {
    const seq = lastNumber - count + i + 1;
    const dueDate = inst.due_date?.toDate?.() || inst.due_date;
    return {
      receipt_number: formatReceiptNumber(prefix, receiptYear, seq),
      installment_id: inst.id,
      customer_id: inst.customer_id,
      customer_name: customersMap?.[inst.customer_id]?.full_name || '',
      contract_id: inst.contract_id,
      issue_date: today.toISOString(),
      month: dueDate ? dueDate.getMonth() : today.getMonth(),
      year: dueDate ? dueDate.getFullYear() : today.getFullYear(),
      amount: inst.paid_amount || inst.amount,
      printed: false,
    };
  });

  const { data: newReceipts, error: insertError } = await supabase
    .from('receipts')
    .insert(receiptDocs)
    .select();
  if (insertError) throw insertError;

  const now = new Date().toISOString();
  for (const receipt of newReceipts) {
    const installment = toGenerate.find(inst => inst.id === receipt.installment_id);
    const customer = customersMap?.[installment?.customer_id] || {};
    const contract = contractsMap?.[installment?.contract_id] || {};

    await supabase
      .from('installments')
      .update({ receipt_id: receipt.id, updated_at: now })
      .eq('id', receipt.installment_id);
  }

  const newReceiptIds = newReceipts.map(r => r.id);
  const enriched = newReceipts.map(r => {
    const inst = toGenerate.find(i => i.id === r.installment_id);
    const customer = customersMap?.[inst?.customer_id] || {};
    const contract = contractsMap?.[inst?.contract_id] || {};
    return {
      ...r,
      customer: { full_name: customer.full_name || '', phone: customer.phone || '', village: customer.village || '', address: customer.address || '' },
      contract: { product_name: contract.product_name || '' },
    };
  });

  await supabase
    .from('settings')
    .update({ last_receipt_number: lastNumber, receipt_year: receiptYear })
    .eq('id', 'app_settings');

  return { alreadyReceipted, generated: newReceipts, receiptIds: newReceiptIds };
}

export async function getReceiptsBySearch(searchTerm) {
  if (!isSupabaseConfigured) {
    const lowerTerm = searchTerm.toLowerCase();
    return demoData.receipts.filter(r =>
      r.receipt_number?.toLowerCase().includes(lowerTerm) ||
      r.customer_name?.toLowerCase().includes(lowerTerm)
    );
  }
  const term = searchTerm.toLowerCase();
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .or(`receipt_number.ilike.%${term}%,customer_name.ilike.%${term}%`)
    .order('issue_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getReceiptData(receiptId) {
  if (!isSupabaseConfigured) {
    const receipt = demoData.receipts.find(r => r.id === receiptId);
    if (!receipt) return null;
    const customer = demoData.customers.find(c => c.id === receipt.customer_id);
    const contract = demoData.contracts.find(c => c.id === receipt.contract_id);
    return {
      receipt,
      customer: customer ? { id: customer.id, ...customer } : null,
      contract: contract ? { id: contract.id, ...contract } : null,
    };
  }
  const { data: receipt, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', receiptId)
    .maybeSingle();
  if (error) throw error;
  if (!receipt) return null;

  const [{ data: customer }, { data: contract }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', receipt.customer_id).maybeSingle(),
    supabase.from('contracts').select('*').eq('id', receipt.contract_id).maybeSingle(),
  ]);

  return { receipt, customer, contract };
}
