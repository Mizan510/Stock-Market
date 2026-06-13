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
        let userId = null;
        const authStr = localStorage.getItem("auth");
        if (authStr) {
          const auth = JSON.parse(authStr);
          userId = auth?.id || null;
        }

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

        // 🔴 [PROCESSING FOR SALE ZONE]
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

    const fetchInterval = setInterval(fetchAllData, 300000);
    fetchAllData();
    return () => clearInterval(fetchInterval);
  }, [isOpen]);

  if (!isOpen) return null;

  const greenBuyList = buyRows.filter((row) => {
    const closePriceNum = parseNumber(row.closingPrice);
    const buyZone = calcZone(row.low, row.high, row.buyPercent);
    return (
      closePriceNum !== undefined &&
      buyZone !== undefined &&
      closePriceNum <= buyZone
    );
  });

  const saleExitFloorList = saleRows.filter(
    (t) => t.closingPrice !== null && t.closingPrice <= t.slPrice,
  );

  const saleTargetProfitList = saleRows.filter(
    (t) => t.closingPrice !== null && t.closingPrice >= t.tpPrice,
  );

  return (
    <>
      <style>{`
        @keyframes strongGreenBlink {
          0%, 100% { opacity: 1; text-shadow: 0 0 8px rgba(16, 185, 129, 0.6); }
          50% { opacity: 0.3; text-shadow: none; }
        }
        @keyframes strongRoseBlink {
          0%, 100% { opacity: 1; text-shadow: 0 0 8px rgba(244, 63, 94, 0.6); }
          50% { opacity: 0.3; text-shadow: none; }
        }
        .animate-strong-green-blink {
          animation: strongGreenBlink 1.2s ease-in-out infinite;
        }
        .animate-strong-rose-blink {
          animation: strongRoseBlink 1.2s ease-in-out infinite;
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-screen bg-gray-950 border-y border-gray-900 rounded-none text-white min-h-[70vh] max-h-[90vh] flex flex-col justify-between shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ক্লোজ বাটন */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-500 hover:text-white transition-colors text-base font-bold z-20"
          >
            ✕
          </button>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-1.5 py-6">
              <span className="w-5 h-5 border-2 border-emerald-500 border-r-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-mono tracking-wider">Syncing Portfolio Matrices...</p>
            </div>
          ) : (
            <>
              {/* মেইন গ্রিড লেআউট: ২ পাশে গ্রিন ও রেড ব্যাকগ্রাউন্ড মিক্স */}
              <div className="grid grid-cols-2 divide-x divide-gray-900 flex-1 overflow-hidden">
                
                {/* 🟢 LEFT SIDE: BUY ZONE (হালকা গ্রিন টিন্ট ব্যাকগ্রাউন্ড) */}
                <div className="p-4 pr-3 bg-emerald-950/30 flex flex-col overflow-hidden">
                  <div className="mb-2 pb-1 border-b border-emerald-900/30">
                    <h2 className="text-xl font-bold text-emerald-400 font-mono tracking-wide flex items-center gap-1.5">
                      <span className="text-xs">🟢</span> Buy Zone
                    </h2>
                    <span className="block text-[12px] font-bold text-emerald-500/90 font-mono tracking-wider mt-0.5 pl-5 uppercase animate-strong-green-blink">
                      Ready for Buy
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    {greenBuyList.length === 0 ? (
                      <p className="text-[11px] text-gray-600 italic pl-5">
                        No assets detected in buy zone
                      </p>
                    ) : (
                      <ul className="space-y-1 pl-5 list-disc marker:text-emerald-500 marker:text-[10px]">
                        {greenBuyList.map((row, index) => (
                          <li
                            key={index}
                            className="font-mono text-[14px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors tracking-normal"
                          >
                            {row.company}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* 🔴 RIGHT SIDE: SALE ZONE (হালকা রেড টিন্ট ব্যাকগ্রাউন্ড) */}
                <div className="p-4 pl-3 bg-rose-950/30 flex flex-col overflow-hidden gap-3">
                  <div className="mb-2 pb-1 border-b border-rose-900/30">
                    <h2 className="text-xl font-bold text-rose-400 font-mono tracking-wide flex items-center gap-1.5 shrink-0">
                      <span className="text-xs">🔴</span> Sale Zone
                    </h2>
                    <span className="block text-[12px] font-bold text-rose-400/90 font-mono tracking-wider mt-0.5 pl-5 uppercase animate-strong-rose-blink">
                      Ready for Sale
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                    {/* SUBSECTION 1: STOP LOSS */}
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/30 border border-red-900/40 px-1.5 py-0.5 rounded mb-1.5 inline-block font-mono">
                        🚨 3% Price Reached
                      </h3>
                      {saleExitFloorList.length === 0 ? (
                        <p className="text-[11px] text-gray-600 italic pl-2">
                          No assets reached stop-loss floor
                        </p>
                      ) : (
                        <ul className="space-y-1 pl-4 list-disc marker:text-red-500 marker:text-[10px]">
                          {saleExitFloorList.map((row, index) => (
                            <li
                              key={index}
                              className="font-mono text-[14px] font-medium text-red-400 hover:text-red-300 transition-colors tracking-normal"
                            >
                              {row.company}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* SUBSECTION 2: TARGET PROFIT */}
                    <div>
                      <h3 className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-1.5 py-0.5 rounded mb-1.5 inline-block font-mono">
                        🏆 Target Price Reached
                      </h3>
                      {saleTargetProfitList.length === 0 ? (
                        <p className="text-[11px] text-gray-600 italic pl-2">
                          No assets reached profit target
                        </p>
                      ) : (
                        <ul className="space-y-1 pl-4 list-disc marker:text-emerald-400 marker:text-[10px]">
                          {saleTargetProfitList.map((row, index) => (
                            <li
                              key={index}
                              className="font-mono text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors tracking-normal"
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
              <div className="flex justify-center p-2 bg-gray-950 border-t border-gray-900 shrink-0">
                <button
                  onClick={onClose}
                  className="w-full max-w-xs py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white font-mono text-xs font-semibold rounded-lg transition-all duration-200"
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