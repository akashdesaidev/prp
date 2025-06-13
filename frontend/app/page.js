"use client";
import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function HealthPage() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const { data } = await api.get('/api/health');
        setStatus(data.status);
      } catch (e) {
        setStatus('error');
      }
    }
    fetchHealth();
  }, []);

  return (
    <div className="text-center mt-10 text-xl">
      Status: {status ?? 'loading...'}
    </div>
  );
}
