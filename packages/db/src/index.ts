import { Prisma } from "@prisma/client";
import { db } from "./client";

// Export everything from Prisma client
export * from "@prisma/client";
export { db };

// Re-export specific types for better discoverability and type safety
export type {
  User,
  Post,
  Category,
  Tag,
  Email,
  Contact,
  CompanyInfo,
  JobListing,
  JobApplication,
  Website,
  Account,
  Session,
  Verification
} from "@prisma/client";

// Re-export enums for better discoverability
export { Role, WebsiteStatus } from "@prisma/client";

// Export Prisma namespace for advanced type operations
export { Prisma };

// Type-safe database query helpers
export type TransactionClient = Omit<
  typeof db,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Helper for transactions
export const transaction = async <T>(
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> => {
  return db.$transaction(fn);
};

// Helper for count with conditions
export const count = async <T extends keyof typeof db>(
  model: T,
  args?: Prisma.Args<(typeof db)[T], "count">
): Promise<number> => {
  const modelWithArgs = db[model] as any;
  return modelWithArgs.count(args);
};

// Export schema metadata for type-safe operations
export const schema = {
  $types: Prisma,
};

// Export common query helpers
export const findMany = async <T extends keyof typeof db>(
  model: T,
  args?: Prisma.Args<(typeof db)[T], "findMany">
): Promise<Prisma.Result<(typeof db)[T], "findMany", typeof args>> => {
  const modelWithArgs = db[model] as any;
  return modelWithArgs.findMany(args);
};

export const findUnique = async <T extends keyof typeof db>(
  model: T,
  args: Prisma.Args<(typeof db)[T], "findUnique">
): Promise<Prisma.Result<(typeof db)[T], "findUnique", typeof args>> => {
  const modelWithArgs = db[model] as any;
  return modelWithArgs.findUnique(args);
};

export const findFirst = async <T extends keyof typeof db>(
  model: T,
  args: Prisma.Args<(typeof db)[T], "findFirst">
): Promise<Prisma.Result<(typeof db)[T], "findFirst", typeof args>> => {
  const modelWithArgs = db[model] as any;
  return modelWithArgs.findFirst(args);
};

// Type helpers for common operations
export type ModelNames = keyof typeof db;

// Type helper for getting the where clause type of a model
export type WhereType<T extends ModelNames> = Prisma.Args<(typeof db)[T], "findFirst">["where"];

// Type helper for getting the select clause type of a model
export type SelectType<T extends ModelNames> = Prisma.Args<(typeof db)[T], "findFirst">["select"];

// Type helper for getting the include clause type of a model
export type IncludeType<T extends ModelNames> = Prisma.Args<(typeof db)[T], "findFirst">["include"];

// Type helper for getting the create input type of a model
export type CreateInputType<T extends ModelNames> = Prisma.Args<(typeof db)[T], "create">["data"];

// Type helper for getting the update input type of a model
export type UpdateInputType<T extends ModelNames> = Prisma.Args<(typeof db)[T], "update">["data"];
