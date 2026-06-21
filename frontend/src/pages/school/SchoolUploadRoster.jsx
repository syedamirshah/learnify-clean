import React, { useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import SchoolPageShell from "../../components/school/SchoolPageShell";

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function SchoolUploadRoster() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    setError("");
    try {
      const res = await axiosInstance.get("school/template/", { responseType: "blob" });
      downloadBlob(res.data, "student_bulk_upload_template.xlsx");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Failed to download roster template."
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please choose an Excel file to upload.");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axiosInstance.post("school/upload-roster/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data || null);
      setSelectedFile(null);
      event.target.reset();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Failed to upload roster."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <SchoolPageShell
      title="Upload Roster"
      subtitle="Download the template, fill in teachers and students, then upload the Excel file."
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-emerald-950">Step 1 — Download Template</h2>
          <p className="mt-2 text-sm text-gray-600">
            Use the same Excel template as the admin bulk upload flow.
          </p>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={downloading}
            className="mt-4 rounded-2xl bg-[#42b72a] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? "Downloading..." : "Download Template"}
          </button>
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-emerald-950">Step 2 — Upload Roster</h2>
          <form onSubmit={handleUpload} className="mt-4 space-y-4">
            <input
              type="file"
              name="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              className="block w-full rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-6 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-[#42b72a] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-green-700"
            />
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="rounded-2xl bg-[#42b72a] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload Roster"}
            </button>
          </form>
        </section>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
        ) : null}

        {result ? (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">Import Results</h2>
            <p className="mt-2 text-sm font-semibold text-emerald-900">{result.message}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Imported</p>
                <p className="mt-1 text-2xl font-black text-emerald-950">{result.uploaded ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Skipped</p>
                <p className="mt-1 text-2xl font-black text-emerald-950">{result.skipped ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Errors</p>
                <p className="mt-1 text-2xl font-black text-emerald-950">
                  {result.errors?.length ?? 0}
                </p>
              </div>
            </div>
            {result.errors?.length ? (
              <ul className="mt-4 space-y-2 text-sm text-red-700">
                {result.errors.map((item, index) => (
                  <li key={`${item.row}-${index}`}>
                    Row {item.row}: {item.error}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/school/dashboard"
                className="rounded-2xl bg-[#42b72a] px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
              >
                View Users
              </Link>
              <Link
                to="/school/dashboard"
                className="rounded-2xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </SchoolPageShell>
  );
}
