import { useEffect, useState } from "react";
import axios from "axios";

const SalesReturn = () => {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnedItems, setReturnedItems] = useState([]);
  const [refundAmount, setRefundAmount] = useState(0);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/sales`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setSales(res.data);
        } else {
          console.error("Sales data is not an array");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch sales:", err.message);
      });
  }, []);

  const handleSaleSelect = (e) => {
    const saleId = e.target.value;
    const sale = sales.find((s) => s._id === saleId);
    setSelectedSale(sale);
    setReturnedItems([]);
    setRefundAmount(0);
  };

  const handleReturnInput = (
    productId,
    productName,
    price,
    quantity,
    index
  ) => {
    const updated = [...returnedItems];
    updated[index] = {
      productId,
      productName,
      quantity: parseInt(quantity) || 0,
      reason: "Customer returned",
      price,
    };
    setReturnedItems(updated);
  };

  const calculateRefund = () => {
    if (!selectedSale || !selectedSale.products) return;

    const totalSaleValue = selectedSale.products.reduce(
      (sum, p) => sum + p.price * (p.quantity || 1),
      0
    );

    const discount = selectedSale.discount || 0;
    const discountRatio = totalSaleValue > 0 ? discount / totalSaleValue : 0;

    const grossReturned = returnedItems.reduce((sum, item) => {
      return item.price && item.quantity
        ? sum + item.price * item.quantity
        : sum;
    }, 0);

    const refund = grossReturned - grossReturned * discountRatio;

    setRefundAmount(refund.toFixed(2));
  };

  const printReceipt = () => {
    const html = `
    <html>
      <head>
        <title>Return Receipt</title>
        <style>
          @media print {
            @page {
              size: 3.5in 4in;
              margin: 0;
            }
          }
          body {
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            margin: 0;
          }
          h2, h4 {
            text-align: center;
            margin: 0;
          }
          .center {
            text-align: center;
            margin-top: 4px;
          }
          hr {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          table {
            width: 100%;
            margin-top: 6px;
            border-collapse: collapse;
          }
          th, td {
            font-size: 11px;
            padding: 2px 0;
            text-align: left;
          }
          th:last-child, td:last-child {
            text-align: right;
          }
          .totals {
            margin-top: 10px;
          }
          .totals p {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
        </style>
      </head>
      <body>
        <h2>Cielo Noir</h2>
        <h4>Plot #60, 15 Bank Rd, Saddar, Rawalpindi</h4>
        <div class="center">03285105601</div>
        <hr />
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Cashier:</strong> ${selectedSale.cashier || "N/A"}</p>
        <p><strong>Invoice:</strong> ${selectedSale._id}</p>
        <hr />
        <strong>Returned Items:</strong>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${returnedItems
              .filter((i) => i.quantity > 0)
              .map(
                (item) => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <hr />
        <div class="totals">
          <p><span>Discount Applied:</span> <span>Rs ${
            selectedSale.discount || 0
          }</span></p>
          <p><strong><span>Refund Amount:</span> <span>Rs ${refundAmount}</span></strong></p>
        </div>
        <hr />
        <div class="center">Thank you. Please visit again!</div>
        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
    `;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  const handleSubmit = async () => {
    if (!selectedSale || returnedItems.length === 0) {
      alert("Please select a sale and enter returned items");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/sales/${selectedSale._id}/return`,
        {
          returnedItems,
          refundAmount,
        }
      );
      printReceipt();
      alert("Return processed successfully!");
      setSelectedSale(null);
      setReturnedItems([]);
      setRefundAmount(0);
    } catch (err) {
      alert("Error processing return");
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow-xl rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">
        Sales Return
      </h1>

      {sales.length > 0 ? (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Sale
          </label>
          <select
            onChange={handleSaleSelect}
            defaultValue=""
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select a sale
            </option>
            {sales.map((sale) => (
              <option key={sale._id} value={sale._id}>
                {sale.reference || sale._id} - {sale.customer}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-gray-500">Loading sales or no sales found.</p>
      )}

      {selectedSale && (
        <>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Sale Items
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Product Name</th>
                  <th className="border px-4 py-2">Price (Rs)</th>
                  <th className="border px-4 py-2">Sold Qty</th>
                  <th className="border px-4 py-2">Return Qty</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.products.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{item.name}</td>
                    <td className="border px-4 py-2">{item.price}</td>
                    <td className="border px-4 py-2">{item.quantity || 1}</td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        max={item.quantity || 1}
                        placeholder="0"
                        className="w-20 px-2 py-1 border rounded"
                        onChange={(e) =>
                          handleReturnInput(
                            item.productId,
                            item.name,
                            item.price,
                            e.target.value,
                            idx
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6">
            <button
              onClick={calculateRefund}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition"
            >
              Calculate Refund
            </button>

            <div>
              <p className="text-lg font-medium text-gray-700">
                Refund Amount: Rs {refundAmount}
              </p>
              <p className="text-sm text-gray-500">
                Original Discount: Rs {selectedSale.discount || 0}
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={refundAmount === 0}
            className={`mt-6 w-full sm:w-auto px-6 py-2 rounded-md text-white transition ${
              refundAmount === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Submit Return & Print Receipt
          </button>
        </>
      )}
    </div>
  );
};

export default SalesReturn;
