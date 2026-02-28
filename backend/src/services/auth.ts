import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomUUID, randomBytes } from 'crypto';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';
import {
  TokenPayload,
  RefreshTokenData,
  PasswordResetToken,
} from '../types/user.js';
import { getRedisClient, setWithExpiry, getJSON, deleteKey } from '../db/redis.js';
import { SALT_ROUNDS, REFRESH_TOKEN_BLACKLIST_TTL_SECONDS } from '../config/constants.js';

/**
 * Authentication Service
 * Handles JWT token generation/verification and password hashing
 */
export class AuthService {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET as string, {
      expiresIn: env.JWT_EXPIRES_IN as any,
      issuer: 'split-ledger-api',
      audience: payload.tenantId,
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: TokenPayload): { token: string; tokenId: string } {
    const tokenId = randomUUID();
    const refreshPayload: RefreshTokenData = {
      ...payload,
      tokenId,
    };

    const token = jwt.sign(refreshPayload, env.REFRESH_TOKEN_SECRET as string, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any,
      issuer: 'split-ledger-api',
      audience: payload.tenantId,
    });

    return { token, tokenId };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string, expectedTenantId: string): TokenPayload {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'split-ledger-api',
        audience: expectedTenantId,
      }) as TokenPayload;

      return payload;
    } catch (error) {
      logger.warn({
        message: 'Access token verification failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  static async verifyRefreshToken(
    token: string,
    expectedTenantId: string
  ): Promise<RefreshTokenData> {
    try {
      const payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET, {
        issuer: 'split-ledger-api',
        audience: expectedTenantId,
      }) as RefreshTokenData;

      // Check if token is blacklisted
      const isBlacklisted = await this.isRefreshTokenBlacklisted(payload.tokenId);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      return payload;
    } catch (error) {
      logger.warn({
        message: 'Refresh token verification failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Blacklist a refresh token
   */
  static async blacklistRefreshToken(tokenId: string): Promise<void> {
    const redis = getRedisClient();
    const key = `blacklist:refresh:${tokenId}`;
    await setWithExpiry(key, '1', REFRESH_TOKEN_BLACKLIST_TTL_SECONDS);
    logger.debug({
      message: 'Refresh token blacklisted',
      tokenId,
    });
  }

  /**
   * Check if refresh token is blacklisted
   */
  static async isRefreshTokenBlacklisted(tokenId: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = `blacklist:refresh:${tokenId}`;
    const result = await redis.exists(key);
    return result === 1;
  }

  /**
   * Generate password reset token
   */
  static async generatePasswordResetToken(
    userId: string,
    tenantId: string
  ): Promise<string> {
    const tokenId = randomUUID();
    const tokenData: PasswordResetToken = {
      userId,
      tenantId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    };

    const key = `password_reset:${tokenId}`;
    await setWithExpiry(key, JSON.stringify(tokenData), 60 * 60); // 1 hour

    return tokenId;
  }

  /**
   * Verify password reset token
   */
  static async verifyPasswordResetToken(
    tokenId: string,
    expectedTenantId: string
  ): Promise<PasswordResetToken> {
    const tokenData = await getJSON<PasswordResetToken>(`password_reset:${tokenId}`);

    if (!tokenData) {
      throw new Error('Invalid or expired password reset token');
    }

    if (tokenData.tenantId !== expectedTenantId) {
      throw new Error('Token tenant mismatch');
    }

    // Check if token has expired
    if (new Date() > new Date(tokenData.expiresAt)) {
      // Clean up expired token
      await deleteKey(`password_reset:${tokenId}`);
      throw new Error('Password reset token has expired');
    }

    return tokenData;
  }

  /**
   * Delete password reset token
   */
  static async deletePasswordResetToken(tokenId: string): Promise<void> {
    await deleteKey(`password_reset:${tokenId}`);
  }

  /**
   * Generate a random password for user invitations
   */
  static generateRandomPassword(length = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    const bytes = randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
    refreshTokenId: string;
  } {
    const accessToken = this.generateAccessToken(payload);
    const { token: refreshToken, tokenId } = this.generateRefreshToken(payload);

    return { accessToken, refreshToken, refreshTokenId: tokenId };
  }
}
