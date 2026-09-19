import { createSlice } from '@reduxjs/toolkit'
import { getToken } from '../api/client'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: Boolean(getToken()),
  },
  reducers: {
    loggedIn(state) {
      state.isAuthenticated = true
    },
    loggedOut(state) {
      state.isAuthenticated = false
    },
  },
})

export const { loggedIn, loggedOut } = authSlice.actions
export default authSlice.reducer
