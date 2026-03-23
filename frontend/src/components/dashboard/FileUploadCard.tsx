import { ChangeEvent } from "react";

/** Hidden file input + drop zone; forwards the chosen file to `onUpload` (hook handles the request). */
export function FileUploadCard({
  onUpload,
  uploading,
  fileName,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
  fileName: string | null;
}) {
  /** Reads the first selected file from the input and triggers the parent upload handler. */
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <label
      htmlFor="expense-upload"
      className="flex h-full min-h-48 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center transition hover:border-indigo-400/80 hover:bg-white/10"
    >
      <input
        id="expense-upload"
        type="file"
        className="sr-only"
        accept=".csv,.xlsx,.xls,.json"
        onChange={handleChange}
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
  );
}
