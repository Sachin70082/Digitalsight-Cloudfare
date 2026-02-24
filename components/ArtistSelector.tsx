import React, { useContext } from 'react';
import { Artist, UserRole } from '../types';
import { AppContext } from '../App';

interface ArtistSelectorProps {
  label: string;
  allArtists: Artist[];
  selectedArtistIds: string[];
  onChange: (newIds: string[]) => void;
  disabledArtistIds?: string[];
}

const ArtistSelector: React.FC<ArtistSelectorProps> = ({
  label,
  allArtists,
  selectedArtistIds,
  onChange,
  disabledArtistIds = []
}) => {
  const { user } = useContext(AppContext);
  const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;

  const handleAddArtist = (artistId: string) => {
    if (artistId && !selectedArtistIds.includes(artistId)) {
      onChange([...selectedArtistIds, artistId]);
    }
  };

  const handleRemoveArtist = (artistId: string) => {
    onChange(selectedArtistIds.filter(id => id !== artistId));
  };

  const selectedArtists = selectedArtistIds.map(id => allArtists.find(a => a.id === id)).filter(Boolean) as Artist[];
  const availableArtists = allArtists.filter(a => !selectedArtistIds.includes(a.id) && !disabledArtistIds.includes(a.id));

  if (isPlatformSide) {
    return (
      <div className="space-y-1" style={{ fontFamily: 'Verdana, Arial, Helvetica, sans-serif' }}>
        <label className="block text-[10px] font-bold text-[#666]">{label}</label>
        <div className="border border-[#aaa] p-1 bg-white min-h-[30px] shadow-sm">
          {selectedArtists.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {selectedArtists.map(artist => (
                <span key={artist.id} className="bg-[#f5f5f5] border border-[#aaa] text-[#333] text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  {artist.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveArtist(artist.id)}
                    className="text-[#cc0000] font-bold hover:bg-[#eee] px-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
          <select
            value=""
            onChange={(e) => handleAddArtist(e.target.value)}
            className="w-full bg-transparent border-none text-[10px] font-bold outline-none cursor-pointer text-[#0066cc]"
          >
            <option value="">{selectedArtists.length > 0 ? 'Add another...' : 'Select artist...'}</option>
            {availableArtists.map(artist => (
              <option key={artist.id} value={artist.id}>{artist.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{label}</label>
      <div className="bg-black/20 border border-white/10 rounded-xl p-3 min-h-[56px] transition-all duration-300 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/50">
        {selectedArtists.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedArtists.map(artist => (
              <span key={artist.id} className="bg-primary text-black text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg shadow-primary/20">
                {artist.name}
                <button
                  type="button"
                  onClick={() => handleRemoveArtist(artist.id)}
                  className="hover:bg-black/10 rounded-full h-4 w-4 flex items-center justify-center transition-colors"
                  aria-label={`Remove ${artist.name}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center">
          <select
            value=""
            onChange={(e) => handleAddArtist(e.target.value)}
            className="w-full bg-transparent border-none text-white text-sm font-bold outline-none cursor-pointer appearance-none"
          >
            <option value="" className="bg-gray-900">{selectedArtists.length > 0 ? 'Add another node...' : 'Select node...'}</option>
            {availableArtists.map(artist => (
              <option key={artist.id} value={artist.id} className="bg-gray-900">{artist.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ArtistSelector;
