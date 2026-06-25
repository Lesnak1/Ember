"use client";
import React, { useState, useEffect } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { useAuthStore } from "../../lib/store";
import { Bot, Play, Pause, Trash2, Cpu, Shield, PlusCircle, CheckCircle } from "lucide-react";
import { encode } from "@msgpack/msgpack";
import { keccak256 } from "viem";
import { API_URL } from "../../lib/config";

export default function StrategiesPage() {
  const { isConnected, address } = useAccount();
  const { token } = useAuthStore();
  const { signTypedDataAsync } = useSignTypedData();

  // State
  const [strategies, setStrategies] = useState<any[]>([]);
  const [agentWallet, setAgentWallet] = useState<any>(null);
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [systemConfig, setSystemConfig] = useState<any>(null);

  // Create Form State
  const [strategyType, setStrategyType] = useState<"DCA" | "TWAP" | "GRID">("DCA");
  const [instrumentId, setInstrumentId] = useState(1); // BTC Perp
  const [side, setSide] = useState<"b" | "s">("b");
  const [dcaSize, setDcaSize] = useState("0.01");
  const [dcaInterval, setDcaInterval] = useState("60");

  const [twapTotalSize, setTwapTotalSize] = useState("0.1");
  const [twapSlices, setTwapSlices] = useState("10");
  const [twapInterval, setTwapInterval] = useState("30");
  const [twapPo, setTwapPo] = useState(true);

  const [gridLower, setGridLower] = useState("90000");
  const [gridUpper, setGridUpper] = useState("95000");
  const [gridLevels, setGridLevels] = useState("10");
  const [gridSize, setGridSize] = useState("0.005");

  // Fetch Data
  const fetchData = async () => {
    if (!token) return;
    try {
      // Fetch strategies
      const stratRes = await fetch(`${API_URL}/strategy`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (stratRes.ok) {
        const data = await stratRes.json();
        setStrategies(data);
      }

      // Fetch agent summary or portfolio
      const agentRes = await fetch(`${API_URL}/portfolio/broker-check`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (agentRes.ok) {
        const data = await agentRes.json();
        // Assume active if returned details are solid
        setAgentWallet(data?.account ? { address: data.account, status: "ACTIVE" } : null);
      }

      // Fetch system configuration
      const configRes = await fetch(`${API_URL}/broker/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (configRes.ok) {
        const data = await configRes.json();
        setSystemConfig(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isConnected && token) {
      fetchData();
    }
  }, [isConnected, token]);

  // Setup Agent wallet
  const handleSetupAgent = async () => {
    if (!token) return;
    setIsAgentLoading(true);
    setMessage("");

    try {
      // 1. Request new agent address from backend
      const genRes = await fetch(`${API_URL}/agent/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!genRes.ok) throw new Error("Failed to generate agent keys");
      const genData = await genRes.json();
      const generatedAgentAddress = genData.agentAddress;

      // 2. Prompt user to sign delegation action
      const validUntil = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
      const nonce = Date.now();

      const domain = {
        name: "HotstuffCore",
        version: "1",
        chainId: systemConfig?.chainId ?? 1,
        verifyingContract: (systemConfig?.verifyingContract ?? "0x1234567890123456789012345678901234567890") as `0x${string}`,
      };

      const types = {
        Action: [
          { name: "source", type: "string" },
          { name: "hash", type: "bytes32" },
          { name: "txType", type: "uint16" },
        ],
      };

      const action = {
        type: "addAgent",
        data: {
          agentAddress: generatedAgentAddress,
          agentName: "EmberBot",
          forAccount: address,
          validUntil,
          nonce,
        },
      };

      const actionBytes = encode(action);
      const payloadHash = keccak256(actionBytes);

      const message = {
        source: systemConfig?.source ?? "Testnet",
        hash: payloadHash,
        txType: 1201, // addAgent opcode
      };

      setMessage("Please sign the Agent Delegation in your wallet...");

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: "Action",
        message,
      });

      // Submit signature to backend
      const regRes = await fetch(`${API_URL}/agent/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agentAddress: generatedAgentAddress,
          validUntil,
          nonce,
          signature,
        }),
      });

      if (!regRes.ok) throw new Error("Failed to register agent signature");
      
      const regData = await regRes.json();
      setAgentWallet({ address: regData.agentAddress, status: "ACTIVE" });
      setMessage("Agent wallet delegated successfully! Automated executions ready.");
      fetchData();
    } catch (err: any) {
      setMessage(`Agent delegation failed: ${err.message}`);
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Create Strategy
  const handleCreateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setMessage("");

    let config: any = {};
    if (strategyType === "DCA") {
      config = {
        instrumentId,
        size: dcaSize,
        intervalMinutes: parseInt(dcaInterval),
        side,
      };
    } else if (strategyType === "TWAP") {
      config = {
        instrumentId,
        totalSize: twapTotalSize,
        sliceCount: parseInt(twapSlices),
        intervalSeconds: parseInt(twapInterval),
        side,
        po: twapPo,
      };
    } else if (strategyType === "GRID") {
      config = {
        instrumentId,
        lowerPrice: gridLower,
        upperPrice: gridUpper,
        gridLevels: parseInt(gridLevels),
        sizePerLevel: gridSize,
      };
    }

    try {
      const res = await fetch(`${API_URL}/strategy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: strategyType,
          instrumentIds: [instrumentId],
          brokerFeeBps: systemConfig?.defaultBrokerFeeBps ?? 3,
          config,
        }),
      });

      if (!res.ok) throw new Error("Failed to create strategy");

      setMessage("Strategy successfully scheduled!");
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setMessage(`Create failed: ${err.message}`);
    }
  };

  // Pause / Resume / Delete Strategy Action Buttons
  const handleAction = async (id: string, action: "pause" | "resume" | "delete") => {
    if (!token) return;
    try {
      const method = action === "delete" ? "DELETE" : "POST";
      const path = action === "delete" ? `/strategy/${id}` : `/strategy/${id}/${action}`;
      
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessage(`Strategy action '${action}' completed successfully.`);
        fetchData();
      } else {
        throw new Error("Action failed");
      }
    } catch (err: any) {
      setMessage(`Action failed: ${err.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20 max-w-xl mx-auto space-y-6">
        <Bot className="w-16 h-16 text-primaryPink mx-auto animate-pulse" />
        <h2 className="text-3xl font-extrabold">Web3 Connection Required</h2>
        <p className="text-gray-400">Please connect your Web3 wallet to manage strategies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Onboarding / Agent Panel */}
      <div className="glass-panel rounded-3xl p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-accentEmerald" />
            Non-Custodial Agent Authority
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
            In order for background processes to submit trades autonomously while you are offline, you must authorize a localized agent key. The key has no withdrawal or setting modifications authority.
          </p>
        </div>

        <div className="shrink-0 w-full lg:w-auto">
          {agentWallet && agentWallet.status === "ACTIVE" ? (
            <div className="flex items-center gap-3 bg-[rgba(16,185,129,0.06)] border border-accentEmerald px-6 py-4 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-accentEmerald" />
              <div className="text-sm">
                <span className="font-bold block">Agent Active</span>
                <span className="font-mono text-xs text-gray-400">{agentWallet.address.substring(0, 16)}...</span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSetupAgent}
              disabled={isAgentLoading}
              className="w-full bg-gradient-to-r from-primaryPink to-primaryIndigo py-4 px-8 rounded-2xl font-bold hover:opacity-90 transition-opacity text-sm shadow-md flex items-center justify-center gap-2"
            >
              Delegate Agent Wallet
            </button>
          )}
        </div>
      </div>

      {/* Main Panel Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Active Autopilots</h3>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] hover:bg-[rgba(99,102,241,0.2)] transition-colors text-sm font-semibold text-primaryIndigo"
        >
          <PlusCircle className="w-4 h-4" />
          Create Autopilot
        </button>
      </div>

      {/* Strategy List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {strategies.map((strat) => (
          <div key={strat.id} className="glass-panel rounded-2xl p-6 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">
                  {strat.type}
                </span>
                <span
                  className={`text-xs font-bold ${
                    strat.status === "ACTIVE" ? "text-accentEmerald" : "text-primaryPink"
                  }`}
                >
                  {strat.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-bold text-gray-300">Configuration:</div>
                <div className="text-xs font-mono bg-[rgba(0,0,0,0.2)] p-3 rounded-lg text-gray-400 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(strat.configJson, null, 2)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] pt-4">
              <div className="flex gap-2">
                {strat.status === "ACTIVE" ? (
                  <button
                    onClick={() => handleAction(strat.id, "pause")}
                    className="p-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.05)] text-gray-400 hover:text-white transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(strat.id, "resume")}
                    className="p-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.05)] text-gray-400 hover:text-white transition-colors"
                  >
                    <Play className="w-4 h-4 text-accentEmerald" />
                  </button>
                )}
                <button
                  onClick={() => handleAction(strat.id, "delete")}
                  className="p-2 rounded-lg bg-[rgba(255,51,102,0.05)] border border-[rgba(255,51,102,0.1)] hover:bg-[rgba(255,51,102,0.1)] text-primaryPink transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Runs Executed</span>
                <span className="text-sm font-extrabold">{strat.runs?.length || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Strategy Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-8 max-w-lg w-full space-y-6">
            <h3 className="text-2xl font-bold">Configure Strategy Autopilot</h3>
            
            <div className="flex gap-2 border-b border-[rgba(255,255,255,0.08)] pb-4">
              {["DCA", "TWAP", "GRID"].map((type: any) => (
                <button
                  key={type}
                  onClick={() => setStrategyType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    strategyType === type ? "bg-primaryIndigo text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateStrategy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Instrument ID
                </label>
                <input
                  type="number"
                  value={instrumentId}
                  onChange={(e) => setInstrumentId(parseInt(e.target.value))}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primaryIndigo"
                  required
                />
              </div>

              {strategyType !== "GRID" && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-medium">
                    Order Side
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSide("b")}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-bold ${
                        side === "b" ? "border-accentEmerald text-accentEmerald" : "border-transparent text-gray-400"
                      }`}
                    >
                      Buy (Long)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSide("s")}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-bold ${
                        side === "s" ? "border-primaryPink text-primaryPink" : "border-transparent text-gray-400"
                      }`}
                    >
                      Sell (Short)
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic form inputs based on StrategyType */}
              {strategyType === "DCA" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Buy/Sell Size</label>
                    <input
                      type="text"
                      value={dcaSize}
                      onChange={(e) => setDcaSize(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Interval (Minutes)</label>
                    <input
                      type="number"
                      value={dcaInterval}
                      onChange={(e) => setDcaInterval(e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {strategyType === "TWAP" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Total Execution Size</label>
                      <input
                        type="text"
                        value={twapTotalSize}
                        onChange={(e) => setTwapTotalSize(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Slices Count</label>
                      <input
                        type="number"
                        value={twapSlices}
                        onChange={(e) => setTwapSlices(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Slice Interval (Seconds)</label>
                      <input
                        type="number"
                        value={twapInterval}
                        onChange={(e) => setTwapInterval(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={twapPo}
                        onChange={(e) => setTwapPo(e.target.checked)}
                        className="accent-primaryIndigo"
                      />
                      <label className="text-xs font-semibold text-gray-400">Post-Only (Maker)</label>
                    </div>
                  </div>
                </div>
              )}

              {strategyType === "GRID" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Lower Price Bound</label>
                      <input
                        type="text"
                        value={gridLower}
                        onChange={(e) => setGridLower(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Upper Price Bound</label>
                      <input
                        type="text"
                        value={gridUpper}
                        onChange={(e) => setGridUpper(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Grid Levels</label>
                      <input
                        type="number"
                        value={gridLevels}
                        onChange={(e) => setGridLevels(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Size Per Level</label>
                      <input
                        type="text"
                        value={gridSize}
                        onChange={(e) => setGridSize(e.target.value)}
                        className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 border border-[rgba(255,255,255,0.08)] py-3 rounded-xl hover:bg-[rgba(255,255,255,0.02)] transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primaryPink to-primaryIndigo py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-sm shadow-md"
                >
                  Confirm and Start
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message && (
        <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(18,18,28,0.6)] text-center text-sm font-medium">
          {message}
        </div>
      )}
    </div>
  );
}
