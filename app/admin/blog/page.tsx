'use client';

import { useState } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { ModeSwitcher } from '@/components/mode-switcher';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Heart,
  ArrowLeft,
  Save,
  X,
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function AdminBlogPage() {
  return (
    <AdminGuard>
      <ModeSwitcher currentMode="admin" />
      <BlogManagement />
    </AdminGuard>
  );
}

function BlogManagement() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);

  const { data, isLoading } = trpc.blog.adminList.useQuery({
    limit: 50,
    includeUnpublished: true,
  });

  const createMutation = trpc.blog.create.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Post created', variant: 'success' });
      resetForm();
      utils.blog.adminList.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Post updated', variant: 'success' });
      resetForm();
      utils.blog.adminList.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Post deleted', variant: 'success' });
      utils.blog.adminList.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setIsEditing(false);
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setPublished(false);
    setShowPreview(false);
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || '');
    setContent(post.content);
    setPublished(post.published);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setPublished(false);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!title || !slug || !content) {
      toast({
        title: 'Error',
        description: 'Title, slug, and content are required',
        variant: 'destructive',
      });
      return;
    }

    if (editingPost) {
      updateMutation.mutate({
        id: editingPost.id,
        title,
        slug,
        excerpt: excerpt || null,
        content,
        published,
      });
    } else {
      createMutation.mutate({
        title,
        slug,
        excerpt: excerpt || undefined,
        content,
        published,
      });
    }
  };

  const handleDelete = (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate({ id: postId });
    }
  };

  const generateSlug = () => {
    const generated = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setSlug(generated);
  };

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {editingPost ? 'Edit Post' : 'New Post'}
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          <div className={`grid ${showPreview ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
            {/* Editor */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Post title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <div className="flex gap-2">
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="post-url-slug"
                  />
                  <Button variant="outline" onClick={generateSlug} type="button">
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  URL: /blog/{slug || 'your-slug'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Excerpt</label>
                <Input
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Short description for listing (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content (Markdown)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post in Markdown..."
                  className="w-full h-96 p-3 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Published
                </label>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="border rounded-lg p-6 bg-white overflow-y-auto max-h-[800px]">
                <h2 className="text-3xl font-bold mb-4">{title || 'Untitled'}</h2>
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown>{content || '*No content yet*'}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin">
              <Button variant="ghost" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Blog Management</h1>
            <p className="text-gray-600">Create and manage blog posts</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Loading posts...</p>
        ) : data?.posts && data.posts.length > 0 ? (
          <div className="space-y-4">
            {data.posts.map((post) => (
              <Card key={post.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {post.title}
                        {post.published ? (
                          <Badge variant="default" className="bg-green-500">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">/blog/{post.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Heart className="h-4 w-4" />
                        {post.likeCount}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {post.excerpt || 'No excerpt'}
                    </p>
                    <div className="flex gap-2">
                      {post.published && (
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(post)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 mb-4">No posts yet</p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first post
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
