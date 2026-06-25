import { z } from "zod";

// --- Auth Types ---
export const AuthLoginSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format"),
  message: z.string(),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, "Invalid signature format"),
});

export type AuthLoginInput = z.infer<typeof AuthLoginSchema>;

// --- Agent Types ---
export const RegisterAgentSchema = z.object({
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  validUntil: z.number().int().positive("validUntil must be a valid timestamp"),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/),
  nonce: z.number(),
});

export type RegisterAgentInput = z.infer<typeof RegisterAgentSchema>;

// --- Broker/Referral Types ---
export const ApproveBrokerSchema = z.object({
  brokerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  maxFeeRate: z.string().refine((val) => {
    const f = parseFloat(val);
    return f >= 0 && f <= 0.01; // Max 1%
  }, "Fee rate must be between 0 and 0.01 (1%)"),
});

export type ApproveBrokerInput = z.infer<typeof ApproveBrokerSchema>;

// --- Strategy Config Types ---
export const StrategyTypeSchema = z.enum(["DCA", "GRID", "TWAP", "FUNDING", "REBALANCE", "TPSL"]);
export type StrategyType = z.infer<typeof StrategyTypeSchema>;

export const StrategyStatusSchema = z.enum(["ACTIVE", "PAUSED", "COMPLETED", "FAILED", "REVOKED"]);
export type StrategyStatus = z.infer<typeof StrategyStatusSchema>;

// DCA Config Schema
export const DcaConfigSchema = z.object({
  instrumentId: z.number().int().positive(),
  size: z.string().refine((val) => parseFloat(val) > 0, "Size must be positive"),
  intervalMinutes: z.number().int().positive(),
  side: z.enum(["b", "s"]), // b = buy, s = sell
});
export type DcaConfig = z.infer<typeof DcaConfigSchema>;

// TWAP Config Schema
export const TwapConfigSchema = z.object({
  instrumentId: z.number().int().positive(),
  totalSize: z.string().refine((val) => parseFloat(val) > 0, "Total size must be positive"),
  sliceCount: z.number().int().positive().max(100),
  intervalSeconds: z.number().int().positive().min(5),
  side: z.enum(["b", "s"]),
  po: z.boolean().default(true), // Post Only / Maker preference
});
export type TwapConfig = z.infer<typeof TwapConfigSchema>;

// Grid Config Schema
export const GridConfigSchema = z.object({
  instrumentId: z.number().int().positive(),
  lowerPrice: z.string().refine((val) => parseFloat(val) > 0),
  upperPrice: z.string().refine((val) => parseFloat(val) > 0),
  gridLevels: z.number().int().positive().min(2).max(50),
  sizePerLevel: z.string().refine((val) => parseFloat(val) > 0),
});
export type GridConfig = z.infer<typeof GridConfigSchema>;

// Strategy Create Input Schema
export const CreateStrategySchema = z.object({
  type: StrategyTypeSchema,
  instrumentIds: z.array(z.number().int()),
  brokerFeeBps: z.number().int().min(0).max(100).default(3), // Default 3 bps
  config: z.record(z.any()), // Checked dynamically based on Type
});
export type CreateStrategyInput = z.infer<typeof CreateStrategySchema>;

// --- Order & Portfolio Types ---
export interface HotstuffOrder {
  instrumentId: number;
  side: "b" | "s";
  positionSide: "BOTH" | "LONG" | "SHORT";
  price: string;
  size: string;
  tif: "GTC" | "IOC" | "FOK";
  ro: boolean;
  po: boolean;
  cloid: string;
  triggerPx?: string;
  isMarket: boolean;
  tpsl?: string;
  grouping?: string;
}

export interface HotstuffBrokerConfig {
  broker: string;
  fee: string; // e.g. "0.0003"
}

export interface HotstuffPlaceOrderAction {
  orders: HotstuffOrder[];
  brokerConfig?: HotstuffBrokerConfig;
  expiresAfter: number;
  nonce: number;
}
