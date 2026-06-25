"use client";
import React from "react";
import Link from "next/link";

export default function FooterComponent() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.85)] mt-24 py-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Logo Column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primaryPink to-primaryIndigo flex items-center justify-center font-bold text-sm text-white">
                E
              </div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Ember
              </span>
            </Link>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              Autonomous non-custodial execution engine on HotStuff L1. Secure, fast, and execution optimized.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs text-gray-500 font-medium">
              <li>
                <Link href="/strategies" className="hover:text-white transition-colors">
                  Strategies
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="hover:text-white transition-colors">
                  Portfolio
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs text-gray-500 font-medium">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2.5 text-xs text-gray-500 font-medium">
              <li>
                <Link href="/legal?tab=terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal?tab=privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="border-t border-[rgba(255,255,255,0.04)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-gray-600 font-medium">
          <div className="flex flex-col gap-2 text-left">
            <div>
              &copy; 2026 Ember. Powered by HotStuff L1 DracoBFT Consensus.
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-2 flex-wrap">
              <span>Built by</span>
              <a 
                href="https://github.com/Lesnak1" 
                target="_blank" 
                rel="noreferrer" 
                className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-primaryPink to-primaryIndigo text-white hover:opacity-95 hover:shadow-lg hover:shadow-primaryPink/20 transition-all tracking-wide"
              >
                Leknax
              </a>
              <span className="text-gray-600 dark:text-gray-500">·</span>
              <span>Discord:</span>
              <span className="font-mono text-primaryIndigo dark:text-indigo-400 font-extrabold bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                kresna6773
              </span>
            </div>
          </div>
          <div className="flex gap-6">
            <a href="https://x.com/tradehotstuff" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">
              Twitter
            </a>
            <a href="https://discord.gg/hotstuff" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
