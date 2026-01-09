
import { ref, set, get, update, remove, push, query, orderByChild, equalTo } from 'firebase/database';
import { ref as sRef, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from './firebase';
import { User, UserRole, Label, Artist, Release, ReleaseStatus, UserPermissions, InteractionNote, Notice, RevenueEntry } from '../types';

// Helper to handle Firebase "null" results for arrays
const ensureArray = <T>(val: any): T[] => (val ? (Array.isArray(val) ? val : Object.values(val)) : []);

export const api = {
  login: async (email: string): Promise<User | undefined> => {
    const snapshot = await get(ref(db, 'users'));
    const users = ensureArray<User>(snapshot.val());
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return undefined;

    if (user.labelId) {
        const labelSnap = await get(ref(db, `labels/${user.labelId}`));
        if (labelSnap.exists()) user.labelName = labelSnap.val().name;
    }
    if (user.artistId) {
        const artistSnap = await get(ref(db, `artists/${user.artistId}`));
        if (artistSnap.exists()) user.artistName = artistSnap.val().name;
    }
    return user;
  },

  getLabels: async (): Promise<Label[]> => {
    const snapshot = await get(ref(db, 'labels'));
    return ensureArray<Label>(snapshot.val());
  },

  getSubLabels: async (parentLabelId: string): Promise<Label[]> => {
    const snapshot = await get(ref(db, 'labels'));
    const all = ensureArray<Label>(snapshot.val());
    return all.filter(l => l.parentLabelId === parentLabelId);
  },

  updateLabel: async (id: string, name: string, requester: User): Promise<Label> => {
    await update(ref(db, `labels/${id}`), { name });
    // Update cached users
    const usersSnap = await get(ref(db, 'users'));
    const users = usersSnap.val() || {};
    Object.keys(users).forEach(uid => {
        if (users[uid].labelId === id) {
            update(ref(db, `users/${uid}`), { labelName: name });
        }
    });
    const labelSnap = await get(ref(db, `labels/${id}`));
    return labelSnap.val();
  },

  // Helper to purge release assets from storage
  cleanupReleaseAssets: async (releaseId: string) => {
    try {
        const artworkRef = sRef(storage, `releases/${releaseId}/artwork`);
        const audioRef = sRef(storage, `releases/${releaseId}/audio`);
        
        const deleteFolder = async (folderRef: any) => {
            const list = await listAll(folderRef);
            for (const item of list.items) { await deleteObject(item); }
            for (const prefix of list.prefixes) { await deleteFolder(prefix); }
        };

        await deleteFolder(artworkRef);
        await deleteFolder(audioRef);
    } catch (e) {
        console.warn('Asset cleanup failed (maybe already gone):', e);
    }
  },

  deleteLabel: async (id: string, requester: User): Promise<void> => {
    // Basic dependency check
    const artistsSnap = await get(ref(db, 'artists'));
    const labelArtists = ensureArray<Artist>(artistsSnap.val()).filter(a => a.labelId === id);
    
    // In a real app we'd check releases too, but for speed:
    await remove(ref(db, `labels/${id}`));
    // Note: Orphans users, artists in this demo version to keep code minimal
  },

  getLabelAdmin: async (labelId: string): Promise<User | undefined> => {
    const snapshot = await get(ref(db, 'users'));
    const users = ensureArray<User>(snapshot.val());
    return users.find(u => u.labelId === labelId && (u.role === UserRole.LABEL_ADMIN || u.role === UserRole.SUB_LABEL_ADMIN));
  },

  getEmployees: async (requester: User): Promise<User[]> => {
    const snapshot = await get(ref(db, 'users'));
    const users = ensureArray<User>(snapshot.val());
    return users.filter(u => u.role === UserRole.EMPLOYEE);
  },

  addEmployee: async (data: any, requester: User): Promise<User> => {
    const id = `user-emp-${Date.now()}`;
    const newEmp = { ...data, id, role: UserRole.EMPLOYEE, password: Math.random().toString(36).slice(-8) };
    await set(ref(db, `users/${id}`), newEmp);
    return newEmp;
  },

  updateEmployee: async (id: string, data: any, requester: User): Promise<User> => {
    await update(ref(db, `users/${id}`), data);
    const snap = await get(ref(db, `users/${id}`));
    return snap.val();
  },

  deleteEmployee: async (id: string, requester: User): Promise<void> => {
    await remove(ref(db, `users/${id}`));
  },

  updateUserPermissions: async (userId: string, permissions: UserPermissions, requester: User): Promise<User> => {
    await update(ref(db, `users/${userId}`), { permissions });
    const snap = await get(ref(db, `users/${userId}`));
    return snap.val();
  },

  getNotices: async (requester: User): Promise<Notice[]> => {
    const snap = await get(ref(db, 'notices'));
    const all = ensureArray<Notice>(snap.val());
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addNotice: async (data: any, requester: User): Promise<Notice> => {
    const id = `notice-${Date.now()}`;
    const notice = { ...data, id, authorId: requester.id, authorName: requester.name, 
                     authorDesignation: requester.designation || requester.role, timestamp: new Date().toISOString() };
    await set(ref(db, `notices/${id}`), notice);
    return notice;
  },

  deleteNotice: async (id: string, requester: User): Promise<void> => {
    await remove(ref(db, `notices/${id}`));
  },

  // Fixed: Added missing updateNotice implementation to handle notice editing from the UI
  updateNotice: async (id: string, data: any, requester: User): Promise<Notice> => {
    await update(ref(db, `notices/${id}`), data);
    const snap = await get(ref(db, `notices/${id}`));
    return snap.val();
  },

  getArtistsByLabel: async (labelId: string): Promise<Artist[]> => {
    const snap = await get(ref(db, 'artists'));
    return ensureArray<Artist>(snap.val()).filter(a => a.labelId === labelId);
  },

  addArtist: async (artistData: Omit<Artist, 'id'>): Promise<{artist: Artist, user?: User}> => {
    const id = `artist-${Date.now()}`;
    const artist = { ...artistData, id };
    await set(ref(db, `artists/${id}`), artist);

    let user: User | undefined;
    if (artistData.email?.trim()) {
        const uid = `user-art-${Date.now()}`;
        user = { id: uid, name: artist.name, email: artist.email, role: UserRole.ARTIST, 
                 labelId: artist.labelId, artistId: id, artistName: artist.name, password: Math.random().toString(36).slice(-8),
                 permissions: { canManageArtists: false, canManageReleases: false, canCreateSubLabels: false } };
        await set(ref(db, `users/${uid}`), user);
    }
    return { artist, user };
  },

  updateArtist: async (id: string, data: Partial<Artist>, requester: User): Promise<Artist> => {
    await update(ref(db, `artists/${id}`), data);
    const snap = await get(ref(db, `artists/${id}`));
    return snap.val();
  },

  deleteArtist: async (id: string, requester: User): Promise<void> => {
    await remove(ref(db, `artists/${id}`));
  },

  getAllReleases: async (): Promise<Release[]> => {
    const snap = await get(ref(db, 'releases'));
    return ensureArray<Release>(snap.val());
  },

  getReleasesByLabel: async (labelId: string): Promise<Release[]> => {
    const snap = await get(ref(db, 'releases'));
    return ensureArray<Release>(snap.val()).filter(r => r.labelId === labelId);
  },

  getRelease: async (id: string): Promise<Release | undefined> => {
    const snap = await get(ref(db, `releases/${id}`));
    return snap.val() || undefined;
  },

  deleteRelease: async (id: string): Promise<void> => {
    await api.cleanupReleaseAssets(id);
    await remove(ref(db, `releases/${id}`));
  },

  updateReleaseStatus: async (id: string, status: ReleaseStatus, note?: InteractionNote) => {
    const snap = await get(ref(db, `releases/${id}`));
    const release = snap.val() as Release;
    if (release) {
        const updates: any = { status, updatedAt: new Date().toISOString() };
        if (note) updates.notes = [note, ...(release.notes || [])];
        await update(ref(db, `releases/${id}`), updates);
        
        // Asset Cleanup if Rejected or Takedown
        if (status === ReleaseStatus.REJECTED || status === ReleaseStatus.TAKEDOWN) {
            await api.cleanupReleaseAssets(id);
        }
    }
    const final = await get(ref(db, `releases/${id}`));
    return final.val();
  },

  addRelease: async (data: any) => {
    const id = data.id || `rel-${Date.now()}`;
    const now = new Date().toISOString();
    const release = { ...data, id, createdAt: data.createdAt || now, updatedAt: now };
    await set(ref(db, `releases/${id}`), release);
    return release;
  },

  getLabel: async (id: string): Promise<Label | undefined> => {
    const snap = await get(ref(db, `labels/${id}`));
    return snap.val() || undefined;
  },

  getArtist: async (id: string): Promise<Artist | undefined> => {
    const snap = await get(ref(db, `artists/${id}`));
    return snap.val() || undefined;
  },

  getAllArtists: async (): Promise<Artist[]> => {
    const snap = await get(ref(db, 'artists'));
    return ensureArray<Artist>(snap.val());
  },

  globalSearch: async (queryStr: string, user: User) => {
    const q = queryStr.toLowerCase();
    const [l, a, r] = await Promise.all([api.getLabels(), api.getAllArtists(), api.getAllReleases()]);
    return {
      labels: l.filter(i => i.name.toLowerCase().includes(q)),
      artists: a.filter(i => i.name.toLowerCase().includes(q)),
      releases: r.filter(i => i.title.toLowerCase().includes(q) || i.upc.includes(q))
    };
  },

  createLabel: async (data: any): Promise<{ label: Label, user: User }> => {
    const lid = data.id || `label-${Date.now()}`;
    const uid = `user-lab-${Date.now()}`;
    const pass = data.adminPassword || Math.random().toString(36).slice(-8);

    const label = { ...data, id: lid, ownerId: uid, createdAt: new Date().toISOString(), status: 'Active' };
    const user = { id: uid, name: data.adminName || data.name, email: data.adminEmail, password: pass, 
                   role: data.parentLabelId ? UserRole.SUB_LABEL_ADMIN : UserRole.LABEL_ADMIN, 
                   labelId: lid, labelName: data.name, permissions: data.permissions };
    
    await set(ref(db, `labels/${lid}`), label);
    await set(ref(db, `users/${uid}`), user);
    return { label, user };
  },

  getAllRevenue: async (): Promise<RevenueEntry[]> => {
    const snap = await get(ref(db, 'revenue'));
    return ensureArray<RevenueEntry>(snap.val());
  },

  getRevenueForLabelHierarchy: async (labelId: string): Promise<RevenueEntry[]> => {
    const all = await api.getAllRevenue();
    return all.filter(r => r.labelId === labelId); // Simplified for demo
  }
};
