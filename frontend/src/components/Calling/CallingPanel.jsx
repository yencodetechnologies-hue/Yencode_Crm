import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLeadById, createCall, createFollowUp } from '../../api/services/projectServices';

const CALL_OUTCOMES = ['Connected', 'Missed', 'Busy', 'No Answer', 'Rejected', 'Wrong Number'];

const CallingPanel = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [active, setActive] = useState(false);
  const [followUp, setFollowUp] = useState({ date: '', time: '' });

  useEffect(() => {
    getLeadById(leadId).then((res) => {
      if (res.status === 200) setLead(res.data.data);
    });
  }, [leadId]);

  useEffect(() => {
    let i;
    if (active) i = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [active]);

  const dial = () => {
    if (lead?.contact) window.open(`tel:${lead.contact}`, '_self');
    setActive(true);
    setTimer(0);
  };

  const redial = () => {
    setTimer(0);
    setActive(true);
    if (lead?.contact) window.open(`tel:${lead.contact}`, '_self');
  };

  const save = async () => {
    if (!outcome) return alert('Select outcome');
    try {
      await createCall({
        leadId,
        agentId: localStorage.getItem('empId'),
        outcome,
        notes,
        duration: timer,
        startedAt: new Date(Date.now() - timer * 1000),
        endedAt: new Date(),
      });
      if (followUp.date) {
        await createFollowUp({ leadId, agentId: localStorage.getItem('empId'), date: followUp.date, time: followUp.time, notes, priority: 'Medium' });
      }
      alert('Call saved');
      navigate(`/lead/${leadId}`);
    } catch (e) {
      alert('Failed to save call');
    }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!lead) return <div className="mt-32 text-center">Loading...</div>;

  return (
    <div className="mx-auto p-6 mt-24 max-w-2xl">
      <h2 className="text-3xl font-bold mb-2 text-center">Calling Panel</h2>
      <p className="text-center text-gray-600 mb-6">{lead.name} · {lead.contact}</p>

      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-5xl font-mono mb-6">{fmt(timer)}</p>
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={dial} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full text-lg">Call</button>
          <button onClick={() => setActive(false)} className="bg-red-500 text-white px-8 py-3 rounded-full text-lg">End</button>
          <button onClick={redial} className="bg-yellow-500 text-white px-8 py-3 rounded-full text-lg">Redial</button>
        </div>

        <div className="text-left space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Call Outcome</label>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="border p-2 w-full rounded">
              <option value="">Select</option>
              {CALL_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="border p-2 w-full rounded h-24" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Follow-up Date</label>
              <input type="date" value={followUp.date} onChange={(e) => setFollowUp({ ...followUp, date: e.target.value })} className="border p-2 w-full rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Follow-up Time</label>
              <input type="time" value={followUp.time} onChange={(e) => setFollowUp({ ...followUp, time: e.target.value })} className="border p-2 w-full rounded" />
            </div>
          </div>
          <button onClick={save} className="bg-blue-600 text-white w-full py-3 rounded-lg font-semibold">Save & Close</button>
        </div>
      </div>
    </div>
  );
};

export default CallingPanel;
