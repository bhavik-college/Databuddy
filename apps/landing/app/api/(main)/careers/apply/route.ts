import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
// import { isSpamEmail, isSpamMessage } from "@/app/lib/spam-detection";
import { RateLimiter } from "@/app/lib/rate-limiter";

const prisma = new PrismaClient();
const rateLimiter = new RateLimiter();

// Schema for validating job application data
const applicationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }),
  role: z.string().min(1, { message: "Role is required" }),
  experience: z.string().min(1, { message: "Experience level is required" }),
  resumeUrl: z.string().url({ message: "Resume URL must be a valid URL" }),
  portfolio: z.string().url({ message: "Portfolio URL must be a valid URL" }).nullable().optional(),
  linkedin: z.string().url({ message: "LinkedIn URL must be a valid URL" }).nullable().optional(),
  github: z.string().url({ message: "GitHub URL must be a valid URL" }).nullable().optional(),
  coverLetter: z.string().min(100, { message: "Cover letter must be at least 100 characters" }),
  volunteerAcknowledgment: z.literal(true, { message: "You must acknowledge this is a volunteer/intern position" }),
});

export async function POST(request: NextRequest) {
  try {
    // Check rate limit (5 requests per hour per IP)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimited = await rateLimiter.isRateLimited(ip, "job-application", 5, 60 * 60);
    
    if (rateLimited) {
      return NextResponse.json(
        { error: "Too many applications submitted. Please try again later." },
        { status: 429 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: "Invalid request body. Please provide valid JSON." },
        { status: 400 }
      );
    }

    const validationResult = applicationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid application data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check for spam
    // if (isSpamEmail(data.email) || isSpamMessage(data.coverLetter)) {
    //   return NextResponse.json(
    //     { error: "Your application has been flagged as potential spam. Please try again." },
    //     { status: 400 }
    //   );
    // }

    // Store application in database
    try {
      // Clean up any undefined values
      const applicationData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        experienceLevel: data.experience,
        resumeUrl: data.resumeUrl,
        portfolioUrl: data.portfolio || null,
        linkedinUrl: data.linkedin || null,
        githubUrl: data.github || null,
        coverLetter: data.coverLetter,
        volunteerAcknowledged: data.volunteerAcknowledgment,
        status: "PENDING",
      };

      // Log the data being sent to the database for debugging
      console.log("Creating job application with data:", JSON.stringify(applicationData, null, 2));

      await prisma.jobApplication.create({
        data: applicationData,
      });
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save your application to our database." },
        { status: 500 }
      );
    }

    // In a real application, you might want to send an email notification here

    return NextResponse.json({ success: true, message: "Application submitted successfully" });
  } catch (error) {
    console.error("Error processing job application:", error);
    return NextResponse.json(
      { error: "Failed to process your application. Please try again later." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 