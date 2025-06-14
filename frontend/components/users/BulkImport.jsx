"use client";
import React, { useState } from "react";
import Papa from "papaparse";
import api from "../../lib/api";

export default function BulkImport() {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setRows(res.data);
        setErrors(res.errors);
        setResult(null);
      }
    });
  };

  const importUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/users/bulk", rows);
      setResult(data);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input data-testid="file-input" type="file" accept=".csv,.txt" onChange={handleFile} />

      {errors.length > 0 && (
        <div className="text-red-600">
          CSV parse errors: {errors.length}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <table className="min-w-full bg-white dark:bg-gray-900 border text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800 text-left">
                {Object.keys(rows[0]).map((h) => (
                  <th key={h} className="p-2 capitalize">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  {Object.values(r).map((v, idx) => (
                    <td key={idx} className="p-2 max-w-xs truncate">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 20 && <p className="text-xs">Showing first 20 of {rows.length} rows…</p>}

          <button
            onClick={importUsers}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Importing..." : `Import ${rows.length} users`}
          </button>
        </>
      )}

      {result && (
        <div>
          <h3 className="font-semibold">Result</h3>
          <p>Created: {result.created}</p>
          {result.failed.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-red-600">Failed rows ({result.failed.length})</summary>
              <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">
{JSON.stringify(result.failed, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
