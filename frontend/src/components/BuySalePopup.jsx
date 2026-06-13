import React from "react";

const BuySalePopup = ({ isOpen, onClose, buyList = [], saleList = [], loading }) => {
  if (!isOpen) return null;

  return (
    // মডালের বাইরের অংশ
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      
      {/* মডাল কন্টেইনার */}
      <div 
        className="relative w-full max-w-4xl bg-gray-950 border-2 border-gray-800 rounded-2xl p-8 text-white min-h-[75vh] max-h-[90vh] flex flex-col justify-between gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* টপ-রাইট কর্নারের ছোট ক্রস বাটন */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-xl font-bold"
        >
          ✕
        </button>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2">
            <span className="w-6 h-6 border-2 border-emerald-500 border-r-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Loading data...</p>
          </div>
        ) : (
          <>
            {/* ছবির (image_efbed9.png) অনুযায়ী দুই ভাগের মেইন গ্রিড */}
            <div className="grid grid-cols-2 divide-x-2 divide-gray-800 flex-1">
              
              {/* LEFT SIDE: BUY */}
              <div className="pr-6 flex flex-col">
                <h2 className="text-3xl font-extrabold text-emerald-400 font-mono tracking-wider mb-4 pb-2 border-b-2 border-gray-800">
                  Buy
                </h2>
                
                <div className="flex-1 overflow-y-auto max-h-[45vh] pr-2">
                  {buyList.length === 0 ? (
                    <p className="text-sm text-gray-600 italic pl-4">No assets listed</p>
                  ) : (
                    <ul className="space-y-3 pl-4 list-disc marker:text-emerald-500">
                      {buyList.map((company, index) => (
                        <li 
                          key={company._id || index}
                          className="font-mono text-lg font-bold text-gray-300 tracking-wide hover:text-white transition-colors"
                        >
                          {company.companyName || company.name || company.symbol}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE: SALE */}
              <div className="pl-6 flex flex-col">
                <h2 className="text-3xl font-extrabold text-rose-400 font-mono tracking-wider mb-4 pb-2 border-b-2 border-gray-800">
                  Sale
                </h2>
                
                <div className="flex-1 overflow-y-auto max-h-[45vh] pr-2">
                  {saleList.length === 0 ? (
                    <p className="text-sm text-gray-600 italic pl-4">No assets listed</p>
                  ) : (
                    <ul className="space-y-3 pl-4 list-disc marker:text-rose-500">
                      {saleList.map((company, index) => (
                        <li 
                          key={company._id || index}
                          className="font-mono text-lg font-bold text-gray-300 tracking-wide hover:text-white transition-colors"
                        >
                          {company.companyName || company.name || company.symbol}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

            </div>

            {/* ✅ BOTTOM BUTTON SECTION */}
            <div className="flex justify-center pt-2 border-t border-gray-900">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-200 hover:text-white font-mono text-xl font-bold rounded-2xl transition-all duration-200 tracking-wide active:scale-98 shadow-md"
              >
                I Understand
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default BuySalePopup;