import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Zone from "./pages/Zone";
import Investment from "./pages/Investment";
import Buy from "./pages/Buy";
import Sale from "./pages/Sale";
import Reports from "./pages/Reports";
import Expense from "./pages/Expense";

const App = () => {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PROTECTED */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />

      <Route
        path="/zone"
        element={<ProtectedRoute><Zone /></ProtectedRoute>}
      />

      <Route
        path="/investment"
        element={<ProtectedRoute><Investment /></ProtectedRoute>}
      />

      <Route
        path="/buy"
        element={<ProtectedRoute><Buy /></ProtectedRoute>}
      />

      <Route
        path="/sale"
        element={<ProtectedRoute><Sale /></ProtectedRoute>}
      />

      <Route
        path="/reports"
        element={<ProtectedRoute><Reports /></ProtectedRoute>}
      />

      <Route
        path="/expense"
        element={<ProtectedRoute><Expense /></ProtectedRoute>}
      />
    </Routes>
  );
};

export default App;