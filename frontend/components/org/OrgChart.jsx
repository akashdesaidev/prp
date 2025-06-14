'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '../ui/Breadcrumbs';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import api from '../../lib/api';

// Custom node styles
const nodeStyles = {
  department: {
    background: '#3B82F6',
    color: 'white',
    border: '2px solid #1E40AF',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  team: {
    background: '#10B981',
    color: 'white',
    border: '2px solid #047857',
    borderRadius: '6px',
    padding: '8px',
    fontSize: '12px',
    fontWeight: '600'
  },
  user: {
    background: '#F3F4F6',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    padding: '6px',
    fontSize: '11px'
  }
};

// Transform org tree from API into ReactFlow nodes/edges with proper positioning
function buildGraph(tree) {
  const nodes = [];
  const edges = [];
  let nodeId = 0;

  // Handle null or invalid tree data
  if (!tree || !Array.isArray(tree)) {
    console.warn('Invalid tree data:', tree);
    return { nodes: [], edges: [] };
  }

  // Calculate positions using a simple hierarchical layout
  const levelWidth = 300;
  const levelHeight = 150;
  const nodeSpacing = 200;

  const traverse = (dept, parentId, level = 0, siblingIndex = 0) => {
    if (!dept || !dept._id || !dept.name) {
      console.warn('Invalid department data:', dept);
      return { width: 0, childCount: 0 };
    }

    const deptId = `dept-${dept._id}`;
    const x = siblingIndex * levelWidth;
    const y = level * levelHeight;

    nodes.push({
      id: deptId,
      position: { x, y },
      data: {
        label: dept.name,
        type: 'department'
      },
      type: 'default',
      style: nodeStyles.department
    });

    if (parentId) {
      edges.push({
        id: `${parentId}-${deptId}`,
        source: parentId,
        target: deptId,
        type: 'smoothstep'
      });
    }

    let childIndex = 0;
    let totalWidth = 0;

    // Add teams
    if (dept.teams && Array.isArray(dept.teams)) {
      dept.teams.forEach((team) => {
        if (!team || !team._id || !team.name) return;

        const teamId = `team-${team._id}`;
        const teamX = x + childIndex * nodeSpacing;
        const teamY = y + levelHeight;

        nodes.push({
          id: teamId,
          position: { x: teamX, y: teamY },
          data: {
            label: team.name,
            type: 'team'
          },
          type: 'default',
          style: nodeStyles.team
        });

        edges.push({
          id: `${deptId}-${teamId}`,
          source: deptId,
          target: teamId,
          type: 'smoothstep'
        });

        // Add team members
        if (team.members && Array.isArray(team.members)) {
          team.members.forEach((user, userIndex) => {
            if (!user || !user._id || !user.firstName || !user.lastName) return;

            const userId = `user-${user._id}`;
            const userX = teamX + userIndex * 120 - (team.members.length - 1) * 60;
            const userY = teamY + levelHeight;

            nodes.push({
              id: userId,
              position: { x: userX, y: userY },
              data: {
                label: `${user.firstName} ${user.lastName}`,
                type: 'user',
                role: user.role
              },
              type: 'default',
              style: nodeStyles.user
            });

            edges.push({
              id: `${teamId}-${userId}`,
              source: teamId,
              target: userId,
              type: 'smoothstep'
            });
          });
        }

        childIndex++;
      });
    }

    // Add child departments
    if (dept.children && Array.isArray(dept.children)) {
      dept.children.forEach((child, index) => {
        const childResult = traverse(child, deptId, level + 3, siblingIndex + index);
        totalWidth += childResult.width;
      });
    }

    return { width: Math.max(totalWidth, childIndex * nodeSpacing), childCount: childIndex };
  };

  tree.forEach((root, index) => traverse(root, null, 0, index));
  return { nodes, edges };
}

export default function OrgChart() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/org/tree');
      console.log('Org tree response:', response.data);

      const graph = buildGraph(response.data);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    } catch (err) {
      console.error('Failed to load org tree', err);
      setError(err.response?.data?.message || err.message || 'Failed to load organization chart');
      // Set empty nodes/edges on error to prevent null issues
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const onNodeClick = useCallback(
    (event, node) => {
      const { id, data } = node;

      if (data.type === 'department' && id.startsWith('dept-')) {
        router.push(`/departments/${id.replace('dept-', '')}`);
      } else if (data.type === 'team' && id.startsWith('team-')) {
        router.push(`/teams/${id.replace('team-', '')}`);
      } else if (data.type === 'user' && id.startsWith('user-')) {
        router.push(`/users/${id.replace('user-', '')}`);
      }
    },
    [router]
  );

  if (loading) {
    return (
      <div className="h-full w-full">
        <Breadcrumbs items={[{ label: 'Organization' }]} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading organization chart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full">
        <Breadcrumbs items={[{ label: 'Organization' }]} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg
                className="w-12 h-12 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-red-600 font-medium mb-2">Failed to load organization chart</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchTree}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="h-full w-full">
        <Breadcrumbs items={[{ label: 'Organization' }]} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-12 h-12 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">No organization data available</p>
            <p className="text-sm text-gray-400 mb-4">
              Create departments and teams to see the organization chart
            </p>
            <button
              onClick={() => router.push('/departments')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Create Department
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Breadcrumbs items={[{ label: 'Organization' }]} />

      {/* Legend */}
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={nodeStyles.department}></div>
          <span>Departments</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={nodeStyles.team}></div>
          <span>Teams</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={nodeStyles.user}></div>
          <span>Users</span>
        </div>
      </div>

      <div style={{ width: '100%', height: '70vh' }} className="border rounded-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Background color="#f1f5f9" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Click on departments, teams, or users to view details
      </div>
    </div>
  );
}
