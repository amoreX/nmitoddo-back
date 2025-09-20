import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions, Content, StyleDictionary } from 'pdfmake/interfaces';
import { OrderStatus, WorkStatus, WorkOrder, ManufacturingOrder, WorkCenter, Product, ProductLedger } from '@prisma/client';
import moment from 'moment';
import { ReportData } from './reportService';

// Core fonts mapping (safe in Node without bundling TTFs)
const fallbackFonts = {
	Helvetica: {
		normal: 'Helvetica',
		bold: 'Helvetica-Bold',
		italics: 'Helvetica-Oblique',
		bolditalics: 'Helvetica-BoldOblique',
	},
};

const COLORS = {
	primary: '#1f6feb',
	secondary: '#6b7280',
	light: '#e5e7eb',
	dark: '#111827',
	success: '#16a34a',
	warning: '#f59e0b',
	danger: '#dc2626',
	info: '#0ea5e9',
	gray: '#9ca3af',
};

type ID = number;

export interface PDFFilters {
	start?: string;
	end?: string;
	productId?: ID;
	moId?: ID;
}

export interface Dataset {
	orders: (ManufacturingOrder & {
		product: Product | null;
		assignedTo: { id: number; name: string | null } | null;
		workOrders: (WorkOrder & { workCenter: WorkCenter | null; assignedTo: { id: number; name: string | null } | null })[];
	})[];
	workCenters: (WorkCenter & { workOrders: WorkOrder[] })[];
	ledger: (ProductLedger & { product: Product })[];
	stocks: { product: Product; quantity: number }[];
	bom: { product: Product; components: { component: Product; quantity: number; operation?: string | null; opDurationMins?: number | null }[] }[];
}

export interface GeneratePDFOptions {
	user?: { id: ID; name?: string | null; email?: string | null };
	filters?: PDFFilters;
	dataset?: Dataset;
	company?: { name?: string; logoBase64?: string };
}

export class PDFService {
	private printer: any;

	constructor() {
			// Use core Helvetica fonts to avoid missing font files in server runtime
			this.printer = new (PdfPrinter as any)(fallbackFonts);
	}

	async generatePDF(report: ReportData, options: GeneratePDFOptions = {}): Promise<Buffer> {
		const { user, filters, dataset, company } = options;

		const styles: StyleDictionary = this.buildStyles();
		const content: Content[] = [];

		// 1) Cover Page
		content.push(this.coverPage(report, user, company));

		// 2) Executive Summary (KPI + charts)
		content.push({ text: 'Executive Summary', style: 'h2', margin: [0, 20, 0, 8] });
		content.push(this.execSummary(report));
		content.push(this.execCharts(report));

		// 3) Manufacturing Orders
		if (dataset?.orders?.length) {
			content.push({ text: '\nManufacturing Orders 📦', style: 'h2', margin: [0, 20, 0, 8] });
			content.push(this.moTable(dataset.orders));
		}

		// 4) Work Orders
		if (dataset?.orders?.length) {
			content.push({ text: '\nWork Orders 🛠️', style: 'h2', margin: [0, 20, 0, 8] });
			content.push(...this.workOrdersSection(dataset.orders));
		}

		// 5) Work Centers
		if (dataset?.workCenters?.length) {
			content.push({ text: '\nWork Centers', style: 'h2', margin: [0, 20, 0, 8] });
			content.push(this.workCentersSection(dataset.workCenters));
		}

		// 6) Stock Ledger & Inventory
		if (dataset?.ledger?.length || dataset?.stocks?.length) {
			content.push({ text: '\nStock Ledger & Inventory 📊', style: 'h2', margin: [0, 20, 0, 8] });
			content.push(this.stockSection(dataset));
		}

		// 7) BOM Analysis
		if (dataset?.bom?.length) {
			content.push({ text: '\nBOM Analysis', style: 'h2', margin: [0, 20, 0, 8] });
			content.push(...this.bomSection(dataset));
		}

		// 8) Analytics & Insights
		if (dataset) {
			content.push({ text: '\nAnalytics & Insights', style: 'h2', margin: [0, 20, 0, 8] });
			content.push(this.insightsSection(dataset));
		}

		// 9) Appendix
		if (dataset) {
			content.push({ text: '\nAppendix / Raw Data', style: 'h2', margin: [0, 20, 0, 8] });
			content.push(this.appendix(dataset, report));
		}

		const docDefinition: TDocumentDefinitions = {
			pageSize: 'A4',
			pageMargins: [40, 60, 40, 60],
			info: {
				title: 'Manufacturing Report',
				author: user?.name || user?.email || 'System',
				subject: 'From Orders to Output – All in One Flow',
			},
			footer: (currentPage: number, pageCount: number) => ({
				columns: [
					{ text: 'Manufacturing Report', style: 'footerLeft' },
					{ text: `${currentPage} / ${pageCount}`, alignment: 'right', style: 'footerRight' },
				],
				margin: [40, 0, 40, 20],
			}),
			content,
			styles,
			defaultStyle: { font: 'Helvetica', color: COLORS.dark, fontSize: 10 },
		};

		const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
		const buffers: Buffer[] = [];
		return new Promise<Buffer>((resolve, reject) => {
			pdfDoc.on('data', (b: Buffer) => buffers.push(b));
			pdfDoc.on('end', () => resolve(Buffer.concat(buffers)));
			pdfDoc.on('error', reject);
			pdfDoc.end();
		});
	}

