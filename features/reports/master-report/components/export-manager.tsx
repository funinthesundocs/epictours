"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, Copy, ChevronRight, Printer, Bus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MasterReportRow } from "../types";
import { ColumnConfig, REPORT_COLUMNS } from "./column-picker";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportManagerProps {
    data: MasterReportRow[];
    visibleColumns: string[];
    vehicleAssignments?: Map<string, Set<string>>;
    userName?: string;
    orgName?: string;
}

// Helper to get display value for a cell
function getCellDisplayValue(row: MasterReportRow, key: string): string {
    const value = row[key as keyof MasterReportRow];

    if (value === null || value === undefined) return "-";

    // Format specific fields
    switch (key) {
        case "total_amount":
        case "amount_paid":
        case "balance_due":
        case "customer_total_value":
            return `$${Number(value).toFixed(2)}`;
        case "booking_created_at":
        case "start_date":
            return new Date(value as string).toLocaleDateString();
        case "payment_status":
            // Humanize snake_case
            return String(value)
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        default:
            return String(value);
    }
}

export function ExportManager({ data, visibleColumns, vehicleAssignments, userName, orgName }: ExportManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showPdfOptions, setShowPdfOptions] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Build smart filename: "Manifest - ACI - Dirk - 2-7-26"
    const buildFilename = (ext: string): string => {
        const now = new Date();
        const dateStr = `${now.getMonth() + 1}-${now.getDate()}-${String(now.getFullYear()).slice(-2)}`;
        const orgInitials = orgName
            ? orgName.split(/\s+/).map(w => w.charAt(0).toUpperCase()).join('')
            : 'RPT';
        const firstName = userName?.split(/\s+/)[0] || 'Export';
        return `Manifest - ${orgInitials} - ${firstName} - ${dateStr}.${ext}`;
    };

    // Columns that can be summed for totals row
    const SUMMABLE_COLUMNS = new Set([
        "pax_count",
        "total_amount",
        "amount_paid",
        "balance_due",
        "customer_total_value",
        "max_capacity"
    ]);

    // Get visible column configs in order
    const visibleColumnConfigs = visibleColumns
        .map(key => REPORT_COLUMNS.find(c => c.key === key))
        .filter((c): c is ColumnConfig => c !== undefined);

    // Generate totals row for exports
    const getTotalsRow = (): string[] => {
        return visibleColumnConfigs.map(col => {
            if (SUMMABLE_COLUMNS.has(col.key)) {
                const sum = data.reduce((acc, row) => {
                    const value = row[col.key as keyof MasterReportRow];
                    const num = typeof value === 'number' ? value : parseFloat(String(value) || '0');
                    return acc + (isNaN(num) ? 0 : num);
                }, 0);

                // Format currency columns
                if (['total_amount', 'amount_paid', 'balance_due', 'customer_total_value'].includes(col.key)) {
                    return `$${sum.toFixed(2)}`;
                }
                return sum.toString();
            }
            return "";
        });
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setShowPdfOptions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Shared PDF builder — returns the jsPDF doc with title header, table, and footers
    const buildPdfDoc = (orientation: "portrait" | "landscape"): jsPDF => {
        const doc = new jsPDF({
            orientation,
            unit: "pt",
            format: "letter"
        });

        const pageWidth = orientation === 'landscape' ? 792 : 612;
        const pageHeight = orientation === 'landscape' ? 612 : 792;
        const marginLeft = 30;
        const marginRight = 30;
        const availableWidth = pageWidth - marginLeft - marginRight;

        // ── Title Header ──
        const now = new Date();
        const dateFormatted = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const firstName = userName?.split(/\s+/)[0] || '';
        const orgInitials = orgName
            ? orgName.split(/\s+/).map(w => w.charAt(0).toUpperCase()).join('')
            : 'ET';

        // Placeholder Logo: rounded dark square with org initials
        const logoSize = 36;
        const logoX = marginLeft;
        const logoY = 14;
        doc.setFillColor(60, 60, 60);
        doc.roundedRect(logoX, logoY, logoSize, logoSize, 4, 4, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(orgInitials, logoX + logoSize / 2, logoY + logoSize / 2 + 5, { align: 'center' });

        // Title to the right of logo
        const textStartX = logoX + logoSize + 12;
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Transportation Manifest', textStartX, 30);

        // Subtitle: org name + date
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const subtitle = [orgName, dateFormatted].filter(Boolean).join('  \u2022  ');
        doc.text(subtitle, textStartX, 42);

        // Prepared-by line
        if (firstName) {
            doc.setFontSize(8);
            doc.text(`Prepared by ${firstName}`, textStartX, 52);
        }

        // ── Summary Stats (right-aligned) ──
        const uniqueVehicles = new Set<string>();
        const uniqueRoutes = new Set<string>();
        let totalPax = 0;
        data.forEach(row => {
            if (row.vehicle_name) row.vehicle_name.split(',').forEach(v => uniqueVehicles.add(v.trim()));
            if ((row as any).route_name) String((row as any).route_name).split(',').forEach((r: string) => uniqueRoutes.add(r.trim()));
            totalPax += (row.pax_count as number) || 0;
        });
        const statsLine = `Total Passengers: ${totalPax}   |   Vehicles: ${uniqueVehicles.size}   |   Bookings: ${data.length}`;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text(statsLine, pageWidth - marginRight, 52, { align: 'right' });

        // Divider line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.75);
        doc.line(marginLeft, 60, pageWidth - marginRight, 60);

        // Reset text color
        doc.setTextColor(0, 0, 0);

        // ── Table Setup ──
        const headers = visibleColumnConfigs.map(c => c.label);
        const numCols = visibleColumnConfigs.length;
        const baseFontSize = numCols > 15 ? 5 : numCols > 10 ? 6 : numCols > 6 ? 7 : 8;
        const baseMinCellHeight = Math.round(baseFontSize * 2.4 * 1.35);

        const columnStyles: { [key: number]: any } = {};
        visibleColumnConfigs.forEach((col, index) => {
            columnStyles[index] = { halign: col.align || 'left' };
        });
        const vehicleColIndex = visibleColumnConfigs.findIndex(c => c.key === 'vehicle_name');
        if (vehicleColIndex >= 0) {
            columnStyles[vehicleColIndex] = { ...columnStyles[vehicleColIndex], cellWidth: 'wrap' as any };
        }

        const tableStyleBase = {
            fontSize: baseFontSize, cellPadding: 3,
            lineColor: [0, 0, 0] as [number, number, number], lineWidth: 0.25,
            textColor: [0, 0, 0] as [number, number, number], fillColor: [255, 255, 255] as [number, number, number],
            overflow: 'linebreak' as const, minCellHeight: baseMinCellHeight,
            valign: 'middle' as const,
        };
        const headStyleBase = {
            fillColor: [245, 245, 245] as [number, number, number],
            textColor: [0, 0, 0] as [number, number, number], fontStyle: 'bold' as const,
            lineWidth: { bottom: 1.5, top: 0.25, left: 0.25, right: 0.25 },
            lineColor: [0, 0, 0] as [number, number, number],
            cellPadding: { top: 3, right: 2, bottom: 4, left: 2 },
        };

        // Check if every booking has a vehicle assignment
        const allAssigned = vehicleAssignments && data.length > 0 &&
            data.every(row => {
                const selected = vehicleAssignments.get(row.booking_id);
                return selected && selected.size > 0;
            });

        // Helper: build subtotal row for a subset of data
        const getSubtotalRow = (subset: MasterReportRow[], label: string): string[] => {
            return visibleColumnConfigs.map(col => {
                if (SUMMABLE_COLUMNS.has(col.key)) {
                    const sum = subset.reduce((acc, row) => {
                        const value = row[col.key as keyof MasterReportRow];
                        const num = typeof value === 'number' ? value : parseFloat(String(value) || '0');
                        return acc + (isNaN(num) ? 0 : num);
                    }, 0);
                    if (['total_amount', 'amount_paid', 'balance_due', 'customer_total_value'].includes(col.key)) {
                        return `$${sum.toFixed(2)}`;
                    }
                    return sum.toString();
                }
                return '';
            });
        };

        if (allAssigned) {
            // ── GROUPED MODE: separate table per vehicle ──
            const vehicleGroups = new Map<string, MasterReportRow[]>();
            data.forEach(row => {
                const selected = vehicleAssignments!.get(row.booking_id)!;
                selected.forEach(vName => {
                    if (!vehicleGroups.has(vName)) vehicleGroups.set(vName, []);
                    vehicleGroups.get(vName)!.push(row);
                });
            });

            let currentY = 68;

            // Build all rows (all vehicles) to compute natural column widths
            const allDataRows = data.map(row =>
                visibleColumnConfigs.map(c => getCellDisplayValue(row, c.key))
            );

            // Render a hidden table off-screen to capture autotable's computed widths
            const tempDoc = new jsPDF({ orientation, unit: 'pt', format: 'letter' });
            autoTable(tempDoc, {
                head: [headers],
                body: allDataRows,
                startY: 68,
                margin: { top: 68, right: marginRight, bottom: 50, left: marginLeft },
                tableWidth: availableWidth,
                styles: tableStyleBase,
                headStyles: headStyleBase,
                columnStyles,
            });

            // Capture the computed column widths from the hidden table
            const computedWidths: number[] = (tempDoc as any).lastAutoTable.columns.map(
                (col: any) => col.width
            );
            const fixedColumnStyles: { [key: number]: any } = {};
            visibleColumnConfigs.forEach((col, index) => {
                fixedColumnStyles[index] = {
                    halign: col.align || 'left',
                    cellWidth: computedWidths[index],
                };
            });

            vehicleGroups.forEach((groupRows, vehicleName) => {
                // Data rows for this group
                const rows = groupRows.map(row =>
                    visibleColumnConfigs.map(c => {
                        if (c.key === 'vehicle_name') return vehicleName;
                        return getCellDisplayValue(row, c.key);
                    })
                );

                // Add subtotal row
                const subtotalRow = getSubtotalRow(groupRows, '');
                const allRows = [...rows, subtotalRow];

                autoTable(doc, {
                    head: [headers],
                    body: allRows,
                    startY: currentY,
                    margin: { top: 68, right: marginRight, bottom: 50, left: marginLeft },
                    tableWidth: availableWidth,
                    styles: tableStyleBase,
                    headStyles: headStyleBase,
                    columnStyles: { ...fixedColumnStyles },
                    alternateRowStyles: { fillColor: [250, 250, 250] as [number, number, number] },
                    didParseCell: (cellData: any) => {
                        // Subtotal row (last row): bold, light gray
                        if (cellData.section === 'body' && cellData.row.index === allRows.length - 1) {
                            cellData.cell.styles.fontStyle = 'bold';
                            cellData.cell.styles.fillColor = [235, 235, 235];
                            cellData.cell.styles.lineWidth = { top: 0.75, bottom: 0.25, left: 0.25, right: 0.25 };
                        }
                    },
                    tableLineColor: [0, 0, 0],
                    tableLineWidth: 0.25,
                    showHead: 'everyPage',
                });

                // Get the Y position after this table for spacing
                currentY = (doc as any).lastAutoTable.finalY + 16;
            });
        } else {
            // ── FLAT MODE: standard ungrouped list ──
            const rows = data.map(row =>
                visibleColumnConfigs.map(c => {
                    if (c.key === 'vehicle_name' && vehicleAssignments && row.vehicle_name) {
                        const selected = vehicleAssignments.get(row.booking_id);
                        if (selected && selected.size > 0) {
                            const vehicles = row.vehicle_name.split(',').map(v => v.trim()).filter(v => selected.has(v));
                            return vehicles.join(', ') || getCellDisplayValue(row, c.key);
                        }
                    }
                    return getCellDisplayValue(row, c.key);
                })
            );

            const totalsRow = getTotalsRow();
            const allRows = [...rows, totalsRow];

            autoTable(doc, {
                head: [headers],
                body: allRows,
                startY: 68,
                margin: { top: 68, right: marginRight, bottom: 50, left: marginLeft },
                tableWidth: availableWidth,
                styles: tableStyleBase,
                headStyles: headStyleBase,
                columnStyles,
                alternateRowStyles: { fillColor: [250, 250, 250] as [number, number, number] },
                didParseCell: (cellData: any) => {
                    if (cellData.section === 'body' && cellData.row.index === allRows.length - 1) {
                        cellData.cell.styles.fontStyle = 'bold';
                        cellData.cell.styles.fillColor = [240, 240, 240];
                        cellData.cell.styles.lineWidth = { top: 1, bottom: 0.25, left: 0.25, right: 0.25 };
                    }
                },
                tableLineColor: [0, 0, 0],
                tableLineWidth: 0.25,
                showHead: 'everyPage',
            });
        }

        // ── Page Footer: "Page X of Y" + timestamp ──
        const totalPages = (doc as any).internal.getNumberOfPages();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
            doc.text(`Generated ${dateFormatted} at ${timeStr}`, pageWidth - marginRight, pageHeight - 20, { align: 'right' });
        }

        // Set document title so browser uses it as print filename
        doc.setProperties({ title: buildFilename('pdf').replace('.pdf', '') });

        return doc;
    };

    // Export to PDF (download)
    const exportToPdf = (orientation: "portrait" | "landscape") => {
        const doc = buildPdfDoc(orientation);
        doc.save(buildFilename('pdf'));
        toast.success("PDF downloaded");
        setIsOpen(false);
        setShowPdfOptions(false);
    };

    // Print Preview - opens PDF in a new browser tab
    const printPreviewPdf = (orientation: "portrait" | "landscape" = "landscape") => {
        const doc = buildPdfDoc(orientation);
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl as unknown as string, '_blank');
        toast.success("Print preview opened in new tab");
        setIsOpen(false);
        setShowPdfOptions(false);
    };

    // Export per-vehicle: one page per assigned vehicle
    const exportByVehicle = () => {
        const vehicleToRows = new Map<string, MasterReportRow[]>();
        data.forEach(row => {
            if (!row.vehicle_name) return;
            const selected = vehicleAssignments?.get(row.booking_id);
            if (selected && selected.size > 0) {
                selected.forEach(vName => {
                    if (!vehicleToRows.has(vName)) vehicleToRows.set(vName, []);
                    vehicleToRows.get(vName)!.push(row);
                });
            } else {
                row.vehicle_name.split(',').forEach(v => {
                    const name = v.trim();
                    if (!vehicleToRows.has(name)) vehicleToRows.set(name, []);
                    vehicleToRows.get(name)!.push(row);
                });
            }
        });

        if (vehicleToRows.size === 0) {
            toast.error('No vehicle data to export');
            return;
        }

        const orientation: "landscape" = "landscape";
        const doc = new jsPDF({ orientation, unit: 'pt', format: 'letter' });
        const pageWidth = 792;
        const pageHeight = 612;
        const marginLeft = 30;
        const marginRight = 30;
        const availableWidth = pageWidth - marginLeft - marginRight;
        const now = new Date();
        const dateFormatted = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const orgInitials = orgName ? orgName.split(/\s+/).map(w => w.charAt(0).toUpperCase()).join('') : 'ET';
        const firstName = userName?.split(/\s+/)[0] || '';

        const headers = visibleColumnConfigs.map(c => c.label);
        const numCols = visibleColumnConfigs.length;
        const baseFontSize = numCols > 15 ? 5 : numCols > 10 ? 6 : numCols > 6 ? 7 : 8;
        const baseMinCellHeight = Math.round(baseFontSize * 2.4 * 1.35);

        const columnStyles: { [key: number]: any } = {};
        visibleColumnConfigs.forEach((col, index) => {
            columnStyles[index] = { halign: col.align || 'left' };
        });
        const vehicleColIndex = visibleColumnConfigs.findIndex(c => c.key === 'vehicle_name');
        if (vehicleColIndex >= 0) {
            columnStyles[vehicleColIndex] = { ...columnStyles[vehicleColIndex], cellWidth: 'wrap' as any };
        }

        const tableStyles = {
            fontSize: baseFontSize, cellPadding: 3,
            lineColor: [0, 0, 0] as [number, number, number], lineWidth: 0.25,
            textColor: [0, 0, 0] as [number, number, number], fillColor: [255, 255, 255] as [number, number, number],
            overflow: 'linebreak' as const, minCellHeight: baseMinCellHeight,
            valign: 'middle' as const,
        };
        const headStyles = {
            fillColor: [245, 245, 245] as [number, number, number],
            textColor: [0, 0, 0] as [number, number, number], fontStyle: 'bold' as const,
            lineWidth: { bottom: 1.5, top: 0.25, left: 0.25, right: 0.25 },
            lineColor: [0, 0, 0] as [number, number, number],
            cellPadding: { top: 3, right: 2, bottom: 4, left: 2 },
        };

        // Helper: subtotal row for a subset
        const getVehicleSubtotal = (subset: MasterReportRow[]): string[] => {
            return visibleColumnConfigs.map(col => {
                if (SUMMABLE_COLUMNS.has(col.key)) {
                    const sum = subset.reduce((acc, row) => {
                        const value = row[col.key as keyof MasterReportRow];
                        const num = typeof value === 'number' ? value : parseFloat(String(value) || '0');
                        return acc + (isNaN(num) ? 0 : num);
                    }, 0);
                    if (['total_amount', 'amount_paid', 'balance_due', 'customer_total_value'].includes(col.key)) {
                        return `$${sum.toFixed(2)}`;
                    }
                    return sum.toString();
                }
                return '';
            });
        };

        let isFirstPage = true;

        vehicleToRows.forEach((vehicleRows, vehicleName) => {
            if (!isFirstPage) doc.addPage();
            isFirstPage = false;

            // ── Header (matches standard buildPdfDoc layout) ──
            // Logo placeholder
            const logoSize = 36;
            const logoX = marginLeft;
            const logoY = 14;
            doc.setFillColor(60, 60, 60);
            doc.roundedRect(logoX, logoY, logoSize, logoSize, 4, 4, 'F');
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(orgInitials, logoX + logoSize / 2, logoY + logoSize / 2 + 5, { align: 'center' });

            // Title with vehicle name
            const textStartX = logoX + logoSize + 12;
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`Transportation Manifest \u2014 ${vehicleName}`, textStartX, 30);

            // Subtitle: org + date
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            const sub = [orgName, dateFormatted].filter(Boolean).join('  \u2022  ');
            doc.text(sub, textStartX, 42);

            // Prepared-by line
            if (firstName) {
                doc.setFontSize(8);
                doc.text(`Prepared by ${firstName}`, textStartX, 52);
            }

            // Stats (right-aligned)
            const vehiclePax = vehicleRows.reduce((sum, r) => sum + ((r.pax_count as number) || 0), 0);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(80, 80, 80);
            doc.text(`Total Passengers: ${vehiclePax}   |   Bookings: ${vehicleRows.length}`, pageWidth - marginRight, 52, { align: 'right' });

            // Divider
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.75);
            doc.line(marginLeft, 60, pageWidth - marginRight, 60);
            doc.setTextColor(0, 0, 0);

            // ── Table ──
            const rows = vehicleRows.map(row =>
                visibleColumnConfigs.map(c => {
                    if (c.key === 'vehicle_name') return vehicleName;
                    return getCellDisplayValue(row, c.key);
                })
            );
            const subtotalRow = getVehicleSubtotal(vehicleRows);
            const allRows = [...rows, subtotalRow];

            autoTable(doc, {
                head: [headers],
                body: allRows,
                startY: 68,
                margin: { top: 68, right: marginRight, bottom: 50, left: marginLeft },
                tableWidth: availableWidth,
                styles: tableStyles,
                headStyles: headStyles,
                columnStyles,
                alternateRowStyles: { fillColor: [250, 250, 250] as [number, number, number] },
                didParseCell: (cellData: any) => {
                    // Totals row (last row): bold, light gray
                    if (cellData.section === 'body' && cellData.row.index === allRows.length - 1) {
                        cellData.cell.styles.fontStyle = 'bold';
                        cellData.cell.styles.fillColor = [235, 235, 235];
                        cellData.cell.styles.lineWidth = { top: 0.75, bottom: 0.25, left: 0.25, right: 0.25 };
                    }
                },
                tableLineColor: [0, 0, 0],
                tableLineWidth: 0.25,
                showHead: 'everyPage',
            });
        });

        // ── Page Footers ──
        const totalPages = (doc as any).internal.getNumberOfPages();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
            doc.text(`Generated ${dateFormatted} at ${timeStr}`, pageWidth - marginRight, pageHeight - 20, { align: 'right' });
        }

        // Set title for print filename
        doc.setProperties({ title: buildFilename('pdf').replace('.pdf', '') });

        const blobUrl = doc.output('bloburl');
        window.open(blobUrl as unknown as string, '_blank');
        toast.success(`Split manifest: ${vehicleToRows.size} vehicle pages`);
        setIsOpen(false);
        setShowPdfOptions(false);
    };

    // Export to CSV
    const exportToCsv = () => {
        const headers = visibleColumnConfigs.map(c => c.label);
        const rows = data.map(row =>
            visibleColumnConfigs.map(c => {
                const val = getCellDisplayValue(row, c.key);
                // Escape quotes and wrap in quotes if contains comma
                if (val.includes(",") || val.includes('"')) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            })
        );

        // Add totals row
        const totalsRow = getTotalsRow().map(val => {
            if (val.includes(",") || val.includes('"')) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        });

        const csv = [headers.join(","), ...rows.map(r => r.join(",")), totalsRow.join(",")].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `master-report-${date}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("CSV downloaded");
        setIsOpen(false);
    };

    // Export to Excel with alignment formatting
    const exportToExcel = () => {
        const headers = visibleColumnConfigs.map(c => c.label);
        const rows = data.map(row =>
            visibleColumnConfigs.map(c => getCellDisplayValue(row, c.key))
        );

        // Add totals row
        const totalsRow = getTotalsRow();

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows, totalsRow]);

        // Apply alignment to columns
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const colConfig = visibleColumnConfigs[C];
            const align = colConfig?.align || 'left';
            const xlsxAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';

            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].s = {
                        alignment: { horizontal: xlsxAlign }
                    };
                }
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Master Report");

        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `master-report-${date}.xlsx`);
        toast.success("Excel file downloaded");
        setIsOpen(false);
    };

    // Copy for spreadsheet (tab-separated for easy pasting into Google Sheets/Excel)
    const copyForSpreadsheet = () => {
        const headers = visibleColumnConfigs.map(c => c.label);
        const rows = data.map(row =>
            visibleColumnConfigs.map(c => getCellDisplayValue(row, c.key))
        );

        // Add totals row
        const totalsRow = getTotalsRow();

        // Tab-separated values - pastes directly into spreadsheet cells
        const tsv = [
            headers.join("\t"),
            ...rows.map(r => r.join("\t")),
            totalsRow.join("\t")
        ].join("\n");

        navigator.clipboard.writeText(tsv);
        toast.success("Copied to clipboard - paste into any spreadsheet");
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-8 px-3 text-sm font-medium bg-muted/50 hover:bg-muted border border-border rounded-lg flex items-center gap-2 transition-colors"
            >
                <Download size={14} />
                Export
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* PDF with inline options */}
                    {!showPdfOptions ? (
                        <button
                            onClick={() => setShowPdfOptions(true)}
                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center justify-between transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <FileText size={14} />
                                PDF
                            </span>
                            <ChevronRight size={14} />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowPdfOptions(false)}
                                className="w-full px-4 py-2 text-xs text-muted-foreground text-left hover:bg-muted/50 flex items-center gap-1 transition-colors"
                            >
                                <ChevronRight size={12} className="rotate-180" />
                                Back
                            </button>
                            <button
                                onClick={() => exportToPdf("portrait")}
                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
                            >
                                <FileText size={14} />
                                PDF - Portrait
                            </button>
                            <button
                                onClick={() => exportToPdf("landscape")}
                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
                            >
                                <FileText size={14} />
                                PDF - Landscape
                            </button>
                            <div className="border-t border-border" />
                            <button
                                onClick={() => printPreviewPdf("landscape")}
                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
                            >
                                <Printer size={14} />
                                Print Preview
                            </button>
                            <div className="border-t border-border" />
                            <button
                                onClick={exportByVehicle}
                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
                            >
                                <Bus size={14} />
                                Print by Vehicle
                            </button>
                        </>
                    )}

                    {!showPdfOptions && (
                        <>

                            <button
                                onClick={exportToCsv}
                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
                            >
                                <FileText size={14} />
                                CSV
                            </button>

                            <button
                                onClick={exportToExcel}
                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
                            >
                                <FileSpreadsheet size={14} />
                                Excel
                            </button>

                            <div className="border-t border-border" />

                            <button
                                onClick={copyForSpreadsheet}
                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2 transition-colors"
                            >
                                <Copy size={14} />
                                Copy for Spreadsheet
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
