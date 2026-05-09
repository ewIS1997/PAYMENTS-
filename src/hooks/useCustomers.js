import { useState, useEffect, useCallback } from 'react';
import { getAllCustomers } from '../services/customerService';

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const customersData = await getAllCustomers();
      setCustomers(customersData);

      const villageSet = new Set();
      customersData.forEach(c => {
        if (c.village) villageSet.add(c.village);
      });
      setVillages(Array.from(villageSet).sort());

      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(), [fetchData]);

  return { customers, villages, loading, error, refresh };
}
