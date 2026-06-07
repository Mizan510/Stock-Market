import React from "react";

const RulesPopup = ({ onClose }) => {
  return (
    // Fixed full-screen backdrop overlay
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2">
      {/* Modal Container */}
      <div className="w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">
        {/* ১. ডিভিডেন্ড ও ট্রেডিং রুলস সেকশন (ওপর-নিচ থেকে পারফেক্টলি চাপানো) */}
        <div className="bg-linear-to-l from-blue-700 via-blue-600 to-blue-700 px-3 sm:px-4 py-1 sm:py-2">
          {/* প্রধান শিরোনাম */}
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-center text-yellow-300 tracking-wide mb-1 drop-shadow-lg bg-black/50 px-2 py-1 rounded-xl">
            ডিভিডেন্ড পাওয়ার পর করণীয়
          </h1>

          {/* ডিভিডেন্ড লিস্ট কার্ড */}
          <div className="bg-white rounded-2xl p-2 sm:p-3 shadow-sm border border-gray-200">
            <ul className="space-y-1 text-red-600 text-xs sm:text-sm md:text-sm font-bold">
              <li>
                ১. AGM-এ হারাম Investment এর বিষয়ে Mail/Written আপত্তি জানাতে
                হবে।
              </li>
              <li>
                ২. AGM-এ হারাম Profit এর বিষয়ে Mail/Written আপত্তি জানাতে হবে।
              </li>
              <li>৩. প্রাপ্ত Dividend Purify করতে হবে।</li>
              <li>৪. বছর শেষে যাকাত আদায় করতে হবে।</li>
            </ul>
          </div>

          {/* সাব-শিরোনাম */}
          <h2 className="text-base sm:text-lg md:text-xl font-black text-center text-white tracking-wide mt-2 mb-1">
            Important Trading Rules
          </h2>

          {/* নো ইমোশন হাইলাইট বক্স */}
          <div className="mt-1 bg-white border border-white/20 rounded-2xl py-3 px-4 backdrop-blur-md overflow-hidden">
            <style>{`
              @keyframes highlight-slide {
                0%, 14% { opacity: 0; transform: translateX(20px) scale(0.95); }
                18%, 32% { opacity: 1; transform: translateX(0) scale(1.05); }
                36%, 48% { opacity: 1; transform: translateX(0) scale(1); }
                52%, 100% { opacity: 0; transform: translateX(-20px) scale(0.95); }
              }
            `}</style>
            <div className="relative h-8 sm:h-9 md:h-10">
              <span
                className="absolute inset-0 flex items-center justify-center text-red-600 text-2xl sm:text-3xl font-extrabold tracking-wide bg-red-100/90 rounded-2xl px-4 py-2 shadow-md"
                style={{
                  animation: "highlight-slide 9s ease-in-out infinite",
                  animationDelay: "0s",
                }}
              >
                কোনো আবেগ নয়
              </span>
              <span
                className="absolute inset-0 flex items-center justify-center text-red-600 text-2xl sm:text-3xl font-extrabold tracking-wide bg-red-100/90 rounded-2xl px-4 py-2 shadow-md"
                style={{
                  animation: "highlight-slide 9s ease-in-out infinite",
                  animationDelay: "3s",
                }}
              >
                ধৈর্য ধরে থাকুন
              </span>
              <span
                className="absolute inset-0 flex items-center justify-center text-red-600 text-2xl sm:text-3xl font-extrabold tracking-wide bg-red-100/90 rounded-2xl px-4 py-2 shadow-md"
                style={{
                  animation: "highlight-slide 9s ease-in-out infinite",
                  animationDelay: "6s",
                }}
              >
                Rules Follow করুন
              </span>
            </div>
          </div>
        </div>

        {/* ২. স্ক্রোলযোগ্য নিচের রুলস সেকশন (Scrollable Content) */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-3 bg-gray-50/70">
          {/* Rule 3 */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="mb-2 flex items-center justify-center font-bold tracking-wide">
              <span className="text-red-500 text-4xl font-extrabold mr-3">
                *
              </span>

              <span className="text-white text-sm sm:text-2xl font-bold bg-linear-to-l from-red-600 to-pink-600 px-3 py-3 rounded-lg shadow-md">
                Dominant Check Before Buy & Sale
              </span>

              <span className="text-red-500 text-4xl font-extrabold ml-3">
                *
              </span>
            </h3>

            <div className="space-y-1">
              {/* Buying Zone */}
              <div className="bg-green-200 border border-blue-400 rounded-xl p-2">
                <p className="font-bold text-green-700 mb-1 text-sm sm:text-sm">
                  Buying Zone Check
                </p>
                <ul className="list-disc ml-5 space-y-1 text-xs sm:text-sm font-bold text-black-600">
                  <li>
                    If Seller Dominates →{" "}
                    <span className="font-bold text-amber-600">
                      Wait for Buy
                    </span>{" "}
                    —{" "}
                    <span className="text-red-600 font-medium bg-red-50 px-1 rounded">
                      কারণ দাম আরো কমতে পারে।
                    </span>
                  </li>
                  <li>
                    If Buyer Dominates or Equal →{" "}
                    <span className="font-bold text-green-600">
                      Buy Immediately
                    </span>{" "}
                    —{" "}
                    <span className="text-green-700 font-medium bg-green-100 px-1 rounded">
                      কারণ দাম দ্রুত বাড়তে পারে।
                    </span>
                  </li>
                  <li>
                    Stop Loss →
                    <span className="font-bold text-red-600">
                      3% Loss Limit
                    </span>{" "}
                    —{" "}
                    <span className="text-red-700 font-medium bg-red-100 px-1 rounded">
                      যদি ৩% নিচে নামে, সাথে সাথে বিক্রি করুন।
                    </span>
                  </li>
                </ul>
              </div>

              {/* Selling Zone */}
              <div className="bg-red-200 border border-blue-400 rounded-xl p-2">
                <p className="font-bold text-red-700 mb-1 text-xs sm:text-sm">
                  Selling Zone Check
                </p>
                <ul className="list-disc ml-5 space-y-1 text-xs sm:text-sm font-bold text-black-500">
                  <li>
                    If Buyer Dominates →{" "}
                    <span className="font-bold text-amber-600">
                      Wait for Sale
                    </span>{" "}
                    —{" "}
                    <span className="text-green-700 font-medium bg-green-50 px-1 rounded">
                      কারণ দাম আরো বাড়তে পারে।
                    </span>
                  </li>
                  <li>
                    If Seller Dominates or Equal →{" "}
                    <span className="font-bold text-red-600">
                      Sell Immediately
                    </span>{" "}
                    —{" "}
                    <span className="text-red-600 font-medium bg-red-100 px-1 rounded">
                      কারণ দাম দ্রুত কমতে পারে।
                    </span>
                  </li>
                  <li>
                    Target Profit →
                    <span className="font-bold text-green-600">
                      Sell at 20% Profit
                    </span>{" "}
                    —{" "}
                    <span className="text-green-700 font-medium bg-green-100 px-1 rounded">
                      ২০% লাভ হলে প্রফিট বুক করে বের হয়ে যান।
                    </span>
                  </li>
                </ul>
              </div>

              {/* Cash Map Box */}
              <div className="bg-linear-to-r from-red-800 to-red-600 text-white rounded-xl py-3 px-3 text-center shadow-sm">
                <p className="text-[11px] sm:text-2xl font-bold tracking-wide">
                  Check Cash Map% of *Company* and *Market*
                </p>
              </div>
            </div>
          </div>

          {/* Rule 1 */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm sm:text-base font-bold text-green-700 mb-2 flex items-center gap-2">
              <span className="bg-green-100 text-red-700 px-2 py-0.5 rounded-lg text-sm">
                Step-1
              </span>
              Choose Best Company
            </h3>
            <ul className="list-disc ml-5 space-y-1 text-xs sm:text-sm text-gray-600 font-medium">
              <li>Choose Halal Company</li>
              <li>Established Company</li>
              <li>Well Known Company</li>
            </ul>
          </div>

          {/* Rule 2 */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm sm:text-base font-bold text-green-700 mb-2 flex items-center gap-2">
              <span className="bg-green-100 text-red-700 px-1 py-0.5 rounded-lg text-sm">
                Step-2
              </span>
              Set Buying & Selling Zone
            </h3>
            <ul className="list-disc ml-5 space-y-2 text-xs sm:text-sm text-gray-600 font-medium">
              <li>
                <span className="text-blue-600 font-bold">Buying Zone:</span>{" "}
                Set 20% of Lowest Share Price of Last 1 Year of Selected
                Company.
              </li>
              <li>
                <span className="text-orange-600 font-bold">Selling Zone:</span>{" "}
                Set 70% of Highest Share Price of Last 1 Year of Selected
                Company.
              </li>
            </ul>
          </div>
        </div>

        {/* ৩. ফিক্সড বটম বাটন (Footer) */}
        <div className="bg-white border-t border-gray-150 p-2 flex justify-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-2xl sm:text-xl px-6 py-1.5 rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesPopup;
