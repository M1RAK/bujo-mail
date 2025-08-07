import { Account } from "@/lib/account";
import { db } from "@/server/db";
import { NextResponse, NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  const { accountId, userId } = await request.json();

  if (!accountId || !userId)
    return NextResponse.json(
      { message: "Missing accountId or userId." },
      { status: 400 },
    );

  const dbAccount = await db.account.findUnique({
    where: {
      id: accountId,
      userId,
    },
  });

  if (!dbAccount)
    return NextResponse.json(
      { message: "Account not found." },
      { status: 404 },
    );

  const account = new Account(dbAccount.token);
  const response = await account.performInitialSync();
  if (!response)
    return NextResponse.json(
      { message: "Initial sync failed." },
      { status: 500 },
    );
  const { emails, deltaToken } = response;

  console.log(emails);
  return NextResponse.json(
    { message: "Initial sync completed." },
    { status: 200 },
  );
  // await db.account.update({
  //   where: {
  //     id: accountId,
  //   },
  //   data: {
  //     nextDeltaToken: deltaToken,
  //   },
  // });

  // await syncEmailsToDb(emails);
};
