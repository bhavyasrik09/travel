import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Feed.css";
import "./PostCard.css";
import API_BASE_URL from "../api";
function Feed() {
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
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
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setError("You are not logged in");

      try {
        const resPosts = await fetch(`${API_BASE_URL}/api/posts`, {
          headers: { "x-auth-token": token },
        });
        const dataPosts = await resPosts.json();
        if (!resPosts.ok) return setError(dataPosts.msg || "Failed to fetch posts");

        const resProfile = await fetch(`${API_BASE_URL}/api/profile/me`, {
          headers: { "x-auth-token": token },
        });
        const dataProfile = await resProfile.json();
        const following = dataProfile.user?.following || [];
        const saved = dataProfile.user?.savedPosts?.map(id => id.toString()) || [];

        const sortedPosts = (dataPosts.posts || []).sort((a, b) => {
          const aFollowed = following.includes(a.user?._id) ? 1 : 0;
          const bFollowed = following.includes(b.user?._id) ? 1 : 0;
          if (aFollowed !== bFollowed) return bFollowed - aFollowed;
          return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
        });

        sortedPosts.forEach(post => {
          post.likes = Array.isArray(post.likes) ? post.likes.map(id => id.toString()) : [];
        });

        setPosts(sortedPosts);
        setFollowingIds(following);
        setSavedPosts(saved);
      } catch (err) {
        console.error(err);
        setError("Server error");
      }
    };

    fetchData();
  }, []);

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
        setPosts(prev => prev.map(p => (p._id === postId ? { ...p, likes: updatedLikes } : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/save`, {
        method: "POST",
        headers: { "x-auth-token": token, "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        const userSaved = savedPosts.includes(postId);
        if (userSaved) setSavedPosts(prev => prev.filter(id => id !== postId));
        else setSavedPosts(prev => [...prev, postId]);

        setPosts(prev =>
          prev.map(p => (p._id === postId ? { ...p, savedBy: data.savedBy.map(id => id.toString()) } : p))
        );
      } else {
        console.error(data.msg || "Failed to save post");
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
        setPosts(prev => prev.map(p => (p._id === postId ? { ...p, comments: updatedComments } : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = posts.filter(post => {
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
      <h2>Posts Feed</h2>

      <input
        type="text"
        placeholder="Search posts or users..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="search-input"
      />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!error && filteredPosts.length === 0 && <p>No posts to show.</p>}

      {filteredPosts.map(post => {
        const userLiked = Array.isArray(post.likes) && post.likes.includes(userId);
        const userSaved = savedPosts.includes(post._id);

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

            {/* Preview Card */}
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

                  <button className="save-btn" onClick={() => handleSave(post._id)}>
                    {userSaved ? "🔖 Saved" : "📑 Save"}
                  </button>

                  <button
                    style={{ cursor: "pointer", background: "#007BFF", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "6px" }}
                    onClick={() => navigate(`/post/${post._id}`)}
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

export default Feed;
