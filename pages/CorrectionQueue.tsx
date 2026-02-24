import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Release, ReleaseStatus, Artist, Label, UserRole } from '../types';
import { Badge, Card, PageLoader, Input, Pagination, Table, THead, TBody, TR, TH, TD } from '../components/ui';
import { PmaFieldset, PmaTable, PmaTR, PmaTD, PmaButton, PmaInput, PmaStatusBadge, PmaPagination, PmaInfoBar } from '../components/PmaStyle';

// phpMyAdmin style Correction Queue for admin users
const PmaCorrectionQueueView: React.FC<{
    releases: Release[];
    artists: Map<string, Artist>;
    labels: Map<string, Label>;
    isLoading: boolean;
    filter: string;
    setFilter: (f: string) => void;
    currentPage: number;
    setCurrentPage: (p: number) => void;
    filteredReleases: Release[];
    paginatedReleases: Release[];
    itemsPerPage: number;
}> = (props) => {
    const { releases, artists, labels, filter, setFilter, currentPage, setCurrentPage, filteredReleases, paginatedReleases, itemsPerPage } = props;

    return (
        <div className="space-y-4">
            <PmaInfoBar>
                <strong>Table:</strong> correction_queue &nbsp;|&nbsp; 
                <strong>Records:</strong> {filteredReleases.length} &nbsp;|&nbsp;
                <span className="text-[#cc6600]">Needs Info</span>
            </PmaInfoBar>

            <PmaFieldset legend="Correction Queue - Releases Flagged for Mandatory Metadata">
                <div className="p-4">
                    {/* Search */}
                    <div className="mb-4 flex justify-between items-center">
                        <div className="text-xs text-[#666]">
                            Showing {paginatedReleases.length} of {filteredReleases.length} releases
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[#666]">Search:</span>
                            <input
                                type="text"
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                placeholder="Filter by title, UPC, artist, label..."
                                className="border-2 border-[#ccc] px-3 py-1.5 text-sm w-64 focus:border-[#0066cc] outline-none"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <PmaTable
                        headers={[
                            { label: 'Session Target' },
                            { label: 'Node Source' },
                            { label: 'Audit Timestamp' },
                            { label: 'Status' },
                            { label: 'Action', className: 'text-right' }
                        ]}
                    >
                        {paginatedReleases.map(release => {
                            const artistName = artists.get(release.primaryArtistIds[0])?.name || 'Untitled';
                            const labelName = labels.get(release.labelId)?.name || 'Unknown Node';
                            return (
                                <PmaTR key={release.id}>
                                    <PmaTD isLabel>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 border border-[#ccc] flex-shrink-0">
                                                <img src={release.artworkUrl} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-black">{release.title}</div>
                                                <div className="text-xs text-[#444]">{artistName}</div>
                                            </div>
                                        </div>
                                    </PmaTD>
                                    <PmaTD>
                                        <div className="text-sm text-black">{labelName}</div>
                                        <div className="text-xs text-[#444] font-mono">UPC: {release.upc || 'PENDING'}</div>
                                    </PmaTD>
                                    <PmaTD>
                                        <div className="text-xs font-mono text-black">{new Date(release.updatedAt).toLocaleDateString()}</div>
                                        <div className="text-xs text-[#444]">{new Date(release.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    </PmaTD>
                                    <PmaTD>
                                        <PmaStatusBadge status={release.status} />
                                    </PmaTD>
                                    <PmaTD className="text-right">
                                        <Link to={`/release/${release.id}`} className="text-[#0066cc] hover:underline text-sm">
                                            Audit Meta
                                        </Link>
                                    </PmaTD>
                                </PmaTR>
                            );
                        })}
                        {paginatedReleases.length === 0 && (
                            <PmaTR>
                                <PmaTD colSpan={5} className="text-center py-8 text-[#999]">
                                    The correction queue is currently empty.
                                </PmaTD>
                            </PmaTR>
                        )}
                    </PmaTable>

                    {/* Pagination */}
                    <PmaPagination
                        totalItems={filteredReleases.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </PmaFieldset>
        </div>
    );
};

// Original dark theme view for partner users (if they ever see this)
const PartnerCorrectionQueueView: React.FC<{
    releases: Release[];
    artists: Map<string, Artist>;
    labels: Map<string, Label>;
    isLoading: boolean;
    filter: string;
    setFilter: (f: string) => void;
    currentPage: number;
    setCurrentPage: (p: number) => void;
    filteredReleases: Release[];
    paginatedReleases: Release[];
    itemsPerPage: number;
}> = (props) => {
    const { releases, artists, labels, filter, setFilter, currentPage, setCurrentPage, filteredReleases, paginatedReleases, itemsPerPage } = props;

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Correction Command</h1>
                    <p className="text-gray-500 mt-1 font-medium">Releases flagged for mandatory metadata or asset optimization.</p>
                </div>
                <div className="w-full md:w-80 relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <Input 
                        placeholder="Search audit queue..." 
                        value={filter} 
                        onChange={e => setFilter(e.target.value)} 
                        className="pl-11 h-12 bg-black/20 border-gray-700"
                    />
                </div>
            </div>

            <Card className="p-0 overflow-hidden border-yellow-500/20 bg-yellow-500/[0.02]">
                <Table>
                    <THead>
                        <TR className="bg-yellow-500/[0.05]">
                            <TH>Session Target</TH>
                            <TH>Node Source</TH>
                            <TH>Audit Timestamp</TH>
                            <TH>Status</TH>
                            <TH className="text-right">Gate</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {paginatedReleases.map(release => {
                            const artistName = artists.get(release.primaryArtistIds[0])?.name || 'Untitled';
                            const labelName = labels.get(release.labelId)?.name || 'Unknown Node';
                            return (
                                <TR key={release.id} className="hover:bg-yellow-500/[0.03]">
                                    <TD>
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-105 transition-transform">
                                                <img src={release.artworkUrl} className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-black text-white group-hover:text-yellow-500 transition-colors tracking-tight uppercase">{release.title}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">{artistName}</p>
                                            </div>
                                        </div>
                                    </TD>
                                    <TD>
                                        <p className="text-[11px] text-gray-300 font-black uppercase tracking-tight">{labelName}</p>
                                        <p className="text-[9px] text-gray-600 font-mono mt-1">UPC: {release.upc || 'PENDING'}</p>
                                    </TD>
                                    <TD>
                                        <p className="text-[11px] text-gray-400 font-mono font-bold">{new Date(release.updatedAt).toLocaleDateString()}</p>
                                        <p className="text-[9px] text-gray-600 font-mono uppercase mt-1">{new Date(release.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </TD>
                                    <TD><Badge status={release.status} /></TD>
                                    <TD className="text-right">
                                        <Link to={`/release/${release.id}`} className="inline-block bg-yellow-500 text-black font-black text-[9px] uppercase tracking-[0.2em] px-6 py-2.5 rounded-full hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/10">
                                            Audit Meta
                                        </Link>
                                    </TD>
                                </TR>
                            );
                        })}
                        {paginatedReleases.length === 0 && (
                            <TR>
                                <TD colSpan={5} className="py-40 text-center text-gray-700 uppercase font-black tracking-widest text-xs opacity-40">
                                    The correction queue is currently sterilized.
                                </TD>
                            </TR>
                        )}
                    </TBody>
                </Table>
                <Pagination 
                    totalItems={filteredReleases.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </Card>
        </div>
    );
};

const CorrectionQueue: React.FC = () => {
    const { user } = useContext(AppContext);
    const [releases, setReleases] = useState<Release[]>([]);
    const [artists, setArtists] = useState<Map<string, Artist>>(new Map());
    const [labels, setLabels] = useState<Map<string, Label>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [fetchedReleases, allArtists, allLabels] = await Promise.all([
                api.getAllReleases(),
                api.getAllArtists(),
                api.getLabels()
            ]);
            
            setReleases(fetchedReleases.filter(r => r.status === ReleaseStatus.NEEDS_INFO));
            
            const artistMap = new Map<string, Artist>();
            allArtists.forEach(a => artistMap.set(a.id, a));
            setArtists(artistMap);
            
            const labelMap = new Map<string, Label>();
            allLabels.forEach(l => labelMap.set(l.id, l));
            setLabels(labelMap);
        } catch (e) {
            console.error("Queue load failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const filteredReleases = useMemo(() => {
        return releases.filter(release => {
            const artistName = artists.get(release.primaryArtistIds[0])?.name || '';
            const labelName = labels.get(release.labelId)?.name || '';
            const matchesText = filter === '' ||
                release.title.toLowerCase().includes(filter.toLowerCase()) ||
                release.upc.includes(filter) ||
                artistName.toLowerCase().includes(filter.toLowerCase()) ||
                labelName.toLowerCase().includes(filter.toLowerCase());
            return matchesText;
        }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [releases, filter, artists, labels]);

    const paginatedReleases = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredReleases.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredReleases, currentPage]);

    if (isLoading) return <PageLoader />;

    const commonProps = {
        releases, artists, labels, isLoading, filter, setFilter, currentPage, setCurrentPage, filteredReleases, paginatedReleases, itemsPerPage
    };

    // Use phpMyAdmin style for admin/employee users
    if (isPlatformSide) {
        return <PmaCorrectionQueueView {...commonProps} />;
    }

    // Use dark theme for partner users
    return <PartnerCorrectionQueueView {...commonProps} />;
};

export default CorrectionQueue;
