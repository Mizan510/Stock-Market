import React from "react";

const RulesPopup = ({ onClose }) => {
  return (
    // ব্যাকড্রপ বা সেন্ট্রাল কন্টেইনার (ফিক্সড ও ওভারফ্লো হ্যান্ডেল করা)
    <div className="w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col mx-auto border border-gray-100">
      
      {/* ১. ডিভিডেন্ড ও ট্রেডিং রুলস সেকশন (ওপর-নিচ থেকে পারফেক্টলি চাপানো) */}
      <div className="bg-linear-to-r from-blue-700 via-blue-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
        {/* প্রধান শিরোনাম */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-center text-yellow-300 tracking-wide mb-2 drop-shadow-lg bg-black/50 px-3 py-1.5 rounded-xl">
          ডিভিডেন্ড পাওয়ার পর করণীয়
        </h1>

        {/* ডিভিডেন্ড লিস্ট কার্ড */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-200">
          <ul className="space-y-1.5 text-red-600 text-xs sm:text-sm md:text-base font-bold">
            <li>১. AGM-এ হারাম Investment এর বিষয়ে Mail/Written আপত্তি জানাতে হবে।</li>
            <li>২. AGM-এ হারাম Profit এর বিষয়ে Mail/Written আপত্তি জানাতে হবে।</li>
            <li>৩. প্রাপ্ত Dividend Purify করতে হবে।</li>
            <li>৪. বছর শেষে যাকাত আদায় করতে হবে।</li>
          </ul>
        </div>

        {/* সাব-শিরোনাম */}
        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-center text-white tracking-wide mt-2.5 mb-1">
          Important Trading Rules
        </h2>

        {/* নো ইমোশন ব্লিংকিং বক্স */}
        <div className="mt-1 bg-white border border-white/20 rounded-2xl py-2 px-4 backdrop-blur-md">
          <style>
            {`
              @keyframes blink { 
                0%, 100% { opacity: 1; } 
                50% { opacity: 0.3; } 
              } 
              .blink-text { animation: blink 1.2s ease-in-out infinite; }
            `}
          </style>

          <h3 className="text-red-600 text-xl sm:text-2xl font-extrabold text-center blink-text tracking-wide">
            No Emotion, Only Patience
          </h3>

          <div className="w-16 sm:w-20 h-1 bg-red-400 mx-auto mt-1 rounded-full" />
        </div>
      </div>

      {/* ২. স্ক্রোলযোগ্য নিচের রুলস সেকশন (Scrollable Content) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gray-50/70">
        
        {/* Rule 1 */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base sm:text-lg font-bold text-green-700 mb-2 flex items-center gap-2">
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-xs">01</span>
            Choose Best Company
          </h3>
          <ul className="list-disc ml-5 space-y-1 text-xs sm:text-sm text-gray-600 font-medium">
            <li>Choose Halal Company</li>
            <li>Established Company</li>
            <li>Well Known Company</li>
          </ul>
        </div>

        {/* Rule 2 */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base sm:text-lg font-bold text-green-700 mb-2 flex items-center gap-2">
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-xs">02</span>
            Set Buying & Selling Zone
          </h3>
          <ul className="list-disc ml-5 space-y-2 text-xs sm:text-sm text-gray-600 font-medium">
            <li>
              <span className="text-blue-600 font-bold">Buying Zone:</span> Set 20% of Lowest Share Price of Last 1 Year of Selected Company.
            </li>
            <li>
              <span className="text-orange-600 font-bold">Selling Zone:</span> Set 70% of Highest Share Price of Last 1 Year of Selected Company.
            </li>
          </ul>
        </div>

        {/* Rule 3 */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base sm:text-lg font-bold text-green-700 mb-3 flex items-center gap-2">
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-xs">03</span>
            Dominant Check Before Buy & Sale
          </h3>
          
          <div className="space-y-3">
            {/* Buying Zone */}
            <div className="bg-green-50/60 border border-green-200 rounded-xl p-3">
              <p className="font-bold text-green-700 mb-1.5 text-xs sm:text-sm">
                Buying Zone Check
              </p>
              <ul className="list-disc ml-5 space-y-1 text-xs sm:text-sm text-gray-600">
                <li>
                  If Seller Dominates → <span className="font-bold text-amber-600">Wait for Buy</span> —{" "}
                  <span className="text-red-600 font-medium bg-red-50 px-1 rounded">কারণ দাম আরো কমতে পারে।</span>
                </li>
                <li>
                  If Buyer Dominates or Equal → <span className="font-bold text-green-600">Buy Immediately</span> —{" "}
                  <span className="text-green-700 font-medium bg-green-100 px-1 rounded">কারণ দাম দ্রুত বাড়তে পারে।</span>
                </li>
              </ul>
            </div>

            {/* Selling Zone */}
            <div className="bg-red-50/50 border border-red-200 rounded-xl p-3">
              <p className="font-bold text-red-700 mb-1.5 text-xs sm:text-sm">
                Selling Zone Check
              </p>
              <ul className="list-disc ml-5 space-y-1 text-xs sm:text-sm text-gray-600">
                <li>
                  If Buyer Dominates → <span className="font-bold text-amber-600">Wait for Sale</span> —{" "}
                  <span className="text-green-700 font-medium bg-green-50 px-1 rounded">কারণ দাম আরো বাড়তে পারে।</span>
                </li>
                <li>
                  If Seller Dominates or Equal → <span className="font-bold text-red-600">Sell Immediately</span> —{" "}
                  <span className="text-red-600 font-medium bg-red-100 px-1 rounded">কারণ দাম দ্রুত কমতে পারে।</span>
                </li>
              </ul>
            </div>

            {/* Cash Map Box */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl py-2 px-4 text-center shadow-sm">
              <p className="text-xs sm:text-sm font-bold tracking-wide">
                Or Check Cash Map %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ৩. ফিক্সড বটম বাটন (Footer) */}
      <div className="bg-white border-t border-gray-150 p-3 flex justify-center">
        <button
          onClick={onClose}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm sm:text-base px-10 py-2.5 rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
        >
          I Understand
        </button>
      </div>

    </div>
  );
};

export default RulesPopup;
