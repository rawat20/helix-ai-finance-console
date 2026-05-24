"use client";

import { ChangeEvent, useState } from "react";

const SAMPLE_CSV_URL = "/sample-expenses.csv";
const SAMPLE_CSV_FILENAME = "sample-expenses.csv";

/** Upload drop zone + sample CSV download inside one card. */
export function FileUploadCard({
  onUpload,
  uploading,
  fileName,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
  fileName: string | null;
}) {
  const [activeTab, setActiveTab] = useState<"upload" | "sample">("upload");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="flex h-full min-h-48 flex-col rounded-3xl border-2 border-dashed border-white/20 bg-white/5">
      <div className="flex border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex-1 px-4 py-2.5 text-xs cursor-pointer font-semibold uppercase tracking-wide transition ${
            activeTab === "upload"
              ? "border-b-2 border-indigo-400 text-indigo-200"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sample")}
          className={`flex-1 px-4 py-2.5 text-xs cursor-pointer font-semibold uppercase tracking-wide transition ${
            activeTab === "sample"
              ? "border-b-2 border-indigo-400 text-indigo-200"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Sample CSV
        </button>
      </div>

      {activeTab === "upload" ? (
        <label
          htmlFor="expense-upload"
          className="flex flex-1 cursor-pointer flex-col items-center justify-center p-6 text-center transition hover:bg-white/5"
        >
          <input
            id="expense-upload"
            type="file"
            className="sr-only"
            accept=".csv,.xlsx,.xls,.json"
            onChange={handleChange}
            disabled={uploading}
          />
          <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
            Upload
          </span>
          <p className="mt-3 text-lg font-semibold">Drop bank exports or receipts</p>
          <p className="text-sm text-slate-300">
            CSV, Excel, JSON · Each file scanned by the AI classifier
          </p>
          <p className="mt-4 text-sm text-indigo-200">
            {uploading
              ? "Uploading and processing…"
              : fileName
                ? `Ready: ${fileName}`
                : "Click or drag files to start"}
          </p>
        </label>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <p className="text-lg font-semibold">Try the demo dataset</p>
          <p className="mt-2 max-w-xs text-sm text-slate-300">
            Download a sample expense CSV with Date, Amount, Description, and Merchant columns, then
            upload it on the Upload tab.
          </p>
          <a
            href={SAMPLE_CSV_URL}
            download={SAMPLE_CSV_FILENAME}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-indigo-400/50 bg-indigo-500/20 px-5 py-2.5 text-sm font-medium text-indigo-100 transition hover:border-indigo-400 hover:bg-indigo-500/30"
          >
            Download sample CSV
          </a>
        </div>
      )}
    </div>
  );
}
