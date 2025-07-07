import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer: "",
    customerphone: "", // Added customerphone field
    warehouse: "",
    status: "Completed",
    paymentStatus: "Paid",
    paymentType: "Cash",
    grandTotal: 0,
    paid: 0,
    discount: 0,
    cashier: "",
  });

  // Add barcode scanner state
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      setForm((prev) => ({ ...prev, cashier: parsedUser.email }));
    }

    // Add event listener for barcode scanner
    window.addEventListener("keydown", handleBarcodeInput);
    return () => {
      window.removeEventListener("keydown", handleBarcodeInput);
    };
  }, []);

  // Barcode scanner handler
  const handleBarcodeInput = (e) => {
    // Check if we're already processing a barcode
    if (isScanning) return;

    // Check if the input is coming from a barcode scanner (usually fast input)
    if (e.key !== "Enter") {
      setBarcodeInput((prev) => prev + e.key);
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        if (barcodeInput.length > 3) {
          // Assuming barcodes are longer than 3 characters
          handleBarcodeScan(barcodeInput);
        }
        setBarcodeInput("");
      }, 100); // Adjust timeout based on your scanner speed
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = async (barcode) => {
    try {
      // Find product by barcode
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}products?code=${barcode}`
      );
      if (response.data.length > 0) {
        const product = response.data[0];
        handleAddProduct(product);

        // Update discount if product has discount
        if (product.discount) {
          setForm((prev) => ({ ...prev, discount: product.discount }));
        }
      } else {
        console.log("Product not found for barcode:", barcode);
      }
    } catch (error) {
      console.error("Error fetching product by barcode:", error);
    }
  };

  const [editId, setEditId] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    fetchSales();
    fetchAllProducts();
  }, []);

  useEffect(() => {
    calculateGrandTotal();
  }, [selectedProducts, form.discount]);

  const fetchSales = () => {
    axios.get(`${import.meta.env.VITE_API_URL}/sales`).then((res) => {
      setSales(res.data);
    });
  };

  const fetchAllProducts = () => {
    axios.get(`${import.meta.env.VITE_API_URL}/products`).then((res) => {
      setProducts(res.data);
    });
  };

  const calculateGrandTotal = () => {
    const subtotal = selectedProducts.reduce(
      (sum, product) => sum + (product.totalPrice || product.price || 0),
      0
    );
    const discount = parseFloat(form.discount) || 0;
    const total = subtotal - discount;
    setForm((prev) => ({ ...prev, grandTotal: total > 0 ? total : 0 }));
  };

  const handleAddProduct = (product) => {
    const existingProduct = selectedProducts.find((p) => p._id === product._id);

    if (existingProduct) {
      const updatedProducts = selectedProducts.map((p) =>
        p._id === product._id
          ? {
              ...p,
              quantity: p.quantity + 1,
              totalPrice: (p.quantity + 1) * p.price,
            }
          : p
      );
      setSelectedProducts(updatedProducts);
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          ...product,
          quantity: 1,
          totalPrice: product.price,
        },
      ]);
    }
    setProductSearch("");
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== productId));
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedProducts = selectedProducts.map((p) =>
      p._id === productId
        ? {
            ...p,
            quantity: newQuantity,
            totalPrice: newQuantity * p.price,
          }
        : p
    );
    setSelectedProducts(updatedProducts);
  };

  const handleSubmit = async () => {
    const saleData = {
      ...form,
      products: selectedProducts.map((p) => ({
        productId: p._id,
        name: p.name,
        code: p.code,
        price: p.price,
        quantity: p.quantity,
        totalPrice: p.totalPrice,
      })),
    };

    try {
      let res;
      if (editId) {
        res = await axios.put(
          `${import.meta.env.VITE_API_URL}/sales/${editId}`,
          saleData
        );
        setEditId(null);
      } else {
        res = await axios.post(
          `${import.meta.env.VITE_API_URL}/sales`,
          saleData
        );
      }

      resetForm();
      fetchSales();

      // ✅ Pass the actual sale data to the print function
      if (res?.data) {
        handlePrintReceipt(res.data);
      }
    } catch (err) {
      console.error("Error saving sale:", err);
    }
  };

  const handleEdit = (sale) => {
    setEditId(sale._id);
    setForm({
      customer: sale.customer,
      customerphone: sale.customerphone || "", // Added customerphone field
      warehouse: sale.warehouse,
      status: sale.status,
      paymentStatus: sale.paymentStatus,
      paymentType: sale.paymentType,
      grandTotal: sale.grandTotal,
      paid: sale.paid,
      discount: sale.discount || 0,
      cashier: sale.cashier || "",
    });
    setSelectedProducts(
      sale.products.map((p) => ({
        ...p,
        _id: p.productId,
        totalPrice: p.totalPrice || p.price * (p.quantity || 1),
      })) || []
    );
    closeModal();
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this sale?")) {
      await axios.delete(`${import.meta.env.VITE_API_URL}/sales/${id}`);
      fetchSales();
    }
    closeModal();
  };

  const resetForm = () => {
    setForm({
      customer: "",
      customerphone: "", // Added customerphone field
      warehouse: "",
      status: "Pending",
      paymentStatus: "Unpaid",
      paymentType: "Cash",
      grandTotal: 0,
      paid: 0,
      discount: 0,
      cashier: "",
    });
    setSelectedProducts([]);
    setEditId(null);
  };

  const openModal = (sale) => {
    setSelectedSale(sale);
  };

  const closeModal = () => {
    setSelectedSale(null);
    setViewData(null);
  };

  const handleView = () => {
    setViewData(selectedSale);
  };

  const handlePrintReceipt = (sale) => {
    const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Receipt</title>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap" rel="stylesheet">
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
          }
        }

        body {
          font-family: 'Arial', sans-serif;
          width: 80mm;
          margin: 0;
          padding: 0;
          font-size: 11px;
        }

        .container {
          padding: 8px 10px;
        }

        .brand {
          font-family: 'Cinzel', serif;
          font-size: 22px;
          text-align: center;
          letter-spacing: 2px;
          font-weight: bold;
          color: #111;
          text-shadow: 1px 1px 0px rgba(0,0,0,0.2);
          margin-bottom: 2px;
        }

        .contact {
          text-align: center;
          font-size: 10px;
          margin-bottom: 6px;
        }

        hr {
          border: none;
          border-top: 1px dashed #333;
          margin: 5px 0;
        }

        table {
          width: 100%;
          margin-top: 4px;
        }

        th, td {
          font-size: 11px;
          padding: 2px 0;
        }

        td {
          vertical-align: top;
        }

        th {
          text-align: left;
        }

        .totals p {
          margin: 2px 0;
          display: flex;
          justify-content: space-between;
        }

        .footer {
          text-align: center;
          margin-top: 8px;
          font-size: 10px;
        }

        .label {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">Cielo Noir</div>
        <div class="contact">Plot #60, 15 Bank Rd, Saddar, Rawalpindi</div>
        <div class="contact">📞 03285105601</div>
        <hr />
        <div><span class="label">Date:</span> ${new Date(
          sale.createdAt
        ).toLocaleString()}</div>
        <div><span class="label">Customer:</span> ${
          sale.customer || "N/A"
        }</div>
        <div><span class="label">Phone:</span> ${
          sale.customerphone || "N/A"
        }</div>
        <div><span class="label">Cashier:</span> ${sale.cashier || "N/A"}</div>
        <div><span class="label">Invoice #:</span> ${sale._id}</div>
        <hr />
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right;">U.Price</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(sale.products || [])
              .map(
                (p) => `
              <tr>
                <td>${p.name}</td>
                <td style="text-align:right;">${p.price?.toFixed(2)}</td>
                <td style="text-align:center;">${p.quantity || 1}</td>
                <td style="text-align:right;">${(
                  p.totalPrice || p.price * (p.quantity || 1)
                ).toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <hr />
        <div class="totals">
          <p><span>Discount:</span><span>Rs ${(sale.discount || 0).toFixed(
            2
          )}</span></p>
          <p><span class="label">Grand Total:</span><span><strong>Rs ${sale.grandTotal.toFixed(
            2
          )}</strong></span></p>
          <p><span>Paid:</span><span>Rs ${sale.paid.toFixed(2)}</span></p>
          <p><span>Return:</span><span>Rs ${(
            sale.paid - sale.grandTotal
          ).toFixed(2)}</span></p>
        </div>
        <hr />
        <div class="footer">
          <p>Thank you for shopping. Come Again!</p>
          <p>www.lwizsol.com</p>
          <p>Exchange within 7 days with receipt</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
  </html>
  `;

    const newTab = window.open("", "_blank");
    newTab.document.write(htmlContent);
    newTab.document.close();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Sale Details", 14, 16);

    autoTable(doc, {
      startY: 25,
      head: [["Field", "Value"]],
      body: [
        ["Customer", selectedSale.customer],
        ["Phone", selectedSale.customerphone || "N/A"],
        ["Warehouse", selectedSale.warehouse],
        ["Status", selectedSale.status],
        ["Payment Status", selectedSale.paymentStatus],
        ["Payment Type", selectedSale.paymentType],
        ["Discount", `Rs ${selectedSale.discount || 0}`],
        ["Grand Total", `Rs ${selectedSale.grandTotal}`],
        ["Paid", `Rs ${selectedSale.paid}`],
        ["Created At", new Date(selectedSale.createdAt).toLocaleString()],
        ["Cashier", selectedSale.cashier || "N/A"],
      ],
    });

    doc.text("Products", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Code", "Name", "Quantity", "Unit Price", "Total"]],
      body: (selectedSale.products || []).map((p) => [
        p.code,
        p.name,
        p.quantity || 1,
        `Rs ${p.price}`,
        `Rs ${p.totalPrice || p.price * (p.quantity || 1)}`,
      ]),
    });

    doc.save(`sale_${selectedSale._id}.pdf`);
  };

  const filteredSales = sales.filter(
    (sale) =>
      sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerphone && sale.customerphone.includes(searchTerm))
  );

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-4xl mx-auto overflow-hidden">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Sales Management
      </h1>

      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
          {editId ? "Update Sale" : "Create New Sale"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Search and Selection */}
          <div className="col-span-2">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Add Products (Scan barcode or search below)
            </label>
            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search products by name or code"
              />
              {productSearch && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                        onClick={() => handleAddProduct(product)}
                      >
                        <span>
                          {product.name} ({product.code}) - Rs {product.price}
                          {product.discount
                            ? ` (Discount: Rs ${product.discount})`
                            : ""}
                        </span>
                        <span className="text-green-600">+ Add</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500">No products found</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Products */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Selected Products ({selectedProducts.length})
              </h3>
              {selectedProducts.length > 0 ? (
                <div className="border rounded-md divide-y">
                  {selectedProducts.map((product) => (
                    <div
                      key={product._id}
                      className="p-2 flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <div>
                          {product.name} ({product.code}) - Rs {product.price}
                          {product.discount
                            ? ` (Discount: Rs ${product.discount})`
                            : ""}
                        </div>
                        <div className="flex items-center mt-1">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                product._id,
                                product.quantity - 1
                              )
                            }
                            className="bg-gray-200 px-2 py-1 rounded-l"
                            disabled={product.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="bg-gray-100 px-4 py-1">
                            {product.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                product._id,
                                product.quantity + 1
                              )
                            }
                            className="bg-gray-200 px-2 py-1 rounded-r"
                          >
                            +
                          </button>
                          <span className="ml-4 font-medium">
                            Total: Rs{" "}
                            {product.totalPrice ||
                              product.price * product.quantity}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveProduct(product._id)}
                        className="text-red-500 hover:text-red-700 ml-4"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No products selected</p>
              )}
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Customer Name
            </label>
            <input
              type="text"
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Customer name"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Customer Phone
            </label>
            <input
              type="text"
              value={form.customerphone}
              onChange={(e) =>
                setForm({ ...form, customerphone: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Phone number"
            />
          </div>

          {/* Warehouse */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Warehouse
            </label>
            <input
              type="text"
              value={form.warehouse}
              onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Warehouse"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>Pending</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Payment Status
            </label>
            <select
              value={form.paymentStatus}
              onChange={(e) =>
                setForm({ ...form, paymentStatus: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>Paid</option>
              <option>Unpaid</option>
              <option>Partial</option>
            </select>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Payment Type
            </label>
            <select
              value={form.paymentType}
              onChange={(e) =>
                setForm({ ...form, paymentType: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>Cash</option>
              <option>Card</option>
              <option>Bank Transfer</option>
            </select>
          </div>

          {/* Discount */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Discount (Rs)
            </label>
            <input
              type="number"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Cashier */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Cashier
            </label>
            <input
              type="text"
              value={form.cashier}
              readOnly
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Cashier email"
            />
          </div>

          {/* Grand Total */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Grand Total (Rs)
            </label>
            <input
              type="number"
              value={form.grandTotal}
              readOnly
              className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-50"
            />
          </div>

          {/* Paid */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Paid (Rs)
            </label>
            <input
              type="number"
              value={form.paid}
              onChange={(e) => setForm({ ...form, paid: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div className="md:col-span-2 flex justify-end space-x-3 pt-2">
            {editId && (
              <button
                onClick={resetForm}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={selectedProducts.length === 0}
              className={`px-6 py-2 rounded-md text-white ${
                editId
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition-colors ${
                selectedProducts.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {editId ? "Update Sale" : "Create Sale"}
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2 md:mb-0">
            Sales Records
          </h2>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            onClick={() => navigate("/sales-return")}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md text-white transition-colors"
          >
            Return Sale
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {s.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {s.customerphone || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {s.warehouse}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1">
                      {(s.products || []).slice(0, 3).map((p, idx) => (
                        <span
                          key={p.productId || idx}
                          className="bg-gray-100 px-2 py-1 rounded text-xs"
                        >
                          {p.name} (x{p.quantity || 1})
                        </span>
                      ))}
                      {s.products?.length > 3 && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          +{s.products.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        s.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : s.status === "Cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rs {s.grandTotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rs {s.paid.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {s.paymentType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(s)}
                      className="text-gray-600 hover:text-blue-900 mr-3"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td
                    colSpan="10"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No sales records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedSale && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-xl w-80 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Sale Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleEdit(selectedSale)}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md flex items-center"
              >
                <svg
                  className="h-5 w-5 mr-2 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>
              <button
                onClick={() => handleDelete(selectedSale._id)}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md flex items-center text-red-600"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
              <button
                onClick={handleView}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md flex items-center"
              >
                <svg
                  className="h-5 w-5 mr-2 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                View Details
              </button>
              <button
                onClick={handleDownloadPDF}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md flex items-center"
              >
                <svg
                  className="h-5 w-5 mr-2 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download PDF
              </button>
            </div>

            <button
              onClick={() => handlePrintReceipt(selectedSale)}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md flex items-center"
            >
              🖨️ Print Receipt
            </button>

            <button
              onClick={closeModal}
              className="mt-4 w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Sale Details</h2>
              <button
                onClick={() => setViewData(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Customer:</span>
                  <span className="text-gray-800">{viewData.customer}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Phone:</span>
                  <span className="text-gray-800">
                    {viewData.customerphone || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Warehouse:</span>
                  <span className="text-gray-800">{viewData.warehouse}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Status:</span>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      viewData.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : viewData.status === "Cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {viewData.status}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">
                    Payment Status:
                  </span>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      viewData.paymentStatus === "Paid"
                        ? "bg-green-100 text-green-800"
                        : viewData.paymentStatus === "Partial"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {viewData.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">
                    Payment Type:
                  </span>
                  <span className="text-gray-800">{viewData.paymentType}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Discount:</span>
                  <span className="text-gray-800">
                    Rs {viewData.discount || 0}
                  </span>
                </div>
                <div className="flex justify-between w-full border-b pb-2">
                  <span className="font-medium text-gray-600">
                    Grand Total:
                  </span>
                  <span className="text-gray-800 font-medium">
                    Rs {viewData.grandTotal}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">
                    Paid Amount:
                  </span>
                  <span className="text-gray-800">Rs {viewData.paid}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-medium text-gray-600">Created At:</span>
                  <span className="text-gray-800">
                    {new Date(viewData.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-3">Products</h3>
                <div className="border rounded divide-y max-h-96 overflow-auto">
                  {(viewData.products || []).map((product) => (
                    <div key={product.productId} className="p-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{product.name}</span>
                        <span>Rs {product.price}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Code: {product.code} | Qty: {product.quantity || 1} |
                        Total: Rs{" "}
                        {product.totalPrice ||
                          product.price * (product.quantity || 1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
