import { NextResponse } from 'next/server'
import { cleanAccounts, cleanTransactions } from '@/utils/helpers'
import PlaidClient from '@/lib/plaid'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id')!

    // Get user's Plaid access token from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plaidIntegration: true }
    })

    if (!user?.plaidIntegration?.accessToken) {
      return NextResponse.json(
        { error: 'Plaid access token not found' },
        { status: 404 }
      )
    }

    const plaidClient = new PlaidClient(user.plaidIntegration.accessToken)
    const response = await plaidClient.getTransactions()

    const cleanedAccounts = cleanAccounts(response.accounts)
    const addedTransactions = cleanTransactions(response.added, cleanedAccounts)
    const modifiedTransactions = cleanTransactions(response.modified, cleanedAccounts)

    const transactions = [...addedTransactions, ...modifiedTransactions]
    await prisma.plaidIntegration.update({
      where: { id: user.plaidIntegration.id },
      data: {
        transactions: JSON.stringify(transactions),
        accounts: JSON.stringify(cleanedAccounts)
      }
    })
    return NextResponse.json({ cleanedAccounts, transactions })
  } catch (error) {
    console.error('Fetch Plaid data error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
