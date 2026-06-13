import React from "react";

const BuySalePopup = ({ isOpen, onClose }) => {
  // পপআপ যদি খোলা না থাকে তবে কিছুই রেন্ডার করবে না
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      
      {/* মডাল কন্টেইনার */}
      <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* হেডার এবং ক্লোজ বোতাম */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-gray-950">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📊</span> Quick Order Terminal
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-1.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* মডাল বডি (দুইটি সেকশন) */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 overflow-y-auto">
          
          {/* BUY SECTION */}
          <div className="p-6 bg-emerald-950/20 hover:bg-emerald-950/30 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🛒</span>
              <h3 className="text-lg font-bold text-emerald-400 uppercase tracking-wider">Buy Section</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Company Name</label>
                <input type="text" placeholder="e.g. GP, SQURPHARMA" className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Quantity</label>
                  <input type="number" placeholder="0" className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Buy Price</label>
                  <input type="number" placeholder="0.00" className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-lg shadow-emerald-900/40 transition-colors mt-2">
                Place Buy Order
              </button>
            </div>
          </div>

          {/* SALE SECTION */}
          <div className="p-6 bg-rose-950/20 hover:bg-rose-950/30 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏷️</span>
              <h3 className="text-lg font-bold text-rose-400 uppercase tracking-wider">Sale Section</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Company Name</label>
                <input type="text" placeholder="e.g. GP, SQURPHARMA" className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Quantity</label>
                  <input type="number" placeholder="0" className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Sale Price</label>
                  <input type="number" placeholder="0.00" className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-rose-500" />
                </div>
              </div>
              <button className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded shadow-lg shadow-rose-900/40 transition-colors mt-2">
                Place Sale Order
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BuySalePopup;