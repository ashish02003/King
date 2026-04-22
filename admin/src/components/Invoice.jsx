import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { Printer, ArrowLeft } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const Invoice = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [settings, setSettings] = useState(null);
    const invoiceRef = useRef();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const adminInfo = JSON.parse(localStorage.getItem('userInfo'));
                
                // Fetch Settings
                const { data: setRes } = await axios.get(`${API_BASE}/settings`);
                setSettings(setRes);

                // Fetch Order
                const res = await axios.get(`${API_BASE}/orders/${orderId}`, {
                    headers: { Authorization: `Bearer ${adminInfo?.token}` }
                });
                setOrder(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [orderId]);

    const handlePrint = () => {
        const element = invoiceRef.current;
        const opt = {
            margin:       [0, 0, 0, 0],
            filename:     `Invoice_${orderShort}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true,
                letterRendering: true,
                windowWidth: 1200 
            },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    if (!order || !settings) return <div className="p-10 text-center">Loading Invoice...</div>;

    const orderShort = order._id.substring(order._id.length - 6).toUpperCase();
    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const cgst = (order.gstTotal || 0) / 2;
    const sgst = (order.gstTotal || 0) / 2;
    const grandTotal = order.totalPrice;

    const numberToWords = (num) => {
        const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
        const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
        if ((num = num.toString()).length > 9) return 'overflow';
        let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return; let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : '';
        return str || 'Zero';
    };

    return (
        <div className="bg-gray-100 min-h-screen py-4 md:py-10 font-sans">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 px-4">
                <button onClick={() => navigate(-1)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white rounded-xl shadow-sm font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all">
                    <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handlePrint} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 font-black text-xs uppercase tracking-widest hover:bg-emerald-700 hover:-translate-y-0.5 transition-all">
                    <Printer size={16} /> Print / Save PDF
                </button>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-5 md:p-10 shadow-2xl rounded-sm text-black overflow-hidden" style={{ pageBreakInside: 'avoid' }} ref={invoiceRef}>
                {/* Header */}
                <div className="text-center border-b-[1.5px] border-black pb-4 mb-4">
                    <h2 className="font-black text-xs uppercase tracking-[0.3em] text-slate-400 mb-6 font-sans">Tax Invoice</h2>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
                        {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-12 md:h-14 object-contain" />}
                        <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>
                            {settings.companyName}
                        </h1>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-slate-600">{settings.addressLine}</p>
                    <p className="text-xs md:text-sm font-medium text-slate-600">Phone: {settings.phone} • Email: {settings.email}</p>
                    <div className="mt-3 inline-block px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-300">
                        <p className="text-xs font-bold uppercase tracking-widest text-black whitespace-nowrap">
                            GSTIN: <span className="text-emerald-600 tracking-normal ml-0.5">{settings.gstin}</span>
                        </p>
                    </div>
                </div>

                {/* Bill To & Invoice Info */}
                <div className="border-b-[1.5px] border-black pb-6 mb-6 flex flex-col md:flex-row justify-between gap-6">
                    <div className="md:w-1/2 space-y-2 text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing Destination</p>
                        <div className="flex flex-col">
                            <span className="font-black text-base md:text-lg uppercase tracking-tight">{order.shippingAddress?.fullName}</span>
                            <span className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                                {order.shippingAddress?.addressLine1}, {order.shippingAddress?.city},<br/>
                                {order.shippingAddress?.state} - <span className="font-black text-slate-900">{order.shippingAddress?.pincode}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact:</span>
                            <span className="text-xs md:text-sm font-black">+91 {order.shippingAddress?.phone}</span>
                        </div>
                    </div>
                    <div className="md:w-1/2 flex flex-row md:flex-col justify-between md:justify-start md:items-end gap-2 md:gap-4 text-left md:text-right">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Invoice Vector</p>
                            <span className="text-sm md:text-lg font-black font-mono">#{orderShort}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Issue Date</p>
                            <span className="text-sm md:text-base font-black uppercase tracking-tighter">{invoiceDate}</span>
                        </div>
                    </div>
                </div>

                {/* Table - Mobile Scrollable */}
                <div className="overflow-x-auto -mx-2 md:mx-0">
                    <div className="min-w-[600px] p-2 md:p-0">
                        <table className="w-full border-collapse border border-black mb-6 align-top text-[11px] md:text-sm">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="border border-black p-3 w-12 text-center font-black uppercase">Sl</th>
                                    <th className="border border-black p-3 text-left font-black uppercase">Item Details</th>
                                    <th className="border border-black p-3 w-16 text-center font-black uppercase">Qty</th>
                                    <th className="border border-black p-3 w-28 text-right font-black uppercase text-[10px] leading-tight">Base<br/>Price</th>
                                    <th className="border border-black p-3 w-28 text-right font-black uppercase text-[10px] leading-tight">Taxed<br/>Price</th>
                                    <th className="border border-black p-3 w-32 text-right font-black uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.orderItems.map((item, idx) => {
                                    const unitPriceWithTax = item.price + (item.price * (item.gst || 0) / 100);
                                    const amount = unitPriceWithTax * item.quantity;
                                    return (
                                        <tr key={idx} className="font-medium">
                                            <td className="border border-black p-3 text-center text-slate-400">{idx + 1}</td>
                                            <td className="border border-black p-3 font-black text-slate-900 uppercase tracking-tight">{item.template?.name || 'Custom Product'}</td>
                                            <td className="border border-black p-3 text-center font-black">{item.quantity}</td>
                                            <td className="border border-black p-2 text-center text-slate-400">{idx + 1}</td>
                                            <td className="border border-black p-2 font-black text-slate-900 uppercase tracking-tight">{item.template?.name || 'Custom Product'}</td>
                                            <td className="border border-black p-2 text-center font-black">{item.quantity}</td>
                                            <td className="border border-black p-2 text-right">₹{item.price.toFixed(2)}</td>
                                            <td className="border border-black p-2 text-right">₹{unitPriceWithTax.toFixed(2)}</td>
                                            <td className="border border-black p-2 text-right font-black">₹{amount.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                                {/* Buffer row minimized */}
                                <tr className="h-8 border-x border-black">
                                    <td colSpan="6"></td>
                                </tr>
                                <tr className="bg-slate-900 text-white font-black">
                                    <td className="border border-black p-4 text-right text-lg tracking-tighter">₹{(order.subtotal + (order.gstTotal || 0)).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Financial Summary Breakdown */}
                <div className="flex flex-col md:flex-row border border-black border-t-0 -mt-6 text-xs md:text-sm">
                    <div className="md:w-1/2 p-4 md:p-6 border-b md:border-b-0 md:border-r border-black space-y-3 bg-slate-50/50">
                        <div className="flex justify-between items-center"><span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Sub Total</span> <span className="font-black">₹{order.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center"><span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">SGST @ 9%</span> <span className="font-black">₹{cgst.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center"><span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">CGST @ 9%</span> <span className="font-black">₹{sgst.toFixed(2)}</span></div>
                        {order.shippingChargesTotal > 0 && <div className="flex justify-between items-center"><span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Shipping Fee</span> <span className="font-black">₹{order.shippingChargesTotal.toFixed(2)}</span></div>}
                        {order.packingChargesTotal > 0 && <div className="flex justify-between items-center"><span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Packing Index</span> <span className="font-black">₹{order.packingChargesTotal.toFixed(2)}</span></div>}
                        <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between items-center">
                            <span className="font-black text-emerald-600 uppercase tracking-[0.2em] text-[10px]">Invoice Total</span>
                            <span className="text-xl md:text-2xl font-black text-emerald-700 tracking-tighter">₹{grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="md:w-1/2 p-6 flex flex-col justify-center bg-white">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 leading-none">Amount in Words</p>
                        <p className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight leading-snug">{numberToWords(Math.round(grandTotal))}</p>
                    </div>
                </div>

                {/* Settlement & Signature */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-6 gap-6">
                    {/* Settlement Nexus */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                        {settings.qrCodeUrl && (
                            <div className="relative group p-1 bg-white border-2 border-slate-900 rounded-xl">
                                <img src={settings.qrCodeUrl} alt="QR" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                                <div className="absolute -top-3 -left-3 bg-slate-900 text-white text-[7px] font-black px-2 py-0.5 rounded-lg uppercase whitespace-nowrap">Scan & Pay</div>
                            </div>
                        )}
                        <div className="space-y-1 text-left border-l-2 border-slate-100 pl-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Beneficiary Parameters</p>
                            <p className="text-[10px] md:text-xs font-black uppercase text-slate-400">Account: <span className="text-slate-900">{settings.bankDetails?.accountName}</span></p>
                            <p className="text-[10px] md:text-xs font-black uppercase text-slate-400">Bank: <span className="text-slate-900">{settings.bankDetails?.bankName}</span></p>
                            <p className="text-[10px] md:text-xs font-black uppercase text-slate-400">Number: <span className="text-slate-900 font-mono tracking-tighter">{settings.bankDetails?.accountNo}</span></p>
                            <p className="text-[10px] md:text-xs font-black uppercase text-slate-400">IFSC: <span className="text-slate-900 font-mono tracking-tighter">{settings.bankDetails?.ifscCode}</span></p>
                        </div>
                    </div>
                    
                    {/* Signature Nexus */}
                    <div className="flex flex-col items-center md:items-end w-full md:w-auto pt-4 border-t md:border-t-0 border-slate-100">
                        <p className="text-[9px] font-black italic text-slate-400 mb-4 uppercase tracking-widest font-sans">For {settings.companyName}</p>
                        {settings.signatureUrl && (
                            <img src={settings.signatureUrl} alt="signature" className="h-10 md:h-12 object-contain -mt-8 mb-1 mix-blend-multiply" />
                        )}
                        <div className="w-40 border-t-[1.5px] border-black pt-1 text-center md:text-right">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Authorized Signatory</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-dashed border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">System Generated Manifest • No Hand Signature Required</p>
                </div>
            </div>
        </div>
    );
};

export default Invoice;
