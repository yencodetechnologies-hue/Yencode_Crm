import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { createLead, getCampaigns, getAllEmployees } from "../../api/services/projectServices";

const LEAD_STATUSES = [
  'New', 'Contacted', 'Follow-up', 'Interested', 'Not Interested',
  'Converted', 'Lost', 'Wrong Number', 'No Response', 'Busy', 'Switched Off',
];

const LeadForm = () => {
  const [lead, setLead] = useState({
    name: '', contact: '', alternateContact: '', email: '', company: '',
    source: '', city: '', state: '', country: 'India', address: '',
    interest: '', requirements: '', comments: '', priority: 'Medium', status: 'New',
    assignedTo: '', campaign: '',
  });
  const [campaigns, setCampaigns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    getCampaigns().then((r) => r.status === 200 && setCampaigns(r.data));
    getAllEmployees().then((r) => r.status === 200 && setEmployees(r.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLead((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...lead };
    if (!payload.assignedTo) delete payload.assignedTo;
    if (!payload.campaign) delete payload.campaign;

    try {
      const response = await createLead(payload);
      if (response.status === 201) {
        alert('Lead created successfully!');
        navigate("/lead-table");
      } else if (response.status === 409) {
        alert('Duplicate lead detected');
      } else {
        alert('Submission failed');
      }
    } catch (error) {
      alert('Error submitting lead');
    }
  };

  const fields = [
    { name: 'name', label: 'Customer Name', type: 'text', required: true },
    { name: 'contact', label: 'Mobile Number', type: 'tel', required: true },
    { name: 'alternateContact', label: 'Alternate Number', type: 'tel' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'company', label: 'Company', type: 'text' },
    { name: 'source', label: 'Source', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'state', label: 'State', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
    { name: 'address', label: 'Address', type: 'text' },
    { name: 'interest', label: 'Interest/Product', type: 'text' },
    { name: 'requirements', label: 'Requirements', type: 'textarea' },
    { name: 'comments', label: 'Comments', type: 'textarea' },
  ];

  return (
    <div className="container mx-auto p-6 mt-12 max-w-4xl">
      <h2 className="text-4xl font-bold mb-10 text-center mt-20">Create Lead</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 bg-white shadow rounded p-6">
        {fields.map((f) => (
          <div key={f.name} className={f.type === 'textarea' ? 'col-span-2' : ''}>
            <label className="block text-sm font-medium mb-1">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea name={f.name} value={lead[f.name]} onChange={handleChange} className="border p-2 w-full rounded h-20" />
            ) : (
              <input type={f.type} name={f.name} value={lead[f.name]} onChange={handleChange} required={f.required} className="border p-2 w-full rounded" />
            )}
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select name="priority" value={lead.priority} onChange={handleChange} className="border p-2 w-full rounded">
            <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select name="status" value={lead.status} onChange={handleChange} className="border p-2 w-full rounded">
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Assigned To</label>
          <select name="assignedTo" value={lead.assignedTo} onChange={handleChange} className="border p-2 w-full rounded">
            <option value="">Unassigned</option>
            {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Campaign</label>
          <select name="campaign" value={lead.campaign} onChange={handleChange} className="border p-2 w-full rounded">
            <option value="">None</option>
            {campaigns.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-2 flex justify-center mt-4">
          <button type="submit" className="bg-blue-500 text-white font-bold py-2 px-8 rounded">Submit</button>
        </div>
      </form>
    </div>
  );
};

export default LeadForm;
