import React from 'react';
import { Menu } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-14 w-full border-b border-gray-200 bg-white px-4 flex items-center justify-between dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        <span>PRP Dashboard</span>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">v0.1.0</div>
    </header>
  );
}
