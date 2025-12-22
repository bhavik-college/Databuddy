import type {
	FlagType,
	FlagWithScheduleForm,
	Variant,
} from "@databuddy/shared/flags";
import type { UseFormReturn } from "react-hook-form";

export type Flag = {
	id: string;
	key: string;
	name?: string | null;
	description?: string | null;
	type: FlagType;
	status: "active" | "inactive" | "archived";
	defaultValue?: boolean;
	payload?: unknown;
	rolloutPercentage?: number | null;
	rules?: UserRule[];
	variants?: Variant[];
	dependencies?: string[];
	environment?: string;
	persistAcrossAuth?: boolean;
	websiteId?: string | null;
	organizationId?: string | null;
	userId?: string | null;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date | null;
};

export type UserRule = {
	type: "user_id" | "email" | "property";
	operator:
		| "equals"
		| "contains"
		| "starts_with"
		| "ends_with"
		| "in"
		| "not_in"
		| "exists"
		| "not_exists";
	field?: string;
	value?: string;
	values?: string[];
	enabled: boolean;
	batch: boolean;
	batchValues?: string[];
};

export type FlagStatus = "active" | "inactive" | "archived";

export type FlagSheetProps = {
	isOpen: boolean;
	onCloseAction: () => void;
	websiteId: string;
	flag?: Flag | null;
};

export type FlagsListProps = {
	flags: Flag[];
	isLoading: boolean;
	onCreateFlagAction: () => void;
	onEditFlagAction: (flag: Flag) => void;
};

export type VariantEditorProps = {
	variants: Variant[];
	onChangeAction: (variants: Variant[]) => void;
};

export type ScheduleManagerProps = {
	form: UseFormReturn<FlagWithScheduleForm>;
};

export type DependencySelectorProps = {
	value: string[];
	onChange: (dependencies: string[]) => void;
	availableFlags: Flag[];
	currentFlagKey?: string;
};

export type UserRulesBuilderProps = {
	rules: UserRule[];
	onChange: (rules: UserRule[]) => void;
};
