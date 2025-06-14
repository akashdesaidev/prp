'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import OrgChart to avoid SSR issues with ReactFlow
const OrgChart = dynamic(() => import('../../components/org/OrgChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-500">Loading organization chart...</p>
      </div>
    </div>
  )
});

export default function OrgPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full">
        <h1 className="text-2xl font-semibold mb-4">Organization Chart</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <h1 className="text-2xl font-semibold mb-4">Organization Chart</h1>
      <OrgChart />
    </div>
  );
}
