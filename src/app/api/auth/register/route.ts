import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password (in production, use bcrypt)
    // const hashedPassword = await bcrypt.hash(password, 12);
    // For demo, we'll store plain text (NOT recommended for production)
    const hashedPassword = password; // Demo only!

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        // password: hashedPassword, // In production, store hashed password
        status: "online",
      },
    });

    // Create a default workspace for the user
    const workspace = await db.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        description: "Personal workspace",
      },
    });

    // Add user to workspace as owner
    await db.userWorkspace.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "owner",
      },
    });

    // Create a default general channel
    await db.channel.create({
      data: {
        name: "general",
        description: "General channel",
        workspaceId: workspace.id,
        type: "public",
      },
    });

    // Add user to the channel
    await db.channelMember.create({
      data: {
        userId: user.id,
        channelId: (await db.channel.findFirst({
          where: { workspaceId: workspace.id, name: "general" },
        }))!.id,
      },
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create response with token in cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        status: user.status,
      },
      token,
    });

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}