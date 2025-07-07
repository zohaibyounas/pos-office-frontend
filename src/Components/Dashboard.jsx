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
  FaMoneyCheckAlt,
  FaCashRegister,
  FaMinusCircle,
  FaChartLine,
  FaPercentage,
} from "react-icons/fa";

const Dashboard = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalPurchaseReturns, setTotalPurchaseReturns] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [todayPurchases, setTodayPurchases] = useState(0);
  const [totalRefund, setTotalRefund] = useState(0);
  const [barData, setBarData] = useState([]);

  // New profit metrics
  const [totalProfit, setTotalProfit] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [averageProfitMargin, setAverageProfitMargin] = useState(0);
  const [profitTrendData, setProfitTrendData] = useState([]);

  useEffect(() => {
    fetchTotals();
  }, []);

  const fetchTotals = async () => {
    try {
      const salesRes = await axios.get("http://localhost:5000/api/sales");
      const purchasesRes = await axios.get(
        "http://localhost:5000/api/purchases"
      );
      const purchaseReturnsRes = await axios.get(
        "http://localhost:5000/api/purchase-returns"
      );

      const salesData = salesRes.data;
      const purchasesData = purchasesRes.data;
      const purchaseReturnsData = purchaseReturnsRes.data;

      // Calculate profit metrics
      const profitData = salesData.reduce(
        (acc, sale) => {
          acc.totalProfit += sale.netProfit || sale.totalProfit || 0;
          acc.totalSales += (sale.grandTotal || 0) - (sale.refundAmount || 0);
          return acc;
        },
        { totalProfit: 0, totalSales: 0 }
      );

      setTotalProfit(profitData.totalProfit);
      setTotalSales(profitData.totalSales);
      setAverageProfitMargin(
        profitData.totalSales > 0
          ? (profitData.totalProfit / profitData.totalSales) * 100
          : 0
      );

      // Today's calculations
      const today = new Date().toISOString().split("T")[0];
      const todayData = salesData
        .filter(
          (s) => s.date?.startsWith(today) || s.createdAt?.startsWith(today)
        )
        .reduce(
          (acc, sale) => {
            acc.todayProfit += sale.netProfit || sale.totalProfit || 0;
            acc.todaySales += (sale.grandTotal || 0) - (sale.refundAmount || 0);
            return acc;
          },
          { todayProfit: 0, todaySales: 0 }
        );

      setTodaySales(todayData.todaySales);
      setTodayProfit(todayData.todayProfit);

      // Other existing calculations
      const totalRefundSum = salesData.reduce(
        (sum, s) => sum + (s.refundAmount || 0),
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

      // Enhanced chart data with profit
      const groupedByDate = {};

      salesData.forEach((sale) => {
        const date = sale.createdAt?.split("T")[0];
        if (!groupedByDate[date]) {
          groupedByDate[date] = {
            date,
            Sales: 0,
            Purchases: 0,
            Refunds: 0,
            Profit: 0,
            PurchaseReturns: 0,
          };
        }
        groupedByDate[date].Sales +=
          (sale.grandTotal || 0) - (sale.refundAmount || 0);
        groupedByDate[date].Refunds += sale.refundAmount || 0;
        groupedByDate[date].Profit += sale.netProfit || sale.totalProfit || 0;
      });

      purchasesData.forEach((purchase) => {
        const date = purchase.createdAt?.split("T")[0];
        if (!groupedByDate[date]) {
          groupedByDate[date] = {
            date,
            Sales: 0,
            Purchases: 0,
            Refunds: 0,
            Profit: 0,
            PurchaseReturns: 0,
          };
        }
        groupedByDate[date].Purchases += purchase.grandTotal || 0;
      });

      purchaseReturnsData.forEach((ret) => {
        const date = ret.createdAt?.split("T")[0];
        if (!groupedByDate[date]) {
          groupedByDate[date] = {
            date,
            Sales: 0,
            Purchases: 0,
            Refunds: 0,
            Profit: 0,
            PurchaseReturns: 0,
          };
        }
        groupedByDate[date].PurchaseReturns += ret.total || 0;
      });

      const chartData = Object.values(groupedByDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7);

      setBarData(chartData);

      // Profit trend data for line chart
      const profitTrend = Object.values(groupedByDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((item) => ({
          date: item.date,
          Profit: item.Profit,
        }));
      setProfitTrendData(profitTrend.slice(-30)); // Last 30 days
    } catch (err) {
      console.error("Error fetching totals:", err);
    }
  };

  const summaryCards = [
    {
      title: "Total Sales",
      value: `PKR ${totalSales.toLocaleString()}`,
      color: "bg-violet-600",
      icon: <FaMoneyBillWave className="text-3xl" />,
    },
    {
      title: "Total Profit",
      value: `PKR ${totalProfit.toLocaleString()}`,
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
      title: "Total Purchases",
      value: `PKR ${totalPurchases.toLocaleString()}`,
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
    { name: "Gross Profit", value: totalProfit, color: "#16a34a" },
    { name: "Costs", value: totalPurchases - totalProfit, color: "#ef4444" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-4 md:ml-24">
        <div className="md:hidden flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <button className="text-gray-700 text-2xl">
            <FaBars />
          </button>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">
              Last 7 Days: Sales, Purchases & Profit
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Sales" fill="#6366f1" />
                <Bar dataKey="Purchases" fill="#22c55e" />
                <Bar dataKey="Profit" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">Profit Composition</h2>
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
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`PKR ${value.toLocaleString()}`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-2">30-Day Profit Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitTrendData}>
              <XAxis dataKey="date" />
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
