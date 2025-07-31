import { supabase, supabaseAdmin, createClerkSupabaseClient } from '@/lib/supabase/client'

export interface UploadResult {
  id: string
  imageUrl: string
  fileName: string
  fileSize: number
  mimeType: string
}

/**
 * Upload image to Supabase Storage and create database record
 */
export async function uploadImage(file: File, userId: string): Promise<UploadResult> {
  try {
    // Create authenticated Supabase client (bypasses JWT issues)
    const supabaseAuth = await createClerkSupabaseClient()
    
    // Validate that the requesting user matches the authenticated user
    if (supabaseAuth.userId !== userId) {
      throw new Error('Access denied: User ID mismatch')
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `uploads/${userId}/${fileName}`

    // Upload file to Supabase Storage using service role (bypasses RLS for storage)
    const { error: uploadError } = await supabaseAuth.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabaseAuth.storage
      .from('images')
      .getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      throw new Error('Failed to generate public URL')
    }

    // Create database record using service role (app-level security)
    const { data: dbData, error: dbError } = await supabaseAuth
      .from('uploads')
      .insert({
        user_id: userId,
        image_url: urlData.publicUrl,
        status: 'pending',
        credit_used: false,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabaseAuth.storage.from('images').remove([filePath])
      throw new Error(`Database error: ${dbError.message}`)
    }

    return {
      id: dbData.id,
      imageUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    }
  } catch (error) {
    console.error('Error in uploadImage:', error)
    throw error
  }
}

/**
 * Get user's upload history
 */
export async function getUserUploads(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting user uploads:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserUploads:', error)
    throw error
  }
}

/**
 * Delete uploaded image and database record
 */
export async function deleteUpload(uploadId: string, userId: string): Promise<void> {
  try {
    // Get upload record to find the file path
    const { data: upload, error: fetchError } = await supabaseAdmin
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !upload) {
      throw new Error('Upload not found')
    }

    // Extract file path from URL
    const url = new URL(upload.image_url)
    const filePath = url.pathname.split('/storage/v1/object/public/images/')[1]

    if (filePath) {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([filePath])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete database record
    const { error: dbError } = await supabaseAdmin
      .from('uploads')
      .delete()
      .eq('id', uploadId)
      .eq('user_id', userId)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      throw new Error(`Failed to delete upload record: ${dbError.message}`)
    }
  } catch (error) {
    console.error('Error in deleteUpload:', error)
    throw error
  }
}