import React, { useRef, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

const RoughWorkBoard = () => {
  const canvasRef = useRef(null);

  // Modes: "pen" | "highlighter" | "eraser"
  const [mode, setMode] = useState("pen");

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

  const iconBtnBase =
    "w-9 h-9 flex items-center justify-center rounded-md select-none";
  const activeStyle = "bg-green-600 text-white";
  const inactiveStyle = "bg-gray-100 text-gray-800 hover:bg-gray-200";

  return (
    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Header (icons only) */}
      <div className="flex items-center justify-between px-2 py-2 border-b">
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Pen"
            onClick={setPen}
            className={`${iconBtnBase} ${mode === "pen" ? activeStyle : inactiveStyle}`}
          >
            ✍️
          </button>

          <button
            type="button"
            title="Highlighter"
            onClick={setHighlighter}
            className={`${iconBtnBase} ${mode === "highlighter" ? activeStyle : inactiveStyle}`}
          >
            🖍️
          </button>

          <button
            type="button"
            title="Eraser"
            onClick={setEraser}
            className={`${iconBtnBase} ${mode === "eraser" ? activeStyle : inactiveStyle}`}
          >
            🧽
          </button>
        </div>

        <button
          type="button"
          title="Clear"
          onClick={clear}
          className={`${iconBtnBase} bg-red-100 text-red-700 hover:bg-red-200`}
        >
          🗑️
        </button>
      </div>

      {/* Canvas */}
      <div className="p-2">
        <ReactSketchCanvas
          ref={canvasRef}
          width="100%"
          height="300px"
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          canvasColor="#ffffff"
          style={{ borderRadius: "8px" }}
        />
      </div>
    </div>
  );
};

export default RoughWorkBoard;