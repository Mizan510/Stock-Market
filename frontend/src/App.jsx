import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ConfirmProvider } from "./components/ConfirmProvider";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserManager from "./pages/UserManager";
import SaleZone from "./pages/SaleZone";
import Dashboard from "./pages/Dashboard";

import BuyZone from "./pages/BuyZone";
import Investment from "./pages/Investment";
import Buy from "./pages/Buy";
import Sale from "./pages/Sale";
import Dividend from "./pages/Dividend";
import Reports from "./pages/Reports";
import Expense from "./pages/Expense";
import LBSLReport from "./pages/LBSLReport";
import UpdatePrice from "./pages/UpdatePrice";
import DynamicWatchlist from "./pages/DynamicWatchlist";

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
          path="/buy-zone"
          element={
            <ProtectedRoute>
              <BuyZone />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dynamic-watchlist"
          element={
            <ProtectedRoute>
              <DynamicWatchlist />
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

        <Route
          path="/lbsl-report"
          element={
            <ProtectedRoute>
              <LBSLReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sale-zone"
          element={
            <ProtectedRoute>
              <SaleZone />
            </ProtectedRoute>
          }
        />

        <Route path="/update-price" element={<UpdatePrice />} />

        {/* ================= FALLBACK ROUTE ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfirmProvider>
  );
};

export default App;
