import { NextResponse } from 'next/server';

// ✅ TEST ENDPOINT - Visit http://localhost:3000/api/flutterwave-transfer in browser
export async function GET(request) {
    try {
        const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

        console.log('\n🧪 TESTING FLUTTERWAVE API KEY');
        console.log('='.repeat(50));

        // Check 1: Does key exist?
        if (!FLUTTERWAVE_SECRET_KEY) {
            return NextResponse.json({
                success: false,
                error: '❌ FLUTTERWAVE_SECRET_KEY not found in .env.local',
                solution: 'Add FLUTTERWAVE_SECRET_KEY=FLWSECK-your-key-here to .env.local file in project root'
            }, { status: 500 });
        }

        console.log(`🔑 Key found: ${FLUTTERWAVE_SECRET_KEY.substring(0, 15)}...`);

        // Check 2: Is it the correct key format?
        // ✅ FIXED: Accept both FLWSECK- and FLWSECK_TEST- formats
        const isValidSecretKey = FLUTTERWAVE_SECRET_KEY.startsWith('FLWSECK-') ||
            FLUTTERWAVE_SECRET_KEY.startsWith('FLWSECK_TEST-') ||
            FLUTTERWAVE_SECRET_KEY.startsWith('FLWSECK_');

        if (!isValidSecretKey) {
            return NextResponse.json({
                success: false,
                error: '⚠️ WRONG KEY TYPE - You are using PUBLIC key instead of SECRET key',
                yourKeyStartsWith: FLUTTERWAVE_SECRET_KEY.substring(0, 10),
                shouldStartWith: 'FLWSECK- or FLWSECK_TEST-',
                currentlyUsing: FLUTTERWAVE_SECRET_KEY.startsWith('FLWPUBK') ? 'PUBLIC KEY (FLWPUBK-)' : 'Unknown key type',
                solution: [
                    '1. Go to https://dashboard.flutterwave.com/settings/apis',
                    '2. Find the SECRET KEY section (NOT Public Key)',
                    '3. Click "SHOW" to reveal the secret key',
                    '4. Copy the SECRET KEY (starts with FLWSECK- or FLWSECK_TEST-)',
                    '5. Update .env.local: FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...',
                    '6. Restart dev server: Stop (Ctrl+C) then npm run dev'
                ]
            }, { status: 500 });
        }

        console.log('✅ Key format looks correct (starts with FLWSECK- or FLWSECK_TEST-)');

        // Check 3: Test the key by calling Flutterwave API
        console.log('📡 Testing key with Flutterwave API...');

        const response = await fetch('https://api.flutterwave.com/v3/banks/NG', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`📡 Response status: ${response.status}`);

        const responseText = await response.text();
        console.log(`📥 Response preview: ${responseText.substring(0, 100)}...`);

        // Check if we got HTML error
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            console.error('❌ Received HTML instead of JSON');
            return NextResponse.json({
                success: false,
                error: '❌ API KEY IS INVALID',
                issue: 'Flutterwave returned HTML error page instead of JSON',
                keyUsed: FLUTTERWAVE_SECRET_KEY.substring(0, 15) + '...',
                httpStatus: response.status,
                solution: [
                    '⚠️ YOUR API KEY IS WRONG OR EXPIRED',
                    '',
                    'Fix steps:',
                    '1. Open https://dashboard.flutterwave.com/settings/apis',
                    '2. Make sure you are in TEST MODE (toggle at top)',
                    '3. Find "Secret Key" section',
                    '4. Copy the key that starts with: FLWSECK_TEST-',
                    '5. Open your .env.local file',
                    '6. Replace with: FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your-actual-key',
                    '7. Save file',
                    '8. Stop server (Ctrl+C)',
                    '9. Start server (npm run dev)',
                    '10. Test again'
                ],
                htmlPreview: responseText.substring(0, 200)
            }, { status: 500 });
        }

        // Try to parse JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            return NextResponse.json({
                success: false,
                error: 'Could not parse response as JSON',
                parseError: parseError.message,
                responsePreview: responseText.substring(0, 500)
            }, { status: 500 });
        }

        if (result.status === 'success') {
            console.log('✅✅✅ API KEY IS VALID! ✅✅✅');
            return NextResponse.json({
                success: true,
                message: '🎉 SUCCESS! Your Flutterwave API key is working perfectly!',
                keyPrefix: FLUTTERWAVE_SECRET_KEY.substring(0, 15) + '...',
                testResult: 'Successfully connected to Flutterwave API',
                banksFound: result.data?.length || 0,
                apiResponse: result.message,
                nextSteps: [
                    '✅ Your API key is valid',
                    '✅ You can now process transfers',
                    '💡 Make sure your Flutterwave wallet is funded',
                    '💡 Check withdrawal requests have bank codes'
                ]
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'API call failed',
                flutterwaveMessage: result.message,
                flutterwaveResponse: result
            }, { status: 400 });
        }

    } catch (error) {
        console.error('❌ Test error:', error);
        return NextResponse.json({
            success: false,
            error: 'Unexpected error during test',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

// ✅ YOUR EXISTING POST ENDPOINT
export async function POST(request) {
    try {
        const { withdrawal } = await request.json();

        const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

        console.log('\n🔄 PROCESSING WITHDRAWAL');
        console.log('='.repeat(50));

        // Validation 1: API Key
        if (!FLUTTERWAVE_SECRET_KEY) {
            console.error('❌ FLUTTERWAVE_SECRET_KEY not found');
            return NextResponse.json({
                success: false,
                error: 'Flutterwave API key not configured. Check your .env.local file.'
            }, { status: 500 });
        }

        // Log key info (first 10 chars only for security)
        console.log(`🔑 API Key: ${FLUTTERWAVE_SECRET_KEY.substring(0, 10)}...`);

        // ✅ FIXED: Accept both FLWSECK- and FLWSECK_TEST- formats
        const isValidSecretKey = FLUTTERWAVE_SECRET_KEY.startsWith('FLWSECK-') ||
            FLUTTERWAVE_SECRET_KEY.startsWith('FLWSECK_TEST-') ||
            FLUTTERWAVE_SECRET_KEY.startsWith('FLWSECK_');

        if (!isValidSecretKey) {
            console.error('⚠️  WARNING: API key format not recognized');
            console.error('⚠️  You might be using the PUBLIC key instead');
        } else {
            console.log('✅ API key format validated');
        }

        // Validation 2: Bank Details
        if (!withdrawal.bankDetails?.bankCode || !withdrawal.bankDetails?.accountNumber) {
            console.error('❌ Missing bank details');
            return NextResponse.json({
                success: false,
                error: 'Invalid bank details. Bank code and account number required.'
            }, { status: 400 });
        }

        console.log('📋 Transfer Details:');
        console.log(`   Reference: ${withdrawal.reference}`);
        console.log(`   Amount: ₦${withdrawal.amount}`);
        console.log(`   Bank: ${withdrawal.bankDetails.bankName} (${withdrawal.bankDetails.bankCode})`);
        console.log(`   Account: ${withdrawal.bankDetails.accountNumber}`);
        console.log(`   Account Name: ${withdrawal.bankDetails.accountName}`);

        // Prepare transfer data
        const transferData = {
            account_bank: withdrawal.bankDetails.bankCode,
            account_number: withdrawal.bankDetails.accountNumber,
            amount: withdrawal.amount,
            narration: `LAN Library Withdrawal - ${withdrawal.reference}`,
            currency: "NGN",
            reference: withdrawal.reference,
            callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/transfer-callback`,
            debit_currency: "NGN"
        };

        console.log('\n📤 Sending to Flutterwave:');
        console.log(JSON.stringify(transferData, null, 2));

        // Call Flutterwave API
        const response = await fetch('https://api.flutterwave.com/v3/transfers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transferData)
        });

        console.log(`\n📡 Response Status: ${response.status}`);
        console.log(`📡 Response Headers:`, Object.fromEntries(response.headers.entries()));

        // Get raw response
        const responseText = await response.text();
        console.log(`\n📥 Raw Response (first 300 chars):`);
        console.log(responseText.substring(0, 300));

        // Check if HTML (error)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            console.error('\n❌ CRITICAL ERROR: Received HTML instead of JSON');
            console.error('This means one of these issues:');
            console.error('  1. ❌ Invalid API key (most common)');
            console.error('  2. ❌ Using PUBLIC key instead of SECRET key');
            console.error('  3. ❌ IP address not whitelisted in Flutterwave dashboard');
            console.error('  4. ❌ Wrong API endpoint');

            console.error('\n💡 SOLUTION:');
            console.error('  1. Go to: https://dashboard.flutterwave.com/settings/apis');
            console.error('  2. Copy the SECRET KEY (starts with FLWSECK- or FLWSECK_TEST-)');
            console.error('  3. NOT the Public Key (FLWPUBK-)');
            console.error('  4. Update your .env.local file');
            console.error('  5. Restart your dev server');

            return NextResponse.json({
                success: false,
                error: 'Invalid API configuration. Received HTML instead of JSON response.',
                details: {
                    issue: 'Wrong API key or configuration',
                    keyCheck: isValidSecretKey ? 'Key format looks correct' : '⚠️ Key should start with FLWSECK- or FLWSECK_TEST-',
                    solution: 'Check your Flutterwave secret key in .env.local'
                }
            }, { status: 500 });
        }

        // Parse JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError.message);
            console.error('Response was:', responseText.substring(0, 500));
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON response from Flutterwave',
                rawResponse: responseText.substring(0, 500)
            }, { status: 500 });
        }

        console.log('\n📊 Parsed Response:');
        console.log(JSON.stringify(result, null, 2));

        // Check response status
        if (result.status === 'success') {
            console.log('✅ Transfer successful!');
            return NextResponse.json({
                success: true,
                transferId: result.data.id,
                reference: result.data.reference,
                status: result.data.status,
                message: result.message
            });
        } else {
            console.error('❌ Transfer failed:', result.message);

            let errorMessage = result.message || 'Transfer failed';
            let helpText = '';

            // Provide specific help for common errors
            if (result.message?.toLowerCase().includes('insufficient')) {
                helpText = '\n\n💡 Solution: Fund your Flutterwave wallet at dashboard.flutterwave.com/transfers';
            } else if (result.message?.toLowerCase().includes('bank code')) {
                helpText = '\n\n💡 Solution: Verify bank code is correct. Current: ' + withdrawal.bankDetails.bankCode;
            } else if (result.message?.toLowerCase().includes('account')) {
                helpText = '\n\n💡 Solution: Verify account number and bank match';
            }

            return NextResponse.json({
                success: false,
                error: errorMessage + helpText,
                details: result.data || {},
                flutterwaveResponse: result
            }, { status: 400 });
        }

    } catch (error) {
        console.error('\n💥 UNEXPECTED ERROR:', error);
        console.error('Stack:', error.stack);

        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error',
            type: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}