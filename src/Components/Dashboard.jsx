import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  FaBars,
  FaShoppingCart,
  FaMoneyBillWave,
  FaUndo,
  FaExchangeAlt,
  FaCalendarDay,
  FaChartLine,
  FaPercentage,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Dashboard = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalPurchaseReturns, setTotalPurchaseReturns] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [todayPurchases, setTodayPurchases] = useState(0);
  const [totalRefund, setTotalRefund] = useState(0);
  const [barData, setBarData] = useState([]);

  // Profit metrics
  const [totalProfit, setTotalProfit] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [averageProfitMargin, setAverageProfitMargin] = useState(0);
  const [profitTrendData, setProfitTrendData] = useState([]);

  // Monthly data state
  const [monthlyTotals, setMonthlyTotals] = useState({
    sales: 0,
    purchases: 0,
    profit: 0,
  });

  // Selected date state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonthData, setSelectedMonthData] = useState({
    sales: 0,
    purchases: 0,
    profit: 0,
  });

  useEffect(() => {
    fetchTotals();
  }, []);

  useEffect(() => {
    if (selectedDate) fetchDataForSelectedMonth();
  }, [selectedDate]);

  const fetchTotals = async () => {
    try {
      const salesRes = await axios.get(`${import.meta.env.VITE_API_URL}/sales`);
      const purchasesRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/purchases`
      );
      const purchaseReturnsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/purchase-returns`
      );

      const salesData = salesRes.data;
      const purchasesData = purchasesRes.data;
      const purchaseReturnsData = purchaseReturnsRes.data;

      /* ---------- current‑month totals ---------- */
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY‑MM
      const monthlyData = {};

      salesData.forEach((sale) => {
        const date = new Date(sale.createdAt || sale.date);
        const monthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (monthYear === currentMonth) {
          monthlyData.sales =
            (monthlyData.sales || 0) +
            ((sale.grandTotal || 0) - (sale.totalRefundAmount || 0));
          const total = sale.grandTotal || 0;
          const refund = sale.totalRefundAmount || 0;
          const profit = sale.netProfit || sale.totalProfit || 0;
          const refundedProfit = total > 0 ? (refund / total) * profit : 0;

          monthlyData.profit =
            (monthlyData.profit || 0) + (profit - refundedProfit);
        }
      });

      purchasesData.forEach((purchase) => {
        const date = new Date(purchase.createdAt || purchase.date);
        const monthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (monthYear === currentMonth) {
          monthlyData.purchases =
            (monthlyData.purchases || 0) + (purchase.grandTotal || 0);
        }
      });

      setMonthlyTotals({
        sales: monthlyData.sales || 0,
        profit: monthlyData.profit || 0,
        purchases: monthlyData.purchases || 0,
      });

      /* ---------- all‑time profit metrics ---------- */
      const profitData = salesData.reduce(
        (acc, sale) => {
          const total = sale.grandTotal || 0;
          const refund = sale.totalRefundAmount || 0;
          const profit = sale.netProfit || sale.totalProfit || 0;
          const refundedProfit = total > 0 ? (refund / total) * profit : 0;

          acc.totalProfit += profit - refundedProfit;
          acc.totalSales += total - refund;
          return acc;
        },
        { totalProfit: 0, totalSales: 0 }
      );

      setTotalProfit(profitData.totalProfit);
      setTotalSales(profitData.totalSales);
      setAverageProfitMargin(
        profitData.totalSales
          ? (profitData.totalProfit / profitData.totalSales) * 100
          : 0
      );

      /* ---------- today’s metrics ---------- */
      const today = new Date().toISOString().split("T")[0];
      const todayData = salesData
        .filter(
          (s) => s.date?.startsWith(today) || s.createdAt?.startsWith(today)
        )
        .reduce(
          (acc, sale) => {
            const total = sale.grandTotal || 0;
            const refund = sale.totalRefundAmount || 0;
            const profit = sale.netProfit || sale.totalProfit || 0;
            const refundedProfit = total > 0 ? (refund / total) * profit : 0;

            acc.todayProfit += profit - refundedProfit;
            acc.todaySales += total - refund;

            return acc;
          },
          { todayProfit: 0, todaySales: 0 }
        );

      setTodaySales(todayData.todaySales);
      setTodayProfit(todayData.todayProfit);

      /* ---------- other aggregate values ---------- */
      const totalRefundSum = salesData.reduce(
        (sum, s) => sum + (s.totalRefundAmount || 0),
        0
      );
      const totalPurchaseReturnSum = purchaseReturnsData.reduce(
        (sum, r) => sum + (r.total || 0),
        0
      );
      const totalPurchasesSum =
        purchasesData.reduce((sum, p) => sum + (p.grandTotal || 0), 0) -
        totalPurchaseReturnSum;

      setTotalRefund(totalRefundSum);
      setTotalPurchaseReturns(totalPurchaseReturnSum);
      setTotalPurchases(totalPurchasesSum);
      setTodayPurchases(
        purchasesData
          .filter(
            (p) => p.date?.startsWith(today) || p.createdAt?.startsWith(today)
          )
          .reduce((sum, p) => sum + (p.grandTotal || 0), 0)
      );

      /* ---------- bar‑chart data (last 6 months) ---------- */
      const monthlyChartData = {};
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

      salesData.forEach((sale) => {
        const date = new Date(sale.createdAt || sale.date);
        if (date < sixMonthsAgo) return;

        const monthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!monthlyChartData[monthYear]) {
          monthlyChartData[monthYear] = {
            month: monthYear,
            Sales: 0,
            Purchases: 0,
            Profit: 0,
          };
        }

        monthlyChartData[monthYear].Sales +=
          (sale.grandTotal || 0) - (sale.totalRefundAmount || 0);
        const total = sale.grandTotal || 0;
        const refund = sale.totalRefundAmount || 0;
        const profit = sale.netProfit || sale.totalProfit || 0;
        const refundedProfit = total > 0 ? (refund / total) * profit : 0;

        monthlyChartData[monthYear].Profit += profit - refundedProfit;
      });

      purchasesData.forEach((purchase) => {
        const date = new Date(purchase.createdAt || purchase.date);
        if (date < sixMonthsAgo) return;

        const monthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!monthlyChartData[monthYear]) {
          monthlyChartData[monthYear] = {
            month: monthYear,
            Sales: 0,
            Purchases: 0,
            Profit: 0,
          };
        }

        monthlyChartData[monthYear].Purchases += purchase.grandTotal || 0;
      });

      setBarData(
        Object.values(monthlyChartData).sort((a, b) =>
          a.month.localeCompare(b.month)
        )
      );

      /* ---------- profit‑trend data ---------- */
      const allMonthlyData = {};

      salesData.forEach((sale) => {
        const date = new Date(sale.createdAt || sale.date);
        const monthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!allMonthlyData[monthYear]) {
          allMonthlyData[monthYear] = { month: monthYear, Profit: 0 };
        }

        allMonthlyData[monthYear].Profit +=
          sale.netProfit || sale.totalProfit || 0;
      });

      setProfitTrendData(
        Object.values(allMonthlyData).sort((a, b) =>
          a.month.localeCompare(b.month)
        )
      );
    } catch (err) {
      console.error("Error fetching totals:", err);
    }
  };

  /* ---------- selected‑month fetch ---------- */
  const fetchDataForSelectedMonth = async () => {
    try {
      const monthYear = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}`;

      const salesRes = await axios.get(`${import.meta.env.VITE_API_URL}/sales`);
      const purchasesRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/purchases`
      );

      const salesData = salesRes.data;
      const purchasesData = purchasesRes.data;

      const selectedMonthTotals = { sales: 0, purchases: 0, profit: 0 };

      salesData.forEach((sale) => {
        const date = new Date(sale.createdAt || sale.date);
        const saleMonthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (saleMonthYear === monthYear) {
          selectedMonthTotals.sales +=
            (sale.grandTotal || 0) - (sale.totalRefundAmount || 0);
          const total = sale.grandTotal || 0;
          const refund = sale.totalRefundAmount || 0;
          const profit = sale.netProfit || sale.totalProfit || 0;
          const refundedProfit = total > 0 ? (refund / total) * profit : 0;

          selectedMonthTotals.profit += profit - refundedProfit;
        }
      });

      purchasesData.forEach((purchase) => {
        const date = new Date(purchase.createdAt || purchase.date);
        const purchaseMonthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (purchaseMonthYear === monthYear) {
          selectedMonthTotals.purchases += purchase.grandTotal || 0;
        }
      });

      setSelectedMonthData(selectedMonthTotals);
    } catch (err) {
      console.error("Error fetching selected month data:", err);
    }
  };

  /* ---------- summary cards config ---------- */
  const summaryCards = [
    {
      title: "Total Sales (Selected Month)",
      value: `PKR ${selectedMonthData.sales.toLocaleString()}`,
      color: "bg-violet-600",
      icon: <FaMoneyBillWave className="text-3xl" />,
    },
    {
      title: "Total Profit (Selected Month)",
      value: `PKR ${selectedMonthData.profit.toLocaleString()}`,
      color: "bg-green-600",
      icon: <FaChartLine className="text-3xl" />,
    },
    {
      title: "Avg Profit Margin",
      value: `${averageProfitMargin.toFixed(2)}%`,
      color: "bg-blue-600",
      icon: <FaPercentage className="text-3xl" />,
    },
    {
      title: "Total Purchases (Selected Month)",
      value: `PKR ${selectedMonthData.purchases.toLocaleString()}`,
      color: "bg-green-500",
      icon: <FaShoppingCart className="text-3xl" />,
    },
    {
      title: "Today Sales",
      value: `PKR ${todaySales.toLocaleString()}`,
      color: "bg-violet-600",
      icon: <FaCalendarDay className="text-3xl" />,
    },
    {
      title: "Today Profit",
      value: `PKR ${todayProfit.toLocaleString()}`,
      color: "bg-teal-600",
      icon: <FaChartLine className="text-3xl" />,
    },
    {
      title: "Sales Returns",
      value: `PKR ${totalRefund.toLocaleString()}`,
      color: "bg-blue-500",
      icon: <FaUndo className="text-3xl" />,
    },
    {
      title: "Purchases Returns",
      value: `PKR ${totalPurchaseReturns.toLocaleString()}`,
      color: "bg-yellow-400",
      icon: <FaExchangeAlt className="text-3xl" />,
    },
  ];

  const pieData = [
    { name: "Gross Profit", value: selectedMonthData.profit, color: "#16a34a" },
    {
      name: "Costs",
      value: selectedMonthData.purchases - selectedMonthData.profit,
      color: "#ef4444",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-4 md:ml-24">
        {/* Month selector */}
        <div className="mb-4 bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-2">Select Month</h2>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className="border rounded p-2 w-full"
          />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {summaryCards.map((card, i) => (
            <div
              key={i}
              className={`${card.color} text-white rounded-xl p-4 flex items-center justify-between shadow`}
            >
              {card.icon}
              <div className="text-right">
                <div className="text-sm">{card.title}</div>
                <div className="text-lg font-semibold">{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Bar chart */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">
              Last 6 Months: Sales, Purchases & Profit
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Sales" fill="#6366f1" />
                <Bar dataKey="Purchases" fill="#22c55e" />
                <Bar dataKey="Profit" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">
              Monthly Profit Composition
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`PKR ${value.toLocaleString()}`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line chart */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-2">Profit Trend (Monthly)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitTrendData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => [
                  `PKR ${value.toLocaleString()}`,
                  "Profit",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Profit"
                stroke="#16a34a"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
