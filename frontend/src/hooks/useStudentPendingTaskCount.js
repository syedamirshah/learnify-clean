import { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

/**
 * Fetches pending (not fully completed) task count for logged-in students.
 * Uses existing GET /api/student/tasks/ summary field.
 */
export function useStudentPendingTaskCount(isAuthenticated) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (!isAuthenticated || role !== "student") {
      setCount(0);
      return undefined;
    }

    let cancelled = false;

    axiosInstance
      .get("student/tasks/")
      .then((res) => {
        if (cancelled) return;
        const pending = res.data?.summary?.pending_tasks_count;
        setCount(typeof pending === "number" && pending > 0 ? pending : 0);
      })
      .catch((err) => {
        console.warn("Failed to load student task count", err);
        if (!cancelled) setCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return count;
}
