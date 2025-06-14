'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';

export default function TeamDetail() {
  const params = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/teams/${params.id}`);
        setTeam(data);
      } catch (err) {
        console.error('Failed to fetch team:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTeam();
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

  if (error || !team) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Team Not Found</h2>
          <p className="text-gray-600">
            The team you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const crumbs = [
    { label: 'Organization', href: '/org' },
    { label: 'Teams', href: '/teams' },
    { label: team.name }
  ];

  return (
    <div className="space-y-4">
      <Breadcrumbs items={crumbs} />
      <h1 className="text-2xl font-semibold">{team.name}</h1>
      <p>{team.description}</p>
      <p className="text-sm text-gray-500">Department: {team.department?.name}</p>
      {team.lead && (
        <p className="text-sm text-gray-500">
          Lead: {team.lead.firstName} {team.lead.lastName}
        </p>
      )}
    </div>
  );
}
