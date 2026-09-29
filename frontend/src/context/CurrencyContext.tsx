import React, { createContext, useContext, useState } from 'react'

export type CurrencyCode =
  'USD' | 'INR' | 'EUR' | 'GBP' | 'BRL' | 'IDR' | 'JPY' | 'AUD' | 'CAD' | 'ZAR'

export interface CurrencyDetails {
  code: CurrencyCode
  symbol: string
  name: string
  rateAgainstUSD: number // 1 USD = X Currency
  locale: string
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyDetails> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar (Global)',
    rateAgainstUSD: 1.0,
    locale: 'en-US',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    rateAgainstUSD: 84.2,
    locale: 'en-IN',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rateAgainstUSD: 0.92,
    locale: 'de-DE',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rateAgainstUSD: 0.78,
    locale: 'en-GB',
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    rateAgainstUSD: 5.65,
    locale: 'pt-BR',
  },
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    rateAgainstUSD: 15850.0,
    locale: 'id-ID',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    rateAgainstUSD: 152.5,
    locale: 'ja-JP',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    rateAgainstUSD: 1.52,
    locale: 'en-AU',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    rateAgainstUSD: 1.38,
    locale: 'en-CA',
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    rateAgainstUSD: 18.2,
    locale: 'en-ZA',
  },
}

interface CurrencyContextType {
  currency: CurrencyCode
  currencyDetails: CurrencyDetails
  setCurrency: (code: CurrencyCode) => void
  convertFromUSD: (amountInUSD: number) => number
  convertToUSD: (amountInCurrentCurrency: number) => number
  formatCurrency: (
    amountInUSD: number,
    options?: { compact?: boolean; maximumFractionDigits?: number },
  ) => string
}

const STORAGE_KEY = 'darukaa_preferred_currency'

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && saved in SUPPORTED_CURRENCIES) {
        return saved as CurrencyCode
      }
    } catch {
      // ignore
    }
    return 'USD'
  })

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // ignore
    }
  }

  const currencyDetails = SUPPORTED_CURRENCIES[currency]

  const convertFromUSD = (amountInUSD: number): number => {
    return amountInUSD * currencyDetails.rateAgainstUSD
  }

  const convertToUSD = (amountInCurrentCurrency: number): number => {
    return amountInCurrentCurrency / currencyDetails.rateAgainstUSD
  }

  const formatCurrency = (
    amountInUSD: number,
    options?: { compact?: boolean; maximumFractionDigits?: number },
  ): string => {
    const converted = convertFromUSD(amountInUSD)
    const { compact = false, maximumFractionDigits = 0 } = options || {}

    if (compact) {
      // For compact formatting (e.g. ₹2.4L or $25k)
      if (currency === 'INR') {
        if (Math.abs(converted) >= 10000000) {
          return `${currencyDetails.symbol}${(converted / 10000000).toFixed(1)} Cr`
        }
        if (Math.abs(converted) >= 100000) {
          return `${currencyDetails.symbol}${(converted / 100000).toFixed(1)} Lakh`
        }
      }
      if (Math.abs(converted) >= 1000000) {
        return `${currencyDetails.symbol}${(converted / 1000000).toFixed(1)}M`
      }
      if (Math.abs(converted) >= 1000) {
        return `${currencyDetails.symbol}${(converted / 1000).toFixed(0)}k`
      }
    }

    try {
      return new Intl.NumberFormat(currencyDetails.locale, {
        style: 'currency',
        currency: currencyDetails.code,
        maximumFractionDigits,
      }).format(converted)
    } catch {
      return `${currencyDetails.symbol}${Math.round(converted).toLocaleString()}`
    }
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyDetails,
        setCurrency,
        convertFromUSD,
        convertToUSD,
        formatCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    const fallback = SUPPORTED_CURRENCIES.USD
    return {
      currency: 'USD' as CurrencyCode,
      currencyDetails: fallback,
      setCurrency: () => {},
      convertFromUSD: (amt: number) => amt,
      convertToUSD: (amt: number) => amt,
      formatCurrency: (amt: number) => `$${Math.round(amt).toLocaleString()}`,
    }
  }
  return context
}
