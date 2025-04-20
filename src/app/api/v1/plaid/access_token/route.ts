import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { encrypt } from "@/utils/crypto";

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST(req: Request) {
  if (req.method == "POST") {
    try {
      let body = await req.json();
      const public_token = body.public_token;

      const existingUser = await prisma.user.findFirst({
        where: {
          id: body.user_id,
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          { user: "No user registered." },
          { status: 404 }
        );
      }

      const plaidResponse = await plaidClient.itemPublicTokenExchange({
        public_token,
      });

      // Encrypt the access token before storing
      const encryptedAccessToken = encrypt(plaidResponse.data.access_token);

      const updatedUser = await prisma.user.update({
        where: { id: body.user_id },
        data: {
          plaidIntegration: {
            create: {
              accessToken: encryptedAccessToken,
              institute_id: body.institute_id,
            },
          },
        },
      });

      if (updatedUser) {
        return NextResponse.json({ is_plaid_connect: true });
      } else {
        return NextResponse.json({ error: "User not updated" });
      }
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Unknown error" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }
}
