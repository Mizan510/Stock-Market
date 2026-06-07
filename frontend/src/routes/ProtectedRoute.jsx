import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();

  // ❌ If not logged in → redirect
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const handlePopState = () => {
      const confirmLogout = window.confirm(
        "Do you want to log out?"
      );

      if (confirmLogout) {
        // ✅ logout user
        localStorage.removeItem("auth");
        localStorage.removeItem("token");

        navigate("/login", { replace: true });
      } else {
        // ✅ user cancelled → keep them stable in current page
        // restore current route to avoid broken navigation state
        navigate(location.pathname + location.search, { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, location.pathname, location.search]);

  // Optional: protect against refresh/close confusion (safe UX)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return children;
};

export default ProtectedRoute;