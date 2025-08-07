import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/server/db";

export async function POST(request: Request) {
  try {
    const payload: WebhookEvent = await request.json();
    console.log(payload)

    if (payload.type === "user.created") {
      const user = payload.data;
      const id = user.id;
      const firstName = user.first_name ?? "";
      const lastName = user.last_name ?? "";
      const emailAddress = user.email_addresses[0]?.email_address ?? "";
      const imageUrl = user.image_url;

      await db.user.upsert({
        where: { id },
        update: { emailAddress, firstName, lastName, imageUrl },
        create: { id, emailAddress, firstName, lastName, imageUrl },
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
