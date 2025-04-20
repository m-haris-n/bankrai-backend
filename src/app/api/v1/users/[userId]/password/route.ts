import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

type RouteContext = {
  params: Promise<{
    userId: string
  }>
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const authUserId = request.headers.get('x-user-id')!
    const { userId } = await context.params
    const { currentPassword, newPassword } = await request.json()

    // Users can only update their own password
    if (authUserId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get user email for Supabase Auth
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update password in Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (authError) {
      console.error('Update password error:', authError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 