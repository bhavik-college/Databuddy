import { createHash } from "node:crypto";

const getDailySalt = () => new Date().toISOString().split("T")[0];

export const hashIp = (ip: string) =>
	createHash("sha256")
		.update(ip + getDailySalt())
		.digest("hex");
