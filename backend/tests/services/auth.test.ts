import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../src/services/auth.js';
import { setWithExpiry, getJSON, deleteKey, getRedisClient } from '../../src/db/redis.js';

// Mock Redis functions
vi.mock('../../src/db/redis.js', () => ({
  getRedisClient: () => ({
    setEx: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    exists: vi.fn(),
    del: vi.fn(),
  }),
  setWithExpiry: vi.fn(),
  getJSON: vi.fn(),
  deleteKey: vi.fn(),
}));

describe('AuthService', () => {
  const mockPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '987e6543-e21b-43d3-a456-426614174000',
    email: 'test@example.com',
    role: 'member',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure environment variables are set
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = AuthService.generateAccessToken(mockPayload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload in token', () => {
      const token = AuthService.generateAccessToken(mockPayload);

      // Decode payload (without verification for testing)
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );

      expect(payload.userId).toBe(mockPayload.userId);
      expect(payload.tenantId).toBe(mockPayload.tenantId);
      expect(payload.email).toBe(mockPayload.email);
      expect(payload.role).toBe(mockPayload.role);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with tokenId', () => {
      const { token, tokenId } = AuthService.generateRefreshToken(mockPayload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(tokenId).toBeTruthy();
      expect(typeof tokenId).toBe('string');
      expect(tokenId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = AuthService.generateAccessToken(mockPayload);

      const payload = AuthService.verifyAccessToken(token, mockPayload.tenantId);

      expect(payload.userId).toBe(mockPayload.userId);
      expect(payload.tenantId).toBe(mockPayload.tenantId);
      expect(payload.email).toBe(mockPayload.email);
      expect(payload.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        AuthService.verifyAccessToken('invalid-token', mockPayload.tenantId);
      }).toThrow('Invalid or expired access token');
    });

    it('should throw error for token with wrong tenant', () => {
      const token = AuthService.generateAccessToken(mockPayload);

      expect(() => {
        AuthService.verifyAccessToken(
          token,
          'wrong-tenant-id'
        );
      }).toThrow('Invalid or expired access token');
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'test-password-123';
      const hash = await AuthService.hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'test-password-123';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should verify correct password', async () => {
      const password = 'test-password-123';
      const hash = await AuthService.hashPassword(password);

      const isValid = await AuthService.comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'test-password-123';
      const wrongPassword = 'wrong-password';
      const hash = await AuthService.hashPassword(password);

      const isValid = await AuthService.comparePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('blacklistRefreshToken', () => {
    it('should blacklist a refresh token', async () => {
      const tokenId = 'test-token-id';

      await AuthService.blacklistRefreshToken(tokenId);

      expect(setWithExpiry).toHaveBeenCalledWith(
        `blacklist:refresh:${tokenId}`,
        '1',
        7 * 24 * 60 * 60
      );
    });
  });

  describe('isRefreshTokenBlacklisted', () => {
    it('should check if token is blacklisted', async () => {
      const tokenId = 'test-token-id';
      vi.mocked(getRedisClient).mockReturnValue({
        exists: vi.fn().mockResolvedValue(1),
      } as any);

      const isBlacklisted = await AuthService.isRefreshTokenBlacklisted(tokenId);

      expect(isBlacklisted).toBe(true);
    });

    it('should return false if token is not blacklisted', async () => {
      const tokenId = 'test-token-id';
      vi.mocked(getRedisClient).mockReturnValue({
        exists: vi.fn().mockResolvedValue(0),
      } as any);

      const isBlacklisted = await AuthService.isRefreshTokenBlacklisted(tokenId);

      expect(isBlacklisted).toBe(false);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a password reset token', async () => {
      const userId = 'user-id';
      const tenantId = 'tenant-id';

      const token = await AuthService.generatePasswordResetToken(userId, tenantId);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = AuthService.generateTokens(mockPayload);

      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
      expect(tokens.refreshTokenId).toBeTruthy();
    });
  });
});
