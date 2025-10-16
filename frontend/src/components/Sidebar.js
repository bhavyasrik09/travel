import React from "react";
import API_BASE_URL from "../api";
function Sidebar({ profile, activeMenu, setActiveMenu, handleLogout }) {
  const styles = {
    sidebar: {
      width: "260px",
      background: "#1c1a2b",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: "20px 15px",
      boxSizing: "border-box",
      boxShadow: "2px 0 12px rgba(0,0,0,0.6)",
      overflowY: "auto",
      height: "100vh",
      transition: "all 0.3s ease",
    },
    profile: {
      textAlign: "center",
      marginBottom: "30px",
      cursor: "pointer",
      transition: "transform 0.2s, boxShadow 0.2s",
    },
    profileHover: {
      transform: "scale(1.05)",
      boxShadow: "0 4px 15px rgba(255,140,0,0.4)",
    },
    profileImg: {
      width: "70px",
      height: "70px",
      borderRadius: "50%",
      objectFit: "cover",
      marginBottom: "8px",
      border: "2px solid #ff8c00",
    },
    profileName: {
      margin: 0,
      fontSize: "1.1rem",
      color: "#ff8c00",
      fontWeight: 600,
    },
    menu: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      flexGrow: 1,
    },
    menuButton: {
      background: "transparent",
      border: "none",
      color: "#e0e0e0",
      padding: "8px 12px",
      fontSize: "0.9rem",
      textAlign: "left",
      cursor: "pointer",
      borderRadius: "8px",
      transition: "all 0.2s",
    },
    menuButtonActive: {
      color: "#9b59b6",
      background: "rgba(155,89,182,0.1)",
    },
    logout: {
      marginTop: "auto",
      background: "linear-gradient(90deg,#9b59b6,#8e44ad)",
      color: "#fff",
      padding: "10px",
      borderRadius: "8px",
      fontWeight: "bold",
      textAlign: "center",
      cursor: "pointer",
      transition: "0.3s",
    },
  };

  return (
    <div style={styles.sidebar}>
      <div
        style={styles.profile}
        onClick={() => setActiveMenu("profile")}
      >
        {profile.profilePic && (
          <img
            src={`${API_BASE_URL}/uploads/${profile.profilePic}`}

            alt="Profile"
            style={styles.profileImg}
          />
        )}
        <h3 style={styles.profileName}>{profile.name}</h3>
      </div>

      <div style={styles.menu}>
        <button
          style={{
            ...styles.menuButton,
            ...(activeMenu === "profile" ? styles.menuButtonActive : {}),
          }}
          onClick={() => setActiveMenu("profile")}
        >
          My Profile
        </button>
        <button
          style={{
            ...styles.menuButton,
            ...(activeMenu === "myPosts" ? styles.menuButtonActive : {}),
          }}
          onClick={() => setActiveMenu("myPosts")}
        >
          My Posts
        </button>
        <button
          style={{
            ...styles.menuButton,
            ...(activeMenu === "createPost" ? styles.menuButtonActive : {}),
          }}
          onClick={() => setActiveMenu("createPost")}
        >
          Create Post
        </button>
        <button
          style={{
            ...styles.menuButton,
            ...(activeMenu === "feed" ? styles.menuButtonActive : {}),
          }}
          onClick={() => setActiveMenu("feed")}
        >
          Timeline / Feed
        </button>
        <button style={styles.logout} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
