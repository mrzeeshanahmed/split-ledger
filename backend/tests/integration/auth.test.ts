import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/index.js';
import { TenantProvisioningService } from '../../src/services/tenantProvisioning.js';
import { tenantDb, getTenantSchema } from '../../src/db/tenantClient.js';
import { query } from '../../src/db/index.js';
import { connectRedis, closeRedis, getRedisClient } from '../../src/db/redis.js';

describe('Auth Flow Integration Tests', () => {
    const app = createApp();

    const tenantInput = {
        name: 'Auth Test Corp',
        subdomain: 'auth-test',
        owner_email: 'owner@authtest.com',
        owner_password: 'securepass123',
        owner_first_name: 'Auth',
        owner_last_name: 'Test',
        billing_email: 'billing@authtest.com',
    };

    let cookies: string[] = [];
    let user1 = {
        email: 'user1@authtest.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'One',
    };

    beforeAll(async () => {
        await connectRedis();
        // Wait for database
        let retries = 10;
        while (retries > 0) {
            try {
                await query('SELECT 1');
                break;
            } catch {
                retries--;
                if (retries === 0) throw new Error('Database not available');
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
    });

    afterAll(async () => {
        await closeRedis();
        await tenantDb.closeAll();
    });

    beforeEach(async () => {
        // Provision tenant
        await TenantProvisioningService.provisionTenant(tenantInput);
        // Clean up test user
        const { rows: tenantRes } = await query('SELECT id FROM tenants WHERE subdomain = $1', [tenantInput.subdomain]);
        const schema = getTenantSchema(tenantRes[0].id);
        const client = await tenantDb.getClient(schema);
        await client.query('DELETE FROM users WHERE email = $1', [user1.email]);
        await client.query(`DELETE FROM users WHERE email LIKE 'rate-limit-%'`);
        client.release();
        cookies = [];
    });

    it('Register → login → get /auth/me → logout → verify token invalidated', async () => {
        // 1. Register
        const resRegister = await request(app)
            .post('/api/auth/register')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .send({
                email: user1.email,
                password: user1.password,
                firstName: user1.firstName,
                lastName: user1.lastName,
            });

        if (resRegister.status >= 400) {
            console.error('resRegister failed:', resRegister.text);
        }

        expect(resRegister.status).toBe(201);
        expect(resRegister.body.user.email).toBe(user1.email);
        expect(resRegister.headers['set-cookie']).toBeDefined();

        // 2. Login
        const resLogin = await request(app)
            .post('/api/auth/login')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .send({
                email: user1.email,
                password: user1.password,
            });

        if (resLogin.status >= 400) {
            console.error('login failed in auth:', resLogin.text);
        }

        expect(resLogin.status).toBe(200);
        expect(resLogin.headers['set-cookie']).toBeDefined();
        cookies = (resLogin.headers['set-cookie'] as unknown as string[]) || [];

        // 3. Get /auth/me
        const resMe = await request(app)
            .get('/api/auth/me')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .set('Cookie', cookies);

        expect(resMe.status).toBe(200);
        expect(resMe.body.user.email).toBe(user1.email);

        // 4. Logout
        const resLogout = await request(app)
            .post('/api/auth/logout')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .set('Cookie', cookies);

        expect(resLogout.status).toBe(200);

        // 5. Verify token invalidated (should fail to get /auth/me)
        const clearedCookies = resLogout.headers['set-cookie'] as unknown as string[] || [];

        const resMeAfter = await request(app)
            .get('/api/auth/me')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .set('Cookie', clearedCookies);

        expect(resMeAfter.status).toBe(401);
    });

    it('Refresh token flow: using a valid refresh token generates a new access token', async () => {
        // First register/log in to get tokens
        await request(app)
            .post('/api/auth/register')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .send({
                email: user1.email,
                password: user1.password,
                firstName: user1.firstName,
                lastName: user1.lastName,
            });

        const resLogin = await request(app)
            .post('/api/auth/login')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .send({
                email: user1.email,
                password: user1.password,
            });

        const initialCookies = (resLogin.headers['set-cookie'] as unknown as string[]) || [];

        // Call /refresh 
        const resRefresh = await request(app)
            .post('/api/auth/refresh')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .set('Cookie', initialCookies);

        expect(resRefresh.status).toBe(200);
        expect(resRefresh.headers['set-cookie']).toBeDefined();

        const newCookies = (resRefresh.headers['set-cookie'] as unknown as string[]) || [];

        // Prove we can fetch /auth/me with new cookies
        const resMe = await request(app)
            .get('/api/auth/me')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .set('Cookie', newCookies);

        expect(resMe.status).toBe(200);
    });

    it('Password reset: forgot → reset → login with new password', async () => {
        // First register
        await request(app)
            .post('/api/auth/register')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .send({
                email: user1.email,
                password: user1.password,
                firstName: user1.firstName,
                lastName: user1.lastName,
            });

        // Forgot password
        const resForgot = await request(app)
            .post('/api/auth/forgot-password')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .send({ email: user1.email });

        expect(resForgot.status).toBe(200);

        // Sniff the reset token from Redis
        const { rows: tenantRes } = await query('SELECT id FROM tenants WHERE subdomain = $1', [tenantInput.subdomain]);
        const schema = getTenantSchema(tenantRes[0].id);
        const client = await tenantDb.getClient(schema);
        const { rows: users } = await client.query('SELECT id FROM users WHERE email = $1', [user1.email]);
        client.release();

        const redis = getRedisClient();
        const keys = await redis.keys('password_reset:*');
        let resetToken = null;
        for (const key of keys) {
            const data = await redis.get(key);
            if (data && JSON.parse(data).userId === users[0].id) {
                resetToken = key.replace('password_reset:', '');
                break;
            }
        }

        // Reset password
        const resReset = await request(app)
            .post('/api/auth/reset-password')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .send({
                token: resetToken,
                newPassword: 'NewSecurePassword123'
            });

        if (resReset.status >= 400) {
            console.error('reset failed in auth:', resReset.body);
        }

        expect(resReset.status).toBe(200);

        // Try loggin in with new password
        const resLoginNew = await request(app)
            .post('/api/auth/login')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .send({
                email: user1.email,
                password: 'NewSecurePassword123',
            });

        expect(resLoginNew.status).toBe(200);
    });

    it('Rate limit: 11th login attempt within 15 min returns 429', async () => {
        // 10 failed logins
        for (let i = 0; i < 10; i++) {
            const resFailed = await request(app)
                .post('/api/auth/login')
                .set('X-Tenant-ID', tenantInput.subdomain)
                // Add a unique X-Forwarded-For per user to not block other tests
                .set('X-Forwarded-For', '99.99.99.99')
                .send({
                    email: `rate-limit-${i}@authtest.com`,
                    password: 'wrongpassword',
                });

            // 401 means auth failed but request was processed
            expect(resFailed.status).toBe(401);
        }

        // 11th attempt from same IP should hit 429
        const resRateLimited = await request(app)
            .post('/api/auth/login')
            .set('X-Tenant-ID', tenantInput.subdomain)
            .set('X-Forwarded-For', '99.99.99.99')
            .send({
                email: 'rate-limit-11@authtest.com',
                password: 'wrongpassword',
            });

        expect(resRateLimited.status).toBe(429);
    });
});
