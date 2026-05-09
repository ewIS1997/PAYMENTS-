import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isFirebaseConfigured } from '../firebase/demoMode';
import demoData, { getNextDemoId } from '../firebase/demoStore';

const PRODUCTS_COLLECTION = 'products';

export async function addProduct(productData) {
  if (!isFirebaseConfigured) {
    const newProduct = {
      id: getNextDemoId('prod'),
      ...productData,
      isDeleted: false,
    };
    demoData.products.push(newProduct);
    return newProduct;
  }
  const data = {
    ...productData,
    isDeleted: false,
    created_at: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), data);
  return { id: docRef.id, ...data };
}

export async function updateProduct(productId, productData) {
  if (!isFirebaseConfigured) {
    const idx = demoData.products.findIndex(p => p.id === productId);
    if (idx >= 0) demoData.products[idx] = { ...demoData.products[idx], ...productData };
    return { id: productId, ...productData };
  }
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(productRef, {
    ...productData,
    updated_at: serverTimestamp(),
  });
  return { id: productId, ...productData };
}

export async function softDeleteProduct(productId) {
  if (!isFirebaseConfigured) {
    const idx = demoData.products.findIndex(p => p.id === productId);
    if (idx >= 0) demoData.products[idx].isDeleted = true;
    return;
  }
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(productRef, { isDeleted: true, updated_at: serverTimestamp() });
}

export async function getAllProducts() {
  if (!isFirebaseConfigured) {
    return demoData.products.filter(p => !p.isDeleted);
  }
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('isDeleted', '==', false),
    orderBy('name', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getProductsByCategory(category) {
  if (!isFirebaseConfigured) {
    return demoData.products.filter(p => !p.isDeleted && p.category === category);
  }
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('isDeleted', '==', false),
    where('category', '==', category),
    orderBy('name', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUniqueCategories() {
  if (!isFirebaseConfigured) {
    const cats = new Set();
    demoData.products.filter(p => !p.isDeleted).forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('isDeleted', '==', false)
  );
  const snapshot = await getDocs(q);
  const cats = new Set();
  snapshot.docs.forEach(doc => {
    const cat = doc.data().category;
    if (cat) cats.add(cat);
  });
  return Array.from(cats).sort();
}
