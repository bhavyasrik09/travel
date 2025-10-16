import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProfileView from "../components/ProfileView"; // for editing
import "./ProfilePage.css";
import API_BASE_URL from "../api";
function ProfilePage() {
  const { id } = useParams(); // user id from URL
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [message, setMessage] = useState("");

  const currentUserId = localStorage.getItem("userId");

  // Helper to handle Cloudinary or default avatar
  const getProfilePic = (url) => {
    if (!url) return "/default-avatar.png";
    return url.startsWith("http") ? url : `${API_BASE_URL}/uploads/${url}`;

  };

  // Fetch user profile + posts
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/profile/${id}`, {
        headers: { "x-auth-token": token },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setPosts(
          (data.posts || []).sort(
            (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
          )
        );
        setIsFollowing(data.isFollowing || false);
      } else {
        setMessage(data.msg || "Error fetching profile");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/profile/${id}/follow`, {
        method: "POST",
        headers: { "x-auth-token": token },
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(!isFollowing);
        fetchProfile(); // refresh follower/following count
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/auth/delete`, {
        method: "DELETE",
        headers: { "x-auth-token": token },
      });
      if (res.ok) {
        localStorage.clear();
        navigate("/signup");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="profile-page-container">
      {/* Profile Header */}
      <div className="profile-header">
        <img
          src={getProfilePic(user.profilePic)}
          alt="Profile"
          className="profile-avatar"
        />
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.bio}</p>
          <div className="followers-following">
            <span>{user.followers?.length || 0} Followers</span>
            <span>{user.following?.length || 0} Following</span>
          </div>
          {id !== currentUserId && (
            <button
              className={`follow-btn ${isFollowing ? "following" : ""}`}
              onClick={handleFollow}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          {id === currentUserId && (
            <div className="edit-delete-btns">
              <button onClick={() => setEditing(!editing)}>Edit Profile</button>
              <button className="delete-btn" onClick={handleDelete}>
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Form */}
      {editing && id === currentUserId && (
        <div className="edit-profile-section">
          <ProfileView
            onProfileUpdate={() => {
              setEditing(false);
              fetchProfile();
            }}
          />
        </div>
      )}

      {/* User Posts */}
      <div className="user-posts">
        <h3>{id === currentUserId ? "My Posts" : `${user.name}'s Posts`}</h3>
        {posts.length === 0 && <p>No posts yet.</p>}
        {posts.map((post) => (
          <div key={post._id} className="post-item">
            <h4>{post.title}</h4>
            <p className="post-date">
              {new Date(post.date || post.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Visited Places Map */}
      {user.visitedPlaces?.length > 0 && (
        <div className="visited-places">
          <h3>Visited Places</h3>
          <div className="map-container">
            {user.visitedPlaces.map((place, idx) => (
              <div key={idx} className="place-marker">
                <span className="marker-number">{idx + 1}</span>
                <p>{place.locationName || place.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default ProfilePage;
