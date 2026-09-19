
import React, { createContext, useContext, useState } from 'react';

export const regionsData = [
  { id: 'US', name: 'United States', currency: '$', tvSymbol: 'NASDAQ:AAPL', tvPrefix: 'NASDAQ:', tickers: ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'NVDA'] },
  { id: 'IN', name: 'India', currency: '₹', tvSymbol: 'BSE:RELIANCE', tvPrefix: 'BSE:', tickers: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'SBIN.NS'] },
  { id: 'UK', name: 'United Kingdom', currency: '£', tvSymbol: 'LSE:SHEL', tvPrefix: 'LSE:', tickers: ['SHEL.L', 'AZN.L', 'HSBC.L', 'ULVR.L'] },
  { id: 'JP', name: 'Japan', currency: '¥', tvSymbol: 'TSE:7203', tvPrefix: 'TSE:', tickers: ['7203.T', '6758.T', '9984.T', '8035.T'] },
  { id: 'DE', name: 'Germany', currency: '€', tvSymbol: 'XETR:SAP', tvPrefix: 'XETR:', tickers: ['SAP.DE', 'SIE.DE', 'ALV.DE', 'VOW3.DE'] },
  { id: 'FR', name: 'France', currency: '€', tvSymbol: 'EPA:MC', tvPrefix: 'EURONEXT:', tickers: ['MC.PA', 'OR.PA', 'RMS.PA', 'TTE.PA'] },
  { id: 'CA', name: 'Canada', currency: 'CA$', tvSymbol: 'TSX:RY', tvPrefix: 'TSX:', tickers: ['RY.TO', 'TD.TO', 'ENB.TO', 'SHOP.TO'] },
  { id: 'AU', name: 'Australia', currency: 'AU$', tvSymbol: 'ASX:BHP', tvPrefix: 'ASX:', tickers: ['BHP.AX', 'CBA.AX', 'CSL.AX', 'NAB.AX'] },
  { id: 'HK', name: 'Hong Kong / China', currency: 'HK$', tvSymbol: 'HKEX:700', tvPrefix: 'HKEX:', tickers: ['0700.HK', '9988.HK', '3690.HK'] },
  { id: 'CH', name: 'Switzerland', currency: 'CHF ', tvSymbol: 'SIX:NESN', tvPrefix: 'SIX:', tickers: ['NESN.SW', 'ROG.SW', 'NOVN.SW'] }
];

export const RegionContext = createContext();

export function RegionProvider({ children }) {
  const [region, setRegion] = useState(regionsData[0]);
  return (
    <RegionContext.Provider value={{ region, setRegion, regionsData }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  return useContext(RegionContext);
}
