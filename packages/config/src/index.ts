export const HOTSTUFF_ENDPOINTS = {
  testnet: {
    rest: "https://testnet-api.hotstuff.trade",
    wss: "wss://testnet-api.hotstuff.trade/ws",
    source: "Testnet",
  },
  mainnet: {
    rest: "https://api.hotstuff.trade",
    wss: "wss://api.hotstuff.trade/ws",
    source: "Mainnet",
  },
} as const;

export const OP_CODES = {
  addAgent: 1201,
  revokeAgent: 1211,
  updatePerpLeverage: 1203,
  approveBrokerFee: 1207,
  createReferralCode: 1208,
  setReferrer: 1209,
  claimReferralRewards: 1210,
  placeOrder: 1301,
  cancelByOid: 1302,
  cancelAll: 1311,
  cancelByCloid: 1312,
  cancelByInstrument: 1313,
  spotWithdrawRequest: 1002,
  derivativeWithdrawRequest: 1003,
  spotBalanceTransferRequest: 1051,
  derivativeBalanceTransferRequest: 1052,
  internalBalanceTransferRequest: 1053,
} as const;

export type OpCodeKey = keyof typeof OP_CODES;
export type OpCodeValue = typeof OP_CODES[OpCodeKey];

export const EIP712_DOMAIN_NAME = "HotstuffCore";
export const EIP712_DOMAIN_VERSION = "1";
export const DEFAULT_CHAIN_ID = 1;
export const DEFAULT_VERIFYING_CONTRACT = "0x1234567890123456789012345678901234567890";

// Mock collateral IDs for local default
export const COLLATERAL_IDS = {
  USDC: 1,
} as const;
