import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isFirebaseConfigured } from '../firebase/demoMode';
import demoData, { getNextDemoId } from '../firebase/demoStore';

const CUSTOMERS_COLLECTION = 'customers';

export async function addCustomer(customerData) {
  if (!isFirebaseConfigured) {
    const newCustomer = { id: getNextDemoId('cust'), ...customerData, isDeleted: false };
    demoData.customers.push(newCustomer);
    return newCustomer;
  }
  const data = {
    ...customerData,
    isDeleted: false,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), data);
  return { id: docRef.id, ...data };
}

export async function updateCustomer(customerId, customerData) {
  if (!isFirebaseConfigured) {
    const idx = demoData.customers.findIndex(c => c.id === customerId);
    if (idx >= 0) demoData.customers[idx] = { ...demoData.customers[idx], ...customerData };
    return { id: customerId, ...customerData };
  }
  const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
  await updateDoc(customerRef, {
    ...customerData,
    updated_at: serverTimestamp(),
  });
  return { id: customerId, ...customerData };
}

export async function softDeleteCustomer(customerId) {
  if (!isFirebaseConfigured) {
    const idx = demoData.customers.findIndex(c => c.id === customerId);
    if (idx >= 0) demoData.customers[idx].isDeleted = true;
    return;
  }
  const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
  await updateDoc(customerRef, {
    isDeleted: true,
    updated_at: serverTimestamp(),
  });
}

export async function getCustomer(customerId) {
  if (!isFirebaseConfigured) {
    return demoData.customers.find(c => c.id === customerId && !c.isDeleted) || null;
  }
  const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
  const snapshot = await getDoc(customerRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function getAllCustomers() {
  if (!isFirebaseConfigured) {
    return demoData.customers.filter(c => !c.isDeleted);
  }
  const q = query(
    collection(db, CUSTOMERS_COLLECTION),
    where('isDeleted', '==', false),
    orderBy('created_at', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUniqueVillages() {
  if (!isFirebaseConfigured) {
    const villages = new Set();
    demoData.customers.filter(c => !c.isDeleted).forEach(c => {
      if (c.village) villages.add(c.village);
    });
    return Array.from(villages).sort();
  }
  const q = query(
    collection(db, CUSTOMERS_COLLECTION),
    where('isDeleted', '==', false)
  );
  const snapshot = await getDocs(q);
  const villages = new Set();
  snapshot.docs.forEach(doc => {
    const village = doc.data().village;
    if (village) villages.add(village);
  });
  return Array.from(villages).sort();
}
