import React, { useEffect, useRef, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

const RoughWorkBoard = () => {
  const canvasRef = useRef(null);

  // Modes: "pen" | "highlighter" | "eraser"
  const [mode, setMode] = useState("pen");

  // Ensure default is pen (not eraser)
  useEffect(() => {
    canvasRef.current?.eraseMode(false);
  }, []);

  const setPen = () => {
    setMode("pen");
    canvasRef.current?.eraseMode(false);
  };

  const setHighlighter = () => {
    setMode("highlighter");
    canvasRef.current?.eraseMode(false);
  };

  const setEraser = () => {
    setMode("eraser");
    canvasRef.current?.eraseMode(true);
  };

  const clear = () => {
    canvasRef.current?.clearCanvas();
  };

  // ✅ Fixed settings (no options)
  const strokeWidth = mode === "highlighter" ? 10 : 4; // medium pen; thicker highlighter
  const strokeColor = mode === "highlighter" ? "rgba(255, 214, 0, 0.45)" : "#111827";

  // prettier icon buttons
  const btnBase =
    "w-11 h-11 flex items-center justify-center rounded-full transition select-none shadow-sm";
  const activeBtn = "bg-green-600 text-white";
  const inactiveBtn = "bg-white text-gray-800 hover:bg-gray-100";
  const clearBtn = "bg-red-50 text-red-700 hover:bg-red-100";

  const iconStyle = { fontSize: "20px", lineHeight: "1" };

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header (icons only, evenly spaced) */}
      <div className="px-2 py-2 border-b bg-white">
        <div className="flex items-center justify-between">
          {/* left tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Pen"
              onClick={setPen}
              className={`${btnBase} ${mode === "pen" ? activeBtn : inactiveBtn}`}
            >
              <span style={iconStyle}>✍️</span>
            </button>

            <button
              type="button"
              title="Highlighter"
              onClick={setHighlighter}
              className={`${btnBase} ${
                mode === "highlighter" ? activeBtn : inactiveBtn
              }`}
            >
              <span style={iconStyle}>🖍️</span>
            </button>

            <button
              type="button"
              title="Eraser"
              onClick={setEraser}
              className={`${btnBase} ${mode === "eraser" ? activeBtn : inactiveBtn}`}
            >
              <span style={iconStyle}>🧽</span>
            </button>
          </div>

          {/* right clear */}
          <button
            type="button"
            title="Delete All"
            onClick={clear}
            className={`${btnBase} ${clearBtn}`}
          >
            <span style={iconStyle}>🗑️</span>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="p-2">
      <ReactSketchCanvas
        ref={canvasRef}
        width="100%"
        height="420px"
        strokeWidth={strokeWidth}
        strokeColor={strokeColor}
        canvasColor="#ffffff"
        style={{
          borderRadius: "12px",
        }}
      />
      </div>
    </div>
  );
};

export default RoughWorkBoard;