import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Target,
  Clock,
  Save,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  full_name: string;
  target_exam: string;
  daily_goal_hours: number;
  avatar_url: string | null;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    target_exam: 'GATE 2027',
    daily_goal_hours: 6,
    avatar_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        full_name: data.full_name || user.user_metadata?.full_name || '',
        target_exam: data.target_exam || 'GATE 2027',
        daily_goal_hours: data.daily_goal_hours || 6,
        avatar_url: data.avatar_url,
      });
    } else if (user.user_metadata?.full_name) {
      setProfile(prev => ({
        ...prev,
        full_name: user.user_metadata.full_name,
      }));
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: profile.full_name,
        target_exam: profile.target_exam,
        daily_goal_hours: profile.daily_goal_hours,
        avatar_url: profile.avatar_url,
      });

    setSaving(false);

    if (error) {
      toast({ title: 'Error saving profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated successfully' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {/* Avatar Section */}
            <GlassCard className="text-center">
              <div className="w-24 h-24 rounded-full bg-hero-gradient mx-auto flex items-center justify-center mb-4">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {getInitials(profile.full_name || 'U')}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold">{profile.full_name || 'Student'}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </GlassCard>

            {/* Profile Form */}
            <GlassCard>
              <h3 className="font-semibold mb-6">Personal Information</h3>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Your full name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetExam">Target Exam</Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="targetExam"
                      placeholder="e.g., GATE 2027"
                      value={profile.target_exam}
                      onChange={(e) => setProfile({ ...profile, target_exam: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyGoal">Daily Study Goal (hours)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="dailyGoal"
                      type="number"
                      min="1"
                      max="24"
                      value={profile.daily_goal_hours}
                      onChange={(e) => setProfile({ ...profile, daily_goal_hours: parseInt(e.target.value) || 6 })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <GradientButton onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" /> Save Changes
                    </>
                  )}
                </GradientButton>
              </div>
            </GlassCard>

            {/* Account Info */}
            <GlassCard>
              <h3 className="font-semibold mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account ID</span>
                  <span className="font-mono text-xs">{user?.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span>
                    {user?.created_at 
                      ? new Date(user.created_at).toLocaleDateString()
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
