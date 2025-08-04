import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface User {
  id: string
  email: string
  name: string
  token: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
      state.isLoading = false
      state.isInitialized = true
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
    },
  },
})

export const { setUser, setLoading, logout } = authSlice.actions
export default authSlice.reducer
