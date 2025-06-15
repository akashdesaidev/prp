'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, Building, Target } from 'lucide-react';
import { Button } from '../ui/button';

export default function OKRSearchFilter({ onFiltersChange, initialFilters = {} }) {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    status: initialFilters.status || 'all',
    type: initialFilters.type || 'all',
    assignedTo: initialFilters.assignedTo || 'all',
    department: initialFilters.department || 'all',
    dateRange: initialFilters.dateRange || 'all',
    tags: initialFilters.tags || [],
    ...initialFilters
  });

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleFiltersChange();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filters]);

  const fetchFilterData = async () => {
    try {
      // Fetch users, departments, and tags for filter options
      const [usersRes, departmentsRes, tagsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/okrs/tags`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        })
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json();
        setDepartments(departmentsData);
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setAvailableTags(tagsData);
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const handleFiltersChange = () => {
    const activeFilters = {
      search: searchTerm,
      ...filters
    };

    // Remove 'all' values and empty arrays
    Object.keys(activeFilters).forEach((key) => {
      if (
        activeFilters[key] === 'all' ||
        (Array.isArray(activeFilters[key]) && activeFilters[key].length === 0)
      ) {
        delete activeFilters[key];
      }
    });

    onFiltersChange(activeFilters);
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleTag = (tag) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag]
    }));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      status: 'all',
      type: 'all',
      assignedTo: 'all',
      department: 'all',
      dateRange: 'all',
      tags: []
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.status !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.assignedTo !== 'all') count++;
    if (filters.department !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.tags.length > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search OKRs by title, description, or key results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="flex items-center gap-2 text-gray-600"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['active', 'completed', 'draft'].map((status) => (
          <button
            key={status}
            onClick={() => updateFilter('status', filters.status === status ? 'all' : status)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.status === status
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}

        {['company', 'department', 'team', 'individual'].map((type) => (
          <button
            key={type}
            onClick={() => updateFilter('type', filters.type === type ? 'all' : type)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filters.type === type
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Assigned To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Assigned To
              </label>
              <select
                value={filters.assignedTo}
                onChange={(e) => updateFilter('assignedTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => updateFilter('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => updateFilter('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="current">Current Period</option>
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
                <option value="thisYear">This Year</option>
              </select>
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="inline h-4 w-4 mr-1" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filters.tags.includes(tag)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Active filters:</span>
            {searchTerm && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Search: "{searchTerm}"
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Status: {filters.status}
              </span>
            )}
            {filters.type !== 'all' && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Type: {filters.type}
              </span>
            )}
            {filters.tags.length > 0 && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Tags: {filters.tags.join(', ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
