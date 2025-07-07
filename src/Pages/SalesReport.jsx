import { useState } from "react";
import axios from "axios";

const SalesReport = () => {
  const [reportType, setReportType] = useState("sales"); // 'sales' or 'purchases'
  const [data, setData] = useState([]); // sales or purchases
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    customer: "",
    supplier: "",
    paymentType: "",
  });

  const fetchReport = async () => {
    try {
      const url =
        reportType === "sales"
          ? `${import.meta.env.VITE_API_URL}/sales/report`
          : `${import.meta.env.VITE_API_URL}/purchases/report`;

      // Build dynamic filters
      const params =
        reportType === "sales"
          ? {
              startDate: filters.startDate,
              endDate: filters.endDate,
              customer: filters.customer,
              paymentType: filters.paymentType,
            }
          : {
              startDate: filters.startDate,
              endDate: filters.endDate,
              supplier: filters.supplier,
              paymentType: filters.paymentType,
            };

      const res = await axios.get(url, { params });

      setData(reportType === "sales" ? res.data.sales : res.data.purchases);
      setSummary(res.data.summary);
    } catch (err) {
      console.error("Error fetching report:", err);
    }
  };

  return (
    <div className="p-6">
      {/* Toggle Buttons */}
      <div className="mb-4 flex space-x-4">
        <button
          className={`px-4 py-2 rounded ${
            reportType === "sales" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setReportType("sales")}
        >
          Sales Report
        </button>
        <button
          className={`px-4 py-2 rounded ${
            reportType === "purchases"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => setReportType("purchases")}
        >
          Purchases Report
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters({ ...filters, startDate: e.target.value })
          }
          className="border px-3 py-2 rounded"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="border px-3 py-2 rounded"
        />
        {reportType === "sales" ? (
          <input
            type="text"
            placeholder="Customer"
            value={filters.customer}
            onChange={(e) =>
              setFilters({ ...filters, customer: e.target.value })
            }
            className="border px-3 py-2 rounded"
          />
        ) : (
          <input
            type="text"
            placeholder="Supplier"
            value={filters.supplier}
            onChange={(e) =>
              setFilters({ ...filters, supplier: e.target.value })
            }
            className="border px-3 py-2 rounded"
          />
        )}
        <select
          value={filters.paymentType}
          onChange={(e) =>
            setFilters({ ...filters, paymentType: e.target.value })
          }
          className="border px-3 py-2 rounded"
        >
          <option value="">All Types</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Online">Online</option>
        </select>
        <button
          onClick={fetchReport}
          disabled={!filters.startDate || !filters.endDate}
          className={`px-4 py-2 rounded col-span-1 md:col-span-4 ${
            !filters.startDate || !filters.endDate
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white"
          }`}
        >
          Filter Report
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 shadow rounded">
          <h4 className="font-semibold text-sm text-gray-500">
            Total {reportType === "sales" ? "Sales" : "Purchases"}
          </h4>
          <p className="text-lg font-bold">
            Rs{" "}
            {summary.totalSales?.toLocaleString() ||
              summary.totalPurchases?.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 shadow rounded">
          <h4 className="font-semibold text-sm text-gray-500">Total Paid</h4>
          <p className="text-lg font-bold">
            Rs {summary.totalPaid?.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 shadow rounded">
          <h4 className="font-semibold text-sm text-gray-500">
            Total Discount
          </h4>
          <p className="text-lg font-bold">
            Rs {summary.totalDiscount?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {reportType === "sales" ? (
                <>
                  <th className="px-6 py-2">Customer</th>
                  <th className="px-6 py-2">Warehouse</th>
                </>
              ) : (
                <th className="px-6 py-2">Supplier</th>
              )}
              <th className="px-6 py-2">Date</th>
              <th className="px-6 py-2">Total</th>
              <th className="px-6 py-2">Paid</th>
              <th className="px-6 py-2">Discount</th>
              <th className="px-6 py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry._id} className="hover:bg-gray-100">
                {reportType === "sales" ? (
                  <>
                    <td className="px-6 py-2">{entry.customer}</td>
                    <td className="px-6 py-2">{entry.warehouse}</td>
                  </>
                ) : (
                  <td className="px-6 py-2">{entry.supplier}</td>
                )}
                <td className="px-6 py-2">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-2">
                  Rs {entry.grandTotal?.toLocaleString()}
                </td>
                <td className="px-6 py-2">Rs {entry.paid?.toLocaleString()}</td>
                <td className="px-6 py-2">
                  Rs {entry.discount?.toLocaleString()}
                </td>
                <td className="px-6 py-2">{entry.paymentType}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-4">
            No data found
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
