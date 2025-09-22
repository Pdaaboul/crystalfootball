import { createClient } from '@/lib/supabase/server';
import { UserRole, Profile } from '@/lib/types/auth';
import { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return profile;
}

export async function getUserRole(): Promise<UserRole | null> {
  const profile = await getUserProfile();
  return profile?.role || null;
}

export async function requireAuth(): Promise<User> {
  const user = await getUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireRole(requiredRole: UserRole | UserRole[]): Promise<Profile> {
  const profile = await getUserProfile();
  
  if (!profile) {
    throw new Error('Authentication required');
  }

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  if (!allowedRoles.includes(profile.role)) {
    throw new Error('Insufficient permissions');
  }

  return profile;
} 