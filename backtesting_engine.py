import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
import json

# ============================================================================
# PART 1: DATA FETCHER
# ============================================================================

class DataFetcher:
    """Fetch and normalize historical price data from Yahoo Finance or CoinGecko"""
    
    @staticmethod
    def fetch_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Fetch historical OHLCV data
        
        Args:
            ticker: Stock/crypto ticker (e.g., 'BTC-USD', 'NVDA', 'GLD')
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            DataFrame with Date, Open, High, Low, Close, Volume
        """
        try:
            data = yf.download(ticker, start=start_date, end=end_date, progress=False)
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = data.columns.get_level_values(0)
            data = data.reset_index()
            data.rename(columns={'Date': 'date', 'Open': 'open', 'High': 'high', 
                                'Low': 'low', 'Close': 'close', 'Volume': 'volume'}, 
                       inplace=True)
            data['date'] = pd.to_datetime(data['date'])
            return data.sort_values('date').reset_index(drop=True)
        except Exception as e:
            raise Exception(f"Error fetching data for {ticker}: {str(e)}")
    
    @staticmethod
    def validate_data(data: pd.DataFrame) -> bool:
        """Check if data is valid"""
        required_cols = ['date', 'open', 'high', 'low', 'close', 'volume']
        if not all(col in data.columns for col in required_cols):
            raise ValueError(f"Missing required columns. Need: {required_cols}")
        
        if len(data) < 50:
            raise ValueError("Not enough data points (need at least 50 days)")
        
        if data['close'].isnull().any():
            raise ValueError("Data contains null values")
        
        return True


# ============================================================================
# PART 2: INDICATOR CALCULATOR
# ============================================================================

class IndicatorCalculator:
    """Calculate technical indicators and performance metrics"""
    
    @staticmethod
    def calculate_sma(data: pd.DataFrame, period: int) -> pd.Series:
        """
        Simple Moving Average
        SMA = Average of last N closing prices
        
        Example:
            Period 20: Average of last 20 days' close prices
        """
        return data['close'].rolling(window=period).mean()
    
    @staticmethod
    def calculate_ema(data: pd.DataFrame, period: int) -> pd.Series:
        """
        Exponential Moving Average
        Gives more weight to recent prices
        
        Formula: EMA = (Price × Multiplier) + (Previous EMA × (1 - Multiplier))
        Multiplier = 2 / (period + 1)
        """
        return data['close'].ewm(span=period, adjust=False).mean()
    
    @staticmethod
    def calculate_returns(data: pd.DataFrame) -> pd.Series:
        """
        Daily Returns
        Return = (Today's Close - Yesterday's Close) / Yesterday's Close
        
        Example:
            Close Day 1: $100
            Close Day 2: $102
            Return = (102 - 100) / 100 = 0.02 = 2%
        """
        return data['close'].pct_change()

    @staticmethod
    def calculate_cumulative_returns(data: pd.DataFrame) -> pd.Series:
        """
        Cumulative Returns
        Compounded growth of $1 invested at the start of the series.

        Example:
            Daily returns: [0.02, -0.01, 0.03]
            Cumulative: [0.02, 0.0098, 0.0402] (i.e. +4.02% by day 3)
        """
        returns = IndicatorCalculator.calculate_returns(data)
        return (1 + returns.fillna(0)).cumprod() - 1

    @staticmethod
    def calculate_rolling_returns(data: pd.DataFrame, window: int = 30) -> pd.Series:
        """
        Rolling Returns
        % change in close price over the trailing `window` days, computed for every day.
        Distinct from RollingAnalyzer, which re-runs whole strategy backtests in rolling windows.

        Example:
            window=30: today's close vs the close 30 days ago, repeated for every day
        """
        return data['close'].pct_change(periods=window)

    @staticmethod
    def calculate_volatility(returns: pd.Series, periods: int = 252) -> float:
        """
        Annualized Volatility
        Volatility = Std Dev of Daily Returns × √252
        252 = number of trading days per year
        
        High volatility = price swings a lot
        Low volatility = price is stable
        """
        daily_volatility = returns.std()
        annualized_volatility = daily_volatility * np.sqrt(periods)
        return annualized_volatility
    
    @staticmethod
    def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.02) -> float:
        """
        Sharpe Ratio
        Sharpe = (Strategy Return - Risk-Free Rate) / Volatility
        
        Interpretation:
        - Sharpe > 1: Good (good return for risk)
        - Sharpe > 2: Excellent
        - Sharpe < 0: Losing money
        
        Example:
            Strategy Return: 15% per year
            Risk-Free Rate: 2% (bonds)
            Volatility: 20% per year
            Sharpe = (0.15 - 0.02) / 0.20 = 0.65
        """
        excess_return = returns.mean() * 252 - risk_free_rate
        volatility = IndicatorCalculator.calculate_volatility(returns)
        
        if volatility == 0:
            return 0
        return excess_return / volatility
    
    @staticmethod
    def calculate_max_drawdown(portfolio_values: pd.Series) -> Tuple[float, str, str]:
        """
        Maximum Drawdown
        Maximum percentage drop from peak to trough
        
        Example:
            Portfolio value: 100 → 150 (peak) → 90 (trough) → 140
            Max Drawdown = (90 - 150) / 150 = -40%
            Worst-case loss from peak
        
        Returns:
            (drawdown_percent, peak_date, trough_date)
        """
        cumulative_max = portfolio_values.cummax()
        drawdown = (portfolio_values - cumulative_max) / cumulative_max

        # Positional (not label-based) throughout: label-slicing cumulative_max[:max_drawdown_date]
        # only behaves correctly by accident for datetime-indexed series (inclusive endpoint);
        # it silently breaks (empty slice -> ValueError) for a plain integer index when the
        # trough is at position 0. argmin/argmax on .values sidesteps the index dtype entirely.
        max_drawdown_value = drawdown.min()
        trough_pos = drawdown.values.argmin()
        peak_pos = cumulative_max.values[:trough_pos + 1].argmax()
        peak_date = portfolio_values.index[peak_pos]
        trough_date = portfolio_values.index[trough_pos]

        return (max_drawdown_value,
                str(peak_date.date()) if hasattr(peak_date, 'date') else str(peak_date),
                str(trough_date.date()) if hasattr(trough_date, 'date') else str(trough_date))
    
    @staticmethod
    def calculate_correlation(returns1: pd.Series, returns2: pd.Series) -> float:
        """
        Correlation between two assets
        Range: -1 to +1
        
        +1  = Move together perfectly
         0  = Independent
        -1  = Move opposite
        
        Example:
            Gold & Bitcoin: 0.3 (somewhat correlated)
            Gold & Bonds: -0.1 (slightly opposite - good diversification)
        """
        return returns1.corr(returns2)

    @staticmethod
    def calculate_rolling_correlation(returns1: pd.Series, returns2: pd.Series,
                                       window: int = 30) -> pd.Series:
        """
        Rolling Correlation
        Correlation between two assets' returns recomputed over a trailing window,
        so relationships that change over time (e.g. BTC/Gold decoupling) become visible
        instead of collapsing into one whole-period number.
        """
        return returns1.rolling(window=window).corr(returns2)

    @staticmethod
    def calculate_rsi(data: pd.DataFrame, period: int = 14) -> pd.Series:
        """
        Relative Strength Index (from MASTER_PROMPT_FINTECH_PLATFORM.md)
        RSI = 100 - (100 / (1 + RS)), RS = Average Gain / Average Loss over `period` days.

        Interpretation: RSI > 70 = overbought, RSI < 30 = oversold.
        """
        delta = data['close'].diff()
        gains = delta.where(delta > 0, 0).rolling(window=period).mean()
        losses = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gains / losses
        return 100 - (100 / (1 + rs))

    @staticmethod
    def calculate_macd(data: pd.DataFrame, fast: int = 12, slow: int = 26,
                       signal: int = 9) -> Dict[str, pd.Series]:
        """
        MACD (Moving Average Convergence Divergence)
        MACD line = EMA(fast) - EMA(slow); Signal line = EMA(signal) of the MACD line;
        Histogram = MACD - Signal.
        """
        ema_fast = data['close'].ewm(span=fast, adjust=False).mean()
        ema_slow = data['close'].ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        return {
            'macd': macd_line,
            'signal': signal_line,
            'histogram': macd_line - signal_line,
        }

    @staticmethod
    def calculate_bollinger_bands(data: pd.DataFrame, period: int = 20,
                                  std_dev: float = 2.0) -> Dict[str, pd.Series]:
        """
        Bollinger Bands: middle = SMA(period), upper/lower = middle +/- (std_dev * rolling std).
        (SignalGenerator.mean_reversion computes this inline for signal purposes; this exposes
        the bands themselves for charting/indicator display.)
        """
        middle = data['close'].rolling(window=period).mean()
        std = data['close'].rolling(window=period).std()
        return {
            'upper': middle + (std_dev * std),
            'middle': middle,
            'lower': middle - (std_dev * std),
        }

    @staticmethod
    def calculate_calmar_ratio(portfolio_values: pd.Series) -> float:
        """
        Calmar Ratio = Annualized Return / |Max Drawdown|.
        Like Sharpe, but measures return against worst-case peak-to-trough loss instead of
        volatility — penalizes strategies with deep drawdowns even if their day-to-day
        volatility looks tame.
        """
        returns = portfolio_values.pct_change().dropna()
        if len(returns) == 0:
            return 0
        annual_return = returns.mean() * 252
        max_dd, _, _ = IndicatorCalculator.calculate_max_drawdown(portfolio_values)
        if max_dd == 0:
            return 0
        return annual_return / abs(max_dd)

    @staticmethod
    def calculate_all_indicators(data: pd.DataFrame, sma_fast: int = 20,
                                sma_slow: int = 50, ema_fast: int = 12,
                                ema_slow: int = 26, rolling_window: int = 30) -> pd.DataFrame:
        """Calculate all indicators at once"""
        data['sma_fast'] = IndicatorCalculator.calculate_sma(data, sma_fast)
        data['sma_slow'] = IndicatorCalculator.calculate_sma(data, sma_slow)
        data['ema_fast'] = IndicatorCalculator.calculate_ema(data, ema_fast)
        data['ema_slow'] = IndicatorCalculator.calculate_ema(data, ema_slow)
        data['returns'] = IndicatorCalculator.calculate_returns(data)
        data['cumulative_returns'] = IndicatorCalculator.calculate_cumulative_returns(data)
        data['rsi'] = IndicatorCalculator.calculate_rsi(data)
        macd = IndicatorCalculator.calculate_macd(data)
        data['macd'] = macd['macd']
        data['macd_signal'] = macd['signal']
        data['macd_histogram'] = macd['histogram']
        bb = IndicatorCalculator.calculate_bollinger_bands(data)
        data['bb_upper'] = bb['upper']
        data['bb_middle'] = bb['middle']
        data['bb_lower'] = bb['lower']
        data['rolling_returns'] = IndicatorCalculator.calculate_rolling_returns(data, rolling_window)

        return data


# ============================================================================
# PART 3: SIGNAL GENERATOR (Entry/Exit Logic)
# ============================================================================

class SignalGenerator:
    """Generate buy/sell signals based on strategy"""
    
    @staticmethod
    def sma_crossover(data: pd.DataFrame) -> pd.Series:
        """
        SMA Crossover Strategy
        
        BUY Signal: When fast SMA crosses ABOVE slow SMA
        SELL Signal: When fast SMA crosses BELOW slow SMA
        
        Logic:
        - If previous SMA_fast <= SMA_slow AND current SMA_fast > SMA_slow → BUY
        - If previous SMA_fast >= SMA_slow AND current SMA_fast < SMA_slow → SELL
        
        Example:
            Day 1: SMA20=100, SMA50=102 (fast below slow)
            Day 2: SMA20=104, SMA50=102 (fast above slow) → BUY SIGNAL
            Day 3: SMA20=103, SMA50=103 (equal)
            Day 4: SMA20=101, SMA50=104 (fast below slow) → SELL SIGNAL
        """
        signals = pd.Series(0, index=data.index)
        
        for i in range(1, len(data)):
            # Check if we have valid SMAs
            if pd.isna(data['sma_fast'].iloc[i]) or pd.isna(data['sma_slow'].iloc[i]):
                continue
            
            prev_sma_fast = data['sma_fast'].iloc[i-1]
            prev_sma_slow = data['sma_slow'].iloc[i-1]
            curr_sma_fast = data['sma_fast'].iloc[i]
            curr_sma_slow = data['sma_slow'].iloc[i]
            
            # BUY: Fast MA crosses above slow MA
            if prev_sma_fast <= prev_sma_slow and curr_sma_fast > curr_sma_slow:
                signals.iloc[i] = 1
            # SELL: Fast MA crosses below slow MA
            elif prev_sma_fast >= prev_sma_slow and curr_sma_fast < curr_sma_slow:
                signals.iloc[i] = -1
        
        return signals
    
    @staticmethod
    def ema_trend(data: pd.DataFrame) -> pd.Series:
        """
        EMA Trend Strategy
        
        Similar to SMA but uses EMA (responds faster to price changes)
        BUY: EMA_fast > EMA_slow
        SELL: EMA_fast < EMA_slow
        """
        signals = pd.Series(0, index=data.index)
        
        for i in range(1, len(data)):
            if pd.isna(data['ema_fast'].iloc[i]) or pd.isna(data['ema_slow'].iloc[i]):
                continue
            
            prev_ema_fast = data['ema_fast'].iloc[i-1]
            prev_ema_slow = data['ema_slow'].iloc[i-1]
            curr_ema_fast = data['ema_fast'].iloc[i]
            curr_ema_slow = data['ema_slow'].iloc[i]
            
            # BUY: Fast EMA crosses above slow EMA
            if prev_ema_fast <= prev_ema_slow and curr_ema_fast > curr_ema_slow:
                signals.iloc[i] = 1
            # SELL: Fast EMA crosses below slow EMA
            elif prev_ema_fast >= prev_ema_slow and curr_ema_fast < curr_ema_slow:
                signals.iloc[i] = -1
        
        return signals
    
    @staticmethod
    def momentum(data: pd.DataFrame, period: int = 14) -> pd.Series:
        """
        Momentum Strategy
        
        Momentum = Current Price - Price N days ago
        
        BUY: When momentum is positive and increasing
        SELL: When momentum turns negative
        
        Logic:
        - If momentum > 0 and previous momentum <= 0 → BUY
        - If momentum < 0 and previous momentum >= 0 → SELL
        """
        momentum = data['close'] - data['close'].shift(period)
        signals = pd.Series(0, index=data.index)
        
        for i in range(1, len(data)):
            if pd.isna(momentum.iloc[i]):
                continue
            
            prev_momentum = momentum.iloc[i-1]
            curr_momentum = momentum.iloc[i]
            
            # BUY: Momentum turns positive
            if prev_momentum <= 0 and curr_momentum > 0:
                signals.iloc[i] = 1
            # SELL: Momentum turns negative
            elif prev_momentum >= 0 and curr_momentum < 0:
                signals.iloc[i] = -1
        
        return signals
    
    @staticmethod
    def mean_reversion(data: pd.DataFrame, period: int = 20, std_dev: int = 2) -> pd.Series:
        """
        Mean Reversion Strategy
        
        Assumes price reverts to moving average
        Uses Bollinger Bands concept
        
        BUY: Price falls below (SMA - 2*StdDev)
        SELL: Price rises above (SMA + 2*StdDev)
        
        Logic:
        - Lower band = SMA - (2 × Price Std Dev)
        - Upper band = SMA + (2 × Price Std Dev)
        - Price < Lower band → BUY (price too low)
        - Price > Upper band → SELL (price too high)
        """
        sma = data['close'].rolling(window=period).mean()
        std = data['close'].rolling(window=period).std()
        
        lower_band = sma - (std_dev * std)
        upper_band = sma + (std_dev * std)
        
        signals = pd.Series(0, index=data.index)
        
        for i in range(period, len(data)):
            if pd.isna(lower_band.iloc[i]) or pd.isna(upper_band.iloc[i]):
                continue
            
            price = data['close'].iloc[i]
            
            # BUY: Price below lower band
            if price < lower_band.iloc[i]:
                signals.iloc[i] = 1
            # SELL: Price above upper band
            elif price > upper_band.iloc[i]:
                signals.iloc[i] = -1
        
        return signals


# ============================================================================
# PART 4: POSITION MANAGER (Position Sizing & Trade Execution)
# ============================================================================

class PositionManager:
    """Manage trades, position sizing, and transaction costs"""
    
    def __init__(self, initial_capital: float, transaction_cost: float = 0.001):
        """
        Args:
            initial_capital: Starting money ($)
            transaction_cost: Broker fee as decimal (0.001 = 0.1%)
        """
        self.initial_capital = initial_capital
        self.transaction_cost = transaction_cost
        self.position_size = 0  # Current shares held
        self.cash = initial_capital
        self.trades = []
    
    def calculate_position_size(self, price: float, risk_percent: float = 0.95) -> float:
        """
        Calculate how many shares to buy
        
        Risk Percent: What % of available capital to use
        
        Example:
            Capital: $10,000
            Risk Percent: 95%
            Price: $100
            Shares = (10,000 × 0.95) / 100 = 95 shares
        
        Args:
            price: Current asset price
            risk_percent: Percentage of capital to risk (0.95 = 95%)
        
        Returns:
            Number of shares to buy
        """
        available_capital = self.cash * risk_percent
        shares = available_capital / price
        return shares
    
    def execute_buy(self, date: str, price: float, shares: float) -> bool:
        """
        Execute BUY trade
        
        1. Calculate cost with transaction fees
        2. Check if enough cash
        3. Update position and cash
        4. Record trade
        
        Args:
            date: Trade date
            price: Entry price
            shares: Number of shares to buy
        
        Returns:
            True if trade executed, False if insufficient funds
        """
        cost = (price * shares) * (1 + self.transaction_cost)
        
        if cost > self.cash:
            return False  # Not enough cash
        
        self.position_size = shares
        self.cash -= cost
        self.trades.append({
            'date': date,
            'type': 'BUY',
            'price': price,
            'shares': shares,
            'cost': cost,
            'cash_after': self.cash
        })
        return True
    
    def execute_sell(self, date: str, price: float) -> float:
        """
        Execute SELL trade
        
        1. Calculate proceeds with transaction fees
        2. Update position and cash
        3. Record trade and P&L
        
        Args:
            date: Trade date
            price: Exit price
        
        Returns:
            Profit/Loss from this trade
        """
        if self.position_size == 0:
            return 0
        
        proceeds = (price * self.position_size) * (1 - self.transaction_cost)
        cost_basis = self.trades[-1]['cost']
        profit = proceeds - cost_basis
        
        self.cash += proceeds
        self.trades.append({
            'date': date,
            'type': 'SELL',
            'price': price,
            'shares': self.position_size,
            'proceeds': proceeds,
            'profit': profit,
            'cash_after': self.cash
        })
        
        self.position_size = 0
        return profit
    
    def get_portfolio_value(self, current_price: float) -> float:
        """
        Calculate current portfolio value
        Value = Cash + (Shares × Current Price)
        """
        return self.cash + (self.position_size * current_price)


# ============================================================================
# PART 5: BACKTESTER (Main Engine)
# ============================================================================

class Backtester:
    """Main backtesting engine - simulates strategy on historical data"""
    
    def __init__(self, data: pd.DataFrame, initial_capital: float, 
                 transaction_cost: float = 0.001, strategy: str = 'sma_crossover'):
        """
        Args:
            data: Historical OHLCV data with indicators
            initial_capital: Starting capital ($)
            transaction_cost: Broker fee
            strategy: Strategy name ('sma_crossover', 'ema_trend', 'momentum', 'mean_reversion')
        """
        self.data = data.copy()
        self.initial_capital = initial_capital
        self.transaction_cost = transaction_cost
        self.strategy = strategy
        self.position_manager = PositionManager(initial_capital, transaction_cost)
        self.portfolio_values = []
        self.dates = []
    
    def run(self) -> Dict[str, Any]:
        """
        Run complete backtest
        
        Process:
        1. Generate signals based on strategy
        2. For each day:
           a. Check for entry signal (BUY)
           b. Check for exit signal (SELL)
           c. Update portfolio value
        3. Calculate performance metrics
        4. Return results
        
        Returns:
            Dictionary with all backtest results
        """
        
        # Step 1: Generate signals
        if self.strategy == 'sma_crossover':
            self.data['signal'] = SignalGenerator.sma_crossover(self.data)
        elif self.strategy == 'ema_trend':
            self.data['signal'] = SignalGenerator.ema_trend(self.data)
        elif self.strategy == 'momentum':
            self.data['signal'] = SignalGenerator.momentum(self.data)
        elif self.strategy == 'mean_reversion':
            self.data['signal'] = SignalGenerator.mean_reversion(self.data)
        else:
            raise ValueError(f"Unknown strategy: {self.strategy}")
        
        # Step 2: Execute trades based on signals
        for i in range(len(self.data)):
            date = self.data['date'].iloc[i]
            price = self.data['close'].iloc[i]
            signal = self.data['signal'].iloc[i]
            
            # BUY signal
            if signal == 1 and self.position_manager.position_size == 0:
                shares = self.position_manager.calculate_position_size(price, risk_percent=0.95)
                self.position_manager.execute_buy(str(date.date()), price, shares)
            
            # SELL signal
            elif signal == -1 and self.position_manager.position_size > 0:
                self.position_manager.execute_sell(str(date.date()), price)
            
            # Record portfolio value
            portfolio_value = self.position_manager.get_portfolio_value(price)
            self.portfolio_values.append(portfolio_value)
            self.dates.append(date)
        
        # Step 3: Calculate metrics
        return self._calculate_metrics()
    
    def _calculate_metrics(self) -> Dict[str, Any]:
        """Calculate all performance metrics"""
        
        portfolio_series = pd.Series(self.portfolio_values, index=self.dates)
        portfolio_returns = portfolio_series.pct_change()
        
        # Basic metrics
        final_value = self.portfolio_values[-1]
        total_return = final_value - self.initial_capital
        total_return_percent = (total_return / self.initial_capital) * 100
        
        # Risk metrics
        volatility = IndicatorCalculator.calculate_volatility(portfolio_returns)
        sharpe_ratio = IndicatorCalculator.calculate_sharpe_ratio(portfolio_returns)
        max_dd, peak_date, trough_date = IndicatorCalculator.calculate_max_drawdown(portfolio_series)
        calmar_ratio = IndicatorCalculator.calculate_calmar_ratio(portfolio_series)

        # Trade statistics
        trades = self.position_manager.trades
        buy_trades = [t for t in trades if t['type'] == 'BUY']
        sell_trades = [t for t in trades if t['type'] == 'SELL']
        
        winning_trades = 0
        losing_trades = 0
        total_profit = 0
        
        for i, sell in enumerate(sell_trades):
            if 'profit' in sell:
                if sell['profit'] > 0:
                    winning_trades += 1
                else:
                    losing_trades += 1
                total_profit += sell['profit']
        
        total_trades = len(buy_trades)
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        avg_profit = (total_profit / total_trades) if total_trades > 0 else 0
        
        # Annualized return
        days = len(self.data)
        years = days / 252
        annualized_return = ((final_value / self.initial_capital) ** (1/years) - 1) * 100 if years > 0 else 0
        
        # Benchmark (Buy & Hold)
        benchmark_return = (self.data['close'].iloc[-1] - self.data['close'].iloc[0]) / self.data['close'].iloc[0] * 100
        benchmark_value = self.initial_capital * (1 + benchmark_return / 100)
        
        return {
            'summary': {
                'strategy': self.strategy,
                'initial_capital': self.initial_capital,
                'final_portfolio_value': round(final_value, 2),
                'total_return_dollars': round(total_return, 2),
                'total_return_percent': round(total_return_percent, 2),
                'annualized_return_percent': round(annualized_return, 2),
                'benchmark_return_percent': round(benchmark_return, 2),
                'strategy_vs_benchmark': round(total_return_percent - benchmark_return, 2),
            },
            'risk_metrics': {
                'volatility_percent': round(volatility * 100, 2),
                'sharpe_ratio': round(sharpe_ratio, 2),
                'max_drawdown_percent': round(max_dd * 100, 2),
                'max_drawdown_from_date': peak_date,
                'max_drawdown_to_date': trough_date,
                'calmar_ratio': round(calmar_ratio, 2),
            },
            'trade_statistics': {
                'total_trades': total_trades,
                'winning_trades': winning_trades,
                'losing_trades': losing_trades,
                'win_rate_percent': round(win_rate, 2),
                'average_profit_per_trade': round(avg_profit, 2),
                'total_profit_from_trades': round(total_profit, 2),
            },
            'trades': self.position_manager.trades,
            'portfolio_values': self.portfolio_values,
            'dates': [str(d.date()) for d in self.dates],
        }


# ============================================================================
# PART 6: CORRELATION ANALYZER (Multi-Asset Analysis)
# ============================================================================

class CorrelationAnalyzer:
    """Analyze correlations between multiple assets"""
    
    @staticmethod
    def calculate_correlation_matrix(assets_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Calculate correlation matrix between all assets
        
        Args:
            assets_data: Dict of {asset_name: dataframe}
        
        Returns:
            Correlation matrix
        
        Example:
                    BTC    Gold   NVDA
            BTC    1.00   0.30   0.45
            Gold   0.30   1.00   0.10
            NVDA   0.45   0.10   1.00
        """
        returns_dict = {}
        
        for asset_name, data in assets_data.items():
            returns_dict[asset_name] = data['close'].pct_change()
        
        returns_df = pd.DataFrame(returns_dict)
        correlation_matrix = returns_df.corr()
        
        return correlation_matrix
    
    @staticmethod
    def interpret_correlation(corr_value: float) -> str:
        """Interpret correlation value"""
        if corr_value > 0.7:
            return "Highly Positive (move together)"
        elif corr_value > 0.3:
            return "Moderately Positive"
        elif corr_value > -0.3:
            return "Low Correlation (independent)"
        elif corr_value > -0.7:
            return "Moderately Negative"
        else:
            return "Highly Negative (opposite moves)"

    @staticmethod
    def calculate_rolling_correlation_pair(assets_data: Dict[str, pd.DataFrame],
                                            asset1: str, asset2: str,
                                            window: int = 30) -> pd.DataFrame:
        """
        Rolling correlation between two named assets over time (fintech_track.pdf:
        "rolling correlation analysis to study how relationships ... change over time").

        Returns:
            DataFrame with columns ['date', 'rolling_correlation']
        """
        returns1 = assets_data[asset1]['close'].pct_change()
        returns2 = assets_data[asset2]['close'].pct_change()
        rolling_corr = IndicatorCalculator.calculate_rolling_correlation(returns1, returns2, window)

        dates = assets_data[asset1]['date'] if 'date' in assets_data[asset1].columns else assets_data[asset1].index
        return pd.DataFrame({'date': dates, 'rolling_correlation': rolling_corr.values})


