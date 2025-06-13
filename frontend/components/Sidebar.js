import React from 'react';
import { User, Settings } from 'lucide-react';
import Link from 'next/link';

const nav = [
  { href: '/', label: 'Home', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings }
];

export default function Sidebar() {
  return (
    <aside className="hidden md:block w-56 border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 min-h-screen">
      <nav className="p-4 space-y-2">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
