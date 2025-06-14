"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import TeamForm from "./TeamForm";

export default function TeamTable() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTeam, setEditTeam] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/teams");
      setTeams(data);
    } catch (err) {
      console.error("Failed to fetch teams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditTeam(null);
    setFormOpen(true);
  };
  const openEdit = (t) => {
    setEditTeam(t);
    setFormOpen(true);
  };
  const handleClose = (refresh) => {
    setFormOpen(false);
    if (refresh) load();
  };

  const del = async (id) => {
    if (!confirm("Delete this team?")) return;
    try {
      await api.delete(`/teams/${id}`);
      load();
    } catch (err) {
      alert("Error deleting");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Teams</h2>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded">
          Add Team
        </button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full bg-white dark:bg-gray-900 border">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-gray-800 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Department</th>
              <th className="p-2">Lead</th>
              <th className="p-2 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t._id} className="border-b last:border-0">
                <td className="p-2 text-blue-600 hover:underline cursor-pointer" onClick={() => router.push(`/teams/${t._id}`)}>{t.name}</td>
                <td className="p-2">{t.department?.name}</td>
                <td className="p-2">
                  {t.lead ? `${t.lead.firstName} ${t.lead.lastName}` : "-"}
                </td>
                <td className="p-2 space-x-2">
                  <button onClick={() => openEdit(t)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => del(t._id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <TeamForm open={formOpen} onClose={handleClose} initial={editTeam} />
    </div>
  );
}
