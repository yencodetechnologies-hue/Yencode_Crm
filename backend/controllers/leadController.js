const Lead = require('../models/leadModel');
const { generateLeadId } = require('../utils/leadIdGenerator');
const { findDuplicates, isDuplicate } = require('../utils/duplicateCheck');
const { logActivity } = require('../utils/activityHelper');
const { normalizeRole } = require('../utils/jwt');

const buildLeadQuery = (query, user) => {
  const filter = {};
  const role = normalizeRole(user?.role);

  if (query.status) filter.status = query.status;
  if (query.source) filter.source = query.source;
  if (query.campaign) filter.campaign = query.campaign;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  // Only filter to agent's own leads when explicitly requested
  if (query.mine === 'true' && role === 'Telecaller' && user?.id) {
    filter.assignedTo = user.id;
  }

  if (query.search) {
    const search = query.search.trim();
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { contact: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { leadId: { $regex: search, $options: 'i' } },
    ];
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  return filter;
};

exports.createLead = async (req, res) => {
  try {
    if (req.body.contact) {
      const duplicate = await isDuplicate({
        contact: req.body.contact,
        alternateContact: req.body.alternateContact,
        email: req.body.email,
      });
      if (duplicate) {
        return res.status(409).json({ message: 'Duplicate lead detected', duplicate: true });
      }
    }

    let leadId;
    try {
      leadId = await generateLeadId();
    } catch {
      leadId = `LD-${Date.now()}`;
    }
    const newLead = new Lead({
      ...req.body,
      leadId,
      createdBy: req.user?.id,
    });
    await newLead.save();

    if (req.user?.id) {
      await logActivity({
        leadId: newLead._id,
        type: 'note',
        description: 'Lead created',
        performedBy: req.user.id,
      });
    }

    res.status(201).json({ message: 'Lead created successfully', lead: newLead });
  } catch (error) {
    res.status(500).json({ message: 'Error creating lead', error: error.message });
  }
};

exports.getAllLeads = async (req, res) => {
  try {
    const filter = buildLeadQuery(req.query, req.user);
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const usePagination = Number.isFinite(page) || Number.isFinite(limit);

    const query = Lead.find(filter)
      .populate('assignedTo', 'name empId email')
      .populate('campaign', 'name')
      .sort({ createdAt: -1 });

    if (!usePagination) {
      const leads = await query;
      return res.json(leads);
    }

    const pageNum = page || 1;
    const limitNum = limit || 50;
    const skip = (pageNum - 1) * limitNum;

    const [leads, total] = await Promise.all([
      query.skip(skip).limit(limitNum),
      Lead.countDocuments(filter),
    ]);

    res.json({ leads, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads', error: error.message });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name empId email contactNumber')
      .populate('campaign', 'name')
      .populate('createdBy', 'name empId');
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.status(200).json({ message: 'Lead fetched successfully', data: lead });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lead', error: error.message });
  }
};

exports.updateLeadById = async (req, res) => {
  try {
    const existing = await Lead.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Lead not found' });

    const duplicate = await isDuplicate({
      contact: req.body.contact || existing.contact,
      alternateContact: req.body.alternateContact || existing.alternateContact,
      email: req.body.email || existing.email,
    }, req.params.id);
    if (duplicate) {
      return res.status(409).json({ message: 'Duplicate lead detected', duplicate: true });
    }

    const oldStatus = existing.status;
    const oldAssigned = existing.assignedTo?.toString();

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'name empId');

    if (req.user?.id) {
      if (req.body.status && req.body.status !== oldStatus) {
        await logActivity({
          leadId: lead._id,
          type: 'status_change',
          description: `Status changed from ${oldStatus} to ${req.body.status}`,
          metadata: { from: oldStatus, to: req.body.status },
          performedBy: req.user.id,
        });
      }
      if (req.body.assignedTo && req.body.assignedTo !== oldAssigned) {
        await logActivity({
          leadId: lead._id,
          type: 'assignment',
          description: 'Lead reassigned',
          metadata: { assignedTo: req.body.assignedTo },
          performedBy: req.user.id,
        });
      }
    }

    res.status(200).json({ message: 'Lead updated successfully', data: lead });
  } catch (error) {
    res.status(500).json({ message: 'Error updating lead', error: error.message });
  }
};

exports.deleteLeadById = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lead', error: error.message });
  }
};

exports.updateLeadStatus = async (req, res) => {
  try {
    const existing = await Lead.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Lead not found' });

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (req.user?.id) {
      await logActivity({
        leadId: lead._id,
        type: 'status_change',
        description: `Status changed to ${req.body.status}`,
        metadata: { from: existing.status, to: req.body.status },
        performedBy: req.user.id,
      });
    }

    res.status(200).json({ message: 'Lead status updated successfully', data: lead });
  } catch (error) {
    res.status(500).json({ message: 'Error updating lead status', error: error.message });
  }
};

exports.getTotalLeads = async (req, res) => {
  try {
    const filter = buildLeadQuery(req.query, req.user);
    const totalLeads = await Lead.countDocuments(filter);
    res.status(200).json({ TotalLeads: totalLeads });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkAssign = async (req, res) => {
  try {
    const { leadIds, assignedTo } = req.body;
    if (!leadIds?.length || !assignedTo) {
      return res.status(400).json({ message: 'leadIds and assignedTo are required' });
    }

    await Lead.updateMany({ _id: { $in: leadIds } }, { assignedTo });

    if (req.user?.id) {
      for (const leadId of leadIds) {
        await logActivity({
          leadId,
          type: 'assignment',
          description: 'Bulk assigned to agent',
          metadata: { assignedTo },
          performedBy: req.user.id,
        });
      }
    }

    res.json({ message: `${leadIds.length} leads assigned successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkDuplicates = async (req, res) => {
  try {
    const duplicates = await findDuplicates(req.query);
    res.json({ duplicates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportLeads = async (req, res) => {
  try {
    const filter = buildLeadQuery(req.query, req.user);
    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name empId')
      .populate('campaign', 'name')
      .sort({ createdAt: -1 });

    res.json({ leads });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.importLeads = async (req, res) => {
  try {
    const { leads: rows } = req.body;
    if (!rows?.length) {
      return res.status(400).json({ message: 'No leads provided' });
    }

    const results = { created: 0, skipped: 0, errors: [] };
    const batchSize = 100;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      for (const row of batch) {
        try {
          if (!row.name) {
            results.skipped++;
            results.errors.push({ row, reason: 'Missing name' });
            continue;
          }

          // Only run duplicate check if we have at least one dedupe field.
          const hasDedupeFields = !!(row.contact || row.alternateContact || row.email);
          if (hasDedupeFields) {
            const duplicate = await isDuplicate({
              contact: row.contact,
              alternateContact: row.alternateContact,
              email: row.email,
            });
            if (duplicate) {
              results.skipped++;
              results.errors.push({ row, reason: 'Duplicate' });
              continue;
            }
          }

          const leadId = await generateLeadId();
          const lead = new Lead({
            leadId,
            name: row.name,
            contact: row.contact ? String(row.contact) : '',
            alternateContact: row.alternateContact ? String(row.alternateContact) : undefined,
            email: row.email,
            company: row.company,
            source: row.source,
            city: row.city,
            state: row.state,
            country: row.country || 'India',
            address: row.address,
            interest: row.interest,
            priority: row.priority || 'Medium',
            status: row.status || 'New',
            createdBy: req.user?.id,
          });
          await lead.save();
          results.created++;
        } catch (err) {
          results.skipped++;
          results.errors.push({ row, reason: err.message });
        }
      }
    }

    res.json({ message: 'Import completed', results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
