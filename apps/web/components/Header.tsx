"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect, useSignMessage, useChainId } from "wagmi";
import { SiweMessage, generateNonce } from "siwe";
import { useAuthStore } from "../lib/store";
import { API_URL } from "../lib/config";
import { Sun, Moon, Menu, X } from "lucide-react";
import { encode } from "@msgpack/msgpack";
import { keccak256 } from "viem";

export default function HeaderComponent() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const activeChainId = useChainId();
  
  const { token, userAddress, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isSigning, setIsSigning] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("ember_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      document.documentElement.className = "dark";
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("ember_theme", nextTheme);
    document.documentElement.className = nextTheme;
  };

  // Trigger SIWE signing when user connects wallet but is not logged in
  useEffect(() => {
    const runSiwe = async () => {
      if (isConnected && address && (!isAuthenticated || userAddress?.toLowerCase() !== address.toLowerCase())) {
        try {
          setIsSigning(true);
          const nonce = generateNonce();
          
          // 1. Generate challenge message
          const rawMessage = new SiweMessage({
            domain: window.location.host,
            address: address,
            statement: "Sign in with Ethereum to authorize Ember automation terminal.",
            uri: window.location.origin,
            version: "1",
            chainId: activeChainId,
            nonce,
          });

          const messageText = rawMessage.prepareMessage();
          
          // 2. Sign raw SIWE text message with a 30-second timeout to prevent extension hang crashes
          const signaturePromise = signMessageAsync({
            message: messageText,
          });
          const timeoutPromise = new Promise<`0x${string}`>((_, reject) =>
            setTimeout(() => reject(new Error("Signature request timed out (possible wallet/extension conflict)")), 30000)
          );
          const signature = await Promise.race([signaturePromise, timeoutPromise]);

          // 3. Authenticate with backend
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: address,
              message: messageText,
              signature: signature,
            }),
          });

          if (!res.ok) {
            throw new Error("Backend authentication failed");
          }

          const data = await res.json();
          // 4. Save credentials
          setAuth(data.token, address, data.user.id);
        } catch (err: any) {
          console.error("SIWE Login failed:", err);
          const errMsg = err.message || "";
          if (
            errMsg.includes("not authorized") ||
            errMsg.includes("UnauthorizedProviderError") ||
            errMsg.includes("4100") ||
            errMsg.includes("ConnectorChainMismatchError")
          ) {
            alert("Wallet Connection Conflict:\nPlease disable competing wallet extensions (such as Backpack, Phantom, or Rabby) in your browser settings and keep only MetaMask enabled. Multiple active extensions hijack the provider and block transaction signing.");
          }
          disconnect();
          clearAuth();
        } finally {
          setIsSigning(false);
        }
      }
    };

    runSiwe();
  }, [isConnected, address, isAuthenticated, userAddress]);

  // Clean state if disconnected
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      clearAuth();
    }
  }, [isConnected]);

  return (
    <header className="border-b border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white/80 dark:bg-[rgba(10,10,15,0.8)] sticky top-0 z-50 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primaryPink to-primaryIndigo flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-[rgba(99,102,241,0.25)]">
                E
              </div>
              <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Ember
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/strategies" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-sm font-semibold">
                Strategies
              </Link>
              <Link href="/portfolio" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-sm font-semibold">
                Portfolio
              </Link>
              <Link href="/about" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-sm font-semibold">
                About
              </Link>
              <Link href="/docs" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-sm font-semibold">
                Docs
              </Link>
            </nav>
          </div>

          {/* Action Tools (Theme, Connect) */}
          <div className="flex items-center gap-4">
            {isSigning && (
              <span className="hidden sm:inline text-xs text-primaryPink animate-pulse font-medium">
                Requesting signature...
              </span>
            )}

            {/* Light/Dark Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] bg-gray-50 dark:bg-[rgba(255,255,255,0.02)] hover:bg-gray-100 dark:hover:bg-[rgba(255,255,255,0.05)] transition-colors text-gray-700 dark:text-gray-300"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Connect Wallet Trigger */}
            <div className="hidden sm:block">
              <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
            </div>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2.5 rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] bg-gray-50 dark:bg-[rgba(255,255,255,0.02)] text-gray-700 dark:text-gray-300"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slideout Drawer */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-darkBg px-4 pt-4 pb-6 space-y-4 shadow-xl transition-colors duration-200">
          <nav className="flex flex-col gap-4">
            <Link
              href="/strategies"
              onClick={() => setIsMobileOpen(false)}
              className="text-gray-600 dark:text-gray-350 hover:text-gray-900 dark:hover:text-white font-semibold text-sm py-1"
            >
              Strategies
            </Link>
            <Link
              href="/portfolio"
              onClick={() => setIsMobileOpen(false)}
              className="text-gray-600 dark:text-gray-350 hover:text-gray-900 dark:hover:text-white font-semibold text-sm py-1"
            >
              Portfolio
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileOpen(false)}
              className="text-gray-600 dark:text-gray-350 hover:text-gray-900 dark:hover:text-white font-semibold text-sm py-1"
            >
              About Ember
            </Link>
            <Link
              href="/docs"
              onClick={() => setIsMobileOpen(false)}
              className="text-gray-600 dark:text-gray-350 hover:text-gray-900 dark:hover:text-white font-semibold text-sm py-1"
            >
              Documentation
            </Link>
          </nav>
          
          <div className="pt-4 border-t border-gray-100 dark:border-[rgba(255,255,255,0.04)] flex justify-center">
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
          </div>
        </div>
      )}
    </header>
  );
}
