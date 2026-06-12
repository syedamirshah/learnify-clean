import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../utils/apiConfig";
import { buildSchoolPaymentChooseUrl } from "../../utils/paymentRedirect";
import { PROVINCES } from "../../constants/provinces";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";

const PLANS = [
  { id: "small", label: "Small School", detail: "Up to 200 students" },
  { id: "medium", label: "Medium School", detail: "201–500 students" },
  { id: "enterprise", label: "Enterprise", detail: "Unlimited students" },
];

const initialForm = {
  school_name: "",
  city: "",
  province: "",
  contact_email: "",
  contact_phone: "",
  principal_full_name: "",
  username: "",
  password: "",
  confirm_password: "",
  plan_tier: "small",
  billing_cycle: "yearly",
};

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-red-600">{message}</p>;
}

export default function SchoolSignup() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitError("");
  };

  const validateClient = () => {
    const nextErrors = {};
    const required = [
      "school_name",
      "city",
      "province",
      "contact_email",
      "principal_full_name",
      "username",
      "password",
      "confirm_password",
      "plan_tier",
      "billing_cycle",
    ];
    required.forEach((field) => {
      if (!String(form[field] || "").trim()) {
        nextErrors[field] = "This field is required.";
      }
    });
    if (form.password && form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }
    if (form.password !== form.confirm_password) {
      nextErrors.confirm_password = "Passwords do not match.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const paymentChooseUrl =
    success?.success && success.school_id && success.username
      ? buildSchoolPaymentChooseUrl(API_BASE_URL, success.school_id, success.username)
      : "";

  useEffect(() => {
    if (!paymentChooseUrl) return undefined;

    const timer = window.setTimeout(() => {
      window.location.href = paymentChooseUrl;
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [paymentChooseUrl]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateClient()) return;

    setLoading(true);
    setSubmitError("");
    try {
      const res = await axiosInstance.post("school/signup/", form);
      if (!res.data?.success || !res.data?.school_id || !res.data?.username) {
        setSubmitError("Unexpected signup response. Please try again or contact support.");
        return;
      }
      setSuccess(res.data);
      setForm(initialForm);
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        const flattened = {};
        Object.entries(apiErrors).forEach(([key, value]) => {
          flattened[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setErrors(flattened);
      } else {
        setSubmitError(
          err?.response?.data?.message ||
            err?.response?.data?.detail ||
            "Failed to create school account."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✓
          </div>
          <h1 className="mt-5 text-3xl font-black text-emerald-950">School Account Created</h1>
          <p className="mt-4 text-base leading-7 text-gray-700">
            School account created. Next step: complete payment to activate your school.
          </p>
          <p className="mt-2 text-sm text-emerald-800">
            Redirecting to payment in a few seconds, or use the button below.
          </p>
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p>
              <span className="font-bold">Username:</span> {success.username}
            </p>
            <p className="mt-1">
              <span className="font-bold">School ID:</span> {success.school_id}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={paymentChooseUrl}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Continue to Payment
            </a>
            <Link
              to="/school-onboarding"
              className="rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
            >
              Back to School Onboarding
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 text-gray-900"
      style={{
        fontFamily: '"Plus Jakarta Sans", Inter, Nunito, system-ui, -apple-system, sans-serif',
      }}
    >
      <header className="border-b border-emerald-200/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Learnify Pakistan Logo" className="h-12 w-auto" />
            <span className="text-lg font-extrabold text-emerald-950">School Signup</span>
          </Link>
          <Link
            to="/school-onboarding"
            className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-800"
          >
            View Pricing
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-10">
        <div className="text-center">
          <h1 className="text-3xl font-black text-emerald-950 sm:text-4xl">Create Your School Account</h1>
          <p className="mt-3 text-sm text-gray-600 sm:text-base">
            Register your school and principal account, then complete payment to activate.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-8 rounded-3xl border border-emerald-200 bg-white p-6 shadow-lg sm:p-8"
        >
          <section>
            <h2 className="text-lg font-black text-emerald-950">School Details</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">School Name *</label>
                <input
                  name="school_name"
                  value={form.school_name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <FieldError message={errors.school_name} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">City *</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <FieldError message={errors.city} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Province *</label>
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
                <FieldError message={errors.province} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Contact Email *</label>
                <input
                  type="email"
                  name="contact_email"
                  value={form.contact_email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <FieldError message={errors.contact_email} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Contact Phone</label>
                <input
                  name="contact_phone"
                  value={form.contact_phone}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <FieldError message={errors.contact_phone} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-emerald-950">Principal Account</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Principal Full Name *</label>
                <input
                  name="principal_full_name"
                  value={form.principal_full_name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <FieldError message={errors.principal_full_name} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Username *</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <FieldError message={errors.username} />
              </div>
              <div />
              <div>
                <label className="text-sm font-semibold text-gray-700">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <FieldError message={errors.password} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Confirm Password *</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <FieldError message={errors.confirm_password} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-emerald-950">Plan Selection</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <label
                  key={plan.id}
                  className={`cursor-pointer rounded-2xl border p-4 ${
                    form.plan_tier === plan.id
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan_tier"
                    value={plan.id}
                    checked={form.plan_tier === plan.id}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <p className="font-bold text-emerald-950">{plan.label}</p>
                  <p className="mt-1 text-xs text-gray-600">{plan.detail}</p>
                </label>
              ))}
            </div>
            <FieldError message={errors.plan_tier} />

            <div className="mt-4 flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold">
                <input
                  type="radio"
                  name="billing_cycle"
                  value="monthly"
                  checked={form.billing_cycle === "monthly"}
                  onChange={handleChange}
                />
                Monthly
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold">
                <input
                  type="radio"
                  name="billing_cycle"
                  value="yearly"
                  checked={form.billing_cycle === "yearly"}
                  onChange={handleChange}
                />
                Yearly (25% discount)
              </label>
            </div>
            <FieldError message={errors.billing_cycle} />
          </section>

          {submitError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating School Account..." : "Create School Account"}
          </button>
        </form>
      </main>
    </div>
  );
}
