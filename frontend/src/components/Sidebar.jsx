import React from "react";
import { FiChevronLeft } from "react-icons/fi";

const Sidebar = ({
  isOpen = true,
  onToggle,
  menuItems = [],
  logout,
  logoutLoading,
  loadingRoute,
  handleNavigate,
}) => {
  return (
    <div
      className={`relative h-screen flex flex-col bg-gray-950 border-gray-800 md:border-r transition-all duration-300 overflow-visible ${
        isOpen ? "w-60 p-5" : "w-14 p-2"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 ${
          isOpen ? "mb-6" : "justify-center"
        }`}
      >
        <div className="text-xl">📊</div>

        {isOpen && (
          <div>
            <h1 className="text-xl font-bold mb-1 text-white">Dashboard</h1>
            <p className="text-sm text-gray-400">
              Quick navigation for all sections.
            </p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const isActive = loadingRoute === item.route;

          return (
            <button
              key={item.route}
              type="button"
              onClick={() => handleNavigate(item.route)}
              disabled={isActive}
              className={`w-full flex items-center gap-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-gray-900 text-gray-200 hover:bg-gray-800"
              } ${isOpen ? "px-4 py-3" : "justify-center py-3"}`}
            >
              <span className="text-lg">{item.icon}</span>

              {isOpen && (
                <span className="truncate text-sm font-medium">
                  {item.title}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto">
        <button
          onClick={logout}
          disabled={logoutLoading}
          className={`w-full rounded-2xl text-sm font-medium transition-all duration-200 disabled:opacity-60 ${
            isOpen
              ? "mt-4 bg-red-600 hover:bg-red-700 px-3 py-3"
              : "bg-red-600 hover:bg-red-700 p-2"
          }`}
        >
          {logoutLoading ? "..." : isOpen ? "Logout" : "⏻"}
        </button>
      </div>

      {/* Toggle Button */}
      <div
        onClick={onToggle}
        className={`absolute top-1/2 right-0 z-20 flex h-12 w-6 -translate-y-1/2 translate-x-1/2 cursor-pointer items-center justify-center rounded-l-full
        bg-blue-500/80 backdrop-blur-md border border-white/20 text-white shadow-lg
        hover:bg-blue-500 transition-all duration-200 ${
          isOpen ? "rotate-180" : ""
        }`}
      >
        <FiChevronLeft size={80} />
      </div>
    </div>
  );
};

export default Sidebar;