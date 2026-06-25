"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useAccount, useDisconnect, useSignMessage, useChainId, useConnect, useSwitchChain } from "wagmi";
import { SiweMessage, generateNonce } from "siwe";
import { useAuthStore } from "../lib/store";
import { API_URL } from "../lib/config";
import { Sun, Moon, Menu, X } from "lucide-react";



export default function HeaderComponent() {
  const { address, isConnected, connector } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const activeChainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const injectedConnector = connectors.find((c) => c.type === "injected") ?? connectors[0];
  const { switchChainAsync } = useSwitchChain();
  
  const { token, userAddress, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isSigning, setIsSigning] = useState(false);
  const signingRef = useRef(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [targetChainId, setTargetChainId] = useState<number>(11155111); // Defaults to Sepolia (11155111)

  // Fetch target chain ID dynamically from backend on mount
  useEffect(() => {
    fetch(`${API_URL}/broker/config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.chainId) {
          setTargetChainId(data.chainId);
        }
      })
      .catch((err) => console.error("Failed to fetch chain ID from backend:", err));
  }, []);

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

  // Core SIWE authentication flow
  const runSiwe = useCallback(async () => {
    // Guard: must be connected with an address
    if (!isConnected || !address) return;

    // Guard: if already signed in with this address, skip
    if (isAuthenticated && userAddress?.toLowerCase() === address.toLowerCase()) return;

    // Guard: wrong chain — verify the actual chain ID of the connector/wallet directly
    if (connector) {
      try {
        const actualWalletChainId = await connector.getChainId();
        if (actualWalletChainId !== targetChainId) {
          try {
            await switchChainAsync({ chainId: targetChainId as any });
            // Give the wallet a moment to switch and update
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (switchErr) {
            console.error("Programmatic switch failed, will check manual switch:", switchErr);
          }

          // Verify if it actually switched successfully
          const postSwitchChainId = await connector.getChainId();
          if (postSwitchChainId !== targetChainId) {
            alert(`Network Mismatch:\nPlease open your wallet extension (MetaMask or Razor Wallet) and manually switch your network to Ethereum Sepolia (Chain ID: 11155111). Currently connected to Chain ID: ${postSwitchChainId}.`);
            disconnect();
            return;
          }
        }
      } catch (err: any) {
        console.error("Failed to verify/switch wallet chain ID:", err);
        disconnect();
        return;
      }
    }

    // Guard: prevent concurrent signing
    if (signingRef.current) return;

    try {
      signingRef.current = true;
      setIsSigning(true);
      const nonce = generateNonce();
      
      const rawMessage = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: "Sign in with Ethereum to authorize Ember automation terminal.",
        uri: window.location.origin,
        version: "1",
        chainId: targetChainId,
        nonce,
      });

      const messageText = rawMessage.prepareMessage();
      
      // Sign with a 30-second timeout
      const signaturePromise = signMessageAsync({ message: messageText });
      const timeoutPromise = new Promise<`0x${string}`>((_, reject) =>
        setTimeout(() => reject(new Error("Signature request timed out")), 30000)
      );
      const signature = await Promise.race([signaturePromise, timeoutPromise]);

      // Authenticate with backend (15-second timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            address: address,
            message: messageText,
            signature: signature,
          }),
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error("Backend authentication failed");
        }

        const data = await res.json();
        setAuth(data.token, address, data.user.id);
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        throw fetchErr;
      }
    } catch (err: any) {
      console.error("SIWE Login failed:", err);
      const errMsg = err.message || "";
      if (
        errMsg.includes("not authorized") ||
        errMsg.includes("UnauthorizedProviderError") ||
        errMsg.includes("4100") ||
        errMsg.includes("ConnectorChainMismatchError")
      ) {
        alert("Wallet Connection Conflict:\nPlease disable competing wallet extensions (such as Backpack, Phantom, or Rabby) in your browser settings and keep only MetaMask enabled.");
      }
      disconnect();
      clearAuth();
    } finally {
      signingRef.current = false;
      setIsSigning(false);
    }
  }, [isConnected, address, connector, isAuthenticated, userAddress, activeChainId, targetChainId, switchChainAsync, signMessageAsync, disconnect, clearAuth, setAuth]);

  // Trigger SIWE when connection state or chain changes
  useEffect(() => {
    runSiwe();
  }, [runSiwe]);

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
              {isConnected && address ? (
                <button
                  onClick={() => disconnect()}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[rgba(255,255,255,0.02)] hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.06)] text-gray-800 dark:text-gray-200 text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {address.slice(0, 6) + "..." + address.slice(-4)}
                </button>
              ) : (
                <button
                  disabled={isPending}
                  onClick={() => injectedConnector && connect({ connector: injectedConnector })}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primaryPink to-primaryIndigo hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold tracking-wide transition-all shadow-md flex items-center gap-2"
                >
                  {isPending ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
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
          
          <div className="pt-4 border-t border-gray-100 dark:border-[rgba(255,255,255,0.04)] flex justify-center w-full">
            {isConnected && address ? (
              <button
                onClick={() => disconnect()}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[rgba(255,255,255,0.02)] text-gray-800 dark:text-gray-200 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Disconnect ({address.slice(0, 6) + "..." + address.slice(-4)})
              </button>
            ) : (
              <button
                disabled={isPending}
                onClick={() => injectedConnector && connect({ connector: injectedConnector })}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primaryPink to-primaryIndigo text-white text-sm font-bold shadow-md"
              >
                {isPending ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
