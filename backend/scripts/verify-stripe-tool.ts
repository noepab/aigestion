
// import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

import { User } from '../src/models/User';
import { stripeService } from '../src/services/stripe.service';
import { StripeTool } from '../src/tools/stripe.tool';

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function verifyStripeTool() {
    console.log('--- Verifying StripeTool ---');

    // 1. Mock Mongoose & Services (Simple override for verify script)
    // We can't easily spin up Mongo here without docker, so we'll mock the internal calls of the tool
    // or use a real connection if available. For safety and speed, we will Mock the 'User.findById' and 'stripeService'.

    // Monkey-patching for verification script purposes (Run in isolation)
    const mockUser = {
        _id: 'mock-user-123',
        name: 'Test Agent User',
        email: 'test@example.com',
        stripeCustomerId: 'cus_TEST123',
        subscriptionStatus: 'active',
        subscriptionPlan: 'pro_monthly',
        save: async () => { }
    };

    User.findById = jest.fn().mockResolvedValue(mockUser);
    stripeService.createSubscriptionCheckoutSession = jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' });
    stripeService.createPortalSession = jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test' });

    console.log('🔹 Mocked Database and Stripe Service.');

    const tool = new StripeTool();

    // Test 1: Get Status
    console.log('\nTesting [get_status]...');
    const status = await tool.execute({ action: 'get_status', userId: 'mock-user-123' });
    console.log('✅ Status Result:', status);

    if (status.status !== 'active') {throw new Error('Status verification failed');}

    // Test 2: Create Checkout
    console.log('\nTesting [create_checkout]...');
    const checkout = await tool.execute({
        action: 'create_checkout',
        userId: 'mock-user-123',
        priceId: 'price_TEST_PRO'
    });
    console.log('✅ Checkout Result:', checkout);

    if (!checkout.url) {throw new Error('Checkout URL verification failed');}

    // Test 3: Create Portal
    console.log('\nTesting [create_portal]...');
    const portal = await tool.execute({ action: 'create_portal', userId: 'mock-user-123' });
    console.log('✅ Portal Result:', portal);

    if (!portal.url) {throw new Error('Portal URL verification failed');}

    console.log('\n🎉 All StripeTool verifications passed!');
}

// Minimal Jest Mock Setup
const jest = {
    fn: () => {
        const mock: any = (...args: any[]) => mock.mockImplementation ? mock.mockImplementation(...args) : undefined;
        mock.mockResolvedValue = (val: any) => {
            mock.mockImplementation = () => Promise.resolve(val);
            return mock;
        };
        return mock;
    }
};

verifyStripeTool().catch(err => {
    console.error('❌ Verification Failed:', err);
    process.exit(1);
});
