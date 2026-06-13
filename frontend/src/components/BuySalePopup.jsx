import React, { useEffect, useState } from "react";
import api from "../api";

const BuySalePopup = ({ isOpen, onClose }) => {
  const [buyRows, setBuyRows] = useState([]); // BuyZone এর জন্য ডাটা
  const [saleRows, setSaleRows] = useState([]); // SaleZone এর জন্য ডাটা
  const [loading, setLoading] = useState(false);

  // 🛠️ BuyZone এর জন্য ক্যালকুলেশন হেল্পার
  const parseNumber = (value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  };

  const calcZone = (low, high, percent) => {
    const lowValue = parseNumber(low);
    const highValue = parseNumber(high);
    const percentValue = parseNumber(percent);
    if (
      lowValue === undefined ||
      highValue === undefined ||
      percentValue === undefined
    ) {
      return undefined;
    }
    return lowValue + ((highValue - lowValue) * percentValue) / 100;
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        // ১. লোকাল স্টোরেজ থেকে User ID গেট করা
        let userId = null;
        const authStr = localStorage.getItem("auth");
        if (authStr) {
          const auth = JSON.parse(authStr);
          userId = auth?.id || null;
        }

        // ২. সমস্ত API রিকোয়েস্ট প্যারালালে কল করা
        const [zoneResponse, buyResponse] = await Promise.all([
          api.get("/zone").catch(() => ({ data: [] })),
          userId
            ? api.get(`/buy/${userId}`).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ]);

        const rawZones = zoneResponse.data?.data || zoneResponse.data || [];
        const rawTrades = buyResponse.data?.data || buyResponse.data || [];

        // 🟢 [PROCESSING FOR BUY ZONE]
        const mappedBuyData = rawZones
          .map((row) => ({
            ...row,
            company: row.company || "",
            low: row.low ?? "",
            high: row.high ?? "",
            buyPercent: row.buyPercent ?? 20,
            closingPrice: row.closingPrice ?? "",
          }))
          .sort((a, b) =>
            a.company.localeCompare(b.company, undefined, {
              sensitivity: "base",
            }),
          );

        setBuyRows(mappedBuyData);

        // 🔴 [PROCESSING FOR SALE ZONE (হুবহু SaleZone.jsx এর লজিক)]
        const normalizedSaleData = rawTrades
          .map((item) => {
            const company =
              item.stockName ||
              item.company ||
              item.companyName ||
              item.Company ||
              item.symbol ||
              "";
            const price = Number(
              item.sharePrice ?? item.buyPerShareValue ?? item.price ?? 0,
            );

            // কোম্পানির নাম ক্লিন করে ম্যাচিং করা
            const tradeCompanyClean = company?.trim().toLowerCase();
            const matchedZone = rawZones.find((z) => {
              const zoneCompanyClean = (
                z.company ??
                z.companyName ??
                z.stockName ??
                z.symbol ??
                z.ticker ??
                ""
              )
                .trim()
                .toLowerCase();
              if (!zoneCompanyClean || !tradeCompanyClean) return false;
              return (
                zoneCompanyClean === tradeCompanyClean ||
                zoneCompanyClean.includes(tradeCompanyClean) ||
                tradeCompanyClean.includes(zoneCompanyClean)
              );
            });

            const rawClosingPrice = matchedZone
              ? (matchedZone.closingPrice ??
                matchedZone.close ??
                matchedZone.sessionClose ??
                matchedZone.price)
              : (item.closingPrice ?? item.close ?? item.sessionClose);

            const closingPrice =
              rawClosingPrice !== undefined && rawClosingPrice !== null
                ? Number(rawClosingPrice)
                : null;
            const priceWithCommission = price * 1.004;
            const slPercent = Number(item.stopLossPercent ?? 3);
            const tpPercent = Number(item.targetProfitPercent ?? 10);

            return {
              company,
              closingPrice,
              slPrice: priceWithCommission * (1 - slPercent / 100),
              tpPrice: priceWithCommission * (1 + tpPercent / 100),
            };
          })
          .sort((a, b) =>
            a.company.localeCompare(b.company, undefined, {
              sensitivity: "base",
            }),
          );

        setSaleRows(normalizedSaleData);
      } catch (err) {
        console.error("Popup complex data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [isOpen]);

  if (!isOpen) return null;

  // 🟢 ফিল্টার: Buy Zone
  const greenBuyList = buyRows.filter((row) => {
    const closePriceNum = parseNumber(row.closingPrice);
    const buyZone = calcZone(row.low, row.high, row.buyPercent);
    return (
      closePriceNum !== undefined &&
      buyZone !== undefined &&
      closePriceNum <= buyZone
    );
  });

  // 🔴 ফিল্টার ১: Sale - Exit Floor Price reached
  const saleExitFloorList = saleRows.filter(
    (t) => t.closingPrice !== null && t.closingPrice <= t.slPrice,
  );

  // 🍏 ফিল্টার ২: Sale - Target Profit reached
  const saleTargetProfitList = saleRows.filter(
    (t) => t.closingPrice !== null && t.closingPrice >= t.tpPrice,
  );

  return (
    <>
      {/* ⚡ স্ট্রং ব্লিংক এবং গ্লো অ্যানিমেশনের জন্য ইনলাইন স্টাইল */}
      <style>{`
        @keyframes strongGreenBlink {
          0%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(16, 185, 129, 0.6); }
          50% { opacity: 0.15; text-shadow: none; }
        }
        @keyframes strongRoseBlink {
          0%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(244, 63, 94, 0.6); }
          50% { opacity: 0.15; text-shadow: none; }
        }
        .animate-strong-green-blink {
          animation: strongGreenBlink 1.2s ease-in-out infinite;
        }
        .animate-strong-rose-blink {
          animation: strongRoseBlink 1.2s ease-in-out infinite;
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-5xl bg-gray-950 border-2 border-gray-800 rounded-2xl p-8 text-white min-h-[75vh] max-h-[90vh] flex flex-col justify-between gap-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ক্লোজ বাটন */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-xl font-bold"
          >
            ✕
          </button>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2">
              <span className="w-6 h-6 border-2 border-emerald-500 border-r-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono">Syncing Portfolio Matrices...</p>
            </div>
          ) : (
            <>
              {/* মেইন গ্রিড লেআউট */}
              <div className="grid grid-cols-2 divide-x-2 divide-gray-900 flex-1 overflow-hidden">
                
                {/* LEFT SIDE: BUY ZONE */}
                <div className="pr-6 flex flex-col overflow-hidden">
                  <div className="mb-4 pb-2 border-b border-gray-900">
                    <h2 className="text-2xl font-extrabold text-emerald-400 font-mono tracking-wider flex items-center gap-2">
                      <span>🟢</span> Buy Zone
                    </h2>
                    <span className="block text-xs font-black text-emerald-400 font-mono tracking-wide mt-1 pl-7 uppercase animate-strong-green-blink">
                      Ready for Buy
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[58vh] pr-2">
                    {greenBuyList.length === 0 ? (
                      <p className="text-xs text-gray-600 italic pl-7">
                        No assets detected in buy zone
                      </p>
                    ) : (
                      <ul className="space-y-2.5 pl-7 list-disc marker:text-emerald-500">
                        {greenBuyList.map((row, index) => (
                          <li
                            key={index}
                            className="font-mono text-base font-bold text-emerald-400 hover:text-emerald-300 transition-colors tracking-wide"
                          >
                            {row.company}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* RIGHT SIDE: SALE ZONE (Subdivided into 2 Sections) */}
                <div className="pl-6 flex flex-col overflow-hidden gap-4">
                  <div className="mb-4 pb-2 border-b border-gray-900">
                    <h2 className="text-2xl font-extrabold text-rose-600 font-mono tracking-wider flex items-center gap-2 shrink-0">
                      <span>🔴</span> Sale Zone
                    </h2>
                    <span className="block text-xs font-black text-rose-500 font-mono tracking-wide mt-1 pl-7 uppercase animate-strong-rose-blink">
                    Ready for Sale
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[58vh] pr-2 space-y-6">
                    {/* SUBSECTION 1: EXIT FLOOR PRICE REACHED */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 bg-red-950/30 border border-red-900/50 px-2 py-1 rounded mb-3 inline-block font-mono">
                        🚨 Exit Floor Price Reached
                      </h3>
                      {saleExitFloorList.length === 0 ? (
                        <p className="text-xs text-gray-600 italic pl-4">
                          No assets reached stop-loss floor
                        </p>
                      ) : (
                        <ul className="space-y-2 pl-4 list-disc marker:text-red-500">
                          {saleExitFloorList.map((row, index) => (
                            <li
                              key={index}
                              className="font-mono text-base font-bold text-red-500 hover:text-red-400 transition-colors tracking-wide"
                            >
                              {row.company}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* SUBSECTION 2: TARGET PRICE REACHED */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2 py-1 rounded mb-3 inline-block font-mono">
                        🏆 Target Price Reached
                      </h3>
                      {saleTargetProfitList.length === 0 ? (
                        <p className="text-xs text-gray-600 italic pl-4">
                          No assets reached profit target
                        </p>
                      ) : (
                        <ul className="space-y-2 pl-4 list-disc marker:text-emerald-400">
                          {saleTargetProfitList.map((row, index) => (
                            <li
                              key={index}
                              className="font-mono text-base font-bold text-emerald-400 hover:text-emerald-300 transition-colors tracking-wide"
                            >
                              {row.company}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* BOTTOM BUTTON */}
              <div className="flex justify-center pt-2 border-t border-gray-900 shrink-0">
                <button
                  onClick={onClose}
                  className="px-8 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-mono text-base font-bold rounded-xl transition-all duration-200"
                >
                  Dismiss Profile
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BuySalePopup;