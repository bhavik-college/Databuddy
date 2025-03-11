export interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount?: number;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  author: Author;
  categories: Category[];
  tags: Tag[];
} 