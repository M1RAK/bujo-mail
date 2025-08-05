import { db } from "@/server/db";

export const POST = async (request: Request) => {
  try {
    const { data } = await request.json();
    console.log("Received webhook event:", data);
    const { id, first_name, last_name, image_url } = data;
    const email = data.email_addresses[0]?.email_address || "";

    await db.user.upsert({
      where: { id },
      update: {
        email,
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
      },
      create: {
        id,
        email,
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
      },
    });
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
};
