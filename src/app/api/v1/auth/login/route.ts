import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (!user) {
      console.error('User not found')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password
    })

    if (authError) {
      console.error(authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user,
      session: authData.session
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
} 