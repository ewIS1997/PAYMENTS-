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
      if (inst.status === 'paid' || inst.status === 'partial') return false;
      const d = inst.due_date;
      if (!d) return false;
      return d.getMonth() === month && d.getFullYear() === year;
    }).filter(inst => {
      if (!village) return true;
      const customer = demoData.customers.find(c => c.id === inst.customer_id && !c.isDeleted);
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

export async function bulkMarkInstallmentsAsPaid(installmentIds) {
  if (!isFirebaseConfigured) {
    let count = 0;
    for (const id of installmentIds) {
      const idx = demoData.installments.findIndex(i => i.id === id);
      if (idx >= 0 && demoData.installments[idx].status !== 'paid') {
        demoData.installments[idx].status = 'paid';
        demoData.installments[idx].payment_date = new Date();
        delete demoData.installments[idx].carryover_from_partial;
        count++;
      }
    }
    return count;
  }
  let count = 0;
  for (const id of installmentIds) {
    const ref = doc(db, 'installments', id);
    try {
      await updateDoc(ref, { status: 'paid', payment_date: Timestamp.fromDate(new Date()), updated_at: serverTimestamp() });
      count++;
    } catch (e) {
      console.error('Error marking installment as paid:', e);
    }
  }
  return count;
}

export async function undoMarkInstallmentAsPaid(installmentId) {
  if (!isFirebaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) {
      const inst = demoData.installments[idx];
      const carryover = inst.carryover_from_partial || 0;
      
      inst.status = 'pending';
      inst.payment_date = null;
      inst.paid_amount = null;
      
      if (carryover > 0) {
        const nextInstIdx = demoData.installments.findIndex(i => 
          i.contract_id === inst.contract_id && 
          i.id !== installmentId &&
          i.due_date &&
          i.due_date.getTime() > (inst.due_date?.getTime() || 0) &&
          (i.status === 'pending' || i.status === 'late')
        );
        
        if (nextInstIdx >= 0) {
          const existingCarryover = demoData.installments[nextInstIdx].carryover_from_partial || 0;
          demoData.installments[nextInstIdx].amount -= carryover;
          if (existingCarryover > carryover) {
            demoData.installments[nextInstIdx].carryover_from_partial = existingCarryover - carryover;
          } else {
            delete demoData.installments[nextInstIdx].carryover_from_partial;
          }
        }
      }
      
      delete inst.carryover_from_partial;
    }
    return;
  }
  
  const instSnap = await getDoc(doc(db, 'installments', installmentId));
  const instData = instSnap.data();
  const carryover = instData.carryover_from_partial || 0;
  
  const ref = doc(db, 'installments', installmentId);
  await updateDoc(ref, { status: 'pending', payment_date: null, paid_amount: null, updated_at: serverTimestamp() });
  
  if (carryover > 0) {
    const currentDueDate = instData.due_date;
    const nextSnap = await getDocs(query(
      collection(db, 'installments'),
      where('contract_id', '==', instData.contract_id),
      where('due_date', '>', currentDueDate),
      where('status', 'in', ['pending', 'late'])
    ));
    
    if (!nextSnap.empty) {
      const nextDoc = nextSnap.docs[0];
      const nextData = nextDoc.data();
      await updateDoc(doc(db, 'installments', nextDoc.id), {
        amount: (nextData.amount || 0) - carryover,
      });
    }
  }
}

export async function recordPartialPayment(installmentId, paidAmount) {
  if (!isFirebaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) {
      const inst = demoData.installments[idx];
      const remaining = (inst.amount || 0) - paidAmount;
      
      inst.paid_amount = paidAmount;
      inst.payment_date = new Date();
      inst.status = 'partial';
      
      if (remaining > 0) {
        const currentDueDate = inst.due_date;
        const nextInstIdx = demoData.installments.findIndex(i => 
          i.contract_id === inst.contract_id && 
          i.id !== installmentId &&
          i.due_date &&
          i.due_date.getTime() > currentDueDate.getTime() &&
          (i.status === 'pending' || i.status === 'late')
        );
        
        if (nextInstIdx >= 0) {
          const existingCarryover = demoData.installments[nextInstIdx].carryover_from_partial || 0;
          demoData.installments[nextInstIdx].amount += remaining;
          demoData.installments[nextInstIdx].carryover_from_partial = existingCarryover + remaining;
        }
      }
    }
    return;
  }
  
  const instSnap = await getDoc(doc(db, 'installments', installmentId));
  const instData = instSnap.data();
  const remaining = (instData.amount || 0) - paidAmount;
  
  const ref = doc(db, 'installments', installmentId);
  await updateDoc(ref, { paid_amount: paidAmount, status: 'partial', payment_date: Timestamp.fromDate(new Date()), updated_at: serverTimestamp() });
  
  if (remaining > 0) {
    const currentDueDate = instData.due_date;
    const nextSnap = await getDocs(query(
      collection(db, 'installments'),
      where('contract_id', '==', instData.contract_id),
      where('due_date', '>', currentDueDate),
      where('status', 'in', ['pending', 'late'])
    ));
    
    if (!nextSnap.empty) {
      const nextDoc = nextSnap.docs[0];
      const nextData = nextDoc.data();
      const existingCarryover = nextData.carryover_from_partial || 0;
      await updateDoc(doc(db, 'installments', nextDoc.id), {
        amount: (nextData.amount || 0) + remaining,
        carryover_from_partial: existingCarryover + remaining,
      });
    }
  }
}

export async function markInstallmentAsPaid(installmentId) {
  if (!isFirebaseConfigured) {
    const idx = demoData.installments.findIndex(i => i.id === installmentId);
    if (idx >= 0) {
      demoData.installments[idx].status = 'paid';
      demoData.installments[idx].payment_date = new Date();
      delete demoData.installments[idx].carryover_from_partial;
    }
    return;
  }
  const ref = doc(db, 'installments', installmentId);
  await updateDoc(ref, { status: 'paid', payment_date: Timestamp.fromDate(new Date()), updated_at: serverTimestamp(), carryover_from_partial: null });
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

export async function getCustomerPaymentHistory(customerId) {
  if (!isFirebaseConfigured) {
    return demoData.installments
      .filter(i => i.customer_id === customerId)
      .map(i => {
        const receipt = demoData.receipts.find(r => r.installment_id === i.id);
        return {
          ...i,
          receipt_number: receipt?.receipt_number || null,
        };
      })
      .sort((a, b) => {
        const dateA = a.due_date || new Date(0);
        const dateB = b.due_date || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  }

  const installmentsSnap = await getDocs(query(collection(db, 'installments'), where('customer_id', '==', customerId)));
  const installments = [];
  for (const docSnap of installmentsSnap.docs) {
    const data = docSnap.data();
    installments.push({
      id: docSnap.id,
      ...data,
      due_date: data.due_date?.toDate?.() || data.due_date,
      payment_date: data.payment_date?.toDate?.() || data.payment_date,
    });
  }

  const result = [];
  for (const inst of installments) {
    let receiptNumber = null;
    if (inst.receipt_id) {
      const receiptSnap = await getDoc(doc(db, 'receipts', inst.receipt_id));
      if (receiptSnap.exists()) {
        receiptNumber = receiptSnap.data().receipt_number;
      }
    }
    result.push({ ...inst, receipt_number: receiptNumber });
  }

  return result.sort((a, b) => {
    const dateA = a.due_date || new Date(0);
    const dateB = b.due_date || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
}
