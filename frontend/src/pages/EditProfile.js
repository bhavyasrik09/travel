import React, { useState } from "react";
import API_BASE_URL from "../api";
function EditProfile({ profile, setProfile }) {
  const [formData, setFormData] = useState({
    name: profile.name || "",
    bio: profile.bio || "",
    profilePic: null, // new file
  });

  const token = localStorage.getItem("token");

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle image file
  const handleFileChange = (e) => {
    setFormData({ ...formData, profilePic: e.target.files[0] });
  };

  // Submit changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("bio", formData.bio);
    if (formData.profilePic) data.append("profilePic", formData.profilePic);

    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "POST",
        headers: { "x-auth-token": token },
        body: data, // FormData handles the file upload
      });

      const result = await res.json();

      if (res.ok) {
        // Update profile in frontend using Cloudinary URL from backend
        setProfile({
          ...profile,
          name: formData.name,
          bio: formData.bio,
          profilePic: result.user.profilePic, // Cloudinary URL
        });
      } else {
        console.error(result.msg || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  // Delete account immediately without popup
  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/delete`, {
        method: "DELETE",
        headers: { "x-auth-token": token },
      });
      if (res.ok) {
        localStorage.removeItem("token");
        window.location.href = "/"; // redirect to welcome page
      }
    } catch (err) {
      console.error("Error deleting account:", err);
    }
  };

  return (
    <div className="edit-profile-container">
      <h2>Edit Profile</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="bio"
          placeholder="Your bio..."
          value={formData.bio}
          onChange={handleChange}
        />
        <input type="file" name="profilePic" onChange={handleFileChange} />
        {formData.profilePic && (
          <img
            src={URL.createObjectURL(formData.profilePic)}
            alt="Preview"
            style={{ width: "120px", height: "120px", borderRadius: "50%" }}
          />
        )}
        <button type="submit">Save Changes</button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      <button onClick={handleDelete} className="delete-btn">
        Delete Account
      </button>
    </div>
  );
}

export default EditProfile;
