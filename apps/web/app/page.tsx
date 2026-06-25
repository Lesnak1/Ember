"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Shield, TrendingUp, Cpu, Activity, Zap, Play, CheckCircle } from "lucide-react";
import { useAuthStore } from "../lib/store";

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"grid" | "twap" | "dca">("grid");
  const [tickerPrice, setTickerPrice] = useState(100.5);
  const [orderLogs, setOrderLogs] = useState<Array<{ id: number; text: string; type: "buy" | "sell" | "info" }>>([
    { id: 1, text: "Ember Engine Initialized", type: "info" },
    { id: 2, text: "Listening to HotStuff L1 Block Stream", type: "info" },
  ]);

  // Simulate price action for Grid Bot visualizer
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPrice((prev) => {
        const change = (Math.random() - 0.5) * 1.2;
        const newPrice = Math.min(Math.max(prev + change, 97.5), 103.5);
        
        // Randomly simulate order fills when price crosses round numbers
        const rounded = Math.round(newPrice);
        if (Math.abs(newPrice - rounded) < 0.1 && Math.random() > 0.6) {
          const isBuy = change < 0;
          const logText = isBuy 
            ? `Buy Order Filled: 1.5 ETH @ $${rounded.toFixed(2)}` 
            : `Sell Order Filled: 1.5 ETH @ $${rounded.toFixed(2)}`;
          setOrderLogs((logs) => [
            { id: Date.now(), text: logText, type: isBuy ? "buy" : "sell" },
            ...logs.slice(0, 4),
          ]);
        }
        return newPrice;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <div className="grid lg:grid-cols-12 gap-12 items-center max-w-7xl mx-auto">
        <div className="lg:col-span-7 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primaryIndigo/20 bg-primaryIndigo/5 text-primaryIndigo dark:text-indigo-400 text-xs font-semibold tracking-wide">
            <Cpu className="w-4 h-4 text-primaryPink animate-pulse" />
            HotStuff L1 DracoBFT Consensus Integration Live
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-gray-900 dark:text-white">
            Wall Street Sleeps. <br />
            <span className="bg-gradient-to-r from-primaryPink via-purple-500 to-primaryIndigo bg-clip-text text-transparent">
              Ember Never Does.
            </span>
          </h1>
          
          <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed">
            Deploy 7/24 automated trading grids, TWAP execution splits, and DCA index autopilots on HotStuff's tokenized stocks, crypto, and RWAs. Fully non-custodial.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/strategies"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-primaryPink to-primaryIndigo hover:opacity-95 transition-all font-bold text-white shadow-lg shadow-primaryIndigo/20 flex items-center justify-center gap-2"
            >
              Launch Autopilots
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/builder"
              className="px-8 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-colors font-bold flex items-center justify-center"
            >
              Builder Rewards
            </Link>
          </div>
        </div>

        {/* Live SVG Animated Graphic Component */}
        <div className="lg:col-span-5 w-full flex justify-center">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            {/* Visualizer header */}
            <div className="flex items-center justify-between mb-6 border-b border-gray-250 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accentEmerald animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Ember Live Simulation
                </span>
              </div>
              <div className="text-xs font-mono bg-gray-150 dark:bg-white/10 px-2.5 py-1 rounded-md text-gray-800 dark:text-gray-300">
                L1 Block: 104,821
              </div>
            </div>

            {/* Graphic Tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { id: "grid", label: "Grid Bot" },
                { id: "twap", label: "TWAP Split" },
                { id: "dca", label: "DCA Cycle" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-primaryPink to-primaryIndigo text-white shadow-md"
                      : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Interactive SVG Animation Frames */}
            <div className="relative h-64 bg-gray-900/60 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/5">
              {activeTab === "grid" && (
                <svg className="w-full h-full" viewBox="0 0 400 240">
                  {/* Grid Lines */}
                  {/* Sell grids (red) */}
                  <line x1="20" y1="50" x2="380" y2="50" stroke="#ff3366" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                  <text x="30" y="44" fill="#ff3366" fontSize="9" className="font-mono">Sell Limit 3: $103.00</text>
                  <line x1="20" y1="80" x2="380" y2="80" stroke="#ff3366" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                  <text x="30" y="74" fill="#ff3366" fontSize="9" className="font-mono">Sell Limit 2: $101.50</text>
                  
                  {/* Center Line */}
                  <line x1="20" y1="120" x2="380" y2="120" stroke="#6366f1" strokeWidth="1.5" opacity="0.4" />
                  <text x="320" y="114" fill="#6366f1" fontSize="9" className="font-mono">Pivot: $100.00</text>

                  {/* Buy grids (green) */}
                  <line x1="20" y1="160" x2="380" y2="160" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                  <text x="30" y="154" fill="#10b981" fontSize="9" className="font-mono">Buy Limit 1: $98.50</text>
                  <line x1="20" y1="190" x2="380" y2="190" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                  <text x="30" y="184" fill="#10b981" fontSize="9" className="font-mono">Buy Limit 2: $97.00</text>

                  {/* Price wave animation */}
                  <path
                    d="M 20,120 Q 80,60 140,160 T 260,70 T 380,130"
                    fill="none"
                    stroke="url(#price-gradient)"
                    strokeWidth="2.5"
                    className="opacity-70"
                  />

                  {/* Floating current price marker */}
                  <g className="animate-price-float" style={{ transformBox: "fill-box" }}>
                    <circle cx="200" cy="120" r="7" fill="#ff3366" className="animate-pulse" />
                    <circle cx="200" cy="120" r="16" fill="none" stroke="#ff3366" strokeWidth="1" className="animate-signal-pulse" />
                    <rect x="220" y="105" width="65" height="24" rx="6" fill="#1e1e2f" stroke="rgba(255,51,102,0.4)" strokeWidth="1" />
                    <text x="228" y="121" fill="#fff" fontSize="10" fontWeight="bold" className="font-mono">
                      ${tickerPrice.toFixed(2)}
                    </text>
                  </g>

                  {/* Definitions */}
                  <defs>
                    <linearGradient id="price-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#ff3366" />
                    </linearGradient>
                  </defs>
                </svg>
              )}

              {activeTab === "twap" && (
                <svg className="w-full h-full" viewBox="0 0 400 240">
                  {/* Parent order block */}
                  <rect x="30" y="85" width="70" height="70" rx="12" fill="url(#purple-grad)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <text x="44" y="115" fill="#fff" fontSize="10" fontWeight="bold">Parent</text>
                  <text x="48" y="132" fill="#fff" fontSize="10" fontWeight="bold">Order</text>
                  <text x="40" y="148" fill="rgba(255,255,255,0.6)" fontSize="8" className="font-mono">100 ETH</text>

                  {/* Flow lines */}
                  <path d="M 100,120 L 220,60" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="3" />
                  <path d="M 100,120 L 220,120" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="3" />
                  <path d="M 100,120 L 220,180" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="3" />

                  {/* Animated flow dots */}
                  <path d="M 100,120 L 220,60" fill="none" stroke="#ff3366" strokeWidth="3" className="animate-order-flow" />
                  <path d="M 100,120 L 220,120" fill="none" stroke="#6366f1" strokeWidth="3" className="animate-order-flow" style={{ animationDelay: "1s" }} />
                  <path d="M 100,120 L 220,180" fill="none" stroke="#10b981" strokeWidth="3" className="animate-order-flow" style={{ animationDelay: "2s" }} />

                  {/* Sliced execution orders */}
                  <g>
                    <rect x="220" y="45" width="130" height="30" rx="8" fill="#1a1a2e" stroke="rgba(255,51,102,0.3)" strokeWidth="1" />
                    <text x="230" y="64" fill="#fff" fontSize="9" fontWeight="semibold">Slice #1: 33.3 ETH</text>
                    <text x="312" y="64" fill="#10b981" fontSize="8" className="font-mono">Filled</text>

                    <rect x="220" y="105" width="130" height="30" rx="8" fill="#1a1a2e" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
                    <text x="230" y="124" fill="#fff" fontSize="9" fontWeight="semibold">Slice #2: 33.3 ETH</text>
                    <text x="304" y="124" fill="#6366f1" fontSize="8" className="font-mono animate-pulse">Pending</text>

                    <rect x="220" y="165" width="130" height="30" rx="8" fill="#1a1a2e" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <text x="230" y="184" fill="rgba(255,255,255,0.4)" fontSize="9">Slice #3: 33.3 ETH</text>
                    <text x="312" y="184" fill="rgba(255,255,255,0.3)" fontSize="8">15m</text>
                  </g>

                  {/* Definitions */}
                  <defs>
                    <linearGradient id="purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff3366" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
              )}

              {activeTab === "dca" && (
                <svg className="w-full h-full" viewBox="0 0 400 240">
                  {/* Clock / Cycle indicator */}
                  <g className="animate-dca-rotate">
                    <circle cx="200" cy="120" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <circle cx="200" cy="120" r="70" fill="none" stroke="url(#dca-grad)" strokeWidth="4" strokeDasharray="100 120" />
                    
                    <circle cx="200" cy="50" r="8" fill="#ff3366" />
                    <circle cx="200" cy="190" r="8" fill="#10b981" />
                  </g>

                  {/* Core stats panel */}
                  <rect x="145" y="85" width="110" height="70" rx="16" fill="#151524" stroke="rgba(99,102,241,0.2)" strokeWidth="1.5" />
                  <text x="175" y="108" fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="semibold">INTERVAL</text>
                  <text x="170" y="128" fill="#fff" fontSize="13" fontWeight="extrabold">24 Hours</text>
                  <text x="180" y="145" fill="#10b981" fontSize="9" fontWeight="bold">DCA Active</text>

                  {/* Incoming assets */}
                  <g>
                    <circle cx="60" cy="60" r="20" fill="#1a1a2e" stroke="rgba(255,255,255,0.1)" />
                    <text x="49" y="63" fill="#fff" fontSize="9" fontWeight="bold">USDC</text>
                    
                    <path d="M 80,60 Q 130,60 145,95" fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="2" strokeDasharray="4 4" />
                  </g>

                  {/* Outgoing assets */}
                  <g>
                    <circle cx="340" cy="180" r="20" fill="#1a1a2e" stroke="rgba(255,255,255,0.1)" />
                    <text x="331" y="183" fill="#fff" fontSize="9" fontWeight="bold">rETH</text>
                    
                    <path d="M 255,145 Q 270,180 320,180" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="2" strokeDasharray="4 4" />
                  </g>

                  <defs>
                    <linearGradient id="dca-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff3366" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>

            {/* Simulation Logger */}
            <div className="space-y-2 mt-4 bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-250 dark:border-white/5 max-h-28 overflow-y-auto">
              {orderLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-center text-[10px] font-mono leading-tight">
                  <span className={`${
                    log.type === "buy" ? "text-accentEmerald" : log.type === "sell" ? "text-primaryPink" : "text-gray-400"
                  }`}>
                    {log.text}
                  </span>
                  <span className="text-[8px] text-gray-500">Just Now</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto">
        {[
          { label: "Target Monthly Vol", value: "$50M+" },
          { label: "Maker Rebate Target", value: "-0.002%" },
          { label: "L1 Block Time", value: "75ms" },
          { label: "Builder Rewards Pool", value: "2M Pts" },
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-6 text-center neon-border-indigo transition-all duration-300 hover:scale-[1.02]">
            <div className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 mt-2 font-semibold uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Premium Trading Suite</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
            Leveraging HotStuff's single collateral cross-asset margin accounts for advanced automation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Bot,
              title: "DCA / Recurring Invest",
              desc: "Automate tokenized stock, crypto, and ETF purchases at regular intervals. Sleep through market volatility.",
              color: "border-primaryPink",
            },
            {
              icon: Cpu,
              title: "Smart TWAP & Execution",
              desc: "Slice massive orders over time to capture maker rebates, minimize slippage, and optimize transaction costs.",
              color: "border-purple-500",
            },
            {
              icon: TrendingUp,
              title: "Grid Bots",
              desc: "Capture rangebound sideways movement by layering buy and sell limit grids, collecting constant flow 7/24.",
              color: "border-primaryIndigo",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="glass-panel-interactive rounded-2xl p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-primaryIndigo/5 border border-primaryIndigo/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primaryIndigo" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Info Panel */}
      <div className="glass-panel rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 max-w-6xl mx-auto">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-accentEmerald">
            <Shield className="w-4 h-4" />
            100% Non-Custodial Security Model
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            We sign orders. We never touch your funds.
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Using scoped Agent wallets on-chain, Ember can place and cancel orders based on your strategy rules. Withdrawals, transfers, and general configuration modifications are strictly unauthorized.
          </p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 shrink-0">
          <Link
            href="/strategies"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primaryPink to-primaryIndigo text-white hover:opacity-90 transition-opacity font-bold text-center text-sm shadow-md"
          >
            Create Agent Wallet
          </Link>
        </div>
      </div>
    </div>
  );
}
