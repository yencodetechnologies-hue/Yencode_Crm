import React, { useState, useMemo, useEffect } from 'react';
import {
    useTable,
    useGlobalFilter,
    useSortBy,
    usePagination
} from 'react-table';
import { Edit, Trash2 } from 'lucide-react';
import { FaPlus, FaFileDownload } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getAllLeaves, updateLeaveStatus, deleteLeave } from '../../api/services/projectServices';
import * as XLSX from 'xlsx';
import {
    PageShell, Card, Button, Input, Label, Badge, Spinner, EmptyState, DataTableToolbar, Select,
} from '../ui';

const LeaveTable = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [role, setRole] = useState(localStorage.getItem("role") || "Superadmin");
    const id = localStorage.getItem("empId");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                const today = new Date();
                const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const formattedStartDate = firstDayOfLastMonth.toISOString().split('T')[0];
                const formattedEndDate = today.toISOString().split('T')[0];

                const response = await getAllLeaves(id, formattedStartDate, formattedEndDate);

                if (!response || !response.data || (response.status && response.status >= 400)) {
                    throw new Error("Failed to load leave data");
                }

                setLeaves(response.data);
            } catch (err) {
                console.error(err);
                setError("Failed to load leave data");
                setLeaves([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaves();
    }, [id]);

    const handleStatusChange = async (leaveId, newStatus) => {
        try {
            const response = await updateLeaveStatus(leaveId, {
                status: newStatus,
                statusChangeDate: new Date().toISOString()
            });

            if (response.status === 200) {
                setLeaves(leaves.map(leave =>
                    leave._id === leaveId
                        ? { ...leave, status: newStatus, statusChangeDate: new Date().toISOString() }
                        : leave
                ));
            }
        } catch (err) {
            setError('Failed to update status');
        }
    };

    const handleDelete = async (leaveId) => {
        if (window.confirm('Are you sure you want to delete this leave?')) {
            try {
                const response = await deleteLeave(leaveId);
                if (response.status === 200) {
                    setLeaves(leaves.filter((leave) => leave._id !== leaveId));
                }
            } catch (err) {
                setError('Failed to delete leave');
            }
        }
    };

    const handleEdit = (leaveId) => {
        navigate(`/leave-edit/${leaveId}`);
    };

    const exportToExcel = () => {
        const exportData = leaves.map((leave, index) => ({
            'S.No': index + 1,
            'Leave ID': leave.row._id,
            'Name': leave.employee,
            'Running Projects': leave.runningProjects,
            'Leave Dates': leave.leaveDates,
            'Notes': leave.notes,
            'Status': leave.status,
            'Approved By': leave.approvedBy,
            'Status Change Date': leave.statusChangeDate,
            'Leave Applied On': leave.leaveAppliedOn
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Records");
        XLSX.writeFile(workbook, `Leave_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const applyDateFilter = () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const filteredLeaves = leaves.filter((leave) => {
            const leaveDate = new Date(leave.leaveAppliedOn);
            return leaveDate >= start && leaveDate <= end;
        });

        setLeaves(filteredLeaves);
    };


    const columns = useMemo(() => {
        const baseColumns = [
            {
                Header: 'S.No',
                accessor: (row, index) => index + 1,
                Cell: ({ value }) => <span className="whitespace-nowrap">{value}</span>
            },
            // {
            //     Header: 'Leave ID',
            //     accessor: row => row._id,
            //     id: 'leaveIdColumn',
            // },
            {
                Header: 'Employee',
                accessor: 'employee',
                Cell: ({ value }) => <span className="whitespace-nowrap">{value}</span>
            },
            {
                Header: 'Category',
                accessor: 'leaveCategory',
                Cell: ({ value }) => <span className="whitespace-nowrap">{value}</span>
            },
            {
                Header: 'Leave Type',
                accessor: 'leaveType',
                Cell: ({ value }) => <span className="whitespace-nowrap">{value}</span>
            },
            {
                Header: 'Applied Date',
                accessor: (row) =>
                    row.createdAt ? (
                        <span className="whitespace-nowrap">
                            {new Date(row.createdAt).toLocaleDateString('en-GB')}<br />
                            {new Date(row.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </span>
                    ) : 'N/A',
            },
            {
                Header: 'Leave / Permission Range',
                accessor: (row) => {
                    if (row.leaveCategory === 'Leave') {
                        return row.startDate && row.endDate
                            ? (
                                <div className="text-center">
                                    <span>{new Date(row.startDate).toLocaleDateString('en-GB')} to {new Date(row.endDate).toLocaleDateString('en-GB')}</span>
                                </div>
                            )
                            : 'N/A';
                    } else if (row.leaveCategory === 'Permission') {
                        if (row.permissionDate && row.startTime && row.endTime) {
                            const permissionDate = new Date(row.permissionDate).toLocaleDateString('en-GB');

                            const formatTime = (time) => {
                                const [hours, minutes] = time.split(':');
                                let formattedHours = parseInt(hours, 10);
                                const ampm = formattedHours >= 12 ? 'PM' : 'AM';
                                formattedHours = formattedHours % 12 || 12; 
                                return `${formattedHours}:${minutes} ${ampm}`;
                            };

                            return (
                                <div className="flex flex-col ">
                                    <span>{permissionDate}</span>
                                    <span>{formatTime(row.startTime)} to {formatTime(row.endTime)}</span>
                                </div>
                            );
                        }
                        return 'N/A';
                    }
                    return 'N/A';
                }
            },

            {
                Header: 'Notes',
                accessor: 'remarks',
                Cell: ({ value }) => (
                    <div className="w-[300px] break-words whitespace-pre-wrap overflow-hidden max-h-[30rem]">
                        {value}
                    </div>
                ),
            },

            {
                Header: 'Attachment',
                accessor: 'attachment',
                Cell: ({ value }) => (
                    <div className="whitespace-nowrap">
                        {value ? <img src={value} alt="Attachment" className="w-12 h-12 object-cover rounded" /> : 'No attachment'}
                    </div>
                ),
            },
            {
                Header: 'Status',
                accessor: 'status',
                Cell: ({ row }) => (
                    role === "Superadmin" ? (
                        <Select
                            value={row.original.status}
                            onChange={(e) => handleStatusChange(row.original._id, e.target.value)}
                            className="w-auto min-w-[120px]"
                        >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </Select>
                    ) : (
                        <Badge status={row.original.status} />
                    )
                )
            },
            {
                Header: 'Running Projects',
                accessor: 'runningProjects',
                Cell: ({ value }) => <span className="whitespace-nowrap">{value}</span>
            },
            {
                Header: 'Approved By',
                accessor: 'approvedBy',
                Cell: ({ value }) => <span className="whitespace-nowrap">{value}</span>
            },
            {
                Header: 'Approved Date & Time',
                accessor: (row) =>
                    row.statusChangeDate ? (
                        <span className="whitespace-nowrap">
                            {new Date(row.statusChangeDate).toLocaleDateString('en-GB')}<br />
                            {new Date(row.statusChangeDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                    ) : 'N/A',
            }
        ];


        if (role !== "Superadmin") {
            baseColumns.push({
                Header: 'Actions',
                accessor: '_id',
                Cell: ({ row }) => (
                    <div className="flex justify-center space-x-2">
                        <button
                            className="text-green-500 hover:bg-green-100 p-2 rounded-full transition-colors"
                            title="Edit Leave"
                            onClick={() => handleEdit(row.original._id)}
                        >
                            <Edit size={20} />
                        </button>
                        <button
                            className="text-red-500 hover:bg-red-100 p-2 rounded-full transition-colors"
                            title="Delete Leave"
                            onClick={() => handleDelete(row.original._id)}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                )
            });
        }

        return baseColumns;
    }, [role]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        state,
        setGlobalFilter,
        nextPage,
        previousPage,
        canNextPage,
        canPreviousPage,
        pageOptions,
    } = useTable(
        {
            columns,
            data: leaves,
            initialState: { pageSize: 10 }
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const { globalFilter, pageIndex } = state;

    if (loading) {
        return (
            <PageShell title="Leave Requests">
                <Spinner className="py-20" />
            </PageShell>
        );
    }

    if (error) {
        return (
            <PageShell title="Leave Requests">
                <EmptyState title="Error" description={error} />
            </PageShell>
        );
    }

    return (
        <PageShell
            title="Leave Requests"
            description="View and manage your leave applications"
            actions={
                <>
                    {role === "Superadmin" && (
                        <Button variant="secondary" onClick={exportToExcel}>
                            <FaFileDownload /> Export
                        </Button>
                    )}
                    <Link to="/leave">
                        <Button><FaPlus /> Apply Leave</Button>
                    </Link>
                </>
            }
        >
            <DataTableToolbar
                searchValue={globalFilter}
                onSearchChange={setGlobalFilter}
                searchPlaceholder="Search leave records..."
                filters={
                    role === "Superadmin" && (
                        <div className="flex flex-wrap items-end gap-3">
                            <div>
                                <Label>Start Date</Label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
                            </div>
                            <div>
                                <Label>End Date</Label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
                            </div>
                            <Button variant="secondary" onClick={applyDateFilter}>Apply Filter</Button>
                        </div>
                    )
                }
            />

            <Card className="overflow-hidden">
                {leaves.length === 0 ? (
                    <EmptyState
                        title="No leave records"
                        description="You haven't submitted any leave requests yet"
                        action={<Link to="/leave"><Button>Apply Leave</Button></Link>}
                    />
                ) : (
                <>
                <div className="overflow-x-auto">
                <table {...getTableProps()} className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                                {headerGroups.map((headerGroup) => (
                                    <tr {...headerGroup.getHeaderGroupProps()}>
                                        {headerGroup.headers.map((column) => (
                                            <th
                                                {...column.getHeaderProps(column.getSortByToggleProps())}
                                                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer whitespace-nowrap"
                                            >
                                                <div className="flex items-center">
                                                    {column.render("Header")}
                                                    <span>
                                                        {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>

                            <tbody {...getTableBodyProps()}>
                                {page.map(row => {
                                    prepareRow(row);
                                    return (
                                        <tr
                                            {...row.getRowProps()}
                                            className="border-b border-slate-100 even:bg-slate-50/50 hover:bg-slate-50"
                                        >
                                            {row.cells.map(cell => (
                                                <td {...cell.getCellProps()} className="px-4 py-3">
                                                    {cell.render('Cell')}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                </div>

                <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200 bg-slate-50">
                    <span className="text-sm text-slate-600">
                        Page <strong>{pageIndex + 1}</strong> of <strong>{pageOptions.length}</strong>
                    </span>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={previousPage} disabled={!canPreviousPage}>Previous</Button>
                        <Button variant="secondary" size="sm" onClick={nextPage} disabled={!canNextPage}>Next</Button>
                    </div>
                </div>
                </>
                )}
            </Card>
        </PageShell>
    );
};

export default LeaveTable;