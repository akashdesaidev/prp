"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import DepartmentForm from "./DepartmentForm";

export default function DepartmentTable() {
  const router = useRouter();
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/departments");
      setDepts(data);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditDept(null);
    setFormOpen(true);
  };
  const openEdit = (dept) => {
    setEditDept(dept);
    setFormOpen(true);
  };
  const handleClose = (refresh) => {
    setFormOpen(false);
    if (refresh) load();
  };

  const del = async (id) => {
    if (!confirm("Delete this department?")) return;
    try {
      await api.delete(`/departments/${id}`);
      load();
    } catch (err) {
      alert("Error deleting");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Departments</h2>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded">
          Add Department
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full bg-white dark:bg-gray-900 border">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-gray-800 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Description</th>
              <th className="p-2 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {depts.map((d) => (
              <tr key={d._id} className="border-b last:border-0">
                <td className="p-2 text-blue-600 hover:underline cursor-pointer" onClick={() => router.push(`/departments/${d._id}`)}>{d.name}</td>
                <td className="p-2">{d.description}</td>
                <td className="p-2 space-x-2">
                  <button onClick={() => openEdit(d)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => del(d._id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <DepartmentForm open={formOpen} onClose={handleClose} initial={editDept} />
    </div>
  );
}
