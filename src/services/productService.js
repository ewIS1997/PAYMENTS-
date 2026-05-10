import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData, { getNextDemoId } from '../demo/demoStore';

export async function addProduct(productData) {
  if (!isSupabaseConfigured) {
    const newProduct = { id: getNextDemoId('prod'), ...productData, isDeleted: false };
    demoData.products.push(newProduct);
    return newProduct;
  }
  const { data, error } = await supabase
    .from('products')
    .insert({ name: productData.name, category: productData.category, default_price: productData.default_price })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(productId, productData) {
  if (!isSupabaseConfigured) {
    const idx = demoData.products.findIndex(p => p.id === productId);
    if (idx >= 0) demoData.products[idx] = { ...demoData.products[idx], ...productData };
    return { id: productId, ...productData };
  }
  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', productId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteProduct(productId) {
  if (!isSupabaseConfigured) {
    const idx = demoData.products.findIndex(p => p.id === productId);
    if (idx >= 0) demoData.products[idx].isDeleted = true;
    return;
  }
  const { error } = await supabase
    .from('products')
    .update({ isDeleted: true })
    .eq('id', productId);
  if (error) throw error;
}

export async function getAllProducts() {
  if (!isSupabaseConfigured) {
    return demoData.products.filter(p => !p.isDeleted);
  }
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('isDeleted', false)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getProductsByCategory(category) {
  if (!isSupabaseConfigured) {
    return demoData.products.filter(p => !p.isDeleted && p.category === category);
  }
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('isDeleted', false)
    .eq('category', category)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getUniqueCategories() {
  if (!isSupabaseConfigured) {
    const cats = new Set();
    demoData.products.filter(p => !p.isDeleted).forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('isDeleted', false)
    .not('category', 'is', null);
  if (error) throw error;
  const cats = [...new Set((data || []).map(r => r.category).filter(Boolean))];
  return cats.sort();
}
