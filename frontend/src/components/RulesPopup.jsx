import React from "react";

const RulesPopup = ({ onClose }) => {
  return (
<div className="w-full max-w-3xl max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden overflow-x-hidden flex flex-col mx-auto">
      <div className="w-full max-w-md max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-linear-to-r from-blue-700 via-blue-600 to-blue-700 px-4 sm:px-6 py-4 sm:py-5">
<h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-center text-yellow-300 tracking-wide mb-4 drop-shadow-lg bg-black/5 px-3 py-2 rounded-xl">
  ডিভিডেন্ড পাওয়ার পর করণীয়
</h1>

<div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
  <ul className="space-y-1 text-red-600 text-xs sm:text-base font-semibold">
    <li>১. AGM-এ হারাম Investment এর বিষয়ে Mail/Written আপত্তি জানাতে হবে।</li>
    <li>২. AGM-এ হারাম Profit এর বিষয়ে Mail/Written আপত্তি জানাতে হবে।</li>
    <li>৩. প্রাপ্ত Dividend Purify করতে হবে।</li>
    <li>৪. বছর শেষে যাকাত আদায় করতে হবে।</li>
  </ul>
</div>

<h1 className="xl text-2xl md:text-3xl font-bold text-center text-white tracking-wide mb-4">
  Important Trading Rules
</h1>

          <div className="mt-4 bg-white border border-white/20 rounded-2xl py-3 px-4 backdrop-blur-md">
            <style>
              {`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } } .blink-text {
              animation: blink 1s ease-in-out infinite;
              }

                @keyframes blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.6; }
                }`}
            </style>

            <h3
              className="text-red-600 text-2xl font-bold blink-text"
              style={{
                WebkitTextStroke: "0px #f8f8f8",
                textShadow: "0 0 0.2px #e9fd0e",
              }}
              align="center"
            >
              No Emotion, Only Patience
            </h3>

            <div className="w-16 sm:w-24 h-1 bg-red-400 mx-auto mt-2 rounded-full" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-gray-100">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-green-700 mb-4">
              Rule No 1: Choose Best Company
            </h3>
            <ul className="list-disc ml-5 space-y-2 text-sm sm:text-base text-gray-700">
              <li>Choose Halal Company</li>
              <li>Established Company</li>
              <li>Well Known Company</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-green-700 mb-4">
              Rule No 2: Set Buying & Selling Zone
            </h3>
            <ul className="list-disc ml-5 space-y-3 text-sm sm:text-base text-gray-700">
              <li>
                For Buying Zone: Set 20% of Lowest Share Price of Last 1 Year of
                Selected Company.
              </li>
              <li>
                For Selling Zone: Set 70% of Highest Share Price of Last 1 Year
                of Selected Company.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-green-700 mb-5">
              Rule No 3: Dominant Check Before Buy & Sale
            </h3>
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="font-bold text-green-700 mb-3 text-sm sm:text-base">
                  Buying Zone Check
                </p>
                <ul className="list-disc ml-5 space-y-3 text-sm sm:text-base text-gray-700">
                  <li>
                    If Seller Dominates → Wait for Buy —{" "}
                    <span className="text-red-600 font-medium">
                      কারণ দাম আরো কমতে পারে।
                    </span>
                  </li>
                  <li>
                    If Buyer Dominates or Equal → Buy Immediately —{" "}
                    <span className="text-green-700 font-medium">
                      কারণ দাম দ্রুত বাড়তে পারে।
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-bold text-red-700 mb-3 text-sm sm:text-base">
                  Selling Zone Check
                </p>
                <ul className="list-disc ml-5 space-y-3 text-sm sm:text-base text-gray-700">
                  <li>
                    If Buyer Dominates → Wait for Sale —{" "}
                    <span className="text-green-700 font-medium">
                      কারণ দাম আরো বাড়তে পারে।
                    </span>
                  </li>
                  <li>
                    If Seller Dominates or Equal → Sell Immediately —{" "}
                    <span className="text-red-600 font-medium">
                      কারণ দাম দ্রুত কমতে পারে।
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-linear-to-r from-red-500 to-red-600 text-white rounded-2xl p-4 text-center shadow-md">
                <p className="text-base sm:text-lg font-bold tracking-wide">
                  Or Check Cash Map %
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 p-4 flex justify-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-8 py-3 rounded-2xl transition-all duration-200 shadow-lg"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesPopup;
