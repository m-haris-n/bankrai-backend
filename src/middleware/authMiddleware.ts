import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { NextRequest } from 'next/server'

export const authMiddleware = (handler: (req: NextRequest, user: any) => Promise<NextResponse>) => {
  return async (req: NextRequest) => {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const { data: { session }, error } = await supabase.auth.getSession()

    if (!session || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(req, session.user)
  }
} 