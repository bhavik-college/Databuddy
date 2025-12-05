import { useSetAtom } from "jotai";
import { useCallback, useRef, useState } from "react";
import { agentInputAtom } from "../agent-atoms";

export function useAudioRecording() {
	const [isRecording, setIsRecording] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const setInput = useSetAtom(agentInputAtom);

	const startRecording = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;
			chunksRef.current = [];

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					chunksRef.current.push(e.data);
				}
			};

			mediaRecorder.start();
			setIsRecording(true);
		} catch (error) {
			console.error("Failed to start recording:", error);
			throw error;
		}
	}, []);

	const stopRecording = useCallback(
		async () =>
			new Promise<Blob | null>((resolve) => {
				const mediaRecorder = mediaRecorderRef.current;
				if (!mediaRecorder) {
					resolve(null);
					return;
				}

				mediaRecorder.onstop = () => {
					const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
					mediaRecorder.stream.getTracks().forEach((track) => track.stop());
					setIsRecording(false);
					resolve(audioBlob);
				};

				mediaRecorder.stop();
			}),
		[]
	);

	const transcribeAudio = useCallback(
		async (_audioBlob: Blob): Promise<string> => {
			setIsProcessing(true);
			try {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				const placeholderText = "[Voice transcription coming soon]";
				setInput((prev) =>
					prev ? `${prev} ${placeholderText}` : placeholderText
				);
				return placeholderText;
			} finally {
				setIsProcessing(false);
			}
		},
		[setInput]
	);

	return {
		isRecording,
		isProcessing,
		startRecording,
		stopRecording,
		transcribeAudio,
	};
}
