import React, { useEffect, useState } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom"; // Imported to handle clean routing redirection

const Sidebar = ({
  isOpen = false,
  onToggle,
  menuItems = [],
  logout,
  logoutLoading,
  loadingRoute,
  handleNavigate,
}) => {
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate(); // Hook initialized to handle programmatic navigation

  useEffect(() => {
    let name = "";
    const authStr = localStorage.getItem("auth");
    if (authStr) {
      try {
        const auth = JSON.parse(authStr);
        name = auth.name || "";
      } catch (e) {
        // ignore
      }
    }

    if (!name) {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length > 1) {
            const payload = JSON.parse(
              atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
            );
            name = payload.name || payload.user || payload.username || "";
          }
        } catch (e) {
          // ignore
        }
      }
    }

    setDisplayName(name);
  }, []);

  return (
    <div
      className={`relative h-screen flex flex-col bg-gray-950 border-gray-800 md:border-r transition-all duration-300 overflow-visible ${
        isOpen ? "w-60 p-5" : "w-14 p-2"
      }`}
    >
      {/* Header */}
      <div
        className={`flex flex-col items-center ${isOpen ? "mb-2" : "justify-center"}`}
      >
        {isOpen ? (
          <div className="w-full text-center">
            {/* Added 🎛️ icon with flex layout alignment */}
            <h1 className="text-xl font-bold mb-1 text-white flex items-center justify-center gap-2">
              🎛️ Dashboard
            </h1>
            <p className="text-sm text-gray-400 truncate">
              {displayName || "Quick navigation for all sections."}
            </p>
          </div>
        ) : (
          /* Small indicator icon when sidebar is collapsed to keep spacing clean */
          <div className="text-xl mb-4 py-1">🎛️</div>
        )}
      </div>

      {/* MIDDLE MENU SECTION: Flex container shifts links into the exact middle of the sidebar layout */}
      <div className="flex-1 flex flex-col justify-center overflow-y-auto no-scrollbar">
        <nav className="space-y-2">
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
                <span className="text-lg shrink-0">{item.icon}</span>

                {isOpen && (
                  <span className="truncate text-sm font-medium">
                    {item.title}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="mt-auto pt-4">
        <button
          onClick={async () => {
            // 1. Instantly collapse the sidebar layout view cleanly
            if (isOpen && typeof onToggle === "function") {
              onToggle();
            }

            try {
              // 2. Run your application's state cleanups (clearing storage, tokens, contexts)
              if (typeof logout === "function") {
                await logout();
              }
            } catch (err) {
              console.error("Logout routing sequence error:", err);
            } finally {
              // 3. Force-route back to login page so the app doesn't freeze on an empty black layout
              navigate("/login", { replace: true });
            }
          }}
          disabled={logoutLoading}
          className={`w-full rounded-2xl text-sm font-medium transition-all duration-200 disabled:opacity-60 ${
            isOpen
              ? "bg-red-600 hover:bg-red-700 px-3 py-3"
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