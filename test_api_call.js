// Test script to verify the handle_sword_sale function fix via API
// Run this after executing the SQL fix: node test_api_call.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://unwflhwuahiwiaafauej.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud2ZsaHd1YWhpd2lhYWZhdWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyOTM5NTEsImV4cCI6MjA2Nzg2OTk1MX0.u00lHApJt79Y2qR-DszqS9zpqpms01CCvZ3LYgFJZVc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHandleSwordSale() {
    console.log('Testing handle_sword_sale function...');
    
    try {
        // Test the function call that was failing
        const { data, error } = await supabase.rpc('handle_sword_sale', {
            p_user_id: '12345678-1234-1234-1234-123456789012',
            p_sell_price: 10000,
            p_current_level: 5
        });
        
        if (error) {
            console.error('❌ Function call failed:', error);
            return;
        }
        
        console.log('✅ Function call successful!');
        console.log('Result:', data);
        
        // Verify the data structure
        if (data && typeof data === 'object' && 'new_money' in data && 'new_level' in data) {
            console.log('✅ Return data structure is correct');
            console.log(`   - New money: ${data.new_money}`);
            console.log(`   - New level: ${data.new_level}`);
        } else {
            console.log('⚠️  Return data structure might be incorrect:', data);
        }
        
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

async function checkFunctionExists() {
    console.log('Checking if function exists...');
    
    try {
        // Try to call the function with dummy parameters to see if it exists
        const { error } = await supabase.rpc('handle_sword_sale', {
            p_user_id: '00000000-0000-0000-0000-000000000000',
            p_sell_price: 1,
            p_current_level: 1
        });
        
        if (error) {
            if (error.message.includes('Could not find the function')) {
                console.log('❌ Function still does not exist or has wrong signature');
                console.log('   Error:', error.message);
            } else {
                console.log('✅ Function exists (got different error as expected)');
                console.log('   Error:', error.message);
            }
        } else {
            console.log('✅ Function exists and callable');
        }
        
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

async function main() {
    console.log('=== Testing handle_sword_sale Function Fix ===\n');
    
    await checkFunctionExists();
    console.log('');
    await testHandleSwordSale();
    
    console.log('\n=== Test Complete ===');
}

main();