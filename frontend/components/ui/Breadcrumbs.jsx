'use client';
import Link from 'next/link';

export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return <div></div>;
  return (
    <nav className="text-sm mb-4" aria-label="Breadcrumb">
      <ol className="flex flex-wrap gap-1 text-gray-600 dark:text-gray-300">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1">
            {idx !== 0 && <span>/</span>}
            {item.href ? (
              <Link className="hover:underline" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-gray-800 dark:text-gray-100">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