	convertToPDFBase64(buffer: Buffer): string {
		return buffer.toString('base64');
	}

	// ----- Styles -----
	private buildStyles(): StyleDictionary {
		return {
			h1: { fontSize: 24, bold: true, color: COLORS.primary },
			h2: { fontSize: 16, bold: true, color: COLORS.primary },
			h3: { fontSize: 12, bold: true, color: COLORS.dark },
			sub: { fontSize: 10, color: COLORS.gray },
			kpiValue: { fontSize: 18, bold: true, color: COLORS.dark },
			small: { fontSize: 9, color: COLORS.secondary },
			tableHeader: { fillColor: COLORS.light, bold: true },
			tableCell: {},
			footerLeft: { fontSize: 8, color: COLORS.gray },
			footerRight: { fontSize: 8, color: COLORS.gray },
			chipSuccess: { color: COLORS.success, bold: true },
			chipDanger: { color: COLORS.danger, bold: true },
		};
	}

	// ----- Sections -----
	private coverPage(report: ReportData, user?: GeneratePDFOptions['user'], company?: GeneratePDFOptions['company']): Content {
		const title = 'Manufacturing Report';
		const subtitle = 'From Orders to Output – All in One Flow.';
		const period = `${this.formatDate(report.period.start)} — ${this.formatDate(report.period.end)}`;
		const generatedAt = this.formatDateTime(report.generatedAt);
		const generatedBy = user?.name || user?.email || 'Unknown User';
		const watermark = company?.name || 'Your Company';

		return {
			stack: [
				{
					canvas: [
						{ type: 'rect', x: 0, y: 0, w: 515, h: 740, color: '#ffffff' },
					],
				},
				company?.logoBase64
					? { image: company.logoBase64, width: 100, alignment: 'center', margin: [0, 30, 0, 10] }
					: { text: 'LOGO', alignment: 'center', color: COLORS.gray, margin: [0, 30, 0, 10] },
				{ text: title, style: 'h1', alignment: 'center' },
				{ text: subtitle, style: 'sub', alignment: 'center', margin: [0, 4, 0, 16] },
				{
					columns: [
						{ text: `Period\n${period}`, style: 'small' },
						{ text: `Generated By\n${generatedBy}`, style: 'small', alignment: 'center' },
						{ text: `Generated At\n${generatedAt}`, style: 'small', alignment: 'right' },
					],
					margin: [0, 16, 0, 0],
				},
				{ text: ' ', margin: [0, 40, 0, 0] },
				{
					svg: this.watermarkSVG(watermark),
					width: 400,
					alignment: 'center',
					opacity: 0.06,
				},
				{ text: ' ', pageBreak: 'after' as any },
			],
			margin: [0, 0, 0, 0],
		};
	}

