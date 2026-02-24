import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { exportReleasesToCSV } from '../services/excelService';
import { Release, ReleaseStatus, UserRole, Artist, Label } from '../types';
import { Badge, Button, Input, Modal, Card, PageLoader, Pagination, Spinner, Table, THead, TBody, TR, TH, TD, Skeleton } from '../components/ui';
import ReleaseForm from '../components/ReleaseForm';
import { ArrowDownIcon, DownloadIcon, ArrowUpIcon, XCircleIcon, TrashIcon } from '../components/Icons';
import { PmaFieldset, PmaTable, PmaTR, PmaTD, PmaButton, PmaInput, PmaSelect, PmaStatusBadge, PmaPagination, PmaInfoBar } from '../components/PmaStyle';

// phpMyAdmin style ReleaseList for admin users
const PmaReleaseList: React.FC<{
    user: any;
    releases: Release[];
    artists: Map<string, Artist>;
    labels: Map<string, Label>;
    isLoading: boolean;
    filter: string;
    setFilter: (f: string) => void;
    statusFilter: ReleaseStatus | 'ALL';
    setStatusFilter: (s: ReleaseStatus | 'ALL') => void;
    startDate: string;
    setStartDate: (s: string) => void;
    endDate: string;
    setEndDate: (s: string) => void;
    currentPage: number;
    setCurrentPage: (n: number) => void;
    filteredReleases: Release[];
    paginatedReleases: Release[];
    itemsPerPage: number;
    isPlatformSide: boolean;
    isOwner: boolean;
    canDelete: boolean;
    onCreateClick: () => void;
    onExport: () => void;
    onResumeClick: (id: string) => void;
    onDeleteClick: (id: string, title: string) => void;
    expandedReleaseId: string | null;
    setExpandedReleaseId: (id: string | null) => void;
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (open: boolean) => void;
    targetRelease: {id: string, title: string} | null;
    isDeleting: boolean;
    handleHardDelete: () => void;
    isCreateModalOpen: boolean;
    setCreateModalOpen: (open: boolean) => void;
    resumeId: string | undefined;
    handleReleaseSaved: (r: Release) => void;
}> = (props) => {
    const {
        user, releases, artists, labels, isLoading, filter, setFilter,
        statusFilter, setStatusFilter, startDate, setStartDate, endDate, setEndDate,
        currentPage, setCurrentPage, filteredReleases, paginatedReleases, itemsPerPage,
        isPlatformSide, isOwner, canDelete, onCreateClick, onExport, onResumeClick, onDeleteClick,
        expandedReleaseId, setExpandedReleaseId, isDeleteModalOpen, setIsDeleteModalOpen,
        targetRelease, isDeleting, handleHardDelete, isCreateModalOpen, setCreateModalOpen,
        resumeId, handleReleaseSaved
    } = props;

    return (
        <div className="space-y-4">
            <PmaInfoBar>
                <strong>Table:</strong> releases &nbsp;|&nbsp; 
                <strong>Records:</strong> {filteredReleases.length} &nbsp;|&nbsp;
                <span className="text-[#009900]">● Active</span>
            </PmaInfoBar>

            <PmaFieldset legend={isPlatformSide ? 'Distribution Queue' : 'Label Catalog'}>
                <div className="p-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 items-end mb-4">
                        <PmaInput
                            label="Search"
                            placeholder="Search catalog..."
                            value={filter}
                            onChange={setFilter}
                            className="flex-1 min-w-[200px]"
                        />
                        <PmaSelect
                            label="Status"
                            value={statusFilter}
                            onChange={val => setStatusFilter(val as ReleaseStatus | 'ALL')}
                            options={[
                                { value: 'ALL', label: 'All Statuses' },
                                ...Object.values(ReleaseStatus).map(s => ({ value: s, label: s }))
                            ]}
                        />
                        {isPlatformSide && (
                            <>
                                <PmaInput label="Start Date" type="date" value={startDate} onChange={setStartDate} />
                                <PmaInput label="End Date" type="date" value={endDate} onChange={setEndDate} />
                            </>
                        )}
                        <div className="flex gap-2">
                            {!isPlatformSide && user?.role !== UserRole.ARTIST && (
                                <PmaButton variant="primary" onClick={onCreateClick}>
                                    Create Release
                                </PmaButton>
                            )}
                            {isPlatformSide && (
                                <PmaButton variant="secondary" onClick={onExport}>
                                    Export
                                </PmaButton>
                            )}
                        </div>
                    </div>

                    {/* Results count */}
                    <div className="text-xs text-[#666] mb-2">
                        Showing {paginatedReleases.length} of {filteredReleases.length} records
                    </div>

                    {/* Table */}
                    <PmaTable
                        headers={[
                            { label: '', className: 'w-12' },
                            { label: 'Title / Artist' },
                            { label: 'UPC' },
                            { label: 'Status', className: 'text-center' },
                            { label: 'Action', className: 'text-center' }
                        ]}
                    >
                        {isLoading ? (
                            [...Array(10)].map((_, i) => (
                                <PmaTR key={i}>
                                    <PmaTD className="text-center">...</PmaTD>
                                    <PmaTD>Loading...</PmaTD>
                                    <PmaTD>...</PmaTD>
                                    <PmaTD className="text-center">...</PmaTD>
                                    <PmaTD className="text-center">...</PmaTD>
                                </PmaTR>
                            ))
                        ) : paginatedReleases.length === 0 ? (
                            <PmaTR>
                                <PmaTD colSpan={5} className="text-center py-8 text-[#999]">
                                    No records found
                                </PmaTD>
                            </PmaTR>
                        ) : paginatedReleases.map(release => {
                            const primaryIds = release.primaryArtistIds || [];
                            const artistName = primaryIds.length > 0 ? (artists.get(primaryIds[0])?.name || 'Unknown') : 'Unknown';
                            const isExpanded = expandedReleaseId === release.id;
                            const isDraft = release.status === ReleaseStatus.DRAFT;
                            const needsCorrection = release.status === ReleaseStatus.NEEDS_INFO;

                            return (
                                <React.Fragment key={release.id}>
                                    <PmaTR>
                                        <PmaTD className="text-center">
                                            {!isDraft && (
                                                <button
                                                    onClick={() => setExpandedReleaseId(isExpanded ? null : release.id)}
                                                    className="text-[#0066cc] hover:text-[#004499]"
                                                >
                                                    {isExpanded ? '[-]' : '[+]'}
                                                </button>
                                            )}
                                        </PmaTD>
                                        <PmaTD isLabel>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#ddd] rounded overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={release.artworkUrl || 'https://via.placeholder.com/40'}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-black">{release.title || 'Untitled'}</div>
                                                    <div className="text-xs text-[#444]">{artistName}</div>
                                                </div>
                                            </div>
                                        </PmaTD>
                                        <PmaTD className="font-mono text-xs text-black">
                                            {release.upc || '-'}
                                        </PmaTD>
                                        <PmaTD className="text-center">
                                            <PmaStatusBadge status={release.status} />
                                        </PmaTD>
                                        <PmaTD className="text-center">
                                            <div className="flex justify-center gap-2">
                                                {(canDelete || ((isDraft || needsCorrection) && !isPlatformSide)) && (
                                                    <button
                                                        onClick={() => onDeleteClick(release.id, release.title)}
                                                        className="text-[#cc0000] hover:underline text-xs"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                                {isDraft && !isPlatformSide ? (
                                                    <button
                                                        onClick={() => onResumeClick(release.id)}
                                                        className="text-[#0066cc] hover:underline text-xs"
                                                    >
                                                        Resume
                                                    </button>
                                                ) : needsCorrection && !isPlatformSide ? (
                                                    <button
                                                        onClick={() => onResumeClick(release.id)}
                                                        className="text-[#0066cc] hover:underline text-xs"
                                                    >
                                                        Fix
                                                    </button>
                                                ) : (
                                                    <Link
                                                        to={isPlatformSide ? `/release/${release.id}` : `/releases/${release.id}`}
                                                        className="text-[#0066cc] hover:underline text-xs"
                                                    >
                                                        View
                                                    </Link>
                                                )}
                                            </div>
                                        </PmaTD>
                                    </PmaTR>
                                    {isExpanded && (
                                        <PmaTR className="bg-[#fffff0]">
                                            <PmaTD colSpan={5} className="text-xs text-[#666]">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div><strong>Catalog #:</strong> {release.catalogueNumber || '-'}</div>
                                                    <div><strong>Created:</strong> {new Date(release.createdAt).toLocaleDateString()}</div>
                                                    <div><strong>Updated:</strong> {new Date(release.updatedAt).toLocaleDateString()}</div>
                                                </div>
                                            </PmaTD>
                                        </PmaTR>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </PmaTable>

                    {/* Pagination */}
                    <PmaPagination
                        currentPage={currentPage}
                        totalItems={filteredReleases.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </PmaFieldset>

            {/* Create Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Release Form" size="4xl">
                <ReleaseForm initialReleaseId={resumeId} onClose={() => setCreateModalOpen(false)} onSave={handleReleaseSaved} />
            </Modal>
        </div>
    );
};

// Original dark theme ReleaseList for partner users
const PartnerReleaseList: React.FC<{
    user: any;
    releases: Release[];
    artists: Map<string, Artist>;
    labels: Map<string, Label>;
    isLoading: boolean;
    filter: string;
    setFilter: (f: string) => void;
    statusFilter: ReleaseStatus | 'ALL';
    setStatusFilter: (s: ReleaseStatus | 'ALL') => void;
    startDate: string;
    setStartDate: (s: string) => void;
    endDate: string;
    setEndDate: (s: string) => void;
    currentPage: number;
    setCurrentPage: (n: number) => void;
    filteredReleases: Release[];
    paginatedReleases: Release[];
    itemsPerPage: number;
    isPlatformSide: boolean;
    isOwner: boolean;
    canDelete: boolean;
    onCreateClick: () => void;
    onExport: () => void;
    onResumeClick: (id: string) => void;
    onDeleteClick: (id: string, title: string) => void;
    expandedReleaseId: string | null;
    setExpandedReleaseId: (id: string | null) => void;
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (open: boolean) => void;
    targetRelease: {id: string, title: string} | null;
    isDeleting: boolean;
    handleHardDelete: () => void;
    isCreateModalOpen: boolean;
    setCreateModalOpen: (open: boolean) => void;
    resumeId: string | undefined;
    handleReleaseSaved: (r: Release) => void;
}> = (props) => {
    const {
        user, releases, artists, labels, isLoading, filter, setFilter,
        statusFilter, setStatusFilter, startDate, setStartDate, endDate, setEndDate,
        currentPage, setCurrentPage, filteredReleases, paginatedReleases, itemsPerPage,
        isPlatformSide, isOwner, canDelete, onCreateClick, onExport, onResumeClick, onDeleteClick,
        expandedReleaseId, setExpandedReleaseId, isDeleteModalOpen, setIsDeleteModalOpen,
        targetRelease, isDeleting, handleHardDelete, isCreateModalOpen, setCreateModalOpen,
        resumeId, handleReleaseSaved
    } = props;

    return (
        <div className="animate-fade-in">
            <Card className="p-0 overflow-hidden">
                <div className="p-8 flex flex-col gap-4 border-b border-white/5">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                            Label Catalog
                        </h2>
                        <div className="flex gap-3">
                            {user?.role !== UserRole.ARTIST && (
                                <Button onClick={onCreateClick} className="text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-primary/20">Create Release</Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-end mt-4">
                        <div className="w-full md:w-80 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <Input placeholder="Search catalog metadata..." value={filter} onChange={e => setFilter(e.target.value)} className="pl-11 h-12 bg-black/20 border-gray-700" />
                        </div>
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value as ReleaseStatus | 'ALL')}
                            className="bg-black/20 border border-gray-700 rounded-xl px-4 py-2 text-white h-12 text-xs font-bold focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                            <option value="ALL">All Lifecycle Statuses</option>
                            {Object.values(ReleaseStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <Table>
                    <THead>
                        <TR>
                            <TH className="w-12 text-center"></TH>
                            <TH>Intel / Target</TH>
                            <TH>Identifiers</TH>
                            <TH>Status</TH>
                            <TH className="text-right">Gate</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {isLoading ? (
                            [...Array(10)].map((_, i) => (
                                <TR key={i}>
                                    <TD className="text-center"><Skeleton className="w-4 h-4 mx-auto" /></TD>
                                    <TD>
                                        <div className="flex items-center gap-5">
                                            <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                                            <div className="flex-1 space-y-2 min-w-0">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </div>
                                    </TD>
                                    <TD>
                                        <div className="space-y-1">
                                            <Skeleton className="h-2 w-16" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </TD>
                                    <TD><Skeleton className="h-6 w-20 rounded-full" /></TD>
                                    <TD className="text-right"><Skeleton className="h-8 w-24 ml-auto rounded-full" /></TD>
                                </TR>
                            ))
                        ) : (
                            <>
                                {paginatedReleases.map(release => {
                                    const primaryIds = release.primaryArtistIds || [];
                                    const artistName = primaryIds.length > 0 ? (artists.get(primaryIds[0])?.name || 'Untitled') : 'Untitled';
                                    const isExpanded = expandedReleaseId === release.id;
                                    const isDraft = release.status === ReleaseStatus.DRAFT;
                                    const needsCorrection = release.status === ReleaseStatus.NEEDS_INFO;
                                    return (
                                        <React.Fragment key={release.id}>
                                            <TR className={isExpanded ? 'bg-white/[0.03]' : ''}>
                                                <TD className="text-center">
                                                    {!isDraft && (
                                                        <button onClick={() => setExpandedReleaseId(isExpanded ? null : release.id)} className="text-gray-600 hover:text-primary p-2 transition-all">
                                                            {isExpanded ? <ArrowUpIcon className="w-4 h-4"/> : <ArrowDownIcon className="w-4 h-4"/>}
                                                        </button>
                                                    )}
                                                </TD>
                                                <TD>
                                                    <div className="flex items-center gap-5">
                                                        <div className="relative w-14 h-14 flex-shrink-0 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-white/5">
                                                            <img
                                                                src={release.artworkUrl || 'https://via.placeholder.com/60'}
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                alt=""
                                                                loading="lazy"
                                                                decoding="async"
                                                            />
                                                            {(isDraft || needsCorrection) && (
                                                                <div className={`absolute -top-1.5 -left-1.5 w-4 h-4 ${needsCorrection ? 'bg-blue-500' : 'bg-yellow-500'} rounded-full border-[3px] border-gray-900 shadow-xl`} />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] font-black text-white truncate group-hover:text-primary transition-colors tracking-tight uppercase flex items-center">
                                                                {release.title || 'Untitled Session'}
                                                                {release.youtubeContentId && (
                                                                    <span className="text-[8px] bg-red-600/20 text-red-500 border border-red-600/30 px-1.5 py-0.5 rounded font-black ml-2 align-middle tracking-widest uppercase">CID</span>
                                                                )}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1 truncate uppercase">
                                                                {artistName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TD>
                                                <TD>
                                                    <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 inline-flex flex-col gap-0.5">
                                                        <span className="text-[8px] text-gray-600 font-black uppercase">Distro Code</span>
                                                        <span className="text-white tracking-widest font-mono">{release.upc || 'UNASSIGNED'}</span>
                                                    </div>
                                                </TD>
                                                <TD><Badge status={release.status} /></TD>
                                                <TD className="text-right">
                                                    <div className="flex justify-end gap-3 items-center">
                                                        {((isDraft || needsCorrection)) && (
                                                            <button
                                                                onClick={() => onDeleteClick(release.id, release.title)}
                                                                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                                                title="Hard Purge Authority"
                                                            >
                                                                <TrashIcon className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        {isDraft ? (
                                                            <Button onClick={() => onResumeClick(release.id)} className="text-[9px] py-2 px-5 font-black uppercase tracking-widest shadow-lg shadow-primary/20">Resume Engine</Button>
                                                        ) : needsCorrection ? (
                                                            <Button
                                                                onClick={() => onResumeClick(release.id)}
                                                                className="text-[9px] py-2 px-5 font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20 border-none"
                                                            >
                                                                Fix Meta
                                                            </Button>
                                                        ) : (
                                                            <Link to={`/releases/${release.id}`} className="text-primary font-black text-[9px] uppercase tracking-[0.2em] transition-all bg-primary/5 px-6 py-2 rounded-full border border-primary/20 hover:bg-primary/20 hover:text-white">
                                                                Meta Explorer
                                                            </Link>
                                                        )}
                                                    </div>
                                                </TD>
                                            </TR>
                                        </React.Fragment>
                                    );
                                })}
                                {filteredReleases.length === 0 && (
                                    <TR>
                                        <TD colSpan={5} className="py-32 text-center text-gray-600 font-bold uppercase tracking-widest text-xs opacity-50">No catalog items identified in the current filter.</TD>
                                    </TR>
                                )}
                            </>
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

            {/* Deletion Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                title="Vault Purge Protocol"
                size="md"
            >
                <div className="space-y-6 text-center py-4">
                    <div className="w-20 h-20 bg-red-900/20 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-red-500/20 animate-pulse">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">Confirm Hard Deletion</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            You are about to PERMANENTLY erase <span className="text-white font-bold">"{targetRelease?.title}"</span> from the global distribution archive.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button variant="secondary" className="flex-1 font-black uppercase text-[10px]" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Abort Protocol</Button>
                        <Button variant="danger" className="flex-1 font-black uppercase text-[10px] shadow-xl shadow-red-500/20" disabled={isDeleting} onClick={handleHardDelete}>
                            {isDeleting ? <Spinner className="w-4 h-4" /> : 'Execute Purge'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Asset Transmission Protocol" size="4xl">
                <ReleaseForm initialReleaseId={resumeId} onClose={() => setCreateModalOpen(false)} onSave={handleReleaseSaved} />
            </Modal>
        </div>
    );
};

const ReleaseList: React.FC = () => {
    const { user, showToast } = useContext(AppContext);
    const [releases, setReleases] = useState<Release[]>([]);
    const [artists, setArtists] = useState<Map<string, Artist>>(new Map());
    const [labels, setLabels] = useState<Map<string, Label>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    
    // Deletion State
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [targetRelease, setTargetRelease] = useState<{id: string, title: string} | null>(null);
    
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<ReleaseStatus | 'ALL'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [resumeId, setResumeId] = useState<string | undefined>(undefined);
    const [expandedReleaseId, setExpandedReleaseId] = useState<string | null>(null);

    const [searchParams] = useSearchParams();

    useEffect(() => {
        const status = searchParams.get('status');
        if (status && Object.values(ReleaseStatus).includes(status as ReleaseStatus)) {
            setStatusFilter(status as ReleaseStatus);
        }
    }, [searchParams]);

    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;
    const isOwner = user?.role === UserRole.OWNER;
    const canDelete = isOwner || user?.permissions?.canDeleteReleases;

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const releasePromise = isPlatformSide ? api.getAllReleases() : api.getReleasesByLabel(user.labelId!);
            
            const fetchedReleases = await releasePromise;
            setReleases(fetchedReleases);
            setIsLoading(false);

            let artistsPromise;
            if (isPlatformSide) {
                artistsPromise = api.getAllArtists();
            } else {
                artistsPromise = api.getArtistsByLabel(user.labelId!);
            }

            const [allArtists, allLabels] = await Promise.all([
                artistsPromise,
                isPlatformSide ? api.getLabels() : Promise.resolve([])
            ]);
            
            const artistMap = new Map<string, Artist>();
            allArtists.forEach(a => artistMap.set(a.id, a));
            setArtists(artistMap);
            const labelMap = new Map<string, Label>();
            allLabels.forEach(l => labelMap.set(l.id, l));
            setLabels(labelMap);
        } catch (e) {
            console.error("Load failed", e);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, statusFilter, startDate, endDate]);

    const handleReleaseSaved = (newRelease: Release) => {
        fetchData();
        setCreateModalOpen(false);
        setResumeId(undefined);
    };

    const triggerDeleteConfirmation = (id: string, title: string) => {
        if (window.confirm(`Are you sure you want to PERMANENTLY delete "${title}"? This action cannot be undone.`)) {
            setTargetRelease({ id, title });
            handleHardDeleteDirect(id, title);
        }
    };

    const handleHardDeleteDirect = async (id: string, title: string) => {
        setIsDeleting(true);
        try {
            await api.deleteRelease(id);
            showToast(`Deleted: "${title}"`, 'success');
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Delete failed.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExport = async () => {
        setIsLoading(true);
        try {
            // Fetch full data from DB including tracks, filtered by date range and status
            const allData = await api.exportReleases(
                startDate || undefined,
                endDate || undefined,
                statusFilter
            );
            
            // Apply current text filter to the exported data
            const exportData = allData.filter(release => {
                const primaryIds = release.primaryArtistIds || [];
                const artistName = primaryIds.length > 0 ? (artists.get(primaryIds[0])?.name || '') : '';
                const labelName = labels.get(release.labelId)?.name || '';
                const matchesText = filter === '' ||
                    release.title.toLowerCase().includes(filter.toLowerCase()) ||
                    (release.upc && release.upc.includes(filter)) ||
                    artistName.toLowerCase().includes(filter.toLowerCase()) ||
                    labelName.toLowerCase().includes(filter.toLowerCase());
                return matchesText;
            });

            if (exportData.length === 0) {
                showToast("No data to export", "info");
                return;
            }

            await exportReleasesToCSV(exportData, artists, labels);
            showToast(`Exported ${exportData.length} releases`, "success");
        } catch (e) {
            console.error("Export failed", e);
            showToast("Export failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredReleases = useMemo(() => {
        return releases.filter(release => {
            const primaryIds = release.primaryArtistIds || [];
            const artistName = primaryIds.length > 0 ? (artists.get(primaryIds[0])?.name || '') : '';
            const labelName = labels.get(release.labelId)?.name || '';
            const matchesStatus = statusFilter === 'ALL' || release.status === statusFilter;
            const matchesText = filter === '' ||
                release.title.toLowerCase().includes(filter.toLowerCase()) ||
                (release.upc && release.upc.includes(filter)) ||
                artistName.toLowerCase().includes(filter.toLowerCase()) ||
                labelName.toLowerCase().includes(filter.toLowerCase());
            let matchesDate = true;
            if (isPlatformSide && startDate && endDate) {
                const releaseDate = new Date(release.createdAt).setHours(0,0,0,0);
                const start = new Date(startDate).setHours(0,0,0,0);
                const end = new Date(endDate).setHours(0,0,0,0);
                matchesDate = releaseDate >= start && releaseDate <= end;
            }
            return matchesStatus && matchesText && matchesDate;
        }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [releases, filter, statusFilter, startDate, endDate, artists, labels, isPlatformSide]);

    const paginatedReleases = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredReleases.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredReleases, currentPage]);

    const commonProps = {
        user, releases, artists, labels, isLoading, filter, setFilter,
        statusFilter, setStatusFilter, startDate, setStartDate, endDate, setEndDate,
        currentPage, setCurrentPage, filteredReleases, paginatedReleases, itemsPerPage,
        isPlatformSide, isOwner, canDelete,
        onCreateClick: () => { setResumeId(undefined); setCreateModalOpen(true); },
        onExport: handleExport,
        onResumeClick: (id: string) => { setResumeId(id); setCreateModalOpen(true); },
        onDeleteClick: triggerDeleteConfirmation,
        expandedReleaseId, setExpandedReleaseId,
        isDeleteModalOpen, setIsDeleteModalOpen,
        targetRelease, isDeleting, handleHardDelete: () => {}, // No longer used by PmaReleaseList
        isCreateModalOpen, setCreateModalOpen,
        resumeId, handleReleaseSaved
    };

    // Use phpMyAdmin style for admin/employee users
    if (isPlatformSide) {
        return <PmaReleaseList {...commonProps} />;
    }

    // Use dark theme for partner users
    return <PartnerReleaseList {...commonProps} />;
};

export default ReleaseList;
