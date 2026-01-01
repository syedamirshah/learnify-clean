import React, { useRef, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

const RoughWorkBoard = () => {
  const canvasRef = useRef(null);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [eraserMode, setEraserMode] = useState(false);

  const setPen = () => {
    setEraserMode(false);
    canvasRef.current?.eraseMode(false);
  };

  const setEraser = () => {
    setEraserMode(true);
    canvasRef.current?.eraseMode(true);
  };

  const clear = () => {
    canvasRef.current?.clearCanvas();
  };

  const undo = () => {
    canvasRef.current?.undo();
  };

  const redo = () => {
    canvasRef.current?.redo();
  };

  return (
    <div className="mt-4 border rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="font-semibold text-gray-800">📝 Rough Work</div>

        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded text-sm ${
              !eraserMode ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
            onClick={setPen}
            type="button"
          >
            Pen
          </button>

          <button
            className={`px-3 py-1 rounded text-sm ${
              eraserMode ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
            onClick={setEraser}
            type="button"
          >
            Eraser
          </button>

          <select
            className="border rounded px-2 py-1 text-sm"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
          >
            <option value={2}>Thin</option>
            <option value={3}>Medium</option>
            <option value={5}>Thick</option>
            <option value={8}>Extra</option>
          </select>

          <button className="px-3 py-1 rounded text-sm bg-gray-200" onClick={undo} type="button">
            Undo
          </button>
          <button className="px-3 py-1 rounded text-sm bg-gray-200" onClick={redo} type="button">
            Redo
          </button>
          <button className="px-3 py-1 rounded text-sm bg-red-100 text-red-700" onClick={clear} type="button">
            Clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="p-2">
        <ReactSketchCanvas
          ref={canvasRef}
          width="100%"
          height="320px"
          strokeWidth={strokeWidth}
          strokeColor="#111827"
          canvasColor="#ffffff"
          style={{ borderRadius: "8px" }}
        />
      </div>
    </div>
  );
};

export default RoughWorkBoard;