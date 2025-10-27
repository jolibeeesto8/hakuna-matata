import { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Send, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CommunityPost, CommunityComment, Profile } from '../../types';
import './CommunityForum.css';

interface PostWithProfile extends CommunityPost {
  profile?: Profile;
  hasLiked?: boolean;
}

export const CommunityForum = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadPosts();
  }, [user]);

  const loadPosts = async () => {
    const { data: postsData } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (postsData) {
      const postsWithProfiles = await Promise.all(
        postsData.map(async (post) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', post.user_id)
            .single();

          const { data: like } = await supabase
            .from('community_likes')
            .select('*')
            .eq('post_id', post.id)
            .eq('user_id', user?.id)
            .maybeSingle();

          return {
            ...post,
            profile,
            hasLiked: !!like,
          };
        })
      );
      setPosts(postsWithProfiles);
    }
  };

  const loadComments = async (postId: string) => {
    const { data: commentsData } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (commentsData) {
      setComments((prev) => ({
        ...prev,
        [postId]: commentsData,
      }));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user?.id,
        title: postTitle,
        content: postContent,
        category: postCategory || null,
      });

    if (!error) {
      setShowNewPostForm(false);
      setPostTitle('');
      setPostContent('');
      setPostCategory('');
      loadPosts();
    }
  };

  const handleLikePost = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.hasLiked) {
      await supabase
        .from('community_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user?.id);
    } else {
      await supabase
        .from('community_likes')
        .insert({
          post_id: postId,
          user_id: user?.id,
        });
    }

    loadPosts();
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;

    const { error } = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        user_id: user?.id,
        content: newComment,
      });

    if (!error) {
      setNewComment('');
      loadComments(postId);
      loadPosts();
    }
  };

  const toggleComments = (postId: string) => {
    if (selectedPost === postId) {
      setSelectedPost(null);
    } else {
      setSelectedPost(postId);
      if (!comments[postId]) {
        loadComments(postId);
      }
    }
  };

  return (
    <div className="community-forum">
      <div className="community-header">
        <h1><MessageSquare size={32} /> Community Forum</h1>
        <button onClick={() => setShowNewPostForm(!showNewPostForm)} className="new-post-btn">
          <Plus size={20} /> New Post
        </button>
      </div>

      {showNewPostForm && (
        <form onSubmit={handleCreatePost} className="new-post-form">
          <div className="form-group">
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              required
              placeholder="Post title..."
              className="post-title-input"
            />
          </div>
          <div className="form-group">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              required
              rows={4}
              placeholder="Share your thoughts..."
              className="post-content-input"
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              value={postCategory}
              onChange={(e) => setPostCategory(e.target.value)}
              placeholder="Category (optional)"
              className="post-category-input"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              Post
            </button>
            <button type="button" onClick={() => setShowNewPostForm(false)} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="post-author">
                <div className="author-avatar">
                  {post.profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="author-info">
                  <div className="author-name">{post.profile?.full_name || 'User'}</div>
                  <div className="post-date">{new Date(post.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              {post.category && <div className="post-category">{post.category}</div>}
            </div>

            <h3 className="post-title">{post.title}</h3>
            <p className="post-content">{post.content}</p>

            <div className="post-actions">
              <button
                onClick={() => handleLikePost(post.id)}
                className={`action-btn ${post.hasLiked ? 'liked' : ''}`}
              >
                <ThumbsUp size={18} />
                <span>{post.likes_count}</span>
              </button>
              <button onClick={() => toggleComments(post.id)} className="action-btn">
                <MessageSquare size={18} />
                <span>{post.comments_count}</span>
              </button>
            </div>

            {selectedPost === post.id && (
              <div className="comments-section">
                <div className="comments-list">
                  {comments[post.id]?.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-author">
                        <div className="comment-avatar">U</div>
                        <div className="comment-text">{comment.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="add-comment">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddComment(post.id);
                      }
                    }}
                  />
                  <button onClick={() => handleAddComment(post.id)}>
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
