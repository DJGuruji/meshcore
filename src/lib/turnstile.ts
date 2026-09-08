import axios from 'axios';

export async function validateTurnstileToken(token: string): Promise<boolean> {
  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 5000,
      }
    );
    
    return response.data.success;
  } catch (error) {
    return false;
  }
}