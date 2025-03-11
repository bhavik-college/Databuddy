import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth' 
import { uploadFile, uploadOptimizedImage, ImageSize } from '@/app/lib/supabase'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow authors, editors, and admins to upload files
    if (!['AUTHOR', 'EDITOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Get bucket and folder from form data
    const bucket = formData.get('bucket') as string || 'blog-images'
    const folder = formData.get('folder') as string || ''
    
    // Check if optimization is requested
    const optimize = formData.get('optimize') === 'true'
    
    if (optimize && file.type.startsWith('image/')) {
      // Parse requested sizes or use defaults
      let sizes: ImageSize[] = ['thumbnail', 'medium', 'large']
      const requestedSizes = formData.get('sizes') as string
      
      if (requestedSizes) {
        try {
          const parsedSizes = JSON.parse(requestedSizes) as ImageSize[]
          if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
            sizes = parsedSizes
          }
        } catch (e) {
          console.warn('Invalid sizes format, using defaults')
        }
      }
      
      // Upload optimized images
      const imageUrls = await uploadOptimizedImage(file, sizes, bucket, folder)
      return NextResponse.json({ urls: imageUrls, optimized: true })
    } else {
      // Upload file with folder path if provided (original method)
      const publicUrl = await uploadFile(file, bucket, folder)
      return NextResponse.json({ url: publicUrl, optimized: false })
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
} 