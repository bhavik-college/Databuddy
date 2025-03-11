"use client"

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  placeholder?: string
}

export function MarkdownEditor({
  value,
  onChange,
  height = "min-h-[300px]",
  placeholder = "Write your content here..."
}: MarkdownEditorProps) {
  const [content, setContent] = useState(value || '')
  const [activeTab, setActiveTab] = useState<string>('write')
  
  useEffect(() => {
    setContent(value || '')
  }, [value])
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setContent(newValue)
    onChange(newValue)
  }
  
  const insertMarkdown = (markdownSyntax: string, selectionOffset = 0) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    let newContent
    let newCursorPos
    
    if (markdownSyntax.includes('{}')) {
      // For syntax that wraps selected text (bold, italic, etc.)
      const parts = markdownSyntax.split('{}')
      newContent = 
        content.substring(0, start) + 
        parts[0] + selectedText + parts[1] + 
        content.substring(end)
      
      newCursorPos = selectedText.length > 0 
        ? start + parts[0].length + selectedText.length + parts[1].length
        : start + parts[0].length + selectionOffset
    } else {
      // For syntax that doesn't wrap (lists, etc.)
      newContent = 
        content.substring(0, start) + 
        markdownSyntax + 
        content.substring(start)
      
      newCursorPos = start + markdownSyntax.length
    }
    
    setContent(newContent)
    onChange(newContent)
    
    // Set focus back to textarea and restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }
  
  const toolbar = [
    { 
      icon: <Bold size={16} />, 
      action: () => insertMarkdown('**{}**', 2),
      tooltip: 'Bold (Ctrl+B)'
    },
    { 
      icon: <Italic size={16} />, 
      action: () => insertMarkdown('*{}*', 1),
      tooltip: 'Italic (Ctrl+I)'
    },
    { 
      icon: <List size={16} />, 
      action: () => insertMarkdown('- '),
      tooltip: 'Bullet List'
    },
    { 
      icon: <ListOrdered size={16} />, 
      action: () => insertMarkdown('1. '),
      tooltip: 'Numbered List'
    },
    { 
      icon: <LinkIcon size={16} />, 
      action: () => insertMarkdown('[{}](url)', 1),
      tooltip: 'Link'
    },
    { 
      icon: <Image size={16} />, 
      action: () => insertMarkdown('![alt text](image-url)'),
      tooltip: 'Image'
    },
    { 
      icon: <Code size={16} />, 
      action: () => insertMarkdown('`{}`', 1),
      tooltip: 'Inline Code'
    }
  ]
  
  return (
    <div className="w-full border rounded-md">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <TabsList>
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          {activeTab === 'write' && (
            <div className="flex items-center space-x-1">
              <TooltipProvider>
                {toolbar.map((item, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={item.action}
                      >
                        {item.icon}
                        <span className="sr-only">{item.tooltip}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          )}
        </div>
        
        <TabsContent value="write" className="p-0 mt-0">
          <Textarea
            value={content}
            onChange={handleChange}
            placeholder={placeholder}
            className={`border-0 rounded-none ${height} font-mono text-sm resize-none focus-visible:ring-0 focus-visible:ring-offset-0`}
            style={{ whiteSpace: 'pre-wrap' }}
          />
        </TabsContent>
        
        <TabsContent value="preview" className={`prose prose-sm max-w-none p-4 ${height} overflow-auto mt-0`}>
          {content ? (
            <div 
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} 
              className="whitespace-pre-line"
            />
          ) : (
            <p className="text-muted-foreground">Nothing to preview</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Simple markdown renderer
function renderMarkdown(markdown: string): string {
  if (!markdown) return ''
  
  // First, preserve line breaks by replacing them with a placeholder
  const placeholder = '___NEWLINE___'
  let html = markdown.replace(/\n/g, placeholder)
  
  // Ensure periods at the end of sentences have a space after them
  // This regex looks for a period followed by a non-whitespace character that isn't a period
  html = html.replace(/\.(?=[^\s\.])/g, '. ')
  
  // Apply markdown transformations
  html = html
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Bold and Italic
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Images
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" style="max-width: 100%;" />')
    
    // Lists
    .replace(/^\s*- (.*$)/gim, '<li>$1</li>')
    .replace(/^\s*\d+\. (.*$)/gim, '<li>$1</li>')
    
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    
    // Inline code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
  
  // Wrap lists
  html = html.replace(/<li>.*?<\/li>/gim, function(m) {
    return '<ul>' + m + '</ul>'
  }).replace(/<\/ul><ul>/gim, '')
  
  // Handle paragraphs - but be careful not to wrap existing HTML elements
  const paragraphs = html.split(placeholder)
  let processedHtml = ''
  let consecutiveEmptyLines = 0
  
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i]
    
    if (!p.trim()) {
      consecutiveEmptyLines++
      if (consecutiveEmptyLines <= 1) {
        processedHtml += '<br />'
      } else if (consecutiveEmptyLines === 2) {
        // Add extra space for paragraph break
        processedHtml += '<br /><br />'
      }
      // Skip more than 2 consecutive empty lines
      continue
    }
    
    consecutiveEmptyLines = 0
    
    if (/^<(h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote|pre|code)/i.test(p.trim())) {
      processedHtml += p // Don't wrap existing block elements
    } else {
      // Add a class to paragraphs for better styling
      processedHtml += `<p class="markdown-paragraph">${p}</p>` // Wrap text in paragraphs
    }
  }
  
  // Add some basic styling to the preview
  processedHtml = `
    <style>
      .markdown-paragraph {
        margin-bottom: 1em;
        line-height: 1.6;
      }
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
      }
      h1 { font-size: 1.8em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.3em; }
      a { color: #3b82f6; text-decoration: none; }
      a:hover { text-decoration: underline; }
      code { 
        background-color: rgba(0,0,0,0.1); 
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: monospace;
      }
      pre code {
        display: block;
        padding: 1em;
        overflow-x: auto;
        background-color: rgba(0,0,0,0.15);
        border-radius: 6px;
      }
      ul, ol {
        padding-left: 2em;
        margin-bottom: 1em;
      }
      li {
        margin-bottom: 0.5em;
      }
      blockquote {
        border-left: 4px solid #3b82f6;
        padding-left: 1em;
        margin-left: 0;
        font-style: italic;
      }
      img {
        max-width: 100%;
        border-radius: 6px;
      }
    </style>
  ` + processedHtml
  
  return processedHtml
} 