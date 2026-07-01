import React, { useState, useEffect } from "react";
import { employeename, createLeave } from "../../api/services/projectServices";
import { useNavigate } from "react-router-dom";
import { PageShell, Card, Button, Input, Select, Label, Spinner, useToast } from "../ui";

function Leave() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const id = localStorage.getItem("empId");
  const [role, setRole] = useState(localStorage.getItem("role") || "Superadmin");
  const [leave, setLeave] = useState({
    employee: "",
    leaveCategory: "",
    leaveType: "",
    customLeaveType: "", 
    customPermissonType: "",
    permissionDate: "",
    startDate: "",
    endDate: "",
    timeRange: "",
    remarks: "",
    attachment: "",
    startTime: "",
    endTime: "",
  });

  const [currentDate, setCurrentDate] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const response = await employeename(`${id}`);
        console.log("Employees fetched:", response);

        if (response) {
          setEmployees(response.data);
          setError(null);

          if (role !== "Superadmin" && response.data.length > 0) {
            setLeave((prev) => ({ ...prev, employee: response.data[0].name }));
          }
        } else {
          throw new Error("Failed to fetch employees.");
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setError("Failed to fetch employees. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
    setCurrentDate(new Date().toISOString().split("T")[0]);
  }, [role, id]);


  const leaveTypes = ["Sick Leave", "Casual Leave", "Emergency Leave", "Sick Permission", "Casual Permission", "Emergency Permission", "Others",];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeave((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setLeave((prev) => ({ ...prev, [name]: files[0] }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    const finalLeaveType =
      leave.leaveType === "Others" ? leave.customLeaveType : leave.leaveType;

    const finalPermissionType =
      leave.leaveType === "Others" ? leave.customPermissionType : leave.leaveType;
    Object.keys(leave).forEach((key) => {
      if (key !== "attachment") {
        if (key === "leaveType") {
          formData.append("leaveType", leave.leaveCategory === "Leave" ? finalLeaveType : finalPermissionType);
        } else {
          formData.append(key, leave[key]);
        }
      }
    });

    if (leave.attachment) {
      formData.append("attachment", leave.attachment);
    }

    try {
      const response = await createLeave(formData);
      console.log(response);

      if (response.status === 201) {
        showToast("Leave request submitted successfully!");
        setLeave({
          employee: "",
          leaveCategory: "",
          leaveType: "",
          customLeaveType: "",
          customPermissonType: "",
          permissionDate: "",
          startDate: "",
          endDate: "",
          timeRange: "",
          remarks: "",
          attachment: "",
          startTime: "",
          endTime: "",
        });
        navigate("/leave-table");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      showToast("There was an error submitting the data.", "error");
    }
  };



  if (loading) {
    return (
      <PageShell title="Apply for Leave">
        <Spinner className="py-20" />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Apply for Leave">
        <p className="text-center text-red-600 py-10">{error}</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Apply for Leave"
      description="Submit a leave or permission request"
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-6">Request Details</h3>
          <div className="space-y-5">
            {role === "Superadmin" ? (
              <div>
                <Label required>Select Employee</Label>
                <Select name="employee" value={leave.employee} onChange={handleChange} required>
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee.name}>{employee.name}</option>
                  ))}
                </Select>
              </div>
            ) : (
              <div>
                <Label>Employee Name</Label>
                <Input type="text" value={leave.employee} readOnly className="bg-slate-100" />
              </div>
            )}
            <div>
              <Label required>Category</Label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="leaveCategory" value="Leave" onChange={handleChange} checked={leave.leaveCategory === "Leave"} className="text-primary" />
                  <span className="text-sm">Leave</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="leaveCategory" value="Permission" onChange={handleChange} checked={leave.leaveCategory === "Permission"} className="text-primary" />
                  <span className="text-sm">Permission</span>
                </label>
              </div>
            </div>

            {leave.leaveCategory === "Leave" && (
              <div>
                <Label required>Leave Type</Label>
                <Select name="leaveType" value={leave.leaveType} onChange={handleChange} required>
                  <option value="">Select Leave Type</option>
                  {leaveTypes.filter(type => !type.includes("Permission")).map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </Select>
              </div>
            )}
            {leave.leaveType === "Others" && leave.leaveCategory === "Leave" && (
              <div>
                <Label>Specify Leave Type</Label>
                <textarea name="customLeaveType" value={leave.customLeaveType} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter custom leave type" />
              </div>
            )}
            {leave.leaveCategory === "Leave" && (
              <div>
                <Label required>Leave Dates</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Input type="date" name="startDate" value={leave.startDate} onChange={handleChange} required min={currentDate} />
                  <span className="text-slate-500 text-sm">to</span>
                  <Input type="date" name="endDate" value={leave.endDate} onChange={handleChange} required min={currentDate} />
                </div>
              </div>
            )}
            {leave.leaveCategory === "Permission" && (
              <div>
                <Label required>Permission Type</Label>
                <Select name="leaveType" value={leave.leaveType} onChange={handleChange} required>
                  <option value="">Select Permission Type</option>
                  {leaveTypes.filter(type => type.includes("Permission") || type === "Others").map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </Select>
              </div>
            )}
            {leave.leaveType === "Others" && leave.leaveCategory === "Permission" && (
              <div>
                <Label>Specify Permission Type</Label>
                <textarea name="customPermissionType" value={leave.customPermissonType} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter custom permission type" />
              </div>
            )}
            {leave.leaveCategory === "Permission" && (
              <>
                <div>
                  <Label required>Permission Date</Label>
                  <Input type="date" name="permissionDate" value={leave.permissionDate} onChange={handleChange} required min={currentDate} />
                </div>
                <div>
                  <Label required>Time Range</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Input type="time" name="startTime" value={leave.startTime} onChange={handleChange} required />
                    <span className="text-slate-500 text-sm">to</span>
                    <Input type="time" name="endTime" value={leave.endTime} onChange={handleChange} required />
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-6">Additional Info</h3>
          <div className="space-y-5">
            <div>
              <Label required>Remarks</Label>
              <textarea name="remarks" value={leave.remarks} onChange={handleChange} required
                className="w-full border border-slate-300 rounded-lg p-3 min-h-[120px] text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Add any remarks" />
            </div>
            <div>
              <Label>Attachment</Label>
              <div className="mt-1 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Input type="file" name="attachment" onChange={handleFileChange} className="border-0 p-0" />
                <p className="text-xs text-slate-500 mt-2">Upload supporting documents (optional)</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 flex justify-center">
          <Button type="submit" size="lg">Submit Request</Button>
        </div>
      </form>
    </PageShell>
  );
}

export default Leave;
