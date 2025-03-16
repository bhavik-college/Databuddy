// Utility functions to fetch blog data from API routes

import { Post, Category, Tag } from '@/types/blog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.databuddy.cc';

// Helper function to handle API responses
async function fetchAPI<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/blog/${endpoint}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.statusText}`);
      return fallback;
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return fallback;
  }
}

// Get all posts
export async function getAllPosts(): Promise<Post[]> {
  return fetchAPI<Post[]>('posts', []);
}

// Get a single post by slug
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/blog/posts/${slug}`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error(`API error: ${response.statusText}`);
      return null;
    }
    
    return await response.json() as Post;
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
}

// Get recent posts
export async function getRecentPosts(limit: number = 5): Promise<Post[]> {
  return fetchAPI<Post[]>(`recent-posts?limit=${limit}`, []);
}

// Get related posts
export async function getRelatedPosts(
  postId: string,
  categoryIds: string[],
  tagIds: string[],
  limit: number = 3
): Promise<Post[]> {
  const categoryParams = categoryIds.map(id => `categoryId=${id}`).join('&');
  const tagParams = tagIds.map(id => `tagId=${id}`).join('&');
  
  return fetchAPI<Post[]>(
    `related-posts?postId=${postId}&${categoryParams}&${tagParams}&limit=${limit}`,
    []
  );
}

// Get posts by category
export async function getPostsByCategory(categoryId: string): Promise<Post[]> {
  try {
    const posts = await getAllPosts();
    return posts.filter(post => 
      post.categories?.some((category: Category) => category.id === categoryId) || false
    );
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    return [];
  }
}

// Get posts by tag
export async function getPostsByTag(tagId: string): Promise<Post[]> {
  try {
    const posts = await getAllPosts();
    return posts.filter(post => 
      post.tags?.some(tag => tag.id === tagId) || false
    );
  } catch (error) {
    console.error('Error fetching posts by tag:', error);
    return [];
  }
}

// Get all categories
export async function getAllCategories(): Promise<Category[]> {
  return fetchAPI<Category[]>('categories', []);
}

// Get all tags
export async function getAllTags(): Promise<Tag[]> {
  return fetchAPI<Tag[]>('tags', []);
} 