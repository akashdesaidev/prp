import '../styles/globals.css';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

export const metadata = {
  title: 'PRP',
  description: 'Performance Review Platform'
};

import { AuthProvider } from '../context/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex bg-gray-50 antialiased">
        <AuthProvider>\n        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="p-4 flex-1 overflow-y-auto">{children}</main>
        </div>\n      </AuthProvider>
      </body>
    </html>
  );
}
