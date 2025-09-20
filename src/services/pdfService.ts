import PDFDocument from 'pdfkit';
import { ReportData, ReportType } from './reportService';

export class PDFService {
  async generatePDF(reportData: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Starting PDF generation for ${reportData.reportType} report...`);
        
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 80, // Increased bottom margin for footer
            left: 50,
            right: 50,
          },
        });

        const buffers: Buffer[] = [];
        
        doc.on('data', (buffer: Buffer) => buffers.push(buffer));
        doc.on('end', () => {
          console.log('PDF generation completed successfully');
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', (error) => {
          console.error('PDF generation error:', error);
          reject(error);
        });

        try {
          // Generate PDF content based on report type
          this.generatePDFContent(doc, reportData);
          
          console.log('PDF content generated, finalizing document...');
          doc.end();
        } catch (contentError) {
          console.error('Error generating PDF content:', contentError);
          reject(contentError);
        }
      } catch (error) {
        console.error('Error initializing PDF generation:', error);
        reject(error);
      }
    });
  }

  private generatePDFContent(doc: PDFKit.PDFDocument, reportData: ReportData): void {
    try {
      console.log('Adding PDF header...');
      // Header
      this.addHeader(doc, reportData);
      
      console.log('Adding PDF summary...');
      // Report Summary
      this.addSummary(doc, reportData);
      
      console.log('Adding PDF KPIs...');
      // KPIs based on report type
      this.addKPIs(doc, reportData);
      
      console.log('Adding PDF footer...');
      // Footer
      this.addFooter(doc, reportData);
      
      console.log('PDF content generation completed');
    } catch (error) {
      console.error('Error in generatePDFContent:', error);
      throw error;
    }
  }

  private addHeader(doc: PDFKit.PDFDocument, reportData: ReportData): void {
    // Company/Title Header
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('Manufacturing Report', 50, 50, { align: 'center' });
    
    // Report Type and Period
    doc.fontSize(16)
       .font('Helvetica')
       .text(`${this.capitalizeFirst(reportData.reportType)} Report`, 50, 90, { align: 'center' });
    
    doc.fontSize(12)
       .text(`Period: ${this.formatDate(reportData.period.start)} - ${this.formatDate(reportData.period.end)}`, 50, 110, { align: 'center' });
    
    doc.fontSize(10)
       .text(`Generated: ${this.formatDateTime(reportData.generatedAt)}`, 50, 130, { align: 'center' });
    
    // Add a line separator
    doc.moveTo(50, 150)
       .lineTo(545, 150)
       .stroke();
       
    doc.y = 170;
  }

  private addSummary(doc: PDFKit.PDFDocument, reportData: ReportData): void {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Executive Summary', 50, doc.y);
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(reportData.summary, 50, doc.y + 20, {
         width: 495,
         align: 'justify',
       });
       
    doc.y += 60;
  }

  private addKPIs(doc: PDFKit.PDFDocument, reportData: ReportData): void {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Key Performance Indicators', 50, doc.y);
       
    doc.y += 25;

    switch (reportData.reportType) {
      case 'daily':
        this.addDailyKPIs(doc, reportData.kpis);
        break;
      case 'weekly':
        this.addWeeklyKPIs(doc, reportData.kpis);
        break;
      case 'monthly':
        this.addMonthlyKPIs(doc, reportData.kpis);
        break;
      case 'quarterly':
        this.addQuarterlyKPIs(doc, reportData.kpis);
        break;
      case 'yearly':
        this.addYearlyKPIs(doc, reportData.kpis);
        break;
    }
  }

  private addDailyKPIs(doc: PDFKit.PDFDocument, kpis: any): void {
    // New Manufacturing Orders
    this.addSection(doc, 'New Manufacturing Orders', [
      { label: 'Total Orders', value: kpis.newManufacturingOrders?.count || 0 },
      { label: 'Total Quantity', value: kpis.newManufacturingOrders?.totalQuantity || 0 },
    ]);

    // Work Order Activity
    this.addSection(doc, 'Work Order Activity', [
      { label: 'Total Work Orders', value: kpis.workOrderActivity?.total || 0 },
      { label: 'Completed', value: kpis.workOrderActivity?.completed || 0 },
      { label: 'In Progress', value: kpis.workOrderActivity?.inProgress || 0 },
      { label: 'Avg Completion Time (min)', value: kpis.workOrderActivity?.averageCompletionTime || 0 },
    ]);

    // Stock Movements
    this.addSection(doc, 'Stock Movements', [
      { label: 'Total Movements', value: kpis.stockMovements?.totalMovements || 0 },
      { label: 'Stock In', value: kpis.stockMovements?.stockIn || 0 },
      { label: 'Stock Out', value: kpis.stockMovements?.stockOut || 0 },
      { label: 'Net Change', value: kpis.stockMovements?.netChange || 0 },
    ]);

    // Downtime & Exceptions
    this.addSection(doc, 'Downtime & Exceptions', [
      { label: 'Total Downtime (min)', value: kpis.workCenterDowntime?.totalDowntimeMinutes || 0 },
      { label: 'Affected Work Centers', value: kpis.workCenterDowntime?.affectedWorkCenters || 0 },
      { label: 'Total Exceptions', value: kpis.exceptions?.count || 0 },
    ]);
  }

  private addWeeklyKPIs(doc: PDFKit.PDFDocument, kpis: any): void {
    // Work Order Completion Rate
    this.addSection(doc, 'Performance Metrics', [
      { label: 'WO Completion Rate (%)', value: Math.round(kpis.workOrderCompletionRate || 0) },
    ]);

    // Stock Changes
    this.addSection(doc, 'Stock Changes', [
      { label: 'Total Stock In', value: kpis.stockChanges?.totalIn || 0 },
      { label: 'Total Stock Out', value: kpis.stockChanges?.totalOut || 0 },
    ]);

    // Work Center Utilization
    if (kpis.workCenterUtilization && kpis.workCenterUtilization.length > 0) {
      const utilizationData = kpis.workCenterUtilization.slice(0, 5).map((wc: any) => ({
        label: wc.name,
        value: `${Math.round(wc.utilization)}%`,
      }));
      this.addSection(doc, 'Work Center Utilization (Top 5)', utilizationData);
    }
  }

  private addMonthlyKPIs(doc: PDFKit.PDFDocument, kpis: any): void {
    this.addSection(doc, 'Lead Times & Productivity', [
      { label: 'Average Lead Time (days)', value: kpis.averageLeadTimes?.averageLeadTimeDays || 0 },
      { label: 'Efficiency Ratio', value: `${Math.round((kpis.productivity?.efficiencyRatio || 0) * 100)}%` },
      { label: 'Cancellation Rate (%)', value: kpis.cancellationRate?.cancellationRate || 0 },
    ]);

    this.addSection(doc, 'Cost Analysis', [
      { label: 'Total Costs ($)', value: this.formatCurrency(kpis.costAnalysis?.totalCosts || 0) },
      { label: 'Cost Per Unit ($)', value: this.formatCurrency(kpis.costAnalysis?.costPerUnit || 0) },
    ]);

    this.addSection(doc, 'Stock Reconciliation', [
      { label: 'Discrepancies', value: kpis.stockReconciliation?.discrepancies || 0 },
      { label: 'Accuracy (%)', value: kpis.stockReconciliation?.accuracy || 0 },
    ]);
  }

  private addQuarterlyKPIs(doc: PDFKit.PDFDocument, kpis: any): void {
    this.addSection(doc, 'Capacity & Demand', [
      { label: 'Capacity Utilization (%)', value: Math.round(kpis.capacityVsDemand?.capacityUtilization || 0) },
      { label: 'Demand Fulfillment (%)', value: Math.round(kpis.capacityVsDemand?.demandFulfillment || 0) },
    ]);

    this.addSection(doc, 'Trends & Productivity', [
      { label: 'Growth Rate (%)', value: kpis.trends?.growthRate || 0 },
      { label: 'Quarterly Growth (%)', value: kpis.productivityTrends?.quarterlyGrowth || 0 },
    ]);

    this.addSection(doc, 'BOM & Cost Analysis', [
      { label: 'BOM Variance Rate (%)', value: kpis.bomVariances?.varianceRate || 0 },
      { label: 'Cost Impact ($)', value: this.formatCurrency(kpis.bomVariances?.costImpact || 0) },
      { label: 'Total Costs ($)', value: this.formatCurrency(kpis.costAnalysis?.totalCosts || 0) },
    ]);
  }

  private addYearlyKPIs(doc: PDFKit.PDFDocument, kpis: any): void {
    this.addSection(doc, 'Annual Output', [
      { label: 'Total Units Produced', value: this.formatNumber(kpis.totalOutput?.totalUnits || 0) },
      { label: 'Total Value ($)', value: this.formatCurrency(kpis.totalOutput?.totalValue || 0) },
    ]);

    this.addSection(doc, 'Efficiency & Performance', [
      { label: 'Overall Efficiency (%)', value: Math.round(kpis.efficiency?.overallEfficiency || 0) },
      { label: 'Improvement Rate (%)', value: kpis.efficiency?.improvementRate || 0 },
    ]);

    this.addSection(doc, 'Downtime & Inventory', [
      { label: 'Total Downtime (hours)', value: kpis.downtime?.totalDowntimeHours || 0 },
      { label: 'Downtime Rate (%)', value: kpis.downtime?.downtimeRate || 0 },
      { label: 'Inventory Turnover', value: kpis.inventoryTurnover?.turnoverRate || 0 },
    ]);

    this.addSection(doc, 'Strategic KPIs', [
      { label: 'Customer Satisfaction (%)', value: Math.round(kpis.strategicKPIs?.customerSatisfaction || 0) },
      { label: 'Quality Rate (%)', value: Math.round(kpis.strategicKPIs?.qualityRate || 0) },
      { label: 'On-Time Delivery (%)', value: Math.round(kpis.strategicKPIs?.onTimeDelivery || 0) },
      { label: 'Cost Performance Index', value: kpis.strategicKPIs?.costPerformance || 0 },
    ]);
  }

  private addSection(doc: PDFKit.PDFDocument, title: string, data: { label: string; value: any }[]): void {
    // Add section title
    if (doc.y > 700) {
      doc.addPage();
      doc.y = 50;
    }
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(title, 50, doc.y);
    doc.y += 20;

    const columnWidth = 240;
    data.forEach((item) => {
      // If near bottom, add new page
      if (doc.y > 750) {
        doc.addPage();
        doc.y = 50;
      }
      doc.fontSize(10)
         .font('Helvetica')
         .text(item.label, 70, doc.y)
         .text(String(item.value), 70 + columnWidth, doc.y);
      doc.y += 20;
    });
    doc.y += 10; // Small gap after section
  }

  private addFooter(doc: PDFKit.PDFDocument, reportData: ReportData): void {
    // Simple footer approach - add footer to current page only
    // This avoids the complex page switching that was causing errors
    
    // Save current position
    const currentY = doc.y;
    
    // Move to footer area
    doc.y = 770;
    
    // Footer line
    doc.moveTo(50, 770)
       .lineTo(545, 770)
       .stroke();
    
    // Footer text
    doc.fontSize(8)
       .font('Helvetica')
       .text(`Manufacturing Report - ${this.capitalizeFirst(reportData.reportType)}`, 50, 780);
    
    // Add generation timestamp
    doc.text(`Generated: ${this.formatDateTime(reportData.generatedAt)}`, 0, 780, { align: 'right' });
    
    // Restore position (though we're at the end anyway)
    doc.y = currentY;
  }

  // Utility methods
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  private formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  convertToPDFBase64(buffer: Buffer): string {
    return buffer.toString('base64');
  }
}