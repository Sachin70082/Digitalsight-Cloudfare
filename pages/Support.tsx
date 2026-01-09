
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea } from '../components/ui';
import { SupportIcon } from '../components/Icons';

const Support: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="max-w-4xl mx-auto py-10 animate-fade-in">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <SupportIcon className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Support Command Center</h1>
                <p className="text-gray-400 mt-2">Open a priority ticket with our distribution specialists.</p>
            </div>

            {submitted ? (
                <Card className="text-center py-20 border-primary/20 bg-primary/5">
                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Ticket Transmitted</h2>
                    <p className="text-gray-400 max-w-sm mx-auto">Reference: #SPT-{Math.floor(Math.random() * 90000) + 10000}. Our team will respond within 12 hours.</p>
                    <Button variant="secondary" className="mt-8" onClick={() => setSubmitted(false)}>Open Another Ticket</Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Open New Inquiry</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="Subject / Issue Area" placeholder="e.g. Metadata Correction" required />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Priority Level</label>
                                            <select className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white">
                                                <option>Normal (Routine)</option>
                                                <option>High (Correction Pending)</option>
                                                <option>Urgent (Takedown Request)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Textarea label="Detailed Description" rows={6} placeholder="Please provide all relevant details..." required />
                                    <div className="flex items-center justify-between border-t border-gray-700 pt-6">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Average response time: 4-6 Hours</p>
                                        <Button type="submit">Submit Ticket</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="bg-gray-900/50">
                            <CardHeader><CardTitle className="text-sm">Priority Channels</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z"/></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white font-bold">Metadata Hotline</p>
                                        <p className="text-[10px] text-gray-500">meta@musicdistro.pro</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center text-blue-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z"/></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white font-bold">Legal / Copyright</p>
                                        <p className="text-[10px] text-gray-500">dmca@musicdistro.pro</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="p-6 bg-primary/10 rounded-2xl border border-primary/20 text-center">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Live Chat</p>
                            <p className="text-xs text-gray-400">Our agents are currently <span className="text-primary">online</span>.</p>
                            <Button variant="secondary" className="w-full mt-4 text-[10px] uppercase font-bold tracking-widest">Launch Chat</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Support;
