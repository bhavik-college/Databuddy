"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAgentChat } from "./hooks/use-agent-chat";

export function AgentNavigation() {
	const router = useRouter();
	const { id } = useParams();
	const { reset } = useAgentChat();

	const handleBack = () => {
		reset();
		router.push(`/websites/${id}`);
	};

	return (
		<div className="absolute left-0">
			<Button onClick={handleBack} size="icon" type="button" variant="outline">
				<ArrowLeftIcon className="size-4" />
			</Button>
		</div>
	);
}
