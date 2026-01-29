"use client";
import React, { useEffect, useState } from "react";
import { Receipt, CreditCard, Banknote, Smartphone, Link, Terminal, Edit2, Tag, Check, X, Mail, MessageSquare } from "lucide-react";
import { PricingRate } from "@/features/bookings/types";
import { cn } from "@/lib/utils";
import { PaymentState, PaymentStatus, PaymentMethod } from "@/features/bookings/types";

interface ColumnThreeProps {
    currentRates: PricingRate[];
    paxCounts: Record<string, number>;
    paymentState: PaymentState;
    setPaymentState: (state: PaymentState) => void;
    setGrandTotal: (total: number) => void;
}

export function ColumnThree({ currentRates, paxCounts, paymentState, setPaymentState, setGrandTotal }: ColumnThreeProps) {
    // --- Local UI State ---
    const [isEditingTotal, setIsEditingTotal] = useState(false);
    const [isAddingPromo, setIsAddingPromo] = useState(false);
    const [tempOverride, setTempOverride] = useState<string>("");
    const [tempPromo, setTempPromo] = useState<string>("");

    // --- Totals Calculation ---
    const lineItems = currentRates.map(rate => {
        const count = paxCounts[rate.customer_type_id] || 0;
        if (count === 0) return null;
        const subtotal = count * rate.price;
        const taxAmount = subtotal * (rate.tax_percentage || 0) / 100;
        return {
            ...rate,
            count,
            subtotal,
            taxAmount
        };
    }).filter(Boolean);

    const subtotal = lineItems.reduce((sum, item) => sum + (item?.subtotal || 0), 0);
    const taxTotal = lineItems.reduce((sum, item) => sum + (item?.taxAmount || 0), 0);

    // Determine the effective total (Override takes precedence)
    const storedOverride = paymentState.overrideTotal;
    const calculatedTotal = Number((subtotal + taxTotal).toFixed(2));
    const grandTotal = storedOverride !== undefined ? storedOverride : calculatedTotal;

    const hasItems = lineItems.length > 0;

    // --- Effects ---
    // Auto-update amount if "paid_full" is selected (reacting to total changes)
    useEffect(() => {
        if (paymentState.status === 'paid_full') {
            setPaymentState({ ...paymentState, amount: grandTotal });
        }
        setGrandTotal(grandTotal);
    }, [grandTotal, paymentState.status]);

    // Handle Edit Total Submission
    const saveOverride = () => {
        const val = parseFloat(tempOverride);
        if (!isNaN(val) && val >= 0) {
            setPaymentState({ ...paymentState, overrideTotal: val, amount: paymentState.status === 'paid_full' ? val : paymentState.amount });
        } else {
            // If empty or invalid, clear override
            const { overrideTotal, ...rest } = paymentState;
            setPaymentState(rest);
        }
        setIsEditingTotal(false);
    };

    // Handle Promo Submission
    const savePromo = () => {
        if (tempPromo.trim()) {
            setPaymentState({ ...paymentState, promoCode: tempPromo.trim() });
        } else {
            const { promoCode, ...rest } = paymentState;
            setPaymentState(rest);
        }
        setIsAddingPromo(false);
    };


    // --- Handlers ---
    const handleStatusChange = (status: PaymentStatus) => {
        // If Pay Later, default to Credit Card method so we can show the form
        const method = status === 'pay_later' ? 'credit_card' : paymentState.method;

        setPaymentState({
            ...paymentState,
            status,
            method,
            amount: status === 'paid_full' ? grandTotal : (status === 'pay_later' ? 0 : Number((grandTotal * 0.2).toFixed(2))) // Default 20% deposit
        });
    };

    const handleMethodChange = (method: PaymentMethod) => {
        setPaymentState({ ...paymentState, method });
    };

    // --- Format Helper ---
    const formatCurrency = (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="flex flex-col h-full bg-transparent animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
            {/* Header */}
            <div className="shrink-0 flex items-center gap-2 px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10">
                <Receipt size={16} className="text-cyan-400" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Payment</span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8">

                    {/* 1. BILL SUMMARY */}
                    {hasItems ? (
                        <div className="bg-black/20 rounded-xl border border-white/10 p-4 space-y-4">
                            <div className="space-y-2">
                                {lineItems.map(item => (
                                    <div key={item!.customer_type_id} className="flex justify-between text-base">
                                        <span className="text-zinc-400">
                                            {item!.count} x {item!.customer_type_name}
                                        </span>
                                        <span className="text-white font-mono">${formatCurrency(item!.subtotal)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-zinc-800 my-4" />

                            <div className="space-y-2">
                                {/* Promo Code Line Item */}
                                {paymentState.promoCode ? (
                                    <div className="flex justify-between text-sm animate-in fade-in">
                                        <span className="text-cyan-400 flex items-center gap-1">
                                            <Tag size={12} />
                                            {paymentState.promoCode}
                                        </span>
                                        <button
                                            onClick={() => {
                                                const { promoCode, ...rest } = paymentState;
                                                setPaymentState(rest);
                                                setTempPromo("");
                                            }}
                                            className="text-zinc-500 hover:text-red-400 text-xs underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    !isAddingPromo && (
                                        <button
                                            onClick={() => { setIsAddingPromo(true); setTempPromo(""); }}
                                            className="text-cyan-400/80 hover:text-cyan-400 text-xs flex items-center gap-1 transition-colors"
                                        >
                                            <Tag size={12} /> Add Promo Code
                                        </button>
                                    )
                                )}

                                {/* Promo Input */}
                                {isAddingPromo && (
                                    <div className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={tempPromo}
                                            onChange={(e) => setTempPromo(e.target.value)}
                                            placeholder="Enter code..."
                                            className="bg-zinc-900/80 border border-cyan-400/50 rounded px-2 py-1 text-xs text-white outline-none w-32 uppercase"
                                            onKeyDown={(e) => e.key === 'Enter' && savePromo()}
                                            onBlur={savePromo}
                                        />
                                        <button onClick={savePromo} className="text-cyan-400 bg-cyan-950/50 p-1 rounded hover:bg-cyan-400/20"><Check size={12} /></button>
                                        <button onClick={() => setIsAddingPromo(false)} className="text-zinc-500 hover:text-white p-1"><X size={12} /></button>
                                    </div>
                                )}


                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Subtotal</span>
                                    <span className="text-zinc-300 font-mono">${formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Tax</span>
                                    <span className="text-zinc-300 font-mono">${formatCurrency(taxTotal)}</span>
                                </div>

                                {/* Grand Total Area */}
                                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-zinc-800 mt-2">
                                    <span className="text-white">Total</span>

                                    {isEditingTotal ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-cyan-400 font-mono text-xl">$</span>
                                            <input
                                                autoFocus
                                                type="number"
                                                value={tempOverride}
                                                onChange={(e) => setTempOverride(e.target.value)}
                                                onBlur={saveOverride}
                                                onKeyDown={(e) => e.key === 'Enter' && saveOverride()}
                                                className="bg-zinc-900/80 border border-cyan-400 rounded px-2 py-1 text-white font-mono w-24 text-right text-lg outline-none"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group">
                                            <span className="font-mono text-xl text-cyan-400">
                                                ${formatCurrency(grandTotal)}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setTempOverride(grandTotal.toFixed(2));
                                                    setIsEditingTotal(true);
                                                }}
                                                className="p-1 hover:bg-white/10 rounded text-zinc-600 group-hover:text-zinc-400 transition-colors"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {storedOverride !== undefined && (
                                    <div className="text-right text-[10px] text-cyan-400 italic">
                                        Manual override active
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 rounded border border-dashed border-zinc-800 text-center text-zinc-600 text-sm">
                            Select passengers to calculate total.
                        </div>
                    )}

                    {/* 2. PAYMENT STATUS (TILES) */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment Status</label>
                        <div className="grid grid-cols-2 gap-3">
                            <StatusTile
                                active={paymentState.status === 'paid_full'}
                                onClick={() => handleStatusChange('paid_full')}
                                label="Pay in Full"
                            />
                            <StatusTile
                                active={paymentState.status === 'paid_partial'}
                                onClick={() => handleStatusChange('paid_partial')}
                                label="Partial / Deposit"
                            />
                            <StatusTile
                                active={paymentState.status === 'pay_later'}
                                onClick={() => handleStatusChange('pay_later')}
                                label="Pay Later"
                            />
                            <StatusTile
                                active={paymentState.status === 'no_payment'}
                                onClick={() => handleStatusChange('no_payment')}
                                label="No Payment"
                            />
                        </div>
                    </div>

                    {/* 3. PAYMENT SPLIT (Moved Out) */}
                    {paymentState.status === 'paid_partial' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment Split</label>
                            <div className="flex items-center gap-3">
                                <div className="relative w-32">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                                    <input
                                        type="number"
                                        value={paymentState.amount !== undefined ? paymentState.amount : ""}
                                        onChange={(e) => setPaymentState({ ...paymentState, amount: parseFloat(e.target.value) || 0 })}
                                        onBlur={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val)) {
                                                setPaymentState({ ...paymentState, amount: Number(val.toFixed(2)) });
                                            }
                                        }}
                                        className="w-full bg-zinc-900/80 border border-white/10 rounded-lg pl-6 pr-3 py-2 text-white font-mono focus:border-cyan-400/50 outline-none text-sm"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20">
                                    <span className="text-xs font-medium text-cyan-400/70 uppercase">Balance</span>
                                    <span className="text-sm font-mono font-bold text-cyan-400">${formatCurrency(grandTotal - (paymentState.amount || 0))}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. PAYMENT METHOD (If paying now OR saving card later) */}
                    {(paymentState.status !== 'no_payment') && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">

                            {/* Method Tabs - Only show all options if NOT Pay Later (Pay Later forces card/terminal) */}
                            <div className="flex p-1 bg-black/20 rounded-lg border border-white/5">
                                <MethodTab active={paymentState.method === 'credit_card'} onClick={() => handleMethodChange('credit_card')} label="Credit Card" />
                                <MethodTab active={paymentState.method === 'crypto'} onClick={() => handleMethodChange('crypto')} label="Crypto" />
                                {paymentState.status !== 'pay_later' && (
                                    <MethodTab active={paymentState.method === 'cash'} onClick={() => handleMethodChange('cash')} label="Cash" />
                                )}
                            </div>

                            {/* Method Content */}
                            <div className="bg-black/20 border border-white/5 rounded-xl p-4">

                                {paymentState.method === 'credit_card' && (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-lg flex items-center gap-3">
                                            <CreditCard size={16} className="text-cyan-400" />
                                            <input type="text" placeholder="Card Number" className="bg-transparent border-none outline-none text-white text-sm flex-1 placeholder:text-zinc-600 font-mono" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" placeholder="MM / YY" className="bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none placeholder:text-zinc-600 font-mono text-center" />
                                            <input type="text" placeholder="CVC" className="bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none placeholder:text-zinc-600 font-mono text-center" />
                                        </div>
                                        <div className="grid grid-cols-5 gap-3">
                                            <input type="text" placeholder="Billing Zip" className="col-span-2 bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none placeholder:text-zinc-600 font-mono" />
                                            <input type="text" placeholder="Name on Card" className="col-span-3 bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none placeholder:text-zinc-600" />
                                        </div>

                                        {paymentState.status === 'pay_later' && (
                                            <div className="text-[10px] text-zinc-500 mt-2 text-center">
                                                Card will be saved securely for future charges.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {paymentState.method === 'crypto' && (
                                    <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                                        <div className="bg-white p-2 rounded-xl">
                                            {/* Mock QR Code */}
                                            <div className="w-32 h-32 bg-white flex items-center justify-center border-4 border-black">
                                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=rEb8TK3gBgk5auZkwc6sHnwrGVJH8DUAc&color=000000" alt="QR" className="w-full h-full" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 w-full">
                                            <div className="flex justify-center items-center gap-2">
                                                {/* XRP Logo (Approximation with icon or text for now, using text/color standard) */}
                                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] border border-white/20">X</div>
                                                <span className="text-sm font-bold text-white">XRP / Ripple</span>
                                            </div>
                                            <div className="text-xs font-mono bg-black/40 border border-white/10 p-2 rounded text-zinc-400 break-all select-all">
                                                rEb8TK3gBgk5auZkwc6sHnwrGVJH8DUAc
                                            </div>
                                            <div className="text-[10px] text-zinc-500">Scan to pay with any supported wallet</div>
                                        </div>
                                    </div>
                                )}

                                {paymentState.method === 'cash' && (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-zinc-400 italic">Please collect cash at counter.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* 5. RECEIPTS & NOTIFICATIONS */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5 mt-8">
                            <Mail size={16} className="text-cyan-400" />
                            <span className="text-sm font-bold text-white uppercase tracking-wider">Receipts</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-lg">
                                <div className="bg-zinc-800 p-2 rounded-full">
                                    <Mail size={14} className="text-zinc-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">Email Confirmation</div>
                                    <div className="text-[10px] text-zinc-500">Send automatic receipt</div>
                                </div>
                                <div className="ml-auto w-8 h-4 bg-cyan-900 rounded-full relative">
                                    <div className="absolute right-0 top-0 w-4 h-4 bg-cyan-400 rounded-full" />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-lg">
                                <div className="bg-zinc-800 p-2 rounded-full">
                                    <MessageSquare size={14} className="text-zinc-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">SMS Updates</div>
                                    <div className="text-[10px] text-zinc-500">Text notifications</div>
                                </div>
                                <div className="ml-auto w-8 h-4 bg-cyan-900 rounded-full relative">
                                    <div className="absolute right-0 top-0 w-4 h-4 bg-cyan-400 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Subcomponents ---

function StatusTile({ active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center justify-center py-3 px-4 rounded-xl border transition-all duration-200",
                active
                    ? "bg-cyan-950/30 border-cyan-400/50 ring-1 ring-cyan-400/20 text-white"
                    : "bg-black/20 border-white/10 hover:border-white/20 hover:bg-white/5 text-zinc-400"
            )}
        >
            <div className="text-xs font-bold leading-tight">{label}</div>
        </button>
    );
}

function MethodTab({ active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                active
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
            )}
        >
            {label}
        </button>
    );
}
