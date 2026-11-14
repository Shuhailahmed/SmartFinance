import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  uploadCoverImage,
  removeProfileImage,
  removeCoverImage,
} from "../../services/userService";

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [name, setName] = useState(user?.name || "");
  const [currency, setCurrency] = useState(user?.currency || "INR");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [coverImage, setCoverImage] = useState(user?.coverImage || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getUserProfile();
        const profile = response.user;

        setName(profile.name || "");
        setCurrency(profile.currency || "INR");
        setProfileImage(profile.profileImage || "");
        setCoverImage(profile.coverImage || "");

        updateUser?.(profile);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const showMessage = (text) => {
    setMessage(text);
    setError("");
  };

  const showError = (text) => {
    setError(text);
    setMessage("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await updateUserProfile({ name, currency });

      if (response.user) {
        updateUser?.(response.user);
        setName(response.user.name || name);
        setCurrency(response.user.currency || currency);
      } else {
        updateUser?.({ name, currency });
      }

      showMessage("Profile details updated successfully.");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image size must be less than 5 MB.");
      return;
    }

    try {
      setUploading(type);
      setError("");
      setMessage("");

      const response =
        type === "profile"
          ? await uploadProfileImage(file)
          : await uploadCoverImage(file);

      if (type === "profile") {
        const imageUrl = response.profileImage;
        setProfileImage(imageUrl);
        updateUser?.({ profileImage: imageUrl });
      } else {
        const imageUrl = response.coverImage;
        setCoverImage(imageUrl);
        updateUser?.({ coverImage: imageUrl });
      }

      showMessage(
        type === "profile"
          ? "Profile picture updated."
          : "Cover photo updated.",
      );
    } catch (err) {
      showError(err.response?.data?.message || "Image upload failed.");
    } finally {
      setUploading("");
    }
  };

  const handleRemoveImage = async (type) => {
    try {
      setUploading(type);
      setError("");
      setMessage("");

      if (type === "profile") {
        await removeProfileImage();
        setProfileImage("");
        updateUser?.({ profileImage: "" });
      } else {
        await removeCoverImage();
        setCoverImage("");
        updateUser?.({ coverImage: "" });
      }

      showMessage("Image removed successfully.");
    } catch (err) {
      showError(err.response?.data?.message || "Unable to remove image.");
    } finally {
      setUploading("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* Page Heading */}
      <div>
        <p className="text-sm font-medium text-indigo-600">ACCOUNT SETTINGS</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your personal information and account appearance.
        </p>
      </div>

      {/* Notifications */}
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile Cover */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className="relative h-52 bg-gradient-to-r from-indigo-700 via-violet-600 to-purple-500 bg-cover bg-center"
          style={coverImage ? { backgroundImage: `url(${coverImage})` } : {}}
        >
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading === "cover"}
              className="rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-slate-800 shadow hover:bg-white disabled:opacity-50"
            >
              {uploading === "cover" ? "Uploading..." : "Change cover"}
            </button>

            {coverImage && (
              <button
                onClick={() => handleRemoveImage("cover")}
                disabled={uploading === "cover"}
                className="rounded-lg bg-white/95 px-3 py-2 text-sm font-semibold text-red-600 shadow hover:bg-white disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              handleImageUpload(e.target.files?.[0], "cover");
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="-mt-14 flex items-end gap-4">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-indigo-100 shadow-md">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-indigo-600">
                  {name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 sm:pb-1">
            <h2 className="text-xl font-bold text-slate-900">
              {name || "Your Name"}
            </h2>
            <p className="mt-1 break-all text-sm text-slate-500">
              {user?.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:pb-1">
            <button
              onClick={() => profileInputRef.current?.click()}
              disabled={uploading === "profile"}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading === "profile" ? "Uploading..." : "Change photo"}
            </button>

            {profileImage && (
              <button
                onClick={() => handleRemoveImage("profile")}
                disabled={uploading === "profile"}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>
            )}

            <input
              ref={profileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                handleImageUpload(e.target.files?.[0], "profile");
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </section>

      {/* Personal Information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            Personal Information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Update the personal details associated with your account.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              Email address cannot be changed here.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Preferred Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="INR">INR - Indian Rupee (₹)</option>
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="GBP">GBP - British Pound (£)</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Account Role
            </label>
            <input
              type="text"
              value={user?.role || "user"}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm capitalize text-slate-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      {/* Account Status */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Account Status</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Email Verification
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Your email account verification status
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                user?.isEmailVerified
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {user?.isEmailVerified ? "Verified" : "Not verified"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Account Access
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Current account status
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                user?.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {user?.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </section>

      {/* Logout Section */}
      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Sign Out</h2>
            <p className="mt-1 text-sm text-slate-500">
              Logout securely from your SmartFinance account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </section>

      <p className="pb-4 text-center text-xs text-slate-400">
        SmartFinance · Personal Finance Dashboard
      </p>
    </div>
  );
};

export default Profile;
