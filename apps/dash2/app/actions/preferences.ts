"use server";

import { revalidatePath } from "next/cache";
import { db, userPreferences, eq } from "@databuddy/db";
import { auth } from "@databuddy/auth";
import { headers } from "next/headers";
import { cache } from "react";
import { z } from "zod";
import { nanoid } from "nanoid";

// Helper to get authenticated user
const getUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session) return null;
  return session.user;
});

// Preferences schema
const preferencesSchema = z.object({
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
});

/**
 * Get user preferences, creating default ones if none exist
 */
export async function getUserPreferences() {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    // Try to find existing preferences
    let preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, user.id)
    });
    
    // Create default preferences if none exist
    if (!preferences) {
      const inserted = await db.insert(userPreferences).values({
        id: nanoid(),
        userId: user.id,
        timezone: "auto",
        dateFormat: "MMM D, YYYY",
        timeFormat: "h:mm a",
        updatedAt: new Date().toISOString(),
      }).returning();
      
      preferences = inserted[0];
    }
    
    return { data: preferences };
  } catch (error) {
    console.error('Failed to get user preferences', { error });
    return { error: "Failed to get user preferences" };
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(formData: FormData) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    // Parse and validate form data
    const timezone = formData.get("timezone") as string;
    const dateFormat = formData.get("dateFormat") as string;
    const timeFormat = formData.get("timeFormat") as string;

    // Validate the data
    const validatedData = preferencesSchema.parse({
      timezone,
      dateFormat,
      timeFormat,
    });

    // Get or create preferences
    let preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, user.id)
    });
    
    if (!preferences) {
      // Create if doesn't exist
      const inserted = await db.insert(userPreferences).values({
        id: nanoid(),
        userId: user.id,
        timezone: validatedData.timezone || "auto",
        dateFormat: validatedData.dateFormat || "MMM D, YYYY",
        timeFormat: validatedData.timeFormat || "h:mm a",
        updatedAt: new Date().toISOString(),
      }).returning();
      
      preferences = inserted[0];
    } else {
      // Update existing preferences
      const updated = await db.update(userPreferences)
        .set({
          timezone: validatedData.timezone || preferences.timezone,
          dateFormat: validatedData.dateFormat || preferences.dateFormat,
          timeFormat: validatedData.timeFormat || preferences.timeFormat,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userPreferences.userId, user.id))
        .returning();
        
      preferences = updated[0];
    }

    revalidatePath("/settings");
    return { success: true, data: preferences };
  } catch (error) {
    console.error("Preferences update error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update preferences" };
  }
} 