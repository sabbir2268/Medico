// Compatibility bridge for the centralized API client.
// New feature code should import from "@/lib/api" directly.
export { apiClient as api, ApiError, setAccessTokenGetter } from "@/lib/api";
