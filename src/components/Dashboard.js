import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [comments, setComments] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/posts');
      setPosts(response.data);
    } catch (error) {
      toast.error('Failed to fetch posts');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', newPost);
      formData.append('isPrivate', isPrivate);
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await axios.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setNewPost('');
      setIsPrivate(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchPosts();
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPost = async (postId) => {
    if (!editContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    try {
      await axios.put(`/posts/${postId}`, {
        content: editContent,
        isPrivate: editingPost.isPrivate
      });
      
      setEditingPost(null);
      setEditContent('');
      fetchPosts();
      toast.success('Post updated successfully!');
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await axios.delete(`/posts/${postId}`);
        fetchPosts();
        toast.success('Post deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete post');
      }
    }
  };

  const startEditing = (post) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditContent('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`/posts/${postId}/like`, { userId: user.id });
      fetchPosts();
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleUnlike = async (postId) => {
    try {
      await axios.post(`/posts/${postId}/unlike`, { userId: user.id });
      fetchPosts();
    } catch (error) {
      toast.error('Failed to unlike post');
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText[postId] || !commentText[postId].trim()) {
      toast.error('Please enter a comment');
      return;
    }
    try {
      await axios.post(`/posts/${postId}/comment`, { userId: user.id, text: commentText[postId] });
      setCommentText((prev) => ({ ...prev, [postId]: '' }));
      fetchComments(postId);
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(`/posts/${postId}/comments`);
      setComments((prev) => ({ ...prev, [postId]: res.data }));
    } catch (error) {
      toast.error('Failed to fetch comments');
    }
  };

  const handleDeleteComment = async (postId, commentIdx) => {
    try {
      await axios.delete(`/posts/${postId}/comment/${commentIdx}`, { data: { userId: user.id } });
      fetchComments(postId);
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome to SocialApp, {user?.username}!</h1>
        <p>Share your thoughts with the world or keep them private</p>
      </div>

      {/* Create Post Form */}
      <div className="create-post-section">
        <h2>Create a New Post</h2>
        <form onSubmit={handleCreatePost} className="create-post-form">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className="post-textarea"
            rows="4"
          />
          
          {/* Image Upload Section */}
          <div className="image-upload-section">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="image-input"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="image-upload-label">
              📷 Add Image
            </label>
            
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="remove-image-btn"
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
          
          <div className="post-options">
            <label className="privacy-toggle">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <span className="checkmark"></span>
              Private Post (only visible to you)
            </label>
            <button 
              type="submit" 
              className="post-button"
              disabled={isLoading || !newPost.trim()}
            >
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Posts Feed */}
      <div className="posts-section">
        <h2>Posts Feed</h2>
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id || post._id} className="post-card" style={{ maxWidth: 500, margin: '24px auto', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: '#fff' }}>
                <div className="post-header">
                  <div className="post-info">
                    <h3 className="post-author">{post.username}</h3>
                    <span className="post-date">{formatDate(post.createdAt)}</span>
                    {post.isPrivate && <span className="private-badge">Private</span>}
                  </div>
                  {post.userId === user?.id && (
                    <div className="post-actions">
                      <button
                        onClick={() => startEditing(post)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                
                {editingPost?.id === post.id ? (
                  <div className="edit-post-form">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="edit-textarea"
                      rows="3"
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => handleEditPost(post.id)}
                        className="save-button"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="cancel-button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="post-content">
                    <p>{post.content}</p>
                    {post.image && (
                      <div className="post-image">
                        <img 
                          src={`http://localhost:5000${post.image}`} 
                          alt="Post" 
                          className="post-image-content"
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="post-actions" style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, marginBottom: 8 }}>
                  <button
                    onClick={() => post.likes && post.likes.includes(user.id) ? handleUnlike(post._id || post.id) : handleLike(post._id || post.id)}
                    style={{ fontSize: 22, padding: '6px 16px', marginRight: 8, transition: 'background 0.2s', cursor: 'pointer', background: 'none', border: 'none' }}
                    aria-label={post.likes && post.likes.includes(user.id) ? 'Unlike' : 'Like'}
                  >
                    {post.likes && post.likes.includes(user.id) ? '❤️' : '🤍'}
                  </button>
                  <span style={{ fontWeight: 'bold', fontSize: 16 }}>{post.likes ? post.likes.length : 0} likes</span>
                </div>
                <div className="post-comments" style={{ marginTop: 10, marginBottom: 18 }}>
                  <button onClick={() => fetchComments(post._id || post.id)} style={{ marginBottom: 8 }}>
                    Show Comments
                  </button>
                  <ul style={{ paddingLeft: 0, marginBottom: 8 }}>
                    {(comments[post._id || post.id] || []).map((c, idx) => (
                      <li key={idx} style={{ listStyle: 'none', marginBottom: 4 }}>
                        <b>{c.user?.username || 'User'}:</b> {c.text}
                        {c.user && (c.user._id === user.id || c.user === user.id) && (
                          <button onClick={() => handleDeleteComment(post._id || post.id, idx)} style={{ marginLeft: 8 }}>
                            Delete
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={commentText[post._id || post.id] || ''}
                      onChange={e => setCommentText((prev) => ({ ...prev, [post._id || post.id]: e.target.value }))}
                      placeholder="Add a comment"
                      style={{ flex: 1, padding: 6 }}
                    />
                    <button onClick={() => handleAddComment(post._id || post.id)} style={{ padding: '6px 16px' }}>Comment</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 