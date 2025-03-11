'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Facebook, Linkedin, Mail, Share2, Twitter } from 'lucide-react'

interface SocialShareProps {
  title: string
  url: string
}

export function SocialShare({ title, url }: SocialShareProps) {
  const [currentUrl, setCurrentUrl] = useState(url)
  
  // Update URL on client side to ensure we have the full URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
  }, [])
  
  const encodedTitle = encodeURIComponent(title)
  const encodedUrl = encodeURIComponent(currentUrl)
  
  const shareLinks = [
    {
      name: 'Twitter',
      icon: <Twitter className="h-4 w-4" />,
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20'
    },
    {
      name: 'Facebook',
      icon: <Facebook className="h-4 w-4" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'bg-[#4267B2]/10 text-[#4267B2] hover:bg-[#4267B2]/20'
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="h-4 w-4" />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20'
    },
    {
      name: 'Email',
      icon: <Mail className="h-4 w-4" />,
      url: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      color: 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'
    }
  ]
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl)
    toast.success('Link copied to clipboard')
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {shareLinks.map((link) => (
        <Button
          key={link.name}
          variant="ghost"
          size="sm"
          className={link.color}
          onClick={() => window.open(link.url, '_blank')}
          aria-label={`Share on ${link.name}`}
        >
          {link.icon}
          <span className="sr-only">{link.name}</span>
        </Button>
      ))}
      
      <Button
        variant="ghost"
        size="sm"
        className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"
        onClick={handleCopyLink}
        aria-label="Copy link"
      >
        <Share2 className="h-4 w-4" />
        <span className="sr-only">Copy link</span>
      </Button>
    </div>
  )
} 