	private execSummary(report: ReportData): Content {
		const k = report.kpis || {};
		const totalMOs = k.newManufacturingOrders?.count || k.manufacturingOrderSummary?.total || 0;
		const byStatus = k.newManufacturingOrders?.byStatus || k.manufacturingOrderSummary || {};
		const completedPct = Math.round((k.workOrderCompletionRate || 0));
		const avgLead = k.averageLeadTimes?.averageLeadTimeDays || 0;
		const delayedPct = this.computeDelayedPct(byStatus);

		const kpiCard = (label: string, value: string | number, color = COLORS.primary): Content => ({
			stack: [
				{ text: label, style: 'small' },
				{ text: String(value), style: 'kpiValue', color },
			],
			margin: [0, 0, 0, 8],
		});

		return {
			columns: [
				kpiCard('Total Manufacturing Orders', totalMOs),
				kpiCard('Orders Completed %', `${completedPct}%`, COLORS.success),
				kpiCard('Average Lead Time', `${avgLead} days`, COLORS.info),
				kpiCard('Delayed Orders %', `${delayedPct}%`, COLORS.danger),
			],
			columnGap: 20,
		};
	}

	private execCharts(report: ReportData): Content {
		const k = report.kpis || {};
		const byStatus = k.newManufacturingOrders?.byStatus || k.manufacturingOrderSummary || {};
		const monthly = k.trends?.monthly || k.productivity?.monthly || [];

		const pie = this.pieSVG(Object.entries(byStatus).map(([status, count]) => ({ label: status, value: count as number })), 180);
		const bars = this.barSVG((monthly as any[]).map((m) => ({ label: m.label || m.month || '', value: m.value || m.count || 0 })), 260, 140);

		return {
			columns: [
				{ stack: [{ text: 'Status Breakdown', style: 'h3', margin: [0, 0, 0, 6] }, { svg: pie, width: 200 }] },
				{ stack: [{ text: 'Monthly Order Counts', style: 'h3', margin: [0, 0, 0, 6] }, { svg: bars, width: 300 }] },
			],
			columnGap: 20,
			margin: [0, 12, 0, 0],
		};
	}

	private moTable(orders: Dataset['orders']): Content {
		const header = [
			{ text: 'Product', style: 'tableHeader' },
			{ text: 'Qty', style: 'tableHeader' },
			{ text: 'Assigned To', style: 'tableHeader' },
			{ text: 'Start', style: 'tableHeader' },
			{ text: 'Deadline', style: 'tableHeader' },
			{ text: 'Status', style: 'tableHeader' },
			{ text: 'On-time?', style: 'tableHeader' },
			{ text: 'Progress', style: 'tableHeader' },
		];

		const rows = orders.map((mo) => {
			const overdue = !!(mo.deadline && moment(mo.deadline).isBefore(moment()) && mo.status !== OrderStatus.done);
			const progress = this.moCompletionPct(mo);
			const ontime = overdue ? 'Delayed' : 'On-time';
			return [
				mo.product?.name || '-',
				mo.quantity ?? '-',
				mo.assignedTo?.name || '-',
				mo.scheduleStartDate ? this.formatDate(mo.scheduleStartDate as any) : '-',
				mo.deadline ? this.formatDate(mo.deadline as any) : '-',
				this.prettyStatus(mo.status),
				{ text: ontime, style: overdue ? 'chipDanger' : 'chipSuccess' },
				{ svg: this.progressBarSVG(progress, 90, 10, overdue), width: 100 },
			];
		});

		return {
			table: {
				headerRows: 1,
				widths: ['*', 40, '*', 60, 60, 60, 50, 100],
				body: [header, ...rows],
			},
			layout: 'lightHorizontalLines',
			fontSize: 9,
		};
	}

