import { Request, Response } from 'express';
import { PrismaClient, Role, OrderStatus, WorkStatus, MovementType } from '@prisma/client';
import moment from 'moment';
import { authMiddleware } from '../middleware/authMiddleware';
import { HtmlPdfService } from '../services/htmlPdfService';

const prisma = new PrismaClient();
const htmlPdfService = new HtmlPdfService();

// Extend Request interface to include user role
declare global {
  namespace Express {
    interface Request {
      userRole?: Role;
    }
  }
}

// Report types
type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface ReportParams {
  dateFrom?: string;
  dateTo?: string;
}

interface ReportRequestBody {
  reportType: ReportType;
  params?: ReportParams;
}

export interface ReportData {
  period: {
    start: Date;
    end: Date;
    type: ReportType;
  };
  generatedAt: Date;
  summary: {
    totalMOs: number;
    totalWOs: number;
    totalProducts: number;
    totalUsers: number;
  };
  kpis: {
    manufacturingOrderSummary: {
      total: number;
      draft: number;
      confirmed: number;
      in_progress: number;
      to_close: number;
      done: number;
      cancelled: number;
    };
    workOrderSummary: {
      total: number;
      to_do: number;
      started: number;
      paused: number;
      completed: number;
    };
    averageLeadTimes: {
      averageLeadTimeDays: number;
    };
    workOrderCompletionRate: number;
    productivity: {
      ordersPerDay: number;
      completionRate: number;
    };
    inventory: {
      totalMovements: number;
      inMovements: number;
      outMovements: number;
      lowStockItems: number;
    };
    costs: {
      totalWorkCenterCosts: number;
      averageCostPerOrder: number;
    };
  };
  trends: {
    daily: Array<{ date: string; orders: number; completed: number }>;
    monthly: Array<{ month: string; orders: number; completed: number }>;
  };
  topProducts: Array<{
    id: number;
    name: string;
    ordersCount: number;
    totalQuantity: number;
  }>;
  delayedOrders: Array<{
    id: number;
    productName: string;
    quantity: number;
    deadline: Date;
    daysPastDue: number;
  }>;
  stockSummary: Array<{
    id: number;
    productName: string;
    currentStock: number;
    isLowStock: boolean;
  }>;
  workCenterUtilization: Array<{
    id: number;
    name: string;
    totalHours: number;
    utilizationPercent: number;
    costPerHour: number;
    totalCost: number;
  }>;
}

/**
 * Authentication and authorization middleware for reports
 */
const reportAuthMiddleware = async (req: Request, res: Response, next: any) => {
  try {
    // First apply the standard auth middleware
    await new Promise<void>((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get user with role from database
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, role: true, name: true, email: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has admin or manager role
    if (user.role !== Role.admin && user.role !== Role.manager) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin and manager roles can generate reports.'
      });
    }

    // Attach user role to request
    req.userRole = user.role;
    next();
  } catch (error) {
    console.error('Report auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization'
    });
  }
};

/**
 * Calculate date range based on report type and optional params
 */
function calculateDateRange(reportType: ReportType, params?: ReportParams): { start: Date; end: Date } {
  const now = moment();
  let start: moment.Moment;
  let end: moment.Moment = now;

  // Use custom date range if provided
  if (params?.dateFrom && params?.dateTo) {
    return {
      start: moment(params.dateFrom).startOf('day').toDate(),
      end: moment(params.dateTo).endOf('day').toDate()
    };
  }

  // Calculate range based on report type
  switch (reportType) {
    case 'daily':
      start = params?.dateFrom ? moment(params.dateFrom) : now.clone().startOf('day');
      end = params?.dateTo ? moment(params.dateTo) : now.clone().endOf('day');
      break;
    case 'weekly':
      start = now.clone().startOf('week');
      end = now.clone().endOf('week');
      break;
    case 'monthly':
      start = now.clone().startOf('month');
      end = now.clone().endOf('month');
      break;
    case 'quarterly':
      start = now.clone().startOf('quarter');
      end = now.clone().endOf('quarter');
      break;
    case 'yearly':
      start = now.clone().startOf('year');
      end = now.clone().endOf('year');
      break;
    default:
      throw new Error(`Invalid report type: ${reportType}`);
  }

  return {
    start: start.toDate(),
    end: end.toDate()
  };
}

/**
 * Collect all report data from database
 */
