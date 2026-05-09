import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { isFirebaseConfigured } from '../firebase/demoMode';
import demoData from '../firebase/demoStore';

const SETTINGS_DOC_ID = 'app_settings';

export async function initializeSettings() {
  if (!isFirebaseConfigured) return;
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
  if (!isFirebaseConfigured) {
    return { ...demoData.settings };
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
  if (!isFirebaseConfigured) {
    Object.assign(demoData.settings, data);
    return;
  }
  const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
  await updateDoc(settingsRef, data);
}

export async function uploadLogo(file) {
  if (!isFirebaseConfigured) {
    return URL.createObjectURL(file);
  }
  const storageRef = ref(storage, `logos/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function resetReceiptSequence() {
  if (!isFirebaseConfigured) {
    demoData.settings.last_receipt_number = 0;
    demoData.settings.receipt_year = new Date().getFullYear();
    return;
  }
  const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
  await updateDoc(settingsRef, { last_receipt_number: 0, receipt_year: new Date().getFullYear() });
}
