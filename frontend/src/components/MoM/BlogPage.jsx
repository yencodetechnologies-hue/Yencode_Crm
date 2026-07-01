import React, { useEffect, useState } from 'react';
import { deleteMoM, getMoM } from '../../api/services/projectServices';
import { Calendar, Clock, MapPin, Download, MoreVertical, Eye, Edit, Trash, FileText, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import {
    PageShell, Card, Button, Input, Label, Modal, Spinner, EmptyState, DataTableToolbar, useToast,
} from '../ui';
import { isEmployeeRole } from '../../utils/roles';

const BlogPage = () => {
    const [meetingData, setMeetingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [role, setRole] = useState(localStorage.getItem("role") || "Superadmin");
    const navigate = useNavigate();
    const { showToast } = useToast();
    const isEmployee = isEmployeeRole(role);

    useEffect(() => {
        const fetchMeetingData = async () => {
            try {
                const response = await getMoM();
                console.log(response);
                setMeetingData(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching meeting data:', err);
                setError('Failed to fetch data');
                setLoading(false);
            }
        };

        fetchMeetingData();
    }, []);

    const handleExportData = () => {
        const exportData = meetingData.map(meeting => ({
            Title: meeting.title,
            Date: meeting.date,
            'Start Time': meeting.startTime,
            'End Time': meeting.endTime,
            Location: meeting.location,
            Agenda: meeting.agenda,
            'Discussion Notes': meeting.discussionNotes,
            'Action Items': meeting.actionItems
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Meeting Minutes');
        XLSX.writeFile(workbook, 'meeting-minutes.xlsx');
    };

    const applyDateFilter = () => {
        if (!startDate || !endDate) {
            showToast('Please select both start and end dates.', 'error');
            return;
        }
        const start = new Date(startDate.split('/').reverse().join('/'));
        const end = new Date(endDate.split('/').reverse().join('/'));

        const filteredMeetings = meetingData.filter((meeting) => {
            const meetingDateParts = meeting.date.split('/');
            const meetingDate = new Date(`20${meetingDateParts[2]}-${meetingDateParts[1]}-${meetingDateParts[0]}`);

            return meetingDate >= start && meetingDate <= end;
        });

        setMeetingData(filteredMeetings);
    };

    const handleAddMoM = () => {
        navigate('/mom');
        console.log('Add MoM button clicked');
    };

    const handleDelete = async (id) => {
        try {
            const isConfirmed = window.confirm('Are you sure you want to delete this meeting?');
            if (!isConfirmed) return;

            await deleteMoM(id);

            setMeetingData(prevData => prevData.filter(meeting => meeting._id !== id));
            console.log('Meeting deleted:', id);
        } catch (err) {
            console.error('Error deleting meeting:', err);
            showToast('Failed to delete meeting. Please try again.', 'error');
        }
    };

    const handleEdit = (meeting) => {
        navigate(`/mom-edit/${meeting._id}`);
        console.log('Edit meeting:', meeting);
    };

    const openModal = (meeting) => {
        setSelectedMeeting(meeting);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <PageShell title="Meeting Minutes">
                <Spinner className="py-20" />
            </PageShell>
        );
    }

    if (error) {
        return (
            <PageShell title="Meeting Minutes">
                <EmptyState title="Error" description={error} />
            </PageShell>
        );
    }

    return (
        <PageShell
            title="Meeting Minutes"
            description="Review meeting notes and action items"
            actions={
                <>
                    {!isEmployee && (
                        <Button onClick={handleAddMoM}>
                            <Plus size={16} /> Add MoM
                        </Button>
                    )}
                    {role === "Superadmin" && (
                        <Button variant="secondary" onClick={handleExportData}>
                            <Download size={16} /> Export
                        </Button>
                    )}
                </>
            }
        >
            <DataTableToolbar
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
                        <Button variant="secondary" onClick={applyDateFilter}>Apply Filter</Button>
                    </div>
                }
            />

            {meetingData.length === 0 ? (
                <EmptyState title="No meetings found" description="No meeting minutes match your filters" />
            ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {meetingData.map((meeting, index) => (
                    <Card key={meeting._id || index} hover className="overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">{meeting.title}</h2>
                            <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400 shrink-0" />
                                    <span>{meeting.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-slate-400 shrink-0" />
                                    <span>{meeting.startTime} - {meeting.endTime}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-slate-400 shrink-0" />
                                    <span>{meeting.location}</span>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-slate-600 line-clamp-2"><strong>Agenda:</strong> {meeting.agenda}</p>
                        </div>
                        <div className="px-6 pb-4 flex justify-between items-center border-t border-slate-100 pt-4">
                            <Button variant="ghost" size="sm" onClick={() => openModal(meeting)}>
                                <Eye size={16} /> View
                            </Button>
                            {!isEmployee && (
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(meeting)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Edit">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(meeting._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                                        <Trash size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
            )}

            <Modal isOpen={isModalOpen && !!selectedMeeting} onClose={() => setIsModalOpen(false)} title={selectedMeeting?.title} size="lg">
                {selectedMeeting && (
                    <div className="space-y-5 -mt-2 text-sm">
                        {[
                            ["Date", selectedMeeting.date],
                            ["Time", `${selectedMeeting.startTime} - ${selectedMeeting.endTime}`],
                            ["Location", selectedMeeting.location],
                            ["Attendees", selectedMeeting.attendees],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <h3 className="font-semibold text-slate-900 mb-1">{label}</h3>
                                <p className="text-slate-600">{value || "—"}</p>
                            </div>
                        ))}
                        {["agenda", "discussionNotes", "actionItems"].map((field) => (
                            <div key={field}>
                                <h3 className="font-semibold text-slate-900 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</h3>
                                <p className="text-slate-600 whitespace-pre-line">{selectedMeeting[field] || "—"}</p>
                            </div>
                        ))}
                        <div className="flex justify-end pt-2">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </PageShell>
    );
};

export default BlogPage;