async function collectReportData(reportType: ReportType, params: ReportParams | undefined, userId: number): Promise<ReportData> {
  const { start, end } = calculateDateRange(reportType, params);

  // Get all manufacturing orders in date range
  const manufacturingOrders = await prisma.manufacturingOrder.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    },
    include: {
      product: true,
      assignedTo: {
        select: { id: true, name: true }
      },
      workOrders: {
        include: {
          workCenter: true,
          assignedTo: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  // Get all work orders in date range
  const workOrders = await prisma.workOrder.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    },
    include: {
      workCenter: true,
      mo: {
        include: {
          product: true
        }
      }
    }
  });

  // Get work centers with utilization data
  const workCenters = await prisma.workCenter.findMany({
    include: {
      workOrders: {
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      }
    }
  });

  // Get product ledger movements
  const ledgerEntries = await prisma.productLedger.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    },
    include: {
      product: true
    }
  });

  // Get current stock levels
  const stockLevels = await prisma.productStock.findMany({
    include: {
      product: true
    }
  });

  // Get products and user counts
  const [totalProducts, totalUsers] = await Promise.all([
    prisma.product.count(),
    prisma.user.count()
  ]);

  // Calculate KPIs
  const moStatusCounts = manufacturingOrders.reduce((acc, mo) => {
    acc[mo.status] = (acc[mo.status] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {} as any);

  const woStatusCounts = workOrders.reduce((acc, wo) => {
    acc[wo.status] = (acc[wo.status] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {} as any);

  // Calculate average lead times
  const completedOrders = manufacturingOrders.filter(mo => 
    mo.status === OrderStatus.done && mo.scheduleStartDate && mo.updatedAt
  );
  const averageLeadTimeDays = completedOrders.length > 0 
    ? completedOrders.reduce((sum, mo) => {
        const leadTime = moment(mo.updatedAt).diff(moment(mo.scheduleStartDate), 'days');
        return sum + leadTime;
      }, 0) / completedOrders.length 
    : 0;

  // Calculate work order completion rate
  const completedWOs = workOrders.filter(wo => wo.status === WorkStatus.completed).length;
  const workOrderCompletionRate = workOrders.length > 0 ? (completedWOs / workOrders.length) * 100 : 0;

  // Calculate productivity metrics
  const daysInPeriod = moment(end).diff(moment(start), 'days') + 1;
  const ordersPerDay = manufacturingOrders.length / daysInPeriod;
  const completionRate = manufacturingOrders.length > 0 
    ? (manufacturingOrders.filter(mo => mo.status === OrderStatus.done).length / manufacturingOrders.length) * 100 
    : 0;

  // Calculate inventory metrics
  const inMovements = ledgerEntries.filter(l => l.movementType === MovementType.in).length;
  const outMovements = ledgerEntries.filter(l => l.movementType === MovementType.out).length;
  const lowStockItems = stockLevels.filter(s => s.quantity < 10).length; // threshold of 10

  // Calculate work center costs and utilization
  const workCenterUtilization = workCenters.map(wc => {
    const totalMinutes = wc.workOrders.reduce((sum, wo) => sum + (wo.durationDoneMins || 0), 0);
    const totalHours = totalMinutes / 60;
    const utilizationPercent = wc.capacityPerHour && totalHours > 0 
      ? Math.min(100, (totalHours / (wc.capacityPerHour * 24 * daysInPeriod)) * 100) 
      : 0;
    const totalCost = (wc.costPerHour || 0) * totalHours;

    return {
      id: wc.id,
      name: wc.name,
      totalHours,
      utilizationPercent,
      costPerHour: wc.costPerHour || 0,
      totalCost
    };
  });

  const totalWorkCenterCosts = workCenterUtilization.reduce((sum, wc) => sum + wc.totalCost, 0);
  const averageCostPerOrder = manufacturingOrders.length > 0 ? totalWorkCenterCosts / manufacturingOrders.length : 0;

  // Generate trends data
  const dailyTrends = [];
  const monthlyTrends = [];
  
  // Daily trends for the period
  for (let d = moment(start); d.isSameOrBefore(end); d.add(1, 'day')) {
    const dayStart = d.clone().startOf('day');
    const dayEnd = d.clone().endOf('day');
    const dayOrders = manufacturingOrders.filter(mo => 
      moment(mo.createdAt).isBetween(dayStart, dayEnd, null, '[]')
    );
    const dayCompleted = dayOrders.filter(mo => mo.status === OrderStatus.done);
    
    dailyTrends.push({
      date: d.format('YYYY-MM-DD'),
      orders: dayOrders.length,
      completed: dayCompleted.length
    });
  }

  // Monthly trends (last 6 months)
  for (let m = moment(start).startOf('month'); m.isSameOrBefore(end); m.add(1, 'month')) {
    const monthStart = m.clone().startOf('month');
    const monthEnd = m.clone().endOf('month');
    const monthOrders = manufacturingOrders.filter(mo => 
      moment(mo.createdAt).isBetween(monthStart, monthEnd, null, '[]')
    );
    const monthCompleted = monthOrders.filter(mo => mo.status === OrderStatus.done);
    
    monthlyTrends.push({
      month: m.format('YYYY-MM'),
      orders: monthOrders.length,
      completed: monthCompleted.length
    });
  }

  // Top products by order count
  const productOrderCounts = manufacturingOrders.reduce((acc, mo) => {
    if (!mo.product) return acc;
    const existing = acc.find(p => p.id === mo.product!.id);
    if (existing) {
      existing.ordersCount++;
      existing.totalQuantity += mo.quantity || 0;
    } else {
      acc.push({
        id: mo.product.id,
        name: mo.product.name,
        ordersCount: 1,
        totalQuantity: mo.quantity || 0
      });
    }
    return acc;
  }, [] as any[]);

  const topProducts = productOrderCounts
    .sort((a, b) => b.ordersCount - a.ordersCount)
    .slice(0, 10);

  // Delayed orders
  const now = new Date();
  const delayedOrders = manufacturingOrders
    .filter(mo => mo.deadline && new Date(mo.deadline) < now && mo.status !== OrderStatus.done)
    .map(mo => ({
      id: mo.id,
      productName: mo.product?.name || 'Unknown',
      quantity: mo.quantity || 0,
      deadline: mo.deadline!,
      daysPastDue: moment(now).diff(moment(mo.deadline), 'days')
    }))
    .sort((a, b) => b.daysPastDue - a.daysPastDue);

  // Stock summary
  const stockSummary = stockLevels.map(stock => ({
    id: stock.productId,
    productName: stock.product.name,
    currentStock: stock.quantity,
    isLowStock: stock.quantity < 10
  }));

  return {
    period: {
      start,
      end,
      type: reportType
    },
    generatedAt: new Date(),
    summary: {
      totalMOs: manufacturingOrders.length,
      totalWOs: workOrders.length,
      totalProducts,
      totalUsers
    },
    kpis: {
      manufacturingOrderSummary: {
        total: moStatusCounts.total || 0,
        draft: moStatusCounts.draft || 0,
        confirmed: moStatusCounts.confirmed || 0,
        in_progress: moStatusCounts.in_progress || 0,
        to_close: moStatusCounts.to_close || 0,
        done: moStatusCounts.done || 0,
        cancelled: moStatusCounts.cancelled || 0
      },
      workOrderSummary: {
        total: woStatusCounts.total || 0,
        to_do: woStatusCounts.to_do || 0,
        started: woStatusCounts.started || 0,
        paused: woStatusCounts.paused || 0,
        completed: woStatusCounts.completed || 0
      },
      averageLeadTimes: {
        averageLeadTimeDays
      },
      workOrderCompletionRate,
      productivity: {
        ordersPerDay,
        completionRate
      },
      inventory: {
        totalMovements: ledgerEntries.length,
        inMovements,
        outMovements,
        lowStockItems
      },
      costs: {
        totalWorkCenterCosts,
        averageCostPerOrder
      }
    },
    trends: {
      daily: dailyTrends,
      monthly: monthlyTrends
    },
    topProducts,
    delayedOrders,
    stockSummary,
    workCenterUtilization
  };
}

/**
 * Save report to database
 */
async function saveReport(reportType: ReportType, userId: number, reportData: ReportData, pdfBuffer: Buffer) {
  return await prisma.report.create({
    data: {
      reportType,
      data: {
        aggregated: reportData as any,
        pdfBase64: pdfBuffer.toString('base64')
      },
      userId
    }
  });
}

/**
 * Generate PDF report endpoint
 */
export const generateReport = async (req: Request, res: Response) => {
  try {
    const { reportType, params }: ReportRequestBody = req.body;

    // Validate report type
    const validReportTypes: ReportType[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid report type. Must be one of: ${validReportTypes.join(', ')}`
      });
    }

    console.log(`Generating ${reportType} report for user ${req.userId}`);

    // Collect report data
    const reportData = await collectReportData(reportType, params, req.userId!);

    // Get user info for PDF generation
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, name: true, email: true }
    });

    // Prepare dataset for PDF service
    const dataset = {
      orders: [],
      workCenters: [],
      ledger: [],
      stocks: reportData.stockSummary.map(s => ({
        product: { id: s.id, name: s.productName } as any,
        quantity: s.currentStock
      })),
      bom: []
    };

    // Generate PDF using HTML PDF service
    const pdfBuffer = await htmlPdfService.generatePDF(reportData, {
      ...(user && { user: { id: user.id, name: user.name, email: user.email } }),
      company: { name: 'Manufacturing Company' }
    });

    // Save report to database
    await saveReport(reportType, req.userId!, reportData, pdfBuffer);

    // Send PDF as download
    const filename = `report_${reportType}_${moment().format('YYYYMMDD_HHmmss')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Apply authentication middleware to the generate report function
export const generateReportWithAuth = [reportAuthMiddleware, generateReport];