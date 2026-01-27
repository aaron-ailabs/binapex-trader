
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key (start):', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'NULL');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateUser() {
    const email = `test_service_${Date.now()}@example.com`;
    console.log(`Attempting to create user: ${email}`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: 'TestPassword123!',
        email_confirm: true
    });

    if (error) {
        console.log('❌ Error:', error.message);
        console.log('Full Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Success! User Created:', data.user.id);

        // Cleanup
        const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id);
        if (deleteError) console.log('Cleanup failed:', deleteError.message);
        else console.log('Cleanup successful.');
    }
}

testCreateUser();
