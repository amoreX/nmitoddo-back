import puppeteer from 'puppeteer';
import { ReportData } from '../controllers/newReportController';

export interface HtmlPdfOptions {
  user?: { id: number; name?: string | null; email?: string | null };
  company?: { name?: string; logoBase64?: string };
}

export class HtmlPdfService {
  /**
   * Generate HTML template for the report
   */
  private generateHtmlTemplate(reportData: ReportData, options: HtmlPdfOptions = {}): string {
    const { user, company } = options;
    
    // Helper function to format dates
    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatDateTime = (date: Date | string) => {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Generate Chart.js data for status breakdown
    const statusChartData = {
      labels: Object.keys(reportData.kpis.manufacturingOrderSummary).filter(k => k !== 'total'),
      datasets: [{
        data: Object.entries(reportData.kpis.manufacturingOrderSummary)
          .filter(([k]) => k !== 'total')
          .map(([, v]) => v),
        backgroundColor: [
          '#e3f2fd', '#bbdefb', '#2196f3', '#1976d2', '#0d47a1', '#f44336'
        ],
        borderColor: '#1976d2',
        borderWidth: 1
      }]
    };

    // Generate trend chart data
    const trendChartData = {
      labels: reportData.trends.daily.slice(-30).map(d => d.date),
      datasets: [{
        label: 'Orders Created',
        data: reportData.trends.daily.slice(-30).map(d => d.orders),
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true
      }, {
        label: 'Orders Completed',
        data: reportData.trends.daily.slice(-30).map(d => d.completed),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true
      }]
    };

    // Generate work center utilization chart
    const utilizationChartData = {
      labels: reportData.workCenterUtilization.map(wc => wc.name),
      datasets: [{
        label: 'Utilization %',
        data: reportData.workCenterUtilization.map(wc => wc.utilizationPercent),
        backgroundColor: reportData.workCenterUtilization.map(wc => 
          wc.utilizationPercent > 80 ? '#f44336' : 
          wc.utilizationPercent > 60 ? '#ff9800' : '#4caf50'
        ),
        borderColor: '#1976d2',
        borderWidth: 1
      }]
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manufacturing Report - ${reportData.period.type}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #ffffff;
        }

        .page {
            width: 21cm;
            min-height: 29.7cm;
            padding: 2cm;
            margin: 0 auto;
            background: white;
            page-break-after: always;
        }

        .page:last-child {
            page-break-after: auto;
        }

        /* Cover Page */
        .cover-page {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }

        .logo {
            width: 150px;
            height: 150px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 2rem;
        }

        .cover-title {
            font-size: 3rem;
            font-weight: 300;
            margin-bottom: 1rem;
        }

        .cover-subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 3rem;
        }

        .cover-meta {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            width: 100%;
            max-width: 600px;
        }

        .cover-meta-item {
            text-align: center;
        }

        .cover-meta-label {
            font-size: 0.9rem;
            opacity: 0.8;
            margin-bottom: 0.5rem;
        }

        .cover-meta-value {
            font-size: 1.1rem;
            font-weight: 500;
        }

        /* Headers */
        h1 {
            color: #1976d2;
            font-size: 2.5rem;
            margin-bottom: 1rem;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 0.5rem;
        }

        h2 {
            color: #1976d2;
            font-size: 1.8rem;
            margin: 2rem 0 1rem 0;
            border-left: 4px solid #1976d2;
            padding-left: 1rem;
        }

        h3 {
            color: #333;
            font-size: 1.3rem;
            margin: 1.5rem 0 0.5rem 0;
        }

        /* KPI Cards */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
        }

        .kpi-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .kpi-value {
            font-size: 2rem;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 0.5rem;
        }

