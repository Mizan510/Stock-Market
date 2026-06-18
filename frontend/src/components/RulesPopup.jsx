import React from "react";

const RulesPopup = ({ onClose }) => {
  return (
    // Fixed full-screen backdrop overlay
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2">
      {/* Modal Container */}
      <div className="w-full max-w-2xl max-h-[94vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">
        {/* ১. ডিভিডেন্ড ও ট্রেডিং রুলস সেকশন */}
        <div
          style={{
            backgroundImage:
              "linear-gradient(to left, #1d4ed8, #2563eb, #1d4ed8)",
          }}
          className="px-3 sm:px-4 py-2"
        >
          {/* প্রধান শিরোনাম */}
          <h1 className="text-base sm:text-xl md:text-2xl font-extrabold text-center text-yellow-300 tracking-wide mb-1.5 drop-shadow-lg bg-black/50 px-2 py-1 rounded-xl">
            ডিভিডেন্ড পাওয়ার পর করণীয়
          </h1>

          {/* ডিভিডেন্ড লিস্ট কার্ড */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-gray-200 text-red-600 text-xs sm:text-sm font-bold space-y-1">
            <p>
              ১. AGM-এ হারাম Investment এর বিষয়ে Mail/Written আপত্তি জানাতে
              হবে।
            </p>
            <p>
              ২. AGM-এ হারাম Profit এর বিষয়ে Mail/Written আপত্তি জানাতে হবে।
            </p>
            <p>৩. প্রাপ্ত Dividend Purify করতে হবে।</p>
            <p>৪. বছর শেষে যাকাত আদায় করতে হবে।</p>
          </div>

          {/* সাব-শিরোনাম */}
          <h2 className="text-sm sm:text-lg md:text-xl font-black text-center text-cyan-100 tracking-wide mt-2 mb-1">
            Important Trading Rules
          </h2>

          {/* নো ইমোশন হাইলাইট বক্স */}
          <div className="mt-1 bg-white border border-white/20 rounded-2xl py-2 px-3 backdrop-blur-md overflow-hidden">
            <style>{`
              @keyframes highlight-slide {
                0%, 14% { opacity: 0; transform: translateX(20px) scale(0.95); }
                18%, 32% { opacity: 1; transform: translateX(0) scale(1.02); }
                36%, 48% { opacity: 1; transform: translateX(0) scale(1); }
                52%, 100% { opacity: 0; transform: translateX(-20px) scale(0.95); }
              }
            `}</style>
            <div className="relative h-7 sm:h-9">
              <span
                className="absolute inset-0 flex items-center justify-center text-red-600 text-base sm:text-xl font-extrabold tracking-wide bg-red-100/90 rounded-xl px-2 py-1 shadow-sm"
                style={{
                  animation: "highlight-slide 9s ease-in-out infinite",
                  animationDelay: "0s",
                }}
              >
                কোনো আবেগ নয়
              </span>
              <span
                className="absolute inset-0 flex items-center justify-center text-red-600 text-base sm:text-xl font-extrabold tracking-wide bg-red-100/90 rounded-xl px-2 py-1 shadow-sm"
                style={{
                  animation: "highlight-slide 9s ease-in-out infinite",
                  animationDelay: "3s",
                }}
              >
                ধৈর্য ধরে থাকুন
              </span>
              <span
                className="absolute inset-0 flex items-center justify-center text-red-600 text-base sm:text-xl font-extrabold tracking-wide bg-red-100/90 rounded-xl px-2 py-1 shadow-sm"
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
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-3 bg-gray-50/70 scrollbar-thin">
          {/* Main Buy & Sell Box */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-2.5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="mb-2.5 flex items-center justify-center font-bold tracking-wide">
              <span className="text-red-500 text-2xl font-extrabold mr-2">
                *
              </span>
              <span
                style={{
                  backgroundImage: "linear-gradient(to left, #dc2626, #db2777)",
                }}
                className="text-white text-xs sm:text-base font-bold px-3 py-1.5 rounded-lg shadow-md"
              >
                Buy & Sell Rules
              </span>
              <span className="text-red-500 text-2xl font-extrabold ml-2">
                *
              </span>
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm font-bold text-gray-800">
              {/* Buying Zone */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 space-y-2">
                <p className="font-bold text-emerald-800 text-xs sm:text-sm md:text-base border-b border-emerald-200 pb-0.5">
                  Buy Rules ( ক্রয়ের নিয়মাবলী )
                </p>
                <p>
                  <span className="text-emerald-900 font-extrabold">
                    1. Buying Zone Check:
                  </span>{" "}
                  Set 20% of Lowest Share Price of Last 1 Year of Selected
                  Company.
                </p>
                <p>
                  <span className="text-emerald-900 font-extrabold">
                    2. APP Check:
                  </span>{" "}
                  APP থেকে DSE অথবা Selected Company এর Cash Map% Check করতে
                  হবে।
                </p>
                <div className="space-y-1">
                  <p>
                    <span className="text-emerald-900 font-extrabold">
                      3. Dominant Check:
                    </span>{" "}
                    Dominant Check by Analysis Order Qtn in Order Book
                  </p>
                  <p className="ml-4">
                    If Seller Dominates →{" "}
                    <span className="font-bold text-amber-600">
                      Wait for Buy
                    </span>{" "}
                    —{" "}
                    <span className="text-red-600 font-medium bg-red-50 px-1 rounded text-[11px] sm:text-xs">
                      কারণ দাম আরো কমতে পারে।
                    </span>
                  </p>
                  <p className="ml-4">
                    If Buyer Dominates or Equal →{" "}
                    <span className="font-bold text-green-600">
                      Buy Immediately
                    </span>{" "}
                    —{" "}
                    <span className="text-green-700 font-medium bg-green-100 px-1 rounded text-[11px] sm:text-xs">
                      কারণ দাম দ্রুত বাড়তে পারে।
                    </span>
                  </p>
                </div>
                <div>
                  <p>
                    <span className="text-emerald-900 font-extrabold">
                      4. Volume Check:
                    </span>
                  </p>
                  <div className="mt-1.5 bg-white/80 p-2 rounded-lg text-[11px] sm:text-xs grid grid-cols-1 sm:grid-cols-2 gap-1 font-semibold text-gray-800 shadow-xs">
                    <div className="border-b sm:border-b-0 pb-0.5 sm:pb-0">
                      ⬇️ দাম কমে | ⬆️ Vol বাড়ে →{" "}
                      <span className="text-red-600 font-bold">
                        Seller শক্তিশালী
                      </span>
                    </div>
                    <div className="border-b sm:border-b-0 pb-0.5 sm:pb-0">
                      ⬇️ দাম কমে | ⬇️ Vol কমে →{" "}
                      <span className="text-amber-600 font-bold">
                        Seller দুর্বল
                      </span>
                    </div>
                    <div className="border-b sm:border-b-0 pb-0.5 sm:pb-0">
                      ⬆️ দাম বাড়ে | ⬆️ Vol বাড়ে →{" "}
                      <span className="text-green-600 font-bold">
                        Buyer শক্তিশালী
                      </span>
                    </div>
                    <div>
                      ⬆️ দাম বাড়ে | ⬇️ Vol কমে →{" "}
                      <span className="text-blue-600 font-bold">
                        Buyer দুর্বল
                      </span>
                    </div>
                  </div>

                  <p>
                    <span className="text-emerald-900 font-extrabold">
                      5. Pivot Point & Pyramid Rule:
                    </span>{" "}
                    Pivot point বের করে Pyramid Rule ফলো করুন।
                  </p>
                </div>
              </div>

              {/* Selling Zone */}
              <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 space-y-2">
                <p className="font-bold text-rose-800 text-xs sm:text-sm md:text-base border-b border-rose-200 pb-0.5">
                  Sale Rules ( বিক্রয়ের নিয়মাবলী )
                </p>
                <p>
                  <span className="text-rose-900 font-extrabold">
                    1. Stop Loss →
                  </span>{" "}
                  <span className="font-bold text-red-600">3% Loss Limit</span>{" "}
                  —{" "}
                  <span className="text-red-700 font-medium bg-red-100 px-1 rounded text-[11px] sm:text-xs">
                    যদি ৩% নিচে নামে, সাথে সাথে বিক্রি করুন।
                  </span>
                </p>
                <p>
                  <span className="text-rose-900 font-extrabold">
                    2. APP Check:
                  </span>{" "}
                  APP থেকে DSE অথবা Selected Company এর Cash Map% Check করতে
                  হবে।
                </p>
                <div className="space-y-1">
                  <p>
                    <span className="text-rose-900 font-extrabold">
                      3. Dominant Check:
                    </span>{" "}
                    Dominant Check by Analysis Order Qtn in Order Book
                  </p>
                  <p className="ml-4">
                    If Buyer Dominates →{" "}
                    <span className="font-bold text-amber-600">
                      Wait for Sale
                    </span>{" "}
                    —{" "}
                    <span className="text-green-700 font-medium bg-green-50 px-1 rounded text-[11px] sm:text-xs">
                      কারণ দাম আরো বাড়তে পারে।
                    </span>
                  </p>
                  <p className="ml-4">
                    If Seller Dominates or Equal →{" "}
                    <span className="font-bold text-red-600">
                      Sell Immediately
                    </span>{" "}
                    —{" "}
                    <span className="text-red-600 font-medium bg-red-100 px-1 rounded text-[11px] sm:text-xs">
                      কারণ দাম দ্রুত কমতে পারে।
                    </span>
                  </p>
                </div>
                <div>
                  <p>
                    <span className="text-rose-900 font-extrabold">
                      4. Volume Check:
                    </span>
                  </p>
                  <div className="mt-1.5 bg-white/80 p-2 rounded-lg text-[11px] sm:text-xs grid grid-cols-1 sm:grid-cols-2 gap-1 font-semibold text-gray-800 shadow-xs">
                    <div className="border-b sm:border-b-0 pb-0.5 sm:pb-0">
                      ⬇️ দাম কমে | ⬆️ Vol বাড়ে →{" "}
                      <span className="text-red-600 font-bold">
                        Seller শক্তিশালী
                      </span>
                    </div>
                    <div className="border-b sm:border-b-0 pb-0.5 sm:pb-0">
                      ⬇️ দাম কমে | ⬇️ Vol কমে →{" "}
                      <span className="text-amber-600 font-bold">
                        Seller দুর্বল
                      </span>
                    </div>
                    <div className="border-b sm:border-b-0 pb-0.5 sm:pb-0">
                      ⬆️ দাম বাড়ে | ⬆️ Vol বাড়ে →{" "}
                      <span className="text-green-600 font-bold">
                        Buyer শক্তিশালী
                      </span>
                    </div>
                    <div>
                      ⬆️ দাম বাড়ে | ⬇️ Vol কমে →{" "}
                      <span className="text-blue-600 font-bold">
                        Buyer দুর্বল
                      </span>
                    </div>
                  </div>
                </div>
                <p>
                  <span className="text-rose-900 font-extrabold">
                    5. Target Profit →
                  </span>{" "}
                  <span className="font-bold text-emerald-600">
                    Sell Minimum 10% Profit
                  </span>{" "}
                  —{" "}
                  <span className="text-emerald-700 font-medium bg-emerald-50 px-1 rounded text-[11px] sm:text-xs">
                    ১০% লাভ হলে প্রফিট বুক করে বের হয়ে যান।
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Step 1 */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-3 shadow-sm">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md text-xs">
                Step-1
              </span>
              Choose Best Company
            </h3>
            <div className="space-y-0.5 text-xs sm:text-sm text-gray-600 font-semibold">
              <p>Choose Halal Company</p>
              <p>Established Company</p>
              <p>Well Known Company</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-3 shadow-sm">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-md text-xs">
                Step-2
              </span>
              Set Buying & Selling Zone
            </h3>
            <div className="space-y-1 text-xs sm:text-sm text-gray-600 font-semibold">
              <p>
                <span className="text-blue-600 font-bold">Buying Zone:</span>{" "}
                Set 20% of Lowest Share Price of Last 1 Year of Selected
                Company.
              </p>
              <p>
                <span className="text-orange-600 font-bold">Selling Zone:</span>{" "}
                Set 70% of Highest Share Price of Last 1 Year of Selected
                Company.
              </p>
            </div>
          </div>

          {/* Important Tips Box */}
          <div className="bg-gray-200/80 border border-gray-300 rounded-2xl p-2.5 shadow-sm">
            <h3 className="text-base sm:text-lg text-center font-black text-red-600 mb-2">
              Important Tips
            </h3>

            <div className="space-y-2 text-xs sm:text-sm text-slate-700">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="font-bold text-sky-700">
                  🛡️ Risk Management (3% Rule)
                </p>
                <p className="font-medium">
                  এক ট্রেডে 3% এর বেশি ঝুঁকি নিবে না।
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="font-bold text-cyan-700">📊 Stock Selection</p>
                <p className="font-medium">
                  শক্তিশালী স্টক খুঁজো (High volume + strong move)। লো ভলিউম /
                  ডেড স্টক এড়িয়ে চলো।
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="font-bold text-violet-700">
                  ⏳ Market Discipline
                </p>
                <p className="font-medium">
                  {" "}
                  সুযোগ না থাকলে ক্যাশে থাকো। বেশি ট্রেড = বেশি ভুল। 90% সময়
                  মার্কেট পর্যবেক্ষণ করো।
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="font-bold text-rose-700">❌ Entry Rules</p>
                <div className="space-y-0.5 mt-1 font-medium">
                  <p>गुजब / टिप्स देखे किनবে না।</p>
                  <p>অন্যরা ট্রেড করছে দেখে ঢুকবে না (FOMO এড়িয়ে চলো)।</p>
                  <p>সাপোর্ট/রেজিস্ট্যান্স ব্রেক হলে ট্রেড শুরু করো।</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="font-bold text-indigo-700">🧠 Psychology Rules</p>
                <div className="space-y-0.5 mt-1 font-medium">
                  <p>ধৈর্যই সবচেয়ে বড় শক্তি।</p>
                  <p>
                    “কুমিরের মতো ধৈর্য ধরো… একদম নিশ্চিত সুযোগ না এলে ট্রেড করো
                    না।”
                  </p>
                  <p>নিয়ম ভেঙেছো কিনা সবসময় চেক করো।</p>
                  <p>
                    প্রথম লক্ষ্য: টাকা বাঁচানো। দ্বিতীয় লক্ষ্য: টাকা বাড়ানো।
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="font-bold text-red-700">❌ Exit Rules</p>
                <div className="space-y-0.5 mt-1 font-medium">
                  <p>যদি ভুল হয়, সেটা মেনে বের হয়ে যাও।</p>
                  <p>লাভ হলে তাড়াহুড়া করে বিক্রি করবে না।</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="font-bold text-emerald-700">📈 Strategy Rules</p>
                <p className="font-medium">
                  “Pivot দিয়ে এন্ট্রি নাও, Pyramid দিয়ে লাভ বাড়াও।”
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="font-bold text-sky-700">📍 Pivot Point</p>
                <p className="font-medium">
                  Pivot = Center reference level। Market bias বোঝার base point।
                </p>
                <p className="mt-1.5 font-bold text-slate-900">
                  📈 Bias Rules:
                </p>
                <p className="font-medium">Price Pivot এর উপরে → bullish 📈</p>
                <p className="font-medium">Price Pivot এর নিচে → bearish 📉</p>
                <p className="font-medium">
                  Pivot ব্রেক → নতুন trend শুরু হতে পারে।
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="font-bold text-violet-700">📊 Pivot Example</p>
                <p className="font-medium">
                  If Stock Price High/Resistance = 110, Low/Support = 90, Close
                  = 100
                </p>
                <p className="mt-1 font-bold text-emerald-800">
                  👉 Pivot = (High + Low + Close) ÷ 3 = 100
                </p>
                <p className="font-medium">
                  যদি প্রাইস 100 এর উপরে থাকে → bullish bias 📈
                </p>
                <p className="font-medium">
                  যদি প্রাইস 100 এর নিচে থাকে → bearish bias 📉
                </p>
                <p className="font-medium">
                  100 ব্রেক করলে → নতুন trend শুরু হতে পারে।
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="font-bold text-orange-700">🧱 Pyramid Rule</p>
                <div className="space-y-0.5 mt-1 font-medium">
                  <p>30% → Initial entry</p>
                  <p>30% → Trend confirm হলে add</p>
                  <p>40% → Strong trend হলে add</p>
                </div>
                <p className="mt-1 font-bold text-slate-900 text-xs">
                  👉 মোট: 30 + 30 + 40 = step-by-step entry
                </p>
                <p className="mt-1 text-emerald-700 font-extrabold">
                  ✔️ শুধুমাত্র winning trade এ add করা
                </p>
                <p className="text-red-600 font-extrabold">
                  ❌ লসিং ট্রেডে add করা যাবে না
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                <p className="font-bold text-fuchsia-700">🧠 Final Mindset</p>
                <p className="font-semibold italic text-slate-800">
                  “লাভ বাড়লে পজিশন বাড়াও, লস হলে নয়। ধৈর্য ধরো, capital
                  protect করো, high-quality setup এ ট্রেড করো।”
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ৩. ফিক্সড বটম বাটন (Footer) */}
        <div className="bg-white border-t border-gray-150 p-2.5 flex justify-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-base sm:text-lg px-6 py-2 rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
          >
            Rules Follow করেছেন তো ? 😎
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesPopup;
