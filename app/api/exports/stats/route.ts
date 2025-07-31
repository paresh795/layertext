import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET() {
  try {
    // Authenticate user
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get total exports count
    const { count: totalExports } = await supabaseAdmin
      .from('exports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get exports this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: exportsThisMonth } = await supabaseAdmin
      .from('exports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    // Get total credits used from uploads
    const { data: uploads } = await supabaseAdmin
      .from('uploads')
      .select('credit_used')
      .eq('user_id', userId)
      .eq('credit_used', true)

    const totalCreditsUsed = uploads?.length || 0

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentExports } = await supabaseAdmin
      .from('exports')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    // Group by day for chart data
    const activityData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      date.setHours(0, 0, 0, 0)
      
      const dayExports = recentExports?.filter(exp => {
        const expDate = new Date(exp.created_at)
        expDate.setHours(0, 0, 0, 0)
        return expDate.getTime() === date.getTime()
      }).length || 0

      return {
        date: date.toISOString().split('T')[0],
        exports: dayExports,
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalExports: totalExports || 0,
        exportsThisMonth: exportsThisMonth || 0,
        totalCreditsUsed,
        activityData,
      },
    })

  } catch (error) {
    console.error('Export stats API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}