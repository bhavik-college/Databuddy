import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Hash } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount?: number;
}

interface RelatedTagsProps {
  currentTagId: string;
  tags: Tag[];
  title?: string;
  maxTags?: number;
}

export function RelatedTags({ 
  currentTagId, 
  tags, 
  title = "Related Tags", 
  maxTags = 10 
}: RelatedTagsProps) {
  // Filter out the current tag and sort by post count
  const relatedTags = tags
    .filter(tag => tag.id !== currentTagId)
    .sort((a, b) => (b.postCount || 0) - (a.postCount || 0))
    .slice(0, maxTags);

  if (relatedTags.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5 shadow-sm">
      <h3 className="text-lg font-poppins font-medium text-white border-b border-sky-500/20 pb-2 mb-4 flex items-center">
        <Hash className="h-4 w-4 mr-2 text-sky-400" />
        {title}
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {relatedTags.map(tag => (
          <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
            <Badge 
              variant="secondary" 
              className="bg-sky-500/5 hover:bg-sky-500/10 text-sky-300 border border-sky-500/10 hover:border-sky-500/20 transition-colors cursor-pointer"
            >
              #{tag.name}
              {tag.postCount !== undefined && (
                <span className="text-xs ml-1 opacity-70">({tag.postCount})</span>
              )}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
} 