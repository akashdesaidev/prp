'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';

export default function DepartmentDetail() {
  const params = useParams();
  const [dept, setDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDept = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/departments/${params.id}`);
        setDept(data);
      } catch (err) {
        console.error('Failed to fetch department:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDept();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !dept) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Department Not Found</h2>
          <p className="text-gray-600">
            The department you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const crumbs = [
    { label: 'Organization', href: '/org' },
    { label: 'Departments', href: '/departments' },
    { label: dept.name }
  ];

  return (
    <div className="space-y-4">
      <Breadcrumbs items={crumbs} />
      <h1 className="text-2xl font-semibold">{dept.name}</h1>
      <p>{dept.description}</p>
    </div>
  );
}
