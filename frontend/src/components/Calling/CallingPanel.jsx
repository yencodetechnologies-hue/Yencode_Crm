import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PhoneCall, PhoneOff, RotateCcw, Save, User } from 'lucide-react';
import { getLeadById, createCall, createFollowUp } from '../../api/services/projectServices';
import { Button, Card, PageShell, useToast } from '../ui';

const CALL_OUTCOMES = ['Connected', 'Missed', 'Busy', 'No Answer', 'Rejected', 'Wrong Number'];

const CallingPanel = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [lead, setLead] = useState(null);
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [timer, setTimer] = useState(0);
  const [active, setActive] = useState(false);
  const [followUp, setFollowUp] = useState({ date: '', time: '' });
  const [isSaving, setIsSaving] = useState(false);

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

  const canDial = Boolean(lead?.contact);

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
    if (!outcome) {
      showToast('Please select a call outcome.', 'info');
      return;
    }
    if (!leadId) {
      showToast('Invalid lead id.', 'error');
      return;
    }
    try {
      setIsSaving(true);
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
      showToast('Call saved successfully.', 'success');
      navigate(`/lead/${leadId}`);
    } catch (e) {
      console.error(e);
      showToast('Failed to save call. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const subtitle = useMemo(() => {
    if (!lead) return '';
    const parts = [lead.contact, lead.email].filter(Boolean);
    return parts.join(' · ');
  }, [lead]);

  if (!lead) return <div className="mt-32 text-center">Loading...</div>;

  return (
    <PageShell
      title="Calling"
      description={
        <span className="inline-flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-900">{lead.name}</span>
          <span className="text-slate-500">{subtitle}</span>
        </span>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to={`/lead/${leadId}`}>
            <Button variant="secondary">Lead Profile</Button>
          </Link>
          <Link to="/calling-queue">
            <Button variant="secondary">Calling Queue</Button>
          </Link>
        </div>
      }
    >
      <div className="max-w-3xl mx-auto">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-500">Call Timer</p>
              <p className="text-5xl font-mono text-slate-900 mt-1">{fmt(timer)}</p>
              <p className="text-sm mt-2">
                Status:{" "}
                <span className={`font-semibold ${active ? "text-green-700" : "text-slate-600"}`}>
                  {active ? "In call" : "Idle"}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-3">
              <Button onClick={dial} disabled={!canDial}>
                <PhoneCall size={18} />
                Call
              </Button>
              <Button variant="danger" onClick={() => setActive(false)} disabled={!active}>
                <PhoneOff size={18} />
                End
              </Button>
              <Button variant="secondary" onClick={redial} disabled={!canDial}>
                <RotateCcw size={18} />
                Redial
              </Button>
            </div>
          </div>

          {!canDial && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              This lead does not have a contact number to dial.
            </div>
          )}
        </Card>

        <Card className="p-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Call Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="border border-slate-300 p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select</option>
                {CALL_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Follow-up Date</label>
              <input
                type="date"
                value={followUp.date}
                onChange={(e) => setFollowUp({ ...followUp, date: e.target.value })}
                className="border border-slate-300 p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-slate-700">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border border-slate-300 p-2 w-full rounded-lg h-28 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Add call notes (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Follow-up Time (optional)</label>
              <input
                type="time"
                value={followUp.time}
                onChange={(e) => setFollowUp({ ...followUp, time: e.target.value })}
                className="border border-slate-300 p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={!followUp.date}
              />
            </div>

            <div className="flex items-end justify-end">
              <Button onClick={save} disabled={isSaving}>
                <Save size={18} />
                {isSaving ? "Saving..." : "Save & Close"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
};

export default CallingPanel;
