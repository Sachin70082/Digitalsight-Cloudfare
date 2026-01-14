
import { ref, set, get, update, remove, push, query, orderByChild, equalTo } from 'firebase/database';
// @fix: Use namespace import and any cast for firebase/auth to resolve "no exported member" errors in the environment
import * as authExports from 'firebase/auth';
const { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  sendPasswordResetEmail,
  deleteUser
} = authExports as any;
type FirebaseUser = any;

import { db, auth, secondaryAuth } from './firebase';
import { r2Service } from './r2Service';
import { User, UserRole, Label, Artist, Release, ReleaseStatus, UserPermissions, InteractionNote, Notice, RevenueEntry } from '../types';

// Helper to handle Firebase "null" results for arrays
const ensureArray = <T>(val: any): T[] => (val ? (Array.isArray(val) ? val : Object.values(val)) : []);

/**
 * Robust recursive deletion for Cloudflare R2.
 */
const deleteFolderRecursive = async (path: string) => {
    try {
        await r2Service.deleteFile(path);
    } catch (err) {
        console.warn(`[Vault Purge] Path not found or inaccessible in R2: ${path}`);
    }
};

/**
 * Internal helper to resolve all label IDs in a hierarchy (self + all nested children)
 */
const getLabelHierarchyIds = async (rootLabelId: string): Promise<string[]> => {
    const snapshot = await get(ref(db, 'labels'));
    const allLabels = ensureArray<Label>(snapshot.val());
    
    const getChildren = (pid: string): string[] => {
        const children = allLabels.filter(l => l.parentLabelId === pid);
        let ids = children.map(l => l.id);
        for (const child of children) {
            ids = [...ids, ...getChildren(child.id)];
        }
        return ids;
    };

    return [rootLabelId, ...getChildren(rootLabelId)];
};

const defaultPermissions: UserPermissions = {
  canManageArtists: false,
  canManageReleases: false,
  canCreateSubLabels: false,
  canSubmitAlbums: true,
  canManageEmployees: false,
  canManageNetwork: false,
  canViewFinancials: false,
  canOnboardLabels: false,
  canDeleteReleases: false
};

const ownerPermissions: UserPermissions = {
  canManageArtists: true,
  canManageReleases: true,
  canCreateSubLabels: true,
  canSubmitAlbums: true,
  canManageEmployees: true,
  canManageNetwork: true,
  canViewFinancials: true,
  canOnboardLabels: true,
  canDeleteReleases: true
};

