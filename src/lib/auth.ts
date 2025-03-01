import { supabase } from './supabase';
import Cookies from 'js-cookie';

// Cookie names
const USER_ID_COOKIE = 'user_id';
const AUTH_TOKEN_COOKIE = 'auth_token';
const COOKIE_EXPIRY = 30; // days

export type User = {
  id: string;
  email?: string;
};

export async function registerUser(id: string, password: string): Promise<{ user: User | null; error: string | null }> {
  // Validate password length
  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters long.' };
  }

  // Check if user ID exists
  const { data: existingUsers, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .limit(1);

  if (checkError) {
    return { user: null, error: 'Failed to check existing users' };
  }

  if (existingUsers && existingUsers.length > 0) {
    return { user: null, error: 'User ID already exists. Please choose a different one.' };
  }

  // Create new user without requesting the data back (to avoid RLS issues)
  const { error } = await supabase
    .from('users')
    .insert([{ id, password }]);

  if (error) {
    return { user: null, error: error.message };
  }

  // Create user object manually since we know the ID
  const user = { id };
  setAuthCookies(user);
  return { user, error: null };
}

export async function loginUser(id: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // Check if the user exists and password matches
    // This should work with the "Allow credential verification for login" policy
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .eq('password', password)
      .single();

    if (error) {
      // If error.code is 'PGRST116', that means no rows were found
      if (error.code === 'PGRST116') {
        console.log('No matching user found for ID:', id);
        return { user: null, error: 'Invalid credentials' };
      }
      
      console.error('Login error:', error);
      return { user: null, error: error.message };
    }

    // Successfully found the user
    const user = { id: data.id };
    setAuthCookies(user);
    return { user, error: null };
  } catch (err) {
    console.error('Unexpected login error:', err);
    return { user: null, error: 'An unexpected error occurred during login' };
  }
}

export function setAuthCookies(user: User): void {
  Cookies.set(USER_ID_COOKIE, user.id, { expires: COOKIE_EXPIRY });
  Cookies.set(AUTH_TOKEN_COOKIE, generateToken(), { expires: COOKIE_EXPIRY });
}

export function clearAuthCookies(): void {
  Cookies.remove(USER_ID_COOKIE);
  Cookies.remove(AUTH_TOKEN_COOKIE);
}

export function getLoggedInUser(): User | null {
  const userId = Cookies.get(USER_ID_COOKIE);
  if (!userId) return null;
  
  return { id: userId };
}

export function isAuthenticated(): boolean {
  return !!getLoggedInUser();
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
} 