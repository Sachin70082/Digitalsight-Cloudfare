import React from 'react';
import { Artist } from '../types';

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
