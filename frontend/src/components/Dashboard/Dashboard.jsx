import React, { useState, useEffect } from "react";
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
} from "../../api/services/projectServices";

const Card = ({ title, value, loading, iconColor }) => {
  const colorMap = {
    green: "bg-green-500", blue: "bg-blue-500", orange: "bg-orange-500",
    purple: "bg-purple-500", pink: "bg-pink-500", red: "bg-red-500",
    yellow: "bg-yellow-500", brown: "bg-amber-600", teal: "bg-teal-500",
    emerald: "bg-emerald-500",
  };
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center">
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-1">{loading ? "…" : value}</p>
      </div>
      <div className={`w-12 h-12 ${colorMap[iconColor] || "bg-gray-400"} rounded-full opacity-80`} />
    </div>
  );
};

export default function Dashboard() {
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin" || role === "Superadmin";
  const isSales = role === "Telecaller" || role === "Lead";

  const [hr, setHr] = useState({});
  const [crm, setCrm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
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
          const crmRes = await getDashboardMetrics();
          if (crmRes?.status === 200) setCrm(crmRes.data);
        }
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, isSales]);

  return (
    <div className="px-6 mt-28 max-w-7xl mx-auto pb-10">
      <h2 className="text-3xl font-bold mb-8 text-center">Dashboard</h2>

      <h3 className="text-lg font-semibold text-gray-700 mb-4">Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {isAdmin && <Card title="Total Employees" value={hr.employees} loading={loading} iconColor="green" />}
        <Card title="Attendance" value={hr.attendance} loading={loading} iconColor="blue" />
        <Card title="Total Projects" value={hr.projects} loading={loading} iconColor="red" />
        <Card title="Tasks" value={hr.tasks} loading={loading} iconColor="yellow" />
        {isAdmin && <Card title="Clients" value={hr.clients} loading={loading} iconColor="orange" />}
        <Card title="Leave Requests" value={hr.leave} loading={loading} iconColor="purple" />
        <Card title="Total Leads" value={hr.leads} loading={loading} iconColor="brown" />
        {isAdmin && <Card title="Payrolls" value={hr.payrolls} loading={loading} iconColor="pink" />}
      </div>

      {(isSales || isAdmin) && crm && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Sales & Calling</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
            <Card title="New Leads" value={crm.newLeads} loading={loading} iconColor="green" />
            <Card title="Assigned Leads" value={crm.assignedLeads} loading={loading} iconColor="purple" />
            <Card title="Today's Calls" value={crm.todaysCalls} loading={loading} iconColor="orange" />
            <Card title="Connected Calls" value={crm.connectedCalls} loading={loading} iconColor="teal" />
            <Card title="Follow-ups Today" value={crm.followUpsToday} loading={loading} iconColor="yellow" />
            <Card title="Converted" value={crm.convertedLeads} loading={loading} iconColor="emerald" />
            <Card title="Lost" value={crm.lostLeads} loading={loading} iconColor="red" />
            <Card title="Revenue" value={`₹${crm.revenue || 0}`} loading={loading} iconColor="pink" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Agent Performance (Today)</h3>
              {!crm.agentPerformance?.length ? (
                <p className="text-gray-500">No data yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b">
                    <th className="p-2 text-left">Agent</th><th className="p-2 text-left">Calls</th>
                    <th className="p-2 text-left">Connected</th><th className="p-2 text-left">Rate</th>
                  </tr></thead>
                  <tbody>
                    {crm.agentPerformance.map((a) => (
                      <tr key={a.agentId} className="border-b">
                        <td className="p-2">{a.name}</td>
                        <td className="p-2">{a.calls}</td>
                        <td className="p-2">{a.connected}</td>
                        <td className="p-2">{a.connectRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Activities</h3>
              {!crm.recentActivities?.length ? (
                <p className="text-gray-500">No recent activity</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {crm.recentActivities.map((a) => (
                    <div key={a._id} className="border-l-4 border-blue-400 pl-3 py-1">
                      <p className="text-sm font-medium">{a.type?.replace("_", " ")} — {a.leadId?.name || "Lead"}</p>
                      <p className="text-xs text-gray-500">{a.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
