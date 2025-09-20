import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportController } from '../controllers/reportController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();
const reportController = new ReportController(prisma);

// Apply authentication middleware to all report routes
router.use(authMiddleware);

/**
 * @route   POST /api/reports/generate
 * @desc    Generate a new manufacturing report with PDF
 * @access  Protected
 * @body    { reportType: "daily" | "weekly" | "monthly" | "quarterly" | "yearly", userId: number }
 * @returns { success: boolean, data?: { reportId: number, reportType: string, pdfBase64: string, generatedAt: string }, error?: string }
 */
router.post('/generate', async (req, res) => {
  await reportController.generateReport(req, res);
});

/**
 * @route   GET /api/reports/types
 * @desc    Get available report types and their descriptions
 * @access  Protected
 * @returns { success: boolean, data: Array<{ type: string, description: string }> }
 */
router.get('/types', async (req, res) => {
  await reportController.getReportTypes(req, res);
});

/**
 * @route   GET /api/reports/history/:userId
 * @desc    Get report history for a specific user
 * @access  Protected
 * @param   userId - User ID to get report history for
 * @returns { success: boolean, data: Array<{ id: number, reportType: string, generatedAt: string }> }
 */
router.get('/history/:userId', async (req, res) => {
  await reportController.getReportHistory(req, res);
});

/**
 * @route   GET /api/reports/:reportId
 * @desc    Get a specific report by ID
 * @access  Protected
 * @param   reportId - Report ID to retrieve
 * @returns { success: boolean, data?: Report, error?: string }
 */
router.get('/:reportId', async (req, res) => {
  await reportController.getReport(req, res);
});

/**
 * @route   POST /api/reports/:reportId/regenerate-pdf
 * @desc    Regenerate PDF for an existing report
 * @access  Protected
 * @param   reportId - Report ID to regenerate PDF for
 * @returns { success: boolean, data?: { reportId: number, reportType: string, pdfBase64: string, generatedAt: string }, error?: string }
 */
router.post('/:reportId/regenerate-pdf', async (req, res) => {
  await reportController.regeneratePDF(req, res);
});

/**
 * @route   POST /api/reports/generate-direct-pdf
 * @desc    Generate report and return PDF directly (not Base64)
 * @access  Protected
 * @body    { reportType: "daily" | "weekly" | "monthly" | "quarterly" | "yearly", userId: number }
 * @returns PDF file directly
 */
router.post('/generate-direct-pdf', async (req, res) => {
  await reportController.generateDirectPDF(req, res);
});

/**
 * @route   GET /api/reports/:reportId/download-pdf
 * @desc    Download PDF for existing report directly
 * @access  Protected
 * @param   reportId - Report ID to download PDF for
 * @returns PDF file directly
 */
router.get('/:reportId/download-pdf', async (req, res) => {
  await reportController.downloadPDF(req, res);
});

/**
 * @route   DELETE /api/reports/:reportId
 * @desc    Delete a specific report
 * @access  Protected
 * @param   reportId - Report ID to delete
 * @returns { success: boolean, message?: string, error?: string }
 */
router.delete('/:reportId', async (req, res) => {
  await reportController.deleteReport(req, res);
});

export default router;