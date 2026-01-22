import React, { useState } from "react";
import { Popover } from "@/components/ui/Popover";
import { Badge } from "@/components/ui/Badge";
import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AvatarMenu() {
  const { user, logout, updateUser } = useAuth();
  const [avatar, setAvatar] = useState(user?.avatar || null);

  const handleUpload = async (file) => {
    if (!file) return;

    // Preview locally
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatar(e.target.result);
    };
    reader.readAsDataURL(file);

    // Optionally, upload to backend
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/avatar`, {
        method: "POST",
        body: formData,
        credentials: "include", // if your API requires auth
      });

      if (res.ok) {
        const data = await res.json();
        updateUser?.({ ...user, avatar: data.avatar }); // Update global auth context
      }
    } catch (err) {
      console.error("❌ Failed to upload avatar:", err);
    }
  };

  const trigger = (
    <div className="flex items-center space-x-2 cursor-pointer">
      <label className="relative">
        <img
          src={avatar || `https://ui-avatars.com/api/?name=${user?.username || "Guest"}`}
          alt="User Avatar"
          className="w-8 h-8 rounded-full border-2 border-indigo-500 object-cover"
        />
        {/* Invisible file input */}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
          onChange={(e) => handleUpload(e.target.files[0])}
        />
      </label>

      <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
        {user?.username || "Guest"}
      </span>
      {user?.role && <Badge className="ml-1">{user.role}</Badge>}
    </div>
  );

  return (
    <Popover trigger={trigger}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <User className="w-4 h-4 text-gray-500" />
          <span>Profile</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <Settings className="w-4 h-4 text-gray-500" />
          <span>Settings</span>
        </div>
        <div
          onClick={logout}
          className="flex items-center gap-2 p-2 rounded hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-400 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </div>
      </div>
    </Popover>
  );
}
