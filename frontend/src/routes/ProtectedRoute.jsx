import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    const handlePopState = () => {
      // When the user navigates back (popstate), ask whether they want to logout.
      // Do not force logout; if the user cancels, keep them logged in.
      // The browser already performed the navigation, so we just prompt and react accordingly.
      setTimeout(() => {
        try {
          const confirmLogout = window.confirm(
            "Do you want to log out? Click OK to log out, Cancel to stay logged in.",
          );

          if (confirmLogout) {
            localStorage.removeItem("auth");
            localStorage.removeItem("token");
            navigate("/login", { replace: true });
          }
        } catch (err) {
          console.log("popstate handler error:", err);
        }
      }, 100);
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
