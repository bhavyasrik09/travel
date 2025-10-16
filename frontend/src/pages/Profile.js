import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";
function Profile() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/me`, {
          headers: { "x-auth-token": token },
        });
        const data = await res.json();

        if (res.ok && data.user) {
          setName(data.user.name || "");
          setBio(data.user.bio || "");
        } else {
          setMessage(data.msg || "Error fetching profile");
        }
      } catch (err) {
        console.error(err);
        setMessage("Server error");
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("No token found. Please log in again.");
      navigate("/login");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("bio", bio);
    if (profilePic) formData.append("profilePic", profilePic);

    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "POST",
        headers: { "x-auth-token": token },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Profile updated!");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setMessage(data.msg || "Error updating profile");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0d0d0d",
        color: "#f5f5f5",
        padding: "40px",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div
        style={{
          background: "#1e1e1e",
          borderRadius: "12px",
          boxShadow:
            "0 0 20px rgba(132, 46, 255, 0.3), 0 0 40px rgba(155, 89, 182, 0.15)",
          padding: "30px 40px",
          width: "100%",
          maxWidth: "420px",
          textAlign: "center",
          transition: "all 0.3s ease-in-out",
        }}
      >
        <h2
          style={{
            color: "#9b59b6",
            marginBottom: "20px",
            textShadow: "0 0 8px rgba(155, 89, 182, 0.8)",
          }}
        >
          Complete Your Profile
        </h2>

        <button
          onClick={handleLogout}
          style={{
            marginBottom: "20px",
            padding: "10px 20px",
            background: "#e60023",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s ease-in-out",
          }}
        >
          Logout
        </button>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            textAlign: "left",
          }}
        >
          <label style={{ fontWeight: "500" }}>Name</label>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #333",
              background: "#2a2a2a",
              color: "#f5f5f5",
              boxShadow: "inset 0 0 8px rgba(155, 89, 182, 0.4)",
            }}
          />

          <label style={{ fontWeight: "500" }}>Bio</label>
          <textarea
            placeholder="Write something about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
            rows="4"
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #333",
              background: "#2a2a2a",
              color: "#f5f5f5",
              boxShadow: "inset 0 0 8px rgba(155, 89, 182, 0.4)",
              resize: "none",
            }}
          />

          <label style={{ fontWeight: "500" }}>Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePic(e.target.files[0])}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #444",
              background: "#2a2a2a",
              color: "#f5f5f5",
              boxShadow: "inset 0 0 8px rgba(155, 89, 182, 0.3)",
            }}
          />

          <button
            type="submit"
            style={{
              background: "#9b59b6",
              color: "#fff",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              boxShadow: "0 0 12px rgba(155, 89, 182, 0.6)",
              transition: "all 0.3s ease-in-out",
            }}
            onMouseOver={(e) =>
              (e.target.style.boxShadow = "0 0 18px rgba(155, 89, 182, 0.9)")
            }
            onMouseOut={(e) =>
              (e.target.style.boxShadow = "0 0 12px rgba(155, 89, 182, 0.6)")
            }
          >
            Save Profile
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "15px",
              color: message.includes("error") ? "red" : "#9b59b6",
              fontWeight: "500",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Profile;
