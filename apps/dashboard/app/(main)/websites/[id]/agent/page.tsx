"use client";

import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import { useParams } from "next/navigation";
import { FeatureGate } from "@/components/feature-gate";
import { GATED_FEATURES } from "@/components/providers/billing-provider";
import { AgentPageContent } from "./_components/agent-page-content";

export default function AgentPage() {
	const { id } = useParams();
	const websiteId = id as string;

	return (
		<FeatureGate feature={GATED_FEATURES.GEOGRAPHIC}>
			<ChatProvider initialMessages={[]} key={websiteId}>
				<div className="relative flex h-full flex-col">
					<AgentPageContent websiteId={websiteId} />
				</div>
			</ChatProvider>
		</FeatureGate>
	);
}
