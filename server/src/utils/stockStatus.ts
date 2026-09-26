export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export function computeStockStatus(totalStock: number, reorderLevel: number): StockStatus {
  if (totalStock <= 0) return "OUT_OF_STOCK";
  if (totalStock <= reorderLevel) return "LOW_STOCK";
  return "IN_STOCK";
}
