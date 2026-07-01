import React, { useState, useEffect } from "react";
import { getDashboardMetrics } from "../../api/services/projectServices";

const METRIC_CARDS = [
  { key: 'totalLeads', title: 'Total Leads', color: 'blue' },
  { key: 'newLeads', title: 'New Leads', color: 'green' },
  { key: 'assignedLeads', title: 'Assigned Leads', color: 'purple' },
  { key: 'todaysCalls', title: "Today's Calls", color: 'orange' },
  { key: 'connectedCalls', title: 'Connected Calls', color: 'teal' },
  { key: 'followUpsToday', title: 'Follow-ups Today', color: 'yellow' },
  { key: 'convertedLeads', title: 'Converted Leads', color: 'emerald' },
  { key: 'lostLeads', title: 'Lost Leads', color: 'red' },
  { key: 'revenue', title: 'Revenue', color: 'pink', prefix: '₹' },
];

const colorMap = {
  blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
  orange: 'bg-orange-500', teal: 'bg-teal-500', yellow: 'bg-yellow-500',
  emerald: 'bg-emerald-500', red: 'bg-red-500', pink: 'bg-pink-500',
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboardMetrics()
      .then((res) => {
        if (res.status === 200) setMetrics(res.data);
        else setError('Failed to load metrics');
      })
      .catch(() => setError('Failed to load metrics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mt-32 text-center">Loading dashboard...</div>;
  if (error) return <div className="mt-32 text-center text-red-500">{error}</div>;

  return (
    <div className="px-6 mt-28 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center">Telecaller Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
        {METRIC_CARDS.map(({ key, title, color, prefix }) => (
          <div key={key} className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm">{title}</p>
              <p className="text-3xl font-bold mt-1">
                {prefix || ''}{metrics[key] ?? 0}
              </p>
            </div>
            <div className={`w-12 h-12 ${colorMap[color]} rounded-full opacity-80`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Agent Performance (Today)</h3>
          {metrics.agentPerformance?.length === 0 ? (
            <p className="text-gray-500">No data</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="p-2 text-left">Agent</th>
                <th className="p-2 text-left">Calls</th>
                <th className="p-2 text-left">Connected</th>
                <th className="p-2 text-left">Rate</th>
                <th className="p-2 text-left">Conversions</th>
              </tr></thead>
              <tbody>
                {metrics.agentPerformance?.map((a) => (
                  <tr key={a.agentId} className="border-b">
                    <td className="p-2">{a.name}</td>
                    <td className="p-2">{a.calls}</td>
                    <td className="p-2">{a.connected}</td>
                    <td className="p-2">{a.connectRate}%</td>
                    <td className="p-2">{a.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Activities</h3>
          {metrics.recentActivities?.length === 0 ? (
            <p className="text-gray-500">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {metrics.recentActivities?.map((a) => (
                <div key={a._id} className="border-l-4 border-blue-400 pl-3 py-1">
                  <p className="text-sm font-medium">{a.type?.replace('_', ' ')} — {a.leadId?.name || 'Lead'}</p>
                  <p className="text-xs text-gray-500">{a.description}</p>
                  <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
