import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isFirebaseConfigured } from '../firebase/demoMode';
import demoData, { getNextDemoId } from '../firebase/demoStore';
import { generateInstallments } from '../utils/installmentUtils';

const CONTRACTS_COLLECTION = 'contracts';
const INSTALLMENTS_COLLECTION = 'installments';

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
    start_date: start,
    end_date: end,
    status: 'active',
  };

  if (!isFirebaseConfigured) {
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
  if (!isFirebaseConfigured) {
    return demoData.contracts.find(c => c.id === contractId) || null;
  }
  const contractRef = doc(db, CONTRACTS_COLLECTION, contractId);
  const snapshot = await getDoc(contractRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function getContractsByCustomerId(customerId) {
  if (!isFirebaseConfigured) {
    return demoData.contracts.filter(c => c.customer_id === customerId);
  }
  const q = query(collection(db, CONTRACTS_COLLECTION), where('customer_id', '==', customerId), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getInstallmentsByContractId(contractId) {
  if (!isFirebaseConfigured) {
    return demoData.installments.filter(i => i.contract_id === contractId);
  }
  const q = query(collection(db, INSTALLMENTS_COLLECTION), where('contract_id', '==', contractId), orderBy('due_date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { id: doc.id, ...data, due_date: data.due_date?.toDate?.() || data.due_date };
  });
}

export async function getInstallmentsByCustomerId(customerId) {
  if (!isFirebaseConfigured) {
    return demoData.installments
      .filter(i => i.customer_id === customerId)
      .map(i => ({
        ...i,
        payment_date: i.payment_date || null,
        receipt_id: i.receipt_id || null,
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
  if (!isFirebaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) {
      demoData.installments[idx].status = status;
      if (paymentDate) demoData.installments[idx].payment_date = paymentDate;
    }
    return;
  }
  const installmentRef = doc(db, INSTALLMENTS_COLLECTION, installmentId);
  await updateDoc(installmentRef, {
    status,
    payment_date: paymentDate ? Timestamp.fromDate(paymentDate) : null,
    updated_at: serverTimestamp(),
  });
}
