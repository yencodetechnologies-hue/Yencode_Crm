import React, { useState, useMemo, useEffect } from 'react';
import {
    useTable,
    useGlobalFilter,
    useSortBy,
    usePagination
} from 'react-table';
import { Trash2, Eye } from 'lucide-react';
import { FaPlus, FaFileDownload } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getAllTasks, deleteTask, updateTaskStatus } from '../../api/services/projectServices';
import * as XLSX from 'xlsx';
import {
    PageShell, Card, Button, Input, Label, Badge, Modal, Spinner, EmptyState, DataTableToolbar, Select, useToast,
} from '../ui';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [role, setRole] = useState(localStorage.getItem("role") || "Superadmin");
    const [searchTerm, setSearchTerm] = useState('');
    const id = localStorage.getItem("empId");
    console.log("Fetching tasks for ID:", id);

    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await getAllTasks(id);
                console.log("Full API Response:", response.data);

                let taskList = response.data.tasks || response.data;

                if (!Array.isArray(taskList)) {
                    throw new Error("Unexpected API response format");
                }

                const updatedTasks = taskList.map(task => {
                    if (task.date) {
                        const dateObj = new Date(task.date);
                        task.date = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear().toString().slice(-2)}`;
                    }

                    if (task.createdAt) {
                        const createdAtObj = new Date(task.createdAt);
                        let hours = createdAtObj.getHours();
                        const minutes = createdAtObj.getMinutes().toString().padStart(2, '0');
                        const seconds = createdAtObj.getSeconds().toString().padStart(2, '0');
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        hours = hours % 12 || 12;
                        task.createDate = `${createdAtObj.getDate().toString().padStart(2, '0')}/${(createdAtObj.getMonth() + 1).toString().padStart(2, '0')}/${createdAtObj.getFullYear()}`;
                        task.createTime = `${hours}:${minutes}:${seconds} ${ampm}`;
                    }

                    return task;
                });

                setTasks(updatedTasks);
            } catch (err) {
                console.error("Error fetching tasks:", err);
                setError("Failed to load task data");
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [role, id]);



    const handleDelete = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await deleteTask(taskId);
                if (response.status === 200) {
                    setTasks(tasks.filter((task) => task._id !== taskId));
                }
            } catch (err) {
                setError('Failed to delete task');
            }
        }
    };

    const handleEdit = (taskId) => {
        navigate(`/task-edit/${taskId}`);
    };

    const handleView = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    const exportToExcel = () => {
        const exportData = tasks.map((task, index) => ({
            'S.No': index + 1,
            'Task ID': task._id,
            'Task Name': task.task,
            'Project': task.project,
            'Employee': task.empId,
            'Description': task.description,
            'Timeline': task.timeline,
            'Date': task.date,
            'Status': task.status
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Task Records");
        XLSX.writeFile(workbook, `Task_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const filteredTasks = useMemo(() => {
        if (!Array.isArray(tasks)) return []; 
        return tasks.filter(task => {
            if (role === "Superadmin") return true;
            return task.status?.toLowerCase() === "pending";
        }).filter(task =>
            task.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tasks, role, searchTerm]);


    const applyDateFilter = () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }
        const start = new Date(startDate.split('/').reverse().join('/'));
        const end = new Date(endDate.split('/').reverse().join('/'));

        const filteredTasks = tasks.filter((task) => {
            const taskDateParts = task.date.split('/');
            const taskDate = new Date(`20${taskDateParts[2]}-${taskDateParts[1]}-${taskDateParts[0]}`);

            return taskDate >= start && taskDate <= end;
        });

        setTasks(filteredTasks);
    };

    const columns = useMemo(() => [
        {
            Header: 'S.No',
            accessor: (row, index) => index + 1,
        },
        {
            Header: 'Task Name',
            accessor: 'task',
        },
        {
            Header: 'Project',
            accessor: 'project',
        },
        {
            Header: 'Employee',
            accessor: 'empId',
        },
        {
            Header: 'Description',
            accessor: 'description',
        },
        {
            Header: 'Timeline',
            accessor: 'timeline',
        },
        {
            Header: 'Date',
            accessor: 'date',
        },
        {
            Header: 'Status',
            accessor: 'status',
            Cell: ({ row }) => {
                const handleStatusChange = async (e) => {
                    const updatedStatus = e.target.value;
                    try {
                        const taskId = row.original._id;
                        await updateTaskStatus(taskId, {
                            status: updatedStatus,
                        });
                        row.original.status = updatedStatus;
                        setTasks([...tasks]);
                    } catch (err) {
                        showToast("Failed to update status", "error");
                    }
                };

                return role === "Superadmin" ? (
                    <Select
                        value={row.original.status || "Pending"}
                        onChange={handleStatusChange}
                        className="w-auto min-w-[130px]"
                    >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </Select>
                ) : (
                    <Badge status={row.original.status || "Pending"} />
                );
            },
        },
        {
            Header: 'Attachment', 
            accessor: 'attachments',
            Cell: ({ value }) => {
                if (value) {
                    return (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            View Attachment
                        </a>
                    );
                }
                return <span>No Attachment</span>;
            },
        },
        {
            Header: 'Created Date & Time',
            accessor: 'createDate', 
            Cell: ({ row }) =>
                row.original.createDate && row.original.createTime ? (
                    <>
                        {row.original.createDate}
                        <br />
                        {row.original.createTime}
                    </>
                ) : (
                    'N/A'
                ),
            id: 'created_date_time',
        },
        {
            Header: 'Actions',
            accessor: '_id',
            Cell: ({ row }) => (
                <div className="flex justify-center space-x-2">
                    <button
                        className="text-blue-500 hover:bg-blue-100 p-2 rounded-full transition-colors"
                        title="View Task"
                        onClick={() => handleView(row.original)}
                    >
                        <Eye size={20} />
                    </button>
                    <button
                        className={`text-primary p-2 rounded-full transition-colors ${role !== "Superadmin" ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-light'}`}
                        title="Delete Task"
                        onClick={() => handleDelete(row.original._id)}
                        disabled={role !== "Superadmin"}
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            )
        }
    ], [tasks]);

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
            data: filteredTasks,
            initialState: { pageSize: 10 }
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const { globalFilter, pageIndex } = state;

    if (loading) {
        return (
            <PageShell title="My Tasks">
                <Spinner className="py-20" />
            </PageShell>
        );
    }

    if (error) {
        return (
            <PageShell title="My Tasks">
                <EmptyState title="Error" description={error} />
            </PageShell>
        );
    }

    return (
        <PageShell
            title="My Tasks"
            description="View and track your assigned tasks"
            actions={
                role === "Superadmin" && (
                    <>
                        <Button variant="secondary" onClick={exportToExcel}>
                            <FaFileDownload /> Export
                        </Button>
                        <Link to="/task-form">
                            <Button><FaPlus /> Add Task</Button>
                        </Link>
                    </>
                )
            }
        >
            <DataTableToolbar
                searchValue={globalFilter}
                onSearchChange={setGlobalFilter}
                searchPlaceholder="Search tasks..."
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
                {tasks.length === 0 ? (
                    <EmptyState title="No tasks found" description="You don't have any tasks assigned yet" />
                ) : (
                <>
                <div className="overflow-x-auto">
                <table {...getTableProps()} className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                                {headerGroups.map(headerGroup => (
                                    <tr {...headerGroup.getHeaderGroupProps()}>
                                        {headerGroup.headers.map(column => (
                                            <th
                                                {...column.getHeaderProps(column.getSortByToggleProps())}
                                                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer whitespace-nowrap"
                                            >
                                                <div className="flex items-center">
                                                    {column.render('Header')}
                                                    <span>
                                                        {column.isSorted
                                                            ? (column.isSortedDesc
                                                                ? ' 🔽'
                                                                : ' 🔼')
                                                            : ''}
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
                                            className="border-b border-slate-100 even:bg-slate-50/50 hover:bg-slate-50 whitespace-nowrap"
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

            <Modal isOpen={isModalOpen && !!selectedTask} onClose={closeModal} title="Task Details" size="md">
                {selectedTask && (
                    <div className="space-y-4 -mt-2">
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ["Task", selectedTask.task],
                                ["Project", selectedTask.project],
                                ["Employee", selectedTask.empId],
                                ["Date", selectedTask.date],
                                ["Timeline", selectedTask.timeline],
                            ].map(([label, value]) => (
                                <div key={label} className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500">{label}</p>
                                    <p className="font-medium text-sm">{value || "—"}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-500">Description</p>
                            <p className="text-sm mt-1">{selectedTask.description || "—"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">Status:</span>
                            <Badge status={selectedTask.status || "Pending"} />
                        </div>
                        {selectedTask.attachments && (
                            <a href={selectedTask.attachments} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                                View Attachment
                            </a>
                        )}
                        <div className="flex justify-end gap-3 pt-2">
                            {role === "Superadmin" && (
                                <Button onClick={() => navigate(`/task-edit/${selectedTask._id}`)}>Edit</Button>
                            )}
                            <Button variant="secondary" onClick={closeModal}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </PageShell>
    );
};

export default TaskList;
