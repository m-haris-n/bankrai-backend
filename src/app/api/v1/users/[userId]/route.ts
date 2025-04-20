import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

// Get user profile
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const authUserId = request.headers.get('x-user-id')!

    // Users can only view their own profile
    if (authUserId !== params.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        id: params.userId
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Update user profile
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const authUserId = request.headers.get('x-user-id')!
    const { fullName } = await request.json()

    // Users can only update their own profile
    if (authUserId !== params.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const user = await prisma.user.update({
      where: {
        id: params.userId
      },
      data: {
        fullName
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Delete user and all associated data
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const authUserId = request.headers.get('x-user-id')!

    // Users can only delete their own account
    if (authUserId !== params.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get user email before deletion for Supabase Auth
    const user = await prisma.user.findUnique({
      where: { id: params.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: {
        id: params.userId
      }
    })

    // Delete user from Supabase Auth using admin client
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (authError) {
      console.error('Error deleting user from Supabase Auth:', authError)
      return NextResponse.json(
        { error: 'Error deleting user from authentication service' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'User and all associated data deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 