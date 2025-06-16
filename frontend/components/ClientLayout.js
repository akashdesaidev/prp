'use client';

import { AuthProvider } from '../context/AuthContext';
import { TimeTrackerProvider } from '../context/TimeTrackerContext';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Sidebar, { MobileMenuProvider } from './Sidebar';
import GlobalTimeTracker from './time/GlobalTimeTracker';

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <TimeTrackerProvider>
        <MobileMenuProvider>
          <div className="layout-container max-w-screen-2xl w-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 max-w-[100% - 360px] overflow-auto flex flex-col min-h-screen">
              <Header />
              <main className="p-4 flex-1  overflow-y-auto">{children}</main>
            </div>
            {/* Global Time Tracker Widget */}
            <GlobalTimeTracker />
          </div>
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff'
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff'
                }
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff'
                }
              }
            }}
          />
        </MobileMenuProvider>
      </TimeTrackerProvider>
    </AuthProvider>
  );
}
