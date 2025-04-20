import PlaidClient from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Transaction } from "plaid";
import { AccountBase } from "plaid";

export interface PlaidAccount {
   id: string;
   name: string;
   official_name: string;
   type: string;
   subtype: string;
   available_balance: number;
   current_balance: number;
   currency: string;
}
export interface PlaidTransaction {
   id: string;
   account: string;
   amount: number;
   date: string;
   name: string;
   merchant_name: string;
   payment_channel: string;
   personal_finance_category: string;
   personal_finance_category_detailed: string;
   category: string | string[];
   currency: string;
   pending: boolean;
}

export const cleanAccounts = (accounts: AccountBase[]): PlaidAccount[] => {
   return accounts.map((account) => {
      return {
         id: account.account_id,
         name: account.name,
         official_name: account.official_name || "",
         type: account.type,
         subtype: account.subtype || "",
         available_balance: account.balances.available || 0,
         current_balance: account.balances.current || 0,
         currency: account.balances.iso_currency_code || "USD",
      };
   });
};

export const cleanTransactions = (
   transactions: Transaction[],
   accounts: PlaidAccount[]
) => {
   return transactions.map((transaction) => {
      return {
         id: transaction.transaction_id,
         account: accounts.find(
            (account: PlaidAccount) => account.id === transaction.account_id
         )?.name,
         amount: transaction.amount,
         date: transaction.date,
         name: transaction.name,
         merchant_name: transaction.merchant_name,
         payment_channel: transaction.payment_channel,
         personal_finance_category:
            transaction.personal_finance_category?.primary,
         personal_finance_category_detailed:
            transaction.personal_finance_category?.detailed,
         category: transaction.category,
         currency: transaction.iso_currency_code,
         pending: transaction.pending,
      };
   }) as PlaidTransaction[];
};

export async function countGeminiTokens(
   text: string,
   modelName = "gemini-pro"
) {
   const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string); // Replace with your API key
   const model = genAI.getGenerativeModel({ model: modelName });

   const countTokensResponse = await model.countTokens(text);
   return countTokensResponse.totalTokens;
}



export const updateTransactionHistory = async (userId: string) => {
   try {
     // Get user with access token
     const user = await prisma.user.findUniqueOrThrow({
       where: {
         id: userId,
       },
       select: {
        plaidIntegration: true,
       },
     });
     let cursor = "";
     let cleanedAccounts: PlaidAccount[] = [];
     let cleanedTransactions: PlaidTransaction[] = [];
     // Initialize Plaid client and fetch transactions
     const plaidClient = new PlaidClient(user.plaidIntegration?.accessToken as string);
     while (true) {
       const transactions = await plaidClient.getTransactions(cursor);
 
       // Clean the data
       cleanedAccounts.push(...cleanAccounts(transactions.accounts));
       cleanedTransactions.push(
         ...cleanTransactions(transactions.added, cleanedAccounts)
       );
 
       const tokens = await countGeminiTokens(
         JSON.stringify(cleanedTransactions),
         process.env.GOOGLE_MODEL as string
       );
       if (tokens > 100000 || !transactions.has_more) {
         break;
       }
       cursor = transactions.next_cursor;
     }
     // Check if a record exists for this user
     await prisma.plaidIntegration.update({
       where: {
         userId: userId,
       },
       data: {
         accounts: JSON.stringify(cleanedAccounts),
         transactions: JSON.stringify(cleanedTransactions),
       },
       
     });
 
     return {
       accounts: cleanedAccounts,
       transactions: cleanedTransactions,
     };
   } catch (error) {
     console.error("Error updating transaction history:", error);
     throw error;
   }
 };