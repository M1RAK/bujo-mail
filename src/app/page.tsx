"use client";
import { Button } from "@/components/ui/button";
import { getAurinkoAuthorizationUrl } from "@/lib/aurinko";

export default function Home() {
  return (
    <>
      <h1 className="mt-4 text-center text-5xl text-teal-500">
        Welcome to Bullet Mail.
      </h1>
      <Button
        onClick={async () => {
          const authUrl = await getAurinkoAuthorizationUrl("Google");
          console.log("authUrl: ", authUrl);
          window.location.href = authUrl;
        }}
      >
        Link Account
      </Button>
    </>
  );
}
