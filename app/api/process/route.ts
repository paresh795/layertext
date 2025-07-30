import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { removeBackground, isFalConfigured, validateImageUrl } from '@/lib/services/fal'
import { supabaseAdmin } from '@/lib/supabase/client'
import { hasCredits, deductUserCredits, getUserCredits } from '@/lib/services/credits'

/**
 * POST /api/process
 * Process uploaded image with FAL API background removal
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

    // Check if FAL API is configured
    if (!isFalConfigured()) {
      return NextResponse.json(
        { error: 'Background removal service not configured' },
        { status: 503 }
      )
    }

    const { uploadId } = await request.json()

    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID is required' },
        { status: 400 }
      )
    }

    // Get upload record and verify ownership
    const { data: upload, error: fetchError } = await supabaseAdmin
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !upload) {
      return NextResponse.json(
        { error: 'Upload not found or access denied' },
        { status: 404 }
      )
    }

    // Check if already processed
    if (upload.status === 'complete' && upload.fal_output_url) {
      console.log('⚠️ Upload already processed, returning existing result')
      return NextResponse.json({
        success: true,
        upload: upload,
        message: 'Already processed'
      })
    }

    // Check if currently processing to prevent race conditions
    if (upload.status === 'processing') {
      console.log('⚠️ Upload already being processed, rejecting duplicate request')
      return NextResponse.json({
        error: 'Image is already being processed. Please wait.'
      }, { status: 409 }) // Conflict status
    }

    // Check user credits
    const userHasCredits = await hasCredits(user.id, 1)
    if (!userHasCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits to continue.' },
        { status: 402 }
      )
    }

    // Validate image URL
    if (!validateImageUrl(upload.image_url)) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      )
    }

    // Update status to processing (atomic operation to prevent race conditions)
    const { data: lockResult, error: lockError } = await supabaseAdmin
      .from('uploads')
      .update({ status: 'processing' })
      .eq('id', uploadId)
      .eq('status', 'pending') // Only update if still pending
      .select('id')

    if (lockError || !lockResult || lockResult.length === 0) {
      console.log('⚠️ Failed to lock upload for processing - may already be processed')
      return NextResponse.json({
        error: 'Upload is already being processed or completed'
      }, { status: 409 })
    }

    console.log('🔒 Successfully locked upload for processing')

    // Call FAL API
    const falResult = await removeBackground(upload.image_url)

    if (!falResult.success) {
      // Reset status on failure
      await supabaseAdmin
        .from('uploads')
        .update({ status: 'pending' })
        .eq('id', uploadId)

      return NextResponse.json(
        { error: `Background removal failed: ${falResult.error}` },
        { status: 500 }
      )
    }

    // Atomic operation: deduct credit and update upload record
    try {
      // Deduct credit first (atomic operation)
      const remainingCredits = await deductUserCredits(user.id, 1)

      // Update upload record
      const { data: updatedUpload, error: updateError } = await supabaseAdmin
        .from('uploads')
        .update({
          fal_output_url: falResult.imageUrl,
          status: 'complete',
          credit_used: true
        })
        .eq('id', uploadId)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update upload record:', updateError)
        return NextResponse.json(
          { error: 'Failed to save processing results' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        upload: updatedUpload,
        creditsRemaining: remainingCredits
      })

    } catch (creditError) {
      console.error('Failed to deduct credit:', creditError)
      
      // Reset upload status since credit deduction failed
      await supabaseAdmin
        .from('uploads')
        .update({ status: 'pending' })
        .eq('id', uploadId)

      return NextResponse.json(
        { error: 'Credit deduction failed. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Process API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Processing failed',
        success: false 
      },
      { status: 500 }
    )
  }
}