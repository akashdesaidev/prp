import { z } from 'zod';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['admin', 'hr', 'manager', 'employee']).optional(),
  department: z.string().optional(),
  team: z.string().optional(),
  manager: z.string().optional()
});

export const createUser = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, password, firstName, lastName, role, department, team, manager } = parsed.data;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashed,
      firstName,
      lastName,
      role,
      department: department || null,
      team: team || null,
      manager: manager || null
    });
    return res.status(201).json({ id: user._id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const { search, limit = 50, excludeSelf, role } = req.query;

    // Build query
    let query = { isActive: { $ne: false } }; // Only active users

    // Exclude current user if requested
    if (excludeSelf === 'true') {
      query._id = { $ne: req.user.id };
    }

    // Filter by role if specified
    if (role) {
      query.role = role;
    }

    // Search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { department: searchRegex }
      ];
    }

    // Role-based field selection
    let selectFields = '-password';
    if (req.user.role === 'employee') {
      // Employees only see basic info needed for feedback
      selectFields = 'firstName lastName email department _id';
    }

    const users = await User.find(query)
      .select(selectFields)
      .limit(parseInt(limit))
      .sort({ firstName: 1, lastName: 1 });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json(user);
};

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'hr', 'manager', 'employee']).optional(),
  department: z.string().nullable().optional(),
  team: z.string().nullable().optional(),
  manager: z.string().nullable().optional()
});

export const updateUser = async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const user = await User.findByIdAndUpdate(req.params.id, parsed.data, { new: true }).select(
    '-password'
  );
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json(user);
};

export const deleteUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json({ id: user._id, status: 'deactivated' });
};

// ========================= Manager / Report relationships =====================
export const updateUserRelations = async (req, res) => {
  const { manager, department, team } = req.body;
  const data = {
    manager: manager ?? undefined,
    department: department ?? undefined,
    team: team ?? undefined
  };
  const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password');
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json(user);
};

export const listDirectReports = async (req, res) => {
  const managerId = req.params.id;
  const reports = await User.find({ manager: managerId }).select('-password');
  return res.json(reports);
};

// ============================= Bulk Import ===================================
// Accepts an array of user objects in the request body and creates all users in a single insertMany call.
export const bulkImportUsers = async (req, res) => {
  if (!Array.isArray(req.body))
    return res.status(400).json({ error: 'Body must be an array of users' });

  const results = { created: [], failed: [] };
  for (const row of req.body) {
    const parsed = createSchema.safeParse(row);
    if (!parsed.success) {
      results.failed.push({ row, error: parsed.error.flatten() });
      continue;
    }
    const { email, password, firstName, lastName, role, department, team, manager } = parsed.data;
    try {
      const exists = await User.findOne({ email });
      if (exists) throw new Error('User already exists');
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        password: hashed,
        firstName,
        lastName,
        role,
        department: department || null,
        team: team || null,
        manager: manager || null
      });
      results.created.push({ id: user._id, email });
    } catch (err) {
      results.failed.push({ row, error: err.message });
    }
  }
  return res.status(201).json({ created: results.created.length, failed: results.failed });
};

// ============================= Role Management ===================================
const roleUpdateSchema = z.object({
  role: z.enum(['admin', 'hr', 'manager', 'employee'])
});

export const updateUserRole = async (req, res) => {
  const parsed = roleUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { role } = parsed.data;
  const targetUserId = req.params.id;

  try {
    // Prevent non-admins from assigning admin role
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can assign admin role' });
    }

    // Prevent users from changing their own role (except admin can change their own role)
    if (targetUserId === req.user.id && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(targetUserId, { role }, { new: true }).select(
      '-password'
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
