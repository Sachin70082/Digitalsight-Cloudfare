
import React, { useState, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea } from '../components/ui';
import { SupportIcon } from '../components/Icons';
import { AppContext } from '../App';
import { UserRole } from '../types';
import { PmaFieldset, PmaInfoBar, PmaSectionTitle, PmaInput, PmaButton, PmaSelect } from '../components/PmaStyle';

const Support: React.FC = () => {
    const { user } = useContext(AppContext);
    const [submitted, setSubmitted] = useState(false);
    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (isPlatformSide) {
        return (
            <div className="space-y-4">
                <PmaInfoBar>
                    <strong>Table:</strong> support_tickets &nbsp;|&nbsp; 
                    <strong>Status:</strong> Command Center Active &nbsp;|&nbsp;
                    <span className="text-[#009900]">● Online</span>
                </PmaInfoBar>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <PmaFieldset legend="Open New Inquiry">
                            <div className="p-4">
                                {submitted ? (
                                    <div className="text-center py-12 space-y-4">
                                        <div className="bg-[#e8f4e8] border border-[#009900] p-4 inline-block">
                                            <p className="text-[#009900] font-bold text-lg">Ticket Transmitted Successfully</p>
                                            <p className="text-sm">Reference: #SPT-{Math.floor(Math.random() * 90000) + 10000}</p>
                                        </div>
                                        <div className="block">
                                            <PmaButton variant="secondary" onClick={() => setSubmitted(false)}>Open Another Ticket</PmaButton>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <PmaInput label="Subject / Issue Area" placeholder="e.g. Metadata Correction" />
                                            <PmaSelect 
                                                label="Priority Level"
                                                value="Normal"
                                                onChange={() => {}}
                                                options={[
                                                    { value: 'Normal', label: 'Normal (Routine)' },
                                                    { value: 'High', label: 'High (Correction Pending)' },
                                                    { value: 'Urgent', label: 'Urgent (Takedown Request)' }
                                                ]}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#666] mb-1">Detailed Description</label>
                                            <textarea 
                                                className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none min-h-[150px]"
                                                placeholder="Please provide all relevant technical details..."
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-[#ccc]">
                                            <span className="text-xs text-black">Average response: 4-6 Hours</span>
                                            <PmaButton variant="primary" type="submit">Submit Ticket</PmaButton>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </PmaFieldset>
                    </div>

                    <div className="space-y-4">
                        <PmaFieldset legend="Priority Channels">
                            <div className="p-4 space-y-4">
                                <div className="border border-[#ccc] p-3 bg-[#f9f9f9]">
                                    <p className="font-bold text-sm text-black">Metadata Hotline</p>
                                    <p className="text-xs font-mono text-[#0066cc]">meta@distro.pro</p>
                                </div>
                                <div className="border border-[#ccc] p-3 bg-[#f9f9f9]">
                                    <p className="font-bold text-sm text-black">Legal / DMCA</p>
                                    <p className="text-xs font-mono text-[#0066cc]">legal@distro.pro</p>
                                </div>
                            </div>
                        </PmaFieldset>

                        <PmaFieldset legend="Internal Chat">
                            <div className="p-4 text-center space-y-3">
                                <p className="text-sm text-black">Agents currently <span className="text-[#009900] font-bold">Online</span></p>
                                <PmaButton variant="secondary" className="w-full">Launch Console</PmaButton>
                            </div>
                        </PmaFieldset>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 animate-fade-in">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10">
                    <SupportIcon className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Support Command Center</h1>
                <p className="text-gray-500 mt-2 font-medium text-lg">Open a priority ticket with our distribution specialists.</p>
            </div>

            {submitted ? (
                <Card className="text-center py-24 border-primary/20 bg-primary/5 rounded-[3rem] shadow-2xl">
                    <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-3">Ticket Transmitted</h2>
                    <p className="text-gray-400 max-w-sm mx-auto text-lg">Reference: <span className="text-white font-black">#SPT-{Math.floor(Math.random() * 90000) + 10000}</span>. Our team will respond within 12 hours.</p>
                    <Button variant="secondary" className="mt-12 h-14 px-12 text-[11px] font-black uppercase tracking-widest rounded-2xl" onClick={() => setSubmitted(false)}>Open Another Ticket</Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card className="rounded-[2.5rem] shadow-2xl border-white/5 bg-white/[0.02]">
                            <CardHeader className="border-white/5 pb-6"><CardTitle className="uppercase tracking-tight font-black">Open New Inquiry</CardTitle></CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="Subject / Issue Area" placeholder="e.g. Metadata Correction" required className="h-14 bg-black/40 border-gray-800" />
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3">Priority Level</label>
                                            <select className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-4 text-white text-sm font-bold outline-none focus:ring-1 focus:ring-primary transition-all">
                                                <option>Normal (Routine)</option>
                                                <option>High (Correction Pending)</option>
                                                <option>Urgent (Takedown Request)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Textarea label="Detailed Description" rows={8} placeholder="Please provide all relevant technical details..." required className="bg-black/40 border-gray-800" />
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
                                        <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">Average response: 4-6 Hours</p>
                                        <Button type="submit" className="w-full sm:w-auto h-14 px-12 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-2xl">Submit Ticket</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="bg-gray-900/50 rounded-[2rem] border-white/5">
                            <CardHeader className="border-none pb-0"><CardTitle className="text-[10px] uppercase font-black tracking-widest text-gray-500">Priority Channels</CardTitle></CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z"/></svg>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-white font-black uppercase tracking-tight">Metadata Hotline</p>
                                        <p className="text-[10px] text-gray-500 font-mono">meta@distro.pro</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shadow-inner">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z"/></svg>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-white font-black uppercase tracking-tight">Legal / DMCA</p>
                                        <p className="text-[10px] text-gray-500 font-mono">legal@distro.pro</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="p-8 bg-primary/10 rounded-[2.5rem] border border-primary/20 text-center shadow-xl shadow-primary/5">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Internal Chat</p>
                            <p className="text-sm text-gray-400 font-medium">Agents currently <span className="text-primary font-black uppercase tracking-widest">Online</span></p>
                            <Button variant="secondary" className="w-full h-12 mt-8 text-[10px] font-black uppercase tracking-widest rounded-xl border-primary/20">Launch Console</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Support;
