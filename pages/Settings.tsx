import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { User, UserPermissions, UserRole } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Spinner } from '../components/ui';
import { PmaFieldset, PmaTable, PmaTR, PmaTD, PmaButton, PmaInput, PmaInfoBar } from '../components/PmaStyle';

// phpMyAdmin style Settings view for admin users
const PmaSettingsView: React.FC<{
    user: User | null;
    subUsers: User[];
    isLoading: boolean;
    isUpdatingPassword: boolean;
    passwordChange: { old: string; new: string; confirm: string };
    setPasswordChange: (p: { old: string; new: string; confirm: string }) => void;
    handleTogglePermission: (subUserId: string, field: keyof UserPermissions, value: boolean) => void;
    handlePasswordUpdate: (e: React.FormEvent) => void;
    canManageSubUsers: boolean;
}> = (props) => {
    const { user, subUsers, isLoading, isUpdatingPassword, passwordChange, setPasswordChange, handleTogglePermission, handlePasswordUpdate, canManageSubUsers } = props;

    return (
        <div className="space-y-4">
            <PmaInfoBar>
                <strong>Table:</strong> user_settings &nbsp;|&nbsp; 
                <strong>User:</strong> {user?.email} &nbsp;|&nbsp;
                <span className="text-[#009900]">● Authenticated</span>
            </PmaInfoBar>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - Profile */}
                <div className="space-y-4">
                    <PmaFieldset legend="Authenticated Profile">
                        <div className="p-4">
                            <PmaTable headers={[{ label: 'Field' }, { label: 'Value' }]}>
                                <PmaTR>
                                    <PmaTD isLabel>Name</PmaTD>
                                    <PmaTD className="text-black">{user?.name || 'User'}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Email</PmaTD>
                                    <PmaTD className="font-mono text-black">{user?.email}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Role</PmaTD>
                                    <PmaTD>
                                        <span className="text-xs bg-[#f0f0f0] px-2 py-1 border border-[#ccc] text-black">
                                            {user?.role}
                                        </span>
                                    </PmaTD>
                                </PmaTR>
                            </PmaTable>
                        </div>
                    </PmaFieldset>

                    <PmaFieldset legend="Reset Vault Key">
                        <div className="p-4">
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#666] mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordChange.old}
                                        onChange={e => setPasswordChange({...passwordChange, old: e.target.value})}
                                        className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#666] mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordChange.new}
                                        onChange={e => setPasswordChange({...passwordChange, new: e.target.value})}
                                        className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#666] mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordChange.confirm}
                                        onChange={e => setPasswordChange({...passwordChange, confirm: e.target.value})}
                                        className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none"
                                    />
                                </div>
                                <PmaButton variant="primary" onClick={handlePasswordUpdate} disabled={isUpdatingPassword}>
                                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                </PmaButton>
                            </form>
                        </div>
                    </PmaFieldset>
                </div>

                {/* Right Column - Permissions */}
                <div className="lg:col-span-2">
                    <PmaFieldset legend="Network Permissions Hierarchy">
                        <div className="p-4">
                            {canManageSubUsers ? (
                                subUsers.length === 0 ? (
                                    <div className="text-center py-8 text-[#666]">
                                        No managed Sub-Labels found.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {subUsers.map(subUser => (
                                            <div key={subUser.id} className="border-2 border-[#ccc]">
                                                <div className="bg-[#f5f5f5] px-4 py-2 border-b border-[#ccc] flex justify-between items-center">
                                                    <div>
                                                        <span className="font-bold text-black">{subUser.name}</span>
                                                        <span className="text-xs text-black ml-2 font-mono">{subUser.email}</span>
                                                    </div>
                                                    <span className="text-xs bg-[#e0e0e0] px-2 py-1 border border-[#ccc] text-black">
                                                        {subUser.role}
                                                    </span>
                                                </div>
                                                <div className="p-4">
                                                    <PmaTable headers={[{ label: 'Permission' }, { label: 'Status', className: 'text-center' }]}>
                                                        {Object.entries(subUser.permissions).map(([key, val]) => (
                                                            <PmaTR key={key}>
                                                                <PmaTD>
                                                                    <span className="text-sm text-black">
                                                                        {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                                                    </span>
                                                                </PmaTD>
                                                                <PmaTD className="text-center">
                                                                    <button 
                                                                        onClick={() => handleTogglePermission(subUser.id, key as keyof UserPermissions, !val)}
                                                                        className={`px-3 py-1 text-xs border ${val ? 'bg-[#e8f4e8] text-[#009900] border-[#009900]' : 'bg-[#f5f5f5] text-black border-[#ccc]'}`}
                                                                    >
                                                                        {val ? 'Enabled' : 'Disabled'}
                                                                    </button>
                                                                </PmaTD>
                                                            </PmaTR>
                                                        ))}
                                                    </PmaTable>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8 text-[#666]">
                                    <div className="bg-[#fff3cd] border border-[#856404] p-4 mb-4">
                                        <p className="text-[#856404] font-bold">Restricted Access</p>
                                    </div>
                                    <p className="text-sm">
                                        Your network permissions are managed by your Parent Organization. 
                                        Contact your administrator to adjust access levels.
                                    </p>
                                </div>
                            )}
                        </div>
                    </PmaFieldset>
                </div>
            </div>
        </div>
    );
};

// Original dark theme Settings view for partner users
const PartnerSettingsView: React.FC<{
    user: User | null;
    subUsers: User[];
    isLoading: boolean;
    isUpdatingPassword: boolean;
    passwordChange: { old: string; new: string; confirm: string };
    setPasswordChange: (p: { old: string; new: string; confirm: string }) => void;
    handleTogglePermission: (subUserId: string, field: keyof UserPermissions, value: boolean) => void;
    handlePasswordUpdate: (e: React.FormEvent) => void;
    canManageSubUsers: boolean;
}> = (props) => {
    const { user, subUsers, isLoading, isUpdatingPassword, passwordChange, setPasswordChange, handleTogglePermission, handlePasswordUpdate, canManageSubUsers } = props;

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Security & Master Access</h1>
                    <p className="text-gray-400 mt-1 font-medium">Manage your identity and delegate control to your team.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Personal Identity</h2>
                    <Card className="border-gray-800 bg-gray-900/40 shadow-xl rounded-[2rem]">
                        <CardHeader className="pb-2 border-none">
                            <CardTitle className="text-base font-black uppercase tracking-tight">Authenticated Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 py-2">
                                <div className="w-12 h-12 bg-primary/20 text-primary border border-primary/20 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                                    {user?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="text-white font-black uppercase tracking-tight">{user?.name || 'User'}</p>
                                    <p className="text-[10px] text-primary-dark font-black uppercase tracking-widest">{user?.role}</p>
                                </div>
                            </div>
                            <Input label="Primary Login Email" value={user?.email} disabled className="bg-black/40 border-gray-800" />
                        </CardContent>
                    </Card>

                    <Card className="border-gray-800 bg-gray-900/40 shadow-xl rounded-[2rem]">
                        <CardHeader className="pb-2 border-none">
                            <CardTitle className="text-base font-black uppercase tracking-tight">Reset Vault Key</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <Input label="Current Password" type="password" placeholder="Verify current access" value={passwordChange.old} onChange={e => setPasswordChange({...passwordChange, old: e.target.value})} className="bg-black/40 border-gray-800" />
                                <Input label="New Password" type="password" placeholder="Minimum 6 characters" value={passwordChange.new} onChange={e => setPasswordChange({...passwordChange, new: e.target.value})} className="bg-black/40 border-gray-800" />
                                <Input label="Confirm New Password" type="password" placeholder="Repeat new password" value={passwordChange.confirm} onChange={e => setPasswordChange({...passwordChange, confirm: e.target.value})} className="bg-black/40 border-gray-800" />
                                <Button type="submit" className="w-full py-4 mt-4 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={isUpdatingPassword}>
                                    {isUpdatingPassword ? <Spinner className="w-4 h-4" /> : 'Synchronize New Password'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Network Permissions Hierarchy</h2>
                    
                    {canManageSubUsers ? (
                        <div className="space-y-4">
                            {subUsers.length === 0 ? (
                                <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-gray-900/20">
                                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    </div>
                                    <p className="text-gray-500 font-bold uppercase text-[11px] tracking-widest">No managed Sub-Labels found.</p>
                                </div>
                            ) : subUsers.map(subUser => (
                                <Card key={subUser.id} className="border border-white/5 hover:border-primary/20 transition-all bg-gray-900/30 rounded-[2rem] overflow-hidden">
                                    <CardHeader className="flex flex-row justify-between items-center bg-black/20 border-b border-white/5 px-8 py-6">
                                        <div>
                                            <CardTitle className="text-xl font-black uppercase tracking-tight">{subUser.name}</CardTitle>
                                            <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-tighter">{subUser.email}</p>
                                        </div>
                                        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full font-black uppercase tracking-widest">
                                            {subUser.role}
                                        </span>
                                    </CardHeader>
                                    <CardContent className="px-8 py-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(subUser.permissions).map(([key, val]) => (
                                            <div key={key} className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-[1.5rem] transition-all hover:border-primary/30 group">
                                                <div className="pr-4">
                                                    <p className="text-xs text-white font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                                                        {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                                    </p>
                                                    <p className="text-[9px] text-gray-600 mt-1 leading-tight uppercase font-black tracking-widest">
                                                        {key === 'canCreateSubLabels' ? 'Onboard Child Labels' : `Manage ${key.replace('canManage', '').toLowerCase()} catalog`}
                                                    </p>
                                                </div>
                                                <button onClick={() => handleTogglePermission(subUser.id, key as keyof UserPermissions, !val)} className={`w-12 h-7 rounded-full relative transition-all duration-300 shadow-inner flex-shrink-0 ${val ? 'bg-primary' : 'bg-gray-800'}`}>
                                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${val ? 'right-1' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-gray-800 bg-gray-900/40 rounded-[2rem]">
                            <CardContent className="py-24 text-center space-y-6">
                                <div className="w-20 h-20 bg-gray-800 rounded-[2rem] flex items-center justify-center mx-auto text-gray-600">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Restricted Access Matrix</h3>
                                <p className="text-gray-500 max-w-sm mx-auto text-sm font-medium leading-relaxed">Your network permissions are managed by your Parent Organization. Contact your administrator to adjust access levels.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

const Settings: React.FC = () => {
    const { user, showToast } = useContext(AppContext);
    const [subUsers, setSubUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordChange, setPasswordChange] = useState({ old: '', new: '', confirm: '' });

    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;

    useEffect(() => {
        const fetchSubUsers = async () => {
            if (user?.labelId && user.permissions.canCreateSubLabels) {
                const allLabels = await api.getLabels();
                const myChildren = allLabels.filter(l => l.parentLabelId === user.labelId);
                const results: User[] = [];
                for (const l of myChildren) {
                    const admin = await api.getLabelAdmin(l.id);
                    if (admin) results.push(admin);
                }
                setSubUsers(results);
            }
            setIsLoading(false);
        };
        fetchSubUsers();
    }, [user]);

    const handleTogglePermission = async (subUserId: string, field: keyof UserPermissions, value: boolean) => {
        const targetUser = subUsers.find(u => u.id === subUserId);
        if (!targetUser || !user) return;

        const updatedPermissions = { ...targetUser.permissions, [field]: value };
        try {
            const updatedUser = await api.updateUserPermissions(subUserId, updatedPermissions, user);
            setSubUsers(prev => prev.map(u => u.id === subUserId ? updatedUser : u));
            showToast('Permissions updated successfully.', 'success');
        } catch (error) {
            showToast('Failed to update permissions.', 'error');
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!passwordChange.old || !passwordChange.new || !passwordChange.confirm) {
            showToast('All password fields are required.', 'error');
            return;
        }

        if (passwordChange.new !== passwordChange.confirm) {
            showToast('New passwords do not match.', 'error');
            return;
        }

        if (passwordChange.new.length < 6) {
            showToast('New password must be at least 6 characters.', 'error');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            await api.changePassword(passwordChange.old, passwordChange.new);
            showToast('Password updated in vault successfully.', 'success');
            setPasswordChange({ old: '', new: '', confirm: '' });
        } catch (err: any) {
            showToast(err.message || 'Password update failed.', 'error');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-20"><Spinner /></div>;

    const canManageSubUsers = user?.permissions.canCreateSubLabels || user?.role === UserRole.LABEL_ADMIN;

    const commonProps = {
        user, subUsers, isLoading, isUpdatingPassword, passwordChange, setPasswordChange,
        handleTogglePermission, handlePasswordUpdate, canManageSubUsers
    };

    // Use phpMyAdmin style for admin/employee users
    if (isPlatformSide) {
        return <PmaSettingsView {...commonProps} />;
    }

    // Use dark theme for partner users
    return <PartnerSettingsView {...commonProps} />;
};

export default Settings;
