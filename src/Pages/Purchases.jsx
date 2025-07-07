import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import debounce from "lodash.debounce";
import { Link, Navigate } from "react-router-dom";

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    warehouse: "",
    supplier: "",
    status: "Received",
    tax: 0,
    discount: 0,
    items: [],
  });
  const [editId, setEditId] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [viewData, setViewData] = useState(null);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchPurchases();
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
    setProducts(res.data);
  };

  const fetchPurchases = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/purchases`);
    const data = Array.isArray(res.data) ? res.data : res.data.purchases;
    setPurchases(data || []);
  };

  const handleAddItem = () => {
    const newItem = {
      code: "",
      name: "",
      price: 0,
      qty: 1,
      discount: 0,
      total: 0,
    };
    setForm((f) => ({ ...f, items: [...f.items, newItem] }));
  };

  const debouncedFetchProduct = useCallback(
    debounce((value, idx) => {
      const prod = products.find((p) => p.code === value);
      const items = [...form.items];

      if (prod) {
        const existingIndex = items.findIndex(
          (item, i) => item.code === value && i !== idx
        );

        if (existingIndex !== -1) {
          items[existingIndex].qty += 1;
          items[existingIndex].total =
            items[existingIndex].price * items[existingIndex].qty -
            items[existingIndex].discount;
          items.splice(idx, 1);
        } else {
          items[idx] = {
            code: prod.code,
            name: prod.name,
            price: prod.price,
            qty: 1,
            discount: 0,
            total: prod.price,
          };
        }
      } else {
        items[idx] = {
          ...items[idx],
          code: value,
          name: "",
          price: 0,
          total: 0,
        };
      }

      setForm((f) => ({ ...f, items }));
    }, 300),
    [products, form.items]
  );

  const handleItemChange = (idx, field, value) => {
    const items = [...form.items];
    if (field === "code") {
      items[idx].code = value;
      setForm((f) => ({ ...f, items }));
      debouncedFetchProduct(value, idx);
    } else {
      items[idx][field] = value;
      const { price, qty, discount } = items[idx];
      items[idx].total = price * qty - discount;
      setForm((f) => ({ ...f, items }));
    }
  };

  const calculateGrand = () => {
    const sub = form.items.reduce((acc, i) => acc + i.total, 0);
    const discount = parseFloat(form.discount) || 0;
    const tax = ((sub - discount) * (parseFloat(form.tax) || 0)) / 100;
    return sub - discount + tax;
  };

  const handleSubmit = async () => {
    const payload = { ...form, grandTotal: calculateGrand() };
    if (editId) {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/purchases/${editId}`,
        payload
      );
      setEditId(null);
    } else {
      await axios.post(`${import.meta.env.VITE_API_URL}/purchases`, payload);
    }
    setForm({
      warehouse: "",
      supplier: "",
      status: "Received",
      tax: 0,
      discount: 0,
      items: [],
    });
    fetchPurchases();
  };

  const handleEdit = (p) => {
    setEditId(p._id);
    setForm({ ...p });
    closeModal();
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this purchase?")) {
      await axios.delete(`${import.meta.env.VITE_API_URL}/purchases/${id}`);
      fetchPurchases();
    }
    closeModal();
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const htmlContent = `
    <html>
      <head>
        <title>Print Purchase</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { color: #1E3A8A; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Purchase Receipt</h1>
        <p><strong>Supplier:</strong> ${viewData.supplier}</p>
        <p><strong>Warehouse:</strong> ${viewData.warehouse}</p>
        <p><strong>Status:</strong> ${viewData.status}</p>
        <p><strong>Date:</strong> ${formatDate(viewData.createdAt)}</p>
        <p><strong>Tax:</strong> ${viewData.tax}%</p>
        <p><strong>Discount:</strong> Rs ${viewData.discount}</p>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${viewData.items
              .map(
                (i) => `
              <tr>
                <td>${i.code}</td>
                <td>${i.name}</td>
                <td>${i.qty}</td>
                <td>Rs ${i.price}</td>
                <td>Rs ${i.discount}</td>
                <td>Rs ${i.total}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <h2 style="margin-top: 20px;">Grand Total: Rs ${
          viewData.grandTotal
        }</h2>
      </body>
    </html>
  `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const openModal = (p) => setSelectedPurchase(p);
  const closeModal = () => {
    setSelectedPurchase(null);
    setViewData(null);
  };

  const handleView = () => setViewData(selectedPurchase);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Purchase Details", 14, 16);
    autoTable(doc, {
      startY: 25,
      head: [["Code", "Name", "Price", "Qty", "Discount", "Total"]],
      body: selectedPurchase.items.map((i) => [
        i.code,
        i.name,
        `Rs ${i.price}`,
        i.qty,
        `Rs ${i.discount}`,
        `Rs ${i.total}`,
      ]),
    });
    doc.text(
      `Grand Total: Rs ${selectedPurchase.grandTotal}`,
      14,
      doc.lastAutoTable.finalY + 10
    );
    doc.save(`purchase_${selectedPurchase._id}.pdf`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-800">
      <h1 className="text-4xl font-bold mb-8 text-black">Create Purchase</h1>

      <div className="bg-white shadow-xl p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {["warehouse", "supplier"].map((key) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize text-gray-600">
              {key}
            </label>
            <input
              type="text"
              value={form[key]}
              onChange={(e) =>
                setForm((f) => ({ ...f, [key]: e.target.value }))
              }
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Pending</option>
            <option>Received</option>
            <option>Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Tax (%)
          </label>
          <input
            type="number"
            value={form.tax}
            onChange={(e) => setForm((f) => ({ ...f, tax: e.target.value }))}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-600">
            Discount
          </label>
          <input
            type="number"
            value={form.discount}
            onChange={(e) =>
              setForm((f) => ({ ...f, discount: e.target.value }))
            }
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button
            onClick={handleAddItem}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition duration-200"
          >
            + Add Item
          </button>
        </div>
      </div>

      {form.items.length > 0 && (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg mb-8">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                {["Code", "Name", "Price", "Qty", "Discount", "Total"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2 font-semibold text-gray-700"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {form.items.map((it, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={it.code}
                      onChange={(e) =>
                        handleItemChange(i, "code", e.target.value)
                      }
                      className="w-full border px-2 py-1 rounded focus:outline-none"
                      placeholder="Code"
                    />
                  </td>
                  <td className="px-2 py-2">{it.name}</td>
                  <td className="px-2 py-2">Rs {it.price}</td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={it.qty}
                      onChange={(e) =>
                        handleItemChange(i, "qty", Number(e.target.value))
                      }
                      className="w-16 border px-2 py-1 rounded"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={it.discount}
                      onChange={(e) =>
                        handleItemChange(i, "discount", Number(e.target.value))
                      }
                      className="w-20 border px-2 py-1 rounded"
                    />
                  </td>
                  <td className="px-2 py-2">Rs {it.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 flex justify-end text-lg font-semibold text-blue-700">
            Grand Total: Rs {calculateGrand()}
          </div>
        </div>
      )}

      <div className="mb-10 flex justify-end gap-3">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200"
        >
          {editId ? "Update Purchase" : "Create Purchase"}
        </button>

        <Link to="/purchase-return" className="md:col-span-2 flex justify-end">
          <button className="bg-green-600 hover:bg-green-700  text-white px-2 py-2 rounded-lg">
            Return Purchase
          </button>
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-gray-700 mb-4">All Purchases</h2>
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              {[
                "Date",
                "Supplier",
                "Warehouse",
                "Status",
                "Tax",
                "Discount",
                "Total",
                "Items",
                "Actions",
              ].map((h) => (
                <th key={h} className="px-4 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p._id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-2">{p.supplier}</td>
                <td className="px-4 py-2">{p.warehouse}</td>
                <td className="px-4 py-2">{p.status}</td>
                <td className="px-4 py-2">{p.tax}%</td>
                <td className="px-4 py-2">Rs {p.discount}</td>
                <td className="px-4 py-2">Rs {p.grandTotal}</td>
                <td className="px-4 py-2 text-xs">
                  {p.items.map((i) => (
                    <div key={i.code}>
                      {i.name} ({i.qty})
                    </div>
                  ))}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => openModal(p)}
                    className="text-blue-500 text-xl hover:text-blue-700"
                  >
                    ⋮
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Purchase Actions</h3>
            <button
              onClick={() => handleEdit(selectedPurchase)}
              className="w-full text-left py-2 px-4 hover:bg-gray-100"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => handleDelete(selectedPurchase._id)}
              className="w-full text-left py-2 px-4 hover:bg-gray-100 text-red-600"
            >
              🗑 Delete
            </button>
            <button
              onClick={handleView}
              className="w-full text-left py-2 px-4 hover:bg-gray-100"
            >
              👁 View
            </button>
            <button
              onClick={downloadPDF}
              className="w-full text-left py-2 px-4 hover:bg-gray-100"
            >
              ⬇️ Download PDF
            </button>
            <button
              onClick={closeModal}
              className="mt-4 bg-gray-200 w-full py-2 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {viewData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-blue-700">
              Purchase Details
            </h2>
            <p>
              <strong>Supplier:</strong> {viewData.supplier}
            </p>
            <p>
              <strong>Warehouse:</strong> {viewData.warehouse}
            </p>
            <p>
              <strong>Status:</strong> {viewData.status}
            </p>
            <p>
              <strong>Date:</strong> {formatDate(viewData.createdAt)}
            </p>
            <p>
              <strong>Tax:</strong> {viewData.tax}%
            </p>
            <p>
              <strong>Discount:</strong> Rs {viewData.discount}
            </p>
            <h3 className="mt-4 font-semibold text-gray-800">Items</h3>
            <ul className="text-sm text-gray-700">
              {viewData.items.map((i, idx) => (
                <li key={idx}>
                  {i.code} — {i.name} × {i.qty} @ Rs {i.price} – Disc Rs{" "}
                  {i.discount} = Rs {i.total}
                </li>
              ))}
            </ul>
            <p className="mt-4 font-semibold text-blue-700">
              Grand Total: Rs {viewData.grandTotal}
            </p>
            <button
              onClick={handlePrint}
              className="mt-3 bg-green-600 w-full text-black py-2 rounded hover:bg-green-700"
            >
              🖨️ Print
            </button>

            <button
              onClick={() => setViewData(null)}
              className="mt-4 bg-blue-600 w-full text-white py-2 rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
