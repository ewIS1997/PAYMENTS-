import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData, { getNextDemoId } from '../demo/demoStore';

export async function addCustomer(customerData) {
  if (!isSupabaseConfigured) {
    const newCustomer = { id: getNextDemoId('cust'), ...customerData, isdeleted: false };
    demoData.customers.push(newCustomer);
    return newCustomer;
  }
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

export async function updateCustomer(customerId, customerData) {
  if (!isSupabaseConfigured) {
    const idx = demoData.customers.findIndex(c => c.id === customerId);
    if (idx >= 0) demoData.customers[idx] = { ...demoData.customers[idx], ...customerData };
    return { id: customerId, ...customerData };
  }
  const { data, error } = await supabase
    .from('customers')
    .update({
      full_name: customerData.full_name,
      phone: customerData.phone,
      second_phone: customerData.second_phone || '',
      village: customerData.village,
      national_id: customerData.national_id || '',
      address: customerData.address || '',
      notes: customerData.notes || '',
      photo: customerData.photo || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteCustomer(customerId) {
  if (!isSupabaseConfigured) {
    const idx = demoData.customers.findIndex(c => c.id === customerId);
    if (idx >= 0) demoData.customers[idx].isdeleted = true;
    return;
  }
  const { error } = await supabase
    .from('customers')
    .update({ isdeleted: true, updated_at: new Date().toISOString() })
    .eq('id', customerId);
  if (error) throw error;
}

export async function getCustomer(customerId) {
  if (!isSupabaseConfigured) {
    return demoData.customers.find(c => c.id === customerId && !c.isdeleted) || null;
  }
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('isdeleted', false)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAllCustomers() {
  if (!isSupabaseConfigured) {
    return demoData.customers.filter(c => !c.isdeleted);
  }
  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone, village, national_id, address, photo')
    .eq('isdeleted', false)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
}

export async function searchCustomers(term) {
  if (!isSupabaseConfigured) {
    const lower = term.toLowerCase();
    return demoData.customers.filter(c => {
      if (c.isdeleted) return false;
      return [c.full_name, c.phone, c.village, c.national_id, c.address]
        .some(f => f && f.toLowerCase().includes(lower));
    });
  }
  const like = `%${term.toLowerCase()}%`;
  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone, village, national_id, address, photo')
    .eq('isdeleted', false)
    .or(`full_name.ilike.${like},phone.ilike.${like},village.ilike.${like},national_id.ilike.${like}`)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function getUniqueVillages() {
  if (!isSupabaseConfigured) {
    const villages = new Set();
    demoData.customers.filter(c => !c.isdeleted).forEach(c => {
      if (c.village) villages.add(c.village);
    });
    return Array.from(villages).sort();
  }
  const { data, error } = await supabase
    .from('customers')
    .select('village')
    .eq('isdeleted', false)
    .not('village', 'is', null);
  if (error) throw error;
  const villages = [...new Set((data || []).map(r => r.village).filter(Boolean))];
  return villages.sort();
}

export async function findPotentialDuplicates(phoneNumber) {
  if (!isSupabaseConfigured) {
    const similarPhone = phoneNumber.slice(-7);
    return demoData.customers.filter(c => {
      if (c.isdeleted) return false;
      if (!c.phone) return false;
      return c.phone.slice(-7) === similarPhone;
    });
  }
  const similarPhone = phoneNumber.slice(-7);
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('isdeleted', false)
    .ilike('phone', `%${similarPhone}`);
  if (error) throw error;
  return data || [];
}
