import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Schema for website creation/update
const websiteSchema = z.object({
  name: z.string().min(1, "Website name is required"),
  url: z.string().url("Please enter a valid URL"),
  isActive: z.boolean().optional().default(true),
});

// GET /api/websites - Get all websites for the current user
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const websites = await db.website.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(websites);
  } catch (error) {
    console.error("Error fetching websites:", error);
    return NextResponse.json(
      { error: "Failed to fetch websites" },
      { status: 500 }
    );
  }
}

// POST /api/websites - Create a new website
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = websiteSchema.parse(body);

    // Generate slug from website name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingWebsite = await db.website.findUnique({
      where: { slug },
    });

    if (existingWebsite) {
      return NextResponse.json(
        { error: "A website with this name already exists" },
        { status: 400 }
      );
    }

    const website = await db.website.create({
      data: {
        ...validatedData,
        slug,
        userId: session.user.id,
      },
    });

    // Create initial analytics record
    await db.websiteAnalytics.create({
      data: {
        websiteId: website.id,
        date: new Date(),
      },
    });

    return NextResponse.json(website, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating website:", error);
    return NextResponse.json(
      { error: "Failed to create website" },
      { status: 500 }
    );
  }
} 