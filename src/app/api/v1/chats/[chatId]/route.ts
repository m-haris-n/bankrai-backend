import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{
    chatId: string
  }>
}

// Get chat details
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const authUserId = request.headers.get('x-user-id')!
    const { chatId } = await context.params

    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userId: authUserId
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
        { error: 'Chat not found or unauthorized' },
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

// Update chat
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const authUserId = request.headers.get('x-user-id')!
    const { chatId } = await context.params
    const { title, isArchived } = await request.json()

    const chat = await prisma.chat.update({
      where: {
        id: chatId,
        userId: authUserId
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

// Delete chat
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const authUserId = request.headers.get('x-user-id')!
    const { chatId } = await context.params

    await prisma.chat.delete({
      where: {
        id: chatId,
        userId: authUserId
      }
    })

    return NextResponse.json(
      { message: 'Chat deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete chat error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 