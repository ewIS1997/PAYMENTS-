import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isFirebaseConfigured } from '../firebase/demoMode';
import demoData, { getNextDemoId } from '../firebase/demoStore';
import { formatReceiptNumber } from '../utils/receiptUtils';

const RECEIPTS_COLLECTION = 'receipts';
const INSTALLMENTS_COLLECTION = 'installments';
const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'app_settings';

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

  if (!isFirebaseConfigured) {
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

  const { receiptNumbers, receiptIds } = await runTransaction(db, async (transaction) => {
    const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const settingsSnap = await transaction.get(settingsRef);

    if (!settingsSnap.exists()) {
      throw new Error('Settings document not found');
    }

    const settingsData = settingsSnap.data();
    let lastNumber = settingsData.last_receipt_number || 0;
    let receiptYear = settingsData.receipt_year || today.getFullYear();
    const prefix = settingsData.receipt_prefix || 'RCPT';

    if (receiptYear !== today.getFullYear()) {
      lastNumber = 0;
      receiptYear = today.getFullYear();
    }

    const newReceipts = [];
    const newReceiptIds = [];

    for (let i = 0; i < count; i++) {
      lastNumber += 1;
      const receiptNumber = formatReceiptNumber(prefix, receiptYear, lastNumber);
      const installment = toGenerate[i];
      const dueDate = installment.due_date?.toDate?.() || installment.due_date;

      const receiptDoc = {
        receipt_number: receiptNumber,
        installment_id: installment.id,
        customer_id: installment.customer_id,
        customer_name: customersMap?.[installment.customer_id]?.full_name || '',
        contract_id: installment.contract_id,
        issue_date: Timestamp.fromDate(today),
        month: dueDate ? dueDate.getMonth() : today.getMonth(),
        year: dueDate ? dueDate.getFullYear() : today.getFullYear(),
        amount: installment.amount,
        printed: false,
        created_at: serverTimestamp(),
      };

      const receiptRef = doc(collection(db, RECEIPTS_COLLECTION));
      transaction.set(receiptRef, receiptDoc);
      const customer = customersMap?.[installment.customer_id] || {};
      const contract = contractsMap?.[installment.contract_id] || {};
      newReceipts.push({
        ...receiptDoc,
        id: receiptRef.id,
        customer: { full_name: customer.full_name || '', phone: customer.phone || '', village: customer.village || '', address: customer.address || '' },
        contract: { product_name: contract.product_name || '' },
      });
      newReceiptIds.push(receiptRef.id);
    }

    transaction.update(settingsRef, { last_receipt_number: lastNumber, receipt_year: receiptYear });

    for (let i = 0; i < toGenerate.length; i++) {
      const instRef = doc(db, INSTALLMENTS_COLLECTION, toGenerate[i].id);
      transaction.update(instRef, { receipt_id: newReceiptIds[i], updated_at: serverTimestamp() });
    }

    return { receiptNumbers: newReceipts, receiptIds: newReceiptIds };
  });

  return { alreadyReceipted, generated: receiptNumbers, receiptIds };
}

export async function getReceiptsBySearch(searchTerm) {
  if (!isFirebaseConfigured) {
    const lowerTerm = searchTerm.toLowerCase();
    return demoData.receipts.filter(r =>
      r.receipt_number?.toLowerCase().includes(lowerTerm) ||
      r.customer_name?.toLowerCase().includes(lowerTerm)
    );
  }
  const allReceiptsSnap = await getDocs(query(collection(db, RECEIPTS_COLLECTION)));
  const lowerTerm = searchTerm.toLowerCase();
  const results = [];
  for (const docSnap of allReceiptsSnap.docs) {
    const data = docSnap.data();
    const matchesReceiptNumber = data.receipt_number?.toLowerCase().includes(lowerTerm);
    const matchesCustomerName = data.customer_name?.toLowerCase().includes(lowerTerm);
    if (matchesReceiptNumber || matchesCustomerName) {
      results.push({ id: docSnap.id, ...data });
    }
  }
  return results;
}

export async function getReceiptData(receiptId) {
  if (!isFirebaseConfigured) {
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
  const receiptRef = doc(db, RECEIPTS_COLLECTION, receiptId);
  const receiptSnap = await getDoc(receiptRef);
  if (!receiptSnap.exists()) return null;

  const receipt = { id: receiptSnap.id, ...receiptSnap.data() };
  const [customerSnap, contractSnap] = await Promise.all([
    getDoc(doc(db, 'customers', receipt.customer_id)),
    getDoc(doc(db, 'contracts', receipt.contract_id)),
  ]);

  return {
    receipt,
    customer: customerSnap.exists() ? { id: customerSnap.id, ...customerSnap.data() } : null,
    contract: contractSnap.exists() ? { id: contractSnap.id, ...contractSnap.data() } : null,
  };
}
