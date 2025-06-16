'use client';

import { AuthProvider } from '../context/AuthContext';
import { TimeTrackerProvider } from '../context/TimeTrackerContext';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Sidebar, { MobileMenuProvider } from './Sidebar';
import GlobalTimeTracker from './time/GlobalTimeTracker';
import ProductChatbot from './ai/ProductChatbot';

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <TimeTrackerProvider>
        <MobileMenuProvider>
          {/* Main Layout Container */}
          <div className="flex w-full min-h-screen bg-gray-50">
            {/* Sidebar - Fixed on desktop, overlay on mobile */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <Header />

              {/* Main Content */}
              <main className="flex-1 p-4 overflow-y-auto">{children}</main>
            </div>
          </div>

          {/* Global Time Tracker Widget - Positioned absolutely */}
          <GlobalTimeTracker />

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

          {/* AI Chatbot - Available throughout the app */}
          <ProductChatbot />
        </MobileMenuProvider>
      </TimeTrackerProvider>
    </AuthProvider>
  );
}
