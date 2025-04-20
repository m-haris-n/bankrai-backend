import {
   PlaidApi,
   PlaidEnvironments,
   Configuration,
   TransactionsSyncRequest,
} from "plaid";
import { decrypt } from "@/utils/crypto";

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const ENVIRONMENT = process.env.PLAID_ENV;

const config = new Configuration({
   basePath: PlaidEnvironments.sandbox,
   baseOptions: {
      headers: { 
         'PLAID-CLIENT-ID': PLAID_CLIENT_ID, 
         'PLAID-SECRET': PLAID_SECRET 
      },
   },
});

class PlaidClient {
   private plaidApi: PlaidApi;
   private accessToken: string;

   constructor(encryptedAccessToken: string) {
      this.plaidApi = new PlaidApi(config);
      this.accessToken = decrypt(encryptedAccessToken);
   }

   public async getTransactions(cursor: string = "") {
      try {
         const request: TransactionsSyncRequest = {
            access_token: this.accessToken,
            cursor: cursor,
            count: 500,
         };
         console.log("Request: ", request)
         const response = await this.plaidApi.transactionsSync(request);
         return response.data;
      } catch (error) {
         console.log("Error fetching transactions:", JSON.stringify(error));
         throw error;
      }
   }
}

export default PlaidClient;
