import { NextRequest } from 'next/server';
import Razorpay from 'razorpay';
import connectDB from '@/lib/db';
import { Payment } from '@/lib/models';

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
    
    // Save payment record to database
    const paymentRecord = new Payment({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: 'created',
      user: notes.userId,
      plan: notes.planId
    });
    
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