'use client';

import { AuthProvider } from '../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="p-4 flex-1 overflow-y-auto">{children}</main>
      </div>
    </AuthProvider>
  );
}
