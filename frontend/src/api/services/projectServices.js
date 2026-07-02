import { projectServices } from "../axios/axiosInstance";
import { refreshSession } from "../../utils/session";


// export const verifyLogin = async (formData) => {
//   try {
//     const response = await projectServices.post(`/employee-login/login`, formData);
//     return response;
//   } catch (err) {
//     throw err;
//   }
// };


export const verifyLogin = async (formData) => {
  try {
    const response = await projectServices.post(`/employee-login/login`, formData);
    refreshSession();
    return response;
  } catch (err) {
    throw err;
  }
};

export const sendOTP = async (data) => {
  try {
    const response = await projectServices.post(`/email/send-otp`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const verifyOTP = async (data) => {
  try {
    const response = await projectServices.post(`/email/verify-otp`, data);
    if (response.data?.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
    }
    refreshSession();
    return response;
  } catch (error) {
    throw error;
  }
};


  export const getTheProject=async(projectId) => {
    try {
      const response = await projectServices.get(`/project/getprojectbyid/${projectId}` );
      return response;
    } catch (err) {
      return err;
    }
  };


  export const updatetheProject = async (projectId, projectData) => {
    try {
        const response = await projectServices.put(`/project/updateprojectby/${projectId}`, projectData, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        return response;
    } catch (err) {
      return err;
    }
};


export const deletetheProject = async (projectId) => {
  if (!projectId) throw new Error("Invalid project ID for deletion");

  try {
      const response = await projectServices.delete(`/project/deleteproject/${projectId}`);
      return response;
  }  catch (err) {
    return err;
  }
};

export const createProject=async(projectData) => {
  try {
    const response = await projectServices.post(`/project/createproject`, projectData, {
      headers: {
          "Content-Type": "application/json",
      },
  });
    return response;
  } catch (err) {
    return err;
  }
};


export const projectname=async() => {
  try {
    const responsename = await projectServices.get(`/project/projectname` );
    return responsename;
  } catch (err) {
    return err;
  }
};



// export const employeename=async() => {
//   try {
//     const response = await projectServices.get(`/employename` );
//     return response;
//   } catch (err) {
//     return err;
//   }
// };

export const employeename = async (id) => {
  try {
    const response = await projectServices.get(`/employename/${id}`);
    return response;
  } catch (err) {
    return err;
  }
};

export const getAllEmployees = async (params = {}) => {
  try {
    const response = await projectServices.get(`/getallemployees`, { params });
    return response;
  } catch (err) {
    return err;
  }
};

export const deleteEmployee = async (id) => {
  try {
    const response = await projectServices.delete(`/deleteemployee/${id}`);
    return response;
  } catch (err) {
    return err;
  }
};


export const createTask = async (formData) => {
  try {
    const response = await projectServices.post(`/task/createtask`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (err) {
    console.error("Error creating task:", err);
    return err;
  }
};


export const getTheTask=async(taskId) => {
  try {
    console.log("edit task")
    const response = await projectServices.get(`/task/gettaskbyid/${taskId}` );
    return response;
  } catch (err) {
    return err;
  }
};


export const updateTheTask = async (taskId, formData) => {
  try {
    const response = await projectServices.put(`/task/updatetask/${taskId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data", 
      },
    });
    return response.data; 
  } catch (err) {
    return err;
  }
};


export const createPayroll=async(formData) => {
  try {
    const response = await projectServices.post(`/payroll/createpayroll`, formData, {
      headers: {
          "Content-Type": "application/json",
      },
  });
    return response;
  } catch (err) {
    return err;
  }
};


export const getAllPayroll=async() => {
  try {
    const response = await projectServices.get(`/payroll/getpayroll` );
    return response;
  } catch (err) {
    return err;
  }
};

export const getPayrollById = async (payrollId) => {
  try {
    const response = await projectServices.get(`/payroll/getpayrollbyid/${payrollId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (err) {
    return err;
  }
};


export const updatePayroll = async (payrollId, formData) => {
  try {
    const response = await projectServices.put(`/payroll/updatepayroll/${payrollId}`, formData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (err) {
    return err;
  }
};

export const getTotalEmployees=async() => {
  try {
    const response = await projectServices.get(`/totalemployee` );
    return response;
  } catch (err) {
    return err;
  }
};


export const getAttendance = async () => {
  try {
    const response = await projectServices.get(`/attendance/totalattendance`);
    return response;
  } catch (err) {
    return err;
  }
};

export const getTotalProjects = async () => {
  try {
    const response = await projectServices.get(`/project/totalprojects`);
    return response;
  } catch (err) {
    return err;
  }
};

export const getTasks = async () => {
  try {
    const response = await projectServices.get(`/task/totaltasks`);
    return response;
  } catch (err) {
    return err;
  }
};

export const getAllTasks = async (id) => {
  try {
    const response = await projectServices.get(`/task/getalltask/${id}`);
    return response;
  } catch (err) {
    return err;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await projectServices.delete(`/task/deletetask/${taskId}`);
    return response;
  } catch (err) {
    return err;
  }
};

export const updateTaskStatus = async (taskId, data) => {
  try {
    const response = await projectServices.put(`/task/update-status/${taskId}`, data);
    return response;
  } catch (err) {
    return err;
  }
};

export const getClients = async () => {
  try {
    const response = await projectServices.get(`/clients/totalclients`);
    return response;
  } catch (err) {
    return err;
  }
};

export const getLeave = async () => {
  try {
    const response = await projectServices.get(`/leaves/totalleaverequests`);
    return response;
  } catch (err) {
    return err;
  }
};

export const getTotalPayrolls = async () => {
  try {
    const response = await projectServices.get(`/payroll/totalpayrolls`);
    return response;
  } catch (err) {
    return err;
  }
};

export const getTotalLeads = async () => {
  try {
    const response = await projectServices.get(`/leads/totalleads`);
    return response;
  } catch (err) {
    return err;
  }
};


export const getLeaveById = async (id) => {
  try {
    const response = await projectServices.get(`/leaves/get/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (err) {
    return err;
  }
};

export const getAllLeaves = async (id, startDate, endDate) => {
  try {
    const response = await projectServices.get(`/leaves/get-all/${id}`, {
      params: { startDate, endDate }
    });
    return response;
  } catch (err) {
    return err;
  }
};

export const updateLeaveStatus = async (leaveId, data) => {
  try {
    const response = await projectServices.put(`/leaves/update-status/${leaveId}`, data);
    return response;
  } catch (err) {
    return err;
  }
};

export const deleteLeave = async (leaveId) => {
  try {
    const response = await projectServices.delete(`/leaves/delete/${leaveId}`);
    return response;
  } catch (err) {
    return err;
  }
};

export const createLeave = async (formData) => {
  try {
    const response = await projectServices.post(`/leaves/create`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (err) {
    return err;
  }
};

export const updateLeave = async (id, formData) => {
  try {
    const response = await projectServices.put(`/leaves/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (err) {
    return err;
  }
};

export const createPayment = async (formData) => {
  try {
    const response = await projectServices.post(`/payments/createpayment`, formData, {
      headers: {
      },
    });
    return response;
  } catch (error) {
    console.error("Error in createPayment API:", error);
    throw error;
  }
};

export const getTotalPayments = async () => {
  try {
    const response = await projectServices.get(`/payments/getallpayments`);
    return response;
  } catch (err) {
    return err;
  }
};

export const updatePaymentById = async (paymentId, formData) => {
  try {
    const response = await projectServices.put(`/payments/updatepayment/${paymentId}`, formData);
    return response;
  } catch (err) {
    console.error("Error in updatePaymentById:", err);
    throw err;
  }
};


export const getPaymentById = async (paymentId) => {
  try {
    const response = await projectServices.get(`/payments/getpayment/${paymentId}`,  {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (err) {
    return err;
  }
};

export const createExpense = async (formData) => {
  try {
    const response = await projectServices.post(`/expense/createexpense`, formData, {
      headers: {
      },
    });
    return response;
  } catch (error) {
    console.error("Error in createPayment API:", error);
    throw error;
  }
};

export const getTotalExpense = async () => {
  try {
    const response = await projectServices.get(`/expense/getallexpense`);
    return response;
  } catch (err) {
    return err;
  }
};


export const updateExpenseById = async (expenseId, formData) => {
  try {
    const response = await projectServices.put(`/expense/updateexpense/${expenseId}`, formData);
    return response;
  } catch (err) {
    console.error("Error in updateExpenseById:", err);
    throw err;
  }
};


export const getExpenseById = async (expenseId) => {
  try {
    const response = await projectServices.get(`/expense/getexpense/${expenseId}`,  {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (err) {
    return err;
  }
};

export const createMoM = async (formData) => {
  try {
    const response = await projectServices.post(`/mom/mompage`, formData, {
      headers: { 
      },
    });
    return response;
  } catch (error) {
    console.error("Error in createPayment API:", error);
    throw error;
  }
};

export const getMoM = async () => {
  try {
    const response = await projectServices.get(`/mom/getallmom`);
    return response;
  } catch (err) {
    return err;
  }
};



export const getMoMById = async (id) => {
  if (!id || id === "undefined") {
    console.error("Invalid ID for getMoMById:", id);
    return { error: "Invalid ID provided" };
  }

  try {
    const response = await projectServices.get(`/mom/getmombyid/${id}`);
    return response;
  } catch (err) {
    console.error("Error in getMoMById:", err);
    return err;
  }
};

export const updateMoM = async (id, formData) => {
  try {
    const response = await projectServices.put(`/mom/updatemom/${id}`, formData);
    return response;
  } catch (err) {
    console.error("Error in updateExpenseById:", err);
    throw err;
  }
};

export const deleteMoM = async (id) => {
  try {
      const response = await projectServices.delete(`/mom/deletemom/${id}`);
      return response.data;
  } catch (err) {
      console.error('Error deleting MoM:', err);
      throw err;
  }
};

export const createQuotation = async (formData) => {
  try {
    const response = await projectServices.post(`/quotation/quotationcreate`, formData, {
      headers: {
      },
    });
    return response;
  } catch (error) {
    console.error("Error in createPayment API:", error);
    throw error;
  }
};

export const updateQuotation = async (quotationId, formData) => {
  try {
    const response = await projectServices.put(`/quotation/quotationupdate/${quotationId}`, formData);
    return response;
  } catch (err) {
    console.error("Error in updateExpenseById:", err);
    throw err;
  }
};

export const getTotalQuotations = async () => {
  try {
    const response = await projectServices.get(`/quotation/allquotation`);
    return response;
  } catch (err) {
    return err;
  }
};

export const deleteQuotations = async (id) => {
  try {
      const response = await projectServices.delete(`/quotation/quotationdelete/${id}`); 
      return response.data;
  } catch (err) {
      console.error('Error deleting MoM:', err);
      throw err;
  }
};

export const getQuotationsById = async (quotationId) => {
  try {
    const response = await projectServices.get(`/quotation/quotationbyid/${quotationId}`,  {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (err) {
    return err;
  }
};

export const getAllClientsData = async () => {
    try {
        const response = await projectServices.get('/clients/get-all');
        return response;
    } catch (err) {
        return err;
    }
};

export const createClient = async (clientData) => {
    try {
        const response = await projectServices.post('/clients/create', clientData);
        return response;
    } catch (err) {
        return err;
    }
};

export const getClientById = async (id) => {
    try {
        const response = await projectServices.get(`/clients/get/${id}`);
        return response;
    } catch (err) {
        return err;
    }
};

export const updateClient = async (id, clientData) => {
    try {
        const response = await projectServices.put(`/clients/update/${id}`, clientData);
        return response;
    } catch (err) {
        return err;
    }
};

export const deleteClient = async (id) => {
    try {
        const response = await projectServices.delete(`/clients/delete/${id}`);
        return response;
    } catch (err) {
        return err;
    }
};

export const updateClientStatus = async (id, status) => {
    try {
        const response = await projectServices.put(`/clients/update-status/${id}`, { status });
        return response;
    } catch (err) {
        return err;
    }
};

export const getAllLeads = async (params = {}) => {
    try {
        const response = await projectServices.get('/leads/get-all', { params });
        return response;
    } catch (err) {
        return err;
    }
};

export const getLeadById = async (id) => {
    try {
        const response = await projectServices.get(`/leads/getlead/${id}`);
        return response;
    } catch (err) {
        return err;
    }
};

export const updateLead = async (id, data) => {
    try {
        const response = await projectServices.put(`/leads/update/${id}`, data);
        return response;
    } catch (err) {
        return err;
    }
};

export const bulkAssignLeads = async (leadIds, assignedTo) => {
    try {
        const response = await projectServices.put('/leads/bulk-assign', { leadIds, assignedTo });
        return response;
    } catch (err) {
        return err;
    }
};

export const importLeads = async (leads) => {
    try {
        const response = await projectServices.post('/leads/import', { leads });
        return response;
    } catch (err) {
        return err;
    }
};

export const exportLeads = async (params = {}) => {
    try {
        const response = await projectServices.get('/leads/export', { params });
        return response;
    } catch (err) {
        return err;
    }
};

// --- Calls ---
export const createCall = async (data) => {
    try {
        const response = await projectServices.post('/calls', data);
        return response;
    } catch (err) {
        throw err;
    }
};

export const getCallsByLead = async (leadId) => {
    try {
        const response = await projectServices.get(`/calls/lead/${leadId}`);
        return response;
    } catch (err) {
        return err;
    }
};

export const getTodayCalls = async (params = {}) => {
    try {
        const response = await projectServices.get('/calls/today', { params });
        return response;
    } catch (err) {
        return err;
    }
};

// --- Follow-ups ---
export const getFollowUps = async (params = {}) => {
    try {
        const response = await projectServices.get('/followups', { params });
        return response;
    } catch (err) {
        return err;
    }
};

export const getTodayFollowUps = async (params = {}) => {
    try {
        const response = await projectServices.get('/followups/today', { params });
        return response;
    } catch (err) {
        return err;
    }
};

export const getCalendarFollowUps = async (year, month) => {
    try {
        const response = await projectServices.get('/followups/calendar', { params: { year, month } });
        return response;
    } catch (err) {
        return err;
    }
};

export const createFollowUp = async (data) => {
    try {
        const response = await projectServices.post('/followups', data);
        return response;
    } catch (err) {
        throw err;
    }
};

export const completeFollowUp = async (id) => {
    try {
        const response = await projectServices.patch(`/followups/${id}/complete`);
        return response;
    } catch (err) {
        return err;
    }
};

export const deleteFollowUp = async (id) => {
    try {
        const response = await projectServices.delete(`/followups/${id}`);
        return response;
    } catch (err) {
        return err;
    }
};

// --- Campaigns ---
export const getCampaigns = async () => {
    try {
        const response = await projectServices.get('/campaigns');
        return response;
    } catch (err) {
        return err;
    }
};

export const createCampaign = async (data) => {
    try {
        const response = await projectServices.post('/campaigns', data);
        return response;
    } catch (err) {
        return err;
    }
};

export const updateCampaign = async (id, data) => {
    try {
        const response = await projectServices.put(`/campaigns/${id}`, data);
        return response;
    } catch (err) {
        return err;
    }
};

export const deleteCampaign = async (id) => {
    try {
        const response = await projectServices.delete(`/campaigns/${id}`);
        return response;
    } catch (err) {
        return err;
    }
};

export const getCampaignStats = async (id) => {
    try {
        const response = await projectServices.get(`/campaigns/${id}/stats`);
        return response;
    } catch (err) {
        return err;
    }
};

export const assignCampaignAgents = async (id, agentIds) => {
    try {
        const response = await projectServices.post(`/campaigns/${id}/assign-agents`, { agentIds });
        return response;
    } catch (err) {
        return err;
    }
};

// --- Dashboard & Reports ---
export const getDashboardMetrics = async (params = {}) => {
    try {
        const response = await projectServices.get('/dashboard/metrics', { params });
        return response;
    } catch (err) {
        return err;
    }
};

export const getDailyCallReport = async (params) => {
    try {
        const response = await projectServices.get('/reports/daily-calls', { params });
        return response;
    } catch (err) {
        return err;
    }
};

export const getLeadConversionReport = async (params) => {
    try {
        const response = await projectServices.get('/reports/lead-conversion', { params });
        return response;
    } catch (err) {
        return err;
    }
};

export const getFollowUpReport = async (params) => {
    try {
        const response = await projectServices.get('/reports/follow-ups', { params });
        return response;
    } catch (err) {
        return err;
    }
};

export const getMissedCallsReport = async (params) => {
    try {
        const response = await projectServices.get('/reports/missed-calls', { params });
        return response;
    } catch (err) {
        return err;
    }
};

export const getCampaignPerformanceReport = async () => {
    try {
        const response = await projectServices.get('/reports/campaign-performance');
        return response;
    } catch (err) {
        return err;
    }
};

export const getAgentPerformanceReport = async (params) => {
    try {
        const response = await projectServices.get('/reports/agent-performance', { params });
        return response;
    } catch (err) {
        return err;
    }
};

export const getRevenueReport = async (params) => {
    try {
        const response = await projectServices.get('/reports/revenue', { params });
        return response;
    } catch (err) {
        return err;
    }
};

// --- Activities ---
export const getActivitiesByLead = async (leadId) => {
    try {
        const response = await projectServices.get(`/activities/lead/${leadId}`);
        return response;
    } catch (err) {
        return err;
    }
};

export const createNote = async (leadId, description) => {
    try {
        const response = await projectServices.post('/activities/note', { leadId, description });
        return response;
    } catch (err) {
        throw err;
    }
};

export const createLead = async (leadData) => {
    try {
        const response = await projectServices.post('/leads/create', leadData);
        return response;
    } catch (err) {
        return err;
    }
};

export const deleteLead = async (id) => {
    try {
        const response = await projectServices.delete(`/leads/delete/${id}`);
        return response;
    } catch (err) {
        return err;
    }
};

export const searchPlaces = async (params) => {
    try {
        const response = await projectServices.get('/api/places', { params });
        return response;
    } catch (err) {
        return err;
    }
};

export const getPlaceDetails = async (placeId) => {
    try {
        const response = await projectServices.get(`/api/place-details/${placeId}`);
        return response;
    } catch (err) {
        return err;
    }
};

// --- Dispositions / Call Logs ---
export const getDispositions = async () => {
    try {
        const response = await projectServices.get('/updatelog/getdispositions');
        return response;
    } catch (err) {
        return err;
    }
};

export const createDisposition = async (data) => {
    try {
        const response = await projectServices.post('/updatelog/disposition', data);
        return response;
    } catch (err) {
        return err;
    }
};

// --- Projects list for Project page ---
export const getAllProjects = async (id) => {
    try {
        const response = await projectServices.get(`/project/getallprojects/${id}`);
        return response;
    } catch (err) {
        return err;
    }
};

export const createSuperAdmin = async (formData) => {
    try {
        const response = await projectServices.post('/super-admin/createsuperadmin', formData);
        return response;
    } catch (err) {
        return err;
    }
};

export const deletePayroll = async (id) => {
    try {
        const response = await projectServices.delete(`/payroll/deletepayroll/${id}`);
        return response;
    } catch (err) {
        return err;
    }
};

export const getEmployeeDataById = async (id) => {
    try {
        const response = await projectServices.get(`/employeedatabyid/${id}`);
        return response;
    } catch (err) {
        return err;
    }
};

export const updateEmployeeDataById = async (id, data) => {
    try {
        const response = await projectServices.put(`/employeedataupdateid/${id}`, data);
        return response;
    } catch (err) {
        return err;
    }
};

export const getAllEmployeesData = async () => {
    try {
        const response = await projectServices.get('/allemployeesdata');
        return response;
    } catch (err) {
        return err;
    }
};

export const getAttendanceAll = async (id) => {
    try {
        const response = await projectServices.get(`/attendance-all/${id}`);
        return response;
    } catch (err) {
        return err;
    }
};

