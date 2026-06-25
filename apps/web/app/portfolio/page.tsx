"use client";
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAuthStore } from "../../lib/store";
import { Wallet, ShieldAlert, Layers, RefreshCw } from "lucide-react";
import { API_URL } from "../../lib/config";

export default function PortfolioPage() {
  const { isConnected } = useAccount();
  const { token } = useAuthStore();

  const [summary, setSummary] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchPortfolioData = async () => {
    if (!token) return;
    setLoading(true);
    setMessage("");
    try {
      // 1. Fetch Account Summary
      const sumRes = await fetch(`${API_URL}/portfolio/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sumRes.ok) {
        const data = await sumRes.json();
        setSummary(data);
      }

      // 2. Fetch Open Positions
      const posRes = await fetch(`${API_URL}/portfolio/positions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (posRes.ok) {
        const data = await posRes.json();
        setPositions(data || []);
      }

      // 3. Fetch Open Orders
      const ordRes = await fetch(`${API_URL}/portfolio/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ordRes.ok) {
        const data = await ordRes.json();
        setOrders(data || []);
      }
    } catch (err: any) {
      setMessage(`Failed to refresh portfolio: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && token) {
      fetchPortfolioData();
    }
  }, [isConnected, token]);

  if (!isConnected) {
    return (
      <div className="text-center py-20 max-w-xl mx-auto space-y-6">
        <Wallet className="w-16 h-16 text-primaryPink mx-auto animate-pulse" />
        <h2 className="text-3xl font-extrabold">Web3 Connection Required</h2>
        <p className="text-gray-400">Please connect your Web3 wallet to access your HotStuff portfolio stats.</p>
      </div>
    );
  }

  // Calculate default layout fields in case API returns mock/null
  const equity = summary?.total_account_equity || "0.00";
  const available = summary?.available_balance || "0.00";
  const marginUtilization = summary?.maintenance_margin_utilization || "0.0";
  const totalVolume = summary?.total_volume || "0";

  return (
    <div className="space-y-12">
      {/* Portfolio Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold">Margin Account Summary</h2>
        <button
          onClick={fetchPortfolioData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] transition-colors text-sm font-semibold text-gray-300"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Stats
        </button>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Account Equity (USDC)", value: `$${equity}` },
          { label: "Available Collateral", value: `$${available}` },
          { label: "Margin Health Utilization", value: `${marginUtilization}%`, warn: parseFloat(marginUtilization) > 80 },
          { label: "Total Trading Volume", value: `$${totalVolume}` },
        ].map((card, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
              {card.label}
            </div>
            <div className={`text-2xl font-extrabold ${card.warn ? "text-primaryPink" : ""}`}>
              {card.value}
            </div>
            {card.warn && (
              <div className="absolute top-2 right-2 text-primaryPink">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Positions & Open Orders Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Positions Section */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-8 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primaryPink" />
            Active Perpetual Positions
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-gray-500">
                  <th className="pb-3 font-semibold">Instrument</th>
                  <th className="pb-3 font-semibold text-right">Size</th>
                  <th className="pb-3 font-semibold text-right">Entry Price</th>
                  <th className="pb-3 font-semibold text-right">Mark Price</th>
                  <th className="pb-3 font-semibold text-right">uPnL</th>
                </tr>
              </thead>
              <tbody>
                {positions.length > 0 ? (
                  positions.map((pos, idx) => (
                    <tr key={idx} className="border-b border-[rgba(255,255,255,0.03)] last:border-0 hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                      <td className="py-4 font-bold">{pos.instrumentName || `Asset ${pos.instrumentId}`}</td>
                      <td className={`py-4 text-right font-semibold ${parseFloat(pos.size) > 0 ? "text-accentEmerald" : "text-primaryPink"}`}>
                        {pos.size}
                      </td>
                      <td className="py-4 text-right font-mono">${pos.entryPrice}</td>
                      <td className="py-4 text-right font-mono">${pos.markPrice}</td>
                      <td className={`py-4 text-right font-extrabold ${parseFloat(pos.upnl) >= 0 ? "text-accentEmerald" : "text-primaryPink"}`}>
                        {parseFloat(pos.upnl) >= 0 ? `+$${pos.upnl}` : `-$${Math.abs(pos.upnl)}`}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500 font-medium">
                      No active perpetual positions detected on L1.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open Orders Section */}
        <div className="glass-panel rounded-2xl p-8 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primaryIndigo" />
            Working Limit Orders
          </h3>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {orders.length > 0 ? (
              orders.map((ord, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[rgba(0,0,0,0.15)] flex justify-between items-center text-sm">
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      <span className={ord.side === "b" ? "text-accentEmerald" : "text-primaryPink"}>
                        {ord.side === "b" ? "BUY" : "SELL"}
                      </span>
                      <span>Asset {ord.instrumentId}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">TIF: {ord.tif} · PO: {ord.po ? "Yes" : "No"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono">${ord.price}</div>
                    <div className="text-xs text-gray-400">Size: {ord.size}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-gray-500 text-sm font-medium">
                No working limit orders.
              </div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(18,18,28,0.6)] text-center text-sm font-medium">
          {message}
        </div>
      )}
    </div>
  );
}
