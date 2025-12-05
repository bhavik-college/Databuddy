"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useAudioRecording } from "./hooks/use-audio-recording";

interface RecordButtonProps {
	disabled?: boolean;
	className?: string;
	size?: number;
}

export function RecordButton({
	disabled = false,
	className,
	size = 16,
}: RecordButtonProps) {
	const { isRecording, isProcessing, startRecording, stopRecording } =
		useAudioRecording();

	const handleClick = useCallback(async () => {
		if (isRecording) {
			await stopRecording();
		} else {
			await startRecording();
		}
	}, [isRecording, startRecording, stopRecording]);

	if (isProcessing) {
		return (
			<Button
				className={cn("size-8", className)}
				disabled
				size="icon"
				type="button"
				variant="ghost"
			>
				<Spinner className="size-4" />
			</Button>
		);
	}

	return (
		<Button
			className={cn(
				"size-8 transition-all",
				isRecording && "text-destructive hover:text-destructive",
				className
			)}
			disabled={disabled}
			onClick={handleClick}
			size="icon"
			title={isRecording ? "Stop recording" : "Start recording"}
			type="button"
			variant="ghost"
		>
			<RecordIcon isRecording={isRecording} size={size} />
		</Button>
	);
}

function RecordIcon({
	size = 16,
	isRecording = false,
}: {
	size?: number;
	isRecording?: boolean;
}) {
	return (
		<svg
			fill="currentColor"
			height={size}
			viewBox="0 0 24 24"
			width={size}
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* Bar 1 */}
			<rect fill="currentColor" height="4" width="2" x="3" y="10">
				{isRecording && (
					<>
						<animate
							attributeName="height"
							begin="0s"
							dur="2.4s"
							repeatCount="indefinite"
							values="4;2;6;3;8;1;5;2;7;4"
						/>
						<animate
							attributeName="y"
							begin="0s"
							dur="2.4s"
							repeatCount="indefinite"
							values="10;11;7;10.5;6;11.5;8.5;11;6.5;10"
						/>
					</>
				)}
			</rect>
			{/* Bar 2 */}
			<rect fill="currentColor" height="12" width="2" x="7" y="6">
				{isRecording && (
					<>
						<animate
							attributeName="height"
							begin="0.45s"
							dur="2.7s"
							repeatCount="indefinite"
							values="12;8;16;10;18;6;14;9;15;12"
						/>
						<animate
							attributeName="y"
							begin="0.45s"
							dur="2.7s"
							repeatCount="indefinite"
							values="6;8;2;7;1;9;5;7.5;4.5;6"
						/>
					</>
				)}
			</rect>
			{/* Bar 3 */}
			<rect fill="currentColor" height="20" width="2" x="11" y="2">
				{isRecording && (
					<>
						<animate
							attributeName="height"
							begin="0.9s"
							dur="2.1s"
							repeatCount="indefinite"
							values="20;14;22;16;24;12;18;15;21;20"
						/>
						<animate
							attributeName="y"
							begin="0.9s"
							dur="2.1s"
							repeatCount="indefinite"
							values="2;5;1;4;0;6;3;4.5;1.5;2"
						/>
					</>
				)}
			</rect>
			{/* Bar 4 */}
			<rect fill="currentColor" height="12" width="2" x="15" y="6">
				{isRecording && (
					<>
						<animate
							attributeName="height"
							begin="1.35s"
							dur="3.3s"
							repeatCount="indefinite"
							values="12;16;8;14;10;18;6;13;9;12"
						/>
						<animate
							attributeName="y"
							begin="1.35s"
							dur="3.3s"
							repeatCount="indefinite"
							values="6;2;8;5;7;1;9;5.5;7.5;6"
						/>
					</>
				)}
			</rect>
			{/* Bar 5 */}
			<rect fill="currentColor" height="4" width="2" x="19" y="10">
				{isRecording && (
					<>
						<animate
							attributeName="height"
							begin="1.8s"
							dur="3.0s"
							repeatCount="indefinite"
							values="4;6;2;7;3;8;1;5;3;4"
						/>
						<animate
							attributeName="y"
							begin="1.8s"
							dur="3.0s"
							repeatCount="indefinite"
							values="10;7;11;6.5;10.5;6;11.5;8.5;10.5;10"
						/>
					</>
				)}
			</rect>
		</svg>
	);
}
