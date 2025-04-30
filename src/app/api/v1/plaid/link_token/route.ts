
import { NextRequest, NextResponse } from "next/server";
import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from "plaid";

const configuration = new Configuration({
  basePath: process.env.PLAID_ENV === "sandbox" ? PlaidEnvironments.sandbox : PlaidEnvironments.production,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export const GET = async (request: NextRequest) => {
  try {
    console.log("request", request);
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.searchParams);
    const id = searchParams.get("id") as string;
    console.log("id", id);
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: id },
      client_name: "Bankr Ai",
      products: ["transactions" as Products], // Use 'auth' for user authentication
      country_codes: ["US" as CountryCode],
      language: "en",
      android_package_name: 'com.supportive.bankrai',
    });
    console.log(response.data);
    return NextResponse.json(response.data);
  } catch (error) {


    if (error instanceof Error) {
      console.log("error", error.message, error.cause);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Unknown error" },
      { status: 500 }
    );
  }
};
