import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();

  // ❌ Not logged in → redirect
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    // Push fake history entry to trap back button
    window.history.pushState({ page: "protected" }, "", window.location.href);

    const handlePopState = () => {
      const confirmLogout = window.confirm(
        "Do you want to log out?"
      );

      if (confirmLogout) {
        // ✅ logout
        localStorage.removeItem("auth");
        localStorage.removeItem("token");

        navigate("/login", { replace: true });
      } else {
        // ❌ user stays → re-push state so back doesn't exit
        window.history.pushState(
          { page: "protected" },
          "",
          window.location.href
        );

        // keep user on same page
        navigate(location.pathname + location.search, { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, location.pathname, location.search]);

  return children;
};

export default ProtectedRoute;