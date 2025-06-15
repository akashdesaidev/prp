import Team from '../models/Team.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import { z } from 'zod';

export const teamSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  department: z.string().min(1),
  lead: z.string().nullable().optional()
});

export const createTeam = async (req, res, next) => {
  try {
    const parse = teamSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());
    const { name, description, department, lead } = parse.data;
    const dept = await Department.findById(department);
    if (!dept) return res.status(400).json({ error: 'Invalid department' });
    if (lead) {
      const leadUser = await User.findById(lead);
      if (!leadUser) return res.status(400).json({ error: 'Invalid lead user' });
    }
    const team = await Team.create({ name, description, department, lead: lead || null });
    return res.status(201).json(team);
  } catch (err) {
    return next(err);
  }
};

export const listTeams = async (req, res, next) => {
  try {
    const { department } = req.query;

    // Build query filter
    const filter = {};
    if (department) {
      filter.department = department;
    }

    const teams = await Team.find(filter)
      .populate('department', 'name')
      .populate('lead', 'firstName lastName email');
    return res.json(teams);
  } catch (err) {
    return next(err);
  }
};

export const getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('department', 'name')
      .populate('lead', 'firstName lastName email');
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Get team members
    const members = await User.find({ teamId: req.params.id })
      .select('firstName lastName email role department')
      .populate('managerId', 'firstName lastName email')
      .lean();

    return res.json({
      ...team.toObject(),
      members
    });
  } catch (err) {
    return next(err);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    const parse = teamSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());
    const { department, lead } = parse.data;
    if (department) {
      const dept = await Department.findById(department);
      if (!dept) return res.status(400).json({ error: 'Invalid department' });
    }
    if (lead) {
      const leadUser = await User.findById(lead);
      if (!leadUser) return res.status(400).json({ error: 'Invalid lead user' });
    }
    const team = await Team.findByIdAndUpdate(req.params.id, parse.data, { new: true });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    return res.json(team);
  } catch (err) {
    return next(err);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Remove team reference from all users
    await User.updateMany({ teamId: req.params.id }, { $unset: { teamId: '' } });

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

// Add member to team
export const addTeamMember = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    // Validate team exists
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Add user to team
    await User.findByIdAndUpdate(userId, { teamId: teamId });

    // Return updated team with members
    const updatedTeam = await Team.findById(teamId)
      .populate('department', 'name')
      .populate('lead', 'firstName lastName email');

    // Get team members
    const members = await User.find({ teamId: teamId })
      .select('firstName lastName email role')
      .lean();

    return res.json({
      ...updatedTeam.toObject(),
      members
    });
  } catch (err) {
    return next(err);
  }
};

// Remove member from team
export const removeTeamMember = async (req, res, next) => {
  try {
    const { teamId, userId } = req.params;

    // Validate team exists
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Remove user from team
    await User.findByIdAndUpdate(userId, { $unset: { teamId: '' } });

    // Return updated team with members
    const updatedTeam = await Team.findById(teamId)
      .populate('department', 'name')
      .populate('lead', 'firstName lastName email');

    // Get remaining team members
    const members = await User.find({ teamId: teamId })
      .select('firstName lastName email role')
      .lean();

    return res.json({
      ...updatedTeam.toObject(),
      members
    });
  } catch (err) {
    return next(err);
  }
};

// Get team members
export const getTeamMembers = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    // Validate team exists
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Get team members
    const members = await User.find({ teamId: teamId })
      .select('firstName lastName email role department')
      .populate('managerId', 'firstName lastName email')
      .lean();

    return res.json({ members });
  } catch (err) {
    return next(err);
  }
};
