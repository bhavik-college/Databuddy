"use server";

import { Autumn as autumn } from "autumn-js";
import { db, user } from "@databuddy/db";
import { unstable_cache } from "next/cache";
import type { CustomerData, CustomerDataWithPricing } from "./types";

type User = typeof user.$inferSelect;

const PRICE_PER_EVENT = 0.000035;

// Predict usage and risk for a user
function calculatePrediction(usage: number, included: number, nextReset: number): {
    predictedUsage: number;
    predictedOverage: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    daysUntilReset: number;
    isOverLimit: boolean;
} {
    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysUntilReset = Math.max(0, (nextReset - now) / msPerDay);
    const periodDays = 30; // Assume monthly
    const elapsedDays = Math.max(1, periodDays - daysUntilReset);
    const isOverLimit = usage >= included;

    // If already over limit, just show current overage
    if (isOverLimit) {
        return {
            predictedUsage: usage,
            predictedOverage: usage - included,
            riskLevel: 'critical',
            daysUntilReset: Math.round(daysUntilReset),
            isOverLimit: true
        };
    }

    // If period is over, just show current usage
    if (daysUntilReset <= 0) {
        return {
            predictedUsage: usage,
            predictedOverage: 0,
            riskLevel: usage > included ? 'critical' : 'low',
            daysUntilReset: 0,
            isOverLimit: false
        };
    }

    // Predict based on current rate
    const dailyRate = usage / elapsedDays;
    const predictedUsage = Math.round(usage + dailyRate * daysUntilReset);
    const predictedOverage = Math.max(0, predictedUsage - included);
    const percent = (predictedUsage / included) * 100;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (percent < 80) riskLevel = 'low';
    else if (percent < 100) riskLevel = 'medium';
    else if (percent < 120) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
        predictedUsage,
        predictedOverage,
        riskLevel,
        daysUntilReset: Math.round(daysUntilReset),
        isOverLimit: false
    };
}

export const getUsers = unstable_cache(async () => {
    const dbUsers = await db.select().from(user);
    // Filter out admin users
    return dbUsers.filter(user => user.role !== 'ADMIN');
}, ["users"], {
    tags: ["users"],
    revalidate: 60,
});

export const getCustomers = unstable_cache(async (dbUsers: User[]) => {
    const customers: CustomerDataWithPricing[] = [];

    await Promise.all(dbUsers.map(async (user) => {
        const customer = await autumn.check({
            customer_id: user.id,
            feature_id: "events",
        });

        if (customer.data?.allowed) {
            const customerData = customer.data as CustomerData;
            const isFreePlan = customerData.included_usage === 25000 && !customerData.overage_allowed;
            // Calculate overage and pricing
            const overageAmount = Math.max(0, customerData.usage - customerData.included_usage);
            const overageCost = overageAmount * PRICE_PER_EVENT;
            const totalCost = overageCost;
            // Calculate predictions
            const prediction = calculatePrediction(
                customerData.usage,
                customerData.included_usage,
                customerData.next_reset_at
            );
            customers.push({
                ...customerData,
                user_name: user.name || user.firstName || user.lastName || "Unnamed User",
                user_email: user.email,
                overage_amount: overageAmount,
                overage_cost: overageCost,
                total_cost: totalCost,
                predicted_usage: prediction.predictedUsage,
                predicted_overage: prediction.predictedOverage,
                risk_level: prediction.riskLevel,
                days_until_reset: prediction.daysUntilReset,
                is_over_limit: prediction.isOverLimit,
                is_free_plan: isFreePlan,
            });
        }
    }));

    return customers;
}, ["customers"], {
    tags: ["customers"],
    revalidate: 60,
});