import type { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/server/db";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

async function validateRequest(request: Request) {
  const payloadString = await request.text();
  const headerPayload = await headers();
  const svixHeaders = {
    "svix-id": headerPayload.get("svix-id")!,
    "svix-timestamp": headerPayload.get("svix-timestamp")!,
    "svix-signature": headerPayload.get("svix-signature")!,
  };

  const wh = new Webhook(webhookSecret);
  return wh.verify(payloadString, svixHeaders) as WebhookEvent;
}

export async function POST(request: Request) {
  try {
    const payload: WebhookEvent = await validateRequest(request);
    console.log("Received webhook event:", payload);

    if (payload.type === "user.created") {
      const user = payload.data;
      const id = user.id;
      const firstName = user.first_name ?? "";
      const lastName = user.last_name ?? "";
      const email = user.email_addresses[0]?.email_address ?? "";
      const imageUrl = user.image_url;

      await db.user.upsert({
        where: { id },
        update: { email, firstName, lastName, imageUrl },
        create: { id, email, firstName, lastName, imageUrl },
      });
    }

    return new Response(
      JSON.stringify({ status: "success", message: "Webhook received" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ status: "error", message: "Failed to process webhook" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export function GET() {
  return new Response("Clerk webhook endpoint", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
