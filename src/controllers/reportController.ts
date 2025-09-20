import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportService, ReportRequest, ReportType } from '../services/reportService';
import { PDFService } from '../services/pdfService';

export interface ReportGenerationRequest {
  reportType: ReportType;
  userId: number;
  filters?: {
    start?: string;
    end?: string;
    productId?: number;
    moId?: number;
  };
}

export interface ReportResponse {
  success: boolean;
  data?: {
    reportId: number;
    reportType: ReportType;
    pdfBase64: string;
    generatedAt: string;
  };
  error?: string;
  message?: string;
}

export class ReportController {
  private reportService: ReportService;
  private pdfService: PDFService;

  constructor(private prisma: PrismaClient) {
    this.reportService = new ReportService(prisma);
    this.pdfService = new PDFService();
  }

  /**
   * Generate a manufacturing report with PDF output
   * POST /api/reports/generate
   * Body: { reportType: "daily" | "weekly" | "monthly" | "quarterly" | "yearly", userId: number }
   */
  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { reportType, userId, filters } = req.body as ReportGenerationRequest;
      
      if (!reportType || !userId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: reportType and userId are required',
        } as ReportResponse);
        return;
      }

      // Validate report type
      const validReportTypes: ReportType[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
      if (!validReportTypes.includes(reportType)) {
        res.status(400).json({
          success: false,
          error: `Invalid report type. Must be one of: ${validReportTypes.join(', ')}`,
        } as ReportResponse);
        return;
      }

      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        } as ReportResponse);
        return;
      }

      // Generate report data
      console.log(`Generating ${reportType} report for user ${userId}...`);
      const reportRequest: ReportRequest = { reportType, userId };
      const reportData = await this.reportService.generateReport(reportRequest);

      // Prepare dataset for BI PDF
  const dataset = await this.buildDataset(reportData.period.start, reportData.period.end, filters);

      // Save report to database
      const reportId = await this.reportService.saveReport(reportData, userId);

      // Generate PDF
      console.log(`Generating PDF for report ${reportId}...`);
      const pdfOptions: any = { company: { name: 'NMIT' }, dataset };
      if (filters) pdfOptions.filters = filters;
      if (user) pdfOptions.user = { id: user.id, name: user.name, email: (user as any).email };
      const pdfBuffer = await this.pdfService.generatePDF(reportData, pdfOptions);
      const pdfBase64 = this.pdfService.convertToPDFBase64(pdfBuffer);

      // Send response
      const response: ReportResponse = {
        success: true,
        data: {
          reportId,
          reportType,
          pdfBase64,
          generatedAt: reportData.generatedAt,
        },
        message: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully`,
      };

      res.status(200).json(response);
      console.log(`Report ${reportId} generated successfully for user ${userId}`);

    } catch (error) {
      console.error('Error generating report:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate report',
        message: errorMessage,
      } as ReportResponse);
    }
  }

  /**
   * Get report history for a user
   * GET /api/reports/history/:userId
   */
  async getReportHistory(req: Request, res: Response): Promise<void> {
    try {
      const userIdParam = req.params.userId;
      if (!userIdParam) {
        res.status(400).json({
          success: false,
          error: 'User ID parameter is required',
        });
        return;
      }
      
      const userId = parseInt(userIdParam);
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
        });
        return;
      }

      const reports = await this.prisma.report.findMany({
        where: { userId },
        orderBy: { generatedAt: 'desc' },
        take: 50, // Limit to last 50 reports
        select: {
          id: true,
          reportType: true,
          generatedAt: true,
          data: false, // Don't include large data field in list
        },
      });

      res.status(200).json({
        success: true,
        data: reports,
        message: `Found ${reports.length} reports for user ${userId}`,
      });

    } catch (error) {
      console.error('Error fetching report history:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch report history',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * Get a specific report by ID
   * GET /api/reports/:reportId
   */
  async getReport(req: Request, res: Response): Promise<void> {
    try {
      const reportIdParam = req.params.reportId;
      if (!reportIdParam) {
        res.status(400).json({
          success: false,
          error: 'Report ID parameter is required',
        });
        return;
      }
      
      const reportId = parseInt(reportIdParam);
      
      if (isNaN(reportId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid report ID',
        });
        return;
      }

      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        res.status(404).json({
          success: false,
          error: 'Report not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: report,
        message: 'Report retrieved successfully',
      });

    } catch (error) {
      console.error('Error fetching report:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch report',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * Regenerate PDF for an existing report
   * POST /api/reports/:reportId/regenerate-pdf
   */
  async regeneratePDF(req: Request, res: Response): Promise<void> {
    try {
      const reportIdParam = req.params.reportId;
      if (!reportIdParam) {
        res.status(400).json({
          success: false,
          error: 'Report ID parameter is required',
        });
        return;
      }
      
      const reportId = parseInt(reportIdParam);
      
      if (isNaN(reportId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid report ID',
        });
        return;
      }

      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        res.status(404).json({
          success: false,
          error: 'Report not found',
        });
        return;
      }

      // Generate PDF from stored report data + fresh dataset (current DB state)
      const reportData = report.data as any;
      const user = await this.prisma.user.findUnique({ where: { id: report.userId } });
      const dataset = await this.buildDataset(reportData.period.start, reportData.period.end);
      const pdfOptions: any = { company: { name: 'NMIT' }, dataset };
      if (user) pdfOptions.user = { id: user.id, name: user.name, email: (user as any).email };
      const pdfBuffer = await this.pdfService.generatePDF(reportData, pdfOptions);
      const pdfBase64 = this.pdfService.convertToPDFBase64(pdfBuffer);

      res.status(200).json({
        success: true,
        data: {
          reportId,
          reportType: report.reportType,
          pdfBase64,
          generatedAt: report.generatedAt.toISOString(),
        },
        message: 'PDF regenerated successfully',
      } as ReportResponse);

    } catch (error) {
      console.error('Error regenerating PDF:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to regenerate PDF',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * Delete a report
   * DELETE /api/reports/:reportId
   */
  async deleteReport(req: Request, res: Response): Promise<void> {
    try {
      const reportIdParam = req.params.reportId;
      if (!reportIdParam) {
        res.status(400).json({
          success: false,
          error: 'Report ID parameter is required',
        });
        return;
      }
      
      const reportId = parseInt(reportIdParam);
      
      if (isNaN(reportId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid report ID',
        });
        return;
      }

      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        res.status(404).json({
          success: false,
          error: 'Report not found',
        });
        return;
      }

      await this.prisma.report.delete({
        where: { id: reportId },
      });

      res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
      });

    } catch (error) {
      console.error('Error deleting report:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete report',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * Generate report and return PDF directly (not Base64)
   * POST /api/reports/generate-direct-pdf
   */
  async generateDirectPDF(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
  const { reportType, userId, filters } = req.body as ReportGenerationRequest;
      
      if (!reportType || !userId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: reportType and userId are required',
        });
        return;
      }

      // Validate report type
      const validReportTypes: ReportType[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
      if (!validReportTypes.includes(reportType)) {
        res.status(400).json({
          success: false,
          error: `Invalid report type. Must be one of: ${validReportTypes.join(', ')}`,
        });
        return;
      }

      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Generate report data
      console.log(`Generating ${reportType} report for user ${userId}...`);
      const reportRequest: ReportRequest = { reportType, userId };
      const reportData = await this.reportService.generateReport(reportRequest);

      // Save report to database
      const reportId = await this.reportService.saveReport(reportData, userId);

      // Generate PDF
      console.log(`Generating PDF for report ${reportId}...`);
      const dataset = await this.buildDataset(reportData.period.start, reportData.period.end, filters);
      const pdfOptions: any = { company: { name: 'NMIT' }, dataset };
      if (filters) pdfOptions.filters = filters;
      pdfOptions.user = { id: user.id, name: user.name, email: (user as any).email };
      const pdfBuffer = await this.pdfService.generatePDF(reportData, pdfOptions);

      // Set headers for PDF download
      const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      // Send PDF buffer directly
      res.status(200).send(pdfBuffer);
      console.log(`Report ${reportId} generated and sent as direct PDF for user ${userId}`);

    } catch (error) {
      console.error('Error generating direct PDF:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate direct PDF',
        message: errorMessage,
      });
    }
  }

  /**
   * Download PDF for existing report directly
   * GET /api/reports/:reportId/download-pdf
   */
  async downloadPDF(req: Request, res: Response): Promise<void> {
    try {
      const reportIdParam = req.params.reportId;
      if (!reportIdParam) {
        res.status(400).json({
          success: false,
          error: 'Report ID parameter is required',
        });
        return;
      }
      
      const reportId = parseInt(reportIdParam);
      
      if (isNaN(reportId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid report ID',
        });
        return;
      }

      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        res.status(404).json({
          success: false,
          error: 'Report not found',
        });
        return;
      }

      // Generate PDF from stored report data
      const reportData = report.data as any;
      const pdfBuffer = await this.pdfService.generatePDF(reportData);

      // Set headers for PDF download
      const filename = `${report.reportType}-report-${reportId}-${new Date(report.generatedAt).toISOString().split('T')[0]}.pdf`;
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      // Send PDF buffer directly
      res.status(200).send(pdfBuffer);
      console.log(`PDF downloaded directly for report ${reportId}`);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to download PDF',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  /**
   * Get available report types
   * GET /api/reports/types
   */
  async getReportTypes(req: Request, res: Response): Promise<void> {
    try {
      const reportTypes: { type: ReportType; description: string }[] = [
        { type: 'daily', description: 'Daily operations report with new MOs, WO activity, stock movements, and exceptions' },
        { type: 'weekly', description: 'Weekly performance report with MO status, WO completion rates, and work center utilization' },
        { type: 'monthly', description: 'Monthly analysis with lead times, productivity metrics, and cost analysis' },
        { type: 'quarterly', description: 'Quarterly review with trends, capacity analysis, and BOM variances' },
        { type: 'yearly', description: 'Annual summary with total output, efficiency metrics, and strategic KPIs' },
      ];

      res.status(200).json({
        success: true,
        data: reportTypes,
        message: 'Report types retrieved successfully',
      });

    } catch (error) {
      console.error('Error fetching report types:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch report types',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
  private async buildDataset(startISO: string, endISO: string, filters?: { start?: string; end?: string; productId?: number; moId?: number }): Promise<any> {
    const start = new Date(filters?.start || startISO);
    const end = new Date(filters?.end || endISO);

    const orders = await this.prisma.manufacturingOrder.findMany({
      where: {
        AND: [
          { createdAt: { gte: start, lte: end } },
          filters?.productId ? { productId: filters.productId } : {},
          filters?.moId ? { id: filters.moId } : {},
        ],
      },
      include: {
        product: true,
        assignedTo: { select: { id: true, name: true } },
        workOrders: {
          include: {
            workCenter: true,
            assignedTo: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const workCenters = await this.prisma.workCenter.findMany({
      include: {
        workOrders: {
          where: {
            OR: [
              { createdAt: { gte: start, lte: end } },
              { startedAt: { gte: start, lte: end } },
              { completedAt: { gte: start, lte: end } },
            ],
          },
        },
      },
    });

    const ledger = await this.prisma.productLedger.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const stocksRaw = await this.prisma.productStock.findMany({ include: { product: true } });
    const stocks = stocksRaw.map((s: any) => ({ product: s.product, quantity: s.quantity }));

    const productIds = Array.from(new Set(orders.map((o: any) => o.productId).filter(Boolean))) as number[];
    const bomArgs: any = { include: { product: true, component: true } };
    if (productIds.length) bomArgs.where = { productId: { in: productIds } };
    const bomEntries = await this.prisma.billOfMaterial.findMany(bomArgs);
    const bomMap = new Map<number, { product: any; components: any[] }>();
    for (const b of bomEntries as any[]) {
      const entry = bomMap.get(b.productId) || { product: b.product, components: [] as any[] };
      entry.components.push({ component: b.component, quantity: b.quantity, operation: b.operation, opDurationMins: b.opDurationMins });
      bomMap.set(b.productId, entry);
    }

    const bom = Array.from(bomMap.values());
    return { orders, workCenters, ledger, stocks, bom };
  }
}