import React from 'react';

// phpMyAdmin style fieldset wrapper
export const PmaFieldset: React.FC<{
    legend: string;
    children: React.ReactNode;
    className?: string;
}> = ({ legend, children, className = '' }) => (
    <fieldset className={`bg-white border border-[#aaa] rounded shadow-sm ${className} font-sans`}>
        <legend className="px-2 text-xs font-bold text-black bg-[#f5f5f5] border border-[#aaa] ml-2">{legend}</legend>
        <div className="p-1">{children}</div>
    </fieldset>
);

// phpMyAdmin style table
export const PmaTable: React.FC<{
    headers: { label: string; className?: string }[];
    children: React.ReactNode;
}> = ({ headers, children }) => (
    <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px] font-sans text-black">
            <thead>
                <tr className="bg-gradient-to-b from-[#e8e8e8] to-[#d8d8d8]">
                    {headers.map((h, i) => (
                        <th key={i} className={`border border-[#aaa] px-2 py-1 text-left font-bold text-black ${h.className || ''}`}>
                            {h.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    </div>
);

// phpMyAdmin style table row
export const PmaTR: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}> = ({ children, onClick, className = '' }) => (
    <tr 
        className={`hover:bg-[#e5f3ff] odd:bg-white even:bg-[#f5f5f5] ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
    >
        {children}
    </tr>
);

// phpMyAdmin style table cell
export const PmaTD: React.FC<{
    children: React.ReactNode;
    className?: string;
    isLabel?: boolean;
    colSpan?: number;
}> = ({ children, className = '', isLabel = false, colSpan }) => (
    <td colSpan={colSpan} className={`border border-[#aaa] px-2 py-1 ${isLabel ? 'bg-[#f5f5f5] font-bold' : ''} ${className}`}>
        {children}
    </td>
);

// phpMyAdmin style button
export const PmaButton: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
}> = ({ children, onClick, variant = 'secondary', type = 'button', disabled = false, className = '' }) => {
    const baseStyles = 'px-3 py-1 text-[11px] font-bold border border-[#aaa] rounded shadow-sm transition-all active:shadow-inner';
    const variantStyles = {
        primary: 'bg-gradient-to-b from-[#4a90d9] to-[#336699] text-white border-[#224466] hover:from-[#5a9fe9] hover:to-[#4477aa]',
        secondary: 'bg-gradient-to-b from-[#f7f7f7] to-[#e5e5e5] text-[#333] border-[#ccc] hover:border-[#0066cc]',
        danger: 'bg-gradient-to-b from-[#ff4d4d] to-[#cc0000] text-white border-[#990000] hover:from-[#ff6666] hover:to-[#dd0000]'
    };
    
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            {children}
        </button>
    );
};

// phpMyAdmin style input
export const PmaInput: React.FC<{
    label?: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'password' | 'email' | 'date' | 'number';
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}> = ({ label, value, onChange, type = 'text', placeholder, className = '', disabled = false }) => (
    <div className={className}>
        {label && <label className="block text-[10px] font-bold text-black mb-0.5">{label}</label>}
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full border border-[#aaa] px-2 py-1 text-[11px] focus:border-[#0066cc] outline-none shadow-sm ${disabled ? 'bg-[#f5f5f5] text-[#666]' : 'bg-white text-black'}`}
        />
    </div>
);

// phpMyAdmin style select
export const PmaSelect: React.FC<{
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    className?: string;
}> = ({ label, value, onChange, options, className = '' }) => (
    <div className={className}>
        {label && <label className="block text-[10px] font-bold text-black mb-0.5">{label}</label>}
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full border border-[#aaa] px-2 py-1 text-[11px] focus:border-[#0066cc] outline-none bg-white shadow-sm text-black"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

// phpMyAdmin style status badge
export const PmaStatusBadge: React.FC<{
    status: string;
}> = ({ status }) => {
    const statusStyles: Record<string, string> = {
        'Published': 'bg-[#ccffcc] text-[#006600] border-[#006600]',
        'Pending': 'bg-[#ffffcc] text-[#996600] border-[#996600]',
        'Rejected': 'bg-[#ffcccc] text-[#cc0000] border-[#cc0000]',
        'Draft': 'bg-[#e8e8e8] text-[#666] border-[#666]',
        'Needs Info': 'bg-[#ffe6cc] text-[#996600] border-[#996600]',
        'Active': 'bg-[#ccffcc] text-[#006600] border-[#006600]',
        'Suspended': 'bg-[#ffcccc] text-[#cc0000] border-[#cc0000]',
        'URGENT': 'bg-[#ffcccc] text-[#cc0000] border-[#cc0000]',
        'UPDATE': 'bg-[#cce5ff] text-[#0066cc] border-[#0066cc]',
        'POLICY': 'bg-[#e6ccff] text-[#6600cc] border-[#6600cc]',
        'EVENT': 'bg-[#ffffcc] text-[#996600] border-[#996600]',
        'GENERAL': 'bg-[#ccffcc] text-[#006600] border-[#006600]'
    };
    
    const style = statusStyles[status] || 'bg-[#e8e8e8] text-[#666] border-[#666]';
    
    return (
        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${style}`}>
            {status}
        </span>
    );
};

// phpMyAdmin style link
export const PmaLink: React.FC<{
    children: React.ReactNode;
    to: string;
    className?: string;
}> = ({ children, to, className = '' }) => {
    const RouterLink = require('react-router-dom').Link;
    return (
        <RouterLink to={to} className={`text-[#0066cc] hover:underline text-[11px] ${className}`}>
            {children}
        </RouterLink>
    );
};

// phpMyAdmin style action link
export const PmaActionLink: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
}> = ({ children, onClick, danger = false }) => (
    <button
        onClick={onClick}
        className={`text-[10px] ${danger ? 'text-[#cc0000]' : 'text-[#0066cc]'} hover:underline font-bold`}
    >
        {children}
    </button>
);

// phpMyAdmin style pagination
export const PmaPagination: React.FC<{
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return (
        <div className="flex justify-between items-center mt-2 text-[10px] font-sans bg-[#f5f5f5] border border-[#aaa] p-1">
            <div className="text-black font-bold">
                Page {currentPage} of {totalPages || 1} ({totalItems} records)
            </div>
            <div className="flex gap-1">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-0.5 border border-[#aaa] bg-gradient-to-b from-[#f7f7f7] to-[#e5e5e5] hover:border-[#0066cc] disabled:opacity-50 font-bold text-black"
                >
                    &lt; Previous
                </button>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-2 py-0.5 border border-[#aaa] bg-gradient-to-b from-[#f7f7f7] to-[#e5e5e5] hover:border-[#0066cc] disabled:opacity-50 font-bold text-black"
                >
                    Next &gt;
                </button>
            </div>
        </div>
    );
};

// phpMyAdmin style info bar
export const PmaInfoBar: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => (
    <div className="bg-[#ffffcc] border border-[#cc9] px-3 py-1.5 rounded shadow-sm mb-3 text-[11px] text-black font-sans">
        {children}
    </div>
);

// phpMyAdmin style section title
export const PmaSectionTitle: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => (
    <h2 className="text-sm font-bold text-black mb-3 pb-1 border-b border-[#aaa] font-sans">
        {children}
    </h2>
);

// phpMyAdmin style bottom audio player
export const PmaAudioPlayer: React.FC<{
    src: string;
    title: string;
    onClose: () => void;
}> = ({ src, title, onClose }) => {
    const [volume, setVolume] = React.useState(1);
    const [playbackRate, setPlaybackRate] = React.useState(1);
    const audioRef = React.useRef<HTMLAudioElement>(null);

    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-[#f7f7f7] to-[#e5e5e5] border-t-2 border-[#aaa] p-2 z-[1000] shadow-[0_-2px_10px_rgba(0,0,0,0.1)] font-sans">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-8 h-8 bg-[#336699] text-white flex items-center justify-center rounded font-bold text-xs">
                        ♫
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-black truncate">{title}</p>
                        <p className="text-[9px] text-[#666] uppercase font-bold tracking-widest">Now Auditing</p>
                    </div>
                </div>

                <div className="flex-1 flex items-center gap-4">
                    <audio 
                        ref={audioRef}
                        src={src} 
                        controls 
                        autoPlay
                        className="w-full h-8"
                    />
                </div>

                <div className="flex items-center gap-4 min-w-[250px]">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#666]">VOL:</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={volume} 
                            onChange={e => setVolume(parseFloat(e.target.value))}
                            className="w-16 h-1 bg-[#ccc] rounded-lg appearance-none cursor-pointer accent-[#336699]"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#666]">SPD:</span>
                        <select 
                            value={playbackRate} 
                            onChange={e => setPlaybackRate(parseFloat(e.target.value))}
                            className="text-[10px] border border-[#aaa] bg-white rounded"
                        >
                            <option value="0.5">0.5x</option>
                            <option value="1">1.0x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2.0x</option>
                        </select>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-[#666] hover:text-[#cc0000] font-bold text-lg px-2"
                    >
                        &times;
                    </button>
                </div>
            </div>
        </div>
    );
};
