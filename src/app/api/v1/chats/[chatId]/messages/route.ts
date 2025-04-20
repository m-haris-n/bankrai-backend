import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MessageRole } from "@/generated/prisma";
import { getMasterPrompt, masterPrompt } from "@/utils/prompts";
import { countGeminiTokens } from "@/utils/helpers";

type RouteContext = {
   params: Promise<{
      chatId: string;
   }>;
};

// Get all messages in a chat
export async function GET(
   request: Request,
   context: RouteContext
) {
   try {
      const authUserId = request.headers.get("x-user-id")!;
      const { chatId } = await context.params;

      // Get chat to verify ownership
      const chat = await prisma.chat.findUnique({
         where: {
            id: chatId,
            userId: authUserId,
         },
      });

      if (!chat) {
         return NextResponse.json(
            { error: "Chat not found or unauthorized" },
            { status: 404 }
         );
      }

      // Get messages for the chat
      const messages = await prisma.message.findMany({
         where: {
            chatId: chatId,
         },
         orderBy: {
            createdAt: "asc",
         },
      });

      return NextResponse.json(messages);
   } catch (error) {
      console.error("Get messages error:", error);
      return NextResponse.json(
         { error: "Something went wrong" },
         { status: 500 }
      );
   }
}

// Create a new message
export async function POST(
   request: Request,
   context: RouteContext
) {
   try {
      const userId = request.headers.get("x-user-id")!;
      const { content } = await request.json();
      const { chatId } = await context.params;

      if (!content) {
         return NextResponse.json(
            { error: "Content is required" },
            { status: 400 }
         );
      }

      // First check if the chat belongs to the user
      const chat = await prisma.chat.findUnique({
         where: {
            id: chatId,
            userId,
         },
      });

      if (!chat) {
         return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }

      const messageHistory = await prisma.message.findMany({
         where: {
            chatId: chatId,
         },
         orderBy: {
            createdAt: "asc",
         },
      });

      const transactionHistory =
         await prisma.plaidIntegration.findUniqueOrThrow({
            where: {
               userId,
            },
         });
      console.log("Transaction history: ", transactionHistory)
      // Format request for Python backend
      const chatRequest = {
         message: content,
         chat_history: [
            {
               role: "user",
               content: `${getMasterPrompt(
                  JSON.parse(transactionHistory.transactions!),
                  JSON.parse(transactionHistory.accounts!)
               )}`,
            },
            {
               role: "model",
               content: "Sure, understood.",
            },
            ...messageHistory.map((msg) => ({
               role: msg.role,
               content: msg.content,
            })),
         ],
      };

      // Check token count
      const tokens = await countGeminiTokens(
         JSON.stringify(chatRequest),
         process.env.GOOGLE_MODEL as string
      );
      if (tokens >= 500000) {
         return NextResponse.json(
            { error: "Exceeded chat limit. Please start a new chat." },
            { status: 400 }
         );
      }
      // Send request to Python backend
      const response = await fetch(`${process.env.AI_ENGINE_URL}/chat`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify(chatRequest),
      });

      const data = await response.json();
      const aiResponse = data.response;
      console.log("AI response: ", data)
      if(!data.response){
         return NextResponse.json(
            { error: "No response from AI" },
            { status: 400 }
         );
      }
      
      await prisma.message.create({
         data: {
            content,
            role: MessageRole.user,
            chatId: chatId,
         },
      });

      const aiResponseMessage = await prisma.message.create({
         data: {
            content: aiResponse,
            role: MessageRole.model,
            chatId: chatId,
         },
      });

      // Update chat's updatedAt timestamp
      await prisma.chat.update({
         where: {
            id: chatId,
         },
         data: {
            updatedAt: new Date(),
         },
      });

      return NextResponse.json(aiResponseMessage, { status: 201 });
   } catch (error) {
      console.error("Create message error:", error);
      return NextResponse.json(
         { error: "Something went wrong" },
         { status: 500 }
      );
   }
}
