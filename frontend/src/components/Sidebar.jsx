import React from "react";

const Sidebar = ({
  menuItems = [],
  logout,
  logoutLoading,
  loadingRoute,
  handleNavigate,
}) => {
  return (
    <div className="w-full md:w-60 bg-gray-950 border-gray-800 md:border-r p-5 space-y-4 md:min-h-screen">
      <div>
        <h1 className="text-xl font-bold mb-4">📊 Dashboard</h1>
        <p className="text-sm text-gray-400">
          Quick navigation for all sections.
        </p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = loadingRoute === item.route;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => handleNavigate(item.route)}
              disabled={isActive}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150 ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-gray-900 text-gray-200 hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              <span className="truncate">{item.title}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={logout}
        disabled={logoutLoading}
        className="w-full mt-6 bg-red-600 hover:bg-red-700 p-3 rounded-2xl text-sm font-medium disabled:opacity-60"
      >
        {logoutLoading ? "Logging out..." : "Logout"}
      </button>
    </div>
  );
};

export default Sidebar;
