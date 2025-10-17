import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Fake AI Chat API
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId, model = 'gpt-3.5-turbo', stream = false } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Simulate processing delay
    const delay = Math.floor(Math.random() * 1000) + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Generate fake AI response
    const aiResponse = generateAIResponse(message, model);

    return NextResponse.json({
      id: `msg_${Date.now()}`,
      conversationId: conversationId || `conv_${Date.now()}`,
      model,
      message: aiResponse,
      timestamp: new Date().toISOString(),
      usage: {
        promptTokens: message.length / 4,
        completionTokens: aiResponse.length / 4,
        totalTokens: (message.length + aiResponse.length) / 4
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET conversation history (mock)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ 
        conversations: [
          {
            id: 'conv_1',
            title: 'Sample Conversation 1',
            lastMessage: 'Hello! How can I help you today?',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 'conv_2',
            title: 'Sample Conversation 2',
            lastMessage: 'Sure, I can help with that!',
            timestamp: new Date(Date.now() - 172800000).toISOString()
          }
        ]
      });
    }

    // Return mock conversation history
    return NextResponse.json({
      conversationId,
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          content: 'Hello!',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'msg_2',
          role: 'assistant',
          content: 'Hello! How can I help you today?',
          timestamp: new Date(Date.now() - 3599000).toISOString()
        }
      ]
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateAIResponse(userMessage: string, model: string): string {
  const lowerMessage = userMessage.toLowerCase();

  // Pattern-based responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm a simulated AI assistant. How can I help you today?";
  }

  if (lowerMessage.includes('how are you')) {
    return "I'm doing great, thank you for asking! I'm here to help you with any questions you might have.";
  }

  if (lowerMessage.includes('help')) {
    return "I'm here to help! You can ask me questions about various topics, request information, or just have a conversation. What would you like to know?";
  }

  if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
    return "I can help with programming! While I'm a simulated AI, I can provide guidance on various programming concepts. What specific coding question do you have?";
  }

  if (lowerMessage.includes('weather')) {
    return "I'm a simulated AI assistant and don't have access to real-time weather data. However, in a real implementation, I could integrate with weather APIs to provide you with current conditions.";
  }

  if (lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) {
    return "You're welcome! Feel free to ask if you have any other questions.";
  }

  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
    return "Goodbye! Have a great day! Feel free to come back if you need anything else.";
  }

  // Default responses
  const defaultResponses = [
    "That's an interesting question! As a simulated AI, I can provide general responses. In a production environment, this would be powered by a real language model.",
    "I understand you're asking about that topic. This is a mock AI response designed to simulate chatbot behavior for development purposes.",
    "Great question! This fake AI chat API is designed to help developers test and build chat interfaces without needing real AI integration initially.",
    `You said: "${userMessage}". As a demonstration AI, I can acknowledge your input and provide contextual responses based on pattern matching.`,
    "I'm processing your request. Remember, this is a simulated AI response that helps developers create and test chat interfaces before integrating with real AI services."
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}
