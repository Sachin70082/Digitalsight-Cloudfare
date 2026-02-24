
import React, { useState, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { QuestionMarkIcon } from '../components/Icons';
import { AppContext } from '../App';
import { UserRole } from '../types';
import { PmaFieldset, PmaInfoBar, PmaSectionTitle, PmaInput, PmaButton } from '../components/PmaStyle';

const FAQ: React.FC = () => {
    const { user } = useContext(AppContext);
    const [search, setSearch] = useState('');
    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;

    const faqs = [
        { q: "What audio formats do you accept?", a: "We exclusively accept high-fidelity WAV files (44.1kHz / 16-bit minimum). Compressing to MP3 or AAC will result in rejection by DSPs." },
        { q: "How long does the review process take?", a: "Our quality control team typically audits releases within 24-48 business hours. Urgent releases can be prioritized via the Support tab." },
        { q: "Can I use AI-generated artwork?", a: "Yes, as long as the artwork meets our 3000x3000px requirement and does not contain copyrighted brand logos or third-party likeness without permission." },
        { q: "When do I get paid?", a: "Royalties are processed monthly. You will see earnings in your Financials tab roughly 45-60 days after the month they were generated." },
        { q: "What is an ISRC and how do I get one?", a: "The International Standard Recording Code uniquely identifies your song. We automatically generate these for you during the creation flow if left blank." },
        { q: "How do I initiate a takedown?", a: "Select the published release in your catalog and use the 'Initiate Takedown' button. Removal usually takes 2-5 business days across stores." }
    ];

    const filtered = faqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

    if (isPlatformSide) {
        return (
            <div className="space-y-4">
                <PmaInfoBar>
                    <strong>Table:</strong> knowledge_vault &nbsp;|&nbsp; 
                    <strong>Records:</strong> {faqs.length} &nbsp;|&nbsp;
                    <span className="text-[#009900]">● Online</span>
                </PmaInfoBar>

                <PmaFieldset legend="Knowledge Vault - Documentation">
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-black">Platform guides and technical specs</div>
                            <PmaInput 
                                label="Search Documentation" 
                                value={search} 
                                onChange={setSearch} 
                                placeholder="Filter by keyword..." 
                                className="w-64"
                            />
                        </div>

                        <div className="space-y-4">
                            {filtered.map((faq, i) => (
                                <div key={i} className="border border-[#ccc] rounded overflow-hidden">
                                    <div className="bg-gradient-to-b from-[#f7f7f7] to-[#e5e5e5] px-4 py-2 border-b border-[#ccc] font-bold text-sm text-black">
                                        Q: {faq.q}
                                    </div>
                                    <div className="p-4 bg-white text-sm text-black leading-relaxed">
                                        {faq.a}
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="text-center py-8 text-black">No matches found.</div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-[#ccc]">
                            <PmaSectionTitle>Technical Standards Manual</PmaSectionTitle>
                            <p className="text-sm text-black mb-4">Download the full technical documentation including Excel bulk upload templates and ingestion protocols.</p>
                            <PmaButton variant="primary">Download Ingest Protocol PDF</PmaButton>
                        </div>
                    </div>
                </PmaFieldset>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-10 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8 border-b border-white/5 pb-12">
                <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-purple-500/20 text-purple-400 rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-xl shadow-purple-500/10">
                        <QuestionMarkIcon className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Knowledge Vault</h1>
                        <p className="text-gray-500 mt-3 font-medium text-lg">Platform guides, distribution rules, and technical specs.</p>
                    </div>
                </div>
                <div className="w-full md:w-96 relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <Input 
                        placeholder="Search documentation..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="rounded-[1.5rem] h-16 pl-16 bg-gray-800/40 border-gray-700 text-lg placeholder:text-gray-600 transition-all focus:ring-purple-500/50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filtered.map((faq, i) => (
                    <Card key={i} className="hover:border-purple-500/30 transition-all border border-white/5 bg-white/[0.02] rounded-[2.5rem] p-10 group shadow-2xl">
                        <CardHeader className="border-none p-0 mb-6">
                            <CardTitle className="text-lg text-purple-400 font-black uppercase tracking-tight leading-tight group-hover:text-white transition-colors">Q: {faq.q}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <p className="text-gray-400 text-lg leading-relaxed font-medium">{faq.a}</p>
                        </CardContent>
                    </Card>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-full py-32 text-center text-gray-700 font-black uppercase tracking-[0.3em] border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                        Zero documentation entries identified.
                    </div>
                )}
            </div>

            <div className="mt-20 p-12 bg-gradient-to-r from-purple-900/20 to-transparent border-l-[12px] border-purple-500 rounded-[3rem] shadow-2xl">
                <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Technical Standards Manual</h3>
                <p className="text-lg text-gray-400 max-w-2xl mb-10 font-medium">Download the full technical documentation including Excel bulk upload templates, XML delivery schemas, and DDEX ingestion protocols.</p>
                <button className="flex items-center gap-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-[11px] tracking-[0.25em] px-10 py-5 rounded-2xl transition-all shadow-xl shadow-purple-900/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Ingest Protocol PDF
                </button>
            </div>
        </div>
    );
};

export default FAQ;
