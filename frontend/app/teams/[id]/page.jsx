'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import TeamMemberManager from '../../../components/teams/TeamMemberManager';

export default function TeamDetail() {
  const params = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  useEffect(() => {
    fetchTeam();
  }, [params.id]);

  const handleTeamUpdate = () => {
    fetchTeam(); // Refresh team data after member changes
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Team not found</h3>
          <p className="text-gray-500">
            The team you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Teams', href: '/teams' },
          { label: team.name, href: `/teams/${team._id}` }
        ]}
      />

      {/* Team Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            {team.description && <p className="text-gray-600 mt-2">{team.description}</p>}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Team ID</div>
            <div className="font-mono text-xs text-gray-400">{team._id}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{team.members?.length || 0}</div>
            <div className="text-sm text-gray-500">Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {team.department?.name || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">Department</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">Active</div>
            <div className="text-sm text-gray-500">Status</div>
          </div>
        </div>
      </div>

      {/* Team Member Management */}
      <TeamMemberManager team={team} onTeamUpdate={handleTeamUpdate} />
    </div>
  );
}