# ============================================================================
# PART 6.5: MARKET REGIME ANALYSIS (fintech_track.pdf: Bull/Bear/High-Vol/Low-Vol)
# ============================================================================

class MarketRegimeAnalyzer:
    """Classify each day into a market regime and break down strategy performance by regime."""

    @staticmethod
    def classify_regime(data: pd.DataFrame, trend_period: int = 200,
                        vol_window: int = 30, vol_threshold: float = None) -> pd.Series:
        """
        Regime per day, combining trend (price vs long EMA) and volatility (rolling annualized
        vol vs its own median) per END_TO_END_BACKTESTING_ALGORITHM.md's detection sketch:

            Close > EMA(200) -> uptrend (Bull), else downtrend (Bear)
            rolling volatility > its median -> High Volatility, else Low Volatility

        Returns a Series of labels: 'Bull-HighVol', 'Bull-LowVol', 'Bear-HighVol', 'Bear-LowVol'.
        """
        trend_ema = data['close'].ewm(span=trend_period, adjust=False).mean()
        is_bull = data['close'] > trend_ema

        returns = data['close'].pct_change()
        rolling_vol = returns.rolling(window=vol_window).std() * np.sqrt(252)
        threshold = vol_threshold if vol_threshold is not None else rolling_vol.median()
        is_high_vol = rolling_vol > threshold

        trend_label = np.where(is_bull, 'Bull', 'Bear')
        vol_label = np.where(is_high_vol, 'HighVol', 'LowVol')
        regime = pd.Series(
            [f"{t}-{v}" for t, v in zip(trend_label, vol_label)],
            index=data.index,
        )
        regime[trend_ema.isna() | rolling_vol.isna()] = 'Unknown'
        return regime

    @staticmethod
    def analyze_by_regime(backtest_results: Dict[str, Any], data: pd.DataFrame,
                          trend_period: int = 200, vol_window: int = 30) -> Dict[str, Any]:
        """
        Break daily portfolio returns down by the regime active on each day.

        Args:
            backtest_results: output of Backtester.run() (needs 'portfolio_values', 'dates')
            data: the same OHLCV+indicator DataFrame the backtest ran on (for regime labels)

        Returns:
            {regime_label: {days, avg_daily_return_percent, volatility_percent}}
        """
        regime = MarketRegimeAnalyzer.classify_regime(data, trend_period, vol_window)
        regime = regime.reset_index(drop=True)

        portfolio = pd.Series(backtest_results['portfolio_values'])
        daily_returns = portfolio.pct_change()

        breakdown = {}
        for label in regime.unique():
            if label == 'Unknown':
                continue
            mask = (regime == label).values
            regime_returns = daily_returns[mask]
            regime_returns = regime_returns.dropna()
            if len(regime_returns) == 0:
                continue
            breakdown[label] = {
                'days': int(mask.sum()),
                'avg_daily_return_percent': round(float(regime_returns.mean()) * 100, 4),
                'volatility_percent': round(float(regime_returns.std() * np.sqrt(252)) * 100, 2)
                                       if len(regime_returns) > 1 else 0.0,
            }
        return breakdown


