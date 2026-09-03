export function isAnalysisCostWithinBudget(estimatedCost: number, maxCost: number): boolean {
  return Number.isFinite(estimatedCost) && estimatedCost >= 0 && Number.isFinite(maxCost) && estimatedCost <= maxCost;
}
