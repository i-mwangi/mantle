/**
 * Vercel Serverless Function Entry Point
 * Single entry point for all API routes - Now using Mantle Network
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMantleAPI } from './mantle-api-router.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Use Mantle API router for all requests
  return handleMantleAPI(req, res);
}
