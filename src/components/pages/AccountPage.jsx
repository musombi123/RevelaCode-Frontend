import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Loader2 } from 'lucide-react';

const baseUrl = import.meta.env.VITE_API_URL;

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // load user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/profile`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setUser(data);
      } catch (err) {
        console.error('❌ Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${baseUrl}/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) alert('✅ Profile updated');
      else alert(`❌ ${data.message || 'Update failed'}`);
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.avatarUrl || ''} />
            <AvatarFallback>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{user?.full_name || 'User'}</h2>
            <p className="text-sm text-gray-500">{user?.contact}</p>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for sections */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="profile">👤 Profile</TabsTrigger>
          <TabsTrigger value="security">🔒 Security</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card>
            <CardContent className="space-y-3 pt-4">
              <Input
                type="text"
                value={user?.full_name || ''}
                onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                placeholder="Full Name"
              />
              <Input
                type="text"
                value={user?.contact || ''}
                onChange={(e) => setUser({ ...user, contact: e.target.value })}
                placeholder="Email / Phone"
              />
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '🔄 Saving...' : '💾 Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardContent className="space-y-3 pt-4">
              <Input type="password" placeholder="New Password" />
              <Input type="password" placeholder="Confirm Password" />
              <Button>🔑 Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card>
            <CardContent className="space-y-3 pt-4">
              <Button variant="outline">🌙 Toggle Dark Mode</Button>
              <Button variant="outline">🔗 Manage Linked Accounts</Button>
              <Button variant="outline">🗑 Delete Account</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
