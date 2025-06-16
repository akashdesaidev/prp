'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Building2,
  Users,
  User,
  Crown,
  Mail,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Sparkles
} from 'lucide-react';
import api from '../../lib/api';

// Custom Node Components - Simplified and smaller
const DepartmentNode = ({ data, selected }) => {
  return (
    <div className={`relative group ${selected ? 'z-10' : ''}`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <div
        className={`
        bg-blue-600 text-white rounded-md shadow-sm border-2 
        transition-all duration-200 hover:shadow-md
        ${selected ? 'border-yellow-400 shadow-md' : 'border-blue-500'}
        w-36 h-16
      `}
      >
        <div className="p-2 h-full flex items-center">
          <div className="flex items-center gap-1.5 w-full">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm truncate">{data.label}</h3>
              <p className="text-blue-200 text-xs">Department</p>
            </div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const ManagerNode = ({ data, selected }) => {
  return (
    <div className={`relative group ${selected ? 'z-10' : ''}`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <div
        className={`
        bg-orange-500 text-white rounded-md shadow-sm border-2
        transition-all duration-200 hover:shadow-md
        ${selected ? 'border-yellow-400 shadow-md' : 'border-orange-400'}
        w-32 h-14
      `}
      >
        <div className="p-1.5 h-full flex items-center">
          <div className="flex items-center gap-1.5 w-full">
            <Crown className="h-3 w-3 flex-shrink-0 text-yellow-200" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-xs truncate">{data.label}</h3>
              <p className="text-orange-200 text-xs">{data.role || 'Manager'}</p>
            </div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const TeamNode = ({ data, selected }) => {
  return (
    <div className={`relative group ${selected ? 'z-10' : ''}`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <div
        className={`
        bg-green-600 text-white rounded-md shadow-sm border-2
        transition-all duration-200 hover:shadow-md
        ${selected ? 'border-yellow-400 shadow-md' : 'border-green-500'}
        w-30 h-14
      `}
      >
        <div className="p-1.5 h-full flex items-center">
          <div className="flex items-center gap-1.5 w-full">
            <Users className="h-3 w-3 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-xs truncate">{data.label}</h3>
              <p className="text-green-200 text-xs">Team</p>
            </div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const UserNode = ({ data, selected }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-600 border-purple-500 text-white';
      case 'hr':
        return 'bg-pink-600 border-pink-500 text-white';
      case 'manager':
        return 'bg-orange-600 border-orange-500 text-white';
      default:
        return 'bg-gray-700 border-gray-600 text-white'; // Changed from slate to gray for better visibility
    }
  };

  return (
    <div className={`relative group ${selected ? 'z-10' : ''}`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <div
        className={`
        ${getRoleColor(data.role)} rounded-md shadow-sm border-2
        transition-all duration-200 hover:shadow-md
        ${selected ? 'border-yellow-400 shadow-md' : ''}
        w-28 h-12
      `}
      >
        <div className="p-1.5 h-full flex items-center">
          <div className="flex items-center gap-1.5 w-full">
            <User className="h-3 w-3 flex-shrink-0 text-white" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-xs truncate text-white">{data.label}</h3>
              <p className="text-gray-200 text-xs opacity-75">{data.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Node types
const nodeTypes = {
  department: DepartmentNode,
  manager: ManagerNode,
  team: TeamNode,
  user: UserNode
};

// Build organization graph with enhanced spacing and positioning
function buildEnhancedGraph(tree) {
  const nodes = [];
  const edges = [];

  const LEVEL_SPACING = 100; // Vertical spacing between levels
  const MIN_NODE_SPACING = 120; // Minimum horizontal spacing between nodes
  const TEAM_SPACING = 160; // Spacing between teams
  const MEMBER_SPACING = 90; // Spacing between team members
  const DEPT_SPACING = 400; // Spacing between departments

  // Calculate total width needed for a department's children
  const calculateDepartmentWidth = (dept) => {
    if (!dept.teams || dept.teams.length === 0) return 0;

    let totalWidth = 0;
    dept.teams.forEach((team) => {
      const memberCount = team.members?.length || 0;
      const teamWidth = Math.max(MIN_NODE_SPACING, memberCount * MEMBER_SPACING);
      totalWidth += teamWidth;
    });

    // Add spacing between teams
    totalWidth += (dept.teams.length - 1) * TEAM_SPACING;
    return totalWidth;
  };

  // Calculate optimal positions using flexbox-like space distribution
  const distributeChildNodes = (parentX, parentWidth, children, childWidths) => {
    if (children.length === 0) return [];

    const totalChildWidth = childWidths.reduce((sum, width) => sum + width, 0);
    const totalSpacing = (children.length - 1) * TEAM_SPACING;
    const availableSpace = Math.max(parentWidth, totalChildWidth + totalSpacing);

    // Calculate space between nodes (justify-content: space-between)
    const extraSpace = availableSpace - totalChildWidth - totalSpacing;
    const spacePerGap = children.length > 1 ? extraSpace / (children.length + 1) : extraSpace / 2;

    const positions = [];
    let currentX = parentX - availableSpace / 2 + spacePerGap;

    children.forEach((child, index) => {
      positions.push(currentX + childWidths[index] / 2);
      currentX +=
        childWidths[index] + TEAM_SPACING + (index < children.length - 1 ? 0 : spacePerGap);
    });

    return positions;
  };

  const traverse = (dept, level = 0, parentX = 0, allocatedWidth = 0) => {
    const deptId = `dept-${dept._id}`;
    const deptWidth = Math.max(allocatedWidth, calculateDepartmentWidth(dept));
    const deptX = parentX;
    const deptY = level * LEVEL_SPACING;

    // Add department node
    nodes.push({
      id: deptId,
      type: 'department',
      position: { x: deptX, y: deptY },
      data: {
        label: dept.name,
        type: 'department',
        description: dept.description,
        teamsCount: dept.teams?.length || 0,
        membersCount: dept.teams?.reduce((acc, team) => acc + (team.members?.length || 0), 0) || 0
      }
    });

    // Calculate team widths and positions
    if (dept.teams && dept.teams.length > 0) {
      const teamWidths = dept.teams.map((team) => {
        const memberCount = team.members?.length || 0;
        return Math.max(MIN_NODE_SPACING, memberCount * MEMBER_SPACING);
      });

      const teamPositions = distributeChildNodes(deptX, deptWidth, dept.teams, teamWidths);

      // Process teams under this department
      dept.teams.forEach((team, teamIndex) => {
        const teamId = `team-${team._id}`;
        const teamX = teamPositions[teamIndex];
        const teamY = (level + 1) * LEVEL_SPACING;

        // Add team node
        nodes.push({
          id: teamId,
          type: 'team',
          position: { x: teamX, y: teamY },
          data: {
            label: team.name,
            type: 'team',
            membersCount: team.members?.length || 0,
            lead:
              team.members?.find((m) => m.role === 'manager')?.firstName +
                ' ' +
                team.members?.find((m) => m.role === 'manager')?.lastName || null
          }
        });

        // Add edge from department to team
        edges.push({
          id: `${deptId}-${teamId}`,
          source: deptId,
          target: teamId,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#3B82F6',
            strokeWidth: 2
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3B82F6'
          }
        });

        // Find managers and employees in this team
        const managers =
          team.members?.filter(
            (member) => member.role === 'manager' || member.role === 'admin' || member.role === 'hr'
          ) || [];
        const employees = team.members?.filter((member) => member.role === 'employee') || [];

        const allMembers = [...managers, ...employees];
        const teamWidth = teamWidths[teamIndex];

        // Distribute team members with flexbox-like spacing
        if (allMembers.length > 0) {
          const memberPositions = distributeChildNodes(
            teamX,
            teamWidth,
            allMembers,
            allMembers.map(() => MEMBER_SPACING * 0.8) // Slightly smaller width for members
          );

          // Add manager nodes
          managers.forEach((manager, managerIndex) => {
            const managerId = `manager-${manager._id}`;
            const managerX = memberPositions[managerIndex];
            const managerY = (level + 2) * LEVEL_SPACING;

            nodes.push({
              id: managerId,
              type: 'manager',
              position: { x: managerX, y: managerY },
              data: {
                label: `${manager.firstName} ${manager.lastName}`,
                type: 'manager',
                role: manager.role,
                email: manager.email
              }
            });

            // Add edge from team to manager
            edges.push({
              id: `${teamId}-${managerId}`,
              source: teamId,
              target: managerId,
              type: 'smoothstep',
              animated: false,
              style: {
                stroke: '#F59E0B',
                strokeWidth: 2
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#F59E0B'
              }
            });
          });

          // Add employee nodes
          employees.forEach((employee, empIndex) => {
            const employeeId = `user-${employee._id}`;
            const employeeX = memberPositions[managers.length + empIndex];
            const employeeY = (level + 3) * LEVEL_SPACING;

            nodes.push({
              id: employeeId,
              type: 'user',
              position: { x: employeeX, y: employeeY },
              data: {
                label: `${employee.firstName} ${employee.lastName}`,
                type: 'user',
                role: employee.role,
                email: employee.email
              }
            });

            // Connect employees to their manager if exists, otherwise to team
            const managerInTeam = managers[0];
            const sourceId = managerInTeam ? `manager-${managerInTeam._id}` : teamId;

            edges.push({
              id: `${sourceId}-${employeeId}`,
              source: sourceId,
              target: employeeId,
              type: 'smoothstep',
              animated: false,
              style: {
                stroke: '#6B7280',
                strokeWidth: 1.5
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#6B7280'
              }
            });
          });
        }
      });
    }

    // Process child departments with enhanced spacing
    if (dept.children && dept.children.length > 0) {
      const childWidths = dept.children.map((child) => calculateDepartmentWidth(child));
      const childPositions = distributeChildNodes(deptX, deptWidth, dept.children, childWidths);

      dept.children.forEach((child, childIndex) => {
        const childX = childPositions[childIndex];
        const childWidth = childWidths[childIndex];
        traverse(child, level + 4, childX, childWidth);

        // Add edge from parent department to child department
        edges.push({
          id: `${deptId}-dept-${child._id}`,
          source: deptId,
          target: `dept-${child._id}`,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#8B5CF6',
            strokeWidth: 3,
            strokeDasharray: '5,5'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#8B5CF6'
          }
        });
      });
    }
  };

  // Process root departments with proper spacing
  if (tree.length > 0) {
    const rootWidths = tree.map((root) => calculateDepartmentWidth(root));
    const totalRootWidth =
      rootWidths.reduce((sum, width) => sum + width, 0) + (tree.length - 1) * DEPT_SPACING;

    let currentX = -totalRootWidth / 2;
    tree.forEach((root, index) => {
      const rootX = currentX + rootWidths[index] / 2;
      traverse(root, 0, rootX, rootWidths[index]);
      currentX += rootWidths[index] + DEPT_SPACING;
    });
  }

  return { nodes, edges };
}

export default function EnhancedOrgChart({ isLocked = false }) {
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
      console.log('Enhanced Org tree response:', response.data);

      const graph = buildEnhancedGraph(response.data);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    } catch (err) {
      console.error('Failed to load org tree', err);
      setError(err.response?.data?.message || err.message || 'Failed to load organization chart');
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

  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Organization Chart</h3>
          <p className="text-gray-600">Building your company structure...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Chart</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchTree}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <Building2 className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Start Building Your Organization
          </h3>
          <p className="text-gray-600 mb-6">
            Create departments and teams to visualize your company structure.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/departments')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2 justify-center"
            >
              <Building2 className="h-4 w-4" />
              Create Department
            </button>
            <button
              onClick={() => router.push('/teams')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2 justify-center"
            >
              <Users className="h-4 w-4" />
              Create Team
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200 bg-white relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isLocked ? () => {} : onNodesChange}
        onEdgesChange={isLocked ? () => {} : onEdgesChange}
        onNodeClick={isLocked ? undefined : onNodeClick}
        nodeTypes={memoizedNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        className="bg-gray-50"
        nodesDraggable={!isLocked}
        nodesConnectable={false}
        elementsSelectable={!isLocked}
        panOnDrag={!isLocked}
        zoomOnScroll={!isLocked}
        zoomOnPinch={!isLocked}
        zoomOnDoubleClick={!isLocked}
      >
        <Background color="#e5e7eb" gap={16} size={1} variant="dots" />
        <Controls
          className="bg-white shadow-md border border-gray-200 rounded-md"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Legend - Positioned at bottom left to avoid sidebar overlap */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-md p-2.5 shadow-md border border-gray-200 max-w-[160px]">
        <h4 className="font-medium text-gray-900 mb-1.5 text-xs">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></div>
            <span className="text-gray-700">Departments</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-sm"></div>
            <span className="text-gray-700">Managers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-green-600 rounded-sm"></div>
            <span className="text-gray-700">Teams</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-gray-700 rounded-sm"></div>
            <span className="text-gray-700">Employees</span>
          </div>
        </div>
      </div>
    </div>
  );
}
