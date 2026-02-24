
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Release, Artist, UserRole, Notice, NoticeType } from '../types';
import { PmaFieldset, PmaTable, PmaTR, PmaTD, PmaInfoBar, PmaStatusBadge, PmaLink } from '../components/PmaStyle';
import { RefreshIcon } from '../components/Icons';

const AdminDashboard: React.FC = () => {
    const { user } = useContext(AppContext);
    const [stats, setStats] = useState({ 
        artists: 0, 
        labels: 0, 
        drafted: 0, 
        published: 0, 
        rejected: 0, 
        correction: 0, 
        takedown: 0,
        pending: 0 
    });
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
   
    const fetchData = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setIsRefreshing(true);
        else setIsLoading(true);
        
        try {
            const [statsData, allNotices] = await Promise.all([
                api.getStats(),
                api.getNotices(user!)
            ]);
            setStats(statsData);
            setNotices(allNotices.slice(0, 10));
        } catch (e) {
            console.error("Failed to load dashboard data", e);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-4">
            {/* Server status info bar */}
            <PmaInfoBar>
                <strong>Server:</strong> DigitalSight Distribution Platform &nbsp;|&nbsp; 
                <strong>Database:</strong> Production &nbsp;|&nbsp; 
                <strong>Version:</strong> 1.0.0 &nbsp;|&nbsp;
                <span className="text-[#009900]">● All systems operational</span>
            </PmaInfoBar>

            {/* Statistics Tables - phpMyAdmin style */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Release Statistics Table */}
                <PmaFieldset 
                    legend="Release Statistics"
                    className="relative"
                >
                    <div className="absolute top-[-18px] right-2 flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-[#666] uppercase tracking-tighter">Refresh</span>
                        <button 
                            onClick={() => fetchData(true)}
                            disabled={isLoading || isRefreshing}
                            className={`p-1 rounded-full bg-[#f5f5f5] border border-[#ccc] hover:border-[#0066cc] hover:bg-[#e5f3ff] transition-all shadow-sm active:shadow-inner ${isRefreshing ? 'animate-spin' : ''}`}
                            title="Refresh Statistics"
                        >
                            <RefreshIcon className="w-3 h-3 text-[#0066cc]" />
                        </button>
                    </div>
                    <PmaTable
                        headers={[
                            { label: 'Status' },
                            { label: 'Count', className: 'text-right' },
                            { label: 'Action', className: 'text-center' }
                        ]}
                    >
                        <PmaTR>
                            <PmaTD isLabel>📝 Drafted</PmaTD>
                            <PmaTD className="text-right font-mono font-bold text-[#0066cc]">{isLoading ? '...' : stats.drafted.toLocaleString()}</PmaTD>
                            <PmaTD className="text-center">
                                <Link to="/releases?status=Draft" className="text-[#0066cc] hover:underline text-xs">Browse</Link>
                            </PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>✅ Published</PmaTD>
                            <PmaTD className="text-right font-mono font-bold text-[#009900]">{isLoading ? '...' : stats.published.toLocaleString()}</PmaTD>
                            <PmaTD className="text-center">
                                <Link to="/releases?status=Published" className="text-[#0066cc] hover:underline text-xs">Browse</Link>
                            </PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>⏳ Pending Review</PmaTD>
                            <PmaTD className="text-right font-mono font-bold text-[#ff9900]">{isLoading ? '...' : stats.pending.toLocaleString()}</PmaTD>
                            <PmaTD className="text-center">
                                <Link to="/releases?status=Pending" className="text-[#0066cc] hover:underline text-xs">Review</Link>
                            </PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>❌ Rejected</PmaTD>
                            <PmaTD className="text-right font-mono font-bold text-[#cc0000]">{isLoading ? '...' : stats.rejected.toLocaleString()}</PmaTD>
                            <PmaTD className="text-center">
                                <Link to="/releases?status=Rejected" className="text-[#0066cc] hover:underline text-xs">Browse</Link>
                            </PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>🔧 Needs Correction</PmaTD>
                            <PmaTD className="text-right font-mono font-bold text-[#cc6600]">{isLoading ? '...' : stats.correction.toLocaleString()}</PmaTD>
                            <PmaTD className="text-center">
                                <Link to="/releases?status=Needs Info" className="text-[#0066cc] hover:underline text-xs">Browse</Link>
                            </PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>🚫 Taken Down</PmaTD>
                            <PmaTD className="text-right font-mono font-bold text-[#990000]">{isLoading ? '...' : stats.takedown.toLocaleString()}</PmaTD>
                            <PmaTD className="text-center">
                                <Link to="/releases?status=Takedown" className="text-[#0066cc] hover:underline text-xs">Browse</Link>
                            </PmaTD>
                        </PmaTR>
                    </PmaTable>
                </PmaFieldset>

                {/* Entity Statistics Table */}
                <PmaFieldset legend="Entity Statistics">
                    <PmaTable
                        headers={[
                            { label: 'Entity' },
                            { label: 'Total', className: 'text-right' },
                            { label: 'Action', className: 'text-center' }
                        ]}
                    >
                        <PmaTR>
                            <PmaTD isLabel>🎤 Artists</PmaTD>
                            <PmaTD className="text-right font-mono font-bold text-[#0066cc]">{isLoading ? '...' : stats.artists.toLocaleString()}</PmaTD>
                            <PmaTD className="text-center">
                                <Link to="/artists" className="text-[#0066cc] hover:underline text-xs">Browse</Link>
                            </PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>🏢 Labels</PmaTD>
                            <PmaTD className="text-right font-mono font-bold text-[#0066cc]">{isLoading ? '...' : stats.labels.toLocaleString()}</PmaTD>
                            <PmaTD className="text-center">
                                <Link to="/labels" className="text-[#0066cc] hover:underline text-xs">Browse</Link>
                            </PmaTD>
                        </PmaTR>
                    </PmaTable>
                </PmaFieldset>
            </div>

            {/* Notices Section */}
            <PmaFieldset legend="📢 Corporate Board Notices">
                <div className="p-0">
                    {isLoading ? (
                        <div className="p-4 text-center text-[#666]">Loading notices...</div>
                    ) : notices.length === 0 ? (
                        <div className="p-4 text-center text-[#999]">No active notices.</div>
                    ) : (
                        <PmaTable
                            headers={[
                                { label: 'Type' },
                                { label: 'Title' },
                                { label: 'Author' },
                                { label: 'Date', className: 'text-right' }
                            ]}
                        >
                            {notices.map(notice => (
                                <PmaTR key={notice.id}>
                                    <PmaTD>
                                        <PmaStatusBadge status={notice.type} />
                                    </PmaTD>
                                    <PmaTD isLabel>
                                        <div className="font-medium text-black">{notice.title}</div>
                                        <div className="text-xs text-[#444] truncate max-w-xs">{notice.message}</div>
                                    </PmaTD>
                                    <PmaTD className="text-black">{notice.authorName || 'System'}</PmaTD>
                                    <PmaTD className="text-right text-black text-xs">{new Date(notice.timestamp).toLocaleDateString()}</PmaTD>
                                </PmaTR>
                            ))}
                        </PmaTable>
                    )}
                </div>
            </PmaFieldset>

            {/* Admin Tools Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user?.role === UserRole.OWNER || user?.permissions?.canManageNetwork) && (
                    <PmaFieldset legend="🌐 Network Administration">
                        <div className="p-3">
                            <Link to="/network" className="inline-flex items-center gap-2 bg-gradient-to-b from-[#f7f7f7] to-[#e5e5e5] border-2 border-[#ccc] px-4 py-2 rounded hover:border-[#0066cc] text-sm text-[#333] font-bold">
                                <span>📁</span>
                                <span>Network Hierarchy</span>
                            </Link>
                        </div>
                    </PmaFieldset>
                )}
                {(user?.role === UserRole.OWNER || user?.permissions?.canManageEmployees) && (
                    <PmaFieldset legend="👥 Personnel Management">
                        <div className="p-3">
                            <Link to="/employees" className="inline-flex items-center gap-2 bg-gradient-to-b from-[#f7f7f7] to-[#e5e5e5] border-2 border-[#ccc] px-4 py-2 rounded hover:border-[#0066cc] text-sm text-[#333] font-bold">
                                <span>👤</span>
                                <span>Manage Employees</span>
                            </Link>
                        </div>
                    </PmaFieldset>
                )}
            </div>
        </div>
    );
};

const PartnerDashboard: React.FC = () => {
    const { user } = useContext(AppContext);
    const [releases, setReleases] = useState<Release[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [stats, setStats] = useState({ 
        artists: 0, 
        labels: 0, 
        drafted: 0, 
        published: 0, 
        rejected: 0, 
        correction: 0, 
        takedown: 0,
        pending: 0 
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const [myReleases, allNotices, statsData] = await Promise.all([
                api.getReleasesByLabel(user?.labelId || ''),
                api.getNotices(user!),
                api.getStats(user?.labelId)
            ]);
            setReleases(myReleases.slice(0, 5));
            setNotices(allNotices.slice(0, 10));
            setStats(statsData);
        } catch (e) {
            console.error("Failed to load dashboard data", e);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Release Statistics</h2>
                    <div className="h-1 w-12 bg-primary rounded-full"></div>
                </div>
                <button 
                    onClick={() => fetchData(true)}
                    disabled={isLoading || isRefreshing}
                    className={`group flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all shadow-lg ${isRefreshing ? 'opacity-50' : ''}`}
                >
                    <RefreshIcon className={`w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all duration-300 hover:border-primary/20 h-full">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2 ml-1">Artists</p>
                    <p className="text-3xl font-black text-white tracking-tight">{isLoading ? '...' : stats.artists.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all duration-300 hover:border-primary/20 h-full">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2 ml-1">Drafted</p>
                    <p className="text-3xl font-black text-gray-400 tracking-tight">{isLoading ? '...' : stats.drafted.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all duration-300 hover:border-primary/20 h-full">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2 ml-1">Published</p>
                    <p className="text-3xl font-black text-green-500 tracking-tight">{isLoading ? '...' : stats.published.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all duration-300 hover:border-primary/20 h-full">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2 ml-1">Rejected</p>
                    <p className="text-3xl font-black text-red-500 tracking-tight">{isLoading ? '...' : stats.rejected.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all duration-300 hover:border-primary/20 h-full">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2 ml-1">Correction</p>
                    <p className="text-3xl font-black text-yellow-500 tracking-tight">{isLoading ? '...' : stats.correction.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all duration-300 hover:border-primary/20 h-full">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2 ml-1">Taken Down</p>
                    <p className="text-3xl font-black text-red-700 tracking-tight">{isLoading ? '...' : stats.takedown.toLocaleString()}</p>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all duration-300 hover:border-primary/20 h-full">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2 ml-1">Pending</p>
                    <p className="text-3xl font-black text-blue-500 tracking-tight">{isLoading ? '...' : stats.pending.toLocaleString()}</p>
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-2xl border border-gray-800">
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Partner Portal</h2>
                        <p className="text-gray-400 text-sm font-medium">Welcome back, {user?.name}. Distribution oversight for <span className="text-primary font-bold uppercase tracking-tight">{user?.role}</span> accounts is active.</p>
                        <div className="mt-8 flex gap-3">
                            <Link to="/releases" className="bg-primary text-black font-black uppercase text-[10px] px-8 py-4 rounded-xl tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">My Catalog</Link>
                            {user?.role !== UserRole.ARTIST && (
                                <Link to="/artists" className="bg-white/5 text-white font-black uppercase text-[10px] px-8 py-4 rounded-xl tracking-widest hover:bg-white/10 transition-all border border-white/10">Manage Artists</Link>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-white uppercase text-[10px] tracking-[0.2em] text-gray-500">Distribution Activity</h3>
                            <Link to="/releases" className="text-[10px] text-primary hover:underline font-black uppercase tracking-wider">Full Catalog</Link>
                        </div>
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="text-center text-gray-500 py-8">Loading...</div>
                            ) : releases.length === 0 ? (
                                <div className="py-12 text-center text-gray-600">No releases in your catalog yet.</div>
                            ) : releases.map(rel => (
                                <Link to={`/releases/${rel.id}`} key={rel.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl hover:bg-gray-800 transition-colors border border-gray-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-900 rounded overflow-hidden shadow-md">
                                            <img 
                                                src={rel.artworkUrl} 
                                                className="w-full h-full object-cover" 
                                                alt="" 
                                                loading="lazy" 
                                                decoding="async" 
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm tracking-tight">{rel.title}</p>
                                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">CAT: {rel.catalogueNumber}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        rel.status === 'Published' ? 'bg-green-900/50 text-green-400' :
                                        rel.status === 'Pending' ? 'bg-yellow-900/50 text-yellow-400' :
                                        rel.status === 'Rejected' ? 'bg-red-900/50 text-red-400' :
                                        'bg-gray-800 text-gray-400'
                                    }`}>
                                        {rel.status}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-1">
                    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-lg font-bold text-white mb-4">📢 Notices</h3>
                        {isLoading ? (
                            <div className="text-center text-gray-500 py-4">Loading...</div>
                        ) : notices.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">No notices.</div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {notices.slice(0, 5).map(notice => (
                                    <div key={notice.id} className="p-3 bg-gray-800/50 rounded-lg">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                notice.type === NoticeType.URGENT ? 'bg-red-900/50 text-red-400' :
                                                notice.type === NoticeType.UPDATE ? 'bg-blue-900/50 text-blue-400' :
                                                'bg-gray-700 text-gray-300'
                                            }`}>
                                                {notice.type}
                                            </span>
                                            <span className="text-[10px] text-gray-500">{new Date(notice.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-white font-medium">{notice.title}</p>
                                        <p className="text-xs text-gray-400 mt-1">{notice.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { user } = useContext(AppContext);
    if (!user) return null;
    if (user.role === UserRole.OWNER || user.role === UserRole.EMPLOYEE) {
        return <AdminDashboard />;
    }
    return <PartnerDashboard />;
};

export default Dashboard;
