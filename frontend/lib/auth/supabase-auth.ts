import { supabase } from "@/lib/supabase/client"

export interface AuthUser {
  id: string
  email: string
  name: string
  token?: string
  access_token?: string
}

export interface AuthResponse {
  user: AuthUser | null
  error: string | null
}

export const authService = {
  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || name,
          token: data.session?.access_token || "",
        }
        return { user: authUser, error: null }
      }

      return { user: null, error: "Registration failed" }
    } catch (error) {
      return { user: null, error: "An unexpected error occurred" }
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!,
          token: data.session?.access_token || "",

        }
        return { user: authUser, error: null }
      }

      return { user: null, error: "Login failed" }
    } catch (error) {
      return { user: null, error: "An unexpected error occurred" }
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      return { error: "An unexpected error occurred" }
    }
  },

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error: error?.message || null }
    } catch (error) {
      return { error: "An unexpected error occurred" }
    }
  },

  async updatePassword(password: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })
      return { error: error?.message || null }
    } catch (error) {
      return { error: "An unexpected error occurred" }
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        return {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!,
        }
      }

      return null
    } catch (error) {
      return null
    }
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!,
        }
        callback(authUser)
      } else {
        callback(null)
      }
    })
  },
}
