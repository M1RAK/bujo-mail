"use server";
import axios from "axios";
import { auth } from "@clerk/nextjs/server";

export const getAurinkoAuthorizationUrl = async (
  serviceType: "Google" | "Office365",
) => {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found.");

  const params = new URLSearchParams({
    clientId: process.env.AURINKO_CLIENT_ID as string,
    serviceType,
    scope: "Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All",
    responseType: "code",
    returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`,
  });

  return `${process.env.AURINKO_BASEURL}/auth/authorize?${params.toString()}`;
};

export const getAurinkoToken = async (code: string) => {
  try {
    const response = await axios.post(
      `${process.env.AURINKO_BASEURL}/auth/token/${code}`,
      {},
      {
        auth: {
          username: process.env.AURINKO_CLIENT_ID as string,
          password: process.env.AURINKO_CLIENT_SECRET as string,
        },
      },
    );

    return response.data as {
      accountId: number;
      accessToken: string;
      userId: string;
      userSession: string;
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
    }
    // throw new Error("Failed to exchange code for access token.");
    console.error(error);
  }
};

export const getAccountDetails = async (accessToken: string) => {
  try {
    const response = await axios.get(`${process.env.AURINKO_BASEURL}/account`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data as {
      email: string;
      name: string;
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching account details:", error.response?.data);
    } else {
      console.error("Unexpected error fetching account details:", error);
    }
    throw error;
  }
};
