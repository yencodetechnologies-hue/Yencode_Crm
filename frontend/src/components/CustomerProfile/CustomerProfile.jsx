import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getLeadById,
  getCallsByLead,
  getFollowUps,
  getActivitiesByLead,
  createNote,
} from '../../api/services/projectServices';

const TABS = ['Details', 'Call History', 'Follow-ups', 'Activity Timeline', 'Documents', 'Remarks'];

const CustomerProfile = () => {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [calls, setCalls] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('Details');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [leadRes, callsRes, fuRes, actRes] = await Promise.all([
          getLeadById(id),
          getCallsByLead(id),
          getFollowUps({ leadId: id }),
          getActivitiesByLead(id),
        ]);
        if (leadRes.status === 200) setLead(leadRes.data.data);
        if (callsRes.status === 200) setCalls(callsRes.data);
        if (fuRes.status === 200) setFollowUps(fuRes.data);
        if (actRes.status === 200) setActivities(actRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await createNote(id, note);
      const actRes = await getActivitiesByLead(id);
      if (actRes.status === 200) setActivities(actRes.data);
      setNote('');
    } catch (e) {
      alert('Failed to add note');
    }
  };

  if (loading) return <div className="mt-32 text-center">Loading...</div>;
  if (!lead) return <div className="mt-32 text-center">Lead not found</div>;

  return (
    <div className="mx-auto p-6 mt-24 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">{lead.name}</h2>
          <p className="text-gray-500">{lead.leadId} · {lead.status}</p>
        </div>
        <div className="space-x-2">
          <Link to={`/calling/${id}`} className="bg-green-500 text-white px-4 py-2 rounded">Call</Link>
          <Link to={`/lead-edit/${id}`} className="bg-blue-500 text-white px-4 py-2 rounded">Log Call</Link>
        </div>
      </div>

      <div className="flex border-b mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600 font-semibold' : 'text-gray-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Details' && (
        <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-4">
          <div><strong>Mobile:</strong> {lead.contact}</div>
          <div><strong>Alt Number:</strong> {lead.alternateContact || '—'}</div>
          <div><strong>Email:</strong> {lead.email || '—'}</div>
          <div><strong>Company:</strong> {lead.company || '—'}</div>
          <div><strong>Source:</strong> {lead.source || '—'}</div>
          <div><strong>Priority:</strong> {lead.priority}</div>
          <div><strong>City:</strong> {lead.city || lead.location || '—'}</div>
          <div><strong>State:</strong> {lead.state || '—'}</div>
          <div><strong>Interest:</strong> {lead.interest || lead.requirements || '—'}</div>
          <div><strong>Assigned To:</strong> {lead.assignedTo?.name || 'Unassigned'}</div>
          <div className="col-span-2"><strong>Address:</strong> {lead.address || '—'}</div>
          <div className="col-span-2"><strong>Comments:</strong> {lead.comments || '—'}</div>
        </div>
      )}

      {activeTab === 'Call History' && (
        <div className="bg-white rounded-lg shadow p-6">
          {calls.length === 0 ? <p>No calls yet.</p> : (
            <table className="w-full">
              <thead className="bg-blue-600 text-white"><tr>
                <th className="p-2 text-left">Date</th><th className="p-2 text-left">Outcome</th>
                <th className="p-2 text-left">Duration</th><th className="p-2 text-left">Notes</th>
              </tr></thead>
              <tbody>{calls.map((c) => (
                <tr key={c._id} className="border-b">
                  <td className="p-2">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="p-2">{c.outcome}</td>
                  <td className="p-2">{c.duration}s</td>
                  <td className="p-2">{c.notes}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'Follow-ups' && (
        <div className="bg-white rounded-lg shadow p-6">
          {followUps.length === 0 ? <p>No follow-ups scheduled.</p> : (
            <table className="w-full">
              <thead className="bg-blue-600 text-white"><tr>
                <th className="p-2 text-left">Date</th><th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Priority</th><th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Notes</th>
              </tr></thead>
              <tbody>{followUps.map((f) => (
                <tr key={f._id} className="border-b">
                  <td className="p-2">{new Date(f.date).toLocaleDateString()}</td>
                  <td className="p-2">{f.time || '—'}</td>
                  <td className="p-2">{f.priority}</td>
                  <td className="p-2">{f.status}</td>
                  <td className="p-2">{f.notes}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'Activity Timeline' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {activities.length === 0 ? <p>No activity yet.</p> : activities.map((a) => (
            <div key={a._id} className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="font-medium">{a.type.replace('_', ' ')}</p>
              <p className="text-sm text-gray-600">{a.description}</p>
              <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()} · {a.performedBy?.name || 'System'}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Documents' && (
        <div className="bg-white rounded-lg shadow p-6 text-gray-500">
          Document upload coming in Phase 2.
        </div>
      )}

      {activeTab === 'Remarks' && (
        <div className="bg-white rounded-lg shadow p-6">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} className="border p-2 w-full rounded h-24 mb-2" placeholder="Add a remark..." />
          <button onClick={handleAddNote} className="bg-blue-500 text-white px-4 py-2 rounded">Add Remark</button>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
