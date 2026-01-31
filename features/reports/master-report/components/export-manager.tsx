"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, Copy, ChevronRight } from "lucide-react";
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

export function ExportManager({ data, visibleColumns }: ExportManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showPdfOptions, setShowPdfOptions] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
            return "Total";
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

    // Export to PDF
    const exportToPdf = (orientation: "portrait" | "landscape") => {
        const doc = new jsPDF({
            orientation,
            unit: "pt",
            format: "letter"
        });

        const headers = visibleColumnConfigs.map(c => c.label);
        const rows = data.map(row =>
            visibleColumnConfigs.map(c => getCellDisplayValue(row, c.key))
        );

        // Add totals row
        const totalsRow = getTotalsRow();
        const allRows = [...rows, totalsRow];

        // Build column styles based on alignment configs
        const columnStyles: { [key: number]: { halign: 'left' | 'center' | 'right' } } = {};
        visibleColumnConfigs.forEach((col, index) => {
            const align = col.align || 'left';
            columnStyles[index] = { halign: align };
        });

        // Calculate page width for auto-fit
        const pageWidth = orientation === 'landscape' ? 792 : 612; // Letter size points
        const margins = 60; // 30pt each side
        const availableWidth = pageWidth - margins;

        // Calculate font size to fit all columns (smaller font for more columns)
        const numCols = visibleColumnConfigs.length;
        const baseFontSize = numCols > 15 ? 5 : numCols > 10 ? 6 : numCols > 6 ? 7 : 8;

        autoTable(doc, {
            head: [headers],
            body: allRows,
            startY: 40,
            margin: { top: 40, right: 30, bottom: 40, left: 30 },
            tableWidth: availableWidth, // Force table to fit page width
            styles: {
                fontSize: baseFontSize,
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.25,
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
                overflow: 'linebreak', // Wrap text if needed
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: "bold",
                lineWidth: { bottom: 1.5, top: 0, left: 0.25, right: 0.25 },
                lineColor: [0, 0, 0],
            },
            columnStyles,
            alternateRowStyles: {
                fillColor: [255, 255, 255], // No zebra striping
            },
            tableLineColor: [0, 0, 0],
            tableLineWidth: 0.25,
            showHead: "everyPage",
        });

        const date = new Date().toISOString().split('T')[0];
        doc.save(`master-report-${date}.pdf`);
        toast.success("PDF downloaded");
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
