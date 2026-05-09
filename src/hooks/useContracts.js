import { useState, useEffect } from 'react';
import { getContractsByCustomerId, getInstallmentsByContractId } from '../services/contractService';

export function useCustomerDetail(customerId) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const contractsData = await getContractsByCustomerId(customerId);
      setContracts(contractsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching customer contracts:', err);
      setError('حدث خطأ أثناء تحميل العقود');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchData();
    }
  }, [customerId]);

  const refresh = () => fetchData();

  return { contracts, loading, error, refresh };
}

export function useContractDetail(contractId) {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const installmentsData = await getInstallmentsByContractId(contractId);
      setInstallments(installmentsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching installments:', err);
      setError('حدث خطأ أثناء تحميل الأقساط');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractId) {
      fetchData();
    }
  }, [contractId]);

  const refresh = () => fetchData();

  return { installments, loading, error, refresh };
}
