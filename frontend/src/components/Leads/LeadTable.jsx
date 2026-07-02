import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Trash2, PhoneCall } from 'lucide-react';
import { FaPlus, FaFileDownload, FaFilter, FaUpload } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAllLeads, deleteLead, bulkAssignLeads, importLeads, exportLeads, getAllEmployees } from '../../api/services/projectServices';
import { normalizeRole, isAdminRole, isLeadRole, isTelecallerRole } from '../../utils/roles';
import * as XLSX from 'xlsx';
import { useTable, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import { PageShell, Card, Button, useToast } from '../ui';

const LEAD_STATUSES = ['New', 'Contacted', 'Follow-up', 'Interested', 'Not Interested', 'Converted', 'Lost', 'Wrong Number', 'No Response', 'Busy', 'Switched Off'];
const IMPORT_COLUMNS = [
  'name',
  'contact',
  'alternateContact',
  'email',
  'company',
  'source',
  'city',
  'state',
  'country',
  'address',
  'interest',
  'priority',
  'status',
];

const normalizeHeader = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '');

const pickFirst = (...values) => values.find((v) => v !== undefined && v !== null && String(v).trim() !== '');

const normalizeContact = (value) => {
  if (value === undefined || value === null) return '';
  // Keep only digits; handle Excel numbers cleanly.
  const digits = String(value).replace(/\D/g, '');
  return digits;
};

const mapImportedRow = (row) => {
  const mapped = {};

  // Build a normalized-key lookup from the row (handles "Contact No", "contact_no", etc.)
  const byKey = {};
  Object.keys(row || {}).forEach((k) => {
    byKey[normalizeHeader(k).replace(/\s/g, '')] = row[k];
  });

  mapped.name = pickFirst(byKey.name, byKey.leadname, byKey.customername, byKey.apartmentname, byKey.projectname);
  mapped.contact = normalizeContact(pickFirst(byKey.contact, byKey.contactno, byKey.contactnumber, byKey.mobileno, byKey.mobile, byKey.phone, byKey.phonenumber));
  mapped.alternateContact = normalizeContact(pickFirst(byKey.alternatecontact, byKey.altcontact, byKey.alternateno, byKey.alternatenumber));
  mapped.email = pickFirst(byKey.email, byKey.emailid, byKey.mail);
  mapped.company = pickFirst(byKey.company, byKey.organization, byKey.builder);
  mapped.source = pickFirst(byKey.source, byKey.leadsource) || 'Manual';
  mapped.city = pickFirst(byKey.city) || 'Chennai';
  mapped.state = pickFirst(byKey.state) || 'TN';
  mapped.country = pickFirst(byKey.country) || 'India';
  mapped.address = pickFirst(byKey.address, byKey.location, byKey.fulladdress);
  mapped.interest = pickFirst(byKey.interest, byKey.product, byKey.requirement);
  mapped.priority = pickFirst(byKey.priority) || 'Medium';
  mapped.status = pickFirst(byKey.status) || 'New';

  return mapped;
};

