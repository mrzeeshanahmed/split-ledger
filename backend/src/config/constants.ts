export const SALT_ROUNDS = 12;

// 30 days in seconds to ensure revoked tokens outlive their potential expiry
export const REFRESH_TOKEN_BLACKLIST_TTL_SECONDS = 30 * 24 * 60 * 60;
