import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const STEPS = {
  image: { resize: { robot: "/image/resize" } },
  video: { encode: { robot: "/video/encode", preset: "iphone-high" } },
};

const signatureRequestSchema = z.object({ kind: z.enum(["image", "video"]) });

// POST /api/transloadit/signature — Sign assembly params so the secret stays on the server
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = signatureRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const key = process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY;
    const secret = process.env.TRANSLOADIT_AUTH_SECRET;
    if (!key || !secret) {
      return NextResponse.json({ error: "Transloadit is not configured" }, { status: 503 });
    }

    // Transloadit expects "YYYY/MM/DD HH:mm:ss+00:00"
    const expires = new Date(Date.now() + 60 * 60 * 1000)
      .toISOString()
      .replace(/-/g, "/")
      .replace("T", " ")
      .replace(/\.\d+Z$/, "+00:00");

    const params = JSON.stringify({
      auth: { key, expires },
      steps: STEPS[parsed.data.kind],
    });
    const signature = `sha384:${createHmac("sha384", secret).update(params).digest("hex")}`;

    return NextResponse.json({ params, signature });
  } catch (error) {
    console.error("Failed to sign Transloadit params:", error);
    return NextResponse.json({ error: "Failed to sign upload" }, { status: 500 });
  }
}
