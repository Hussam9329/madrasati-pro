import { checkDb, successResponse } from '@/services/api-response';

export async function GET() {
  const dbError = checkDb();
  if (dbError) return dbError;

  return successResponse(null, "Hello, world!");
}
