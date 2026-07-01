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
import { normalizeRole, isAdminRole, isSalesRole, isEmployeeRole } from "../../utils/roles";
import { PageShell, Card } from "../ui";
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

const iconColorMap = {
  green: { bg: "bg-green-100", text: "text-green-600" },
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  pink: { bg: "bg-pink-100", text: "text-pink-600" },
  red: { bg: "bg-red-100", text: "text-red-600" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
  brown: { bg: "bg-amber-100", text: "text-amber-600" },
  teal: { bg: "bg-teal-100", text: "text-teal-600" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
};

const iconMap = {
  green: Users,
  blue: CalendarCheck,
  orange: Briefcase,
  purple: Palmtree,
  pink: TrendingUp,
  red: FolderKanban,
  yellow: ClipboardList,
  brown: UserCheck,
  teal: Clock,
  emerald: TrendingUp,
};

const StatCard = ({ title, value, loading, iconColor }) => {
  const colors = iconColorMap[iconColor] || iconColorMap.blue;
  const Icon = iconMap[iconColor] || ClipboardList;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? "…" : value}</p>
        </div>
        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      </div>
    </Card>
  );
};

const QuickAction = ({ to, title, description, icon: Icon, color }) => (
  <Link to={to}>
    <Card hover className="p-5 h-full">
      <div className={`w-10 h-10 ${color.bg} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color.text}`} />
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
  const empName = localStorage.getItem("empName") || "there";
  const empId = localStorage.getItem("empId");

  const [hr, setHr] = useState({});
  const [crm, setCrm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
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
  }, [isAdmin, isSales, isEmployee, empId]);

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isEmployee) {
    return (
      <PageShell>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            {getGreeting()}, {empName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{formattedDate}</p>
        </div>

        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <QuickAction
            to="/attendance-form"
            title="Check In"
            description="Mark your attendance for today"
            icon={CalendarCheck}
            color={iconColorMap.blue}
          />
          <QuickAction
            to="/leave"
            title="Apply Leave"
            description="Submit a leave or permission request"
            icon={Palmtree}
            color={iconColorMap.purple}
          />
          <QuickAction
            to="/task"
            title="My Tasks"
            description="View and track your assigned tasks"
            icon={ClipboardList}
            color={iconColorMap.yellow}
          />
        </div>

        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">My Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="My Attendance" value={hr.attendance} loading={loading} iconColor="blue" />
          <StatCard title="My Tasks" value={hr.tasks} loading={loading} iconColor="yellow" />
          <StatCard title="My Leave Requests" value={hr.leave} loading={loading} iconColor="purple" />
          <StatCard title="My Projects" value={hr.projects} loading={loading} iconColor="red" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Dashboard">
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {isAdmin && <StatCard title="Total Employees" value={hr.employees} loading={loading} iconColor="green" />}
        <StatCard title="Attendance" value={hr.attendance} loading={loading} iconColor="blue" />
        <StatCard title="Total Projects" value={hr.projects} loading={loading} iconColor="red" />
        <StatCard title="Tasks" value={hr.tasks} loading={loading} iconColor="yellow" />
        {isAdmin && <StatCard title="Clients" value={hr.clients} loading={loading} iconColor="orange" />}
        <StatCard title="Leave Requests" value={hr.leave} loading={loading} iconColor="purple" />
        <StatCard title="Total Leads" value={hr.leads} loading={loading} iconColor="brown" />
        {isAdmin && <StatCard title="Payrolls" value={hr.payrolls} loading={loading} iconColor="pink" />}
      </div>

      {(isSales || isAdmin) && crm && (
        <>
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Sales & Calling</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
            <StatCard title="New Leads" value={crm.newLeads} loading={loading} iconColor="green" />
            <StatCard title="Assigned Leads" value={crm.assignedLeads} loading={loading} iconColor="purple" />
            <StatCard title="Today's Calls" value={crm.todaysCalls} loading={loading} iconColor="orange" />
            <StatCard title="Connected Calls" value={crm.connectedCalls} loading={loading} iconColor="teal" />
            <StatCard title="Follow-ups Today" value={crm.followUpsToday} loading={loading} iconColor="yellow" />
            <StatCard title="Converted" value={crm.convertedLeads} loading={loading} iconColor="emerald" />
            <StatCard title="Lost" value={crm.lostLeads} loading={loading} iconColor="red" />
            <StatCard title="Revenue" value={`₹${crm.revenue || 0}`} loading={loading} iconColor="pink" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-slate-900">Agent Performance (Today)</h3>
              {!crm.agentPerformance?.length ? (
                <p className="text-slate-500">No data yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="p-2 text-left text-slate-600">Agent</th>
                      <th className="p-2 text-left text-slate-600">Calls</th>
                      <th className="p-2 text-left text-slate-600">Connected</th>
                      <th className="p-2 text-left text-slate-600">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crm.agentPerformance.map((a) => (
                      <tr key={a.agentId} className="border-b border-slate-100">
                        <td className="p-2">{a.name}</td>
                        <td className="p-2">{a.calls}</td>
                        <td className="p-2">{a.connected}</td>
                        <td className="p-2">{a.connectRate}%</td>
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
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {crm.recentActivities.map((a) => (
                    <div key={a._id} className="border-l-4 border-primary pl-3 py-1">
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
