import BigNumber from "bignumber.js";
import { DcaConfig, TwapConfig, GridConfig, HotstuffOrder, HotstuffBrokerConfig } from "@ember/types";

// Convert broker fee BPS to decimal (e.g. 3 BPS -> "0.0003")
export function bpsToDecimalString(bps: number): string {
  return new BigNumber(bps).dividedBy(10000).toString();
}

export function generateBrokerConfig(broker: string, bps: number): HotstuffBrokerConfig | undefined {
  if (!broker || bps <= 0) return undefined;
  return {
    broker,
    fee: bpsToDecimalString(bps),
  };
}

export class DcaStrategyEngine {
  public static generateOrder(
    config: DcaConfig,
    cloid: string
  ): HotstuffOrder {
    // DCA orders are executed as Market orders (IOC) to ensure instant entry/exit
    return {
      instrumentId: config.instrumentId,
      side: config.side,
      positionSide: "BOTH",
      price: "0", // Market order price doesn't matter (usually "0" or empty string)
      size: new BigNumber(config.size).toString(),
      tif: "IOC",
      ro: false,
      po: false,
      cloid,
      isMarket: true,
    };
  }
}

export class TwapStrategyEngine {
  public static generateSliceOrder(
    config: TwapConfig,
    currentPrice: string,
    sliceIndex: number,
    cloid: string
  ): HotstuffOrder {
    const size = new BigNumber(config.totalSize).dividedBy(config.sliceCount);
    const useMarket = !config.po;

    return {
      instrumentId: config.instrumentId,
      side: config.side,
      positionSide: "BOTH",
      price: useMarket ? "0" : new BigNumber(currentPrice).toString(),
      size: size.toString(),
      tif: useMarket ? "IOC" : "GTC",
      ro: false,
      po: config.po,
      cloid,
      isMarket: useMarket,
    };
  }
}

export class GridStrategyEngine {
  public static generateGridOrders(
    config: GridConfig,
    currentPrice: string,
    buyCloidPrefix: string,
    sellCloidPrefix: string
  ): HotstuffOrder[] {
    const orders: HotstuffOrder[] = [];
    const lower = new BigNumber(config.lowerPrice);
    const upper = new BigNumber(config.upperPrice);
    const current = new BigNumber(currentPrice);
    const levels = config.gridLevels;
    const size = new BigNumber(config.sizePerLevel);

    if (upper.lte(lower)) {
      throw new Error("Upper price must be greater than lower price");
    }

    const priceStep = upper.minus(lower).dividedBy(levels - 1);

    for (let i = 0; i < levels; i++) {
      const price = lower.plus(priceStep.multipliedBy(i));

      // Skip price if it's too close to current price to avoid instant fills in wrong direction
      if (price.minus(current).abs().dividedBy(current).lt(0.0005)) {
        continue;
      }

      if (price.lt(current)) {
        // Buy Grid Level (Limit order below current price)
        orders.push({
          instrumentId: config.instrumentId,
          side: "b",
          positionSide: "BOTH",
          price: price.toString(),
          size: size.toString(),
          tif: "GTC",
          ro: false,
          po: true, // Marker order preference
          cloid: buyCloidPrefix + i.toString(16).padStart(2, "0"),
          isMarket: false,
        });
      } else {
        // Sell Grid Level (Limit order above current price)
        orders.push({
          instrumentId: config.instrumentId,
          side: "s",
          positionSide: "BOTH",
          price: price.toString(),
          size: size.toString(),
          tif: "GTC",
          ro: false,
          po: true,
          cloid: sellCloidPrefix + i.toString(16).padStart(2, "0"),
          isMarket: false,
        });
      }
    }

    return orders;
  }
}
