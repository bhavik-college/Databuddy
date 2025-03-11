"use client"

import React, { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Code as CodeIcon,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Minus,
  ClipboardPaste
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Enhanced Markdown paste handler extension
const EnhancedMarkdownPasteHandler = Extension.create({
  name: 'enhancedMarkdownPasteHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('enhancedMarkdownPasteHandler'),
        props: {
          handlePaste: (view, event) => {
            const clipboardData = event.clipboardData
            
            if (!clipboardData) {
              return false
            }
            
            // Check for plain text that might be markdown
            const text = clipboardData.getData('text/plain')
            
            if (!text) {
              return false
            }
            
            // Check if the text looks like markdown
            const hasMarkdown = 
              text.includes('#') || 
              text.includes('**') || 
              text.includes('*') || 
              text.includes('```') || 
              text.includes('- ') || 
              text.includes('1. ') ||
              (text.includes('[') && text.includes('](')) ||
              text.includes('> ') ||
              text.includes('---') ||
              text.includes('===')
            
            if (hasMarkdown) {
              // Process markdown content manually for better control
              let processedText = text;
              
              // Process headings (# Heading)
              processedText = processedText.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
                const level = hashes.length;
                // Insert a heading node of the appropriate level
                view.dispatch(
                  view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.heading.create(
                      { level },
                      view.state.schema.text(content)
                    )
                  )
                );
                return ''; // Remove the processed heading from the text
              });
              
              // Process bullet lists (- item)
              if (processedText.match(/^-\s+(.+)$/gm)) {
                const items = processedText.match(/^-\s+(.+)$/gm);
                if (items && items.length > 0) {
                  const bulletList = view.state.schema.nodes.bulletList.create(
                    {},
                    items.map(item => {
                      const content = item.replace(/^-\s+/, '');
                      return view.state.schema.nodes.listItem.create(
                        {},
                        view.state.schema.nodes.paragraph.create(
                          {},
                          view.state.schema.text(content)
                        )
                      );
                    })
                  );
                  view.dispatch(view.state.tr.replaceSelectionWith(bulletList));
                  return true;
                }
              }
              
              // Process ordered lists (1. item)
              if (processedText.match(/^\d+\.\s+(.+)$/gm)) {
                const items = processedText.match(/^\d+\.\s+(.+)$/gm);
                if (items && items.length > 0) {
                  const orderedList = view.state.schema.nodes.orderedList.create(
                    {},
                    items.map(item => {
                      const content = item.replace(/^\d+\.\s+/, '');
                      return view.state.schema.nodes.listItem.create(
                        {},
                        view.state.schema.nodes.paragraph.create(
                          {},
                          view.state.schema.text(content)
                        )
                      );
                    })
                  );
                  view.dispatch(view.state.tr.replaceSelectionWith(orderedList));
                  return true;
                }
              }
              
              // Process code blocks (```code```)
              if (processedText.includes('```')) {
                const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]+?)```/g;
                let match;
                
                while ((match = codeBlockRegex.exec(processedText)) !== null) {
                  const language = match[1] || '';
                  const code = match[2] || '';
                  
                  const codeBlock = view.state.schema.nodes.codeBlock.create(
                    { language },
                    view.state.schema.text(code)
                  );
                  
                  view.dispatch(view.state.tr.replaceSelectionWith(codeBlock));
                  return true;
                }
              }
              
              // Process blockquotes (> quote)
              if (processedText.includes('> ')) {
                const blockquoteRegex = /^>\s+(.+)$/gm;
                const quotes = processedText.match(blockquoteRegex);
                
                if (quotes && quotes.length > 0) {
                  const content = quotes.map(q => q.replace(/^>\s+/, '')).join('\n');
                  const blockquote = view.state.schema.nodes.blockquote.create(
                    {},
                    view.state.schema.nodes.paragraph.create(
                      {},
                      view.state.schema.text(content)
                    )
                  );
                  
                  view.dispatch(view.state.tr.replaceSelectionWith(blockquote));
                  return true;
                }
              }
              
              // Process bold (**bold**)
              processedText = processedText.replace(/\*\*(.+?)\*\*/g, (match, content) => {
                const { from, to } = view.state.selection;
                view.dispatch(
                  view.state.tr
                    .insertText(content, from, to)
                    .addMark(
                      from,
                      from + content.length,
                      view.state.schema.marks.bold.create()
                    )
                );
                return '';
              });
              
              // Process italic (*italic*)
              processedText = processedText.replace(/\*(.+?)\*/g, (match, content) => {
                const { from, to } = view.state.selection;
                view.dispatch(
                  view.state.tr
                    .insertText(content, from, to)
                    .addMark(
                      from,
                      from + content.length,
                      view.state.schema.marks.italic.create()
                    )
                );
                return '';
              });
              
              // Process links ([text](url))
              processedText = processedText.replace(/\[(.+?)\]\((.+?)\)/g, (match, text, url) => {
                const { from, to } = view.state.selection;
                view.dispatch(
                  view.state.tr
                    .insertText(text, from, to)
                    .addMark(
                      from,
                      from + text.length,
                      view.state.schema.marks.link.create({ href: url })
                    )
                );
                return '';
              });
              
              // Process inline code (`code`)
              processedText = processedText.replace(/`(.+?)`/g, (match, content) => {
                const { from, to } = view.state.selection;
                view.dispatch(
                  view.state.tr
                    .insertText(content, from, to)
                    .addMark(
                      from,
                      from + content.length,
                      view.state.schema.marks.code.create()
                    )
                );
                return '';
              });
              
              // If there's still text left after processing, insert it normally
              if (processedText.trim()) {
                const { from, to } = view.state.selection;
                view.dispatch(view.state.tr.insertText(processedText, from, to));
              }
              
              return true;
            }
            
            return false;
          },
        },
      }),
    ]
  },
})

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  placeholder?: string
}

export function TiptapEditor({
  value,
  onChange,
  height = "min-h-[300px]",
  placeholder = "Write your content here..."
}: TiptapEditorProps) {
  const [activeTab, setActiveTab] = useState<string>('write')
  const [htmlOutput, setHtmlOutput] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'rounded-md bg-slate-800/50 p-4 font-mono text-sm',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-6 space-y-2',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-6 space-y-2',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'pl-2',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-sky-500 pl-4 italic text-gray-300',
          },
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'text-sky-400 underline decoration-sky-400/30 hover:decoration-sky-400',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-sky-500/10',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-sky-500/20 bg-slate-800/50 p-2 text-left font-bold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-sky-500/10 p-2',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      EnhancedMarkdownPasteHandler,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
      setHtmlOutput(html)
    },
    editorProps: {
      attributes: {
        class: `prose prose-lg dark:prose-invert max-w-none focus:outline-none ${height} p-4 font-nunito`,
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  const toolbar = [
    { 
      icon: <Bold size={16} />, 
      action: () => editor?.chain().focus().toggleBold().run(),
      isActive: () => editor?.isActive('bold') ?? false,
      tooltip: 'Bold (Ctrl+B)'
    },
    { 
      icon: <Italic size={16} />, 
      action: () => editor?.chain().focus().toggleItalic().run(),
      isActive: () => editor?.isActive('italic') ?? false,
      tooltip: 'Italic (Ctrl+I)'
    },
    { 
      icon: <UnderlineIcon size={16} />, 
      action: () => editor?.chain().focus().toggleUnderline().run(),
      isActive: () => editor?.isActive('underline') ?? false,
      tooltip: 'Underline (Ctrl+U)'
    },
    { 
      icon: <Heading1 size={16} />, 
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor?.isActive('heading', { level: 1 }) ?? false,
      tooltip: 'Heading 1'
    },
    { 
      icon: <Heading2 size={16} />, 
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor?.isActive('heading', { level: 2 }) ?? false,
      tooltip: 'Heading 2'
    },
    { 
      icon: <Heading3 size={16} />, 
      action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor?.isActive('heading', { level: 3 }) ?? false,
      tooltip: 'Heading 3'
    },
    { 
      icon: <List size={16} />, 
      action: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: () => editor?.isActive('bulletList') ?? false,
      tooltip: 'Bullet List'
    },
    { 
      icon: <ListOrdered size={16} />, 
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: () => editor?.isActive('orderedList') ?? false,
      tooltip: 'Numbered List'
    },
    { 
      icon: <Quote size={16} />, 
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      isActive: () => editor?.isActive('blockquote') ?? false,
      tooltip: 'Blockquote'
    },
    { 
      icon: <CodeIcon size={16} />, 
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor?.isActive('codeBlock') ?? false,
      tooltip: 'Code Block'
    },
    { 
      icon: <AlignLeft size={16} />, 
      action: () => editor?.chain().focus().setTextAlign('left').run(),
      isActive: () => editor?.isActive({ textAlign: 'left' }) ?? false,
      tooltip: 'Align Left'
    },
    { 
      icon: <AlignCenter size={16} />, 
      action: () => editor?.chain().focus().setTextAlign('center').run(),
      isActive: () => editor?.isActive({ textAlign: 'center' }) ?? false,
      tooltip: 'Align Center'
    },
    { 
      icon: <AlignRight size={16} />, 
      action: () => editor?.chain().focus().setTextAlign('right').run(),
      isActive: () => editor?.isActive({ textAlign: 'right' }) ?? false,
      tooltip: 'Align Right'
    },
    { 
      icon: <Minus size={16} />, 
      action: () => editor?.chain().focus().setHorizontalRule().run(),
      tooltip: 'Horizontal Rule'
    },
    { 
      icon: <TableIcon size={16} />, 
      action: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      isActive: () => editor?.isActive('table') ?? false,
      tooltip: 'Insert Table'
    },
    { 
      icon: <Pilcrow size={16} />, 
      action: () => editor?.chain().focus().setHardBreak().run(),
      tooltip: 'Line Break'
    },
    { 
      icon: <LinkIcon size={16} />, 
      action: () => {
        const url = window.prompt('URL')
        if (url) {
          editor?.chain().focus().setLink({ href: url }).run()
        }
      },
      isActive: () => editor?.isActive('link') ?? false,
      tooltip: 'Link'
    },
    { 
      icon: <ImageIcon size={16} />, 
      action: () => {
        const url = window.prompt('Image URL')
        if (url) {
          editor?.chain().focus().setImage({ src: url }).run()
        }
      },
      tooltip: 'Image'
    },
    { 
      icon: <Undo size={16} />, 
      action: () => editor?.chain().focus().undo().run(),
      tooltip: 'Undo'
    },
    { 
      icon: <Redo size={16} />, 
      action: () => editor?.chain().focus().redo().run(),
      tooltip: 'Redo'
    },
    { 
      icon: <ClipboardPaste size={16} />, 
      action: () => {
        const pasteMarkdown = async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              // Insert the text at the current cursor position
              editor?.chain().focus().insertContent(text).run();
              
              // Alert the user that markdown will be processed
              if (
                text.includes('#') || 
                text.includes('**') || 
                text.includes('*') || 
                text.includes('```') || 
                text.includes('- ') || 
                text.includes('1. ') ||
                (text.includes('[') && text.includes('](')) ||
                text.includes('> ')
              ) {
                console.log('Markdown content detected and pasted');
              }
            }
          } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
          }
        };
        
        pasteMarkdown();
      },
      tooltip: 'Paste Markdown'
    },
  ]

  return (
    <div className="w-full border rounded-md border-sky-500/10 bg-slate-900/30 backdrop-blur-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b border-sky-500/10 px-3 py-2">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger 
              value="write" 
              className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
            >
              Write
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
            >
              Preview
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'write' && (
            <div className="flex items-center space-x-1 overflow-x-auto pb-1">
              <TooltipProvider>
                {toolbar.map((item, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={item.isActive?.() ? "secondary" : "ghost"} 
                        size="sm" 
                        className={`h-8 w-8 p-0 ${item.isActive?.() ? 'bg-sky-500/20 text-sky-400' : ''}`}
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
          <EditorContent editor={editor} className={`h-[50vh] overflow-auto`} />
        </TabsContent>
        
        <TabsContent value="preview" className={`prose prose-lg dark:prose-invert max-w-none p-4 ${height} overflow-auto mt-0`}>
          {htmlOutput ? (
            <div 
              dangerouslySetInnerHTML={{ __html: htmlOutput }} 
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-poppins prose-headings:text-white prose-headings:font-semibold prose-headings:leading-tight
                prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                prose-p:text-base prose-p:leading-relaxed prose-p:text-gray-200
                prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline 
                prose-img:rounded-xl
                prose-strong:text-white prose-strong:font-semibold
                prose-em:text-gray-300 prose-em:italic
                prose-code:text-pink-400 prose-code:bg-slate-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-slate-800/50 prose-pre:border prose-pre:border-slate-700
                prose-blockquote:border-l-4 prose-blockquote:border-sky-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-300
                prose-li:text-gray-200 prose-li:marker:text-sky-400
                prose-table:border-collapse
                prose-th:border prose-th:border-sky-500/20 prose-th:bg-slate-800/50 prose-th:p-2
                prose-td:border prose-td:border-sky-500/10 prose-td:p-2
                prose-hr:border-sky-500/20"
            />
          ) : (
            <p className="text-muted-foreground">Nothing to preview</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 