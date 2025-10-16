import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "./ProfileView.css";
import API_BASE_URL from "../api";
function ProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserFollowing, setCurrentUserFollowing] = useState([]);

  const getImageUrl = (img) => {
    if (!img) return null;
    return img.startsWith("http") ? img : `${API_BASE_URL}/uploads/${img}`;

  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("You are not logged in");
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const resMe = await fetch(`${API_BASE_URL}/api/profile/me`, {
          headers: { "x-auth-token": token },
        });
        const dataMe = await resMe.json();
        if (resMe.ok && dataMe.user) {
          setCurrentUserId(dataMe.user._id);
          setCurrentUserFollowing(dataMe.user.following || []);
        }

        const url = id
  ? `${API_BASE_URL}/api/profile/${id}`
  : `${API_BASE_URL}/api/profile/me`;


        const res = await fetch(url, { headers: { "x-auth-token": token } });
        const data = await res.json();

        if (res.ok && data.user) {
          const profileData = {
            ...data.user,
            postsCount: data.posts?.length || 0,
            followersCount: data.user.followers?.length || 0,
            followingCount: data.user.following?.length || 0,
            posts:
              data.posts?.map((p) => ({
                ...p,
                createdAt: p.createdAt || p.date || new Date(),
              })) || [],
          };
          setUser(profileData);

          if (dataMe.user && id) {
            setIsFollowing(dataMe.user.following.includes(data.user._id));
          }
        } else {
          setMessage(data.msg || "Profile not found");
        }
      } catch (err) {
        console.error(err);
        setMessage("Server error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleFollowToggle = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/profile/${user._id}/follow`,

        {
          method: "POST",
          headers: { "x-auth-token": token },
        }
      );
      const data = await res.json();

      if (res.ok) {
        setIsFollowing(!isFollowing);
        setUser((prev) => ({
          ...prev,
          followersCount: data.followers.length,
        }));
      } else {
        setMessage(data.msg || "Action failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  const imageRefs = useRef({});

  // ✅ Continuous auto-scroll logic
  useEffect(() => {
    const scrollSpeed = 0.7; // Adjust speed (pixels per frame)
    let animationFrameId;

    const smoothScroll = () => {
      Object.values(imageRefs.current).forEach((container) => {
        if (container) {
          container.scrollLeft += scrollSpeed;
          if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
            container.scrollLeft = 0;
          }
        }
      });
      animationFrameId = requestAnimationFrame(smoothScroll);
    };

    animationFrameId = requestAnimationFrame(smoothScroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  if (isLoading) return <p>Loading profile...</p>;
  if (message) return <p style={{ color: "red" }}>{message}</p>;
  if (!user) return null;

  return (
    <div className="profile-view-container">
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "15px",
          padding: "8px 16px",
          backgroundColor: "#0077b5",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "500",
        }}
      >
        ← Back
      </button>

      <div className="profile-header">
        {user.profilePic && (
          <img
            src={getImageUrl(user.profilePic)}
            alt={user.name}
            className="profile-img"
          />
        )}
        <h2>{user.name}</h2>
        {user.bio && <p className="bio">{user.bio}</p>}

        {currentUserId && currentUserId !== user._id && (
          <button
            className={`follow-btn ${isFollowing ? "unfollow" : "follow"}`}
            onClick={handleFollowToggle}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>

      <div className="profile-stats">
        <span>Posts: {user.postsCount}</span>
        <span>Followers: {user.followersCount}</span>
        <span>Following: {user.followingCount}</span>
      </div>

      <div className="profile-posts">
        {user.posts.length > 0 ? (
          user.posts.map((post) => (
            <div key={post._id} className="post-card" style={{ padding: "10px", gap: "8px" }}>
              <div className="post-author">
                <span className="author-name">{user.name}</span>
                <span className="post-date">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="post-main">
                {post.images?.length > 0 && (
                  <div
                    className="post-images-container"
                    style={{
                      overflow: "hidden",
                      borderRadius: "10px",
                      position: "relative",
                    }}
                  >
                    <div
                      className="post-images"
                      ref={(el) => (imageRefs.current[post._id] = el)}
                      style={{
                        display: "flex",
                        overflowX: "auto",
                        scrollBehavior: "smooth",
                      }}
                    >
                      {[...post.images, ...post.images].map((img, idx) => (
                        <img
                          key={idx}
                          src={getImageUrl(img)}
                          alt={`post-img-${idx}`}
                          className="post-detail-img"
                          style={{
                            flex: "0 0 auto",
                            width: "100%",
                            height: "180px", // reduced height
                            objectFit: "cover",
                            borderRadius: "10px",
                            marginRight: "10px",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="post-content">
                  <h3 style={{ marginBottom: "6px" }}>{post.title}</h3>
                  <p
                    dangerouslySetInnerHTML={{
                      __html:
                        post.content.length > 150
                          ? post.content.slice(0, 150) + "..."
                          : post.content,
                    }}
                    style={{ fontSize: "0.9rem", lineHeight: "1.3", marginBottom: "6px" }}
                  ></p>

                  {post.location && (
                    <span
                      className="post-location"
                      style={{ padding: "2px 6px", fontSize: "0.8rem" }}
                    >
                      {post.location}
                    </span>
                  )}

                  <div className="post-tags" style={{ gap: "5px", marginTop: "4px" }}>
                    {post.tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="tag"
                        style={{ padding: "3px 6px", fontSize: "0.75rem" }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    style={{
                      cursor: "pointer",
                      background: "#007BFF",
                      color: "#fff",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      marginTop: "4px",
                      fontSize: "0.85rem",
                    }}
                    onClick={() => navigate(`/post/${post._id}`)}
                  >
                    Read More
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No posts yet.</p>
        )}
      </div>
    </div>
  );
}

export default ProfileView;
