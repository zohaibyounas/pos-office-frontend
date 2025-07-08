import { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash, FaEdit, FaEye, FaSave, FaTimes } from "react-icons/fa";

const PurchaseReturn = () => {
  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editingReturnId, setEditingReturnId] = useState(null);
  const [viewDetailId, setViewDetailId] = useState(null);

  const [form, setForm] = useState({
    supplier: "",
    warehouse: "",
    reason: "",
  });

  useEffect(() => {
    fetchReturns();
    fetchProducts();
  }, []);

  const fetchReturns = async () => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/purchase-returns`
    );
    setReturns(res.data);
  };

  const fetchProducts = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
    setProducts(res.data);
  };

  const handleAddProduct = (product) => {
    if (!selectedProducts.find((p) => p._id === product._id)) {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleSubmit = async () => {
    const returnData = {
      ...form,
      products: selectedProducts.map((p) => ({
        productId: p._id,
        name: p.name,
        code: p.code,
        quantity: p.quantity,
        price: p.price,
      })),
      total: selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0),
    };

    if (editingReturnId) {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/purchase-returns/${editingReturnId}`,
        returnData
      );
    } else {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/purchase-returns`,
        returnData
      );
    }

    fetchReturns();
    resetForm();
  };

  const resetForm = () => {
    setForm({ supplier: "", warehouse: "", reason: "" });
    setSelectedProducts([]);
    setEditingReturnId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this return?")) {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/purchase-returns/${id}`
      );
      fetchReturns();
    }
  };

  const handleEdit = (r) => {
    setEditingReturnId(r._id);
    setForm({
      supplier: r.supplier,
      warehouse: r.warehouse,
      reason: r.reason,
    });
    setSelectedProducts(
      r.products.map((p) => ({
        ...p,
        _id: p.productId,
      }))
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Purchase Return</h2>

      {/* Form */}
      <div className="bg-white p-6 rounded-xl shadow mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Supplier"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            className="border px-4 py-2 rounded w-full"
          />
          <input
            placeholder="Warehouse"
            value={form.warehouse}
            onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
            className="border px-4 py-2 rounded w-full"
          />
        </div>
        <textarea
          placeholder="Return Reason"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className="border px-4 py-2 rounded w-full"
        />

        <select
          onChange={(e) => {
            const product = JSON.parse(e.target.value);
            handleAddProduct(product);
          }}
          className="border px-4 py-2 rounded w-full"
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p._id} value={JSON.stringify(p)}>
              {p.name} (Rs {p.price})
            </option>
          ))}
        </select>

        <div>
          {selectedProducts.map((p, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center mt-2 border p-2 rounded"
            >
              <div>
                {p.name} - Qty:
                <input
                  type="number"
                  value={p.quantity}
                  onChange={(e) => {
                    const updated = [...selectedProducts];
                    updated[idx].quantity = parseInt(e.target.value);
                    setSelectedProducts(updated);
                  }}
                  className="w-16 ml-2 border rounded px-1"
                />
              </div>
              <span className="font-semibold text-gray-700">Rs {p.price}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          {editingReturnId && (
            <button
              onClick={resetForm}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
            >
              <FaTimes className="inline mr-1" /> Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            {editingReturnId ? (
              <>
                <FaSave className="inline mr-1" /> Update Return
              </>
            ) : (
              "Submit Return"
            )}
          </button>
        </div>
      </div>

      {/* Returns Table */}
      <h3 className="text-2xl font-semibold mb-4 text-gray-700">
        Return Records
      </h3>
      <div className="overflow-auto">
        <table className="w-full border text-sm bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-gray-200 text-gray-800">
            <tr>
              <th className="border px-4 py-2 text-left">Supplier</th>
              <th className="border px-4 py-2 text-left">Warehouse</th>
              <th className="border px-4 py-2 text-left">Total</th>
              <th className="border px-4 py-2 text-left">Date</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{r.supplier}</td>
                <td className="border px-4 py-2">{r.warehouse}</td>
                <td className="border px-4 py-2">Rs {r.total}</td>
                <td className="border px-4 py-2">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="border px-4 py-2 flex items-center justify-center gap-2">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() =>
                      setViewDetailId(viewDetailId === r._id ? null : r._id)
                    }
                  >
                    <FaEye />
                  </button>
                  <button
                    className="text-green-600 hover:text-green-800"
                    onClick={() => handleEdit(r)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleDelete(r._id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* View Detail Section */}
        {viewDetailId &&
          returns
            .filter((r) => r._id === viewDetailId)
            .map((r) => (
              <div
                key={r._id}
                className="bg-white border rounded mt-4 p-4 shadow text-sm"
              >
                <h4 className="font-semibold mb-2">Products Returned:</h4>
                <ul className="space-y-1">
                  {r.products.map((p, i) => (
                    <li key={i}>
                      {p.name} — Qty: {p.quantity} × Rs {p.price}
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  <strong>Reason:</strong> {r.reason}
                </p>
              </div>
            ))}
      </div>
    </div>
  );
};

export default PurchaseReturn;
