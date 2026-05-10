import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData from '../demo/demoStore';

export async function initializeSettings() {
  if (!isSupabaseConfigured) return;
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
}

export async function getSettings() {
  if (!isSupabaseConfigured) {
    return { ...demoData.settings };
  }
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

export async function updateSettings(data) {
  if (!isSupabaseConfigured) {
    Object.assign(demoData.settings, data);
    return;
  }
  const { error } = await supabase
    .from('settings')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', 'app_settings');
  if (error) throw error;
}

export async function uploadLogo(file) {
  if (!isSupabaseConfigured) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
  const fileExt = file.name.split('.').pop();
  const fileName = `logos/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const { error } = await supabase.storage.from('logos').upload(fileName, file);
  if (error) throw error;
  const { data: publicUrl } = supabase.storage.from('logos').getPublicUrl(fileName);
  return publicUrl.publicUrl;
}

export async function resetReceiptSequence() {
  if (!isSupabaseConfigured) {
    demoData.settings.last_receipt_number = 0;
    demoData.settings.receipt_year = new Date().getFullYear();
    return;
  }
  await supabase
    .from('settings')
    .update({ last_receipt_number: 0, receipt_year: new Date().getFullYear() })
    .eq('id', 'app_settings');
}
