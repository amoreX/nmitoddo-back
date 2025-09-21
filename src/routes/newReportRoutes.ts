import { Router } from 'express';
import { generateReportWithAuth } from '../controllers/newReportController';

const router = Router();

/**
 * @route POST /api/reports/generate
 * @desc Generate a comprehensive manufacturing report with PDF output
 * @access Private (Admin/Manager only)
 * @body {
 *   reportType: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
 *   params?: {
 *     dateFrom?: string,  // ISO date string
 *     dateTo?: string     // ISO date string
 *   }
 * }
 * @response PDF file download
 */
router.post('/generate', generateReportWithAuth);

export default router;