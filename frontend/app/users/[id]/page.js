'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import {
  User,
  Mail,
  Building2,
  Users,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Crown,
  Clock,
  MapPin,
  Phone,
  ArrowLeft,
  Settings,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: '',
    teamId: '',
    managerId: ''
  });

  useEffect(() => {
    if (id) {
      fetchEmployee();
      fetchSelectData();
    }
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${id}`);
      setEmployee(response.data);
      setEditForm({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        email: response.data.email || '',
        role: response.data.role || '',
        department: response.data.department || '',
        teamId: response.data.teamId || '',
        managerId: response.data.managerId?._id || ''
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast.error('Failed to load employee profile');
      router.push('/users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectData = async () => {
    try {
      const [deptResponse, teamResponse, managerResponse] = await Promise.all([
        api.get('/departments'),
        api.get('/teams'),
        api.get('/users?role=manager')
      ]);

      setDepartments(deptResponse.data || []);
      setTeams(teamResponse.data || []);
      setManagers(managerResponse.data || []);
    } catch (error) {
      console.error('Error fetching select data:', error);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      role: employee.role || '',
      department: employee.department || '',
      teamId: employee.teamId || '',
      managerId: employee.managerId?._id || ''
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updateData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        role: editForm.role,
        department: editForm.department || null,
        team: editForm.teamId || null,
        manager: editForm.managerId || null
      };

      const response = await api.put(`/users/${id}`, updateData);
      setEmployee(response.data);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'hr':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canEdit = () => {
    if (!currentUser) return false;
    // Admin and HR can edit anyone, users can edit themselves
    return ['admin', 'hr'].includes(currentUser.role) || currentUser.id === id;
  };

  const canEditRole = () => {
    if (!currentUser) return false;
    // Only admin and HR can edit roles, and not their own
    return ['admin', 'hr'].includes(currentUser.role) && currentUser.id !== id;
  };

  const filteredTeams = teams.filter(
    (team) => !editForm.department || team.department === editForm.department
  );

  const filteredManagers = managers.filter(
    (manager) => manager._id !== id // Can't be manager of themselves
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!employee) {
    return (
      <ProtectedRoute>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Employee Not Found</h1>
            <Button onClick={() => router.push('/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => router.push('/users')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>

            {canEdit() && (
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel} disabled={saving}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              {editing ? (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="text-2xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                    placeholder="First Name"
                  />
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="text-2xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                    placeholder="Last Name"
                  />
                </div>
              ) : (
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {employee.firstName} {employee.lastName}
                </h1>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {editing && canEditRole() ? (
                  <select
                    value={editForm.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(editForm.role)}`}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    {currentUser?.role === 'admin' && <option value="admin">Admin</option>}
                  </select>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(employee.role)}`}
                  >
                    <Shield className="h-3 w-3 inline mr-1" />
                    {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                  </span>
                )}

                {employee.department && (
                  <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 border border-gray-200">
                    <Building2 className="h-3 w-3 inline mr-1" />
                    {typeof employee.department === 'object'
                      ? employee.department.name
                      : employee.department}
                  </span>
                )}

                <span
                  className={`px-2 py-1 rounded-full text-xs ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Email Address</div>
                  {editing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                      disabled // Email usually shouldn't be editable
                    />
                  ) : (
                    <div className="font-medium text-gray-900">{employee.email}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Member Since</div>
                  <div className="font-medium text-gray-900">
                    {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="font-medium text-gray-900">
                    {employee.updatedAt ? new Date(employee.updatedAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Department</div>
                  {editing ? (
                    <select
                      value={editForm.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                    >
                      <option value="">No Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="font-medium text-gray-900">
                      {typeof employee.department === 'object'
                        ? employee.department.name
                        : employee.department || 'No department assigned'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Team</div>
                  {editing ? (
                    <select
                      value={editForm.teamId}
                      onChange={(e) => handleInputChange('teamId', e.target.value)}
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                      disabled={!editForm.department}
                    >
                      <option value="">No Team</option>
                      {filteredTeams.map((team) => (
                        <option key={team._id} value={team._id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="font-medium text-gray-900">
                      {typeof employee.teamId === 'object'
                        ? employee.teamId.name
                        : 'No team assigned'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Manager</div>
                  {editing ? (
                    <select
                      value={editForm.managerId}
                      onChange={(e) => handleInputChange('managerId', e.target.value)}
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                    >
                      <option value="">No Manager</option>
                      {filteredManagers.map((manager) => (
                        <option key={manager._id} value={manager._id}>
                          {manager.firstName} {manager.lastName} - {manager.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="font-medium text-gray-900">
                      {employee.managerId
                        ? `${employee.managerId.firstName} ${employee.managerId.lastName}`
                        : 'No manager assigned'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        {['admin', 'hr'].includes(currentUser?.role) && (
          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Administrative Actions
            </h3>
            <div className="flex gap-4 flex-wrap">
              <Button variant="outline" onClick={() => router.push(`/users/${id}/okrs`)}>
                <Briefcase className="h-4 w-4 mr-2" />
                View OKRs
              </Button>
              <Button variant="outline" onClick={() => router.push(`/users/${id}/feedback`)}>
                <UserCheck className="h-4 w-4 mr-2" />
                View Feedback
              </Button>
              <Button variant="outline" onClick={() => router.push(`/users/${id}/reviews`)}>
                <Calendar className="h-4 w-4 mr-2" />
                Review History
              </Button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
