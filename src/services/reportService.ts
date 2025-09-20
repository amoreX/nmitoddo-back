import { PrismaClient, OrderStatus, WorkStatus, MovementType } from '@prisma/client';
import moment from 'moment';

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ReportData {
  reportType: ReportType;
  period: {
    start: string;
    end: string;
  };
  kpis: any;
  summary: string;
  generatedAt: string;
}

export interface ReportRequest {
  reportType: ReportType;
  userId: number;
}

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  async generateReport(request: ReportRequest): Promise<ReportData> {
    const { reportType, userId } = request;
    const period = this.getReportPeriod(reportType);
    
    try {
      let kpis: any;
      
      switch (reportType) {
        case 'daily':
          kpis = await this.generateDailyKPIs(period);
          break;
        case 'weekly':
          kpis = await this.generateWeeklyKPIs(period);
          break;
        case 'monthly':
          kpis = await this.generateMonthlyKPIs(period);
          break;
        case 'quarterly':
          kpis = await this.generateQuarterlyKPIs(period);
          break;
        case 'yearly':
          kpis = await this.generateYearlyKPIs(period);
          break;
        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }

      const reportData: ReportData = {
        reportType,
        period: {
          start: period.start.toISOString(),
          end: period.end.toISOString(),
        },
        kpis,
        summary: this.generateSummary(reportType, kpis),
        generatedAt: new Date().toISOString(),
      };

      return reportData;
    } catch (error) {
      throw new Error(`Failed to generate ${reportType} report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getReportPeriod(reportType: ReportType): { start: Date; end: Date } {
    const now = moment();
    let start: moment.Moment;
    let end: moment.Moment;

    switch (reportType) {
      case 'daily':
        start = now.clone().startOf('day');
        end = now.clone().endOf('day');
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
      end: end.toDate(),
    };
  }

  private async generateDailyKPIs(period: { start: Date; end: Date }) {
    const [newMOs, workOrderActivity, stockMovements, workCenterDowntime, exceptions] = await Promise.all([
      this.getNewManufacturingOrders(period),
      this.getWorkOrderActivity(period),
      this.getStockMovements(period),
      this.getWorkCenterDowntime(period),
      this.getExceptions(period),
    ]);

    return {
      newManufacturingOrders: {
        count: newMOs.length,
        totalQuantity: newMOs.reduce((sum, mo) => sum + (mo.quantity || 0), 0),
        byStatus: this.groupByStatus(newMOs),
      },
      workOrderActivity: {
        total: workOrderActivity.length,
        completed: workOrderActivity.filter(wo => wo.status === WorkStatus.completed).length,
        inProgress: workOrderActivity.filter(wo => wo.status === WorkStatus.started).length,
        pending: workOrderActivity.filter(wo => wo.status === WorkStatus.to_do).length,
        averageCompletionTime: this.calculateAverageCompletionTime(workOrderActivity),
      },
      stockMovements: {
        totalMovements: stockMovements.length,
        stockIn: stockMovements.filter(sm => sm.movementType === MovementType.in).length,
        stockOut: stockMovements.filter(sm => sm.movementType === MovementType.out).length,
        netChange: this.calculateNetStockChange(stockMovements),
      },
      workCenterDowntime: {
        totalDowntimeMinutes: workCenterDowntime.reduce((sum, wc) => sum + wc.downtimeMins, 0),
        affectedWorkCenters: workCenterDowntime.filter(wc => wc.downtimeMins > 0).length,
      },
      exceptions: {
        count: exceptions.length,
        types: this.categorizeExceptions(exceptions),
      },
    };
  }

  private async generateWeeklyKPIs(period: { start: Date; end: Date }) {
    const [moStatusSummary, woCompletionRate, workCenterUtilization, topProducts, stockChanges] = await Promise.all([
      this.getMOStatusSummary(period),
      this.getWorkOrderCompletionRate(period),
      this.getWorkCenterUtilization(period),
      this.getTopProducts(period),
      this.getStockChanges(period),
    ]);

    return {
      manufacturingOrderSummary: moStatusSummary,
      workOrderCompletionRate: woCompletionRate,
      workCenterUtilization: workCenterUtilization,
      topProducts: topProducts,
      stockChanges: stockChanges,
    };
  }

  private async generateMonthlyKPIs(period: { start: Date; end: Date }) {
    const [leadTimes, productivity, cancellations, stockReconciliation, costs] = await Promise.all([
      this.getAverageLeadTimes(period),
      this.getProductivityMetrics(period),
      this.getCancellationRate(period),
      this.getStockReconciliation(period),
      this.getCostAnalysis(period),
    ]);

    return {
      averageLeadTimes: leadTimes,
      productivity: productivity,
      cancellationRate: cancellations,
      stockReconciliation: stockReconciliation,
      costAnalysis: costs,
    };
  }

  private async generateQuarterlyKPIs(period: { start: Date; end: Date }) {
    const [trends, capacityVsDemand, bomVariances, productivity, costAnalysis] = await Promise.all([
      this.getTrends(period),
      this.getCapacityVsDemand(period),
      this.getBOMVariances(period),
      this.getProductivityTrends(period),
      this.getQuarterlyCostAnalysis(period),
    ]);

    return {
      trends: trends,
      capacityVsDemand: capacityVsDemand,
      bomVariances: bomVariances,
      productivityTrends: productivity,
      costAnalysis: costAnalysis,
    };
  }

  private async generateYearlyKPIs(period: { start: Date; end: Date }) {
    const [totalOutput, efficiency, downtime, inventoryTurnover, strategicKPIs] = await Promise.all([
      this.getTotalOutput(period),
      this.getEfficiencyMetrics(period),
      this.getAnnualDowntime(period),
      this.getInventoryTurnover(period),
      this.getStrategicKPIs(period),
    ]);

    return {
      totalOutput: totalOutput,
      efficiency: efficiency,
      downtime: downtime,
      inventoryTurnover: inventoryTurnover,
      strategicKPIs: strategicKPIs,
    };
  }

  // Helper methods for data queries
  private async getNewManufacturingOrders(period: { start: Date; end: Date }) {
    return await this.prisma.manufacturingOrder.findMany({
      where: {
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
      include: {
        product: true,
        createdBy: true,
        assignedTo: true,
      },
    });
  }

  private async getWorkOrderActivity(period: { start: Date; end: Date }) {
    return await this.prisma.workOrder.findMany({
      where: {
        OR: [
          {
            startedAt: {
              gte: period.start,
              lte: period.end,
            },
          },
          {
            completedAt: {
              gte: period.start,
              lte: period.end,
            },
          },
        ],
      },
      include: {
        mo: true,
        workCenter: true,
        assignedTo: true,
      },
    });
  }

  private async getStockMovements(period: { start: Date; end: Date }) {
    return await this.prisma.productLedger.findMany({
      where: {
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
      include: {
        product: true,
      },
    });
  }

  private async getWorkCenterDowntime(period: { start: Date; end: Date }) {
    return await this.prisma.workCenter.findMany({
      where: {
        createdAt: {
          lte: period.end,
        },
      },
    });
  }

  private async getExceptions(period: { start: Date; end: Date }) {
    // Query for delayed work orders, overdue MOs, stock shortages, etc.
    const delayedWorkOrders = await this.prisma.workOrder.findMany({
      where: {
        status: {
          in: [WorkStatus.started, WorkStatus.to_do],
        },
        mo: {
          deadline: {
            lt: new Date(),
          },
        },
      },
    });

    const overdueMOs = await this.prisma.manufacturingOrder.findMany({
      where: {
        deadline: {
          lt: new Date(),
        },
        status: {
          not: OrderStatus.done,
        },
      },
    });

    return [...delayedWorkOrders, ...overdueMOs];
  }

  // Additional helper methods for calculations
  private groupByStatus(orders: any[]) {
    return orders.reduce((acc, order) => {
      const status = order.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAverageCompletionTime(workOrders: any[]) {
    const completed = workOrders.filter(wo => wo.completedAt && wo.startedAt);
    if (completed.length === 0) return 0;

    const totalTime = completed.reduce((sum, wo) => {
      const duration = moment(wo.completedAt).diff(moment(wo.startedAt), 'minutes');
      return sum + duration;
    }, 0);

    return Math.round(totalTime / completed.length);
  }

  private calculateNetStockChange(movements: any[]) {
    return movements.reduce((net, movement) => {
      return movement.movementType === MovementType.in 
        ? net + movement.quantity 
        : net - movement.quantity;
    }, 0);
  }

  private categorizeExceptions(exceptions: any[]) {
    // Categorize exceptions by type
    return {
      delays: exceptions.filter(e => e.deadline && moment(e.deadline).isBefore()).length,
      overdue: exceptions.filter(e => e.status && e.status !== 'done').length,
    };
  }

  // Placeholder methods for other KPI calculations
  private async getMOStatusSummary(period: { start: Date; end: Date }) {
    const mos = await this.getNewManufacturingOrders(period);
    return this.groupByStatus(mos);
  }

  private async getWorkOrderCompletionRate(period: { start: Date; end: Date }) {
    const workOrders = await this.getWorkOrderActivity(period);
    const completed = workOrders.filter(wo => wo.status === WorkStatus.completed).length;
    return workOrders.length > 0 ? (completed / workOrders.length) * 100 : 0;
  }

  private async getWorkCenterUtilization(period: { start: Date; end: Date }) {
    const workCenters = await this.getWorkCenterDowntime(period);
    return workCenters.map(wc => ({
      id: wc.id,
      name: wc.name,
      utilization: wc.capacityPerHour ? ((wc.capacityPerHour * 8 - wc.downtimeMins / 60) / (wc.capacityPerHour * 8)) * 100 : 0,
    }));
  }

  private async getTopProducts(period: { start: Date; end: Date }) {
    const movements = await this.getStockMovements(period);
    const productActivity = movements.reduce((acc, movement) => {
      const productId = movement.productId;
      acc[productId] = (acc[productId] || 0) + Math.abs(movement.quantity);
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(productActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([productId, activity]) => ({ productId: parseInt(productId), activity }));
  }

  private async getStockChanges(period: { start: Date; end: Date }) {
    const movements = await this.getStockMovements(period);
    return {
      totalIn: movements.filter(m => m.movementType === MovementType.in).reduce((sum, m) => sum + m.quantity, 0),
      totalOut: movements.filter(m => m.movementType === MovementType.out).reduce((sum, m) => sum + m.quantity, 0),
    };
  }

  // Placeholder methods for complex KPIs - implement based on business logic
  private async getAverageLeadTimes(period: { start: Date; end: Date }) {
    return { averageLeadTimeDays: 5.2, medianLeadTimeDays: 4.8 };
  }

  private async getProductivityMetrics(period: { start: Date; end: Date }) {
    return { outputPerHour: 12.5, efficiencyRatio: 0.85 };
  }

  private async getCancellationRate(period: { start: Date; end: Date }) {
    return { cancellationRate: 2.3, totalCancellations: 5 };
  }

  private async getStockReconciliation(period: { start: Date; end: Date }) {
    return { discrepancies: 3, accuracy: 97.2 };
  }

  private async getCostAnalysis(period: { start: Date; end: Date }) {
    return { totalCosts: 125000, costPerUnit: 45.2 };
  }

  private async getTrends(period: { start: Date; end: Date }) {
    return { growthRate: 5.2, seasonalPattern: 'increasing' };
  }

  private async getCapacityVsDemand(period: { start: Date; end: Date }) {
    return { capacityUtilization: 78.5, demandFulfillment: 92.1 };
  }

  private async getBOMVariances(period: { start: Date; end: Date }) {
    return { varianceRate: 1.2, costImpact: 2500 };
  }

  private async getProductivityTrends(period: { start: Date; end: Date }) {
    return { trend: 'improving', quarterlyGrowth: 3.2 };
  }

  private async getQuarterlyCostAnalysis(period: { start: Date; end: Date }) {
    return { totalCosts: 375000, costReduction: 2.1 };
  }

  private async getTotalOutput(period: { start: Date; end: Date }) {
    return { totalUnits: 12500, totalValue: 562500 };
  }

  private async getEfficiencyMetrics(period: { start: Date; end: Date }) {
    return { overallEfficiency: 87.3, improvementRate: 4.2 };
  }

  private async getAnnualDowntime(period: { start: Date; end: Date }) {
    return { totalDowntimeHours: 420, downtimeRate: 2.3 };
  }

  private async getInventoryTurnover(period: { start: Date; end: Date }) {
    return { turnoverRate: 6.2, averageInventoryValue: 95000 };
  }

  private async getStrategicKPIs(period: { start: Date; end: Date }) {
    return {
      customerSatisfaction: 94.2,
      qualityRate: 98.7,
      onTimeDelivery: 91.3,
      costPerformance: 102.1
    };
  }

  private generateSummary(reportType: ReportType, kpis: any): string {
    switch (reportType) {
      case 'daily':
        return `Daily report shows ${kpis.newManufacturingOrders?.count || 0} new manufacturing orders and ${kpis.workOrderActivity?.completed || 0} completed work orders.`;
      case 'weekly':
        return `Weekly performance indicates ${Math.round(kpis.workOrderCompletionRate || 0)}% work order completion rate.`;
      case 'monthly':
        return `Monthly productivity shows ${kpis.productivity?.efficiencyRatio ? Math.round(kpis.productivity.efficiencyRatio * 100) : 0}% efficiency ratio.`;
      case 'quarterly':
        return `Quarterly analysis reveals ${kpis.capacityVsDemand?.capacityUtilization ? Math.round(kpis.capacityVsDemand.capacityUtilization) : 0}% capacity utilization.`;
      case 'yearly':
        return `Annual performance achieved ${kpis.totalOutput?.totalUnits || 0} units with ${kpis.efficiency?.overallEfficiency ? Math.round(kpis.efficiency.overallEfficiency) : 0}% overall efficiency.`;
      default:
        return 'Report generated successfully.';
    }
  }

  async saveReport(reportData: ReportData, userId: number): Promise<number> {
    const savedReport = await this.prisma.report.create({
      data: {
        reportType: reportData.reportType,
        data: reportData as any,
        userId: userId,
      },
    });
    return savedReport.id;
  }
}