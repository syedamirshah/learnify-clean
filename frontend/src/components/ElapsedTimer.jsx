import React, { useEffect, useState } from "react";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const ElapsedTimer = () => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");

  // Just for aesthetics — let's wrap around every 10 minutes (600 seconds = 100%)
  const percentage = (elapsedSeconds % 600) / 600 * 100;

  return (
    <div style={{ width: 120 }}>
      <CircularProgressbarWithChildren
        value={percentage}
        strokeWidth={8}
        styles={buildStyles({
          pathColor: "#5CC245",
          trailColor: "#e5e7eb",
        })}
      >
        <div className="text-center">
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>
            {minutes}:{seconds}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>⏱ Time Spent</div>
        </div>
      </CircularProgressbarWithChildren>
    </div>
  );
};

export default ElapsedTimer;