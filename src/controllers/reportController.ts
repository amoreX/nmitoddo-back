import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export class ReportController {
  constructor(private prisma: PrismaClient) {}

  async generateReport(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'This endpoint is deprecated. Please use the new report generation API.'
    });
  }

  async getReportHistory(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'This endpoint is deprecated. Please use the new report generation API.'
    });
  }

  async getReport(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'This endpoint is deprecated. Please use the new report generation API.'
    });
  }

  async regeneratePDF(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'This endpoint is deprecated. Please use the new report generation API.'
    });
  }

  async deleteReport(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'This endpoint is deprecated. Please use the new report generation API.'
    });
  }

  async generateDirectPDF(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'This endpoint is deprecated. Please use the new report generation API.'
    });
  }

  async downloadPDF(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'This endpoint is deprecated. Please use the new report generation API.'
    });
  }

  async getReportTypes(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'This endpoint is deprecated. Please use the new report generation API.'
    });
  }
}
