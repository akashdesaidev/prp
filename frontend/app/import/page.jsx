'use client';

import BulkImport from '../../components/users/BulkImport';

export default function ImportPage() {
  return (
    <div className="h-full w-full">
      <h1 className="text-2xl font-semibold mb-4">Bulk User Import</h1>
      <BulkImport />
    </div>
  );
}
