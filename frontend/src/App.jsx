import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Investment from "./pages/Investment";
import Buy from "./pages/Buy";
import Sale from "./pages/Sale";
import Reports from "./pages/Reports";
import Expense from "./pages/Expense";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* NEW MODULES */}
        <Route path="/investment" element={<Investment />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/sale" element={<Sale />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/expense" element={<Expense />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;