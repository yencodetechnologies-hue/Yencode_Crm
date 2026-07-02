import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarCheck, PhoneCall, ClipboardList, ArrowRight, Clock } from "lucide-react";
import { Card, PageShell, Button, useToast } from "../ui";
import { getAllLeads, getDashboardMetrics, getTodayCalls, getTodayFollowUps } from "../../api/services/projectServices";

function formatCount(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return String(value);
}

function startOfDayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function TelecallerDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const empName = localStorage.getItem("empName") || "there";
  const empId = localStorage.getItem("empId");

  const [loading, setLoading] = useState(true);
  const [crm, setCrm] = useState(null);
  const [todayCalls, setTodayCalls] = useState(null);
  const [followUpsToday, setFollowUpsToday] = useState([]);
  const [myLeadsCounts, setMyLeadsCounts] = useState({ total: 0, newLeads: 0, followUp: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [metricsRes, callsRes, followRes, leadsRes] = await Promise.all([
          getDashboardMetrics({ scope: "mine" }),
          getTodayCalls({ mine: "true" }),
          getTodayFollowUps({ mine: "true" }),
          getAllLeads({ mine: "true", page: 1, limit: 500 }),
        ]);

        if (metricsRes?.status === 200) setCrm(metricsRes.data);
        if (callsRes?.status === 200) setTodayCalls(callsRes.data);

        const followList = Array.isArray(followRes?.data) ? followRes.data : [];
        setFollowUpsToday(followList);

        const leadsPayload = leadsRes?.data;
        const leadsList =
          Array.isArray(leadsPayload?.data) ? leadsPayload.data : Array.isArray(leadsPayload?.leads) ? leadsPayload.leads : [];

        const total = Array.isArray(leadsList) ? leadsList.length : 0;
        const newLeads = Array.isArray(leadsList) ? leadsList.filter((l) => (l?.status || "").toLowerCase() === "new").length : 0;
        const followUp = Array.isArray(leadsList)
          ? leadsList.filter((l) => String(l?.status || "").toLowerCase().includes("follow")).length
          : 0;
        setMyLeadsCounts({ total, newLeads, followUp });
      } catch (e) {
        console.error("Telecaller dashboard load error:", e);
        showToast("Failed to load telecaller dashboard.", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [empId, showToast]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const nextFollowUp = useMemo(() => {
    if (!followUpsToday?.length) return null;
    return followUpsToday[0];
  }, [followUpsToday]);

  const startCalling = () => {
    // If you want a smarter queue later, this is the single place to change.
    navigate("/calling-queue");
  };

  const statCards = [
    {
      title: "My Leads",
      value: formatCount(myLeadsCounts.total),
      sub: `${formatCount(myLeadsCounts.newLeads)} new · ${formatCount(myLeadsCounts.followUp)} follow-up`,
      icon: ClipboardList,
    },
    {
      title: "Today’s Calls",
      value: formatCount(crm?.todaysCalls ?? todayCalls?.totalCalls ?? 0),
      sub: `${formatCount(crm?.connectedCalls ?? todayCalls?.connectedCalls ?? 0)} connected`,
      icon: PhoneCall,
    },
    {
      title: "Follow-ups Today",
      value: formatCount(crm?.followUpsToday ?? followUpsToday.length),
      sub: nextFollowUp?.leadId?.name ? `Next: ${nextFollowUp.leadId.name}` : "Stay on schedule",
      icon: Clock,
    },
    {
      title: "Attendance",
      value: "Check in",
      sub: "Mark today’s attendance",
      icon: CalendarCheck,
      action: { label: "Mark", to: "/attendance-form" },
    },
  ];

  return (
    <PageShell>
      <Card className="p-6 mb-8 overflow-hidden">
        <div className="rounded-xl p-6 bg-gradient-to-r from-primary-darker via-primary to-blue-500 text-white">
          <p className="text-sm text-white/90">{formattedDate}</p>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1">
            {greeting}, {empName}
          </h1>
          <p className="text-sm text-white/90 mt-1">
            Your calling and follow-up dashboard for today.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={startCalling}>
              <PhoneCall size={18} />
              Start Calling
            </Button>
            <Link to="/lead-table">
              <Button variant="secondary">
                My Leads
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/followups">
              <Button variant="secondary">Follow-ups</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="p-6 border-l-4 border-primary shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-slate-500 text-sm font-medium">{c.title}</p>
                  {loading ? (
                    <div className="mt-2 h-9 w-28 rounded-md bg-slate-100 animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-slate-900 mt-1 truncate">{c.value}</p>
                  )}
                  <p className="text-sm text-slate-500 mt-1 truncate">{c.sub}</p>
                </div>
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              {c.action && (
                <div className="mt-4">
                  <Link to={c.action.to}>
                    <Button size="sm">{c.action.label}</Button>
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-xl font-semibold text-slate-900">Follow-ups (Today)</h3>
            <Link to="/followups" className="text-sm text-primary font-semibold hover:underline">
              View all
            </Link>
          </div>
          {!followUpsToday?.length ? (
            <p className="text-slate-500">No follow-ups scheduled for today.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {followUpsToday.slice(0, 8).map((f) => (
                <div key={f._id} className="p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {f?.leadId?.name || "Lead"}{" "}
                        <span className="text-slate-500 font-normal">· {f?.leadId?.contact || "—"}</span>
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {f?.time ? `Time: ${f.time}` : "Time not set"} · {f?.notes ? f.notes : "No notes"}
                      </p>
                    </div>
                    {f?.leadId?._id && (
                      <Link to={`/calling/${f.leadId._id}`}>
                        <Button size="sm">
                          <PhoneCall size={16} />
                          Call
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-xl font-semibold text-slate-900">Quick Links</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card hover className="p-5 border border-slate-200">
              <Link to="/calling-queue" className="block">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-3">
                  <PhoneCall className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-slate-900">Calling Queue</h3>
                <p className="text-sm text-slate-500 mt-1">Open your leads with call-first actions.</p>
              </Link>
            </Card>

            <Card hover className="p-5 border border-slate-200">
              <Link to="/attendance-form" className="block">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-3">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-slate-900">Mark Attendance</h3>
                <p className="text-sm text-slate-500 mt-1">Check in with photo capture.</p>
              </Link>
            </Card>
          </div>
          <div className="mt-5 text-xs text-slate-500">
            Last refreshed: {new Date(startOfDayISO()).toLocaleString("en-IN")}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