# ============================================================================
# PART 6.6: REQUEST VALIDATION (Phase 1 of END_TO_END_BACKTESTING_ALGORITHM.md)
# ============================================================================

VALID_STRATEGIES = ['sma_crossover', 'ema_trend', 'momentum', 'mean_reversion']


def validate_request(ticker: str, start_date: str, end_date: str,
                     initial_capital: float, strategy: str,
                     transaction_cost: float, sma_fast: int, sma_slow: int) -> None:
    """Validate backtest inputs before touching the network or data. Raises ValueError."""
    errors = []

    if not ticker:
        errors.append("ticker is required")

    start = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')
    if start >= end:
        errors.append("start_date must be before end_date")

    if initial_capital <= 0:
        errors.append("initial_capital must be > 0")

    if strategy not in VALID_STRATEGIES:
        errors.append(f"strategy must be one of {VALID_STRATEGIES}")

    if not (0 <= transaction_cost <= 0.1):
        errors.append("transaction_cost must be between 0 and 0.1")

    if sma_fast >= sma_slow:
        errors.append("sma_fast must be < sma_slow")

    if errors:
        raise ValueError("; ".join(errors))


# ============================================================================
# PART 7: MAIN EXECUTION FUNCTION
# ============================================================================

def run_backtest(ticker: str, start_date: str, end_date: str,
                 initial_capital: float = 10000,
                 strategy: str = 'sma_crossover',
                 transaction_cost: float = 0.001,
                 sma_fast: int = 20,
                 sma_slow: int = 50) -> Dict[str, Any]:
    """
    Complete backtesting pipeline
    
    Args:
        ticker: Asset ticker (e.g., 'BTC-USD', 'NVDA', 'GLD')
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        initial_capital: Starting capital ($)
        strategy: Strategy type ('sma_crossover', 'ema_trend', 'momentum', 'mean_reversion')
        transaction_cost: Broker fee (0.001 = 0.1%)
        sma_fast: Fast moving average period
        sma_slow: Slow moving average period
    
    Returns:
        Complete backtest results with metrics and trades
    
    Example:
        results = run_backtest(
            ticker='BTC-USD',
            start_date='2022-01-01',
            end_date='2024-01-01',
            initial_capital=10000,
            strategy='sma_crossover',
            transaction_cost=0.001,
            sma_fast=20,
            sma_slow=50
        )
    """
    
    validate_request(ticker, start_date, end_date, initial_capital, strategy,
                     transaction_cost, sma_fast, sma_slow)

    print(f"Fetching data for {ticker}...")
    data = DataFetcher.fetch_data(ticker, start_date, end_date)

    print(f"Validating data...")
    DataFetcher.validate_data(data)
    
    print(f"Calculating indicators...")
    data = IndicatorCalculator.calculate_all_indicators(data, sma_fast, sma_slow)
    
    print(f"Running backtest with strategy: {strategy}...")
    backtester = Backtester(data, initial_capital, transaction_cost, strategy)
    results = backtester.run()
    
    return results


