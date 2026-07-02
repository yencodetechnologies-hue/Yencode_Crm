import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLeadById, getCallsByLead, createCall, createFollowUp } from '../../api/services/projectServices';

const CALL_OUTCOMES = ['Connected', 'Missed', 'Busy', 'No Answer', 'Rejected', 'Wrong Number'];

const LeadEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callForm, setCallForm] = useState({ outcome: '', notes: '', duration: 0 });
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadRes, callsRes] = await Promise.all([
          getLeadById(id),
          getCallsByLead(id),
        ]);
        if (leadRes.status === 200) setLead(leadRes.data.data);
        if (callsRes.status === 200) setCalls(callsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const startCall = () => {
    if (lead?.contact) window.open(`tel:${lead.contact}`, '_self');
    setTimerActive(true);
    setTimer(0);
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmitCall = async (e) => {
    e.preventDefault();
    if (!callForm.outcome) return alert('Select call outcome');

    try {
      const startedAt = new Date(Date.now() - timer * 1000);
      await createCall({
        leadId: id,
        agentId: localStorage.getItem('empId'),
        outcome: callForm.outcome,
        notes: callForm.notes,
        duration: timer,
        startedAt,
        endedAt: new Date(),
      });

      if (scheduleFollowUp && followUpDate) {
        await createFollowUp({
          leadId: id,
          agentId: localStorage.getItem('empId'),
          date: followUpDate,
          time: followUpTime,
          notes: callForm.notes,
          priority: 'Medium',
        });
      }

      const callsRes = await getCallsByLead(id);
      if (callsRes.status === 200) setCalls(callsRes.data);
      setCallForm({ outcome: '', notes: '', duration: 0 });
      setTimer(0);
      setTimerActive(false);
      setScheduleFollowUp(false);
      alert('Call logged successfully');
    } catch (err) {
      alert('Failed to log call');
    }
  };

  if (loading) return <div className="mt-32 text-center">Loading...</div>;
  if (!lead) return <div className="mt-32 text-center">Lead not found</div>;

  return (
    <div className="mx-auto p-6 mt-24 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Call Log — {lead.name}</h2>
        <div className="space-x-2">
          <Link to={`/lead/${id}`} className="bg-gray-500 text-white px-4 py-2 rounded">Profile</Link>
          <Link to={`/calling/${id}`} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded">Calling Panel</Link>
          <button onClick={() => navigate('/lead-table')} className="bg-blue-500 text-white px-4 py-2 rounded">Back</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Lead Info</h3>
          <p><strong>ID:</strong> {lead.leadId || lead._id}</p>
          <p><strong>Contact:</strong> {lead.contact}</p>
          <p><strong>Email:</strong> {lead.email}</p>
          <p><strong>Company:</strong> {lead.company}</p>
          <p><strong>Status:</strong> {lead.status}</p>
          <p><strong>Priority:</strong> {lead.priority}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Log Call</h3>
          <div className="flex items-center gap-4 mb-4">
            <button onClick={startCall} className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded">Click to Call</button>
            <span className="text-2xl font-mono">{formatTime(timer)}</span>
            {timerActive && (
              <button onClick={() => setTimerActive(false)} className="bg-red-500 text-white px-4 py-2 rounded">Stop</button>
            )}
          </div>
          <form onSubmit={handleSubmitCall} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Outcome</label>
              <select
                value={callForm.outcome}
                onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                className="border p-2 w-full rounded"
                required
              >
                <option value="">Select outcome</option>
                {CALL_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={callForm.notes}
                onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                className="border p-2 w-full rounded h-24"
              />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={scheduleFollowUp} onChange={(e) => setScheduleFollowUp(e.target.checked)} />
              Schedule follow-up
            </label>
            {scheduleFollowUp && (
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="border p-2 rounded" />
                <input type="time" value={followUpTime} onChange={(e) => setFollowUpTime(e.target.value)} className="border p-2 rounded" />
              </div>
            )}
            <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded w-full">Save Call Log</button>
          </form>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Call History</h3>
        {calls.length === 0 ? (
          <p className="text-gray-500">No calls logged yet.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Outcome</th>
                <th className="p-2 text-left">Duration</th>
                <th className="p-2 text-left">Notes</th>
                <th className="p-2 text-left">Agent</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c._id} className="border-b">
                  <td className="p-2">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="p-2">{c.outcome}</td>
                  <td className="p-2">{c.duration}s</td>
                  <td className="p-2">{c.notes}</td>
                  <td className="p-2">{c.agentId?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeadEdit;
