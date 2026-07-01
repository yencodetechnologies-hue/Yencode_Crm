import React, { useState, useEffect } from 'react';
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
  assignCampaignAgents,
  getAllEmployees,
} from '../../api/services/projectServices';
import { normalizeRole } from '../../utils/roles';

const CampaignTable = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', description: '', status: 'Active' });
  const [selectedAgents, setSelectedAgents] = useState([]);

  const load = async () => {
    const res = await getCampaigns();
    if (res.status === 200) setCampaigns(res.data);
  };

  useEffect(() => {
    load();
    getAllEmployees({ salesOnly: 'true' }).then((res) => {
      if (res.status === 200) setEmployees(res.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateCampaign(editing, form);
    } else {
      await createCampaign(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', startDate: '', endDate: '', description: '', status: 'Active' });
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this campaign?')) {
      await deleteCampaign(id);
      load();
    }
  };

  const viewStats = async (id) => {
    const res = await getCampaignStats(id);
    if (res.status === 200) setStats({ id, ...res.data });
  };

  const handleAssign = async (id) => {
    await assignCampaignAgents(id, selectedAgents);
    alert('Agents assigned');
    load();
  };

  return (
    <div className="mx-auto p-6 mt-24 max-w-6xl">
      <div className="flex justify-between mb-6">
        <h2 className="text-3xl font-bold">Campaigns</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="bg-blue-500 text-white px-4 py-2 rounded">Add Campaign</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded p-4 mb-6 grid grid-cols-2 gap-4">
          <input placeholder="Campaign Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2 rounded" required />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border p-2 rounded">
            <option value="Active">Active</option><option value="Paused">Paused</option><option value="Completed">Completed</option>
          </select>
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="border p-2 rounded" />
          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="border p-2 rounded" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border p-2 rounded col-span-2" />
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded col-span-2">{editing ? 'Update' : 'Create'}</button>
        </form>
      )}

      {stats && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4 flex justify-between">
          <div className="grid grid-cols-3 gap-4 flex-1">
            <div><strong>Leads:</strong> {stats.leadCount}</div>
            <div><strong>Calls:</strong> {stats.callsMade}</div>
            <div><strong>Connected:</strong> {stats.connectedCalls}</div>
            <div><strong>Conversions:</strong> {stats.conversions}</div>
            <div><strong>Success Rate:</strong> {stats.successRate}%</div>
          </div>
          <button onClick={() => setStats(null)} className="text-gray-500">✕</button>
        </div>
      )}

      <table className="w-full bg-white shadow rounded">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Dates</th>
            <th className="p-3 text-left">Leads</th>
            <th className="p-3 text-left">Agents</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c._id} className="border-b">
              <td className="p-3">{c.name}</td>
              <td className="p-3">{c.status}</td>
              <td className="p-3">{c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'} — {c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}</td>
              <td className="p-3">{c.leadCount || 0}</td>
              <td className="p-3">{c.assignedAgents?.map((a) => a.name).join(', ') || '—'}</td>
              <td className="p-3 space-x-1">
                <button onClick={() => viewStats(c._id)} className="bg-purple-500 text-white px-2 py-1 rounded text-sm">Stats</button>
                <button onClick={() => { setEditing(c._id); setForm(c); setShowForm(true); }} className="bg-yellow-500 text-white px-2 py-1 rounded text-sm">Edit</button>
                <button onClick={() => handleDelete(c._id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 bg-white shadow rounded p-4">
        <h3 className="font-semibold mb-2">Assign Agents to Campaign</h3>
        <div className="flex gap-2 flex-wrap mb-2">
          {employees.map((e) => (
            <label key={e._id} className="flex items-center gap-1">
              <input type="checkbox" checked={selectedAgents.includes(e._id)}
                onChange={(ev) => setSelectedAgents(ev.target.checked ? [...selectedAgents, e._id] : selectedAgents.filter((id) => id !== e._id))} />
              {e.name} ({normalizeRole(e.role) || 'No role'})
            </label>
          ))}
        </div>
        {campaigns.length > 0 && (
          <select onChange={(e) => e.target.value && handleAssign(e.target.value)} className="border p-2 rounded" defaultValue="">
            <option value="">Select campaign to assign agents...</option>
            {campaigns.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
      </div>
    </div>
  );
};

export default CampaignTable;
