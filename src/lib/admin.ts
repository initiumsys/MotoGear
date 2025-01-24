import { supabase } from './supabase';

export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: { is_admin } } = await supabase.auth.getUser();
    return is_admin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function requireAdmin(): Promise<void> {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}