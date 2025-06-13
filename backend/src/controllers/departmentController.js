import Department from '../models/Department.js';
import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  parent: z.string().nullable().optional()
});

export const createDepartment = async (req, res, next) => {
  try {
    const parse = departmentSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());
    const { name, description, parent } = parse.data;
    const dept = await Department.create({ name, description, parent: parent || null });
    return res.status(201).json(dept);
  } catch (err) {
    return next(err);
  }
};

export const listDepartments = async (_req, res, next) => {
  try {
    const depts = await Department.find();
    return res.json(depts);
  } catch (err) {
    return next(err);
  }
};

export const getDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    return res.json(dept);
  } catch (err) {
    return next(err);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const parse = departmentSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());
    const dept = await Department.findByIdAndUpdate(req.params.id, parse.data, { new: true });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    return res.json(dept);
  } catch (err) {
    return next(err);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};
