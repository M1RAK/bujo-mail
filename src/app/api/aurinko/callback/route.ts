import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { NextResponse, type NextRequest } from "next/server";
import { waitUntil } from "@vercel/functions";

import { getAurinkoToken, getAccountDetails } from "@/lib/aurinko";
import { db } from "@/server/db";

export const GET = async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const params = request.nextUrl.searchParams;

  const status = params.get("status");
  if (status !== "success")
    return NextResponse.json(
      { message: "Failed to link account" },
      { status: 401 },
    );

  const code = params.get("code");
  if (!code)
    return NextResponse.json({ message: "No code provided" }, { status: 400 });

  const token = await getAurinkoToken(code as string);
  if (!token)
    return NextResponse.json(
      { message: "Failed to exchange code for access token." },
      { status: 400 },
    );

  const accountDetails = await getAccountDetails(token.accessToken);

  await db.account.upsert({
    where: {
      id: token.accountId.toString(),
    },
    create: {
      id: token.accountId.toString(),
      userId,
      token: token.accessToken,
      emailAddress: accountDetails.email,
      name: accountDetails.name,
    },
    update: {
      token: token.accessToken,
    },
  });

  // trigger initial sync endpoint

  waitUntil(
    axios
      .post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, {
        accountId: token.accountId.toString(),
        userId,
      })
      .then((response) => console.log("Initial sync triggered", response.data))
      .catch((error) => console.error("Failed to trigger initial sync", error)),
  );

  return NextResponse.redirect(new URL("/mail", request.url));
};
