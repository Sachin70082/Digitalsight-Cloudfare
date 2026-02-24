import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Notice, NoticeType, UserRole, EMPLOYEE_DESIGNATIONS, NoticeAudience } from '../types';
import { Button, Input, Modal, Spinner, PageLoader, Textarea } from '../components/ui';
import { PmaFieldset, PmaTable, PmaTR, PmaTD, PmaButton, PmaInput, PmaSelect, PmaStatusBadge, PmaPagination, PmaInfoBar } from '../components/PmaStyle';

// phpMyAdmin style Notices page for admin users
const PmaNoticesView: React.FC<{
    currentUser: any;
    notices: Notice[];
    isLoading: boolean;
    isStaff: boolean;
    onOpenCreate: () => void;
    onOpenEdit: (n: Notice) => void;
    onOpenDelete: (id: string) => void;
    // Modal states
    isFormModalOpen: boolean;
    setIsFormModalOpen: (open: boolean) => void;
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (open: boolean) => void;
    editingId: string | null;
    title: string;
    setTitle: (t: string) => void;
    message: string;
    setMessage: (m: string) => void;
    type: NoticeType;
    setType: (t: NoticeType) => void;
    target: NoticeAudience;
    setTarget: (t: NoticeAudience) => void;
    handleSave: (e: React.FormEvent) => void;
    noticeToDelete: string | null;
    isDeleting: boolean;
    confirmDelete: () => void;
    getRank: (d?: string) => number;
    myRank: number;
}> = (props) => {
    const {
        currentUser, notices, isLoading, isStaff, onOpenCreate, onOpenEdit, onOpenDelete,
        isFormModalOpen, setIsFormModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
        editingId, title, setTitle, message, setMessage, type, setType, target, setTarget,
        handleSave, noticeToDelete, isDeleting, confirmDelete, getRank, myRank
    } = props;

    return (
        <div className="space-y-4">
            <PmaInfoBar>
                <strong>Table:</strong> corporate_notices &nbsp;|&nbsp; 
                <strong>Records:</strong> {notices.length} &nbsp;|&nbsp;
                <span className="text-[#009900]">● Active</span>
            </PmaInfoBar>

            <PmaFieldset legend="Corporate Notice Board">
                <div className="p-4">
                    {/* Actions */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-xs text-black">
                            Showing {notices.length} notices
                        </div>
                        {isStaff && (
                            <PmaButton variant="primary" onClick={onOpenCreate}>
                                + Post New Notice
                            </PmaButton>
                        )}
                    </div>

                    {/* Table */}
                    <PmaTable
                        headers={[
                            { label: 'Type' },
                            { label: 'Title' },
                            { label: 'Author' },
                            { label: 'Audience' },
                            { label: 'Date', className: 'text-right' },
                            { label: 'Actions', className: 'text-center' }
                        ]}
                    >
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <PmaTR key={i}>
                                    <PmaTD>Loading...</PmaTD>
                                    <PmaTD>...</PmaTD>
                                    <PmaTD>...</PmaTD>
                                    <PmaTD>...</PmaTD>
                                    <PmaTD className="text-right">...</PmaTD>
                                    <PmaTD className="text-center">...</PmaTD>
                                </PmaTR>
                            ))
                        ) : notices.length === 0 ? (
                            <PmaTR>
                                <PmaTD colSpan={6} className="text-center py-8 text-[#999]">
                                    No notices found
                                </PmaTD>
                            </PmaTR>
                        ) : notices.map(notice => {
                            const isAuthor = notice.authorId === currentUser?.id;
                            const canEdit = isAuthor || isStaff;
                            
                            return (
                                <PmaTR key={notice.id}>
                                    <PmaTD>
                                        <PmaStatusBadge status={notice.type} />
                                    </PmaTD>
                                    <PmaTD isLabel>
                                        <div className="font-medium text-black">{notice.title}</div>
                                        <div className="text-xs text-[#444] truncate max-w-xs">{notice.message.substring(0, 50)}...</div>
                                    </PmaTD>
                                    <PmaTD>
                                        <div className="text-sm text-black">{notice.authorName || 'System'}</div>
                                        <div className="text-xs text-[#444]">{notice.authorDesignation || ''}</div>
                                    </PmaTD>
                                    <PmaTD>
                                        <span className="text-xs text-black">
                                            {notice.targetAudience === 'ALL_STAFF' ? 'Internal Staff' : 
                                             notice.targetAudience === 'ALL_LABELS' ? 'Partner Labels' :
                                             notice.targetAudience === 'ALL_ARTISTS' ? 'All Artists' :
                                             notice.targetAudience === 'EVERYONE' ? 'Global' :
                                             notice.targetAudience}
                                        </span>
                                    </PmaTD>
                                    <PmaTD className="text-right">
                                        <div className="text-xs text-black">{new Date(notice.timestamp).toLocaleDateString()}</div>
                                        <div className="text-xs text-[#444]">{new Date(notice.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    </PmaTD>
                                    <PmaTD className="text-center">
                                        {canEdit && (
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => onOpenEdit(notice)} className="text-[#0066cc] hover:underline text-xs">Edit</button>
                                                <button onClick={() => onOpenDelete(notice.id)} className="text-[#cc0000] hover:underline text-xs">Delete</button>
                                            </div>
                                        )}
                                    </PmaTD>
                                </PmaTR>
                            );
                        })}
                    </PmaTable>
                </div>
            </PmaFieldset>

            {/* Creation/Edit Modal */}
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingId ? "Edit Notice" : "Post New Notice"} size="2xl">
                <form onSubmit={handleSave} className="space-y-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-black mb-1">Notice Type</label>
                            <select 
                                value={type}
                                onChange={e => setType(e.target.value as NoticeType)}
                                className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                            >
                                {Object.values(NoticeType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-black mb-1">Target Audience</label>
                            <select 
                                value={target}
                                onChange={e => setTarget(e.target.value as NoticeAudience)}
                                className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                            >
                                <optgroup label="Internal Staff">
                                    <option value="ALL_STAFF">All Internal Staff</option>
                                    {EMPLOYEE_DESIGNATIONS.map(d => {
                                        const rank = getRank(d);
                                        const disabled = currentUser?.role !== UserRole.OWNER && rank <= myRank;
                                        return <option key={d} value={d} disabled={disabled}>{d}</option>;
                                    })}
                                </optgroup>
                                <optgroup label="External Partners">
                                    <option value="ALL_LABELS">All Partner Labels</option>
                                    <option value="ALL_ARTISTS">All Artists</option>
                                </optgroup>
                                <optgroup label="Global">
                                    <option value="EVERYONE">Everyone</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-black mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-black mb-1">Message</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            required
                            rows={6}
                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-[#ccc]">
                        <PmaButton variant="secondary" onClick={() => setIsFormModalOpen(false)}>Cancel</PmaButton>
                        <PmaButton variant="primary" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : (editingId ? 'Update' : 'Post')}
                        </PmaButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// Original dark theme Notices for partner users
const PartnerNoticesView: React.FC<{
    currentUser: any;
    notices: Notice[];
    isLoading: boolean;
    isStaff: boolean;
    onOpenCreate: () => void;
    onOpenEdit: (n: Notice) => void;
    onOpenDelete: (id: string) => void;
    isFormModalOpen: boolean;
    setIsFormModalOpen: (open: boolean) => void;
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (open: boolean) => void;
    editingId: string | null;
    title: string;
    setTitle: (t: string) => void;
    message: string;
    setMessage: (m: string) => void;
    type: NoticeType;
    setType: (t: NoticeType) => void;
    target: NoticeAudience;
    setTarget: (t: NoticeAudience) => void;
    handleSave: (e: React.FormEvent) => void;
    noticeToDelete: string | null;
    isDeleting: boolean;
    confirmDelete: () => void;
    getRank: (d?: string) => number;
    myRank: number;
}> = (props) => {
    const NOTICE_STYLING: Record<NoticeType, string> = {
        [NoticeType.URGENT]: 'border-red-500/50 bg-red-900/10',
        [NoticeType.UPDATE]: 'border-blue-500/50 bg-blue-900/10',
        [NoticeType.POLICY]: 'border-purple-500/50 bg-purple-900/10',
        [NoticeType.GENERAL]: 'border-green-500/50 bg-green-900/10',
        [NoticeType.EVENT]: 'border-yellow-500/50 bg-yellow-900/10'
    };

    const {
        currentUser, notices, isLoading, isStaff, onOpenCreate, onOpenEdit, onOpenDelete,
        isFormModalOpen, setIsFormModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
        editingId, title, setTitle, message, setMessage, type, setType, target, setTarget,
        handleSave, noticeToDelete, isDeleting, confirmDelete, getRank, myRank
    } = props;

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Corporate Notice Board</h1>
                    <p className="text-gray-400 mt-2 text-lg">Official platform directives and communications.</p>
                </div>
                {isStaff && (
                    <Button onClick={onOpenCreate} className="px-8 py-3 shadow-xl shadow-primary/20">Post New Notice</Button>
                )}
            </div>

            <div className="space-y-6">
                {notices.map(notice => {
                    const isAuthor = notice.authorId === currentUser?.id;
                    const canEdit = isAuthor || isStaff;
                    
                    return (
                        <div
                            key={notice.id}
                            className={`p-8 rounded-[2rem] border border-white/5 backdrop-blur-xl transition-all duration-500 ${NOTICE_STYLING[notice.type]} border-l-[12px] group relative hover:border-white/10`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{notice.type}</span>
                                    {notice.type === NoticeType.URGENT && (
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                         <p className="text-[10px] text-gray-500 font-mono uppercase font-bold">{new Date(notice.timestamp).toLocaleDateString()}</p>
                                         <p className="text-[9px] text-gray-600 font-mono uppercase mt-1">{new Date(notice.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    {canEdit && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => onOpenEdit(notice)} 
                                                className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => onOpenDelete(notice.id)} 
                                                className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-gray-400 hover:text-red-500"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">{notice.title}</h2>
                            <p className="text-gray-300 leading-relaxed text-lg mb-6 whitespace-pre-wrap">{notice.message}</p>
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-t border-white/5 pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-bold text-xl text-primary border border-white/10">
                                        {(notice.authorName || 'A').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white uppercase tracking-wider">{notice.authorName || 'Anonymous'}</p>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{notice.authorDesignation || 'System'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingId ? "Revise Board Notice" : "Broadcast Board Notice"} size="2xl">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Notice Classification</label>
                            <select 
                                value={type}
                                onChange={e => setType(e.target.value as NoticeType)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                            >
                                {Object.values(NoticeType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Target Visibility</label>
                            <select 
                                value={target}
                                onChange={e => setTarget(e.target.value as NoticeAudience)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                            >
                                <optgroup label="Internal Staff">
                                    <option value="ALL_STAFF">Broadcast to All Internal Staff</option>
                                    {EMPLOYEE_DESIGNATIONS.map(d => {
                                        const rank = getRank(d);
                                        const disabled = currentUser?.role !== UserRole.OWNER && rank <= myRank;
                                        return <option key={d} value={d} disabled={disabled}>{d}</option>;
                                    })}
                                </optgroup>
                                <optgroup label="External Partners">
                                    <option value="ALL_LABELS">All Partner Labels</option>
                                    <option value="ALL_ARTISTS">All Artists</option>
                                </optgroup>
                                <optgroup label="Global">
                                    <option value="EVERYONE">Global Broadcast</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <Input label="Headline" value={title} onChange={e => setTitle(e.target.value)} required />
                    <Textarea label="Message Body" rows={8} value={message} onChange={e => setMessage(e.target.value)} required />

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                        <Button type="button" variant="secondary" onClick={() => setIsFormModalOpen(false)}>Discard</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? <Spinner /> : (editingId ? 'Update Notice' : 'Post to Board')}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion" size="md">
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Are you sure?</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">This notice will be permanently removed.</p>
                    <div className="flex gap-4 mt-8">
                        <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="danger" className="flex-1" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? <Spinner className="w-4 h-4" /> : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const Notices: React.FC = () => {
    const { user: currentUser } = useContext(AppContext);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<NoticeType>(NoticeType.GENERAL);
    const [target, setTarget] = useState<NoticeAudience>('ALL_STAFF');

    const fetchNotices = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const data = await api.getNotices(currentUser);
            setNotices(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, [currentUser]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsLoading(true);
        try {
            if (editingId) {
                await api.updateNotice(editingId, { title, message, type, targetAudience: target }, currentUser);
            } else {
                await api.addNotice({ title, message, type, targetAudience: target }, currentUser);
            }
            await fetchNotices();
            setIsFormModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Operation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this notice? This action cannot be undone.")) {
            setNoticeToDelete(id);
            confirmDeleteDirect(id);
        }
    };

    const confirmDeleteDirect = async (id: string) => {
        if (!currentUser) return;
        setIsDeleting(true);
        try {
            await api.deleteNotice(id, currentUser);
            await fetchNotices();
        } catch (err: any) {
            alert(err.message || 'Delete failed');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setTitle('');
        setMessage('');
        setType(NoticeType.GENERAL);
        setTarget('ALL_STAFF');
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (n: Notice) => {
        setEditingId(n.id);
        setTitle(n.title);
        setMessage(n.message);
        setType(n.type);
        setTarget(n.targetAudience);
        setIsFormModalOpen(true);
    };

    const getRank = (d?: string) => {
        if (!d) return 999;
        return EMPLOYEE_DESIGNATIONS.indexOf(d as any);
    };

    const myRank = getRank(currentUser?.designation);
    const isStaff = currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.EMPLOYEE;
    const isPlatformSide = currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.EMPLOYEE;

    if (isLoading && notices.length === 0) return <PageLoader />;

    const commonProps = {
        currentUser, notices, isLoading, isStaff, onOpenCreate: handleOpenCreate, onOpenEdit: handleOpenEdit, onOpenDelete: handleOpenDelete,
        isFormModalOpen, setIsFormModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
        editingId, title, setTitle, message, setMessage, type, setType, target, setTarget,
        handleSave, noticeToDelete, isDeleting, confirmDelete: () => {}, getRank, myRank
    };

    // Use phpMyAdmin style for admin/employee users
    if (isPlatformSide) {
        return <PmaNoticesView {...commonProps} />;
    }

    // Use dark theme for partner users
    return <PartnerNoticesView {...commonProps} />;
};

export default Notices;
