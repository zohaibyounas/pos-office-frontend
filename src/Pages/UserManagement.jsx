import { useEffect, useState } from "react";
import axios from "axios";
import { Pencil, Trash2 } from "lucide-react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [sales, setSales] = useState([]);
  const [commissions, setCommissions] = useState({});
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "user",
    phone: "",
    cnic: "",
    monthlySalary: 0,
    commissionEnabled: true,
    commissionRate: 2.5,
  });
  const [editUserId, setEditUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchSales();
  }, []);

  const fetchUsers = () => {
    axios.get(`${import.meta.env.VITE_API_URL}/users`).then((res) => {
      setUsers(res.data);
    });
  };

  const fetchSales = () => {
    axios.get(`${import.meta.env.VITE_API_URL}/sales`).then((res) => {
      const saleData = res.data || [];
      setSales(saleData);
    });
  };

  useEffect(() => {
    if (users.length && sales.length) {
      calculateCommissions(users, sales);
    }
  }, [users, sales]);

  const calculateCommissions = (usersData, salesData) => {
    const map = {};

    salesData.forEach((sale) => {
      const cashierEmail = sale.cashier;
      const amount = sale.grandTotal || 0;
      if (!map[cashierEmail]) {
        map[cashierEmail] = 0;
      }
      map[cashierEmail] += amount;
    });

    const final = {};
    Object.entries(map).forEach(([cashierEmail, total]) => {
      const user = usersData.find((u) => u.email === cashierEmail);
      if (user && user.commissionEnabled) {
        const rate = user.commissionRate || 0;
        const commissionAmount = (total * rate) / 100;
        const salary = user.monthlySalary || 0;

        final[cashierEmail] = {
          email: user.email,
          totalSales: total,
          baseSalary: salary,
          commission: commissionAmount.toFixed(2),
          totalPayable: (salary + commissionAmount).toFixed(2),
        };
      }
    });

    setCommissions(final);
  };

  const handleAddOrUpdateUser = async () => {
    if (!form.email || !form.password)
      return alert("Email & password are required");

    if (editUserId) {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/users/${editUserId}`,
        form
      );
      setEditUserId(null);
    } else {
      await axios.post(`${import.meta.env.VITE_API_URL}/users`, form);
    }

    setForm({
      email: "",
      password: "",
      role: "user",
      phone: "",
      cnic: "",
      monthlySalary: 0,
      commissionEnabled: true,
      commissionRate: 2.5,
    });

    fetchUsers();
  };

  const handleEdit = (user) => {
    setEditUserId(user._id);
    setForm({
      email: user.email,
      password: user.password,
      role: user.role,
      phone: user.phone || "",
      cnic: user.cnic || "",
      monthlySalary: user.monthlySalary || 0,
      commissionEnabled: user.commissionEnabled ?? true,
      commissionRate: user.commissionRate || 2.5,
    });
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await axios.delete(`${import.meta.env.VITE_API_URL}/users/${id}`);
      fetchUsers();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-10">
        User Management
      </h1>

      {/* Form */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-10">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">
          {editUserId ? "Update User" : "Add New User"}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 text-sm border rounded-md"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 text-sm border rounded-md"
              placeholder="Enter password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2 text-sm border rounded-md"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2 text-sm border rounded-md"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              CNIC
            </label>
            <input
              type="text"
              value={form.cnic}
              onChange={(e) => setForm({ ...form, cnic: e.target.value })}
              className="w-full px-4 py-2 text-sm border rounded-md"
              placeholder="Enter CNIC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Monthly Salary
            </label>
            <input
              type="number"
              value={form.monthlySalary}
              onChange={(e) =>
                setForm({
                  ...form,
                  monthlySalary: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 text-sm border rounded-md"
              placeholder="Enter salary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Commission Enabled
            </label>
            <select
              value={form.commissionEnabled}
              onChange={(e) =>
                setForm({
                  ...form,
                  commissionEnabled: e.target.value === "true",
                })
              }
              className="w-full px-4 py-2 text-sm border rounded-md"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Commission Rate (%)
            </label>
            <input
              type="number"
              value={form.commissionRate}
              onChange={(e) =>
                setForm({
                  ...form,
                  commissionRate: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 text-sm border rounded-md"
              placeholder="e.g. 2.5"
            />
          </div>

          <div className="flex items-end justify-start">
            <button
              onClick={handleAddOrUpdateUser}
              className={`px-6 py-2 rounded-md text-sm font-medium text-white ${
                editUserId
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition`}
            >
              {editUserId ? "Update User" : "Add User"}
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200 mb-10">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-6 py-3 text-center font-semibold">Email</th>
              <th className="px-6 py-3 text-center font-semibold">Role</th>
              <th className="px-6 py-3 text-center font-semibold">Phone</th>
              <th className="px-6 py-3 text-center font-semibold">CNIC</th>
              <th className="px-6 py-3 text-center font-semibold">Salary</th>
              <th className="px-6 py-3 text-center font-semibold">
                Commission
              </th>
              <th className="px-6 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 text-center">
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.role}</td>
                  <td className="px-4 py-2">{user.phone}</td>
                  <td className="px-4 py-2">{user.cnic}</td>
                  <td className="px-4 py-2">{user.monthlySalary}</td>
                  <td className="px-4 py-2">
                    {user.commissionEnabled ? `${user.commissionRate}%` : "No"}
                  </td>
                  <td className="px-6 py-2 space-x-3">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-yellow-500 hover:text-yellow-600"
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Commission Report */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Employee Commission Report (Including Salary)
        </h2>
        <table className="w-full table-auto border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left border-b">Employee Email</th>
              <th className="px-4 py-2 text-right border-b">Base Salary</th>
              <th className="px-4 py-2 text-right border-b">Total Sales</th>
              <th className="px-4 py-2 text-right border-b">Commission</th>
              <th className="px-4 py-2 text-right border-b">Total Payable</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(commissions).length > 0 ? (
              Object.values(commissions).map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{c.email}</td>
                  <td className="px-4 py-2 text-right border-b">
                    Rs {c.baseSalary.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right border-b">
                    Rs {c.totalSales.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right border-b">
                    Rs {c.commission}
                  </td>
                  <td className="px-4 py-2 text-right border-b font-semibold text-green-600">
                    Rs {c.totalPayable}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                  No commission data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
