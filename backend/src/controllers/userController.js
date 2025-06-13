import { z } from 'zod';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['admin', 'hr', 'manager', 'employee']).optional()
});

export const createUser = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { email, password, firstName, lastName, role } = parsed.data;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, firstName, lastName, role });
    return res.status(201).json({ id: user._id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const listUsers = async (req, res) => {
  const users = await User.find().select('-password');
  return res.json(users);
};

export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json(user);
};

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'hr', 'manager', 'employee']).optional()
});

export const updateUser = async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const user = await User.findByIdAndUpdate(req.params.id, parsed.data, { new: true }).select('-password');
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json(user);
};

export const deleteUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json({ id: user._id, status: 'deactivated' });
};
