import api from "./api";

// Get user profile
export const getUserProfile = async () => {
  const response = await api.get("/user/profile");
  return response.data;
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  const response = await api.put("/user/profile", profileData);
  return response.data;
};

// Upload profile picture
export const uploadProfileImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await api.post("/user/profile/image", formData);

  return response.data;
};

// Upload cover banner
export const uploadCoverImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await api.post("/user/profile/cover", formData);

  return response.data;
};

// Remove profile picture
export const removeProfileImage = async () => {
  const response = await api.delete("/user/profile/image");
  return response.data;
};

// Remove cover banner
export const removeCoverImage = async () => {
  const response = await api.delete("/user/profile/cover");
  return response.data;
};
