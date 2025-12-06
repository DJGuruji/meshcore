import { NextRequest } from 'next/server';
import Razorpay from 'razorpay';
import connectDB from '@/lib/db';
import { User, Payment } from '@/lib/models';

export async function POST(request: NextRequest) {
  // Initialize Razorpay instance
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
  });
  try {
    const { amount, currency = 'INR', receipt, notes } = await request.json();
    
    // Validate required fields
    if (!amount) {
      return Response.json({
        success: false,
        message: 'Amount is required'
      }, { status: 400 });
    }
    
    // Validate required notes fields
    if (!notes || !notes.userId || !notes.planId) {
      return Response.json({
        success: false,
        message: 'User ID and plan ID are required'
      }, { status: 400 });
    }

    // Create order options
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
      notes: notes || {}
    };

    // Create order with Razorpay
    const order = await razorpay.orders.create(options);
    
    // Connect to database
    await connectDB();
    
    // Get user's current account type
    const userDoc = await User.findById(notes.userId);
    if (!userDoc) {
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
    
    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Determine if this is an upgrade or downgrade
    const userAccountType = userDoc.accountType as string;
    const planId = notes.planId as string;
    const currentUserLevel = accountHierarchy[userAccountType] || 0;
    const newPlanLevel = accountHierarchy[planId] || 0;
    
    // Save payment record to database
    const paymentData: any = {
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: 'created',
      user: notes.userId,
      plan: notes.planId,
      expiresAt: expiresAt,
      nextPlan: null
    };
    
    // If this is a downgrade, queue it to happen after current plan expires
    if (newPlanLevel < currentUserLevel) {
      paymentData.nextPlan = notes.planId;
    }
    
    const paymentRecord = new Payment(paymentData);
    
    await paymentRecord.save();
    
    return Response.json({
      success: true,
      order
    });
  } catch (error: any) {
    console.error('Error creating payment order:', error);
    return Response.json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    }, { status: 500 });
  }
}