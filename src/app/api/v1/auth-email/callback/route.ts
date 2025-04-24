import { NextResponse } from 'next/server'
// import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'confirm-email') {
      // Redirect to mobile app home page using custom URL scheme
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/confirm-email`)
    }

    return NextResponse.json({ type }, { status: 200 })
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
