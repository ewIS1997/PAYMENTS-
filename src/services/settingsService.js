import { isFirebaseConfigured } from '../firebase/demoMode';
import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData from '../firebase/demoStore';

export async function initializeSettings() {
  if (!isFirebaseConfigured && !isSupabaseConfigured) return;
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('settings')
      .select('id')
      .eq('id', 'app_settings')
      .maybeSingle();
    if (!data) {
      await supabase.from('settings').insert({
        id: 'app_settings',
        shop_name: '',
        logo_url: '',
        show_logo: true,
        last_receipt_number: 0,
        receipt_prefix: 'RCPT',
        receipt_year: new Date().getFullYear(),
      });
    }
    return;
  }
  const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
  const settingsSnap = await getDoc(settingsRef);
  if (!settingsSnap.exists()) {
    await setDoc(settingsRef, {
      shop_name: '',
      logo_url: '',
      show_logo: true,
      last_receipt_number: 0,
      receipt_prefix: 'RCPT',
      receipt_year: new Date().getFullYear(),
    });
  }
}

export async function getSettings() {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    return { ...demoData.settings };
  }
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'app_settings')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      await initializeSettings();
      const { data: newData } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'app_settings')
        .single();
      return newData;
    }
    return data;
  }
  const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
  const settingsSnap = await getDoc(settingsRef);
  if (!settingsSnap.exists()) {
    await initializeSettings();
    const newSnap = await getDoc(settingsRef);
    return newSnap.data();
  }
  return settingsSnap.data();
}

export async function updateSettings(data) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    Object.assign(demoData.settings, data);
    return;
  }
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('settings')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', 'app_settings');
    if (error) throw error;
    return;
  }
  const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
  await updateDoc(settingsRef, data);
}

export async function uploadLogo(file) {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
  if (isSupabaseConfigured) {
    const fileExt = file.name.split('.').pop();
    const fileName = `logos/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('logos').upload(fileName, file);
    if (error) throw error;
    const { data: publicUrl } = supabase.storage.from('logos').getPublicUrl(fileName);
    return publicUrl.publicUrl;
  }
  const storageRef = ref(storage, `logos/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function resetReceiptSequence() {
  if (!isFirebaseConfigured && !isSupabaseConfigured) {
    demoData.settings.last_receipt_number = 0;
    demoData.settings.receipt_year = new Date().getFullYear();
    return;
  }
  if (isSupabaseConfigured) {
    await supabase
      .from('settings')
      .update({ last_receipt_number: 0, receipt_year: new Date().getFullYear() })
      .eq('id', 'app_settings');
    return;
  }
  const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
  await updateDoc(settingsRef, { last_receipt_number: 0, receipt_year: new Date().getFullYear() });
}
