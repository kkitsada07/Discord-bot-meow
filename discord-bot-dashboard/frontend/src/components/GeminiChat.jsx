import { useState, useEffect, useRef } from 'react';

const GeminiChat = ({ guildId, apiBase }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'สวัสดีครับ! ผมคือผู้ช่วย Gemini AI คุณสามารถสั่งให้ผมจัดการเซิร์ฟเวอร์ เช่น สร้างห้อง ลบห้อง หรือจัดการสมาชิกได้เลยครับ' }
    ]);
    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage({
                    base64: reader.result.split(',')[1],
                    preview: reader.result,
                    mimeType: file.type
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedImage) || loading) return;

        const userMessage = { 
            role: 'user', 
            content: input,
            image: selectedImage ? { preview: selectedImage.preview } : null
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        const currentImage = selectedImage;
        
        setInput('');
        setSelectedImage(null);
        setLoading(true);

        try {
            const res = await fetch(`${apiBase}/chat/${guildId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: [...messages, userMessage],
                    imageData: currentImage ? { 
                        data: currentImage.base64, 
                        mimeType: currentImage.mimeType 
                    } : null
                })
            });
            const data = await res.json();
            
            if (data.reply) {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: data.reply,
                    actions: data.actions || []
                }]);
            } else if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `เกิดข้อผิดพลาด: ${data.error}` }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'ขออภัย ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl z-50 transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
                    isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-tr from-indigo-600 to-purple-600'
                }`}
            >
                {isOpen ? (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                )}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                    </span>
                )}
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-24 right-6 w-[400px] h-[600px] glass-panel rounded-[2rem] shadow-2xl overflow-hidden z-50 transition-all duration-500 transform origin-bottom-right ${
                isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'
            } flex flex-col text-slate-200`}>
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Gemini AI</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Systems Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/20">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-slate-900 border border-white/5 text-slate-200 rounded-tl-none'
                            }`}>
                                {msg.image && (
                                    <div className="mb-3 rounded-xl overflow-hidden border border-white/10">
                                        <img src={msg.image.preview} alt="User upload" className="max-w-full h-auto object-cover" />
                                    </div>
                                )}
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                                        {msg.actions.map((action, ai) => (
                                            <div key={ai} className="flex items-center gap-3 bg-black/20 p-2.5 rounded-xl text-[10px] border border-white/5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${action.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="font-mono text-indigo-400 font-bold">{action.name}</span>
                                                <span className="text-slate-500 truncate italic">
                                                    {Object.values(action.args).filter(v => typeof v !== 'boolean').join(', ')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></span>
                                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-slate-900/50 backdrop-blur-xl border-t border-white/5 space-y-4">
                    {selectedImage && (
                        <div className="relative inline-block group/preview animate-fade-in">
                            <img src={selectedImage.preview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border-2 border-indigo-500/50" />
                            <button 
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover/preview:opacity-100 transition-opacity"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className="relative flex items-center gap-2 group/input">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 bg-slate-950/50 border border-white/5 rounded-2xl text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>

                        <div className="relative flex-1">
                            <input
                                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 pr-14 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
                                placeholder="Ask AI to analyze or manage..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                            <button 
                                onClick={handleSend}
                                disabled={loading || (!input.trim() && !selectedImage)}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
                                    (input.trim() || selectedImage) && !loading 
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                                    : 'bg-slate-800 text-slate-600'
                                }`}
                            >
                                <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GeminiChat;
