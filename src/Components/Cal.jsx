// src/components/Cal.jsx
import { useState } from "react";

const Cal = () => {
  const [input, setInput] = useState("");

  const handleClick = (value) => {
    setInput((prev) => prev + value);
  };

  const handleClear = () => {
    setInput("");
  };

  const handleDelete = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  const handleEqual = () => {
    try {
      const result = eval(input); // ⚠️ Safe only if input is restricted
      setInput(result.toString());
    } catch {
      setInput("Error");
    }
  };

  const buttons = [
    "7",
    "8",
    "9",
    "/",
    "4",
    "5",
    "6",
    "*",
    "1",
    "2",
    "3",
    "-",
    "0",
    ".",
    "=",
    "+",
  ];

  return (
    <div className="max-w-sm mx-auto bg-white rounded-xl shadow-lg p-6 border border-gray-300">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
        Calculator
      </h2>
      <input
        type="text"
        value={input}
        readOnly
        className="w-full mb-4 text-right text-lg border border-gray-300 px-4 py-2 rounded-md bg-gray-50"
      />

      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => (btn === "=" ? handleEqual() : handleClick(btn))}
            className="bg-blue-100 hover:bg-blue-200 text-lg py-2 rounded"
          >
            {btn}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="col-span-2 bg-red-100 hover:bg-red-200 text-lg py-2 rounded"
        >
          Clear
        </button>
        <button
          onClick={handleDelete}
          className="col-span-2 bg-yellow-100 hover:bg-yellow-200 text-lg py-2 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default Cal;
