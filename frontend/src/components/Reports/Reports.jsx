import React, { useState } from 'react';
import {
  getDailyCallReport,
  getLeadConversionReport,
  getFollowUpReport,
  getMissedCallsReport,
  getCampaignPerformanceReport,
  getAgentPerformanceReport,
  getRevenueReport,
} from '../../api/services/projectServices';
import * as XLSX from 'xlsx';

const REPORT_TYPES = [
  { id: 'daily-calls', label: 'Daily Call Report', fn: getDailyCallReport },
  { id: 'lead-conversion', label: 'Lead Conversion', fn: getLeadConversionReport },
  { id: 'follow-ups', label: 'Follow-up Report', fn: getFollowUpReport },
  { id: 'missed-calls', label: 'Missed Calls', fn: getMissedCallsReport },
  { id: 'campaign', label: 'Campaign Performance', fn: getCampaignPerformanceReport },
  { id: 'agent', label: 'Agent Performance', fn: getAgentPerformanceReport },
  { id: 'revenue', label: 'Revenue Report', fn: getRevenueReport },
];

const Reports = () => {
  const [reportType, setReportType] = useState('daily-calls');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runReport = async () => {
    setLoading(true);
    const report = REPORT_TYPES.find((r) => r.id === reportType);
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    try {
      const res = await report.fn(params);
      if (res.status === 200) setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!data) return;
    const rows = data.calls || data.leads || data.followUps || data.report || data.quotations || (Array.isArray(data) ? data : [data]);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderData = () => {
    if (!data) return null;
    const rows = data.calls || data.leads || data.followUps || data.report || data.quotations || (Array.isArray(data) ? data : null);
    if (!rows) {
      return <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
    }
    if (rows.length === 0) return <p>No data for selected period.</p>;
    const keys = Object.keys(rows[0]).filter((k) => typeof rows[0][k] !== 'object' || rows[0][k] === null);
    return (
      <table className="w-full bg-white shadow rounded mt-4">
        <thead className="bg-blue-600 text-white">
          <tr>{keys.map((k) => <th key={k} className="p-2 text-left">{k}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((row, i) => (
            <tr key={i} className="border-b">
              {keys.map((k) => <td key={k} className="p-2">{String(row[k] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="mx-auto p-6 mt-24 max-w-6xl">
      <h2 className="text-3xl font-bold mb-6">Reports</h2>
      <div className="bg-white shadow rounded p-4 flex flex-wrap gap-4 items-end mb-4">
        <div>
          <label className="block text-sm mb-1">Report Type</label>
          <select value={reportType} onChange={(e) => { setReportType(e.target.value); setData(null); }} className="border p-2 rounded">
            {REPORT_TYPES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm mb-1">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded" />
        </div>
        <button onClick={runReport} disabled={loading} className="bg-blue-500 text-white px-6 py-2 rounded">
          {loading ? 'Loading...' : 'Generate'}
        </button>
        {data && (
          <button onClick={exportData} className="bg-green-500 text-white px-6 py-2 rounded">Export Excel</button>
        )}
      </div>
      {data?.summary && (
        <div className="bg-blue-50 p-4 rounded mb-4 grid grid-cols-4 gap-2">
          {Object.entries(data.summary).map(([k, v]) => (
            <div key={k}><strong>{k}:</strong> {v}</div>
          ))}
        </div>
      )}
      {renderData()}
    </div>
  );
};

export default Reports;
