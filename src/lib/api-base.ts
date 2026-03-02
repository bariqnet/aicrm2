const HARD_CODED_EXTERNAL_API_BASE_URL = "https://t8xizhkeq6.execute-api.us-east-1.amazonaws.com/dev";

export function getExternalApiBaseUrl(): string {
  return HARD_CODED_EXTERNAL_API_BASE_URL.replace(/\/+$/, "");
}
