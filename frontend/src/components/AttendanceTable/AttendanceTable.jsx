import React, { useState, useMemo, useEffect } from "react";
import {
    useTable,
    useGlobalFilter,
    useSortBy,
    usePagination,
} from "react-table";
import { FaPlus, FaFileDownload, FaEye, FaExclamationTriangle } from "react-icons/fa";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { projectServices } from "../../api/axios/axiosInstance";
import {
    PageShell,
    Card,
    Button,
    Input,
    Label,
    Modal,
    Spinner,
    EmptyState,
    DataTableToolbar,
    useToast,
} from "../ui";

const AttendanceTable = () => {
    const { showToast } = useToast();
    const employeeId = localStorage.getItem("empId");
    const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [role, setRole] = useState(localStorage.getItem("role") || "Superadmin");

    // Work report popup states
    const [showWorkReportModal, setShowWorkReportModal] = useState(false);
    const [workReport, setWorkReport] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [currentRecordId, setCurrentRecordId] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [currentRecordDetails, setCurrentRecordDetails] = useState(null);

    // Function to format time consistently
    const formatTime = (timeString) => {
        if (!timeString) return null;

        // If it's already in the correct format, return as is
        if (timeString.includes("AM") || timeString.includes("PM")) {
            return timeString;
        }

        // If it's in 24-hour format (HH:MM:SS), convert to 12-hour format
        const timeParts = timeString.split(':');
        if (timeParts.length === 3) {
            let hours = parseInt(timeParts[0]);
            const minutes = timeParts[1];
            const seconds = timeParts[2];
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            return `${hours}:${minutes}:${seconds} ${ampm}`;
        }

        // If format is not recognized, return original
        return timeString;
    };

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const response = await projectServices.get(`/attendance/attendance-all/${employeeId}`);
                if (response.status !== 200) {
                    throw new Error("Failed to fetch attendance data.");
                }
                const data = response.data;
                data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                // Format logout times consistently
                const formattedData = data.map(record => ({
                    ...record,
                    logouttime: formatTime(record.logouttime)
                }));

                setAllAttendanceRecords(formattedData);

                const today = new Date().toISOString().split("T")[0];

                if (role === "Superadmin") {
                    setAttendanceRecords(formattedData.filter(record =>
                        new Date(record.createdAt).toISOString().split("T")[0] === today
                    ));
                } else {
                    setAttendanceRecords(formattedData.filter(record =>
                        new Date(record.createdAt).toISOString().split("T")[0] === today
                    ));
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [role, employeeId]);

    const openDetailsModal = (record) => {
        setCurrentRecordDetails(record);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setCurrentRecordDetails(null);
    };

    const openWorkReportModal = (recordId) => {
        setCurrentRecordId(recordId);
        setShowWorkReportModal(true);
    };

    const closeWorkReportModal = () => {
        setShowWorkReportModal(false);
        setWorkReport("");
        setAttachment(null);
        setCurrentRecordId(null);
    };

    const handleAttachmentChange = (e) => {
        setAttachment(e.target.files[0]);
    };

    const submitWorkReport = async () => {
        if (!workReport.trim()) {
            showToast("Please fill in the work report before submitting.", "error");
            return;
        }

        const logoutTime = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        const formData = new FormData();
        formData.append("logouttime", logoutTime);
        formData.append("workReport", workReport);

        if (attachment) {
            formData.append("attachment", attachment);
        }

        try {
            const response = await projectServices.put(`/attendance/logout/${currentRecordId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.status !== 200) {
                throw new Error(`Failed to update logout time`);
            }

            const result = response.data;

            setAttendanceRecords((prevRecords) =>
                prevRecords.map((rec) =>
                    rec._id === currentRecordId
                        ? {
                            ...rec,
                            logouttime: logoutTime,
                            workReport: workReport,
                            attachment: result.updatedAttendance.attachment
                        }
                        : rec
                )
            );

            showToast("Logout time and work report submitted successfully.");
            closeWorkReportModal();
        } catch (err) {
            showToast("Failed to submit work report. Please try again.", "error");
            console.error(err);
        }
    };

    const exportToExcel = () => {
        const exportData = attendanceRecords.map((record, index) => ({
            "S.No": index + 1,
            "Employee ID": record.empId,
            Name: record.employeeName,
            Status: record.createdAt ? "Present" : "Absent",
            Date: new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
            }).format(new Date(record.createdAt)),
            "Login Time": new Date(record.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            "Logout Time": record.logouttime || "Not Set",
            "Work Report": record.workReport || "Not Available",
            "Attachment": record.attachment ? "Yes" : "No",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Records");
        XLSX.writeFile(workbook, `Attendance_Records_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const handleDateFilterChange = () => {
        // if (role !== "Superadmin") return;

        const filteredData = allAttendanceRecords.filter((record) => {
            const recordDate = new Date(record.createdAt).toISOString().split("T")[0];
            const start = startDate ? new Date(startDate).toISOString().split("T")[0] : null;
            const end = endDate ? new Date(endDate).toISOString().split("T")[0] : null;

            if (start && recordDate < start) return false;
            if (end && recordDate > end) return false;

            return true;
        });

        setAttendanceRecords(filteredData);
    };

    const handleSearch = (searchValue) => {
        // if (role !== "Superadmin") return;

        setGlobalFilter(searchValue);
    };

    const getFileNameFromUrl = (url) => {
        if (!url) return "Attachment";
        const parts = url.split('/');
        return parts[parts.length - 1].split('?')[0];
    };

    const columns = useMemo(
        () => [
            {
                Header: "S.No",
                accessor: (row, index) => index + 1,
            },
            {
                Header: "Employee",
                accessor: "employeeId",
                Cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-semibold">{row.original.employeeId}</span>
                        <span className="text-blue-600 font-semibold">{row.original.employeeName}</span>
                    </div>
                ),
            },
            {
                Header: "Photo",
                accessor: "photo",
                Cell: ({ row }) => (
                    <img
                        src={row.original.photo || "https://via.placeholder.com/150"}
                        alt="Employee"
                        className="w-12 h-12 rounded-full object-cover"
                    />
                ),
            },
            {
                Header: "Date",
                accessor: (row) =>
                    new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                    }).format(new Date(row.createdAt)),
            },
            {
                Header: "Login Time",
                accessor: (row) =>
                    new Date(row.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
            },
            {
                Header: "Logout Time",
                accessor: "logouttime",
                Cell: ({ value }) => value ? (
                    value
                ) : (
                    <span className="text-red-600 font-bold flex items-center">
                        <FaExclamationTriangle className="mr-1" />
                        Not Set
                    </span>
                ),
            },
            {
                Header: "Work Report",
                accessor: "workReport",
                Cell: ({ value }) => value ?
                    (value.length > 20 ? `${value.substring(0, 20)}...` : value) :
                    <span className="text-orange-600 font-bold flex items-center">
                        <FaExclamationTriangle className="mr-1" />
                        Not Available
                    </span>,
            },
            {
                Header: "Actions",
                accessor: "_id",
                Cell: ({ row }) => {
                    return (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => openDetailsModal(row.original)}
                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center text-sm"
                                title="View Details"
                            >
                                <FaEye className="mr-1" />
                                View
                            </button>

                            {role !== "Superadmin" && (
                                !row.original.logouttime ? (
                                    <button
                                        onClick={() => openWorkReportModal(row.original._id)}
                                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                                    >
                                        Set Logout
                                    </button>
                                ) : (
                                    <span className="text-gray-500 text-sm">Logout Set</span>
                                )
                            )}
                        </div>
                    );
                },
            },
        ],
        []
    );

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
        setPageSize,
    } = useTable(
        {
            columns,
            data: attendanceRecords,
            initialState: { pageSize: 10, pageIndex: 0 },
            manualPagination: false,
            pageCount: -1,
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const { globalFilter, pageIndex, pageSize } = state;

    if (loading) {
        return (
            <PageShell title="Attendance Records">
                <Spinner className="py-20" />
            </PageShell>
        );
    }
    if (error) {
        return (
            <PageShell title="Attendance Records">
                <EmptyState title="Error loading attendance" description={error} />
            </PageShell>
        );
    }

    return (
        <PageShell
            title="Attendance Records"
            description="View your check-in history and submit work reports"
            actions={
                <>
                    {role === "Superadmin" && (
                        <Button variant="secondary" onClick={exportToExcel}>
                            <FaFileDownload />
                            Export
                        </Button>
                    )}
                    <Link to="/attendance-form">
                        <Button>
                            <FaPlus />
                            Check In
                        </Button>
                    </Link>
                </>
            }
        >
            <DataTableToolbar
                searchValue={globalFilter}
                onSearchChange={handleSearch}
                searchPlaceholder="Search records..."
                filters={
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <Label>Start Date</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
                        </div>
                        <div>
                            <Label>End Date</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
                        </div>
                        <Button variant="secondary" onClick={handleDateFilterChange} className="mb-0">
                            Apply Filter
                        </Button>
                    </div>
                }
            />

            <Card className="overflow-hidden">
                {page.length === 0 ? (
                    <EmptyState
                        title="No attendance records"
                        description="Check in to start tracking your attendance"
                        action={
                            <Link to="/attendance-form">
                                <Button>Check In Now</Button>
                            </Link>
                        }
                    />
                ) : (
                <>
                <div className="overflow-x-auto">
                <table {...getTableProps()} className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                        {headerGroups.map((headerGroup) => {
                            const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
                            return (
                                <tr key={key} {...restHeaderGroupProps}>
                                    {headerGroup.headers.map((column) => {
                                        const { key: colKey, ...restColProps } = column.getHeaderProps(
                                            column.getSortByToggleProps()
                                        );
                                        return (
                                            <th key={colKey} {...restColProps} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                                {column.render("Header")}
                                            </th>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {page.map((row) => {
                            prepareRow(row);
                            const { key, ...restRowProps } = row.getRowProps();
                            return (
                                <tr key={key} {...restRowProps} className="border-b border-slate-100 even:bg-slate-50/50 hover:bg-slate-50">
                                    {row.cells.map((cell) => {
                                        const { key: cellKey, ...restCellProps } = cell.getCellProps();
                                        return (
                                            <td key={cellKey} {...restCellProps} className="px-4 py-3">
                                                {cell.render("Cell")}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>

                <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600">
                            Page {pageIndex + 1} of {pageOptions.length || 1}
                        </span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
                        >
                            {[10, 25, 50, 100].map((size) => (
                                <option key={size} value={size}>Show {size}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={previousPage} disabled={!canPreviousPage}>
                            Previous
                        </Button>
                        <Button variant="secondary" size="sm" onClick={nextPage} disabled={!canNextPage}>
                            Next
                        </Button>
                    </div>
                </div>
                </>
                )}
            </Card>

            <Modal
                isOpen={showWorkReportModal}
                onClose={closeWorkReportModal}
                title="Submit Work Report"
                size="sm"
            >
                <div className="space-y-4 -mt-2">
                    <div>
                        <Label required>Work Report</Label>
                        <textarea
                            value={workReport}
                            onChange={(e) => setWorkReport(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-3 min-h-[150px] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Please provide details of your work today..."
                        />
                    </div>
                    <div>
                        <Label>Attachment (Optional)</Label>
                        <Input type="file" onChange={handleAttachmentChange} />
                        <p className="text-xs text-slate-500 mt-1">Max size: 5MB</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={closeWorkReportModal}>Cancel</Button>
                        <Button onClick={submitWorkReport}>Submit</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showDetailsModal && !!currentRecordDetails}
                onClose={closeDetailsModal}
                title="Attendance Details"
                size="lg"
            >
                {currentRecordDetails && (
                    <div className="space-y-6 -mt-2">
                        <div className="flex items-center gap-4">
                            <img
                                src={currentRecordDetails.photo || "https://via.placeholder.com/150"}
                                alt="Employee"
                                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                            />
                            <div>
                                <h4 className="font-semibold text-slate-900">{currentRecordDetails.employeeName}</h4>
                                <p className="text-sm text-slate-500">ID: {currentRecordDetails.employeeId}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                ["Status", currentRecordDetails.createdAt ? "Present" : "Absent"],
                                ["Date", new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(currentRecordDetails.createdAt))],
                                ["Login Time", new Date(currentRecordDetails.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })],
                                ["Logout Time", currentRecordDetails.logouttime || "Not Set"],
                            ].map(([label, value]) => (
                                <div key={label} className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-500">{label}</p>
                                    <p className="font-medium text-sm">{value}</p>
                                </div>
                            ))}
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-900 mb-2">Work Report</h4>
                            <div className="bg-slate-50 p-4 rounded-lg max-h-48 overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap">
                                {currentRecordDetails.workReport || "No work report submitted."}
                            </div>
                        </div>

                        {currentRecordDetails.attachment && (
                            <a
                                href={currentRecordDetails.attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm flex items-center gap-1"
                            >
                                <FaEye /> View Attachment
                            </a>
                        )}

                        <div className="flex justify-end">
                            <Button variant="secondary" onClick={closeDetailsModal}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </PageShell>
    );
};

export default AttendanceTable;