import React, { useEffect, useState } from "react";
import { Popover } from "@/components/ui/Popover";
import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

function readCommunityAvatar(response) {
  const profile = response?.profile || response?.data?.profile || {};
  return String(profile?.avatar_url || "").trim();
}

export default function AvatarMenu() {
  const { user, logout, applyVerifiedUser, isGuest } = useAuth();
  const { getIdentity } = useJumuiyaApi();
  const [avatar, setAvatar] = useState(() =>
    String(user?.community_avatar_url || "").trim()
  );

  const displayName = String(
    user?.fullName || user?.full_name || user?.name || "User"
  ).trim();
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    let active = true;
    const cachedAvatar = String(user?.community_avatar_url || "").trim();
    setAvatar(cachedAvatar);

    if (!user || isGuest || String(user?.role || "").toLowerCase() === "guest") {
      return () => {
        active = false;
      };
    }

    const loadCommunityProfile = async () => {
      try {
        const response = await getIdentity();
        const communityAvatar = readCommunityAvatar(response);
        if (!active) return;

        setAvatar(communityAvatar);
        const hasUserId = Boolean(user?.id || user?._id || user?.user_id);
        if (
          hasUserId &&
          typeof applyVerifiedUser === "function" &&
          cachedAvatar !== communityAvatar
        ) {
          applyVerifiedUser({
            ...user,
            community_avatar_url: communityAvatar,
          });
        }
      } catch (error) {
        if (!active) return;
        setAvatar(cachedAvatar);
        console.warn("[community-profile] avatar could not be refreshed", {
          status: error?.status || null,
          code: error?.code || error?.name || "community_identity_unavailable",
        });
      }
    };

    loadCommunityProfile();
    return () => {
      active = false;
    };
  }, [applyVerifiedUser, getIdentity, isGuest, user]);

  const trigger = (
    <button
      type="button"
      aria-label="Open account menu"
      title="Account"
      className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-500 bg-slate-100 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-white"
    >
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        initials || "U"
      )}
    </button>
  );

  return (
    <Popover trigger={trigger}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
          <User className="h-4 w-4 text-gray-500" />
          <span>Profile</span>
        </div>

        <div className="flex items-center gap-2 rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
          <Settings className="h-4 w-4 text-gray-500" />
          <span>Settings</span>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded p-2 text-left text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-700"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </Popover>
  );
}
