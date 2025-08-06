import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  if (!status)
    return NextResponse.json(
      { message: "Failed to link account" },
      { status: 401 },
    );

  const code = params.get("code");
  if (!code)
    return NextResponse.json({ message: "No code provided" }, { status: 400 });
  const token = await exchangeCodeForAccessToken(code);

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
    update: {
      accessToken: token.accessToken,
    },
    create: {
      id: token.accessToken.toString(),
      userId,
      email: accountDetails.email,
      name: accountDetails.name,
      accessToken: token.accessToken,
    },
  });

  return NextResponse.redirect(new URL("/mail", request.url));
};
