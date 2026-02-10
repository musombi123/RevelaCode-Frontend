import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const baseUrl = import.meta.env.VITE_API_URL;

export default function AccountPage() {
  const { user: authUser, updateUser } = useAuth(); // 🔥 single source of truth
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isGuest = authUser?.role === "guest";

  /* ------------------ LOAD USER PROFILE ------------------ */
  useEffect(() => {
    if (!authUser?.contact || isGuest) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${baseUrl}/api/user/${encodeURIComponent(authUser.contact)}`
        );
        const data = await res.json();

        if (res.ok) {
          // Normalize to match AuthContext + StartModal
          setUser({
            contact: data.contact,
            fullName: data.full_name || data.fullName,
            avatar: data.avatar || data.avatarUrl || null,
            role: data.role || authUser.role,
          });
        } else {
          console.error("❌ Failed to load profile:", data);
        }
      } catch (err) {
        console.error("❌ Network error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authUser]);

  /* ------------------ SAVE PROFILE ------------------ */
  const handleSave = async () => {
    if (!user?.contact) return;

    setSaving(true);
    try {
      const res = await fetch(
        `${baseUrl}/api/user/${encodeURIComponent(user.contact)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: user.fullName, // backend expects snake_case
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("✅ Profile updated successfully");

        const normalized = {
          contact: data.contact,
          fullName: data.full_name || data.fullName,
          avatar: data.avatar || data.avatarUrl || null,
          role: data.role || user.role,
        };

        setUser(normalized);
        updateUser?.(normalized); // 🔥 keep AuthContext in sync
      } else {
        alert(`❌ ${data.message || "Update failed"}`);
      }
    } catch (err) {
      console.error("❌ Update error:", err);
    } finally {
      setSaving(false);
    }
  };

  /* ------------------ LOADING ------------------ */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="text-center p-6 text-yellow-600 dark:text-yellow-400">
        ⚠ Guest accounts cannot access the Account page. Please log in.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center text-gray-500">
        Failed to load user profile
      </div>
    );
  }

  const initials =
    user.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">
              {user.fullName || "User"}
            </h2>
            <p className="text-sm text-gray-500">{user.contact}</p>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="profile">👤 Profile</TabsTrigger>
          <TabsTrigger value="security">🔒 Security</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile">
          <Card>
            <CardContent className="space-y-3 pt-4">
              <Input
                value={user.fullName || ""}
                onChange={(e) =>
                  setUser({ ...user, fullName: e.target.value })
                }
                placeholder="Full Name"
              />
              <Input
                value={user.contact || ""}
                disabled
                placeholder="Contact (immutable)"
              />
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "🔄 Saving..." : "💾 Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security">
          <Card>
            <CardContent className="space-y-3 pt-4">
              <Input type="password" placeholder="New Password" />
              <Input type="password" placeholder="Confirm Password" />
              <Button>🔑 Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings">
          <Card>
            <CardContent className="space-y-3 pt-4">
              <Button variant="outline">🌙 Toggle Dark Mode</Button>
              <Button variant="outline">🔗 Linked Accounts</Button>
              <Button variant="destructive">🗑 Delete Account</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
