import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    const handlePopState = () => {
      // When the user navigates back (popstate), prompt whether to force logout.
      // We intentionally do not block the navigation — the browser already moved to the previous entry.
      // After navigation completes, ask user if they want to logout. If yes, clear auth and go to login.
      setTimeout(() => {
        try {
          const confirmLogout = window.confirm(
            "Forcefully logout (clear session) and go to login?",
          );

          if (confirmLogout) {
            localStorage.removeItem("auth");
            localStorage.removeItem("token");
            navigate("/login", { replace: true });
          }
        } catch (err) {
          console.log("popstate handler error:", err);
        }
      }, 50);
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
