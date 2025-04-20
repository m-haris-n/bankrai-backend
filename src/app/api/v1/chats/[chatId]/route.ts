import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get a single chat with its messages
export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')!
    const {chatId} = await params;
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userId
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Get chat error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Update a chat
export async function PATCH(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')!
    const { title, isArchived } = await request.json()

    const chat = await prisma.chat.update({
      where: {
        id: params.chatId,
        userId
      },
      data: {
        title,
        isArchived
      }
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Update chat error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Delete a chat
export async function DELETE(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')!

    await prisma.chat.delete({
      where: {
        id: params.chatId,
        userId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete chat error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 