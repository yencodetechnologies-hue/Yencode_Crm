import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getTotalEmployees,
  getAttendance,
  getTotalProjects,
  getTasks,
  getClients,
  getLeave,
  getTotalLeads,
  getTotalPayrolls,
  getDashboardMetrics,
  getAllTasks,
  getAllLeaves,
  getAllProjects,
} from "../../api/services/projectServices";
import { projectServices } from "../../api/axios/axiosInstance";
import { normalizeRole, isAdminRole, isSalesRole, isEmployeeRole, isTelecallerRole } from "../../utils/roles";
import { PageShell, Card } from "../ui";
import TelecallerDashboard from "./TelecallerDashboard";
import {
  CalendarCheck,
  ClipboardList,
  FolderKanban,
  Palmtree,
  Clock,
  Users,
  Briefcase,
  UserCheck,
  TrendingUp,
} from "lucide-react";

const iconMap = {
  employees: Users,
  attendance: CalendarCheck,
  projects: FolderKanban,
  tasks: ClipboardList,
  clients: Briefcase,
  leave: Palmtree,
  leads: UserCheck,
  payrolls: TrendingUp,
  calls: Clock,
  revenue: TrendingUp,
};

const StatCard = ({ title, value, loading, icon, label }) => {
  const Icon = icon || ClipboardList;

  return (
    <Card className="p-6 border-l-4 border-primary shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-slate-500 text-sm font-medium">{title}</p>
            {label && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-light text-primary-dark font-semibold">
                {label}
              </span>
            )}
          </div>
          {loading ? (
            <div className="mt-2 h-9 w-28 rounded-md bg-slate-100 animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-slate-900 mt-1 truncate">{value}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </Card>
  );
};

const QuickAction = ({ to, title, description, icon: Icon }) => (
  <Link to={to}>
    <Card hover className="p-5 h-full border border-slate-200">
      <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </Card>
  </Link>
);

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const role = normalizeRole(localStorage.getItem("role"));
  const isAdmin = isAdminRole(role);
  const isSales = isSalesRole(role);
  const isEmployee = isEmployeeRole(role);
  const isTelecaller = isTelecallerRole(role);
  const empName = localStorage.getItem("empName") || "there";
  const empId = localStorage.getItem("empId");

  const [hr, setHr] = useState({});
  const [crm, setCrm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Telecallers have a dedicated dashboard component.
        if (isTelecaller) return;

        if (isEmployee && empId) {
          const today = new Date();
          const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const formattedStart = firstDayOfLastMonth.toISOString().split("T")[0];
          const formattedEnd = today.toISOString().split("T")[0];

          const [tasksRes, attRes, leaveRes, projRes] = await Promise.all([
            getAllTasks(empId),
            projectServices.get(`/attendance/attendance-all/${empId}`),
            getAllLeaves(empId, formattedStart, formattedEnd),
            getAllProjects(empId),
          ]);

          const taskList = tasksRes?.data?.tasks || tasksRes?.data || [];
          const attList = Array.isArray(attRes?.data) ? attRes.data : [];
          const leaveList = Array.isArray(leaveRes?.data) ? leaveRes.data : [];
          const projList = Array.isArray(projRes?.data) ? projRes.data : [];

          setHr({
            attendance: attList.length,
            projects: projList.length,
            tasks: Array.isArray(taskList) ? taskList.length : 0,
            leave: leaveList.length,
          });
        } else {
          const hrPromises = [
            getTotalEmployees(), getAttendance(), getTotalProjects(), getTasks(),
            getClients(), getLeave(), getTotalLeads(), getTotalPayrolls(),
          ];
          const [emp, att, proj, task, client, leave, leads, payroll] = await Promise.all(hrPromises);

          setHr({
            employees: emp?.status === 200 ? emp.data.TotalEmployee : 0,
            attendance: att?.status === 200 ? att.data.TotalAttendance : 0,
            projects: proj?.status === 200 ? proj.data.TotalProjects : 0,
            tasks: task?.status === 200 ? task.data.TotalTasks : 0,
            clients: client?.status === 200 ? client.data.TotalClients : 0,
            leave: leave?.status === 200 ? leave.data.TotalLeaveRequests : 0,
            leads: leads?.status === 200 ? leads.data.TotalLeads : 0,
            payrolls: payroll?.status === 200 ? payroll.data.TotalPayrolls : 0,
          });

          if (isSales || isAdmin) {
            const crmRes = await getDashboardMetrics(
              isSales && !isAdmin ? { scope: "mine" } : {}
            );
            if (crmRes?.status === 200) setCrm(crmRes.data);
          }
        }
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, isSales, isEmployee, isTelecaller, empId]);

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isTelecaller) {
    return <TelecallerDashboard />;
  }

  if (isEmployee) {
    return (
      <PageShell>
        <Card className="p-6 mb-8 overflow-hidden">
          <div className="rounded-xl p-6 bg-gradient-to-r from-primary-dark via-primary to-blue-400 text-white">
            <p className="text-sm text-white/90">{formattedDate}</p>
            <h1 className="text-2xl sm:text-3xl font-semibold mt-1">
              {getGreeting()}, {empName}
            </h1>
            <p className="text-sm text-white/90 mt-1">
              Welcome back. Here is a quick summary of your day.
            </p>
          </div>
        </Card>

        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <QuickAction
            to="/attendance-form"
            title="Check In"
            description="Mark your attendance for today"
            icon={CalendarCheck}
          />
          <QuickAction
            to="/leave"
            title="Apply Leave"
            description="Submit a leave or permission request"
            icon={Palmtree}
          />
          <QuickAction
            to="/task"
            title="My Tasks"
            description="View and track your assigned tasks"
            icon={ClipboardList}
          />
        </div>

        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">My Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="My Attendance" value={hr.attendance} loading={loading} icon={iconMap.attendance} label="HR" />
          <StatCard title="My Tasks" value={hr.tasks} loading={loading} icon={iconMap.tasks} label="Work" />
          <StatCard title="My Leave Requests" value={hr.leave} loading={loading} icon={iconMap.leave} label="HR" />
          <StatCard title="My Projects" value={hr.projects} loading={loading} icon={iconMap.projects} label="Work" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Dashboard">
      <Card className="p-6 mb-8 overflow-hidden">
        <div className="rounded-xl p-6 bg-gradient-to-r from-primary-dark via-primary to-blue-400 text-white">
          <p className="text-sm text-white/90">{formattedDate}</p>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1">{getGreeting()}</h1>
          <p className="text-sm text-white/90 mt-1">
            Track HR and CRM performance at a glance.
          </p>
        </div>
      </Card>

      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">HR Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {isAdmin && <StatCard title="Total Employees" value={hr.employees} loading={loading} icon={iconMap.employees} label="HR" />}
        <StatCard title="Attendance" value={hr.attendance} loading={loading} icon={iconMap.attendance} label="HR" />
        <StatCard title="Total Projects" value={hr.projects} loading={loading} icon={iconMap.projects} label="Work" />
        <StatCard title="Tasks" value={hr.tasks} loading={loading} icon={iconMap.tasks} label="Work" />
        {isAdmin && <StatCard title="Clients" value={hr.clients} loading={loading} icon={iconMap.clients} label="Clients" />}
        <StatCard title="Leave Requests" value={hr.leave} loading={loading} icon={iconMap.leave} label="HR" />
        <StatCard title="Total Leads" value={hr.leads} loading={loading} icon={iconMap.leads} label="CRM" />
        {isAdmin && <StatCard title="Payrolls" value={hr.payrolls} loading={loading} icon={iconMap.payrolls} label="HR" />}
      </div>

      {(isSales || isAdmin) && crm && (
        <>
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Sales & Calling</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
            <StatCard title="New Leads" value={crm.newLeads} loading={loading} icon={iconMap.leads} label="CRM" />
            <StatCard title="Assigned Leads" value={crm.assignedLeads} loading={loading} icon={iconMap.leads} label="CRM" />
            <StatCard title="Today's Calls" value={crm.todaysCalls} loading={loading} icon={iconMap.calls} label="Calls" />
            <StatCard title="Connected Calls" value={crm.connectedCalls} loading={loading} icon={iconMap.calls} label="Calls" />
            <StatCard title="Follow-ups Today" value={crm.followUpsToday} loading={loading} icon={iconMap.calls} label="CRM" />
            <StatCard title="Converted" value={crm.convertedLeads} loading={loading} icon={iconMap.leads} label="CRM" />
            <StatCard title="Lost" value={crm.lostLeads} loading={loading} icon={iconMap.leads} label="CRM" />
            <StatCard title="Revenue" value={`₹${crm.revenue || 0}`} loading={loading} icon={iconMap.revenue} label="₹" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-slate-900">Agent Performance (Today)</h3>
              {!crm.agentPerformance?.length ? (
                <p className="text-slate-500">No data yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary-light/60 border-b border-slate-200">
                      <th className="p-3 text-left text-slate-700 font-semibold">Agent</th>
                      <th className="p-3 text-left text-slate-700 font-semibold">Calls</th>
                      <th className="p-3 text-left text-slate-700 font-semibold">Connected</th>
                      <th className="p-3 text-left text-slate-700 font-semibold">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crm.agentPerformance.map((a, idx) => (
                      <tr
                        key={a.agentId}
                        className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-100`}
                      >
                        <td className="p-3 font-medium text-slate-900">{a.name}</td>
                        <td className="p-3 text-slate-700">{a.calls}</td>
                        <td className="p-3 text-slate-700">{a.connected}</td>
                        <td className="p-3 text-slate-700">{a.connectRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-slate-900">Recent Activities</h3>
              {!crm.recentActivities?.length ? (
                <p className="text-slate-500">No recent activity</p>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {crm.recentActivities.map((a) => (
                    <div key={a._id} className="relative pl-6">
                      <span className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                      <span className="absolute left-1.5 top-4 bottom-0 w-px bg-primary/30" />
                      <p className="text-sm font-medium text-slate-900">
                        {a.type?.replace("_", " ")} — {a.leadId?.name || "Lead"}
                      </p>
                      <p className="text-xs text-slate-500">{a.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </PageShell>
  );
}
