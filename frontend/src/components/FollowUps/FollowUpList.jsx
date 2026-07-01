import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getFollowUps,
  getTodayFollowUps,
  getCalendarFollowUps,
  completeFollowUp,
  createFollowUp,
  getAllLeads,
} from '../../api/services/projectServices';

const FollowUpList = () => {
  const [view, setView] = useState('today');
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leadId: '', date: '', time: '', notes: '', priority: 'Medium' });
  const [leads, setLeads] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      let res;
      if (view === 'today') res = await getTodayFollowUps();
      else if (view === 'calendar') res = await getCalendarFollowUps(calendarYear, calendarMonth);
      else res = await getFollowUps();
      if (res.status === 200) setFollowUps(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [view, calendarMonth, calendarYear]);

  useEffect(() => {
    getAllLeads().then((res) => {
      if (res.status === 200) setLeads(res.data.leads || res.data);
    });
  }, []);

  const handleComplete = async (id) => {
    await completeFollowUp(id);
    load();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createFollowUp({ ...form, agentId: localStorage.getItem('empId') });
      setShowForm(false);
      setForm({ leadId: '', date: '', time: '', notes: '', priority: 'Medium' });
      load();
    } catch (e) {
      alert('Failed to create follow-up');
    }
  };

  return (
    <div className="mx-auto p-6 mt-24 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Follow-ups</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 text-white px-4 py-2 rounded">
          {showForm ? 'Cancel' : 'Schedule Follow-up'}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {['today', 'all', 'calendar'].map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded ${view === v ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            {v === 'today' ? "Today's List" : v === 'calendar' ? 'Calendar' : 'All'}
          </button>
        ))}
        {view === 'calendar' && (
          <div className="flex gap-2 ml-4">
            <select value={calendarMonth} onChange={(e) => setCalendarMonth(+e.target.value)} className="border p-2 rounded">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <input type="number" value={calendarYear} onChange={(e) => setCalendarYear(+e.target.value)} className="border p-2 rounded w-24" />
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white shadow rounded p-4 mb-6 grid grid-cols-2 gap-4">
          <select value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} className="border p-2 rounded" required>
            <option value="">Select Lead</option>
            {leads.map((l) => <option key={l._id} value={l._id}>{l.name} — {l.contact}</option>)}
          </select>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border p-2 rounded" required />
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="border p-2 rounded" />
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="border p-2 rounded">
            <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
          </select>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="border p-2 rounded col-span-2" placeholder="Notes" />
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded col-span-2">Save</button>
        </form>
      )}

      {loading ? <p>Loading...</p> : followUps.length === 0 ? <p className="text-gray-500">No follow-ups found.</p> : (
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 text-left">Lead</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Priority</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Notes</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {followUps.map((f) => (
              <tr key={f._id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <Link to={`/lead/${f.leadId?._id || f.leadId}`} className="text-blue-600 hover:underline">
                    {f.leadId?.name || '—'}
                  </Link>
                </td>
                <td className="p-3">{new Date(f.date).toLocaleDateString()}</td>
                <td className="p-3">{f.time || '—'}</td>
                <td className="p-3">{f.priority}</td>
                <td className="p-3">{f.status}</td>
                <td className="p-3">{f.notes}</td>
                <td className="p-3">
                  {f.status === 'Pending' && (
                    <button onClick={() => handleComplete(f._id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FollowUpList;
