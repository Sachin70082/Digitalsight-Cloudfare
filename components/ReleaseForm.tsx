
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { Release, Track, ReleaseType, Artist, ReleaseStatus } from '../types';
import { Button, Input, Textarea, Spinner } from './ui';
import { SparklesIcon, UploadIcon, XCircleIcon, MusicIcon, CheckCircleIcon } from './Icons';
import { generateReleaseDescription } from '../services/geminiService';
import { api } from '../services/mockApi';
import { storage } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import ArtistSelector from './ArtistSelector';

interface ReleaseFormProps {
    onClose: () => void;
    onSave: (release: Release) => void;
    initialReleaseId?: string;
}

type FormData = Omit<Release, 'createdAt' | 'updatedAt' | 'labelId'>;

const emptyTrack = (num: number): Track => ({
    id: `tr-${Date.now()}-${num}`,
    trackNumber: num,
    discNumber: 1,
    title: '',
    versionTitle: '',
    primaryArtistIds: [],
    featuredArtistIds: [],
    isrc: '',
    duration: 0,
    explicit: false,
    audioFileName: '',
    audioUrl: '',
    composer: '',
    lyricist: ''
});

const ReleaseForm: React.FC<ReleaseFormProps> = ({ onClose, onSave, initialReleaseId }) => {
    const { user } = useContext(AppContext);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(!!initialReleaseId);
    
    // Submission Progress State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState('');

    const [submissionNote, setSubmissionNote] = useState('');
    const [labelArtists, setLabelArtists] = useState<Artist[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Staging Files for Firebase
    const [stagedArtwork, setStagedArtwork] = useState<File | null>(null);
    const [stagedAudio, setStagedAudio] = useState<Record<number, File>>({});

    const [formData, setFormData] = useState<FormData>({
        id: initialReleaseId || `draft-${Date.now()}`,
        title: '',
        versionTitle: '',
        releaseType: ReleaseType.SINGLE,
        primaryArtistIds: [],
        featuredArtistIds: [],
        upc: '',
        catalogueNumber: '',
        releaseDate: '',
        artworkUrl: '', 
        artworkFileName: '',
        pLine: '',
        cLine: '',
        description: '',
        explicit: false,
        status: ReleaseStatus.DRAFT,
        genre: '',
        subGenre: '',
        mood: '',
        language: '',
        publisher: '',
        filmName: '',
        filmDirector: '',
        filmProducer: '',
        filmBanner: '',
        filmCast: '',
        originalReleaseDate: '',
        tracks: [],
        notes: []
    });

    const isCorrectionFlow = formData.status === ReleaseStatus.NEEDS_INFO;

    useEffect(() => {
        const loadInitialData = async () => {
            if (user?.labelId) {
                const artists = await api.getArtistsByLabel(user.labelId);
                setLabelArtists(artists);
            }
            if (initialReleaseId) {
                const existing = await api.getRelease(initialReleaseId);
                if (existing) setFormData({ ...existing });
                setIsLoading(false);
            } else {
                setFormData(prev => ({ ...prev, tracks: [emptyTrack(1)] }));
            }
        };
        loadInitialData();
    }, [initialReleaseId, user]);

    const handleChange = <T extends keyof FormData,>(field: T, value: FormData[T]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTrackChange = (index: number, field: keyof Track, value: any) => {
        const newTracks = [...formData.tracks];
        (newTracks[index] as any)[field] = value;
        handleChange('tracks', newTracks);
    };

    const addTrack = () => {
        const newTrackNumber = formData.tracks.length + 1;
        handleChange('tracks', [...formData.tracks, emptyTrack(newTrackNumber)]);
    };

    const removeTrack = (index: number) => {
        const newTracks = formData.tracks.filter((_, i) => i !== index);
        newTracks.forEach((t, i) => t.trackNumber = i + 1);
        handleChange('tracks', newTracks);
    };

    const handleAudioSelect = async (file: File, index: number) => {
        if (!file.name.toLowerCase().endsWith('.wav')) {
            alert('High-fidelity WAV masters only.');
            return;
        }

        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const duration = Math.round(audioBuffer.duration);

            setStagedAudio(prev => ({ ...prev, [index]: file }));
            handleTrackChange(index, 'audioFileName', file.name);
            handleTrackChange(index, 'duration', duration);
            handleTrackChange(index, 'audioUrl', 'staged'); // Marker for UI
            
            if (!formData.tracks[index].title) {
                handleTrackChange(index, 'title', file.name.replace('.wav', ''));
            }
        } catch (err: any) {
            alert(`Error processing audio: ${err.message}`);
        }
    };

    const handleArtworkSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('JPEG or PNG cover art required.');
            return;
        }
        setStagedArtwork(file);
        setFormData(prev => ({
            ...prev,
            artworkUrl: 'staged', // Marker for UI
            artworkFileName: file.name
        }));
    };

    const performUploads = async (): Promise<Partial<FormData>> => {
        setIsSubmitting(true);
        const releaseId = formData.id;
        let finalArtworkUrl = formData.artworkUrl;
        const updatedTracks = [...formData.tracks];

        // 1. Upload Artwork
        if (stagedArtwork) {
            setProgressStatus('Uploading Artwork...');
            const artRef = ref(storage, `releases/${releaseId}/artwork/${stagedArtwork.name}`);
            const uploadTask = uploadBytesResumable(artRef, stagedArtwork);
            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed', 
                    (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 20)),
                    reject, 
                    async () => {
                        finalArtworkUrl = await getDownloadURL(artRef);
                        resolve(null);
                    }
                );
            });
        }

        // 2. Upload Audio Tracks
        for (let i = 0; i < updatedTracks.length; i++) {
            const file = stagedAudio[i];
            if (file) {
                setProgressStatus(`Uploading Track ${i+1}: ${file.name}`);
                const audioRef = ref(storage, `releases/${releaseId}/audio/${updatedTracks[i].id}/${file.name}`);
                const uploadTask = uploadBytesResumable(audioRef, file);
                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed', 
                        (snap) => {
                            const trackProgress = (snap.bytesTransferred / snap.totalBytes) * (80 / updatedTracks.length);
                            setUploadProgress(Math.round(20 + (i * (80 / updatedTracks.length)) + trackProgress));
                        },
                        reject,
                        async () => {
                            updatedTracks[i].audioUrl = await getDownloadURL(audioRef);
                            resolve(null);
                        }
                    );
                });
            }
        }

        setProgressStatus('Finalizing Record...');
        setUploadProgress(100);
        return { artworkUrl: finalArtworkUrl, tracks: updatedTracks };
    };

    const handleSubmit = async () => {
        if (!user || !user.labelId) return;
        if (!formData.artworkUrl) { alert('Cover art is mandatory.'); setStep(4); return; }
        if (formData.tracks.some(t => !t.audioUrl)) { alert('Audio masters missing.'); setStep(3); return; }
        
        try {
            const { artworkUrl, tracks } = await performUploads();

            const newNotes = [...(formData.notes || [])];
            if (submissionNote.trim()) {
                newNotes.unshift({
                    id: `note-${Date.now()}`,
                    authorName: user.name,
                    authorRole: user.role,
                    message: submissionNote,
                    timestamp: new Date().toISOString()
                });
            }
            
            const submittedData = { 
                ...formData, 
                artworkUrl,
                tracks,
                status: ReleaseStatus.PENDING,
                notes: newNotes
            };

            const result = await api.addRelease({ ...submittedData, labelId: user.labelId });
            onSave(result);
            onClose();
        } catch (error: any) {
            alert("Submission error: " + error.message);
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="py-20 flex justify-center"><Spinner /></div>;
    
    return (
        <div className="space-y-6 relative min-h-[500px]">
            {isSubmitting && (
                <div className="absolute inset-0 z-[100] bg-gray-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-fade-in rounded-3xl">
                    <div className="w-full max-w-sm space-y-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow"></div>
                            <div className="relative flex justify-center">
                                {uploadProgress < 100 ? (
                                    <div className="relative">
                                        <Spinner className="w-16 h-16 border-primary border-t-transparent" />
                                        <MusicIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                                    </div>
                                ) : (
                                    <CheckCircleIcon className="w-16 h-16 text-primary animate-scale-in" />
                                )}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                                {uploadProgress < 100 ? 'Deploying to Firebase' : 'Sync Complete'}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono tracking-widest uppercase h-4">{progressStatus}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="relative h-1.5 w-full bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_15px_rgba(29,185,84,0.6)]" 
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                <span>{uploadProgress}% Streamed</span>
                                <span>Vault Encrypted</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stepper Header */}
            <div className="flex justify-between items-center px-4 mb-8">
                {['General', 'Metadata', 'Tracks', 'Artwork', 'Review'].map((name, index) => (
                    <React.Fragment key={name}>
                        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => !isSubmitting && setStep(index + 1)}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-300 ${
                                step > index + 1 ? 'bg-primary text-black shadow-[0_0_15px_rgba(29,185,84,0.3)]' : 
                                (step === index + 1 ? 'bg-primary text-black scale-110 shadow-lg' : 'bg-gray-800 text-gray-600')
                            }`}>
                                {step > index + 1 ? <CheckCircleIcon className="w-5 h-5" /> : index + 1}
                            </div>
                            <span className={`text-[9px] uppercase font-black tracking-widest transition-colors ${step >= index + 1 ? 'text-white' : 'text-gray-600'}`}>{name}</span>
                        </div>
                        {index < 4 && <div className={`flex-1 h-[2px] mx-4 rounded-full transition-colors duration-500 ${step > index + 1 ? 'bg-primary/50' : 'bg-gray-800'}`}></div>}
                    </React.Fragment>
                ))}
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto px-1 custom-scrollbar pr-4">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Album Title" placeholder="e.g. Midnight City" value={formData.title} onChange={e => handleChange('title', e.target.value)} required />
                             <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Configuration</label>
                                <select 
                                    value={formData.releaseType} 
                                    onChange={e => handleChange('releaseType', e.target.value as ReleaseType)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                >
                                    {Object.values(ReleaseType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ArtistSelector label="Primary Artist(s)" allArtists={labelArtists} selectedArtistIds={formData.primaryArtistIds} onChange={(ids) => handleChange('primaryArtistIds', ids)} />
                            <ArtistSelector label="Featured Artist(s)" allArtists={labelArtists} selectedArtistIds={formData.featuredArtistIds} onChange={(ids) => handleChange('featuredArtistIds', ids)} />
                        </div>
                         <div className="relative">
                            <Textarea label="Liner Notes / Description" rows={4} placeholder="Tell the story behind this release..." value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                            <Button type="button" onClick={async () => {
                                const artist = labelArtists.find(a => a.id === formData.primaryArtistIds[0]);
                                if (!formData.title || !artist) return alert('Enter Title and Artist');
                                setIsGenerating(true);
                                const desc = await generateReleaseDescription(artist.name, formData.title);
                                handleChange('description', desc);
                                setIsGenerating(false);
                            }} disabled={isGenerating} className="absolute bottom-3 right-3 text-[10px] py-2 px-4 shadow-xl">
                                {isGenerating ? <Spinner className="h-3 w-3"/> : <><SparklesIcon className="w-3 h-3 mr-2 inline"/> AI Studio</>}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-fade-in">
                        {formData.tracks.map((track, index) => (
                             <div key={track.id} className="group bg-gray-800/20 p-8 rounded-3xl border border-gray-800/60 shadow-inner space-y-8 transition-all hover:bg-gray-800/40">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center text-[12px] font-black text-primary border border-primary/20 shadow-lg">#{track.trackNumber}</div>
                                        <div>
                                            <h4 className="font-black text-white text-lg tracking-tight uppercase italic">Track Module</h4>
                                        </div>
                                    </div>
                                    {formData.tracks.length > 1 && (
                                        <button onClick={() => removeTrack(index)} className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                            <XCircleIcon className="w-6 h-6"/>
                                        </button>
                                    )}
                                </div>
                                
                                <div className={`border-2 border-dashed rounded-2xl px-8 py-6 relative transition-all duration-500 ${track.audioUrl ? 'bg-primary/5 border-primary/30' : 'bg-black/40 border-gray-700/40 hover:border-gray-500'}`}>
                                    {track.audioUrl ? (
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-6 min-w-0">
                                                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0 animate-scale-in border border-primary/20 shadow-[0_0_20px_rgba(29,185,84,0.2)]">
                                                    <MusicIcon className="text-primary w-7 h-7" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm text-white truncate font-black tracking-tight">{track.audioFileName}</p>
                                                    <span className="px-2 py-0.5 bg-primary text-black text-[9px] font-black uppercase rounded shadow-sm">Firebase Staged</span>
                                                </div>
                                            </div>
                                            <Button variant="secondary" className="text-[10px] px-5 py-3 uppercase font-black tracking-widest rounded-xl" onClick={() => handleTrackChange(index, 'audioUrl', '')}>Replace Master</Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-3 py-4 group/drop cursor-pointer">
                                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center transition-all group-hover/drop:scale-110 group-hover/drop:bg-primary/20">
                                                <UploadIcon className="w-6 h-6 text-gray-500 group-hover/drop:text-primary transition-colors" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] text-gray-400 uppercase font-black tracking-[0.2em] group-hover/drop:text-white transition-colors">Stage High-Res WAV Master</p>
                                            </div>
                                            <input type="file" accept=".wav" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleAudioSelect(f, index); }} />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <Input label="Track Title" value={track.title} onChange={e => handleTrackChange(index, 'title', e.target.value)} className="text-sm rounded-xl bg-gray-900/50 border-gray-800" />
                                    <Input label="ISRC" value={track.isrc} onChange={e => handleTrackChange(index, 'isrc', e.target.value)} placeholder="US-XXX-XX-XXXXX" className="text-sm font-mono rounded-xl bg-gray-900/50 border-gray-800" />
                                </div>
                             </div>
                        ))}
                    </div>
                )}

                {step === 4 && (
                    <div className="flex flex-col items-center justify-center h-full animate-fade-in py-12">
                        <div className="relative w-80 h-80 border-2 border-dashed border-gray-700/50 rounded-3xl flex items-center justify-center overflow-hidden bg-black/40 shadow-2xl group transition-all hover:border-primary/40">
                            {formData.artworkUrl ? (
                                <img src={stagedArtwork ? URL.createObjectURL(stagedArtwork) : formData.artworkUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Album Cover" />
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-600 group-hover:text-primary transition-colors">
                                        <UploadIcon className="h-8 w-8" />
                                    </div>
                                    <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Select Cover Art</p>
                                </div>
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleArtworkSelect(f); }} />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-gray-800 bg-gray-900/50 -mx-6 px-6 pb-2 sticky bottom-0 backdrop-blur-md rounded-b-3xl">
                <Button variant="secondary" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || isSubmitting} className="px-8 font-black uppercase text-[10px] tracking-widest">Previous</Button>
                {step < 5 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={isSubmitting} className="px-10 font-black uppercase text-[10px] tracking-widest">Continue</Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="px-12 py-4 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/30">
                        {isSubmitting ? 'Syncing...' : 'Push to Production Storage'}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ReleaseForm;
