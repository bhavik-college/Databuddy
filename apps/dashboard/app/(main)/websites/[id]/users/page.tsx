"use client";

import { useParams } from "next/navigation";
import { UsersList } from "./_components/users-list";

export default function UsersPage() {
	const { id: websiteId } = useParams();

	return (
		<div className="h-full">
			<UsersList websiteId={websiteId as string} />
		</div>
	);
}
