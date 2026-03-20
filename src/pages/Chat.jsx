import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Send, Paperclip, FileText, Download, Trash2, Smile, X, Globe, User } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export default function Chat() {
    const { user } = useAuth();
    
    // Core States
    const [globalChat, setGlobalChat] = useState({ id: 'global', full_name: 'Grupo Geral (Todos)', unread_count: 0 });
    const [usersList, setUsersList] = useState([]);
    const [activeContact, setActiveContact] = useState(globalChat);
    const activeContactRef = useRef('global'); // Para uso dentro dos Callbacks de Realtime
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    // Loading States
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // UI Enhancements States
    const [isDragging, setIsDragging] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    // Refs
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
    const userAvatar = user?.user_metadata?.avatar_url || '';

    // ==========================================
    // EFFECT: FETCH ALL USERS E REALTIME
    // ==========================================
    useEffect(() => {
        fetchContacts();

        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        // Realtime Escuta TODA a tabela mensagens
        const msgChannel = supabase.channel('public:mensagens:all')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, payload => {
                const newMsg = payload.new;
                const isGlobal = newMsg.receiver_id === null;
                const activeId = activeContactRef.current;
                
                const isForActiveContact = isGlobal 
                    ? activeId === 'global'
                    : (newMsg.user_id === activeId || newMsg.receiver_id === activeId);

                // Se a mensagem for para a conversa aberta = Adiciona no chat
                if (isForActiveContact) {
                    setMessages(prev => {
                        if(prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    scrollToBottom();
                    markChatAsRead(activeId); // Já lemos
                } else if (newMsg.user_id !== user.id) {
                    // Se NÃO estivermos na conversa e NÃO fomos nós que mandamos: incrementa unread_count!
                    const senderId = isGlobal ? 'global' : newMsg.user_id;
                    if (senderId === 'global') {
                        setGlobalChat(prev => ({ ...prev, unread_count: parseInt(prev.unread_count || 0) + 1 }));
                    } else {
                        setUsersList(prev => prev.map(u => u.id === senderId ? { ...u, unread_count: parseInt(u.unread_count || 0) + 1 } : u));
                    }
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'mensagens' }, payload => {
                setMessages(prev => prev.filter(m => m.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(msgChannel);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Quando o contato ativo muda, refaz fetch, arquiva lido e atualiza ref
    useEffect(() => {
        activeContactRef.current = activeContact.id;
        fetchMessages(activeContact.id);
        markChatAsRead(activeContact.id);
    }, [activeContact]);

    // ==========================================
    // API CALLS & REGRAS
    // ==========================================
    const markChatAsRead = async (contactId) => {
        try {
            await supabase.from('chat_reads').upsert({ user_id: user.id, contact_id: contactId, last_read_at: new Date().toISOString() });
            
            // Zera a bolinha na RAM local
            if (contactId === 'global') {
                setGlobalChat(prev => ({ ...prev, unread_count: 0 }));
            } else {
                setUsersList(prev => prev.map(u => u.id === contactId ? { ...u, unread_count: 0 } : u));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchContacts = async () => {
        setLoadingContacts(true);
        try {
            const { data, error } = await supabase.rpc('get_chat_sidebar', { p_user: user.id });
            if (error) throw error;
            
            // Extrai o Global do array e os demais usuários
            const globalObj = data?.find(u => u.id === 'global');
            if (globalObj) setGlobalChat({ ...globalObj, full_name: 'Grupo Geral (Todos)' });
            
            const outros = data ? data.filter(u => u.id !== 'global') : [];
            setUsersList(outros);
        } catch (error) {
            console.error('Erro ao buscar contatos:', error);
        } finally {
            setLoadingContacts(false);
        }
    };

    const fetchMessages = async (contactId) => {
        setLoadingMessages(true);
        try {
            let query = supabase.from('mensagens').select('*');

            if (contactId === 'global') {
                // Grupo Global = receiver_id é nulo
                query = query.is('receiver_id', null);
            } else {
                // DM = (enviou para min, OU eu enviei para ele)
                query = query.or(`and(user_id.eq.${user.id},receiver_id.eq.${contactId}),and(user_id.eq.${contactId},receiver_id.eq.${user.id})`);
            }

            const { data, error } = await query.order('created_at', { ascending: true });
            
            if (error) throw error;
            setMessages(data || []);
            scrollToBottom();
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !uploading)) return;

        try {
            const msg = {
                user_id: user.id,
                receiver_id: activeContact.id === 'global' ? null : activeContact.id,
                user_name: userName,
                user_avatar: userAvatar,
                content: newMessage.trim(),
            };

            setNewMessage('');
            setShowEmojiPicker(false);
            const { error } = await supabase.from('mensagens').insert([msg]);
            if (error) throw error;
        } catch (err) {
            console.error('Erro ao enviar mensagem:', err);
            alert('Não foi possível enviar a mensagem.');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            // Upload
            const { error: uploadError } = await supabase.storage.from('chat_files').upload(filePath, file);
            if (uploadError) throw uploadError;

            // URL Pública
            const { data: publicUrlData } = supabase.storage.from('chat_files').getPublicUrl(filePath);
            const fileUrl = publicUrlData.publicUrl;

            // Insere a mensagem
            const msg = {
                user_id: user.id,
                receiver_id: activeContact.id === 'global' ? null : activeContact.id,
                user_name: userName,
                user_avatar: userAvatar,
                content: '',
                file_url: fileUrl,
                file_name: file.name,
                file_type: file.type || fileExt
            };

            const { error: msgError } = await supabase.from('mensagens').insert([msg]);
            if (msgError) throw msgError;

        } catch (err) {
            console.error('Erro no upload do arquivo:', err);
            alert('Falha no upload: ' + err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id) => {
        try {
            const { error } = await supabase.from('mensagens').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Erro ao excluir:', err);
        }
    };

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    };
    
    const formatTime = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getDateDivider = (isoString) => {
        const d = new Date(isoString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Hoje';
        if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
        return d.toLocaleDateString('pt-BR');
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) await handleFileUpload({ target: { files: [file] }, dataTransfer: e.dataTransfer });
    };

    // Filtra as mensagens na visualização apenas (já que o canal realtime traz tudo e não conseguimos re-assinar pra query complexa facil)
    const displayMessages = messages.filter(msg => {
        if (activeContact.id === 'global') return msg.receiver_id === null;
        return msg.receiver_id === activeContact.id || (msg.user_id === activeContact.id && msg.receiver_id === user.id);
    });

    // ==========================================
    // RENDERING
    // ==========================================
    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', height: '100%', display: 'flex', gap: '24px', paddingTop: '1rem', paddingBottom: '2rem' }} className="animate-in fade-in duration-500">
            
            {/* Modal de Preview de Imagem (Global) */}
            {previewImage && (
                <div onClick={() => setPreviewImage(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <button onClick={() => setPreviewImage(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', padding: '12px', cursor: 'pointer' }}><X size={24} /></button>
                    <img src={previewImage} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} alt="Preview" />
                </div>
            )}

            {/* ======================= COLUNA ESQUERDA (Lista de Contatos do Sistema) ======================= */}
            <div style={{ width: '300px', backgroundColor: '#13171e', borderRadius: '16px', border: '1px solid #232830', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #232830' }}>
                    <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Comunicações</h2>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {/* Botão Fixo Grupo Geral */}
                    <div 
                        onClick={() => setActiveContact(globalChat)}
                        style={{ 
                            padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '16px',
                            backgroundColor: activeContact?.id === 'global' ? 'rgba(255,255,255,0.05)' : 'transparent',
                            display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s', border: '1px solid rgba(14, 165, 233, 0.2)'
                        }}
                        className="hover:bg-sky-500/10"
                    >
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d1117', flexShrink: 0 }}>
                            <Globe size={20} />
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <h4 style={{ color: 'white', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{globalChat.full_name}</h4>
                            <p style={{ color: '#8b949e', margin: 0, fontSize: '0.75rem', marginTop: '2px' }}>Toda a Equipe</p>
                        </div>
                        {globalChat.unread_count > 0 && (
                            <div style={{ backgroundColor: '#10b981', color: 'white', fontSize: '0.75rem', fontWeight: 800, minWidth: '22px', height: '22px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
                                {globalChat.unread_count}
                            </div>
                        )}
                    </div>

                    <h5 style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '8px' }}>Contato Direto (DMs)</h5>

                    {loadingContacts ? (
                        <p style={{ color: '#8b949e', textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>Carregando membros...</p>
                    ) : usersList.length === 0 ? (
                        <p style={{ color: '#8b949e', textAlign: 'center', marginTop: '24px', fontSize: '0.85rem' }}>Nenhum outro membro cadastrado.</p>
                    ) : (
                        usersList.map(contact => (
                            <div 
                                key={contact.id} 
                                onClick={() => setActiveContact(contact)}
                                style={{ 
                                    padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px',
                                    backgroundColor: activeContact?.id === contact.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                    display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s'
                                }}
                                className="hover:bg-slate-800/50"
                            >
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', flexShrink: 0, overflow: 'hidden' }}>
                                    {contact.avatar_url ? (
                                        <img src={contact.avatar_url} alt={contact.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={18} />
                                    )}
                                </div>
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <h4 style={{ color: 'white', margin: 0, fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                        {contact.full_name}
                                    </h4>
                                </div>
                                {contact.unread_count > 0 && (
                                    <div style={{ backgroundColor: '#10b981', color: 'white', fontSize: '0.75rem', fontWeight: 800, minWidth: '22px', height: '22px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
                                        {contact.unread_count}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ======================= COLUNA DIREITA (Conversa Ativa) ======================= */}
            <div style={{ flex: 1, backgroundColor: '#13171e', borderRadius: '16px', border: '1px solid #232830', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                
                {/* Chat Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #232830', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: activeContact.id === 'global' ? '#0ea5e9' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeContact.id === 'global' ? '#0d1117' : '#8b949e', overflow: 'hidden' }}>
                        {activeContact.id === 'global' ? <Globe size={20} /> : (activeContact.avatar_url ? <img src={activeContact.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} />)}
                    </div>
                    <div>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                            {activeContact.full_name}
                        </h3>
                        <span style={{ color: '#8b949e', fontSize: '0.8rem' }}>{activeContact.id === 'global' ? 'Visível para todos os usuários' : 'Mensagem Direta Criptografada'}</span>
                    </div>
                </div>

                {/* Drag Area Overlay */}
                <div 
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isDragging && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(14, 165, 233, 0.2)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #0ea5e9' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#0ea5e9' }}>
                                <div style={{ backgroundColor: 'rgba(14, 165, 233, 0.2)', padding: '24px', borderRadius: '50%' }}>
                                    <Download size={48} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Solte para enviar arquivo</h2>
                            </div>
                        </div>
                    )}

                    {/* Messages ListView */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {loadingMessages ? (
                            <div style={{ color: '#8b949e', textAlign: 'center', margin: 'auto' }}>Carregando histórico...</div>
                        ) : displayMessages.length === 0 ? (
                            <div style={{ color: '#8b949e', textAlign: 'center', margin: 'auto' }}>Comece a conversar aqui!</div>
                        ) : (
                            displayMessages.map((msg, index) => {
                                const isMine = msg.user_id === user?.id;
                                const isConsecutive = index > 0 && displayMessages[index - 1].user_id === msg.user_id;
                                
                                const currentDateDivider = getDateDivider(msg.created_at);
                                const prevDateDivider = index > 0 ? getDateDivider(displayMessages[index - 1].created_at) : null;
                                const showDateDivider = currentDateDivider !== prevDateDivider;

                                return (
                                    <React.Fragment key={msg.id}>
                                        {showDateDivider && (
                                            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 8px 0' }}>
                                                <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', color: '#8b949e', fontWeight: 600 }}>{currentDateDivider}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: '12px', alignItems: 'flex-end', marginTop: (isConsecutive && !showDateDivider) ? '4px' : '16px' }}>
                                            {/* Avatar (Para mensagens da outra pessoa) */}
                                            {!isMine && (
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#1e293b', flexShrink: 0, opacity: (isConsecutive && !showDateDivider) ? 0 : 1 }}>
                                                    {msg.user_avatar ? (
                                                        <img src={msg.user_avatar} alt={msg.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e', fontWeight: 'bold', fontSize: '14px' }}>{msg.user_name?.charAt(0).toUpperCase()}</div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Bubble Container */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                                                {/* Exibe o nome se não for minha mensagem e se for chat em grupo (global) ou não consecutivo */}
                                                {(!isConsecutive || showDateDivider) && !isMine && (
                                                    <span style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: '4px', marginLeft: '4px' }}>{msg.user_name}</span>
                                                )}
                                                
                                                <div className="group relative" style={{ 
                                                    backgroundColor: isMine ? '#0ea5e9' : '#1e293b', color: 'white', padding: '12px 16px', paddingRight: '40px', paddingBottom: '20px', borderRadius: '16px', borderBottomRightRadius: isMine ? '4px' : '16px', borderBottomLeftRadius: !isMine ? '4px' : '16px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', wordBreak: 'break-word', position: 'relative', minWidth: '100px'
                                                }}>
                                                    {/* Delete Button (Fixed & Responsive Inside Bubble) */}
                                                    {isMine && (
                                                        <button onClick={() => handleDelete(msg.id)} title="Excluir Mensagem" className="opacity-0 group-hover:opacity-100 transition-opacity absolute" style={{ right: '6px', top: '6px', background: 'rgba(0,0,0,0.15)', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                                                    )}

                                                    {/* Arquivos Anexos */}
                                                    {msg.file_url ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {msg.file_type?.startsWith('image/') ? (
                                                                <div style={{ cursor: 'zoom-in' }} onClick={() => setPreviewImage(msg.file_url)}>
                                                                    <img src={msg.file_url} alt="anexo" style={{ borderRadius: '8px', maxWidth: '100%', maxHeight: '250px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', display: 'block' }} />
                                                                </div>
                                                            ) : (
                                                                <a href={msg.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}><FileText size={24} /></div>
                                                                    <div style={{ overflow: 'hidden' }}>
                                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{msg.file_name}</p>
                                                                        <p style={{ margin: 0, fontSize: '0.75rem', color: isMine ? '#bae6fd' : '#94a3b8' }}>Clique para baixar</p>
                                                                    </div>
                                                                    <Download size={18} style={{ marginLeft: 'auto', opacity: 0.7 }} />
                                                                </a>
                                                            )}
                                                            {msg.content && <p style={{ margin: 0 }}>{msg.content}</p>}
                                                        </div>
                                                    ) : (
                                                        <p style={{ margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
                                                    )}

                                                    <div style={{ position: 'absolute', bottom: '6px', right: '12px', fontSize: '0.65rem', color: isMine ? 'rgba(255,255,255,0.7)' : 'rgba(139,148,158,0.8)', fontWeight: 600 }}>{formatTime(msg.created_at)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '16px 24px', backgroundColor: '#181d26', borderTop: '1px solid #232830', position: 'relative' }}>
                        {showEmojiPicker && (
                            <div ref={emojiPickerRef} style={{ position: 'absolute', bottom: '80px', left: '24px', zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', borderRadius: '8px' }}>
                                <EmojiPicker theme="dark" onEmojiClick={(e) => setNewMessage(p => p + e.emoji)} searchDisabled={true} skinTonesDisabled={true} />
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} id="chat-file-upload" />
                                <label htmlFor="chat-file-upload" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: 'transparent', border: '1px solid #30363d', borderRadius: '12px', color: '#8b949e', cursor: 'pointer', opacity: uploading ? 0.5 : 1 }} title="Anexar Arquivo ou Imagem">
                                    {uploading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <Paperclip size={20} />}
                                </label>
                            </div>

                            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                <input type="text" placeholder={uploading ? "Enviando arquivo..." : "Digite uma mensagem..."} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={uploading} style={{ width: '100%', height: '48px', padding: '0 48px 0 16px', borderRadius: '12px', backgroundColor: '#0d1117', border: '1px solid #30363d', color: 'white', outline: 'none', fontSize: '0.95rem' }} />
                                
                                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
                                    <Smile size={20} />
                                </button>
                            </div>

                            <button type="submit" disabled={uploading || (!newMessage.trim() && !uploading)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: '#0ea5e9', border: 'none', borderRadius: '12px', color: 'white', cursor: (!newMessage.trim() && !uploading) ? 'not-allowed' : 'pointer', opacity: (!newMessage.trim() && !uploading) ? 0.5 : 1 }}>
                                <Send size={20} style={{ marginLeft: '2px' }} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