def run_multi_asset_analysis(tickers: List[str], start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Analyze correlation between multiple assets
    
    Args:
        tickers: List of tickers (e.g., ['BTC-USD', 'GLD', 'NVDA'])
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
    
    Returns:
        Correlation analysis results
    """
    
    assets_data = {}
    
    for ticker in tickers:
        print(f"Fetching data for {ticker}...")
        data = DataFetcher.fetch_data(ticker, start_date, end_date)
        assets_data[ticker] = data
    
    print("Calculating correlation matrix...")
    corr_matrix = CorrelationAnalyzer.calculate_correlation_matrix(assets_data)
    
    return {
        'correlation_matrix': corr_matrix.to_dict(),
        'assets': list(corr_matrix.index),
        'interpretation': {
            f"{assets_data[a1]['symbol'] if 'symbol' in assets_data[a1].columns else a1} vs {assets_data[a2]['symbol'] if 'symbol' in assets_data[a2].columns else a2}": 
            CorrelationAnalyzer.interpret_correlation(corr_matrix.loc[a1, a2])
            for a1 in corr_matrix.index for a2 in corr_matrix.columns if a1 < a2
        }
    }


# ============================================================================
# PART 8: ADVANCED FEATURES (from BACKTESTING_ENGINE_PRODUCTION.md)
# ============================================================================

from itertools import product
import concurrent.futures

class ParameterOptimizer:
    """Optimize strategy parameters using grid search"""
    
    @staticmethod
    def grid_search(ticker: str, start_date: str, end_date: str, 
                   strategy: str, initial_capital: float,
                   param_ranges: Dict[str, List]) -> List[Dict]:
        """
        Test all combinations of parameters and find best performer
        
        Args:
            param_ranges: {
                'sma_fast': [10, 20, 30],
                'sma_slow': [40, 50, 60],
                'transaction_cost': [0.0005, 0.001]
            }
        
        Returns:
            List of results sorted by Sharpe ratio
        """
        print("Fetching data...")
        data = DataFetcher.fetch_data(ticker, start_date, end_date)
        DataFetcher.validate_data(data)
        
        # Generate all parameter combinations
        param_names = list(param_ranges.keys())
        param_values = list(param_ranges.values())
        param_combinations = list(product(*param_values))
        
        results = []
        total_combinations = len(param_combinations)
        
        print(f"Testing {total_combinations} parameter combinations...")
        
        for idx, params in enumerate(param_combinations, 1):
            param_dict = dict(zip(param_names, params))
            
            try:
                # Run backtest with this parameter set
                backtest_results = run_backtest(
                    ticker=ticker,
                    start_date=start_date,
                    end_date=end_date,
                    initial_capital=initial_capital,
                    strategy=strategy,
                    **param_dict
                )
                
                result_entry = {
                    'parameters': param_dict,
                    'sharpe_ratio': backtest_results['risk_metrics']['sharpe_ratio'],
                    'total_return': backtest_results['summary']['total_return_percent'],
                    'max_drawdown': backtest_results['risk_metrics']['max_drawdown_percent'],
                    'win_rate': backtest_results['trade_statistics']['win_rate_percent'],
                    'total_trades': backtest_results['trade_statistics']['total_trades']
                }
                results.append(result_entry)
                
                if idx % max(1, total_combinations // 10) == 0:
                    print(f"  Progress: {idx}/{total_combinations} ({100*idx//total_combinations}%)")
            
            except Exception as e:
                print(f"  Error with params {param_dict}: {str(e)}")
                continue
        
        # Sort by Sharpe ratio (best risk-adjusted returns)
        results_sorted = sorted(results, key=lambda x: x['sharpe_ratio'], reverse=True)
        
        return results_sorted
    
    @staticmethod
    def print_optimization_results(results: List[Dict], top_n: int = 10):
        """Display top N parameter combinations"""
        print("\n" + "="*100)
        print("PARAMETER OPTIMIZATION RESULTS (Top 10)")
        print("="*100)
        
        for rank, result in enumerate(results[:top_n], 1):
            print(f"\nRank #{rank}")
            print(f"  Parameters: {result['parameters']}")
            print(f"  Sharpe Ratio: {result['sharpe_ratio']:.2f}")
            print(f"  Total Return: {result['total_return']:.2f}%")
            print(f"  Max Drawdown: {result['max_drawdown']:.2f}%")
            print(f"  Win Rate: {result['win_rate']:.2f}%")
            print(f"  Total Trades: {result['total_trades']}")

class WalkForwardAnalyzer:
    """Perform walk-forward analysis to avoid overfitting"""
    
    @staticmethod
    def run_walk_forward(ticker: str, start_date: str, end_date: str,
                        strategy: str, initial_capital: float,
                        optimization_period: int = 252,  # 1 year
                        testing_period: int = 63) -> Dict:  # 3 months
        """
        Walk-Forward Analysis:
        1. Optimize parameters on past data (optimization_period)
        2. Test on future data (testing_period)
        3. Roll window forward and repeat
        
        This prevents overfitting by testing on unseen data
        """
        data = DataFetcher.fetch_data(ticker, start_date, end_date)
        DataFetcher.validate_data(data)
        
        all_walk_forward_results = []
        walk_count = 0
        
        # Walk through entire dataset
        for i in range(optimization_period, len(data) - testing_period, testing_period):
            walk_count += 1
            
            # Split data
            train_data = data.iloc[:i].copy()
            test_data = data.iloc[i:i+testing_period].copy()
            
            print(f"\nWalk-Forward #{walk_count}")
            print(f"  Optimization: {train_data['date'].min().date()} to {train_data['date'].max().date()}")
            print(f"  Testing: {test_data['date'].min().date()} to {test_data['date'].max().date()}")
            
            # Optimize on training data
            train_start = train_data['date'].min().strftime('%Y-%m-%d')
            train_end = train_data['date'].max().strftime('%Y-%m-%d')
            
            optimization_results = ParameterOptimizer.grid_search(
                ticker=ticker,
                start_date=train_start,
                end_date=train_end,
                strategy=strategy,
                initial_capital=initial_capital,
                param_ranges={
                    'sma_fast': [10, 20, 30],
                    'sma_slow': [40, 50, 60],
                }
            )
            
            best_params = optimization_results[0]['parameters']
            
            # Test on test data (calculate indicators on historical buffer, then slice test window)
            full_window = data.iloc[:i+testing_period].copy()
            full_window = IndicatorCalculator.calculate_all_indicators(
                full_window, 
                sma_fast=best_params.get('sma_fast', 20),
                sma_slow=best_params.get('sma_slow', 50)
            )
            
            ready_test_data = full_window.iloc[-testing_period:].copy()
            
            backtester = Backtester(
                data=ready_test_data,
                initial_capital=initial_capital,
                strategy=strategy,
                transaction_cost=0.001
            )
            test_results = backtester.run()
            
            walk_forward_result = {
                'walk_number': walk_count,
                'optimization_params': best_params,
                'out_of_sample_return': test_results['summary']['total_return_percent'],
                'out_of_sample_sharpe': test_results['risk_metrics']['sharpe_ratio'],
                'out_of_sample_trades': test_results['trade_statistics']['total_trades']
            }
            
            all_walk_forward_results.append(walk_forward_result)
            
            print(f"  Best Params (from optimization): {best_params}")
            print(f"  Out-of-Sample Return: {test_results['summary']['total_return_percent']:.2f}%")
            print(f"  Out-of-Sample Sharpe: {test_results['risk_metrics']['sharpe_ratio']:.2f}")
        
        return {
            'walk_forward_results': all_walk_forward_results,
            'average_out_of_sample_return': np.mean([r['out_of_sample_return'] for r in all_walk_forward_results]),
            'average_out_of_sample_sharpe': np.mean([r['out_of_sample_sharpe'] for r in all_walk_forward_results])
        }

class MonteCarloSimulator:
    """Simulate strategy performance under different market scenarios"""
    
    @staticmethod
    def run_monte_carlo(returns: pd.Series, initial_capital: float,
                       num_simulations: int = 1000,
                       days_ahead: int = 252) -> Dict:
        """
        Monte Carlo Simulation:
        1. Calculate daily return statistics
        2. Generate random price paths
        3. Analyze risk distribution
        
        Helps understand possible outcomes and tail risks
        """
        mean_return = returns.mean()
        std_return = returns.std()
        
        # Generate random price paths
        simulations = np.random.normal(
            mean_return, std_return, 
            size=(days_ahead, num_simulations)
        )
        
        # Calculate cumulative returns for each path
        cumulative_returns = np.cumprod(1 + simulations, axis=0)
        
        # Calculate final portfolio values
        final_values = initial_capital * cumulative_returns[-1, :]
        
        # Calculate statistics
        percentiles = [5, 25, 50, 75, 95]  # 5th to 95th percentile
        percentile_values = np.percentile(final_values, percentiles)
        
        results = {
            'simulations': num_simulations,
            'days_ahead': days_ahead,
            'initial_capital': initial_capital,
            'final_value_median': np.median(final_values),
            'final_value_mean': np.mean(final_values),
            'final_value_std': np.std(final_values),
            'percentile_values': {
                f'p{p}': float(v) for p, v in zip(percentiles, percentile_values)
            },
            'confidence_intervals': {
                '95%': (percentile_values[1], percentile_values[3]),  # 25th to 75th
                '90%': (percentile_values[0], percentile_values[4])   # 5th to 95th
            },
            'var_95': initial_capital - percentile_values[0],  # Value at Risk
            'cvar_95': initial_capital - np.mean(final_values[final_values <= percentile_values[0]])
        }
        
        return results

class RollingAnalyzer:
    """Analyze strategy performance in rolling windows"""
    
    @staticmethod
    def calculate_rolling_metrics(ticker: str, start_date: str, end_date: str,
                                 strategy: str, window_days: int = 252) -> pd.DataFrame:
        """
        Calculate performance metrics in rolling windows
        Helps identify periods when strategy works well vs poorly
        """
        data = DataFetcher.fetch_data(ticker, start_date, end_date)
        results_list = []
        
        for i in range(window_days, len(data)):
            window_start = data['date'].iloc[i - window_days].strftime('%Y-%m-%d')
            window_end = data['date'].iloc[i].strftime('%Y-%m-%d')
            
            try:
                window_results = run_backtest(
                    ticker=ticker,
                    start_date=window_start,
                    end_date=window_end,
                    initial_capital=10000,
                    strategy=strategy
                )
                
                results_list.append({
                    'date': data['date'].iloc[i],
                    'return': window_results['summary']['total_return_percent'],
                    'sharpe': window_results['risk_metrics']['sharpe_ratio'],
                    'max_drawdown': window_results['risk_metrics']['max_drawdown_percent'],
                    'win_rate': window_results['trade_statistics']['win_rate_percent']
                })
            
            except Exception as e:
                continue
        
        return pd.DataFrame(results_list)


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    
    # Example 1: Single Asset Backtest
    print("=" * 80)
    print("EXAMPLE 1: Bitcoin SMA Crossover Backtest")
    print("=" * 80)
    
    results = run_backtest(
        ticker='BTC-USD',
        start_date='2022-01-01',
        end_date='2024-01-01',
        initial_capital=10000,
        strategy='sma_crossover',
        transaction_cost=0.001,
        sma_fast=20,
        sma_slow=50
    )
    
    print("\n--- SUMMARY ---")
    for key, value in results['summary'].items():
        print(f"{key}: {value}")
    
    print("\n--- RISK METRICS ---")
    for key, value in results['risk_metrics'].items():
        print(f"{key}: {value}")
    
    print("\n--- TRADE STATISTICS ---")
    for key, value in results['trade_statistics'].items():
        print(f"{key}: {value}")
    
    print(f"\nTotal trades executed: {len(results['trades'])}")
    if len(results['trades']) > 0:
        print("First 5 trades:")
        for trade in results['trades'][:5]:
            print(f"  {trade}")
    
    
    # Example 2: Multiple strategies comparison
    print("\n\n" + "=" * 80)
    print("EXAMPLE 2: Strategy Comparison")
    print("=" * 80)
    
    strategies = ['sma_crossover', 'ema_trend', 'momentum', 'mean_reversion']
    
    for strategy in strategies:
        print(f"\nTesting {strategy.upper()}...")
        results = run_backtest(
            ticker='BTC-USD',
            start_date='2022-01-01',
            end_date='2024-01-01',
            initial_capital=10000,
            strategy=strategy,
            transaction_cost=0.001
        )
        
        print(f"  Return: {results['summary']['total_return_percent']}%")
        print(f"  Sharpe Ratio: {results['risk_metrics']['sharpe_ratio']}")
        print(f"  Max Drawdown: {results['risk_metrics']['max_drawdown_percent']}%")
        print(f"  Trades: {results['trade_statistics']['total_trades']}")
    
    
    # Example 3: Multi-asset correlation
    print("\n\n" + "=" * 80)
    print("EXAMPLE 3: Multi-Asset Correlation Analysis")
    print("=" * 80)
    
    corr_results = run_multi_asset_analysis(
        tickers=['BTC-USD', 'GLD', 'NVDA'],
        start_date='2023-01-01',
        end_date='2024-01-01'
    )
    
    print("\nCorrelation Matrix:")
    corr_df = pd.DataFrame(corr_results['correlation_matrix'])
    print(corr_df)
    
    print("\nInterpretations:")
    for pair, interpretation in corr_results['interpretation'].items():
        print(f"  {pair}: {interpretation}")
