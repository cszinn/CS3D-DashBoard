import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Cropper from 'react-easy-crop';
import {
    User,
    MapPin,
    CreditCard,
    Lock,
    Save,
    Rocket,
    Camera,
    X,
    UploadCloud,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

const inputStyle = {
    height: '48px',
    padding: '12px 14px',
    backgroundColor: '#21262d',
    border: '1px solid #30363d',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s ease',
};

const InputGroup = ({ label, children, helper, disabled }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: disabled ? 0.7 : 1 }}>
        <label style={{ color: '#8b949e', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
        </label>
        {children}
        {helper && <span style={{ fontSize: '0.8rem', color: '#8b949e', fontStyle: 'italic', marginTop: '4px' }}>{helper}</span>}
    </div>
);

// Pega apenas o arquivo cortado usando Canvas
const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg');
    });
};

export default function Settings() {
    const { user } = useAuth();
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [stateStr, setStateStr] = useState('');
    const [zip, setZip] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Modals
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    
    // Crop
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user?.user_metadata) {
            setFirstName(user.user_metadata.first_name || '');
            setLastName(user.user_metadata.last_name || '');
            setPhone(user.user_metadata.telefone || '');
            setStreet(user.user_metadata.rua_bairro || '');
            setCity(user.user_metadata.cidade || '');
            setStateStr(user.user_metadata.estado || '');
            setZip(user.user_metadata.cep || '');
            setAvatarUrl(user.user_metadata.avatar_url || '');
        }
    }, [user]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    telefone: phone,
                    rua_bairro: street,
                    cidade: city,
                    estado: stateStr,
                    cep: zip
                }
            });
            if (error) throw error;
            setMsg({ type: 'success', text: 'Dados atualizados com sucesso!' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Erro ao atualizar dados: ' + err.message });
        } finally {
            setLoading(false);
            setTimeout(() => setMsg({ type: '', text: '' }), 4000);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
            setShowPasswordModal(false);
            setNewPassword('');
        } catch (err) {
            setMsg({ type: 'error', text: 'Erro ao alterar senha: ' + err.message });
        } finally {
            setLoading(false);
            setTimeout(() => setMsg({ type: '', text: '' }), 4000);
        }
    };

    const onFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            let imageDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.addEventListener('load', () => resolve(reader.result), false);
                reader.readAsDataURL(file);
            });
            setImageSrc(imageDataUrl);
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const uploadAvatar = async () => {
        try {
            setLoading(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            
            const fileExt = 'jpg';
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, croppedImageBlob, { contentType: 'image/jpeg', upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;
            
            setAvatarUrl(publicUrl);
            setImageSrc(null);
            setMsg({ type: 'success', text: 'Foto de perfil atualizada!' });
            
        } catch (error) {
            setMsg({ type: 'error', text: 'Erro no upload. ' + error.message });
        } finally {
            setLoading(false);
            setTimeout(() => setMsg({ type: '', text: '' }), 4000);
        }
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', paddingBottom: '4rem', paddingTop: '1rem', fontFamily: 'inherit' }}>
            
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '4px' }}>
                    Configurações da Conta
                </h1>
                <p style={{ color: '#8b949e', fontSize: '0.95rem', fontWeight: 500 }}>
                    Gerencie seus dados pessoais e sua assinatura
                </p>
            </div>

            {msg.text && (
                <div style={{ marginBottom: '2rem', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: msg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: msg.type === 'success' ? '#34d399' : '#f87171' }}>
                    {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span style={{ fontWeight: '600' }}>{msg.text}</span>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                
                {/* Main Left Card */}
                <div style={{ flex: '1 1 600px', backgroundColor: '#13171e', border: '1px solid #232830', borderRadius: '12px', overflow: 'hidden' }}>
                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column' }}>
                        
                        {/* Dados Pessoais Section */}
                        <div style={{ padding: '32px 32px 0 32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <User color="#00e0ff" size={22} />
                                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '800' }}>Dados Pessoais</h2>
                            </div>
                            <p style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '24px' }}>Mantenha suas informações de contato atualizadas</p>

                            {/* Avatar Picker */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #30363d', cursor: 'pointer', position: 'relative', backgroundColor: '#21262d' }}
                                >
                                    <img 
                                        src={avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                                        alt="Avatar" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', ':hover': { opacity: 1 } }}>
                                        <Camera color="white" size={24} />
                                    </div>
                                    <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={onFileChange} />
                                </div>
                                <div>
                                    <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>Foto de Perfil</h3>
                                    <p style={{ color: '#8b949e', fontSize: '0.85rem' }}>Clique na imagem para enviar uma nova foto.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                <InputGroup label="NOME">
                                    <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="ITI" />
                                </InputGroup>
                                <InputGroup label="SOBRENOME">
                                    <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Tech" />
                                </InputGroup>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                                <InputGroup label="EMAIL" helper="O email não pode ser alterado." disabled={true}>
                                    <input style={{ ...inputStyle, backgroundColor: '#1a1e24' }} readOnly value={user?.email || ''} />
                                </InputGroup>
                                <InputGroup label="TELEFONE / WHATSAPP">
                                    <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                                </InputGroup>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: 'calc(100% - 64px)', height: '1px', backgroundColor: '#232830', margin: '0 32px' }}></div>

                        {/* Endereço Section */}
                        <div style={{ padding: '32px 32px 32px 32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                <MapPin color="#00e0ff" size={22} />
                                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '800' }}>Endereço</h2>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <InputGroup label="RUA, NÚMERO E BAIRRO">
                                    <input style={inputStyle} value={street} onChange={e => setStreet(e.target.value)} placeholder="Ex: Rua das Flores, 123 - Centro" />
                                </InputGroup>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
                                <div style={{ flex: '2 1 150px' }}>
                                    <InputGroup label="CIDADE">
                                        <input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade" />
                                    </InputGroup>
                                </div>
                                <div style={{ flex: '1 1 80px' }}>
                                    <InputGroup label="ESTADO">
                                        <input style={inputStyle} value={stateStr} onChange={e => setStateStr(e.target.value)} placeholder="UF" />
                                    </InputGroup>
                                </div>
                                <div style={{ flex: '1 1 120px' }}>
                                    <InputGroup label="CEP">
                                        <input style={inputStyle} value={zip} onChange={e => setZip(e.target.value)} placeholder="00000-000" />
                                    </InputGroup>
                                </div>
                            </div>

                            {/* Save Button is inside the card padding following the image logic */}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    height: '54px',
                                    borderRadius: '10px',
                                    fontWeight: '800',
                                    fontSize: '1rem',
                                    backgroundColor: '#00e0ff',
                                    color: '#060b14',
                                    border: 'none',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 0 15px rgba(0, 224, 255, 0.25)',
                                    opacity: loading ? 0.8 : 1,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Save size={20} />
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Side Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: '1 1 320px', maxWidth: '400px' }}>
                    
                    {/* Assinatura Card */}
                    <div style={{ backgroundColor: '#13171e', border: '1px solid #232830', borderRadius: '12px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                            <CreditCard color="#00e0ff" size={22} />
                            <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '800' }}>Sua Assinatura</h2>
                        </div>

                        {/* Free Plan Badge Container */}
                        <div style={{ border: '1px solid #232830', backgroundColor: '#181c22', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ color: '#00e0ff', fontSize: '0.9rem', fontWeight: '700', border: '1px solid rgba(0,224,255,0.3)', padding: '6px 20px', borderRadius: '20px', backgroundColor: 'rgba(0,224,255,0.05)' }}>
                                Plano Free
                            </span>
                        </div>

                        {/* Upgrade Box */}
                        <div style={{ backgroundColor: '#0e1726', border: '1px solid #1e3a8a', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
                            <h4 style={{ color: '#60a5fa', fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px' }}>Deseja mais recursos?</h4>
                            <p style={{ color: '#3b82f6', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                Ao mudar de plano, você desbloqueia imediatamente novas ferramentas como Vaquinha STL, Controle Financeiro e muito mais.
                            </p>
                        </div>

                        {/* Upgrade Btn */}
                        <button
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                height: '52px',
                                padding: '0 20px',
                                borderRadius: '10px',
                                backgroundColor: '#181c22',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '0.95rem',
                                border: '1px solid #232830',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Rocket color="#00e0ff" size={18} /> Mudar de Plano</span>
                            <span style={{ color: '#8b949e', fontSize: '1.2rem' }}>→</span>
                        </button>
                    </div>

                    {/* Segurança Card */}
                    <div style={{ backgroundColor: '#13171e', border: '1px solid #232830', borderRadius: '12px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <Lock color="#00e0ff" size={22} />
                            <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '800' }}>Segurança</h2>
                        </div>
                        
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            style={{ color: '#00e0ff', fontSize: '0.95rem', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                            Alterar minha senha
                        </button>
                    </div>

                </div>
            </div>

            {/* MODAL MUDAR SENHA */}
            {showPasswordModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
                    <form onSubmit={handlePasswordChange} style={{ backgroundColor: '#13171e', border: '1px solid #30363d', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ color: 'white', fontWeight: '800', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock color="#00e0ff" size={20} /> Nova Senha</h2>
                            <button type="button" onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        
                        <InputGroup label="Digite sua nova senha">
                            <input
                                type="password"
                                required
                                minLength="6"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={inputStyle}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </InputGroup>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                height: '52px',
                                borderRadius: '10px',
                                fontWeight: '800',
                                backgroundColor: '#00e0ff',
                                color: '#060b14',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? 'Atualizando...' : 'Atualizar Senha'}
                        </button>
                    </form>
                </div>
            )}

            {/* MODAL CROP IMAGEM */}
            {imageSrc && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)', padding: '16px' }}>
                    <div style={{ backgroundColor: '#13171e', width: '100%', maxWidth: '600px', border: '1px solid #30363d', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px', maxHeight: '80vh' }}>
                        
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0d1117' }}>
                            <h3 style={{ color: 'white', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><UploadCloud size={20} color="#00e0ff" /> Ajustar Foto de Perfil</h3>
                            <button onClick={() => setImageSrc(null)} style={{ color: '#8b949e', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ position: 'relative', flex: 1, width: '100%', minHeight: '300px' }}>
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div style={{ padding: '24px', backgroundColor: '#0d1117', borderTop: '1px solid #30363d', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '800', width: '30px', textAlign: 'center' }}>-</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onChange={(e) => setZoom(e.target.value)}
                                    style={{ width: '100%', height: '4px', backgroundColor: '#30363d', borderRadius: '4px', cursor: 'pointer' }}
                                />
                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '800', width: '30px', textAlign: 'center' }}>+</span>
                            </div>
                            
                            <button
                                onClick={uploadAvatar}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    height: '54px',
                                    borderRadius: '10px',
                                    fontWeight: '800',
                                    fontSize: '1.1rem',
                                    backgroundColor: '#00e0ff',
                                    color: '#060b14',
                                    border: 'none',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    transition: 'all 0.2s',
                                }}
                            >
                                {loading ? 'Enviando...' : 'Aplicar Foto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