	private workOrdersSection(orders: Dataset['orders']): Content[] {
		const sections: Content[] = [];
		for (const mo of orders) {
			const wos = mo.workOrders || [];
			if (!wos.length) continue;
			const gantt = this.ganttSVG(wos, mo.scheduleStartDate || mo.createdAt, mo.deadline || undefined, 480, 80);
			const bottleneck = this.bottleneckWO(wos);
			sections.push({
				stack: [
					{ text: `${mo.product?.name || 'MO'} — WO Timeline`, style: 'h3', margin: [0, 10, 0, 4] },
					{ svg: gantt, width: 520 },
					bottleneck
						? { text: `Bottleneck: ${bottleneck.operation} (${bottleneck.durationMins}m planned, ${bottleneck.durationDoneMins}m done)`, style: 'small', color: COLORS.danger, margin: [0, 4, 0, 0] }
						: { text: 'No bottlenecks detected', style: 'small', color: COLORS.secondary },
				],
				margin: [0, 8, 0, 6],
			});
		}
		return sections;
	}

	private workCentersSection(workCenters: Dataset['workCenters']): Content {
		const data = workCenters.map((wc) => {
			const hoursUsed = wc.workOrders.reduce((sum, w) => sum + (w.durationDoneMins || 0) / 60, 0);
			const capacity = (wc.capacityPerHour || 0) * 8; // assume 8h window
			const utilization = capacity > 0 ? Math.min(100, Math.round((hoursUsed / capacity) * 100)) : 0;
			const cost = (wc.costPerHour || 0) * hoursUsed;
			return { label: wc.name, utilization, cost };
		});

		const utilBars = this.barSVG(data.map(d => ({ label: d.label, value: d.utilization })), 420, 140, '%');
		const costPie = this.pieSVG(data.map(d => ({ label: d.label, value: d.cost })), 180);

		return {
			columns: [
				{ stack: [{ text: 'Utilization %', style: 'h3', margin: [0, 0, 0, 6] }, { svg: utilBars, width: 440 }] },
				{ stack: [{ text: 'Cost Contribution', style: 'h3', margin: [0, 0, 0, 6] }, { svg: costPie, width: 200 }] },
			],
			columnGap: 20,
		};
	}

	private stockSection(dataset: Dataset): Content {
		const byProduct = new Map<number, { name: string; in: number; out: number }>();
		(dataset.ledger || []).forEach((l) => {
			const entry = byProduct.get(l.productId) || { name: l.product.name, in: 0, out: 0 };
			if (l.movementType === 'in') entry.in += l.quantity;
			else entry.out += l.quantity;
			byProduct.set(l.productId, entry);
		});
		const movementRows = Array.from(byProduct.values()).map(v => [v.name, v.in, v.out, v.in - v.out]);

		const stockRows = (dataset.stocks || []).map((s) => {
			const low = s.quantity < 10; // default threshold
			return [s.product.name, s.quantity, low ? { text: 'LOW', color: COLORS.danger, bold: true } : 'OK'];
		});

		const efficiency = this.efficiencyRatio(dataset);
		const sankey = this.sankeySVG(dataset, 500, 160);

		return {
			stack: [
				{ text: 'Movements', style: 'h3', margin: [0, 0, 0, 6] },
				{ table: { headerRows: 1, widths: ['*', 60, 60, 60], body: [[{ text: 'Product', style: 'tableHeader' }, { text: 'In', style: 'tableHeader' }, { text: 'Out', style: 'tableHeader' }, { text: 'Net', style: 'tableHeader' }], ...movementRows] }, layout: 'lightHorizontalLines' },
				{ text: '\nCurrent Stock Levels', style: 'h3', margin: [0, 8, 0, 6] },
				{ table: { headerRows: 1, widths: ['*', 60, 60], body: [[{ text: 'Product', style: 'tableHeader' }, { text: 'Qty', style: 'tableHeader' }, { text: 'Alert', style: 'tableHeader' }], ...stockRows] }, layout: 'lightHorizontalLines' },
				{ text: `\nEfficiency Ratio (Consumption -> Output): ${Math.round(efficiency * 100)}%`, style: 'small' },
				{ text: '\nMaterial Flow (Sankey-style)', style: 'h3', margin: [0, 4, 0, 6] },
				{ svg: sankey, width: 520 },
			],
		};
	}

