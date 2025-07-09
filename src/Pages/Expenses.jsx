import { useEffect, useState } from "react";
import axios from "axios";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ name: "", details: "", amount: "" });
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/expenses`);
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  const fetchFilteredExpenses = async () => {
    try {
      const { startDate, endDate } = filters;
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/expenses/report/filter?${params.toString()}`
      );
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error filtering expenses:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.details || !form.amount) return;

    try {
      if (editingId) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/expenses/${editingId}`,
          {
            name: form.name,
            details: form.details,
            amount: parseFloat(form.amount),
          }
        );
        setEditingId(null);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/expenses`, {
          name: form.name,
          details: form.details,
          amount: parseFloat(form.amount),
        });
      }
      setForm({ name: "", details: "", amount: "" });
      fetchExpenses();
    } catch (err) {
      console.error("Error submitting expense:", err);
    }
  };

  const handleEdit = (exp) => {
    setForm({
      name: exp.name,
      details: exp.details,
      amount: exp.amount,
    });
    setEditingId(exp._id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Expenses Management</h1>

      {/* Expense Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow p-4 rounded-md mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Expense Details"
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Amount (PKR)"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="border p-2 rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
        >
          {editingId ? "Update Expense" : "Add Expense"}
        </button>
      </form>

      {/* Report Filters */}
      <div className="bg-white shadow p-4 rounded-md mb-6">
        <h2 className="text-lg font-semibold mb-2">Filter Expense Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
            className="border p-2 rounded"
          />
          <button
            onClick={fetchFilteredExpenses}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Total Expense */}
      <div className="text-right text-lg font-semibold mb-2">
        Total Expenses: PKR {total.toLocaleString()}
      </div>

      {/* Expense Table */}
      <div className="bg-white shadow rounded-md overflow-x-auto">
        <table className="w-full border text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Details</th>
              <th className="p-2 border">Amount (PKR)</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody className="">
            {expenses.map((exp) => (
              <tr key={exp._id} className="">
                <td className="p-2 border ">{exp.name}</td>
                <td className="p-2 border ">{exp.details}</td>
                <td className="p-2 border ">{exp.amount.toLocaleString()}</td>
                <td className="p-2 border">
                  {new Date(exp.date).toLocaleDateString()}
                </td>
                <td className="p-2 border">
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => handleEdit(exp)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exp._id)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center p-4 text-gray-500">
                  No expenses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expenses;
