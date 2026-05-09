import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isFirebaseConfigured } from '../firebase/demoMode';
import demoData from '../firebase/demoStore';

export async function fetchInstallmentsForCollection(village, month, year) {
  if (!isFirebaseConfigured) {
    return demoData.installments.filter(inst => {
      if (inst.status === 'paid') return false;
      const d = inst.due_date;
      if (!d) return false;
      return d.getMonth() === month && d.getFullYear() === year;
    }).filter(inst => {
      if (!village) return true;
      const customer = demoData.customers.find(c => c.id === inst.customer_id);
      return customer && customer.village === village;
    });
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

export async function markInstallmentAsPaid(installmentId) {
  if (!isFirebaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) {
      demoData.installments[idx].status = 'paid';
      demoData.installments[idx].payment_date = new Date();
    }
    return;
  }
  const ref = doc(db, 'installments', installmentId);
  await updateDoc(ref, { status: 'paid', payment_date: Timestamp.fromDate(new Date()), updated_at: serverTimestamp() });
}

export async function markInstallmentAsLate(installmentId) {
  if (!isFirebaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) demoData.installments[idx].status = 'late';
    return;
  }
  const ref = doc(db, 'installments', installmentId);
  await updateDoc(ref, { status: 'late', updated_at: serverTimestamp() });
}

export async function getAllVillages() {
  if (!isFirebaseConfigured) {
    const villages = new Set();
    demoData.customers.filter(c => !c.isDeleted).forEach(c => {
      if (c.village) villages.add(c.village);
    });
    return Array.from(villages).sort();
  }
  const customersSnap = await getDocs(query(collection(db, 'customers'), where('isDeleted', '==', false)));
  const villages = new Set();
  customersSnap.forEach(docSnap => {
    const v = docSnap.data().village;
    if (v) villages.add(v);
  });
  return Array.from(villages).sort();
}
