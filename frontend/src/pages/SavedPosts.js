import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Feed.css";
import "./PostCard.css";
import API_BASE_URL from "../api";
function SavedPosts() {
  const [savedPosts, setSavedPosts] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId") || "";

  const getImageUrl = (img) => {
    if (!img) return null;
    return img.startsWith("http") ? img : `${API_BASE_URL}/uploads/${img}`;

  };

  useEffect(() => {
    const fetchSavedPosts = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setError("You are not logged in");

      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/saved`, {
          headers: { "x-auth-token": token },
        });

        const data = await res.json();
        if (!res.ok) return setError(data.msg || "Failed to fetch saved posts");

        const postsWithLikes = (data.posts || []).map(post => ({
          ...post,
          likes: Array.isArray(post.likes) ? post.likes.map(id => id.toString()) : [],
        }));

        setSavedPosts(postsWithLikes);
      } catch (err) {
        console.error(err);
        setError("Server error");
      }
    };

    fetchSavedPosts();
  }, []);

  const handleUnlikeOrUnsave = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/save`, {
        method: "POST",
        headers: { "x-auth-token": token, "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok && data.action === "unsaved") {
        setSavedPosts(prev => prev.filter(post => post._id !== postId));
      } else {
        console.error(data.msg || "Failed to unsave post");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "x-auth-token": token, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        const updatedLikes = Array.isArray(data.likes) ? data.likes.map(id => id.toString()) : [];
        setSavedPosts(prev => prev.map(p => (p._id === postId ? { ...p, likes: updatedLikes } : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId, commentText) => {
    const token = localStorage.getItem("token");
    if (!token || !commentText.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "x-auth-token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText }),
      });

      const data = await res.json();
      if (res.ok) {
        const updatedComments = (data.comments || []).map(c => ({
          ...c,
          user: { ...c.user, _id: c.user?._id?.toString() },
        }));
        setSavedPosts(prev => prev.map(p => (p._id === postId ? { ...p, comments: updatedComments } : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = savedPosts.filter(post => {
    const term = searchTerm.toLowerCase();
    return (
      post.title.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(term))) ||
      (post.user?.name && post.user.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="feed-container">
      <h2>Saved Posts</h2>

      <input
        type="text"
        placeholder="Search saved posts or users..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="search-input"
      />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!error && filteredPosts.length === 0 && <p>No saved posts to show.</p>}

      {filteredPosts.map(post => {
        const userLiked = Array.isArray(post.likes) && post.likes.includes(userId);

        return (
          <div key={post._id} className="post-item">
            <div className="post-author">
              <span className="post-date">
                {new Date(post.date || post.createdAt).toLocaleString()}
              </span>
              {post.user?._id ? (
                <span
                  className="author-name"
                  onClick={() => navigate(`/profile/${post.user._id}`)}
                  style={{ cursor: "pointer", color: "#0077b5", fontWeight: 500 }}
                >
                  {post.user.name}
                </span>
              ) : (
                <span style={{ color: "#999" }}>Unknown</span>
              )}
            </div>

            {/* Post preview */}
            <div className="post-main" style={{ display: "flex", gap: "15px" }}>
              {post.images?.length > 0 && (
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={getImageUrl(post.images[0])}
                    alt={post.title}
                    style={{ width: "200px", height: "150px", objectFit: "cover", borderRadius: "10px" }}
                  />
                  {post.images.length > 1 && (
                    <div style={{ display: "flex", gap: "5px", marginTop: "5px", flexWrap: "wrap" }}>
                      {post.images.slice(1, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={getImageUrl(img)}
                          alt=""
                          style={{ width: "60px", height: "50px", objectFit: "cover", borderRadius: "6px" }}
                        />
                      ))}
                      {post.images.length > 4 && <span style={{ alignSelf: "center" }}>+{post.images.length - 4}</span>}
                    </div>
                  )}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <h3>{post.title}</h3>
                <p
                  dangerouslySetInnerHTML={{
                    __html:
                      post.content.length > 150
                        ? post.content.slice(0, 150) + "..."
                        : post.content
                  }}
                ></p>

                <div className="post-tags-location">
                  {post.location && <span className="post-location">{post.location}</span>}
                  {post.tags?.map((tag, idx) => <span key={idx} className="tag">#{tag}</span>)}
                </div>

                <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
                  <button className="like-btn" onClick={() => handleLike(post._id)}>
                    {userLiked ? "❤️ Liked" : "🤍 Like"} ({post.likes?.length || 0})
                  </button>

                  <button
                    className="save-btn"
                    style={{ background: "#dc3545", color: "#fff" }}
                    onClick={() => handleUnlikeOrUnsave(post._id)}
                  >
                    🗑️ Unsave
                  </button>

                  <button
                    style={{ cursor: "pointer", background: "#007BFF", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "6px" }}
                    onClick={() => navigate(`/post/${post._id}`, { state: { from: "/saved" } })}

                  >
                    Read More
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SavedPosts;
