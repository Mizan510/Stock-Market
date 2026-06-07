import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ConfirmProvider } from "./components/ConfirmProvider";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserManager from "./pages/UserManager";
import Dashboard from "./pages/Dashboard";

import Zone from "./pages/Zone";
import Investment from "./pages/Investment";
import Buy from "./pages/Buy";
import Sale from "./pages/Sale";
import Dividend from "./pages/Dividend";
import Reports from "./pages/Reports";
import Expense from "./pages/Expense";

const App = () => {
  return (
    <ConfirmProvider>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user-manager" element={<UserManager />} />

        {/* ================= PROTECTED ROUTES ================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/zone"
          element={
            <ProtectedRoute>
              <Zone />
            </ProtectedRoute>
          }
        />

        <Route
          path="/investment"
          element={
            <ProtectedRoute>
              <Investment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buy"
          element={
            <ProtectedRoute>
              <Buy />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sale"
          element={
            <ProtectedRoute>
              <Sale />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dividend"
          element={
            <ProtectedRoute>
              <Dividend />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expense"
          element={
            <ProtectedRoute>
              <Expense />
            </ProtectedRoute>
          }
        />

        {/* ================= FALLBACK ROUTE ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfirmProvider>
  );
};

export default App;
