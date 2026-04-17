import { useQuery } from "@tanstack/react-query";

export interface AlephModel {
	id: string;
	name: string;
	hf_id?: string;
	capabilities: {
		text?: {
			tee: boolean;
			vision: boolean;
			reasoning: boolean;
			context_window: number;
			function_calling: boolean;
		};
		image?: boolean;
		search?: boolean;
	};
	pricing: {
		text?: {
			price_per_million_input_tokens: number;
			price_per_million_output_tokens: number;
		};
		image?: number;
		search?: number;
	};
}

type Capability = "text" | "image" | "search";

const ALEPH_PRICING_URL =
	"https://api2.aleph.im/api/v0/aggregates/0xe1F7220D201C64871Cefb25320a8a588393eE508.json?keys=LTAI_PRICING";

export function useAlephModels(capability?: Capability) {
	return useQuery({
		queryKey: ["aleph-pricing"],
		queryFn: async (): Promise<AlephModel[]> => {
			const response = await fetch(ALEPH_PRICING_URL);
			const data = await response.json();
			return data.data.LTAI_PRICING.models as AlephModel[];
		},
		staleTime: 5 * 60 * 1000,
		select: capability
			? (models) => models.filter((model) => model.capabilities[capability] !== undefined)
			: undefined,
	});
}
