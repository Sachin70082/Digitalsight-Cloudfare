import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Label, Artist, UserRole, User, UserPermissions, ArtistType } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner, Input, Modal, PageLoader } from '../components/ui';
import { PmaFieldset, PmaTable, PmaTR, PmaTD, PmaButton, PmaInput, PmaSelect, PmaStatusBadge, PmaInfoBar } from '../components/PmaStyle';
import { ChevronDownIcon } from '../components/Icons';

interface HierarchyNode {
    id: string;
    name: string;
    type: 'Label' | 'Artist';
    email?: string;
    artistType?: ArtistType;
    spotifyId?: string;
    appleMusicId?: string;
    instagramUrl?: string;
    children?: HierarchyNode[];
    parentId?: string;
}

// phpMyAdmin style Network view for admin users
const PmaNetworkView: React.FC<{
    user: User | null;
    showToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ user, showToast }) => {
    const [tree, setTree] = useState<HierarchyNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const [isRemovalModalOpen, setRemovalModalOpen] = useState(false);
    const [nodeToRemove, setNodeToRemove] = useState<HierarchyNode | null>(null);
    const [removalNote, setRemovalNote] = useState('');

    const [isModifyModalOpen, setModifyModalOpen] = useState(false);
    const [nodeToModify, setNodeToModify] = useState<HierarchyNode | null>(null);
    const [modifyName, setModifyName] = useState('');
    const [modifyEmail, setModifyEmail] = useState('');
    const [modifyArtistType, setModifyArtistType] = useState<ArtistType>(ArtistType.SINGER);
    const [modifySpotifyId, setModifySpotifyId] = useState('');
    const [modifyAppleMusicId, setModifyAppleMusicId] = useState('');
    const [modifyInstagramUrl, setModifyInstagramUrl] = useState('');
    const [modifyPermissions, setModifyPermissions] = useState<UserPermissions | null>(null);

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedIds(next);
    };

    const buildTree = async () => {
        setIsLoading(true);
        try {
            const allLabels = await api.getLabels();
            const allArtists = await api.getAllArtists();
            
            const labelAdminMap = new Map<string, string>();
            // Fetch admins in parallel for better performance
            await Promise.all(allLabels.map(async (l) => {
                const admin = await api.getLabelAdmin(l.id);
                if (admin) labelAdminMap.set(l.id, admin.email);
            }));

            const visited = new Set<string>();

            const getSubtree = (parentId: string | undefined): HierarchyNode[] => {
                const filteredLabels = allLabels.filter(l => l.parentLabelId === parentId);
                const nodes: HierarchyNode[] = filteredLabels.map(label => {
                    if (visited.has(label.id)) return null; 
                    visited.add(label.id);

                    const labelArtists = allArtists
                        .filter(a => a.labelId === label.id)
                        .map(a => ({ 
                            id: a.id, 
                            name: a.name, 
                            type: 'Artist' as const, 
                            email: a.email,
                            artistType: a.type,
                            spotifyId: a.spotifyId,
                            appleMusicId: a.appleMusicId,
                            instagramUrl: a.instagramUrl
                        }));

                    const subLabels = getSubtree(label.id);

                    return {
                        id: label.id,
                        name: label.name,
                        type: 'Label',
                        email: labelAdminMap.get(label.id),
                        parentId: parentId,
                        children: [...subLabels, ...labelArtists]
                    };
                }).filter(n => n !== null) as HierarchyNode[];
                return nodes;
            };

            let finalNodes: HierarchyNode[] = [];
            if (user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE) {
                // For admin/employee, start from root labels (no parent)
                finalNodes = getSubtree(undefined);
                
                // If some labels were not visited (e.g. they have a parentId that doesn't exist), 
                // add them as roots to ensure everything is shown
                const remainingLabels = allLabels.filter(l => !visited.has(l.id));
                if (remainingLabels.length > 0) {
                    const orphans = remainingLabels.map(l => {
                        visited.add(l.id);
                        return {
                            id: l.id,
                            name: l.name,
                            type: 'Label' as const,
                            email: labelAdminMap.get(l.id),
                            children: [
                                ...getSubtree(l.id),
                                ...allArtists.filter(a => a.labelId === l.id).map(a => ({
                                    id: a.id,
                                    name: a.name,
                                    type: 'Artist' as const,
                                    email: a.email
                                }))
                            ]
                        };
                    });
                    finalNodes = [...finalNodes, ...orphans];
                }
            } else if (user?.labelId) {
                const myLabel = allLabels.find(l => l.id === user.labelId);
                if (myLabel) {
                    visited.add(myLabel.id);
                    finalNodes = [{
                        id: myLabel.id,
                        name: myLabel.name,
                        type: 'Label',
                        email: user.email,
                        children: [
                            ...getSubtree(myLabel.id),
                            ...allArtists.filter(a => a.labelId === myLabel.id).map(a => ({ 
                                id: a.id, 
                                name: a.name, 
                                type: 'Artist' as const, 
                                email: a.email,
                                artistType: a.type,
                                spotifyId: a.spotifyId,
                                appleMusicId: a.appleMusicId,
                                instagramUrl: a.instagramUrl
                            }))
                        ]
                    }];
                    setExpandedIds(prev => new Set([...prev, myLabel.id]));
                }
            }
            setTree(finalNodes);
        } catch (error) {
            console.error("Failed to build network tree:", error);
            showToast("Failed to load network hierarchy", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        buildTree();
    }, [user]);

    const filteredTree = useMemo(() => {
        if (!searchTerm) return tree;
        const term = searchTerm.toLowerCase();
        
        const filterNodes = (nodes: HierarchyNode[]): HierarchyNode[] => {
            return nodes
                .map(node => {
                    const childrenMatch = node.children ? filterNodes(node.children) : [];
                    const selfMatches = 
                        node.name.toLowerCase().includes(term) || 
                        node.id.toLowerCase().includes(term) ||
                        (node.email && node.email.toLowerCase().includes(term));
                    
                    if (selfMatches || childrenMatch.length > 0) {
                        return { ...node, children: childrenMatch };
                    }
                    return null;
                })
                .filter(n => n !== null) as HierarchyNode[];
        };

        return filterNodes(tree);
    }, [tree, searchTerm]);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const idsToExpand = new Set<string>();
            const collectParentIds = (nodes: HierarchyNode[]) => {
                nodes.forEach(node => {
                    if (node.children && node.children.length > 0) {
                        idsToExpand.add(node.id);
                        collectParentIds(node.children);
                    }
                });
            };
            collectParentIds(filteredTree);
            setExpandedIds(prev => new Set([...prev, ...idsToExpand]));
        }
    }, [filteredTree, searchTerm]);

    const handleOpenRemove = (node: HierarchyNode) => {
        setNodeToRemove(node);
        setRemovalNote('');
        setRemovalModalOpen(true);
    };

    const handleConfirmRemove = async () => {
        if (!nodeToRemove || !removalNote.trim() || !user) return;
        setIsLoading(true);
        
        try {
            if (nodeToRemove.type === 'Label') {
                await api.deleteLabel(nodeToRemove.id, user);
            } else {
                await api.deleteArtist(nodeToRemove.id, user);
            }
            showToast(`${nodeToRemove.name} purged from network hierarchy.`, 'success');
            setRemovalModalOpen(false);
            setNodeToRemove(null);
            await buildTree();
        } catch (e: any) {
            showToast(e.message || 'Purge failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModify = async (node: HierarchyNode) => {
        setNodeToModify(node);
        setModifyName(node.name);
        setModifyEmail(node.email || '');
        
        if (node.type === 'Label') {
            const admin = await api.getLabelAdmin(node.id);
            if (admin) setModifyPermissions({
                ...admin.permissions,
                canSubmitAlbums: admin.permissions.canSubmitAlbums ?? true
            });
            setModifyArtistType(ArtistType.SINGER);
            setModifySpotifyId('');
            setModifyAppleMusicId('');
            setModifyInstagramUrl('');
        } else {
            setModifyPermissions(null);
            setModifyArtistType(node.artistType || ArtistType.SINGER);
            setModifySpotifyId(node.spotifyId || '');
            setModifyAppleMusicId(node.appleMusicId || '');
            setModifyInstagramUrl(node.instagramUrl || '');
        }
        setModifyModalOpen(true);
    };

    const handleConfirmModify = async () => {
        if (!nodeToModify || !user) return;
        setIsLoading(true);

        try {
            if (nodeToModify.type === 'Label') {
                await api.updateLabel(nodeToModify.id, { name: modifyName });
                if (modifyPermissions) {
                    const admin = await api.getLabelAdmin(nodeToModify.id);
                    if (admin) {
                        await api.updateUserPermissions(admin.id, modifyPermissions, user);
                    }
                }
            } else {
                await api.updateArtist(nodeToModify.id, {
                    name: modifyName,
                    email: modifyEmail,
                    type: modifyArtistType,
                    spotifyId: modifySpotifyId,
                    appleMusicId: modifyAppleMusicId,
                    instagramUrl: modifyInstagramUrl
                }, user);
            }
            showToast('Node authority matrix synchronized.', 'success');
            setModifyModalOpen(false);
            await buildTree();
        } catch (e: any) {
            showToast(e.message || 'Sync failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const renderNode = (node: HierarchyNode, depth: number = 0) => {
        const isExpanded = expandedIds.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isOwnRoot = user?.labelId === node.id && user?.role !== UserRole.OWNER;
        const canAction = !isOwnRoot;

        return (
            <div key={node.id} className="select-none">
                <div 
                    className={`flex items-center justify-between py-2 px-3 border-b border-[#ddd] hover:bg-[#f0f0f0] ${isOwnRoot ? 'bg-[#e8f4e8] border-l-4 border-l-[#009900]' : ''}`}
                    style={{ marginLeft: `${depth * 24}px` }}
                >
                    <div className="flex items-center gap-3">
                        {hasChildren ? (
                            <button onClick={() => toggleExpand(node.id)} className={`transition-transform p-1 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                                <ChevronDownIcon className="w-4 h-4 text-[#666]" />
                            </button>
                        ) : (
                            <div className="w-5 h-5"></div>
                        )}
                        <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${node.type === 'Label' ? 'bg-[#0066cc]' : 'bg-[#009900]'}`}></span>
                            <span className={`font-medium ${node.type === 'Label' ? 'text-black' : 'text-[#444]'}`}>{node.name}</span>
                            <span className="text-[10px] bg-[#f0f0f0] px-1.5 py-0.5 border border-[#ccc] text-black">{node.type}</span>
                            {isOwnRoot && <span className="text-[10px] bg-[#009900] text-white px-1.5 py-0.5">Root</span>}
                        </div>
                        <div className="text-xs text-black font-mono">
                            ID: {node.id?.toUpperCase() || 'UNASSIGNED'} | {node.email || 'REDACTED'}
                        </div>
                    </div>
                    
                    {canAction && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleOpenModify(node)} className="text-[#0066cc] hover:underline text-xs">Config</button>
                            <button onClick={() => handleOpenRemove(node)} className="text-[#cc0000] hover:underline text-xs">Purge</button>
                        </div>
                    )}
                </div>
                {isExpanded && node.children && (
                    <div>
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading && tree.length === 0) return <PageLoader />;

    return (
        <div className="space-y-4">
            <PmaInfoBar>
                <strong>Table:</strong> network_hierarchy &nbsp;|&nbsp; 
                <strong>Nodes:</strong> {tree.length} root(s) &nbsp;|&nbsp;
                <span className="text-[#009900]">● Connected</span>
            </PmaInfoBar>

            <PmaFieldset legend="Network Architecture - Label & Artist Hierarchy">
                <div className="p-4">
                    {/* Search */}
                    <div className="mb-4 flex justify-between items-center">
                        <div className="text-xs text-[#666]">
                            Administration of global distribution branches and authority protocols
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[#666]">Search:</span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Filter hierarchy..."
                                className="border-2 border-[#ccc] px-3 py-1.5 text-sm w-64 focus:border-[#0066cc] outline-none"
                            />
                        </div>
                    </div>

                    {/* Tree View */}
                    <div className="border-2 border-[#ccc] bg-white min-h-[400px]">
                        <div className="bg-[#f5f5f5] px-4 py-2 border-b border-[#ccc] text-xs font-bold text-[#666] uppercase">
                            Node Hierarchy
                        </div>
                        <div className="overflow-auto max-h-[500px]">
                            {filteredTree.length === 0 ? (
                                <div className="p-8 text-center text-[#999]">No nodes found.</div>
                            ) : (
                                filteredTree.map(rootNode => renderNode(rootNode))
                            )}
                        </div>
                    </div>
                </div>
            </PmaFieldset>

            {/* Removal Modal */}
            <Modal isOpen={isRemovalModalOpen} onClose={() => setRemovalModalOpen(false)} title="Terminate Link" size="md">
                <div className="p-4 space-y-4">
                    <div className="bg-[#ffcccc] border border-[#cc0000] p-4">
                        <p className="text-[#cc0000] font-bold">Warning: This action cannot be undone!</p>
                    </div>
                    <p className="text-[#333]">
                        Purging <strong>{nodeToRemove?.name}</strong> will suspend all child nodes and active sessions.
                    </p>
                    <textarea 
                        className="w-full border-2 border-[#ccc] p-3 text-sm min-h-[100px] focus:border-[#cc0000] outline-none" 
                        placeholder="Mandatory removal protocol note..." 
                        value={removalNote} 
                        onChange={(e) => setRemovalNote(e.target.value)} 
                    />
                    <div className="flex gap-2">
                        <PmaButton variant="secondary" onClick={() => setRemovalModalOpen(false)}>Abort</PmaButton>
                        <PmaButton variant="danger" onClick={() => {
                            if (window.confirm(`Are you absolutely sure you want to purge "${nodeToRemove?.name}"? This action is irreversible.`)) {
                                handleConfirmRemove();
                            }
                        }} disabled={!removalNote.trim() || isLoading}>
                            {isLoading ? 'Processing...' : 'Execute Purge'}
                        </PmaButton>
                    </div>
                </div>
            </Modal>

            {/* Modify Modal */}
            <Modal isOpen={isModifyModalOpen} onClose={() => setModifyModalOpen(false)} title="Configure Node Authority" size="2xl">
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#666] mb-1">Registry Name</label>
                            <input
                                type="text"
                                value={modifyName}
                                onChange={e => setModifyName(e.target.value)}
                                className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#666] mb-1">Auth Endpoint</label>
                            <input
                                type="text"
                                value={modifyEmail}
                                disabled
                                className="w-full border-2 border-[#ccc] px-3 py-2 text-sm bg-[#f5f5f5]"
                            />
                        </div>
                    </div>

                    {modifyPermissions && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-[#666] uppercase border-b border-[#ccc] pb-2">Transmission Permissions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.keys(modifyPermissions).map(key => (
                                    <label key={key} className="flex items-center justify-between border border-[#ccc] p-3 hover:bg-[#f5f5f5] cursor-pointer">
                                        <div>
                                            <span className="text-sm font-medium">
                                                {key === 'canSubmitAlbums' ? 'Album Submission authority' : key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={(modifyPermissions as any)[key]} 
                                            onChange={e => setModifyPermissions(prev => prev ? ({ ...prev, [key]: e.target.checked }) : null)} 
                                            className="w-5 h-5" 
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-[#ccc]">
                        <PmaButton variant="secondary" onClick={() => setModifyModalOpen(false)}>Discard</PmaButton>
                        <PmaButton variant="primary" onClick={handleConfirmModify} disabled={isLoading}>
                            {isLoading ? 'Syncing...' : 'Sync Configuration'}
                        </PmaButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Original dark theme view for partner users
const PartnerNetworkView: React.FC<{
    user: User | null;
    showToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ user, showToast }) => {
    const [tree, setTree] = useState<HierarchyNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const [isRemovalModalOpen, setRemovalModalOpen] = useState(false);
    const [nodeToRemove, setNodeToRemove] = useState<HierarchyNode | null>(null);
    const [removalNote, setRemovalNote] = useState('');

    const [isModifyModalOpen, setModifyModalOpen] = useState(false);
    const [nodeToModify, setNodeToModify] = useState<HierarchyNode | null>(null);
    const [modifyName, setModifyName] = useState('');
    const [modifyEmail, setModifyEmail] = useState('');
    const [modifyArtistType, setModifyArtistType] = useState<ArtistType>(ArtistType.SINGER);
    const [modifySpotifyId, setModifySpotifyId] = useState('');
    const [modifyAppleMusicId, setModifyAppleMusicId] = useState('');
    const [modifyInstagramUrl, setModifyInstagramUrl] = useState('');
    const [modifyPermissions, setModifyPermissions] = useState<UserPermissions | null>(null);

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedIds(next);
    };

    const buildTree = async () => {
        setIsLoading(true);
        try {
            const allLabels = await api.getLabels();
            const allArtists = await api.getAllArtists();
            
            const labelAdminMap = new Map<string, string>();
            // Fetch admins in parallel for better performance
            await Promise.all(allLabels.map(async (l) => {
                const admin = await api.getLabelAdmin(l.id);
                if (admin) labelAdminMap.set(l.id, admin.email);
            }));

            const visited = new Set<string>();

            const getSubtree = (parentId: string | undefined): HierarchyNode[] => {
                const filteredLabels = allLabels.filter(l => l.parentLabelId === parentId);
                const nodes: HierarchyNode[] = filteredLabels.map(label => {
                    if (visited.has(label.id)) return null; 
                    visited.add(label.id);

                    const labelArtists = allArtists
                        .filter(a => a.labelId === label.id)
                        .map(a => ({ 
                            id: a.id, 
                            name: a.name, 
                            type: 'Artist' as const, 
                            email: a.email,
                            artistType: a.type,
                            spotifyId: a.spotifyId,
                            appleMusicId: a.appleMusicId,
                            instagramUrl: a.instagramUrl
                        }));

                    const subLabels = getSubtree(label.id);

                    return {
                        id: label.id,
                        name: label.name,
                        type: 'Label',
                        email: labelAdminMap.get(label.id),
                        parentId: parentId,
                        children: [...subLabels, ...labelArtists]
                    };
                }).filter(n => n !== null) as HierarchyNode[];
                return nodes;
            };

            let finalNodes: HierarchyNode[] = [];
            if (user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE) {
                // For admin/employee, start from root labels (no parent)
                finalNodes = getSubtree(undefined);
                
                // If some labels were not visited (e.g. they have a parentId that doesn't exist), 
                // add them as roots to ensure everything is shown
                const remainingLabels = allLabels.filter(l => !visited.has(l.id));
                if (remainingLabels.length > 0) {
                    const orphans = remainingLabels.map(l => {
                        visited.add(l.id);
                        return {
                            id: l.id,
                            name: l.name,
                            type: 'Label' as const,
                            email: labelAdminMap.get(l.id),
                            children: [
                                ...getSubtree(l.id),
                                ...allArtists.filter(a => a.labelId === l.id).map(a => ({
                                    id: a.id,
                                    name: a.name,
                                    type: 'Artist' as const,
                                    email: a.email
                                }))
                            ]
                        };
                    });
                    finalNodes = [...finalNodes, ...orphans];
                }
            } else if (user?.labelId) {
                const myLabel = allLabels.find(l => l.id === user.labelId);
                if (myLabel) {
                    visited.add(myLabel.id);
                    finalNodes = [{
                        id: myLabel.id,
                        name: myLabel.name,
                        type: 'Label',
                        email: user.email,
                        children: [
                            ...getSubtree(myLabel.id),
                            ...allArtists.filter(a => a.labelId === myLabel.id).map(a => ({ 
                                id: a.id, 
                                name: a.name, 
                                type: 'Artist' as const, 
                                email: a.email,
                                artistType: a.type,
                                spotifyId: a.spotifyId,
                                appleMusicId: a.appleMusicId,
                                instagramUrl: a.instagramUrl
                            }))
                        ]
                    }];
                    setExpandedIds(prev => new Set([...prev, myLabel.id]));
                }
            }
            setTree(finalNodes);
        } catch (error) {
            console.error("Failed to build network tree:", error);
            showToast("Failed to load network hierarchy", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        buildTree();
    }, [user]);

    const filteredTree = useMemo(() => {
        if (!searchTerm) return tree;
        const term = searchTerm.toLowerCase();
        
        const filterNodes = (nodes: HierarchyNode[]): HierarchyNode[] => {
            return nodes
                .map(node => {
                    const childrenMatch = node.children ? filterNodes(node.children) : [];
                    const selfMatches = 
                        node.name.toLowerCase().includes(term) || 
                        node.id.toLowerCase().includes(term) ||
                        (node.email && node.email.toLowerCase().includes(term));
                    
                    if (selfMatches || childrenMatch.length > 0) {
                        return { ...node, children: childrenMatch };
                    }
                    return null;
                })
                .filter(n => n !== null) as HierarchyNode[];
        };

        return filterNodes(tree);
    }, [tree, searchTerm]);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const idsToExpand = new Set<string>();
            const collectParentIds = (nodes: HierarchyNode[]) => {
                nodes.forEach(node => {
                    if (node.children && node.children.length > 0) {
                        idsToExpand.add(node.id);
                        collectParentIds(node.children);
                    }
                });
            };
            collectParentIds(filteredTree);
            setExpandedIds(prev => new Set([...prev, ...idsToExpand]));
        }
    }, [filteredTree, searchTerm]);

    const handleOpenRemove = (node: HierarchyNode) => {
        setNodeToRemove(node);
        setRemovalNote('');
        setRemovalModalOpen(true);
    };

    const handleConfirmRemove = async () => {
        if (!nodeToRemove || !removalNote.trim() || !user) return;
        setIsLoading(true);
        
        try {
            if (nodeToRemove.type === 'Label') {
                await api.deleteLabel(nodeToRemove.id, user);
            } else {
                await api.deleteArtist(nodeToRemove.id, user);
            }
            showToast(`${nodeToRemove.name} purged from network hierarchy.`, 'success');
            setRemovalModalOpen(false);
            setNodeToRemove(null);
            await buildTree();
        } catch (e: any) {
            showToast(e.message || 'Purge failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModify = async (node: HierarchyNode) => {
        setNodeToModify(node);
        setModifyName(node.name);
        setModifyEmail(node.email || '');
        
        if (node.type === 'Label') {
            const admin = await api.getLabelAdmin(node.id);
            if (admin) setModifyPermissions({
                ...admin.permissions,
                canSubmitAlbums: admin.permissions.canSubmitAlbums ?? true
            });
            setModifyArtistType(ArtistType.SINGER);
            setModifySpotifyId('');
            setModifyAppleMusicId('');
            setModifyInstagramUrl('');
        } else {
            setModifyPermissions(null);
            setModifyArtistType(node.artistType || ArtistType.SINGER);
            setModifySpotifyId(node.spotifyId || '');
            setModifyAppleMusicId(node.appleMusicId || '');
            setModifyInstagramUrl(node.instagramUrl || '');
        }
        setModifyModalOpen(true);
    };

    const handleConfirmModify = async () => {
        if (!nodeToModify || !user) return;
        setIsLoading(true);

        try {
            if (nodeToModify.type === 'Label') {
                await api.updateLabel(nodeToModify.id, { name: modifyName });
                if (modifyPermissions) {
                    const admin = await api.getLabelAdmin(nodeToModify.id);
                    if (admin) {
                        await api.updateUserPermissions(admin.id, modifyPermissions, user);
                    }
                }
            } else {
                await api.updateArtist(nodeToModify.id, {
                    name: modifyName,
                    email: modifyEmail,
                    type: modifyArtistType,
                    spotifyId: modifySpotifyId,
                    appleMusicId: modifyAppleMusicId,
                    instagramUrl: modifyInstagramUrl
                }, user);
            }
            showToast('Node authority matrix synchronized.', 'success');
            setModifyModalOpen(false);
            await buildTree();
        } catch (e: any) {
            showToast(e.message || 'Sync failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const renderNode = (node: HierarchyNode, depth: number = 0) => {
        const isExpanded = expandedIds.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isOwnRoot = user?.labelId === node.id && user?.role !== UserRole.OWNER;
        const canAction = !isOwnRoot;

        return (
            <div key={node.id} className="select-none">
                <div 
                    className={`flex items-center justify-between py-4 px-5 rounded-lg transition-all hover:bg-gray-800/80 group border-b border-gray-800/30 ${isOwnRoot ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                    style={{ marginLeft: `${depth * 28}px` }}
                >
                    <div className="flex items-center gap-4">
                        {hasChildren ? (
                            <button onClick={() => toggleExpand(node.id)} className={`transition-transform duration-200 p-1 hover:bg-gray-700 rounded ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                                <ChevronDownIcon className="w-4 h-4 text-primary" />
                            </button>
                        ) : (
                            <div className="w-6 h-6"></div>
                        )}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${node.type === 'Label' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></span>
                                <span className={`font-bold ${node.type === 'Label' ? 'text-white text-base' : 'text-gray-200 text-sm'}`}>{node.name}</span>
                                {isOwnRoot && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-sm font-bold ml-1 uppercase">Root Axis</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-mono text-gray-500">ID: {node.id?.toUpperCase() || 'UNASSIGNED'}</span>
                                <span className="text-[10px] text-gray-400">{node.email || 'REDACTED'}</span>
                            </div>
                        </div>
                    </div>
                    
                    {canAction && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3">
                            <Button variant="secondary" className="text-[10px] py-1 px-4 uppercase h-8 font-bold" onClick={() => handleOpenModify(node)}>Config</Button>
                            <Button variant="danger" className="text-[10px] py-1 px-4 uppercase h-8 font-bold" onClick={() => handleOpenRemove(node)}>Purge</Button>
                        </div>
                    )}
                </div>
                {isExpanded && node.children && (
                    <div className="mt-1">
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading && tree.length === 0) return <PageLoader />;

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-800 pb-8 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Network Architecture</h1>
                    <p className="text-gray-500 mt-2 font-medium">Administration of global distribution branches and authority protocols.</p>
                </div>
                <div className="w-full md:w-80">
                    <Input placeholder="Search hierarchy..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-black/20" />
                </div>
            </div>

            <Card className="bg-gray-900/40 border-gray-800 overflow-hidden rounded-[2rem]">
                <CardContent className="p-0">
                    <div className="bg-black/40 px-8 py-4 flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                        <span>Node Hierarchy</span>
                        <span>Authority Gateway</span>
                    </div>
                    <div className="min-h-[500px] overflow-x-auto custom-scrollbar">
                        <div className="min-w-[800px] p-6">
                            {filteredTree.length === 0 ? (
                                <div className="p-32 text-center text-gray-600 font-bold uppercase tracking-widest text-xs opacity-50">Zero matches for current query.</div>
                            ) : filteredTree.map(rootNode => renderNode(rootNode))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isRemovalModalOpen} onClose={() => setRemovalModalOpen(false)} title="Terminate Link" size="md">
                <div className="space-y-6 text-center py-4">
                    <div className="w-20 h-20 bg-red-900/20 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Confirm Termination</h3>
                    <p className="text-gray-500 font-medium">Purging <span className="text-white">{nodeToRemove?.name}</span> will suspend all child nodes and active sessions.</p>
                    <textarea className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white text-sm focus:ring-1 focus:ring-red-500 outline-none min-h-[100px]" placeholder="Mandatory removal protocol note..." value={removalNote} onChange={(e) => setRemovalNote(e.target.value)} />
                    <div className="flex gap-4">
                        <Button variant="secondary" className="flex-1 font-black" onClick={() => setRemovalModalOpen(false)}>Abort</Button>
                        <Button variant="danger" className="flex-1 font-black" disabled={!removalNote.trim() || isLoading} onClick={() => {
                            if (window.confirm(`Are you absolutely sure you want to purge "${nodeToRemove?.name}"? This action is irreversible.`)) {
                                handleConfirmRemove();
                            }
                        }}>Execute Purge</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isModifyModalOpen} onClose={() => setModifyModalOpen(false)} title="Configure Node Authority" size="2xl">
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Registry Name" value={modifyName} onChange={(e) => setModifyName(e.target.value)} />
                        <Input label="Auth Endpoint" value={modifyEmail} onChange={(e) => setModifyEmail(e.target.value)} disabled />
                    </div>

                    {modifyPermissions && (
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5 pb-3">Transmission Permissions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.keys(modifyPermissions).map(key => (
                                    <label key={key} className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-gray-800 hover:border-primary/40 cursor-pointer transition-all group">
                                        <div className="pr-4">
                                            <span className="text-xs text-white font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                                                {key === 'canSubmitAlbums' ? 'Album Submission authority' : key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                        </div>
                                        <input type="checkbox" checked={(modifyPermissions as any)[key]} onChange={e => setModifyPermissions(prev => prev ? ({ ...prev, [key]: e.target.checked }) : null)} className="w-6 h-6 rounded-lg border-gray-700 bg-black text-primary focus:ring-primary" />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-8 border-t border-white/5">
                        <Button variant="secondary" onClick={() => setModifyModalOpen(false)}>Discard</Button>
                        <Button onClick={handleConfirmModify} disabled={isLoading}>{isLoading ? <Spinner /> : 'Sync Configuration'}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const Network: React.FC = () => {
    const { user, showToast } = useContext(AppContext);
    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;

    // Use phpMyAdmin style for admin/employee users
    if (isPlatformSide) {
        return <PmaNetworkView user={user} showToast={showToast} />;
    }

    // Use dark theme for partner users
    return <PartnerNetworkView user={user} showToast={showToast} />;
};

export default Network;
