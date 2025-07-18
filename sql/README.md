# Database Function Fix: handle_sword_sale

## Problem
The API call in `/pages/api/sell.ts` was failing with the error:
```
Could not find the function public.handle_sword_sale(p_current_level, p_sell_price, p_user_id) in the schema cache
```

## Root Cause
Parameter mismatch between the API call and the database function:

### API Call (lines 66-70 in sell.ts):
```typescript
const { error: sellError } = await supabase.rpc('handle_sword_sale', {
  p_user_id: userId,
  p_sell_price: sellPrice,
  p_current_level: sword.level
});
```

### Original Function Signature (in setup_database.sql):
```sql
CREATE OR REPLACE FUNCTION handle_sword_sale(
    p_user_id UUID,
    p_sword_level INTEGER,  -- ❌ API sends p_current_level
    p_sell_price INTEGER
) RETURNS JSON AS $$
```

## Solution
Updated the function signature to match the API call parameters:

```sql
CREATE OR REPLACE FUNCTION handle_sword_sale(
    p_user_id UUID,
    p_sell_price INTEGER,
    p_current_level INTEGER  -- ✅ Now matches API call
) RETURNS JSON AS $$
```

## Files Created
1. `fix_handle_sword_sale_function.sql` - Simple fix
2. `complete_fix_solution.sql` - Complete solution with verification
3. `test_function_fix.sql` - Database test script
4. `check_database_functions.sql` - Function inspection queries
5. `test_api_call.js` - Node.js API test script

## Execution Steps

### Step 1: Execute the Fix
Run the main fix script in your Supabase SQL editor:
```sql
-- Copy and paste the contents of complete_fix_solution.sql
```

### Step 2: Verify the Fix
Run the test script:
```sql
-- Copy and paste the contents of test_function_fix.sql
```

### Step 3: Test API Integration
Run the Node.js test:
```bash
npm install @supabase/supabase-js
node test_api_call.js
```

## Expected Results
After the fix:
- ✅ Function exists with correct signature: `handle_sword_sale(p_user_id uuid, p_sell_price integer, p_current_level integer)`
- ✅ API calls succeed without "Could not find the function" error
- ✅ Function returns JSON with `new_money` and `new_level` fields
- ✅ Sword level is reset to 0
- ✅ User money is increased by sell price
- ✅ Rankings are updated with max sword level and total gold

## Function Behavior
The corrected function:
1. Takes user ID, sell price, and current sword level as parameters
2. Resets the sword level to 0
3. Adds the sell price to the user's money
4. Updates rankings with the maximum sword level achieved and new total gold
5. Returns a JSON object with the new money amount and new level (0)

## Verification Queries
To check if the function exists and has the correct signature:
```sql
SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments,
    pg_catalog.pg_get_function_result(p.oid) as return_type
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname = 'handle_sword_sale';
```

Expected result:
```
function_name    | arguments                                              | return_type
handle_sword_sale| p_user_id uuid, p_sell_price integer, p_current_level integer | json
```