import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * POST /api/export
 * Save exported image to Supabase Storage and database
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { canvasDataUrl, textLayers } = await request.json()

    if (!canvasDataUrl) {
      return NextResponse.json(
        { error: 'Canvas data is required' },
        { status: 400 }
      )
    }

    if (!canvasDataUrl.startsWith('data:image/png;base64,')) {
      return NextResponse.json(
        { error: 'Invalid canvas data format' },
        { status: 400 }
      )
    }

    // Convert data URL to blob
    const response = await fetch(canvasDataUrl)
    const blob = await response.blob()
    
    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `export-${timestamp}.png`
    const filePath = `exports/${user.id}/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/png'
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to generate public URL' },
        { status: 500 }
      )
    }

    // Extract primary text layer for database
    const primaryTextLayer = textLayers?.[0] || {
      text: '',
      fontSize: 80,
      color: '#ffffff',
      shadowBlur: 6,
      x: 50,
      y: 50
    }

    // Save to database (without upload_id for now - will add after schema update)
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('exports')
      .insert({
        user_id: user.id,
        export_url: urlData.publicUrl,
        text_content: primaryTextLayer.text,
        font_size: primaryTextLayer.fontSize,
        font_color: primaryTextLayer.color,
        shadow: `${primaryTextLayer.shadowBlur}px`,
        position_x: primaryTextLayer.x,
        position_y: primaryTextLayer.y,
        // upload_id: uploadId || null  // Will enable after schema update
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage.from('images').remove([filePath])
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      export: {
        id: dbData.id,
        exportUrl: urlData.publicUrl,
        fileName
      }
    })

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Export failed',
        success: false 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/export
 * Get user's export history
 */
export async function GET() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: exports, error } = await supabaseAdmin
      .from('exports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch exports' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      exports: exports || []
    })

  } catch (error) {
    console.error('Get exports API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exports' },
      { status: 500 }
    )
  }
}