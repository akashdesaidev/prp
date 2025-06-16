import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';

// Helper functions
const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string()
});

export const register = async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  const { email, password, firstName, lastName } = parse.data;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    user = await User.create({ email, password: hashed, firstName, lastName });
    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    return res.status(201).json({ accessToken, refreshToken });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const login = async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  const { email, password } = parse.data;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    return res.json({ accessToken, refreshToken });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Refresh token endpoint
const refreshSchema = z.object({
  refreshToken: z.string()
});

export const refresh = async (req, res) => {
  const parse = refreshSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  const { refreshToken } = parse.data;
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const payload = { id: decoded.id, role: decoded.role };
    const accessToken = generateAccessToken(payload);
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// Get current user
export const me = async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Simple test endpoint
export const test = async (req, res) => {
  try {
    return res.json({
      success: true,
      message: 'Test endpoint working',
      user: req.user
        ? {
            id: req.user.id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role
          }
        : null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
