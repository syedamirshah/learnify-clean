import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import SchoolPageShell from "../../components/school/SchoolPageShell";
import { PROVINCES } from "../../constants/provinces";
import { useSchoolLogo } from "../../hooks/useSchoolLogo";

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <p className="mt-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
        {value || "—"}
      </p>
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-red-600">{message}</p>;
}

export default function SchoolSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    name: "",
    city: "",
    province: "",
    contact_email: "",
    contact_phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMessage, setLogoMessage] = useState("");
  const [logoError, setLogoError] = useState("");
  const { logoSrc, logoUrl, setLogoUrl } = useSchoolLogo();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("school/settings/");
        setSettings(res.data || null);
        setLogoUrl(res.data?.school?.logo_url || null);
        const school = res.data?.school || {};
        setForm({
          name: school.name || "",
          city: school.city || "",
          province: school.province || "",
          contact_email: school.contact_email || "",
          contact_phone: school.contact_phone || "",
        });
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load school settings."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setSaveMessage("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveMessage("");
    setFieldErrors({});
    try {
      const res = await axiosInstance.patch("school/settings/", form);
      setSettings(res.data || null);
      setSaveMessage("School settings saved successfully.");
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        const flattened = {};
        Object.entries(apiErrors).forEach(([key, value]) => {
          flattened[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setFieldErrors(flattened);
      } else {
        setSaveMessage("");
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to save school settings."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await axiosInstance.post("user/change-password/", {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      });
      alert("Password changed successfully.");
      setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.error)
          ? err.response.data.error.join(" ")
          : null) ||
        "Failed to change password.";
      alert(typeof message === "string" ? message : "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLogoUploading(true);
    setLogoMessage("");
    setLogoError("");
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await axiosInstance.post("school/settings/logo/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const logoUrl = res.data?.logo_url || null;
      setSettings((prev) => ({
        ...prev,
        school: { ...(prev?.school || {}), logo_url: logoUrl },
      }));
      setLogoUrl(logoUrl);
      setLogoMessage("School logo updated successfully.");
    } catch (err) {
      setLogoError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Failed to upload school logo."
      );
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    setLogoUploading(true);
    setLogoMessage("");
    setLogoError("");
    try {
      await axiosInstance.delete("school/settings/logo/");
      setSettings((prev) => ({
        ...prev,
        school: { ...(prev?.school || {}), logo_url: null },
      }));
      setLogoUrl(null);
      setLogoMessage("School logo removed.");
    } catch (err) {
      setLogoError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Failed to remove school logo."
      );
    } finally {
      setLogoUploading(false);
    }
  };

  const school = settings?.school || {};
  const principal = settings?.principal || {};
  const capacity = settings?.capacity || {};

  const formatSeats = (value) =>
    value === null || value === undefined ? "Unlimited" : String(value);

  const previewLogoSrc = logoSrc;

  return (
    <SchoolPageShell
      title="School Settings"
      subtitle="Manage your school profile, contact details, and account security."
    >
      {loading ? (
        <p className="text-emerald-800">Loading settings...</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-emerald-950">School Information</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">School Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <FieldError message={fieldErrors.name} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">City</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <FieldError message={fieldErrors.city} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Province</label>
                  <select
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="">Select province</option>
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.province} />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-emerald-950">Contact Information</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={form.contact_email}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <FieldError message={fieldErrors.contact_email} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Contact Phone</label>
                  <input
                    name="contact_phone"
                    value={form.contact_phone}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <FieldError message={fieldErrors.contact_phone} />
                </div>
              </div>
            </section>

            {saveMessage ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {saveMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-[#42b72a] px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save School Settings"}
            </button>
          </form>

          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">School Branding</h2>
            <p className="mt-1 text-sm text-gray-600">
              Upload your school logo. It appears across school admin pages.
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-2">
                <img
                  src={previewLogoSrc}
                  alt={logoUrl ? "School logo preview" : "Learnify logo fallback"}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#42b72a] px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700">
                  {logoUploading ? "Uploading..." : logoUrl ? "Replace Logo" : "Upload Logo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={logoUploading}
                    onChange={handleLogoUpload}
                  />
                </label>
                {logoUrl ? (
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={handleLogoRemove}
                    className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove Logo
                  </button>
                ) : null}
                <p className="text-xs text-gray-500">JPEG, PNG, WEBP, or GIF. Max 2MB.</p>
              </div>
            </div>
            {logoMessage ? (
              <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {logoMessage}
              </p>
            ) : null}
            {logoError ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {logoError}
              </p>
            ) : null}
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">Principal Account</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ReadOnlyField label="Username" value={principal.username} />
              <ReadOnlyField label="Full Name" value={principal.full_name} />
              <ReadOnlyField label="Email" value={principal.email} />
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">Subscription</h2>
            <p className="mt-1 text-sm text-gray-600">Billing details are managed by Learnify admin.</p>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
              <ReadOnlyField label="Plan" value={school.plan_tier} />
              <ReadOnlyField label="Billing Cycle" value={school.billing_cycle} />
              <ReadOnlyField label="Status" value={school.account_status?.replace(/_/g, " ")} />
              <ReadOnlyField label="Expiry" value={school.subscription_expiry} />
              <ReadOnlyField label="Students Used" value={capacity.used_students ?? 0} />
              <ReadOnlyField
                label="Students Remaining"
                value={formatSeats(capacity.remaining_students)}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">Security</h2>
            <form onSubmit={handlePasswordSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Current Password</label>
                <input
                  type="password"
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="rounded-2xl border border-emerald-300 bg-white px-6 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passwordSaving ? "Updating..." : "Change Password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </SchoolPageShell>
  );
}
