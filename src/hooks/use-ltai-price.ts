import { useQuery } from "@tanstack/react-query";
import { fetchLTAIPrice, calculateLTAIAmount } from "./use-credits";

export function useLTAIPrice() {
  const priceQuery = useQuery({
    queryKey: ["ltai-price"],
    queryFn: fetchLTAIPrice,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const getRequiredLTAI = (usdAmount: number): number => {
    if (!priceQuery.data) return 0;
    return calculateLTAIAmount(usdAmount, priceQuery.data);
  };

  return {
    price: priceQuery.data || 0,
    isLoading: priceQuery.isLoading,
    isError: priceQuery.isError,
    error: priceQuery.error,
    getRequiredLTAI,
  };
}