	private bomSection(dataset: Dataset): Content[] {
		const sections: Content[] = [];
		for (const b of dataset.bom) {
			const comps = b.components.map((c) => [c.component.name, c.quantity, c.operation || '-', c.opDurationMins ?? '-']);
			sections.push({
				text: b.product.name,
				style: 'h3',
				margin: [0, 8, 0, 4],
			});
			sections.push({
				table: {
					headerRows: 1,
					widths: ['*', 60, '*', 60],
					body: [
						[
							{ text: 'Component', style: 'tableHeader' },
							{ text: 'Qty', style: 'tableHeader' },
							{ text: 'Operation', style: 'tableHeader' },
							{ text: 'Dur (m)', style: 'tableHeader' },
						],
						...comps,
					],
				},
				layout: 'lightHorizontalLines',
			});
		}
		return sections;
	}

	private insightsSection(dataset: Dataset): Content {
		const throughput = this.throughputTrend(dataset);
		const delays = this.delayAnalysis(dataset);
		const operatorPerf = this.operatorPerformance(dataset);
		const suggestions = this.suggestions(dataset, delays);

		return {
			columns: [
				{ stack: [
					{ text: 'Throughput (orders/mo)', style: 'h3', margin: [0, 0, 0, 6] },
					{ svg: this.lineSVG(throughput, 240, 120), width: 260 },
					{ text: `Avg: ${this.avg(throughput.map(d => d.value)).toFixed(1)}`, style: 'small', margin: [0, 4, 0, 0] },
				] },
				{ stack: [
					{ text: 'Order Delay Analysis', style: 'h3', margin: [0, 0, 0, 6] },
					{ text: `Avg delay: ${delays.avgDelayDays.toFixed(1)} days`, style: 'small' },
					{ text: `Worst delay: ${delays.worstDelayDays.toFixed(1)} days`, style: 'small' },
					{ text: `Delayed %: ${delays.delayedPct}%`, style: 'small' },
				] },
				{ stack: [
					{ text: 'Operator Performance', style: 'h3', margin: [0, 0, 0, 6] },
					{ text: operatorPerf.map((o) => `${o.name}: ${o.completed} tasks, avg ${o.avgDurationMins}m`).join('\n'), style: 'small' },
					{ text: '\nTop Suggestions', style: 'h3', margin: [0, 6, 0, 4] },
					{ ul: suggestions.map(s => s), style: 'small' },
				] },
			],
			columnGap: 16,
		};
	}

	private appendix(dataset: Dataset, report: ReportData): Content {
		const truncate = (str: string, max = 1000) => (str.length > max ? str.slice(0, max) + '…' : str);
		return {
			stack: [
				{ text: 'Raw JSON (truncated)', style: 'small' },
				{ text: truncate(JSON.stringify({ orders: dataset.orders?.length, workCenters: dataset.workCenters?.length, ledger: dataset.ledger?.length }, null, 2)), fontSize: 8, margin: [0, 4, 0, 0] },
				{ text: 'Report KPIs', style: 'small', margin: [0, 8, 0, 0] },
				{ text: truncate(JSON.stringify(report.kpis, null, 2)), fontSize: 8 },
			],
		};
	}

	// ----- Helpers & analytics -----
	private prettyStatus(s: OrderStatus): string {
		return (
			{
				draft: 'Draft',
				confirmed: 'Confirmed',
				in_progress: 'In Progress',
				to_close: 'To Close',
				done: 'Done',
				cancelled: 'Cancelled',
			} as any
		)[s] as string;
	}

	private moCompletionPct(mo: ManufacturingOrder & { workOrders: WorkOrder[] }): number {
		const total = mo.workOrders?.length || 0;
		if (!total) return 0;
		const done = mo.workOrders.filter(w => w.status === WorkStatus.completed).length;
		return Math.round((done / total) * 100);
	}

