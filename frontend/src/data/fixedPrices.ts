export const fixedPrices: {
  [countryCode: string]: {
    hardcover: { price: string; shipping: string; taxes: string };
    paperback: { price: string; shipping: string; taxes: string };
  };
} = {
  US: {
    paperback: { price: "$39.99", shipping: "$7.99", taxes: "0" },
    hardcover: { price: "$54.99", shipping: "$7.99", taxes: "0" },
  },
  UK: {
    paperback: { price: "£29.99", shipping: "£4.99", taxes: "0" },
    hardcover: { price: "£39.99", shipping: "£4.99", taxes: "0" },
  },
  CA: {
    paperback: { price: "$59.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
    hardcover: { price: "$79.99 CAD", shipping: "$9.99 CAD", taxes: "0" },
  },
  IN: {
    paperback: { price: "₹1,450", shipping: "0", taxes: "0" },
    hardcover: { price: "₹1,950", shipping: "0", taxes: "0" },
  },
  AU: {
    paperback: { price: "$49.99 AUD", shipping: "$8.99 AUD", taxes: "0" },
    hardcover: { price: "$69.99 AUD", shipping: "$8.99 AUD", taxes: "0" },
  },
  NZ: {
    paperback: { price: "$59.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
    hardcover: { price: "$79.99 NZD", shipping: "$9.99 NZD", taxes: "0" },
  }
};

const ALLOWED_COUNTRIES = ["US", "UK", "CA", "IN", "AU", "NZ"];
const DEFAULT_COUNTRY = "IN";

export const getFixedPriceByCountry = (
  countryCode: string,
  bookStyle: "hardcover" | "paperback"
): { price: string; shipping: string; taxes: string } => {
  const country = ALLOWED_COUNTRIES.includes(countryCode) ? countryCode : DEFAULT_COUNTRY;
  return fixedPrices[country][bookStyle];
};