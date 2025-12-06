import { NextRequest } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import { User, Payment } from '@/lib/models';
import { sendPaymentConfirmation } from '@/lib/email';

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

    // Connect to database
    await connectDB();
    
    // Find the payment record by order ID
    const paymentRecord = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    
    if (!paymentRecord) {
      return Response.json({
        success: false,
        message: 'Payment record not found'
      }, { status: 404 });
    }
    
    // Update payment status
    paymentRecord.razorpayPaymentId = razorpay_payment_id;
    paymentRecord.razorpaySignature = razorpay_signature;
    paymentRecord.status = 'captured';
    paymentRecord.updatedAt = new Date();
    await paymentRecord.save();
    
    // Find and update user account type
    const user = await User.findById(paymentRecord.user);
    
    if (!user) {
      return Response.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Define account hierarchy for determining upgrades/downgrades
    const accountHierarchy: { [key: string]: number } = {
      'free': 0,
      'freemium': 1,
      'pro': 2,
      'ultra-pro': 3,
      'custom': 4
    };
    
    // Determine if this is an upgrade or downgrade
    const userAccountType = (user.accountType as string);
    const planType = (paymentRecord.plan as string);
    const currentUserLevel = accountHierarchy[userAccountType] || 0;
    const newPlanLevel = accountHierarchy[planType] || 0;
    
    // If this is an upgrade, apply immediately
    // If this is a downgrade, queue it for later (handled by expiration script)
    if (newPlanLevel >= currentUserLevel) {
      user.accountType = paymentRecord.plan;
      user.updatedAt = new Date();
      await user.save();
    }
    
    // Send payment confirmation email
    try {
      await sendPaymentConfirmation(
        user.email,
        user.name,
        paymentRecord.plan.charAt(0).toUpperCase() + paymentRecord.plan.slice(1),
        paymentRecord.amount,
        razorpay_payment_id,
        razorpay_order_id
      );
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
      // Don't fail the whole operation if email fails
    }

    return Response.json({
      success: true,
      message: 'Payment verified successfully and account upgraded'
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