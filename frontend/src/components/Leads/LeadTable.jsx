import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { FaPlus, FaFileDownload, FaFilter, FaUpload } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { getAllLeads, deleteLead, bulkAssignLeads, importLeads, exportLeads, getAllEmployees } from '../../api/services/projectServices';
import * as XLSX from 'xlsx';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';

const LEAD_STATUSES = ['New', 'Contacted', 'Follow-up', 'Interested', 'Not Interested', 'Converted', 'Lost', 'Wrong Number', 'No Response', 'Busy', 'Switched Off'];

const LeadTable = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '', startDate: '', endDate: '' });
  const [role] = useState(localStorage.getItem("role") || "Superadmin");
  const [selected, setSelected] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignTo, setAssignTo] = useState('');
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const isAdmin = ['Superadmin', 'Admin', 'Manager', 'TeamLeader'].includes(role);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const response = await getAllLeads(params);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.leads || [];
      setLeads(data);
    } catch (err) {
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);
  useEffect(() => {
    if (isAdmin) getAllEmployees().then((r) => r.status === 200 && setEmployees(r.data));
  }, [isAdmin]);

  const handleDelete = async (leadId) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      const response = await deleteLead(leadId);
      if (response?.status === 200) {
        setLeads((prev) => prev.filter((l) => l._id !== leadId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleBulkAssign = async () => {
    if (!selected.length || !assignTo) return alert('Select leads and agent');
    await bulkAssignLeads(selected, assignTo);
    setSelected([]);
    fetchLeads();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'binary' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const res = await importLeads(rows);
      if (res.status === 200) {
        alert(`Imported: ${res.data.results.created}, Skipped: ${res.data.results.skipped}`);
        fetchLeads();
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = async () => {
    const res = await exportLeads(filters);
    const data = res.data?.leads || [];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `Leads_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const columns = useMemo(() => [
    ...(isAdmin ? [{
      Header: '',
      id: 'select',
      Cell: ({ row }) => (
        <input type="checkbox" checked={selected.includes(row.original._id)} onChange={() => toggleSelect(row.original._id)} />
      ),
    }] : []),
    { Header: 'Lead ID', accessor: 'leadId', Cell: ({ value, row }) => value || row.original._id?.slice(-6) },
    { Header: 'Name', accessor: 'name' },
    { Header: 'Contact', accessor: 'contact' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Company', accessor: 'company' },
    { Header: 'Status', accessor: 'status' },
    { Header: 'Priority', accessor: 'priority' },
    { Header: 'Assigned', accessor: 'assignedTo', Cell: ({ value }) => value?.name || '—' },
    { Header: 'Source', accessor: 'source' },
    {
      Header: 'Created',
      accessor: 'createdAt',
      Cell: ({ value }) => value ? new Date(value).toLocaleDateString() : '—',
    },
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }) => (
        <div className="flex gap-1">
          <button onClick={() => navigate(`/lead/${row.original._id}`)} className="bg-gray-500 text-white px-2 py-1 rounded text-xs">Profile</button>
          <button onClick={() => navigate(`/calling/${row.original._id}`)} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Call</button>
          <button onClick={() => navigate(`/lead-edit/${row.original._id}`)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Log</button>
          {isAdmin && (
            <button onClick={() => handleDelete(row.original._id)} className="text-red-500 p-1"><Trash2 size={16} /></button>
          )}
        </div>
      ),
    },
  ], [leads, selected, isAdmin]);

  const tableInstance = useTable({ columns, data: leads, initialState: { pageSize: 15 } }, useGlobalFilter, useSortBy, usePagination);
  const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow, setGlobalFilter, nextPage, previousPage, canNextPage, canPreviousPage, pageOptions, state: { pageIndex, globalFilter } } = tableInstance;

  if (loading) return <div className="mt-32 text-center">Loading...</div>;

  return (
    <div className="mx-auto p-4 mt-20">
      <h2 className="text-4xl font-bold mb-6 text-center">Lead Management</h2>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Search..." value={globalFilter || ''} onChange={(e) => setGlobalFilter(e.target.value)} className="border p-2 rounded w-48" />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="border p-2 rounded">
            <option value="">All Status</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="border p-2 rounded" />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="border p-2 rounded" />
          <button onClick={fetchLeads} className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"><FaFilter className="mr-1" /> Filter</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <>
              <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="bg-purple-500 text-white px-4 py-2 rounded flex items-center"><FaUpload className="mr-1" /> Import</button>
              <button onClick={handleExport} className="bg-green-500 text-white px-4 py-2 rounded flex items-center"><FaFileDownload className="mr-1" /> Export</button>
              <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="border p-2 rounded">
                <option value="">Assign to...</option>
                {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <button onClick={handleBulkAssign} className="bg-orange-500 text-white px-4 py-2 rounded">Bulk Assign</button>
            </>
          )}
          <Link to="/lead-form" className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"><FaPlus className="mr-1" /> Add Lead</Link>
        </div>
      </div>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        {leads.length === 0 ? <p className="text-center p-4">No leads found.</p> : (
          <>
            <table {...getTableProps()} className="w-full">
              <thead className="bg-blue-600 text-white">
                {headerGroups.map((hg) => (
                  <tr {...hg.getHeaderGroupProps()}>
                    {hg.headers.map((col) => (
                      <th {...col.getHeaderProps(col.getSortByToggleProps())} className="p-3 text-left whitespace-nowrap">
                        {col.render('Header')}{col.isSorted ? (col.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()}>
                {page.map((row) => {
                  prepareRow(row);
                  return (
                    <tr {...row.getRowProps()} className="border-b hover:bg-gray-50">
                      {row.cells.map((cell) => (
                        <td {...cell.getCellProps()} className="p-3 whitespace-nowrap">{cell.render('Cell')}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex justify-between p-4">
              <span>Page {pageIndex + 1} of {pageOptions.length}</span>
              <div className="space-x-2">
                <button onClick={previousPage} disabled={!canPreviousPage} className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50">Prev</button>
                <button onClick={nextPage} disabled={!canNextPage} className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LeadTable;
