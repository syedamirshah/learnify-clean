import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance"; // ✅ one folder up from /pages/public

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PaymentResult() {
  const q = useQuery();
  const [me, setMe] = useState(null);

  const status   = (q.get("status") || "").toLowerCase();
  const orderRef = q.get("orderRef") || "";
  const txn      = q.get("txn") || "";
  const pid      = q.get("pid") || "";
  const desc     = q.get("desc") || "";

  useEffect(() => {
    axiosInstance.get("user/me/")
      .then(res => {
        setMe(res.data);
        if (res.data.account_status) {
          localStorage.setItem("account_status", res.data.account_status);
        }
        if (res.data.role) {
          localStorage.setItem("user_role", res.data.role);
        }
        if (res.data.full_name || res.data.username) {
          localStorage.setItem("user_full_name", res.data.full_name || res.data.username);
        }
      })
      .catch(() => {});
  }, []);

  const success = status === "success";

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-xl shadow p-6">
        <h1 className={`text-2xl font-bold ${success ? "text-green-700" : "text-red-700"}`}>
          {success ? "Payment Successful" : "Payment Status"}
        </h1>

        <div className="mt-4 text-sm text-gray-700 space-y-1">
          <div><b>Status:</b> {status || "unknown"}</div>
          {orderRef && <div><b>Order Ref:</b> {orderRef}</div>}
          {txn && <div><b>Transaction ID:</b> {txn}</div>}
          {desc && <div><b>Code/Desc:</b> {desc}</div>}
          {pid && <div><b>Payment ID:</b> {pid}</div>}
        </div>

        {success ? (
          <div className="mt-6 space-y-3">
            <p className="text-green-700">
              Thank you! Your subscription has been activated/extended.
            </p>
            <Link to="/" className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              Go to Home
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-gray-700">
              If this was a mistake, you can try paying again.
            </p>
            <a
              href={`${import.meta.env.VITE_API_BASE_URL}payments/choose/`}
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Make Payment
            </a>
            <Link to="/" className="inline-block ml-3 text-green-700 underline">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}