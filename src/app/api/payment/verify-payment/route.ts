import { NextRequest } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json({
        success: false,
        message: 'Missing required payment verification data'
      }, { status: 400 });
    }

    // Create expected signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    // Verify signature
    if (digest !== razorpay_signature) {
      return Response.json({
        success: false,
        message: 'Invalid payment signature'
      }, { status: 400 });
    }

    // TODO: Update user account type in database
    // This is where you would update the user's account type in your database
    // Example:
    // await updateUserAccountType(userId, planId);

    return Response.json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return Response.json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    }, { status: 500 });
  }
}