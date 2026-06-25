"use client";
import React, { useState, useEffect } from "react";
import { Scale, FileText, ShieldAlert } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  // Sync with query parameters if present (e.g. ?tab=privacy)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "terms" || tab === "privacy") {
        setActiveTab(tab);
      }
    }
  }, []);

  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex items-center gap-3">
        <Scale className="w-8 h-8 text-primaryPink" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Legal Center</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab("terms")}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "terms"
              ? "border-primaryPink text-primaryPink"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Terms of Service
        </button>
        <button
          onClick={() => setActiveTab("privacy")}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "privacy"
              ? "border-primaryPink text-primaryPink"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Privacy Policy
        </button>
      </div>

      {/* View Content */}
      <main className="glass-panel rounded-3xl p-8 md:p-10 space-y-6">
        {activeTab === "terms" ? (
          <div className="space-y-6 text-sm text-gray-500 dark:text-gray-450 leading-relaxed">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primaryIndigo" />
              Terms of Service
            </h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
              Last Updated: June 25, 2026
            </p>

            <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4">1. Non-Custodial Agreement</h3>
            <p>
              Ember is a non-custodial decentralized application frontend. It acts solely as an interface layer facilitating the generation of cryptographic signatures to interact with the HotStuff L1 blockchain exchange. Ember does not hold, manage, or have custody of user collateral, assets, or keys at any point.
            </p>

            <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4">2. Scoped Agent Authority</h3>
            <p>
              When initializing an Agent Wallet, you authorize a secondary, restricted private key to sign specific order transactions on your behalf. While this agent key is blocked from executing withdrawals or transfers on-chain, you acknowledge and agree that you remain entirely responsible for the security of your main wallet and any transactions signed by the agent.
            </p>

            <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4">3. Risk Disclosures</h3>
            <p>
              Automated execution strategies (such as Grids, DCA, and TWAP) run according to instructions set directly by the user. Algorithmic trading carries high risk, including loss of capital, execution errors, network downtime, and slippage. Ember makes no guarantees of trading profitability or safety.
            </p>

            <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4">4. Experimental Technology</h3>
            <p>
              The HotStuff L1 blockchain network and the Ember execution engine are experimental decentralized software projects. You acknowledge and accept all risks associated with blockchain transactions, smart contracts, network forks, and potential technical vulnerabilities.
            </p>
          </div>
        ) : (
          <div className="space-y-6 text-sm text-gray-500 dark:text-gray-450 leading-relaxed">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primaryPink" />
              Privacy Policy
            </h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
              Last Updated: June 25, 2026
            </p>

            <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4">1. Information Collection</h3>
            <p>
              Ember values user privacy above all. We do not collect, store, or log any personally identifiable information (PII). This includes email addresses, real names, phone numbers, or IP addresses.
            </p>

            <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4">2. Local Browser Storage</h3>
            <p>
              We utilize local browser storage (`localStorage`) strictly to preserve client configuration details. This includes user theme preferences (`ember_theme`) and temporary Web3 session authorization tokens to interact with the backend API.
            </p>

            <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4">3. On-Chain Ledger Data</h3>
            <p>
              By using blockchain networks such as HotStuff L1, your public address and all transaction records (such as deploying strategies, depositing collateral, and executing trades) are broadcast to a public ledger. This data is public, permanent, and accessible to anyone.
            </p>
          </div>
        )}
      </main>

      <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-600 dark:text-yellow-400/90 leading-relaxed">
          <strong>Important Security Reminder:</strong> Never share your private keys, seed phrases, or encrypted agent backups with anyone. Ember team members will never ask for your private keys.
        </p>
      </div>
    </div>
  );
}
