import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateTransactionHistory } from '@/utils/helpers'

// Get all chats for a user
export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')!
    await updateTransactionHistory(userId)

    const chats = await prisma.chat.findMany({
      where: {
        userId,
        isArchived: false
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 1
        }
      }
    })
    
    return NextResponse.json(chats)
  } catch (error) {
    console.error('Get chats error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Create a new chat
export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')!
    await updateTransactionHistory(userId)
    const { title } = await request.json()
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }
    const chat = await prisma.chat.create({
      data: {
        title,
        user: {
          connect: {
            id: userId
          }
        }
      }
    })

    return NextResponse.json(chat, { status: 201 })
  } catch (error) {
    console.error('Create chat error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 