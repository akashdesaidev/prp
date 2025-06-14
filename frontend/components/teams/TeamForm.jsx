'use client';
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function TeamForm({ open, onClose, initial }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [department, setDepartment] = useState(initial?.department?._id || '');
  const [lead, setLead] = useState(initial?.lead?._id || '');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  const isEdit = Boolean(initial);

  useEffect(() => {
    (async () => {
      try {
        const [deptRes, userRes] = await Promise.all([api.get('/departments'), api.get('/users')]);
        setDepartments(deptRes.data);
        setUsers(userRes.data);
      } catch (e) {
        console.error('Failed to load select data', e);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!department) return alert('Department required');
    setLoading(true);
    try {
      const payload = { name, description, department, lead: lead || null };
      if (isEdit) {
        await api.patch(`/teams/${initial._id}`, payload);
      } else {
        await api.post('/teams', payload);
      }
      onClose(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return <div></div>;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-md w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">{isEdit ? 'Edit' : 'Add'} Team</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Name</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block mb-1">Department</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="">Select</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block mb-1">Lead (optional)</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={lead}
                onChange={(e) => setLead(e.target.value)}
              >
                <option value="">-- none --</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
