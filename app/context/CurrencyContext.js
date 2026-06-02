// app/context/CurrencyContext.js
"use client";
import { createContext, useContext, useState, useEffect } from "react";

const CURRENCY_DISPLAY = {
  NGN: { symbol: "₦", flag: "🇳🇬", name: "Nigerian Naira" },
  GHS: { symbol: "GH₵", flag: "🇬🇭", name: "Ghanaian Cedi" },
  KES: { symbol: "KSh", flag: "🇰🇪", name: "Kenyan Shilling" },
  UGX: { symbol: "USh", flag: "🇺🇬", name: "Ugandan Shilling" },
  TZS: { symbol: "TSh", flag: "🇹🇿", name: "Tanzanian Shilling" },
  ZAR: { symbol: "R", flag: "🇿🇦", name: "South African Rand" },
  XOF: { symbol: "CFA", flag: "🌍", name: "West African CFA" },
  XAF: { symbol: "CFA", flag: "🌍", name: "Central African CFA" },
  EGP: { symbol: "E£", flag: "🇪🇬", name: "Egyptian Pound" },
  MAD: { symbol: "DH", flag: "🇲🇦", name: "Moroccan Dirham" },
  ETB: { symbol: "Br", flag: "🇪🇹", name: "Ethiopian Birr" },
  ZMW: { symbol: "ZK", flag: "🇿🇲", name: "Zambian Kwacha" },
  RWF: { symbol: "RF", flag: "🇷🇼", name: "Rwandan Franc" },
  MWK: { symbol: "MK", flag: "🇲🇼", name: "Malawian Kwacha" },
  BWP: { symbol: "P", flag: "🇧🇼", name: "Botswana Pula" },
  NAD: { symbol: "N$", flag: "🇳🇦", name: "Namibian Dollar" },
  CDF: { symbol: "FC", flag: "🇨🇩", name: "Congolese Franc" },
};

const NGN_RATES = {
  NGN: 1,
  GHS: 0.010,
  KES: 0.11,
  UGX: 2.85,
  TZS: 2.62,
  RWF: 1.38,
  ZMW: 0.028,
  MWK: 1.77,
  EGP: 0.051,
  MAD: 0.105,
  ZAR: 0.019,
  XOF: 0.656,
  XAF: 0.656,
  ETB: 0.057,
  BWP: 0.014,
  NAD: 0.019,
  CDF: 2.85,
};

export function convertFromNGN(ngnAmt, toCurrency) {
  return ngnAmt * (NGN_RATES[toCurrency] ?? 1);
}

export function displayCurrency(ngnAmt, currency) {
  const info = CURRENCY_DISPLAY[currency] || CURRENCY_DISPLAY.NGN;
  if (currency === "NGN") return `₦${Math.round(ngnAmt).toLocaleString()}`;
  const converted = convertFromNGN(ngnAmt, currency);
  return `${info.symbol}${Math.round(converted).toLocaleString()}`;
}

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState("NGN");

  useEffect(() => {
    const saved = localStorage.getItem("lan_display_currency");
    if (saved && CURRENCY_DISPLAY[saved]) setCurrency(saved);
  }, []);

  const handleCurrencyChange = (code) => {
    if (!CURRENCY_DISPLAY[code]) return;
    setCurrency(code);
    localStorage.setItem("lan_display_currency", code);
  };

  const currInfo = CURRENCY_DISPLAY[currency] || CURRENCY_DISPLAY.NGN;

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currInfo,
        isNGN: currency === "NGN",
        setCurrency: handleCurrencyChange,
        fmt: (ngnAmt) => displayCurrency(ngnAmt, currency),
        CURRENCY_DISPLAY,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) return {
    currency: "NGN",
    currInfo: { symbol: "₦", flag: "🇳🇬", name: "Nigerian Naira" },
    isNGN: true,
    setCurrency: () => { },
    fmt: (n) => `₦${Math.round(n).toLocaleString()}`,
    CURRENCY_DISPLAY: {},
  };
  return ctx;
}