        .kpi-label {
            font-size: 0.9rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .kpi-trend {
            font-size: 0.8rem;
            margin-top: 0.5rem;
        }

        .trend-up { color: #4caf50; }
        .trend-down { color: #f44336; }

        /* Charts */
        .chart-container {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .chart-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            text-align: center;
            color: #333;
        }

        .charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin: 1rem 0;
        }

        .chart-canvas {
            max-height: 300px;
        }

        /* Tables */
        .table-container {
            margin: 1rem 0;
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        th {
            background: #1976d2;
            color: white;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 0.8rem 1rem;
            border-bottom: 1px solid #e9ecef;
        }

        tr:hover {
            background: #f8f9fa;
        }

        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-draft { background: #e3f2fd; color: #1976d2; }
        .status-confirmed { background: #fff3e0; color: #f57c00; }
        .status-in-progress { background: #e8f5e8; color: #388e3c; }
        .status-done { background: #f3e5f5; color: #7b1fa2; }
        .status-cancelled { background: #ffebee; color: #d32f2f; }

        .low-stock { color: #f44336; font-weight: bold; }
        .normal-stock { color: #4caf50; }

        /* Footer */
        .footer {
            position: fixed;
            bottom: 1cm;
            left: 2cm;
            right: 2cm;
            text-align: center;
            font-size: 0.8rem;
            color: #666;
            border-top: 1px solid #e9ecef;
            padding-top: 0.5rem;
        }

        /* Print specific styles */
        @media print {
            .page {
                margin: 0;
                box-shadow: none;
            }
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin: 1rem 0;
        }

        .insight-box {
            background: #f8f9fa;
            border-left: 4px solid #1976d2;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 4px;
        }

        .insight-title {
            font-weight: 600;
            color: #1976d2;
            margin-bottom: 0.5rem;
        }
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="page cover-page">
        <div class="logo">
            ${company?.name ? company.name.substring(0, 2).toUpperCase() : 'MC'}
        </div>
        <h1 class="cover-title">Manufacturing Report</h1>
        <p class="cover-subtitle">From Orders to Output – All in One Flow</p>
        <div class="cover-meta">
            <div class="cover-meta-item">
                <div class="cover-meta-label">Report Period</div>
                <div class="cover-meta-value">${formatDate(reportData.period.start)} - ${formatDate(reportData.period.end)}</div>
            </div>
            <div class="cover-meta-item">
                <div class="cover-meta-label">Generated By</div>
                <div class="cover-meta-value">${user?.name || user?.email || 'System'}</div>
            </div>
            <div class="cover-meta-item">
                <div class="cover-meta-label">Generated At</div>
                <div class="cover-meta-value">${formatDateTime(reportData.generatedAt)}</div>
            </div>
        </div>
    </div>

    <!-- Executive Summary -->
    <div class="page">
        <h1>Executive Summary</h1>
        
        <div class="summary-grid">
            <div class="kpi-card">
                <div class="kpi-value">${reportData.summary.totalMOs}</div>
                <div class="kpi-label">Total Manufacturing Orders</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${reportData.summary.totalWOs}</div>
                <div class="kpi-label">Total Work Orders</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${reportData.kpis.workOrderCompletionRate.toFixed(1)}%</div>
                <div class="kpi-label">Completion Rate</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${reportData.kpis.averageLeadTimes.averageLeadTimeDays.toFixed(1)}</div>
                <div class="kpi-label">Avg Lead Time (Days)</div>
            </div>
        </div>

        <h2>Key Performance Indicators</h2>
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value">${reportData.kpis.productivity.ordersPerDay.toFixed(1)}</div>
                <div class="kpi-label">Orders Per Day</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${reportData.kpis.productivity.completionRate.toFixed(1)}%</div>
                <div class="kpi-label">Order Completion Rate</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${reportData.kpis.inventory.totalMovements}</div>
                <div class="kpi-label">Inventory Movements</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">$${reportData.kpis.costs.totalWorkCenterCosts.toFixed(0)}</div>
                <div class="kpi-label">Total Work Center Costs</div>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-container">
                <div class="chart-title">Manufacturing Order Status Breakdown</div>
                <canvas id="statusChart" class="chart-canvas"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">Work Center Utilization</div>
                <canvas id="utilizationChart" class="chart-canvas"></canvas>
            </div>
        </div>

        <div class="chart-container" style="grid-column: 1 / -1;">
            <div class="chart-title">Daily Orders Trend (Last 30 Days)</div>
            <canvas id="trendChart" class="chart-canvas"></canvas>
        </div>
    </div>

    <!-- Manufacturing Orders Details -->
    <div class="page">
        <h1>Manufacturing Orders</h1>
        
        <h2>Status Breakdown</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(reportData.kpis.manufacturingOrderSummary)
                      .filter(([key]) => key !== 'total')
                      .map(([status, count]) => `
                        <tr>
                            <td><span class="status-badge status-${status.replace('_', '-')}">${status.replace('_', ' ').toUpperCase()}</span></td>
                            <td>${count}</td>
                            <td>${reportData.kpis.manufacturingOrderSummary.total > 0 ? ((count as number / reportData.kpis.manufacturingOrderSummary.total) * 100).toFixed(1) : 0}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <h2>Top Products by Order Volume</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Orders Count</th>
                        <th>Total Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.topProducts.slice(0, 10).map(product => `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.ordersCount}</td>
                            <td>${product.totalQuantity}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${reportData.delayedOrders.length > 0 ? `
        <h2>Delayed Orders</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Deadline</th>
                        <th>Days Past Due</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.delayedOrders.slice(0, 10).map(order => `
                        <tr>
                            <td>#${order.id}</td>
                            <td>${order.productName}</td>
                            <td>${order.quantity}</td>
                            <td>${formatDate(order.deadline)}</td>
                            <td style="color: #f44336; font-weight: bold;">${order.daysPastDue} days</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
    </div>

    <!-- Work Centers & Inventory -->
    <div class="page">
        <h1>Work Centers & Inventory</h1>
        
        <h2>Work Center Utilization</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Work Center</th>
                        <th>Total Hours</th>
                        <th>Utilization %</th>
                        <th>Cost per Hour</th>
                        <th>Total Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.workCenterUtilization.map(wc => `
                        <tr>
                            <td>${wc.name}</td>
                            <td>${wc.totalHours.toFixed(1)}</td>
                            <td>
                                <span style="color: ${wc.utilizationPercent > 80 ? '#f44336' : wc.utilizationPercent > 60 ? '#ff9800' : '#4caf50'}">
                                    ${wc.utilizationPercent.toFixed(1)}%
                                </span>
                            </td>
                            <td>$${wc.costPerHour.toFixed(2)}</td>
                            <td>$${wc.totalCost.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <h2>Current Stock Levels</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Current Stock</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.stockSummary.slice(0, 15).map(stock => `
                        <tr>
                            <td>${stock.productName}</td>
                            <td>${stock.currentStock}</td>
                            <td class="${stock.isLowStock ? 'low-stock' : 'normal-stock'}">
                                ${stock.isLowStock ? 'LOW STOCK' : 'NORMAL'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="insight-box">
            <div class="insight-title">Key Insights</div>
            <ul>
                <li>Total inventory movements in period: ${reportData.kpis.inventory.totalMovements}</li>
                <li>Items with low stock alerts: ${reportData.kpis.inventory.lowStockItems}</li>
                <li>Average cost per manufacturing order: $${reportData.kpis.costs.averageCostPerOrder.toFixed(2)}</li>
                <li>Work order completion rate: ${reportData.kpis.workOrderCompletionRate.toFixed(1)}%</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        Manufacturing Report | Generated on ${formatDateTime(reportData.generatedAt)} | ${company?.name || 'Your Company'}
    </div>

    <script>
        // Initialize charts after DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Status Chart
            const statusCtx = document.getElementById('statusChart').getContext('2d');
            new Chart(statusCtx, {
                type: 'doughnut',
                data: ${JSON.stringify(statusChartData)},
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Utilization Chart
            const utilizationCtx = document.getElementById('utilizationChart').getContext('2d');
            new Chart(utilizationCtx, {
                type: 'bar',
                data: ${JSON.stringify(utilizationChartData)},
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });

            // Trend Chart
            const trendCtx = document.getElementById('trendChart').getContext('2d');
            new Chart(trendCtx, {
                type: 'line',
                data: ${JSON.stringify(trendChartData)},
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });
    </script>
</body>
</html>`;
  }

  /**
   * Convert HTML to PDF using Puppeteer
   */
  async htmlToPdf(htmlString: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set content and wait for network idle to ensure charts are rendered
      await page.setContent(htmlString, { 
        waitUntil: ['networkidle0', 'domcontentloaded'] 
      });

      // Wait a bit more for Chart.js to render
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate PDF report from report data
   */
  async generatePDF(reportData: ReportData, options: HtmlPdfOptions = {}): Promise<Buffer> {
    const htmlString = this.generateHtmlTemplate(reportData, options);
    return await this.htmlToPdf(htmlString);
  }
}