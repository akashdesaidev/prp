'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import Can from '../../components/Can';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-semibold text-foreground">My Profile</h1>
        {user ? (
          <div className="space-y-2">
            <p className="text-foreground">
              <span className="font-medium">User ID:</span> {user.id}
            </p>
            <p className="text-foreground">
              <span className="font-medium">Role:</span> {user.role}
            </p>
          </div>
        ) : (
          <div className="text-foreground">Loading...</div>
        )}

        <Can roles={['admin']}>
          <div className="mt-4 rounded-md border border-border bg-muted/20 p-4 text-sm text-foreground">
            Admin-only content visible via role-based render.
          </div>
        </Can>

        <button
          onClick={logout}
          className="mt-6 rounded-md bg-destructive px-4 py-2 text-white hover:opacity-90"
        >
          Log out
        </button>
      </div>
    </ProtectedRoute>
  );
}