	private avgLeadTimeDays(orders: ManufacturingOrder[]): number {
		const durations = orders
			.filter(o => o.scheduleStartDate && o.deadline)
			.map(o => moment(o.deadline!).diff(moment(o.scheduleStartDate!), 'days'));
		return durations.length ? this.avg(durations) : 0;
	}

	private resourceUtilization(wc: WorkCenter & { workOrders: WorkOrder[] }): number {
		const usedHours = wc.workOrders.reduce((sum, w) => sum + (w.durationDoneMins || 0) / 60, 0);
		const capacity = (wc.capacityPerHour || 0) * 8;
		return capacity ? Math.min(100, Math.round((usedHours / capacity) * 100)) : 0;
	}

	private costPerFinishedUnit(mo: ManufacturingOrder & { workOrders: (WorkOrder & { workCenter: WorkCenter | null })[] }): number {
		const hours = mo.workOrders.reduce((sum, w) => sum + (w.durationDoneMins || 0) / 60, 0);
		const cost = mo.workOrders.reduce((sum, w) => sum + ((w.workCenter?.costPerHour || 0) * (w.durationDoneMins || 0) / 60), 0);
		const qty = mo.quantity || 1;
		return qty ? +(cost / qty).toFixed(2) : 0;
	}

	private efficiencyRatio(dataset: Dataset): number {
		// crude: finished goods in / raw materials out
		const totalIn = (dataset.ledger || []).filter(l => l.movementType === 'in').reduce((s, l) => s + l.quantity, 0);
		const totalOut = (dataset.ledger || []).filter(l => l.movementType === 'out').reduce((s, l) => s + l.quantity, 0);
		return totalOut ? Math.min(1, totalIn / totalOut) : 0;
	}

