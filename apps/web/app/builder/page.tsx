"use client";
import React, { useState, useEffect } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { useAuthStore } from "../../lib/store";
import { Shield, Sparkles, TrendingUp, DollarSign } from "lucide-react";
import { encode } from "@msgpack/msgpack";
import { keccak256 } from "viem";
import { API_URL } from "../../lib/config";

export default function BuilderPage() {
  const { isConnected, address } = useAccount();
  const { token } = useAuthStore();
  const { signTypedDataAsync } = useSignTypedData();

  const [brokerAddress, setBrokerAddress] = useState("");
  const [maxFeeRate, setMaxFeeRate] = useState("0.0003"); // default 3 BPS
  const [approvalStatus, setApprovalStatus] = useState<any>(null);
  
  const [claimCollateralId, setClaimCollateralId] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Retrieve current broker status on load
  const fetchStatus = async () => {
    if (!token || !address) return;
    try {
      const res = await fetch(`${API_URL}/portfolio/broker-check?brokerAddress=${brokerAddress || ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApprovalStatus(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isConnected && token) {
      fetchStatus();
    }
  }, [isConnected, token]);

  // Handle Broker Fee Approval Signature (EIP-712 on Frontend)
  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !brokerAddress) {
      setMessage("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const nonce = Date.now();
      
      // EIP-712 parameters
      const domain = {
        name: "HotstuffCore",
        version: "1",
        chainId: 1,
        verifyingContract: "0x1234567890123456789012345678901234567890" as `0x${string}`,
      };

      const types = {
        Action: [
          { name: "source", type: "string" },
          { name: "hash", type: "bytes32" },
          { name: "txType", type: "uint16" },
        ],
      };

      // MessagePack encode & hash
      const action = {
        type: "approveBrokerFee",
        data: {
          broker: brokerAddress,
          maxFeeRate,
          nonce,
        },
      };

      const actionBytes = encode(action);
      const payloadHash = keccak256(actionBytes);

      const message = {
        source: "Testnet", // or Mainnet depending on env
        hash: payloadHash,
        txType: 1207, // Op code for approveBrokerFee
      };

      // Generate EIP-712 Signature using user's connected wallet
      setMessage("Please sign the transaction in your wallet...");
      
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: "Action",
        message,
      });
      
      // Submit approval signature to backend
      const res = await fetch(`${API_URL}/broker/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brokerAddress,
          maxFeeRate,
          nonce,
          signature,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to register broker approval on backend");
      }

      setMessage("Broker fee approved successfully!");
      fetchStatus();
    } catch (err: any) {
      setMessage(`Approval failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Claims
  const handleClaim = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const nonce = Date.now();
      
      const domain = {
        name: "HotstuffCore",
        version: "1",
        chainId: 1,
        verifyingContract: "0x1234567890123456789012345678901234567890" as `0x${string}`,
      };

      const types = {
        Action: [
          { name: "source", type: "string" },
          { name: "hash", type: "bytes32" },
          { name: "txType", type: "uint16" },
        ],
      };

      const action = {
        type: "claimReferralRewards",
        data: {
          collateralId: parseInt(claimCollateralId),
          spot: false,
          nonce,
        },
      };

      const actionBytes = encode(action);
      const payloadHash = keccak256(actionBytes);

      const message = {
        source: "Testnet",
        hash: payloadHash,
        txType: 1210, // Op code for claimReferralRewards
      };

      setMessage("Please sign the Claim transaction in your wallet...");

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: "Action",
        message,
      });

      const res = await fetch(`${API_URL}/broker/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          collateralId: parseInt(claimCollateralId),
          spot: false,
          nonce,
          signature,
        }),
      });

      if (res.ok) {
        setMessage("Claim request relayed successfully! Rewards will land in your account shortly.");
      } else {
        throw new Error("Claim relay failed on backend");
      }
    } catch (err: any) {
      setMessage(`Claim failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20 max-w-xl mx-auto space-y-6">
        <Shield className="w-16 h-16 text-primaryPink mx-auto animate-pulse" />
        <h2 className="text-3xl font-extrabold">Web3 Connection Required</h2>
        <p className="text-gray-400">
          Please connect your Web3 wallet to access the Builder Rewards and broker approvals dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-accentEmerald">
            <Sparkles className="w-4 h-4" />
            Builder Monetization Dashboard
          </div>
          <h2 className="text-3xl font-extrabold">Generate On-Chain Trading Fees</h2>
          <p className="text-gray-400 text-sm max-w-xl">
            Register your builder broker address and assign up to a 1% fee on each user strategy trade. Fully processed on-chain.
          </p>
        </div>
        <div className="flex gap-4 items-center shrink-0">
          <div className="glass-panel rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold">$14,240</div>
            <div className="text-xs text-gray-500 uppercase">Gross Referral Volume</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Approve Broker Form */}
        <div className="glass-panel rounded-2xl p-8 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primaryPink" />
            Approve Broker Authority
          </h3>
          
          <form onSubmit={handleApprove} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Broker (Builder) Public Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={brokerAddress}
                onChange={(e) => setBrokerAddress(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primaryIndigo"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Maximum Fee Rate (0.0001 = 1 BPS)
              </label>
              <select
                value={maxFeeRate}
                onChange={(e) => setMaxFeeRate(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primaryIndigo"
              >
                <option value="0.0001">0.01% (1 BPS)</option>
                <option value="0.0003">0.03% (3 BPS)</option>
                <option value="0.0005">0.05% (5 BPS)</option>
                <option value="0.0010">0.10% (10 BPS)</option>
                <option value="0.0020">0.20% (20 BPS)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primaryPink to-primaryIndigo py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity text-sm shadow-md"
            >
              {isLoading ? "Signing transaction..." : "Approve and Sign"}
            </button>
          </form>
        </div>

        {/* Claim and Status Panel */}
        <div className="glass-panel rounded-2xl p-8 space-y-8 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accentEmerald" />
              Rewards & Claim Portal
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.01)]">
                <div className="text-xs text-gray-400 font-semibold mb-1">Approved Broker</div>
                <div className="text-sm font-mono truncate text-primaryIndigo">
                  {approvalStatus?.broker || "None"}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.01)]">
                <div className="text-xs text-gray-400 font-semibold mb-1">Max Approved Fee</div>
                <div className="text-sm font-bold text-accentEmerald">
                  {approvalStatus?.max_fee_rate ? `${parseFloat(approvalStatus.max_fee_rate) * 100}%` : "0%"}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Collateral Asset ID (USDC = 1)
              </label>
              <input
                type="number"
                value={claimCollateralId}
                onChange={(e) => setClaimCollateralId(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primaryIndigo"
              />
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={isLoading}
            className="w-full border border-accentEmerald text-accentEmerald bg-[rgba(16,185,129,0.03)] py-3.5 rounded-xl font-bold hover:bg-[rgba(16,185,129,0.08)] transition-colors text-sm shadow-md"
          >
            Claim Referral Rewards
          </button>
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
