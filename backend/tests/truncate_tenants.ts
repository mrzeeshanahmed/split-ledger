import { query } from '../src/db/index.js';
async function main() {
    try {
        await query('TRUNCATE TABLE public.tenants CASCADE');
        console.log('Truncated tenants');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
main();
