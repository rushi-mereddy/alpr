const DEFAULT_API_BASE_URL = "https://alprbe.stalresearch.com";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

