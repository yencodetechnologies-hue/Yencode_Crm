import React, { useEffect, useState, useMemo } from "react";
import { Eye, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FaFileDownload } from "react-icons/fa";
import { deletetheProject, getAllProjects } from "../../api/services/projectServices";
import {
  PageShell, Card, Button, Input, Label, Badge, Modal, Spinner, EmptyState, DataTableToolbar, useToast,
} from "../ui";
import { isEmployeeRole } from "../../utils/roles";

const ProjectDetailsModal = ({ project, isOpen, onClose, onEdit, role }) => {
  const renderArrayData = (array, field) => {
    if (!array || !Array.isArray(array) || array.length === 0) return "N/A";
    return array.map((item) => item[field]).filter(Boolean).join(", ");
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Details" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 -mt-2 max-h-[60vh] overflow-y-auto">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Project Information</h3>
          <div className="space-y-2 text-sm">
            {[
              ["Project Name", renderArrayData(project.projectDetails, "projectName")],
              ["Tech Stack", renderArrayData(project.projectDetails, "techStack")],
              ["Type", renderArrayData(project.projectDetails, "type")],
              ["Category", renderArrayData(project.projectDetails, "category")],
              ["Domain", renderArrayData(project.projectDetails, "domain")],
              ["Description", renderArrayData(project.projectDetails, "description")],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-1 border-b border-slate-100">
                <span className="text-slate-500 shrink-0">{label}</span>
                <span className="font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Additional Details</h3>
          <div className="space-y-2 text-sm">
            {[
              ["Duration", renderArrayData(project.projectDetails, "duration")],
              ["Company", renderArrayData(project.projectDetails, "companyName")],
              ["Assigned To", renderArrayData(project.additionalDetails, "assignedTo")],
              ["Quoted Value", renderArrayData(project.financialDetails, "quotedValue")],
              ["Approved Value", renderArrayData(project.financialDetails, "approvedValue")],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-1 border-b border-slate-100">
                <span className="text-slate-500 shrink-0">{label}</span>
                <span className="font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
        {role === "Superadmin" && (
          <Button onClick={() => onEdit(project)}>Edit</Button>
        )}
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};


const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const ITEMS_PER_PAGE = 10; 
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [role, setRole] = useState(localStorage.getItem("role") || "Superadmin");
  const id = localStorage.getItem("empId");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEmployee = isEmployeeRole(role);


  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getAllProjects(id);
        const data = response.data;
        if (response.status === 200) {
          setProjects(data);
        } else {
          throw new Error("Failed to fetch projects");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [id]);

  const getLatestValue = (array, field) => {
    if (!array || !Array.isArray(array) || array.length === 0) return "N/A";
    const uniqueValues = [...new Set(array.map(item => item[field]).filter(Boolean))];
    return uniqueValues.join(", ") || "N/A";
  };

  const processedProjects = useMemo(() => {
    return projects?.map(project => ({
      ...project,
      displayData: {
        projectName: getLatestValue(project.projectDetails, 'projectName'),
        techStack: getLatestValue(project.projectDetails, 'techStack'),
        companyName: getLatestValue(project.projectDetails, 'companyName'),
        assignedTo: getLatestValue(project.additionalDetails, 'assignedTo'),
        duration: getLatestValue(project.projectDetails, 'duration'),
        task: getLatestValue(project.projectDetails, 'task'),
        status: getLatestValue(project.additionalDetails, 'status'),
        createdDate: project.additionalDetails?.[0]?.createdDate
          ? new Date(project.additionalDetails[0].createdDate).toLocaleString()
          : "N/A"
      }
    }))
      .filter(project =>
        role === "Superadmin" || project.displayData.status.toLowerCase() === "pending"
      );
  }, [projects, role]);

  const handleAddProject = () => {
    navigate('/add-project');
  };

  const handleDelete = async (projectId) => {
    if (!projectId) {
      alert("Invalid project ID. Unable to delete.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        const response = await deletetheProject(projectId);

        if (response?.status === 200) {
          setProjects((prevProjects) =>
            prevProjects.filter((project) => project._id !== projectId)
          );
          alert("Project deleted successfully!");
        } else {
          alert("Failed to delete project. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        alert(
          error.response?.data?.message ||
          "An error occurred while deleting the project."
        );
      }
    }
  };

  const handleExportData = () => {
    const csvRows = [];
    const headers = [
      "Project Name",
      "Tech Stack",
      "Client Company",
      "Assigned To",
      "Duration",
      "Tasks",
      "Status",
      "Created Date",
    ];
    csvRows.push(headers.join(","));

    processedProjects.forEach((project) => {
      const row = [
        project.displayData.projectName,
        project.displayData.techStack,
        project.displayData.companyName,
        project.displayData.assignedTo,
        project.displayData.duration,
        project.displayData.task,
        project.displayData.status,
        project.displayData.createdDate,
      ];
      csvRows.push(row.map((value) => `"${value}"`).join(","));
    });

    const csvContent = `data:text/csv;charset=utf-8,${csvRows.join("\n")}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "projects.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const filteredProjects = projects.filter((project) => {
      const projectDate = new Date(project.additionalDetails?.[0]?.createdDate);
      return projectDate >= start && projectDate <= end;
    });

    setProjects(filteredProjects);
  };

  const handleView = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleEdit = (project) => {
    navigate(`/edit-project/${project._id}`);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...processedProjects];

    if (searchTerm) {
      filtered = filtered.filter((project) => {
        const searchString = searchTerm.toLowerCase();
        return (
          project.displayData.projectName.toLowerCase().includes(searchString) ||
          project.displayData.techStack.toLowerCase().includes(searchString) ||
          project.displayData.companyName.toLowerCase().includes(searchString) ||
          project.displayData.assignedTo.toLowerCase().includes(searchString)
        );
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a.displayData[sortConfig.key] || '';
        const bValue = b.displayData[sortConfig.key] || '';

        if (sortConfig.key === 'createdDate') {
          return sortConfig.direction === 'asc'
            ? new Date(aValue) - new Date(bValue)
            : new Date(bValue) - new Date(aValue);
        }

        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }

    return filtered;
  }, [processedProjects, searchTerm, sortConfig]);

  const paginatedProjects = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredAndSortedProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedProjects, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProjects.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <PageShell title="Projects">
        <Spinner className="py-20" />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Projects">
        <EmptyState title="Error" description={error} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Projects"
      description="View your assigned projects"
      actions={
        role === "Superadmin" && (
          <>
            <Button onClick={handleAddProject}>Add Project</Button>
            <Button variant="secondary" onClick={handleExportData}>
              <FaFileDownload /> Export
            </Button>
          </>
        )
      }
    >
      <DataTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search projects..."
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

      {paginatedProjects.length === 0 ? (
        <EmptyState title="No projects found" description="No projects match your search" />
      ) : isEmployee ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProjects.map((project) => (
            <Card key={project._id} hover className="p-5" onClick={() => handleView(project)}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-900 line-clamp-1">{project.displayData.projectName}</h3>
                <Badge status={project.displayData.status} />
              </div>
              <p className="text-sm text-slate-500 mb-1">{project.displayData.companyName}</p>
              <p className="text-xs text-slate-400 mb-3">{project.displayData.techStack}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Assigned: {project.displayData.assignedTo}</span>
                <span>{project.displayData.duration}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">S.No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer" onClick={() => handleSort('projectName')}>Project Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer" onClick={() => handleSort('techStack')}>Tech Stack</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer" onClick={() => handleSort('companyName')}>Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer" onClick={() => handleSort('assignedTo')}>Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer" onClick={() => handleSort('status')}>Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.map((project, index) => (
                    <tr key={project._id} className="border-b border-slate-100 even:bg-slate-50/50 hover:bg-slate-50">
                      <td className="px-4 py-3">{currentPage * ITEMS_PER_PAGE + index + 1}</td>
                      <td className="px-4 py-3 font-medium">{project.displayData.projectName}</td>
                      <td className="px-4 py-3">{project.displayData.techStack}</td>
                      <td className="px-4 py-3">{project.displayData.companyName}</td>
                      <td className="px-4 py-3">{project.displayData.assignedTo}</td>
                      <td className="px-4 py-3"><Badge status={project.displayData.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-primary hover:bg-primary-light p-2 rounded-lg" onClick={() => handleView(project)} title="View">
                            <Eye size={18} />
                          </button>
                          {role === "Superadmin" && (
                            <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg" onClick={() => handleDelete(project._id)} title="Delete">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-600">Page <strong>{currentPage + 1}</strong> of <strong>{totalPages || 1}</strong></span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))} disabled={currentPage === 0}>
                <ChevronLeft size={16} /> Previous
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))} disabled={currentPage + 1 >= totalPages}>
                Next <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isEmployee && paginatedProjects.length > 0 && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))} disabled={currentPage === 0}>
            <ChevronLeft size={16} /> Previous
          </Button>
          <span className="flex items-center text-sm text-slate-600 px-2">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))} disabled={currentPage + 1 >= totalPages}>
            Next <ChevronRight size={16} />
          </Button>
        </div>
      )}

      <ProjectDetailsModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEdit={handleEdit}
        role={role}
      />
    </PageShell>
  );
};

export default ProjectManager;