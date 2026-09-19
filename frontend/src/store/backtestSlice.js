import { createSlice } from '@reduxjs/toolkit'
import { runBacktest, getBacktest, getIndicators, getRegime } from '../api/client'

const backtestSlice = createSlice({
  name: 'backtest',
  initialState: {
    results: null,
    indicators: null,
    regime: null,
    loading: false,
    statusMessage: '',
    error: null,
  },
  reducers: {
    submitStart(state) {
      state.loading = true
      state.error = null
      state.results = null
      state.indicators = null
      state.regime = null
      state.statusMessage = ''
    },
    setStatusMessage(state, action) {
      state.statusMessage = action.payload
    },
    submitSuccess(state, action) {
      state.results = action.payload
      state.loading = false
      state.statusMessage = ''
    },
    submitFailure(state, action) {
      state.error = action.payload
      state.loading = false
      state.statusMessage = ''
    },
    setIndicators(state, action) {
      state.indicators = action.payload
    },
    setRegime(state, action) {
      state.regime = action.payload
    },
  },
})

export const {
  submitStart, setStatusMessage, submitSuccess, submitFailure, setIndicators, setRegime,
} = backtestSlice.actions
export default backtestSlice.reducer

const POLL_INTERVAL_MS = 1000
const POLL_TIMEOUT_MS = 30000
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Plain thunk (not createAsyncThunk — this is a multi-step polling flow, not one request).
export function runBacktestFlow(form) {
  return async (dispatch) => {
    dispatch(submitStart())
    try {
      let data = await runBacktest(form)
      const deadline = Date.now() + POLL_TIMEOUT_MS
      while (data.status === 'pending' && Date.now() < deadline) {
        dispatch(setStatusMessage('Backtest running…'))
        await sleep(POLL_INTERVAL_MS)
        data = await getBacktest(data.backtest_id)
      }

      if (data.status === 'failed') {
        dispatch(submitFailure(data.error_message || 'Backtest failed'))
        return
      }
      if (data.status === 'pending') {
        dispatch(submitFailure('Backtest is taking longer than expected — try again shortly.'))
        return
      }
      dispatch(submitSuccess(data))

      getIndicators(form).then((d) => dispatch(setIndicators(d))).catch(() => {})
      getRegime(form).then((r) => dispatch(setRegime(r.regime_breakdown))).catch(() => {})
    } catch (err) {
      dispatch(submitFailure(err.response?.data?.detail || err.message))
    }
  }
}
