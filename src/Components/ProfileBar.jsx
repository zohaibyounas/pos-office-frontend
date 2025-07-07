import { useNavigate } from "react-router-dom";

const ProfileBar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="bg-white flex-col gap-5 px-6 py-3 flex justify-between items-center mb-4 rounded-lg">
      <div className="text-sm text-gray-600 gap-4">
        <span className="font-medium text-blue-600">Email:</span> {user.email}{" "}
        &nbsp; &nbsp;
        <span className="font-medium text-blue-600 ">Role:</span> {user.role}
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 text-sm"
      >
        Logout
      </button>
    </div>
  );
};

export default ProfileBar;
