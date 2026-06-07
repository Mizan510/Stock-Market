import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useConfirm } from "../components/ConfirmProvider";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();

  // ❌ Not logged in → redirect
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    // Push fake history entry to trap back button
    window.history.pushState({ page: "protected" }, "", window.location.href);

    const handlePopState = async () => {
      try {
        // If user is not on dashboard, navigate them to dashboard
        // and re-push the protected state so the next Back will trigger
        // the logout confirmation from dashboard.
        if (location.pathname !== "/dashboard") {
          navigate("/dashboard");
          // re-push fake state so another Back will trigger popstate again
          window.history.pushState(
            { page: "protected" },
            "",
            window.location.href,
          );
          return;
        }

        // If already on dashboard, ask to logout immediately
        const confirmed = await confirm("Are you sure you want to log out?");
        if (confirmed) {
          localStorage.removeItem("auth");
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        } else {
          // user cancelled → re-push fake state to prevent leaving
          window.history.pushState(
            { page: "protected" },
            "",
            window.location.href,
          );
          navigate(location.pathname + location.search, { replace: true });
        }
      } catch (err) {
        // fallback: re-push state so user doesn't accidentally leave
        window.history.pushState(
          { page: "protected" },
          "",
          window.location.href,
        );
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [confirm, navigate, location.pathname, location.search]);

  return children;
};

export default ProtectedRoute;
