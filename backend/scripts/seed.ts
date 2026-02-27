/**
 * Seed Script
 * Creates a platform admin, demo tenant, and sample data for local development
 *
 * Usage: npx tsx scripts/seed.ts
 */
import bcrypt from 'bcrypt';
import { connectWithRetry, query, closePool } from '../src/db/index.js';
import { TenantProvisioningService } from '../src/services/tenantProvisioning.js';
import logger from '../src/utils/logger.js';

const SALT_ROUNDS = 12;

async function seed() {
    console.log('🌱 Starting seed...\n');

    await connectWithRetry();

    // 1. Create platform admin
    console.log('👤 Creating platform admin...');
    const adminPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
    try {
        await query(
            `INSERT INTO platform_admins (email, password_hash, name, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = $3`,
            ['admin@split-ledger.local', adminPassword, 'Platform Admin']
        );
        console.log('   ✅ admin@split-ledger.local / Admin123!');
    } catch (err: any) {
        console.log(`   ⚠️  ${err.message}`);
    }

    // 2. Provision a demo tenant
    console.log('\n🏢 Provisioning demo tenant...');
    try {
        const result = await TenantProvisioningService.provisionTenant({
            name: 'Demo Company',
            subdomain: 'demo',
            owner_email: 'owner@demo.local',
            owner_password: 'Demo123!',
            owner_first_name: 'Demo',
            owner_last_name: 'Owner',
        });

        console.log(`   ✅ Tenant: ${result.tenant.name} (${result.tenant.id})`);
        console.log(`   ✅ Owner: owner@demo.local / Demo123!`);
        console.log(`   ✅ Subdomain: demo`);
    } catch (err: any) {
        if (err.message?.includes('duplicate') || err.message?.includes('already exists')) {
            console.log('   ℹ️  Demo tenant already exists, skipping');
        } else {
            console.log(`   ⚠️  ${err.message}`);
        }
    }

    // 3. Seed platform settings
    console.log('\n⚙️  Seeding platform settings...');
    const settings = [
        ['platform_name', 'Split-Ledger (Local Dev)', 'Platform display name'],
        ['support_email', 'support@split-ledger.local', 'Support contact email'],
        ['platform_fee_percent', '15', 'Platform fee percentage'],
    ];

    for (const [key, value, description] of settings) {
        await query(
            `INSERT INTO platform_settings (key, value, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO NOTHING`,
            [key, value, description]
        );
    }
    console.log('   ✅ Default settings seeded');

    // 4. Create default subscription for demo tenant
    console.log('\n💳 Creating default subscription...');
    try {
        const { rows: tenants } = await query(
            `SELECT id FROM tenants WHERE subdomain = 'demo' LIMIT 1`
        );

        if (tenants.length > 0) {
            await query(
                `INSERT INTO subscriptions (tenant_id, plan, status)
         VALUES ($1, 'free', 'active')
         ON CONFLICT (tenant_id) DO NOTHING`,
                [tenants[0].id]
            );
            console.log('   ✅ Free subscription created for demo tenant');
        }
    } catch (err: any) {
        console.log(`   ⚠️  ${err.message}`);
    }

    console.log('\n🎉 Seed complete!\n');
    console.log('Quick start:');
    console.log('  Platform Admin: http://localhost:5173/admin/login');
    console.log('  Credentials:    admin@split-ledger.local / Admin123!');
    console.log('  Demo Tenant:    owner@demo.local / Demo123!');

    await closePool();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
