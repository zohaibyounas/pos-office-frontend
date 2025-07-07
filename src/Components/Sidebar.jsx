import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaShoppingCart,
  FaCashRegister,
  FaMoneyBillWave,
  FaUsers,
  FaUserShield,
  FaWarehouse,
  FaChartBar,
  FaGlobe,
  FaCog,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import ProfileBar from "./ProfileBar";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [peopleMenuOpen, setPeopleMenuOpen] = useState(false);
  const [role, setRole] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setRole(user?.role || "");
  }, []);

  const allMenuItems = [
    {
      name: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/dashboard",
      roles: ["admin"],
    },
    {
      name: "Purchases",
      icon: <FaShoppingCart />,
      path: "/purchases",
      roles: ["admin", "cashier", "user"],
    },
    {
      name: "Sales",
      icon: <FaCashRegister />,
      path: "/sale",
      roles: ["admin", "cashier", "user"],
    },
    {
      name: "Expenses",
      icon: <FaMoneyBillWave />,
      path: "/expenses",
      roles: ["admin"],
    },
    {
      name: "Reports",
      icon: <FaChartBar />,
      path: "/reports",
      roles: ["admin"],
    },
    { name: "Settings", icon: <FaCog />, path: "/settings", roles: ["admin"] },
  ];

  const filteredMenuItems = allMenuItems.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black bg-opacity-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed z-40 top-0 left-0 h-full w-64 bg-white shadow-lg border-r transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:h-auto`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">POS</h1>
          <button className="md:hidden text-xl" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <nav className="flex-1 overflow-y-auto px-2 space-y-1 pb-6">
          {/* Products submenu (admin only) */}
          {role === "admin" && (
            <>
              <div
                className="text-gray-700 px-3 py-2 hover:bg-blue-100 rounded-md cursor-pointer flex items-center justify-between"
                onClick={() => setProductMenuOpen(!productMenuOpen)}
              >
                <div className="flex items-center gap-3">
                  <FaBoxOpen />
                  <span className="text-sm font-medium">Products</span>
                </div>
                <span>{productMenuOpen ? "−" : "+"}</span>
              </div>
              {productMenuOpen && (
                <div className="ml-8 space-y-1 text-gray-600">
                  <Link
                    to="/products/add"
                    className="flex items-center gap-2 hover:text-blue-600 text-sm"
                  >
                    <FaPlus className="text-xs" />
                    <span>Add Product</span>
                  </Link>
                </div>
              )}
            </>
          )}

          {/* People submenu (admin only) */}
          {role === "admin" && (
            <>
              <div
                className="text-gray-700 px-3 py-2 hover:bg-blue-100 rounded-md cursor-pointer flex items-center justify-between"
                onClick={() => setPeopleMenuOpen(!peopleMenuOpen)}
              >
                <div className="flex items-center gap-3">
                  <FaUsers />
                  <span className="text-sm font-medium">People</span>
                </div>
                <span>{peopleMenuOpen ? "−" : "+"}</span>
              </div>
              {peopleMenuOpen && (
                <div className="ml-8 space-y-1 text-gray-600">
                  <Link
                    to="/users"
                    className="flex items-center gap-2 hover:text-blue-600 text-sm"
                  >
                    <FaUserShield className="text-xs" />
                    <span>Users</span>
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Main Menu Items */}
          {filteredMenuItems.map(({ name, icon, path }) => (
            <Link
              key={name}
              to={path}
              className="flex items-center gap-3 text-gray-700 hover:bg-blue-100 hover:text-blue-600 px-3 py-2 rounded-md transition"
            >
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-medium">{name}</span>
            </Link>
          ))}
        </nav>

        <ProfileBar />
      </aside>
    </>
  );
};

export default Sidebar;
