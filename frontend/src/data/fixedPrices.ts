
export const fixedPrices: {
  [countryCode: string]: {
    hardcover: { price: string; shipping: string };
    paperback: { price: string; shipping: string };
  };
} = {
  US: {
    paperback: { price: "$39.99", shipping: "$7.99" },
    hardcover: { price: "$54.99", shipping: "$7.99" },
  },
  GB: {
    paperback: { price: "£29.99", shipping: "£4.99" },
    hardcover: { price: "£39.99", shipping: "£4.99" },
  },
  CA: {
    paperback: { price: "$59.99 CAD", shipping: "$9.99 CAD" },
    hardcover: { price: "$79.99 CAD", shipping: "$9.99 CAD" },
  },
  DE: {
    paperback: { price: "€34.99", shipping: "€6.99" },
    hardcover: { price: "€44.99", shipping: "€6.99" },
  },
  IN: {
    paperback: { price: "₹1,450", shipping: "Free Pan India" },
    hardcover: { price: "₹1,950", shipping: "Free Pan India" },
  },
};

export const currencyBaseCountryMapping: { [currencyCode: string]: string } = {
  USD: "US",   
  GBP: "GB",  
  CAD: "CA",   
  EUR: "DE",  
  INR: "IN", 
    
  AUD: "US",    
  NZD: "US",    
  JPY: "US",    
  KRW: "US",    
  CNY: "US",    
  SGD: "US",    
  MYR: "US",    
  THB: "US",    
  IDR: "US",    
  VND: "US",    
  PHP: "US",    
  AED: "US",    
  SAR: "US",    
  KWD: "US",    
  QAR: "US",    
  BHD: "US", 
  OMR: "US",   
  RUB: "US",    
  TRY: "US",    
  ILS: "US",    
  EGP: "US",   
  ZAR: "US",    
  KES: "US",   
  NGN: "US",    
  BRL: "US",    
  MXN: "US",  
  ARS: "US",    
  CLP: "US",    
  COP: "US",   
  PEN: "US",  
  UYU: "US", 

  CHF: "DE",    
  SEK: "DE",   
  NOK: "DE",    
  DKK: "DE",    
  CZK: "DE",   
  PLN: "DE",    
  HUF: "DE",    
  RON: "DE",
  BGN: "DE",      
};

export const countryCurrencyMap: { [countryCode: string]: string } = {
  US: "USD",
  IN: "INR",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  PT: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  FI: "EUR",
  IE: "EUR",
  GR: "EUR",
  LU: "EUR",
  CY: "EUR",
  MT: "EUR",
  SK: "EUR",
  SI: "EUR",
  LV: "EUR",
  LT: "EUR",
  EE: "EUR",
  CZ: "CZK",
  PL: "PLN",
  HU: "HUF",
  RO: "RON",
  BG: "BGN",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  JP: "JPY",
  KR: "KRW",
  CN: "CNY",
  SG: "SGD",
  MY: "MYR",
  TH: "THB",
  ID: "IDR",
  VN: "VND",
  PH: "PHP",
  AE: "AED",
  SA: "SAR",
  KW: "KWD",
  QA: "QAR",
  BH: "BHD",
  OM: "OMR",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  RU: "RUB",
  TR: "TRY",
  IL: "ILS",
  EG: "EGP",
  ZA: "ZAR",
  KE: "KES",
  NG: "NGN",
  BR: "BRL",
  MX: "MXN",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  PE: "PEN",
  UY: "UYU",
};

const DEFAULT_COUNTRY = "IN";

export const getFixedPriceByCountry = (
  countryCode: string,
  bookStyle: "hardcover" | "paperback"
): { price: string; shipping: string } => {
  const currency = countryCurrencyMap[countryCode] || "INR";
  const baseCountry = currencyBaseCountryMapping[currency] || DEFAULT_COUNTRY;

  const pricesForCountry = fixedPrices[baseCountry] || fixedPrices[DEFAULT_COUNTRY];

  return pricesForCountry[bookStyle];
};