	private throughputTrend(dataset: Dataset): { label: string; value: number }[] {
		const byMonth = new Map<string, number>();
		for (const mo of dataset.orders || []) {
			const key = moment(mo.createdAt).format('YYYY-MM');
			byMonth.set(key, (byMonth.get(key) || 0) + 1);
		}
		return Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value }));
	}

	private delayAnalysis(dataset: Dataset) {
		const delays: number[] = [];
		let delayedCount = 0;
		for (const mo of dataset.orders || []) {
			if (!mo.deadline || !mo.scheduleStartDate) continue;
			const plannedDays = moment(mo.deadline).diff(moment(mo.scheduleStartDate), 'days');
			const doneWO = mo.workOrders.filter(w => w.status === WorkStatus.completed);
			const actualMins = doneWO.reduce((s, w) => s + (w.durationDoneMins || 0), 0);
			const actualDays = actualMins / 60 / 8; // assume 8h/day
			const delay = Math.max(0, actualDays - plannedDays);
			if (delay > 0.1) delayedCount++;
			delays.push(delay);
		}
		const avgDelayDays = delays.length ? this.avg(delays) : 0;
		const worstDelayDays = delays.length ? Math.max(...delays) : 0;
		const delayedPct = (dataset.orders?.length || 0) ? Math.round((delayedCount / (dataset.orders!.length)) * 100) : 0;
		return { avgDelayDays, worstDelayDays, delayedPct };
	}

	private operatorPerformance(dataset: Dataset) {
		const map = new Map<number, { name: string; total: number; completed: number; durations: number[] }>();
			for (const mo of dataset.orders || []) {
			for (const w of mo.workOrders || []) {
				const id = w.assignedToId || -1;
				const name = (w as any).assignedTo?.name || 'Unassigned';
					const e = map.get(id) || { name, total: 0, completed: 0, durations: [] as number[] };
				e.total++;
				if (w.status === WorkStatus.completed) {
					e.completed++;
					e.durations.push(w.durationDoneMins || 0);
				}
				map.set(id, e);
			}
		}
		return Array.from(map.values()).map((v) => ({ name: v.name, tasks: v.total, completed: v.completed, avgDurationMins: Math.round(this.avg(v.durations || [0])) }));
	}

	private suggestions(dataset: Dataset, delays: { avgDelayDays: number; worstDelayDays: number; delayedPct: number }): string[] {
		const s: string[] = [];
		if (delays.delayedPct > 25) s.push('High delay rate — consider rebalancing workloads across work centers.');
		const wcUtil = (dataset.workCenters || []).map(wc => this.resourceUtilization({ ...wc, workOrders: wc.workOrders } as any));
		if (wcUtil.some(u => u > 90)) s.push('Overutilized work centers — schedule preventative downtime or add capacity.');
		const costliest = (dataset.orders || []).map(mo => ({ p: mo.product?.name || '-', c: this.costPerFinishedUnit(mo as any) })).sort((a, b) => b.c - a.c)[0];
		if (costliest) s.push(`Focus cost reduction on ${costliest.p} (highest cost per unit).`);
		if (!s.length) s.push('No critical bottlenecks detected. Maintain current allocation.');
		return s;
	}

	private bottleneckWO(wos: WorkOrder[]): WorkOrder | undefined {
		return wos.sort((a, b) => (b.durationDoneMins || 0) - (a.durationDoneMins || 0))[0];
	}

	private computeDelayedPct(byStatus: Record<string, number>): number {
		const delayed = (byStatus['to_close'] || 0) + (byStatus['in_progress'] || 0) + (byStatus['confirmed'] || 0);
		const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
		return total ? Math.round((delayed / total) * 100) : 0;
	}

	private avg(nums: number[]): number {
		const arr = nums.filter(n => !isNaN(n));
		return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
	}

	private formatDate(d: string | Date): string {
		return moment(d).format('YYYY-MM-DD');
	}
	private formatDateTime(d: string | Date): string {
		return moment(d).format('YYYY-MM-DD HH:mm');
	}

	// ----- SVG generators (charts/visuals) -----
	private watermarkSVG(text: string): string {
		return `
			<svg width="400" height="120" xmlns="http://www.w3.org/2000/svg">
				<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="42" font-weight="bold" fill="${COLORS.primary}">${text}</text>
			</svg>`;
	}

	private progressBarSVG(pct: number, width = 100, height = 10, danger = false): string {
		const w = Math.max(0, Math.min(100, pct));
		const fill = danger ? COLORS.danger : COLORS.success;
		return `
			<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
				<rect x="0" y="0" width="${width}" height="${height}" fill="${COLORS.light}" rx="4"/>
				<rect x="0" y="0" width="${(width * w) / 100}" height="${height}" fill="${fill}" rx="4"/>
			</svg>`;
	}

	private pieSVG(data: { label: string; value: number }[], size = 160): string {
		const total = data.reduce((a, b) => a + (b.value || 0), 0) || 1;
		const radius = size / 2;
		const cx = radius, cy = radius;
		const palette = [COLORS.primary, COLORS.info, COLORS.success, COLORS.warning, COLORS.danger, COLORS.secondary, COLORS.gray];
		let angle = -Math.PI / 2;
		const paths: string[] = [];
		data.forEach((d, i) => {
			const slice = (d.value || 0) / total * Math.PI * 2;
			const x1 = cx + radius * Math.cos(angle);
			const y1 = cy + radius * Math.sin(angle);
			const x2 = cx + radius * Math.cos(angle + slice);
			const y2 = cy + radius * Math.sin(angle + slice);
			const large = slice > Math.PI ? 1 : 0;
			const color = palette[i % palette.length];
			const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
			paths.push(`<path d="${path}" fill="${color}"/>`);
			angle += slice;
		});
		return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${paths.join('')}</svg>`;
	}

	private barSVG(data: { label: string; value: number }[], width = 300, height = 160, suffix = ''): string {
		const max = Math.max(1, ...data.map(d => d.value || 0));
		const pad = 24; const w = width - pad * 2; const h = height - pad * 2;
		const barW = w / (data.length || 1) - 8;
		const rects: string[] = [];
		data.forEach((d, i) => {
			const x = pad + i * (barW + 8);
			const bh = (h * (d.value || 0)) / max;
			const y = pad + (h - bh);
			rects.push(`<rect x="${x}" y="${y}" width="${barW}" height="${bh}" fill="${COLORS.primary}" rx="3"/>`);
		});
		return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${rects.join('')}</svg>`;
	}

	private lineSVG(data: { label: string; value: number }[], width = 260, height = 120): string {
		if (!data.length) return `<svg width="${width}" height="${height}"/>`;
		const max = Math.max(...data.map(d => d.value));
		const min = Math.min(...data.map(d => d.value));
		const pad = 20; const w = width - pad * 2; const h = height - pad * 2;
		const step = w / Math.max(1, data.length - 1);
		const points = data.map((d, i) => {
			const x = pad + i * step;
			const y = pad + h - (h * (d.value - min)) / Math.max(1, max - min);
			return `${x},${y}`;
		}).join(' ');
		return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><polyline fill="none" stroke="${COLORS.info}" stroke-width="2" points="${points}"/></svg>`;
	}

	private ganttSVG(wos: WorkOrder[], start: Date, deadline?: Date, width = 500, height = 80): string {
		const pad = 20; const w = width - pad * 2; const h = height - pad * 2; const barH = Math.max(10, Math.floor(h / Math.max(1, wos.length)) - 6);
		const minT = moment(start);
		const maxT = deadline ? moment(deadline) : moment(start).add(1, 'month');
		const total = Math.max(1, maxT.diff(minT, 'minutes'));
		const rects: string[] = [];
		wos.forEach((wo, idx) => {
			const planned = (wo.durationMins || 0);
			const done = (wo.durationDoneMins || 0);
			const px = pad + (w * 0) / total;
			const py = pad + idx * (barH + 6);
			const pw = (w * planned) / total; // scaled by minutes within window
			const dw = (w * Math.min(done, planned)) / total;
			rects.push(`<rect x="${px}" y="${py}" width="${Math.max(2, pw)}" height="${barH}" fill="${COLORS.light}" rx="3"/>`);
			rects.push(`<rect x="${px}" y="${py}" width="${Math.max(2, dw)}" height="${barH}" fill="${COLORS.success}" rx="3"/>`);
		});
		return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${rects.join('')}</svg>`;
	}

	private sankeySVG(dataset: Dataset, width = 500, height = 160): string {
		// Minimalistic Sankey-style: three columns (Raw -> MOs -> Finished)
		const padX = 40; const padY = 20; const colW = (width - padX * 2) / 3; const nodeW = 14; const h = height - padY * 2;
		const totalOut = (dataset.ledger || []).filter(l => l.movementType === 'out').reduce((s, l) => s + l.quantity, 0);
		const totalIn = (dataset.ledger || []).filter(l => l.movementType === 'in').reduce((s, l) => s + l.quantity, 0);
		const outH = Math.max(6, (h * totalOut) / Math.max(1, totalOut + totalIn));
		const inH = Math.max(6, (h * totalIn) / Math.max(1, totalOut + totalIn));
		const rawX = padX, moX = padX + colW, finX = padX + colW * 2;
		const rawY = padY + (h - outH) / 2, finY = padY + (h - inH) / 2;
		const path = `M ${rawX + nodeW} ${rawY + outH / 2} C ${rawX + nodeW + 50} ${rawY + outH / 2}, ${moX - 50} ${finY + inH / 2}, ${moX} ${finY + inH / 2}
								 S ${finX - 50} ${finY + inH / 2}, ${finX} ${finY + inH / 2}`;
		return `
			<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
				<rect x="${rawX}" y="${rawY}" width="${nodeW}" height="${outH}" fill="${COLORS.warning}" rx="3"/>
				<rect x="${finX}" y="${finY}" width="${nodeW}" height="${inH}" fill="${COLORS.success}" rx="3"/>
				<path d="${path}" fill="none" stroke="${COLORS.primary}" stroke-width="8" stroke-opacity="0.5"/>
			</svg>`;
	}
}