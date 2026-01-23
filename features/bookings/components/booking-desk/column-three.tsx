"use client";

import { DollarSign, Receipt } from "lucide-react";

import { PricingRate } from "@/features/bookings/types";

interface ColumnThreeProps {
    currentRates: PricingRate[];
    paxCounts: Record<string, number>;
}

export function ColumnThree({ currentRates, paxCounts }: ColumnThreeProps) {

    // Calculate Totals
    const lineItems = currentRates.map(rate => {
        const count = paxCounts[rate.customer_type_id] || 0;
        if (count === 0) return null;

        const subtotal = count * rate.price;
        const taxAmount = subtotal * (rate.tax_percentage / 100);
        const total = subtotal; // Assuming price is tax inclusive? Or exclusive? 
        // Standard US practice: Price is usually exclusive. 
        // Let's assume Exclusive for now as per schema 'tax_percentage'.

        return {
            ...rate,
            count,
            subtotal,
            taxAmount
        };
    }).filter(Boolean); // Remove nulls

    const subtotal = lineItems.reduce((sum, item) => sum + (item?.subtotal || 0), 0);
    const taxTotal = lineItems.reduce((sum, item) => sum + (item?.taxAmount || 0), 0);
    const grandTotal = subtotal + taxTotal;

    const hasItems = lineItems.length > 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Receipt size={16} className="text-cyan-500" />
                Payment Summary
            </h3>

            {hasItems ? (
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-4">
                    {/* Line Items */}
                    <div className="space-y-2">
                        {lineItems.map(item => (
                            <div key={item!.customer_type_id} className="flex justify-between text-sm">
                                <span className="text-zinc-400">
                                    {item!.count} x {item!.customer_type_name} <span className="text-zinc-600">(@ ${item!.price.toFixed(2)})</span>
                                </span>
                                <span className="text-white font-mono">${item!.subtotal.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-zinc-800 my-4" />

                    {/* Totals */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Subtotal</span>
                            <span className="text-zinc-300 font-mono">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Tax</span>
                            <span className="text-zinc-300 font-mono">${taxTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-zinc-800 mt-2">
                            <span className="text-white">Total</span>
                            <span className="text-cyan-400 font-mono">${grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-8 rounded border border-dashed border-zinc-800 text-center text-zinc-600 text-sm">
                    Select passengers to calculate total.
                </div>
            )}

            {/* Payment Integration Placeholder */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 opacity-50 cursor-not-allowed">
                <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Payment Method</h4>
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-black/20 rounded text-xs text-zinc-400">Credit Card</div>
                    <div className="px-3 py-1 bg-black/20 rounded text-xs text-zinc-400">Cash</div>
                    <div className="px-3 py-1 bg-black/20 rounded text-xs text-zinc-400">Invoice</div>
                </div>
            </div>

        </div>
    );
}
