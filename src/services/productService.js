import { isFirebaseConfigured } from '../firebase/demoMode';
import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData, { getNextDemoId } from '../firebase/demoStore';

export async function addProduct(productData) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const newProduct = { id: getNextDemoId('prod'), ...productData, isDeleted: false };
    demoData.products.push(newProduct);
    return newProduct;
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('products')
      .insert({ name: productData.name, category: productData.category, default_price: productData.default_price })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const data = { ...productData, isDeleted: false, created_at: serverTimestamp() };
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), data);
  return { id: docRef.id, ...data };
}

export async function updateProduct(productId, productData) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const idx = demoData.products.findIndex(p => p.id === productId);
    if (idx >= 0) demoData.products[idx] = { ...demoData.products[idx], ...productData };
    return { id: productId, ...productData };
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(productRef, { ...productData, updated_at: serverTimestamp() });
  return { id: productId, ...productData };
}

export async function softDeleteProduct(productId) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const idx = demoData.products.findIndex(p => p.id === productId);
    if (idx >= 0) demoData.products[idx].isDeleted = true;
    return;
  }
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('products')
      .update({ isDeleted: true })
      .eq('id', productId);
    if (error) throw error;
    return;
  }
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(productRef, { isDeleted: true, updated_at: serverTimestamp() });
}

export async function getAllProducts() {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    return demoData.products.filter(p => !p.isDeleted);
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('isDeleted', false)
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  }
  const q = query(collection(db, PRODUCTS_COLLECTION), where('isDeleted', '==', false), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getProductsByCategory(category) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    return demoData.products.filter(p => !p.isDeleted && p.category === category);
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('isDeleted', false)
      .eq('category', category)
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  }
  const q = query(collection(db, PRODUCTS_COLLECTION), where('isDeleted', '==', false), where('category', '==', category), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUniqueCategories() {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const cats = new Set();
    demoData.products.filter(p => !p.isDeleted).forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('isDeleted', false)
      .not('category', 'is', null);
    if (error) throw error;
    const cats = [...new Set((data || []).map(r => r.category).filter(Boolean))];
    return cats.sort();
  }
  const q = query(collection(db, PRODUCTS_COLLECTION), where('isDeleted', '==', false));
  const snapshot = await getDocs(q);
  const cats = new Set();
  snapshot.docs.forEach(doc => {
    const cat = doc.data().category;
    if (cat) cats.add(cat);
  });
  return Array.from(cats).sort();
}