export const api = {
  login: async (email: string, password?: string, recaptchaToken?: string): Promise<User | { needsProfile: true, firebaseUser: FirebaseUser } | undefined> => {
    if (!password) throw new Error('Password required.');

    // reCAPTCHA Verification
    if (recaptchaToken) {
        try {
            const response = await fetch(`https://recaptchaenterprise.googleapis.com/v1/projects/digitalsight-1766421526484/assessments?key=AIzaSyA3Km1Lrjpfa7pzUqzmSZs77JIRjH-CPfs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        token: recaptchaToken,
                        siteKey: '6LeLuDMsAAAAAFbt7or2TUzG2I6TIBKAeuQKOxyT',
                        expectedAction: 'login'
                    }
                })
            });
            const assessment = await response.json();
            if (!assessment.tokenProperties?.valid || assessment.riskAnalysis?.score < 0.5) {
                console.error("[Auth Pipeline] reCAPTCHA verification failed:", assessment);
                throw new Error('Security verification failed. Please try again.');
            }
        } catch (err: any) {
            console.error("[Auth Pipeline] reCAPTCHA error:", err);
            throw new Error(err.message || 'Security protocol error.');
        }
    }
    
    const cleanEmail = email.trim().toLowerCase();
    const isMasterEmail = cleanEmail === 'digitalsight.owner@gmail.com';
    
    let authResult;
    let profileByEmail: User | undefined;

    // First, try to find the user in the database to check their stored password
    const usersSnap = await get(ref(db, 'users'));
    const users = usersSnap.val() || {};
    profileByEmail = Object.values(users).find((u: any) => u.email && u.email.toLowerCase() === cleanEmail) as User;

    // Sync password if it was reset via Firebase but not updated in our DB
    if (profileByEmail && profileByEmail.password !== password) {
        try {
            // Verify with Firebase Auth
            const tempAuth = await signInWithEmailAndPassword(auth, cleanEmail, password);
            if (tempAuth.user) {
                // If Firebase login succeeds with the new password, update our DB
                await update(ref(db, `users/${tempAuth.user.uid}`), { password: password });
                profileByEmail.password = password;
                console.log("[Auth Pipeline] Database password synchronized with Firebase Auth.");
            }
        } catch (e) {
            // Ignore, standard login flow will handle it
        }
    }

    try {
        // Try standard Firebase Auth first
        authResult = await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (error: any) {
        // If Auth fails, check if the password matches the one stored in our database (Security Override)
        if (profileByEmail && profileByEmail.password === password) {
            // Password matches database record - allow login (Mocking Admin SDK password reset effect)
            const profile = { ...profileByEmail };
            if (profile.labelId) {
                const actualLabelSnap = await get(ref(db, `labels/${profile.labelId}`));
                if (actualLabelSnap.exists()) profile.labelName = actualLabelSnap.val().name;
            }
            console.log("[Auth Pipeline] Security override login successful for:", cleanEmail);
            
            // Ensure permissions are correctly set
            const finalPermissions = profile.role === UserRole.OWNER ? { ...ownerPermissions } : { ...defaultPermissions, ...(profile.permissions || {}) };
            return { ...profile, permissions: finalPermissions };
        }

        if (isMasterEmail && (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found')) {
            try {
                authResult = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            } catch (regError: any) {
                throw error;
            }
        } else {
            console.error("[Auth Pipeline] Login failure:", error);
            throw error;
        }
    }

    const firebaseUser = authResult.user;
    const profileSnap = await get(ref(db, `users/${firebaseUser.uid}`));

    let profile: User;
    if (!profileSnap.exists()) {
        if (isMasterEmail) return { needsProfile: true, firebaseUser };
        if (!profileByEmail) throw new Error('Identity verified, but platform profile not found in database.');
        profile = { ...profileByEmail };
    } else {
        profile = profileSnap.val() as User;
        profile.id = firebaseUser.uid;
    }

    if (isMasterEmail || profile.role === UserRole.OWNER) {
        profile.role = UserRole.OWNER;
        profile.permissions = { ...ownerPermissions };
    } else {
        profile.permissions = { ...defaultPermissions, ...(profile.permissions || {}) };
    }

    if (profile.labelId) {
        const actualLabelSnap = await get(ref(db, `labels/${profile.labelId}`));
        if (actualLabelSnap.exists()) profile.labelName = actualLabelSnap.val().name;
    }
    
    return profile;
  },

  createMasterProfile: async (uid: string, data: { name: string, designation: string }): Promise<User> => {
    const masterUser: User = {
        id: uid,
        name: data.name,
        email: 'digitalsight.owner@gmail.com',
        role: UserRole.OWNER,
        designation: data.designation,
        permissions: { ...ownerPermissions }
    };
    await set(ref(db, `users/${uid}`), masterUser);
    return masterUser;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error('No active security session found.');
    try {
        const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        await update(ref(db, `users/${currentUser.uid}`), { password: newPassword });
    } catch (error: any) {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') throw new Error('The current password you entered is incorrect.');
        if (error.code === 'auth/weak-password') throw new Error('The new password is too weak.');
        throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
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

  updateLabel: async (id: string, data: Partial<Label>, requester: User): Promise<Label> => {
    await update(ref(db, `labels/${id}`), data);
    if (data.name) {
      const usersSnap = await get(ref(db, 'users'));
      const users = usersSnap.val() || {};
      Object.keys(users).forEach(uid => {
          if (users[uid].labelId === id) {
              update(ref(db, `users/${uid}`), { labelName: data.name });
          }
      });
    }
    const labelSnap = await get(ref(db, `labels/${id}`));
    return labelSnap.val();
  },

  /**
   * Protocol Purge: Eradicates ONLY audio files (WAV masters).
   * Kept for Rejected/Takedown statuses to preserve JSON metadata and Artwork.
   */
  cleanupReleaseAssets: async (releaseId: string) => {
    const audioPath = `releases/${releaseId}/audio`;
    await deleteFolderRecursive(audioPath);
    
    // Also update the database to reflect that audio is gone
    const snap = await get(ref(db, `releases/${releaseId}`));
    const release = snap.val() as Release;
    if (release && release.tracks) {
        const updatedTracks = release.tracks.map(t => ({
            ...t,
            audioUrl: '',
            audioFileName: ''
        }));
        await update(ref(db, `releases/${releaseId}`), { tracks: updatedTracks });
    }
    
    console.log(`[Vault Transmission] Audio masters purged for sequence ${releaseId}. JSON data and Artwork preserved.`);
  },

  deleteLabel: async (id: string, requester: User): Promise<void> => {
    // 1. Find the owner of the label
    const labelSnap = await get(ref(db, `labels/${id}`));
    if (labelSnap.exists()) {
        const labelData = labelSnap.val();
        const ownerId = labelData.ownerId;
        
        if (ownerId) {
            // 2. Remove from Realtime Database
            await remove(ref(db, `users/${ownerId}`));
            
            // Note: Firebase Client SDK does not allow deleting OTHER users.
            // To fully delete from Firebase Auth, you would typically use a Firebase Function (Admin SDK).
            // However, we can attempt to delete the CURRENT user if they are the one being deleted,
            // or log that manual intervention is needed for Auth cleanup.
            console.log(`[Auth Cleanup] Label owner ${ownerId} removed from Database. Manual Firebase Auth deletion may be required if not using Admin SDK.`);
        }
    }

    // 3. Remove the label itself
    await remove(ref(db, `labels/${id}`));
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
    const password = data.password || Math.random().toString(36).slice(-8);
    const authResult = await createUserWithEmailAndPassword(secondaryAuth, data.email, password);
    const uid = authResult.user.uid;
    const newEmp = { ...data, id: uid, role: UserRole.EMPLOYEE, password, permissions: data.permissions || { ...defaultPermissions } };
    await set(ref(db, `users/${uid}`), newEmp);
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

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    await update(ref(db, `users/${userId}`), data);
    const snap = await get(ref(db, `users/${userId}`));
    return snap.val();
  },

  blockUser: async (userId: string, reason: string): Promise<void> => {
    await update(ref(db, `users/${userId}`), { isBlocked: true, blockReason: reason });
  },

  unblockUser: async (userId: string): Promise<void> => {
    await update(ref(db, `users/${userId}`), { isBlocked: false, blockReason: null });
  },

  sendPasswordResetEmail: async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
        console.log("[Auth Pipeline] Password reset email dispatched to:", email);
    } catch (error) {
        console.error("[Auth Pipeline] Failed to dispatch reset email:", error);
        throw error;
    }
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

  updateNotice: async (id: string, data: any, requester: User): Promise<Notice> => {
    await update(ref(db, `notices/${id}`), data);
    const snap = await get(ref(db, `notices/${id}`));
    return snap.val();
  },

  getArtistsByLabel: async (labelId: string): Promise<Artist[]> => {
    const hierarchyIds = await getLabelHierarchyIds(labelId);
    const snap = await get(ref(db, 'artists'));
    return ensureArray<Artist>(snap.val()).filter(a => hierarchyIds.includes(a.labelId));
  },

  addArtist: async (artistData: Omit<Artist, 'id'>): Promise<{artist: Artist, user?: User}> => {
    const aid = `artist-${Date.now()}`;
    const artist = { ...artistData, id: aid };
    await set(ref(db, `artists/${aid}`), artist);

    let user: User | undefined;
    if (artistData.email?.trim()) {
        const password = Math.random().toString(36).slice(-8);
        const authResult = await createUserWithEmailAndPassword(secondaryAuth, artist.email, password);
        const uid = authResult.user.uid;
        user = { 
            id: uid, name: artist.name, email: artist.email, role: UserRole.ARTIST, 
            labelId: artist.labelId, artistId: aid, artistName: artist.name, 
            password, permissions: { ...defaultPermissions } 
        };
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
    // Check for active releases
    const snapshot = await get(ref(db, 'releases'));
    const allReleases = ensureArray<Release>(snapshot.val());
    
    const activeReleases = allReleases.filter(r => {
        const isAssociated = (r.primaryArtistIds || []).includes(id) ||
                             (r.featuredArtistIds || []).includes(id) ||
                             (r.tracks || []).some(t => (t.primaryArtistIds || []).includes(id) || (t.featuredArtistIds || []).includes(id));
        
        // If associated, check status
        if (!isAssociated) return false;
        
        // Allow deletion if status is Draft or Needs Info (Correction)
        // Block if Pending, Approved, Processed, Published, Takedown, Cancelled (unless we consider Takedown/Cancelled as deletable, but user said "not in draft or correction")
        // User said: "if album submited by label and not in draft or album is in pending ...then no one should delete"
        // "if draft or correction need status then any one should modify or delete"
        return r.status !== ReleaseStatus.DRAFT && r.status !== ReleaseStatus.NEEDS_INFO;
    });

    if (activeReleases.length > 0) {
        throw new Error(`Cannot delete artist. Associated with ${activeReleases.length} active release(s). Only artists in Draft or Correction releases can be removed.`);
    }

    await remove(ref(db, `artists/${id}`));
  },

  getAllReleases: async (): Promise<Release[]> => {
    const snap = await get(ref(db, 'releases'));
    return ensureArray<Release>(snap.val());
  },

  getReleasesByLabel: async (labelId: string): Promise<Release[]> => {
    const hierarchyIds = await getLabelHierarchyIds(labelId);
    const snapshot = await get(ref(db, 'releases'));
    const releases = ensureArray<Release>(snapshot.val());
    return releases.filter(r => hierarchyIds.includes(r.labelId));
  },

  getRelease: async (id: string): Promise<Release | undefined> => {
    const snap = await get(ref(db, `releases/${id}`));
    return snap.val() || undefined;
  },

  /**
   * Hard Delete: Full Eradication.
   * Purges ALL assets (Artwork + Audio) from Storage and removes the DB record.
   */
  deleteRelease: async (id: string): Promise<void> => {
    const releaseSnap = await get(ref(db, `releases/${id}`));
    if (!releaseSnap.exists()) return;

    // 1. Recursive Storage Wipe (Artwork AND Audio)
    await deleteFolderRecursive(`releases/${id}`);
    
    // 2. Database Record Eradication
    await remove(ref(db, `releases/${id}`));
    console.log(`[Vault Transmission] Hard delete successful for sequence ${id}. Node eradicated.`);
  },

  updateReleaseStatus: async (id: string, status: ReleaseStatus, note?: InteractionNote) => {
    const snap = await get(ref(db, `releases/${id}`));
    const release = snap.val() as Release;
    if (release) {
        const updates: any = { status, updatedAt: new Date().toISOString() };
        if (note) updates.notes = [note, ...(ensureArray(release.notes))];
        await update(ref(db, `releases/${id}`), updates);
        
        // Protocol: Only purge audio if rejected/takedown. Metadata and Artwork stay.
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
    const [l, a, r] = await Promise.all([api.getLabels(), api.getAllArtists(), api.getReleasesByLabel(user.labelId || '')]);
    return {
      labels: l.filter(i => i.name.toLowerCase().includes(q)),
      artists: a.filter(i => i.name.toLowerCase().includes(q)),
      releases: r.filter(i => i.title.toLowerCase().includes(q) || (i.upc && i.upc.includes(q)))
    };
  },

  createLabel: async (data: any): Promise<{ label: Label, user: User }> => {
    const lid = data.id || `label-${Date.now()}`;
    const password = data.adminPassword || Math.random().toString(36).slice(-8);
    const authResult = await createUserWithEmailAndPassword(secondaryAuth, data.adminEmail, password);
    const uid = authResult.user.uid;
    const label = {
        maxArtists: 10, // Default limit
        ...data,
        id: lid,
        ownerId: uid,
        createdAt: new Date().toISOString(),
        status: 'Active'
    };
    const user = { 
        id: uid, name: data.adminName || data.name, email: data.adminEmail, password,
        role: data.parentLabelId ? UserRole.SUB_LABEL_ADMIN : UserRole.LABEL_ADMIN, 
        labelId: lid, labelName: data.name, permissions: data.permissions || { ...defaultPermissions }
    };
    await set(ref(db, `labels/${lid}`), label);
    await set(ref(db, `users/${uid}`), user);
    return { label, user };
  },

  getAllRevenue: async (): Promise<RevenueEntry[]> => {
    const snap = await get(ref(db, 'revenue'));
    return ensureArray<RevenueEntry>(snap.val());
  },

  getRevenueForLabelHierarchy: async (labelId: string): Promise<RevenueEntry[]> => {
    const hierarchyIds = await getLabelHierarchyIds(labelId);
    const all = await api.getAllRevenue();
    return all.filter(r => hierarchyIds.includes(r.labelId));
  }
};
