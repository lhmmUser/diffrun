import { Cards, CardProps } from "./data";

const ALLOWED_COUNTRIES = ["US", "UK", "CA", "IN", "AU", "NZ"];
const DEFAULT_COUNTRY = "IN";

export const getFixedPriceByCountry = (
  book: CardProps,
  countryCode: string,
  bookStyle: "hardcover" | "paperback"
): { price: string; shipping: string; taxes: string } => {
  const country = ALLOWED_COUNTRIES.includes(countryCode) ? countryCode : DEFAULT_COUNTRY;

  return (
    book?.prices?.[country]?.[bookStyle] || {
      price: "",
      shipping: "",
      taxes: "",
    }
  );
};