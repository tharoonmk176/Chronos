import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import backtestReducer from './backtestSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    backtest: backtestReducer,
  },
})
