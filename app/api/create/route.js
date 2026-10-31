// app/api/create/route.js
import { createGmailAccount } from '@/lib/automation';

export async function POST(request) {
  try {
    const data = await request.json();

    // Basic validation
    if (!data.firstName || !data.lastName || !data.username || !data.password) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    console.log("Starting Gmail Creation Process...");
    
    // Call the automation function
    const result = await createGmailAccount(data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
