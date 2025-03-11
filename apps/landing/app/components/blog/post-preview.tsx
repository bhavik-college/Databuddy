import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, X } from 'lucide-react'
import Image from 'next/image'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PostPreviewProps {
  title: string
  content: string
  coverImage?: string
  onClose: () => void
}

export function PostPreview({ title, content, coverImage, onClose }: PostPreviewProps) {
  // Process content to preserve newlines for markdown
  const processedContent = content
    .replace(/\n/g, '  \n') // Add two spaces before newlines for markdown line breaks
    .replace(/\n\s*\n/g, '\n\n') // Preserve paragraphs

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">{title || 'Post Preview'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pb-6">
          {coverImage && (
            <div className="relative w-full h-[300px] mb-6 rounded-md overflow-hidden">
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
            <Markdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Preserve whitespace in paragraphs
                p: ({node, ...props}) => (
                  <p style={{whiteSpace: 'pre-wrap'}} {...props} />
                ),
                // Preserve whitespace in code blocks
                code: ({node, ...props}) => (
                  <code style={{whiteSpace: 'pre'}} {...props} />
                )
              }}
            >
              {processedContent || 'No content to preview'}
            </Markdown>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function PreviewButton({ onClick }: { onClick: () => void }) {
  return (
    <Button 
      type="button" 
      variant="outline" 
      onClick={onClick}
      className="flex items-center gap-2"
    >
      <Eye className="h-4 w-4" />
      Preview
    </Button>
  )
} 