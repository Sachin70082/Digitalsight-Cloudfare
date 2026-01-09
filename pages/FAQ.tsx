
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { QuestionMarkIcon } from '../components/Icons';

const FAQ: React.FC = () => {
    const [search, setSearch] = useState('');

    const faqs = [
        { q: "What audio formats do you accept?", a: "We exclusively accept high-fidelity WAV files (44.1kHz / 16-bit minimum). Compressing to MP3 or AAC will result in rejection by DSPs." },
        { q: "How long does the review process take?", a: "Our quality control team typically audits releases within 24-48 business hours. Urgent releases can be prioritized via the Support tab." },
        { q: "Can I use AI-generated artwork?", a: "Yes, as long as the artwork meets our 3000x3000px requirement and does not contain copyrighted brand logos or third-party likeness without permission." },
        { q: "When do I get paid?", a: "Royalties are processed monthly. You will see earnings in your Financials tab roughly 45-60 days after the month they were generated." },
        { q: "What is an ISRC and how do I get one?", a: "The International Standard Recording Code uniquely identifies your song. We automatically generate these for you during the creation flow if left blank." },
        { q: "How do I initiate a takedown?", a: "Select the published release in your catalog and use the 'Initiate Takedown' button. Removal usually takes 2-5 business days across stores." }
    ];

    const filtered = faqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-5xl mx-auto py-10 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <QuestionMarkIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Knowledge Vault</h1>
                        <p className="text-gray-400 mt-2">Platform guides, distribution rules, and technical specs.</p>
                    </div>
                </div>
                <div className="w-full md:w-80">
                    <Input 
                        placeholder="Search documentation..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="rounded-full bg-gray-800 border-gray-700"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((faq, i) => (
                    <Card key={i} className="hover:border-purple-500/30 transition-all border border-transparent">
                        <CardHeader><CardTitle className="text-sm text-purple-400">Q: {faq.q}</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-gray-300 text-sm leading-relaxed">{faq.a}</p>
                        </CardContent>
                    </Card>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-600 italic border-2 border-dashed border-gray-800 rounded-3xl">
                        No documentation found matching your query. Try 'Audio', 'Payments', or 'Metadata'.
                    </div>
                )}
            </div>

            <div className="mt-12 p-8 bg-gradient-to-r from-purple-900/20 to-transparent border-l-4 border-purple-500 rounded-r-2xl">
                <h3 className="text-white font-bold mb-2">Technical Standards Manual</h3>
                <p className="text-sm text-gray-400 max-w-2xl mb-6">Download the full technical documentation including Excel bulk upload templates and XML delivery schemas.</p>
                <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-full transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download PDF Guide
                </button>
            </div>
        </div>
    );
};

export default FAQ;