const LeadTable = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '', startDate: '', endDate: '' });
  const [role] = useState(() => normalizeRole(localStorage.getItem("role") || ""));
  const [selected, setSelected] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignTo, setAssignTo] = useState('');
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const isAdmin = isAdminRole(role) || isLeadRole(role);
  const isTelecaller = isTelecallerRole(role);

  const mode = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return (qs.get('mode') || '').toLowerCase();
  }, [location.search]);
  const isCallMode = isTelecaller && mode === 'call';

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (isTelecaller) params.mine = 'true';
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
    if (isAdmin) {
      getAllEmployees({ salesOnly: 'true' }).then((r) => r.status === 200 && setEmployees(r.data));
    }
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
    if (!selected.length || !assignTo) {
      showToast('Select leads and an agent to assign.', 'info');
      return;
    }
    await bulkAssignLeads(selected, assignTo);
    showToast('Leads assigned successfully.', 'success');
    setSelected([]);
    fetchLeads();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const buffer = ev.target.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const rows = rawRows
          .map(mapImportedRow)
          .filter((r) => r && String(r.name || '').trim() && String(r.contact || '').trim());

        if (!rows.length) {
          showToast('No valid rows found. Please ensure Name and Contact No are filled.', 'error', 6000);
          return;
        }

        const res = await importLeads(rows);
        const created = res.data?.results?.created ?? 0;
        const skipped = res.data?.results?.skipped ?? 0;
        const errors = Array.isArray(res.data?.results?.errors) ? res.data.results.errors : [];
        const topErrors = errors.slice(0, 3).map((x) => x?.reason).filter(Boolean);

        showToast(`Imported: ${created}, Skipped: ${skipped}`, 'success');
        if (topErrors.length) {
          showToast(
            `Skipped reasons: ${topErrors.join(' · ')}${errors.length > 3 ? ` (+${errors.length - 3} more)` : ''}`,
            'info',
            7000
          );
        }
        await fetchLeads();
      } catch (err) {
        const apiMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Import failed. Please check the file format.';
        showToast(apiMsg, 'error', 7000);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const sample = [
      {
        name: 'John Doe',
        contact: '9876543210',
        alternateContact: '',
        email: 'john@example.com',
        company: 'Acme Pvt Ltd',
        source: 'Google',
        city: 'Chennai',
        state: 'TN',
        country: 'India',
        address: 'Example street',
        interest: 'Product A',
        priority: 'Medium',
        status: 'New',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sample, { header: IMPORT_COLUMNS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LeadsTemplate');
    XLSX.writeFile(wb, 'Leads_Import_Template.xlsx');
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
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/lead/${row.original._id}`)}>
            Profile
          </Button>
          <Button size="sm" onClick={() => navigate(`/calling/${row.original._id}`)}>
            <PhoneCall size={16} />
            Call
          </Button>
          {!isCallMode && (
            <Button size="sm" variant="ghost" onClick={() => navigate(`/lead-edit/${row.original._id}`)}>
              Log
            </Button>
          )}
          {isAdmin && (
            <button onClick={() => handleDelete(row.original._id)} className="text-red-500 p-1"><Trash2 size={16} /></button>
          )}
        </div>
      ),
    },
  ], [selected, isAdmin, isCallMode, navigate, showToast]);

  const tableInstance = useTable({ columns, data: leads, initialState: { pageSize: 15 } }, useGlobalFilter, useSortBy, usePagination);
  const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow, setGlobalFilter, nextPage, previousPage, canNextPage, canPreviousPage, pageOptions, state: { pageIndex, globalFilter } } = tableInstance;

  if (loading) return <div className="mt-32 text-center">Loading...</div>;

  return (
    <PageShell
      title={isCallMode ? "Calling Queue" : "Lead Management"}
      description={
        isCallMode
          ? "Your leads with call-first actions. Click Call to start and save the outcome."
          : isTelecaller
            ? "Only your assigned leads are shown."
            : "Import, manage, assign, and export leads."
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {isCallMode && (
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          )}
          {!isTelecaller && (
            <Link to="/lead-form">
              <Button>
                <FaPlus />
                Add Lead
              </Button>
            </Link>
          )}
        </div>
      }
    >
      <Card className="p-4">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div className="flex gap-2 flex-wrap">
            <input
              placeholder="Search..."
              value={globalFilter || ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="border p-2 rounded w-56"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="">All Status</option>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {!isCallMode && (
              <>
                <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="border p-2 rounded" />
                <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="border p-2 rounded" />
              </>
            )}
            <Button variant="secondary" onClick={fetchLeads}>
              <FaFilter /> Filter
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {isAdmin && (
              <>
                <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
                <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                  <FaUpload /> Import
                </Button>
                <Button variant="ghost" onClick={downloadTemplate}>
                  Download Template
                </Button>
                <Button onClick={handleExport}>
                  <FaFileDownload /> Export
                </Button>
                <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="border p-2 rounded">
                  <option value="">Assign to...</option>
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name} ({normalizeRole(e.role) || 'No role'})
                    </option>
                  ))}
                </select>
                <Button className="bg-orange-500 hover:bg-orange-600 focus:ring-orange-500" onClick={handleBulkAssign}>
                  Bulk Assign
                </Button>
              </>
            )}
            {!isTelecaller && (
              <Link to="/lead-form">
                <Button variant="secondary">
                  <FaPlus /> Add Lead
                </Button>
              </Link>
            )}
          </div>
        </div>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <div className="overflow-x-auto">
          {leads.length === 0 ? (
            <p className="text-center p-6 text-slate-500">No leads found.</p>
          ) : (
            <>
              <table {...getTableProps()} className="w-full">
                <thead className="bg-primary text-white">
                  {headerGroups.map((hg) => (
                    <tr key={hg.id} {...hg.getHeaderGroupProps()}>
                      {hg.headers.map((col) => (
                        <th
                          key={col.id}
                          {...col.getHeaderProps(col.getSortByToggleProps())}
                          className="p-3 text-left whitespace-nowrap text-sm font-semibold"
                        >
                          {col.render('Header')}
                          {col.isSorted ? (col.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {page.map((row) => {
                    prepareRow(row);
                    return (
                      <tr key={row.id} {...row.getRowProps()} className="border-b hover:bg-slate-50">
                        {row.cells.map((cell) => (
                          <td key={cell.column.id} {...cell.getCellProps()} className="p-3 whitespace-nowrap text-sm">
                            {cell.render('Cell')}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex flex-wrap justify-between items-center gap-3 p-4">
                <span className="text-sm text-slate-600">Page {pageIndex + 1} of {pageOptions.length}</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={previousPage} disabled={!canPreviousPage}>Prev</Button>
                  <Button variant="secondary" size="sm" onClick={nextPage} disabled={!canNextPage}>Next</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </PageShell>
  );
};

export default LeadTable;
