import React from "react";
import { useNavigate } from "react-router-dom";
import BuySalePopup from "../components/BuySalePopup";

const DynamicWatchlist = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <BuySalePopup isOpen={true} onClose={() => navigate("/dashboard")} />
    </div>
  );
};

export default DynamicWatchlist;
