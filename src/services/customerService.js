import { isFirebaseConfigured } from '../firebase/demoMode';
import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData, { getNextDemoId } from '../firebase/demoStore';

export async function addCustomer(customerData) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const newCustomer = { id: getNextDemoId('cust'), ...customerData, isDeleted: false };
    demoData.customers.push(newCustomer);
    return newCustomer;
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        full_name: customerData.full_name,
        phone: customerData.phone,
        second_phone: customerData.second_phone || '',
        village: customerData.village,
        national_id: customerData.national_id || '',
        address: customerData.address || '',
        notes: customerData.notes || '',
        photo: customerData.photo || '',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const data = { ...customerData, isDeleted: false, created_at: serverTimestamp(), updated_at: serverTimestamp() };
  const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), data);
  return { id: docRef.id, ...data };
}

export async function updateCustomer(customerId, customerData) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const idx = demoData.customers.findIndex(c => c.id === customerId);
    if (idx >= 0) demoData.customers[idx] = { ...demoData.customers[idx], ...customerData };
    return { id: customerId, ...customerData };
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('customers')
      .update({ ...customerData, updated_at: new Date().toISOString() })
      .eq('id', customerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
  await updateDoc(customerRef, { ...customerData, updated_at: serverTimestamp() });
  return { id: customerId, ...customerData };
}

export async function softDeleteCustomer(customerId) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const idx = demoData.customers.findIndex(c => c.id === customerId);
    if (idx >= 0) demoData.customers[idx].isDeleted = true;
    return;
  }
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('customers')
      .update({ isDeleted: true, updated_at: new Date().toISOString() })
      .eq('id', customerId);
    if (error) throw error;
    return;
  }
  const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
  await updateDoc(customerRef, { isDeleted: true, updated_at: serverTimestamp() });
}

export async function getCustomer(customerId) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    return demoData.customers.find(c => c.id === customerId && !c.isDeleted) || null;
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('isDeleted', false)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
  const snapshot = await getDoc(customerRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (data.isDeleted) return null;
  return { id: snapshot.id, ...data };
}

export async function getAllCustomers() {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    return demoData.customers.filter(c => !c.isDeleted);
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('isDeleted', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  const q = query(collection(db, CUSTOMERS_COLLECTION), where('isDeleted', '==', false), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUniqueVillages() {
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
  const q = query(collection(db, CUSTOMERS_COLLECTION), where('isDeleted', '==', false));
  const snapshot = await getDocs(q);
  const villages = new Set();
  snapshot.docs.forEach(doc => {
    const village = doc.data().village;
    if (village) villages.add(village);
  });
  return Array.from(villages).sort();
}

export async function findPotentialDuplicates(phoneNumber) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    const similarPhone = phoneNumber.slice(-7);
    return demoData.customers.filter(c => {
      if (c.isDeleted) return false;
      if (!c.phone) return false;
      return c.phone.slice(-7) === similarPhone;
    });
  }
  if (isSupabaseConfigured) {
    const similarPhone = phoneNumber.slice(-7);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('isDeleted', false);
    if (error) throw error;
    return (data || []).filter(c => c.phone && c.phone.slice(-7) === similarPhone);
  }
  const q = query(collection(db, CUSTOMERS_COLLECTION), where('isDeleted', '==', false));
  const snapshot = await getDocs(q);
  const similarPhone = phoneNumber.slice(-7);
  const results = [];
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.phone && data.phone.slice(-7) === similarPhone) {
      results.push({ id: doc.id, ...data });
    }
  });
  return results;
}
