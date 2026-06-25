"use client";
import React from "react";
import { Users, Shield, Cpu, Zap, Award, BookOpen } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="space-y-16 py-12 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          About{" "}
          <span className="bg-gradient-to-r from-primaryPink to-primaryIndigo bg-clip-text text-transparent">
            Ember
          </span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Ember is a premium, non-custodial automated execution terminal built directly on top of the high-performance HotStuff L1 blockchain.
        </p>
      </div>

      {/* Hero Image / Animated graphic container */}
      <div className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-xl">
        <div className="space-y-6 md:w-3/5">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Our Vision</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Automated trading has historically forced users into a compromise: either give custody of your private keys to centralized servers (risking hacks and failures) or handle complex smart contracts manually.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Ember solves this through the implementation of delegated agent keys verified by the HotStuff L1 exchange. By using scoped on-chain permissions, our execution engine places, cancels, and adjusts orders on your behalf while you retain 100% custody of your assets.
          </p>
        </div>
        <div className="md:w-2/5 w-full flex justify-center">
          <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-primaryPink to-primaryIndigo p-0.5 animate-dca-rotate">
            <div className="w-full h-full rounded-full bg-white dark:bg-darkBg flex flex-col items-center justify-center text-center p-4">
              <Cpu className="w-12 h-12 text-primaryIndigo mb-2" />
              <span className="text-xs font-bold text-gray-900 dark:text-white">DracoBFT</span>
              <span className="text-[10px] text-gray-400">75ms Block Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Principles Grid */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Core Pillars</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: "Absolute Custody",
              desc: "Ember never holds your funds. All trades execute via scoped agent signing permissions. Withdrawals are cryptographically blocked for agents.",
            },
            {
              icon: Zap,
              title: "Lightning Speed",
              desc: "Engineered on HotStuff L1 with consensus times averaging 75ms. Get sub-second limit order execution and instant grid updates.",
            },
            {
              icon: Award,
              title: "Algorithmic Precision",
              desc: "Minimize execution slippage and optimize entry points using mathematical DCA distribution and TWAP slice algorithms.",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="glass-panel rounded-2xl p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-primaryIndigo/5 border border-primaryIndigo/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primaryIndigo" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Actions */}
      <div className="text-center py-6">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primaryPink to-primaryIndigo text-white font-bold text-sm shadow-md hover:opacity-95 transition-opacity"
        >
          Read the Documentation
          <BookOpen className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
