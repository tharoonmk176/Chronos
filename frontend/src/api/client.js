import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'fintech_platform_token'

const client = axios.create({ baseURL: BASE_URL })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export const register = (email, password) =>
  client.post('/api/v1/auth/register', { email, password }).then((r) => r.data)

export const login = (email, password) => {
  const form = new URLSearchParams()
  form.set('username', email)
  form.set('password', password)
  return client
    .post('/api/v1/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((r) => {
      localStorage.setItem(TOKEN_KEY, r.data.access_token)
      return r.data
    })
}

export const getMe = () => client.get('/api/v1/auth/me').then((r) => r.data)

export const runBacktest = (payload) =>
  client.post('/api/v1/backtest', payload).then((r) => r.data)

export const getBacktest = (id) =>
  client.get(`/api/v1/backtest/${id}`).then((r) => r.data)

export const listStrategies = () =>
  client.get('/api/v1/strategies').then((r) => r.data.strategies)

export const compareStrategies = (payload) =>
  client.post('/api/v1/strategies/compare', payload).then((r) => r.data)

export const getCorrelation = (payload) =>
  client.post('/api/v1/correlation', payload).then((r) => r.data)

export const getRollingCorrelation = (payload) =>
  client.post('/api/v1/correlation/rolling', payload).then((r) => r.data)

export const getIndicators = ({ ticker, start_date, end_date, strategy, sma_fast, sma_slow }) =>
  client
    .get(`/api/v1/indicators/${ticker}`, {
      params: { start_date, end_date, strategy, sma_fast, sma_slow },
    })
    .then((r) => r.data)

export const getRegime = (payload) =>
  client.post('/api/v1/regime', payload).then((r) => r.data)

export const optimizeParameters = (payload) =>
  client.post('/api/v1/optimize', payload).then((r) => r.data)
