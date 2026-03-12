import { useState, useEffect } from 'react';
import './index.css';
import GeminiChat from './components/GeminiChat';

// Mock Guild ID for now, in a real app this would come from Discord OAuth
const DEFAULT_GUILD_ID = '1095003913465385080';
// Use environment variable for API base or fallback to localhost
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [guildId, setGuildId] = useState(localStorage.getItem('guildId') || DEFAULT_GUILD_ID);
    const [stats, setStats] = useState({ memberCount: 0, messageCount: 0, isOnline: false });

    useEffect(() => {
        fetchStats();
    }, [activeTab, guildId]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/stats/${guildId}`);
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error(err);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard stats={stats} />;
            case 'channels': return <Channels guildId={guildId} apiBase={API_BASE} />;
            case 'members': return <Members guildId={guildId} apiBase={API_BASE} />;
            case 'settings': return <Settings guildId={guildId} apiBase={API_BASE} onGuildChange={setGuildId} />;
            default: return <Dashboard stats={stats} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
            {/* Sidebar */}
            <div className="w-20 hover:w-64 bg-slate-900/80 border-r border-white/5 flex flex-col z-40 transition-all duration-300 group backdrop-blur-xl">
                <div className="p-6 border-b border-white/5 flex items-center gap-4 overflow-hidden h-20">
                    <div className="min-w-[32px] h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="text-white text-xl">✨</span>
                    </div>
                    <h1 className="text-lg font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        Discord Manager
                    </h1>
                </div>
                
                <nav className="flex-1 p-3 pt-6 space-y-2 overflow-x-hidden">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                            </svg>
                        )},
                        { id: 'channels', label: 'Channels', icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        )},
                        { id: 'members', label: 'Members', icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )},
                        { id: 'settings', label: 'Settings', icon: (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group/btn h-12 ${activeTab === item.id
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                                }`}
                        >
                            <div className="min-w-[24px] flex justify-center">{item.icon}</div>
                            <span className="font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 h-20 flex items-center gap-4 overflow-hidden">
                    <div className={`min-w-[32px] h-3 w-3 rounded-full ${stats.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-700'} ml-2`}></div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Status</p>
                        <p className={`text-xs font-semibold ${stats.isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                            {stats.isOnline ? 'Connected' : 'Offline'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <main className="max-w-7xl mx-auto p-8 lg:p-12">
                    {renderContent()}
                </main>
            </div>

            {/* AI Floating Chat */}
            <GeminiChat guildId={guildId} apiBase={API_BASE} />
        </div>
    );
}

// Components
const Dashboard = ({ stats }) => (
    <div className="animate-slide-up space-y-12">
        <header>
            <h2 className="text-4xl font-bold text-white tracking-tight">Server Overview</h2>
            <p className="text-slate-400 mt-2 text-lg">ติดตามสถานะและความเคลื่อนไหวล่าสุดของเซิร์ฟเวอร์</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-3xl flex items-center justify-between group">
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-1">Total Members</p>
                    <p className="text-6xl font-black text-white">{stats.memberCount}</p>
                </div>
                <div className="h-20 w-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
            </div>
            <div className="glass-card p-8 rounded-3xl flex items-center justify-between group">
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-1">Messages Tracked</p>
                    <p className="text-6xl font-black text-white">{stats.messageCount}</p>
                </div>
                <div className="h-20 w-20 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                </div>
            </div>
        </div>
    </div>
);

const Channels = ({ guildId, apiBase }) => {
    const [channelsData, setChannelsData] = useState({ categories: [], uncategorized: [] });
    const [channelName, setChannelName] = useState('');
    const [channelType, setChannelType] = useState('0');
    const [parentId, setParentId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiBase}/channels/${guildId}`);
            const data = await res.json();
            if (data.categories) setChannelsData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!channelName) return;
        try {
            await fetch(`${apiBase}/channels/create/${guildId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: channelName, type: channelType, parentId })
            });
            setChannelName('');
            fetchChannels();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const handleDelete = async (channelId, channelName) => {
        if (!confirm(`Are you sure you want to delete #${channelName}?`)) return;
        try {
            await fetch(`${apiBase}/channels/delete/${guildId}/${channelId}`, { method: 'DELETE' });
            fetchChannels();
        } catch (e) { alert('Error: ' + e.message); }
    };

    const renderChannelItem = (c) => (
        <div key={c.id} className="flex items-center justify-between py-2 px-4 hover:bg-white/5 rounded-xl transition-all group">
            <div className="flex items-center gap-3">
                <span className="text-slate-500">
                    {c.type === 2 ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                    )}
                </span>
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{c.name}</span>
            </div>
            <button onClick={() => handleDelete(c.id, c.name)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    );

    return (
        <div className="animate-slide-up space-y-10">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold text-white tracking-tight">Channels</h2>
                    <p className="text-slate-400 mt-2">จัดการหมวดหมู่และช่องแชทภายในเซิร์ฟเวอร์</p>
                </div>
                <button onClick={fetchChannels} className="glass-panel hover:bg-white/10 px-6 py-2.5 rounded-full text-sm font-medium transition-all">
                    Refetch Data
                </button>
            </header>

            <div className="glass-card p-6 rounded-3xl overflow-hidden">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Quick Create</h3>
                <div className="flex flex-wrap gap-4">
                    <input className="flex-1 min-w-[200px] bg-slate-950/50 border border-white/5 rounded-xl px-5 py-3 focus:border-indigo-500/50 outline-none transition-all text-sm" placeholder="Channel Name" value={channelName} onChange={e => setChannelName(e.target.value)} />
                    <select className="bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 focus:border-indigo-500/50 outline-none text-sm min-w-[150px]" value={channelType} onChange={e => setChannelType(e.target.value)}>
                        <option value="0">Text Channel</option>
                        <option value="2">Voice Channel</option>
                    </select>
                    <select className="bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 focus:border-indigo-500/50 outline-none text-sm min-w-[150px]" value={parentId} onChange={e => setParentId(e.target.value)}>
                        <option value="">No Category</option>
                        {channelsData.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-indigo-500/20 transition-all">Create</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-500">Loading channels...</div>
                ) : (
                    <>
                        {channelsData.categories.map(cat => (
                            <div key={cat.id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
                                <div className="bg-white/5 px-5 py-3 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cat.name}</span>
                                    <button onClick={() => handleDelete(cat.id, cat.name)} className="text-slate-500 hover:text-red-400 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-3 flex-1 space-y-1">
                                    {cat.children.length === 0 && <p className="text-slate-600 text-[11px] text-center py-4 italic">Empty category</p>}
                                    {cat.children.map(renderChannelItem)}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

const Members = ({ guildId, apiBase }) => {
    const [userId, setUserId] = useState('');
    const [reason, setReason] = useState('');

    const action = async (type) => {
        try {
            const res = await fetch(`${apiBase}/members/${type}/${guildId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, reason })
            });
            const data = await res.json();
            alert(data.message || data.error);
        } catch (e) { alert('Error: ' + e.message); }
    };

    return (
        <div className="animate-slide-up space-y-10 max-w-3xl">
            <header>
                <h2 className="text-4xl font-bold text-white tracking-tight">Members</h2>
                <p className="text-slate-400 mt-2">จัดการสมาชิกภายในเซิร์ฟเวอร์แบบรายบุคคล</p>
            </header>

            <div className="glass-card p-8 rounded-3xl space-y-6">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">User ID</label>
                        <input className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 focus:border-indigo-500/50 outline-none transition-all" placeholder="Enter Discord User ID..." value={userId} onChange={e => setUserId(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">Reason (Optional)</label>
                        <input className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 focus:border-indigo-500/50 outline-none transition-all" placeholder="Reason for action..." value={reason} onChange={e => setReason(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-4">
                    <button onClick={() => action('mute')} className="bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold text-slate-200 transition-all border border-white/5 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mute
                    </button>
                    <button onClick={() => action('kick')} className="bg-orange-600 hover:bg-orange-500 py-4 rounded-2xl font-bold text-white shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                        </svg>
                        Kick
                    </button>
                    <button onClick={() => action('ban')} className="bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-bold text-white shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Ban
                    </button>
                </div>
            </div>
        </div>
    );
};

const Settings = ({ guildId, apiBase, onGuildChange }) => {
    const [config, setConfig] = useState({ autoRoleId: '', geminiModel: 'gemini-2.5-flash' });
    const [currentGuildId, setCurrentGuildId] = useState(guildId);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${apiBase}/config/${guildId}`);
            const data = await res.json();
            setConfig({
                autoRoleId: data.autoRoleId || '',
                geminiModel: data.geminiModel || 'gemini-2.5-flash'
            });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const saveSettings = async () => {
        try {
            // Update Guild ID if changed
            if (currentGuildId !== guildId) {
                localStorage.setItem('guildId', currentGuildId);
                onGuildChange(currentGuildId);
            }

            const res = await fetch(`${apiBase}/config/${currentGuildId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            alert(data.message || data.error);
        } catch (e) { alert('Error: ' + e.message); }
    };

    if (loading) return <div className="text-slate-500 p-12 text-center">Loading server settings...</div>;

    return (
        <div className="animate-slide-up space-y-10 max-w-3xl pb-20">
            <header>
                <h2 className="text-4xl font-bold text-white tracking-tight">Settings</h2>
                <p className="text-slate-400 mt-2">ปรับแต่งการเชื่อมต่อเซิร์ฟเวอร์, โมเดล AI และระบบอัตโนมัติ</p>
            </header>
            
            <div className="space-y-6">
                {/* Server Config */}
                <div className="glass-card p-8 rounded-3xl">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-7-4h.01M12 16h.01" />
                        </svg>
                        Server Connection
                    </h3>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">Discord Guild ID</label>
                        <input 
                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 focus:border-indigo-500/50 outline-none transition-all font-mono text-sm" 
                            placeholder="Enter your Discord Server ID..." 
                            value={currentGuildId} 
                            onChange={e => setCurrentGuildId(e.target.value)} 
                        />
                        <p className="text-[10px] text-slate-600 mt-2 italic px-1">
                            * การเปลี่ยน Guild ID จะเปลี่ยนการแสดงผลข้อมูลทั้งหมดใน Dashboard เป็นของเซิร์ฟเวอร์นั้นๆ
                        </p>
                    </div>
                </div>
                {/* Gemini Model Selection */}
                <div className="glass-card p-8 rounded-3xl">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Gemini Intelligence
                    </h3>
                    <div className="space-y-4">
                        <select 
                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                            value={config.geminiModel} 
                            onChange={e => setConfig({...config, geminiModel: e.target.value})}
                        >
                            <option value="gemini-3-flash">Gemini 3 Flash (Ultra Fast)</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Balanced)</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Powerful)</option>
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Stable)</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
                            <option value="gemini-3.1-pro">Gemini 3.1 Pro (Advanced)</option>
                            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                        </select>
                        <p className="text-slate-500 text-[11px] px-1 italic">
                            * การเปลี่ยนโมเดลจะมีผลทันทีต่อการประมวลผลคำสั่ง Discord ผ่านแชท
                        </p>
                    </div>
                </div>

                {/* Auto Role Config */}
                <div className="glass-card p-8 rounded-3xl">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Server Automation
                    </h3>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1">Auto Role ID</label>
                        <input 
                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 focus:border-indigo-500/50 outline-none transition-all" 
                            placeholder="Role ID for new members..." 
                            value={config.autoRoleId} 
                            onChange={e => setConfig({...config, autoRoleId: e.target.value})} 
                        />
                    </div>
                </div>
            </div>

            <button 
                onClick={saveSettings} 
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-black text-white shadow-2xl shadow-indigo-500/40 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
                บันทึกการตั้งค่าทั้งหมด
            </button>
        </div>
    );
};

export default App;
