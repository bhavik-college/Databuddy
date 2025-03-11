import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, X, Image as ImageIcon, Check } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ImageSize } from '@/app/lib/supabase'

interface BlogImageUploadProps {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function BlogImageUpload({ 
  value, 
  onChange, 
  disabled = false
}: BlogImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'blog-images')
      formData.append('folder', 'posts')
      formData.append('optimize', 'true')
      formData.append('sizes', JSON.stringify(['large'])) // Only use large size
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      const data = await response.json()
      
      if (data.optimized && data.urls) {
        // Use the large size URL directly
        onChange(data.urls.large)
        toast.success('Image uploaded and optimized successfully')
      } else {
        // Fallback to original upload method result
        onChange(data.url)
        toast.success('Image uploaded successfully')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={disabled || isUploading}
        className="hidden"
      />
      
      {value ? (
        <div className="space-y-4">
          <div className="relative aspect-video rounded-md overflow-hidden border border-border">
            <Image
              src={value}
              alt="Blog image"
              fill
              className="object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Using optimized WebP format (1200×1200) for better performance
          </p>
        </div>
      ) : (
        <div 
          onClick={handleClick}
          className="relative aspect-video flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/50 bg-muted/50 hover:bg-muted transition cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading and optimizing...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload a blog image</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3 w-3" />
                <span>Automatically optimized to WebP format</span>
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP or GIF (max 5MB)</p>
            </>
          )}
        </div>
      )}
    </div>
  )
} 