export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json({
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ? 'SET' : 'MISSING',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'SET' : 'MISSING',
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET ? 'SET' : 'MISSING',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
  });
}
