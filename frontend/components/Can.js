"use client";
import { useAuth } from "../context/AuthContext";

export default function Can({ roles = [], children }) {
  const { user } = useAuth();
  if (!user) return null;
  if (roles.length === 0) return children;
  return roles.includes(user.role) ? children : null;
}
