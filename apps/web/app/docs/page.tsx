"use client";
import React, { useState } from "react";
import { BookOpen, HelpCircle, Code, Shield, HelpCircle as HelpIcon, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");

  const sidebarItems = [
    { id: "introduction", label: "Introduction" },
    { id: "agent-wallet", label: "Agent Configurations" },
    { id: "dca", label: "DCA Automations" },
    { id: "twap", label: "TWAP Order Splits" },
    { id: "grid", label: "Grid Bots" },
  ];

  return (
    <div className="py-12 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-primaryPink" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Ember Documentation</h1>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-between ${
                activeSection === item.id
                  ? "bg-gradient-to-r from-primaryPink to-primaryIndigo text-white shadow-md"
                  : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-150 dark:hover:bg-white/10"
              }`}
            >
              <span>{item.label}</span>
              {activeSection === item.id && <ArrowRight className="w-4 h-4" />}
            </button>
          ))}
        </aside>

        {/* Content View */}
        <main className="lg:col-span-3 glass-panel rounded-3xl p-8 md:p-10 space-y-8 min-h-[500px]">
          {activeSection === "introduction" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Introduction to Ember</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Ember is an autonomous non-custodial automation terminal running directly on the HotStuff L1 blockchain. It allows users to set up advanced algorithmic execution strategies that run 7/24 without needing to keep a browser window open or trust centralized institutions with private keys.
              </p>
              <div className="p-4 rounded-2xl bg-primaryIndigo/5 border border-primaryIndigo/10 text-xs text-primaryIndigo dark:text-indigo-400 leading-relaxed">
                <strong>Consensus Note:</strong> All operations are validated on HotStuff L1 with ultra-low latency (75ms block time), meaning automated actions execute with perfect efficiency and safety.
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Workflow</h3>
              <ol className="list-decimal list-inside space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <li>Connect your Web3 Wallet to the Ember frontend.</li>
                <li>Initialize a local Agent Wallet key with scoped permissions.</li>
                <li>Fund your margin account on HotStuff L1.</li>
                <li>Launch DCA, TWAP, or Grid strategies.</li>
              </ol>
            </div>
          )}

          {activeSection === "agent-wallet" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agent Configurations</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                To execute strategies automatically while you are offline, Ember utilizes a delegated cryptographic keypair called the **Agent Wallet**.
              </p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Security Guarantees</h3>
              <ul className="list-disc list-inside space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <li><strong>No Withdrawals:</strong> The agent can only sign orders (`placeOrder`, `cancelOrder`). It is cryptographically blocked from executing transfers or withdrawals.</li>
                <li><strong>Local Encryption:</strong> The agent keys are generated in your local session and encrypted before backend registration.</li>
                <li><strong>Self-Revocation:</strong> You can revoke agent access instantly directly from the portfolio view.</li>
              </ul>
            </div>
          )}

          {activeSection === "dca" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dollar-Cost Average (DCA)</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Dollar-Cost Averaging allows you to build positions gradually while avoiding the volatility of trying to time the market.
              </p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">How it works</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Specify the asset, interval (e.g., daily, weekly), and investment amount. Every period, Ember's execution engine issues a market order on HotStuff L1 to purchase the asset using your available collateral.
              </p>
            </div>
          )}

          {activeSection === "twap" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Time-Weighted Average Price (TWAP)</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                TWAP is an algorithmic execution model that splits a large trade order into multiple smaller orders (slices) over a defined time window.
              </p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Why use TWAP?</h3>
              <ul className="list-disc list-inside space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <li><strong>Minimize Slippage:</strong> Avoid dumping a large amount of volume into the orderbook at once.</li>
                <li><strong>Maker Rebates:</strong> Because slices are placed progressively, you can capture maker fee rebates on HotStuff L1.</li>
              </ul>
            </div>
          )}

          {activeSection === "grid" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grid Bots</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Grid Bots automate purchase and sales transactions by placing grids of buy and sell limit orders in a defined price range.
              </p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Execution details</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                When the price drops to a buy grid line, the bot executes a buy order and instantly sets a sell order on the grid line above it. Conversely, when the price rises, it sells and places a buy order on the line below. This harvests profits continuously in rangebound sideways markets.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
