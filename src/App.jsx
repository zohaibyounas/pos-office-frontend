import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useState } from "react";

import Sidebar from "./Components/Sidebar";
import Dashboard from "./Components/Dashboard";
import Products from "./Pages/Product";
import UserManagement from "./Pages/UserManagement";
import Login from "./Pages/Login";
import Sales from "./Pages/Sales";
import Purchases from "./Pages/Purchases";
import SalesReturn from "./Pages/SalesReturn";
import PurchaseReturn from "./Pages/PurchaseReturn";
import SalesReport from "./Pages/SalesReport";

const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      {!isLoginPage && (
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      )}

      <div className="flex-1">
        {!isLoginPage && (
          <button
            className="md:hidden m-2 p-2 rounded bg-blue-600 text-white"
            onClick={toggleSidebar}
          >
            ☰ Menu
          </button>
        )}

        <div className="p-4">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sale" element={<Sales />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/products/add" element={<Products />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/sales-return" element={<SalesReturn />} />
            <Route path="/purchase-return" element={<PurchaseReturn />} />
            <Route path="/reports" element={<SalesReport />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
