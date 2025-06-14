import '../styles/globals.css';
import ClientLayout from '../components/ClientLayout';

export const metadata = {
  title: 'PRP',
  description: 'Performance Review Platform'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex bg-gray-50 antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
