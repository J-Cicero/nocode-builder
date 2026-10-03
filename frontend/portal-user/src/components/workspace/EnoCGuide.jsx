import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, Trash2, Database, Layout, Rocket } from 'lucide-react';
import aiApi from '../../api/aiApi';
import { useParams } from 'react-router-dom';

export default function EnoCGuide() {
  const { projectId } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generationMode, setGenerationMode] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      loadHistory();
    }
    // Reset messages when project changes
    setMessages([]);
    setGenerationMode(null);
  }, [projectId]);

  useEffect(() => {
    if (projectId && isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 160);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const loadHistory = async () => {
    try {
      const { data } = await aiApi.history(projectId);
      if (data && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération de l'historique du chat:", err);
    }
  };

  const handleModeSelection = (mode) => {
    setGenerationMode(mode);
    let promptMsg = '';
    if (mode === 'app') promptMsg = "Génial ! Décrivez l'application que vous souhaitez créer de A à Z. (Ex: Un site e-commerce avec des produits, un panier et des commandes). Je vais m'occuper de la base de données ET de l'interface.";
    if (mode === 'schema') promptMsg = 'Parfait. Décrivez les données que vous souhaitez stocker. (Ex: Je veux gérer des employés, avec leur nom, email et département).';
    if (mode === 'interface') promptMsg = "Entendu. Quelle interface souhaitez-vous dessiner ? (Ex: Une page de connexion et un tableau de bord administrateur).";
    setMessages(prev => [...prev, { role: 'assistant', content: promptMsg, isSystem: true }]);
  };

  const handleGenerateAppClick = async (description) => {
    if (loading) return;
    setLoading(true);
    const loadingId = Date.now().toString();
    setMessages(prev => [...prev, { role: 'assistant', id: loadingId, content: '⏳ Création des tables...' }]);

    const loadingSteps = [
      '⏳ Création des tables...',
      "⏳ Création de l'interface...",
      '⏳ Création des automatisations...',
      '⏳ Finalisation...'
    ];
    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % loadingSteps.length;
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: loadingSteps[stepIndex] } : m));
    }, 4000);

    try {
      await aiApi.generateApp(projectId, { description });
      clearInterval(interval);
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: "✅ Application générée ! L'éditeur va s'actualiser." } : m));
      window.dispatchEvent(new CustomEvent('enoc:refresh-editor'));
    } catch (err) {
      clearInterval(interval);
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: '❌ Une erreur est survenue lors de la génération.' } : m));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    const isApproval = /^(oui|ok|c'est bon|confirme|génère|go|lance|vas-y|yes|parfait|vas y|allez)$/i.test(currentInput.trim());

    try {
      if (isApproval) {
        const lastLongMessage = messages.slice().reverse().find(m => m.role === 'user' && m.content.length > 15);
        const descriptionToUse = lastLongMessage ? lastLongMessage.content : currentInput;
        setMessages(prev => [...prev, { role: 'assistant', isGenerateButton: true, descriptionToUse }]);
        setGenerationMode(null);
        setLoading(false);
        return;
      }

      if (generationMode === 'app') {
        const { data } = await aiApi.chat(projectId, { content: 'Je veux créer cette application : ' + currentInput + '. Peux-tu me proposer un schéma de base de données et attendre ma confirmation avant de générer ?' });
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
        setGenerationMode(null);
      } else if (generationMode === 'schema') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Génération de la base de données en cours...' }]);
        await aiApi.generateSchema(projectId, { description: currentInput });
        setMessages(prev => [...prev, { role: 'assistant', content: "✅ Les tables ont été créées avec succès ! Vous pouvez les voir dans l'onglet Données." }]);
        window.dispatchEvent(new CustomEvent('enoc:refresh-editor'));
        setGenerationMode(null);
      } else if (generationMode === 'interface') {
        setMessages(prev => [...prev, { role: 'assistant', content: "Dessin de l'interface en cours..." }]);
        await aiApi.generateInterface(projectId, { description: currentInput });
        setMessages(prev => [...prev, { role: 'assistant', content: "✅ L'interface a été générée avec succès ! Allez voir le canevas." }]);
        window.dispatchEvent(new CustomEvent('enoc:refresh-editor'));
        setGenerationMode(null);
      } else {
        const { data } = await aiApi.chat(projectId, { content: userMessage.content });
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
        // Refresh the editor after any chat response (AI may have called tools like generate_schema/interface)
        window.dispatchEvent(new CustomEvent('enoc:refresh-editor'));
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai rencontré un problème pour effectuer cette action." }]);
      setGenerationMode(null);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (window.confirm('Voulez-vous vraiment recommencer l\'accompagnement ?')) {
      try {
        await aiApi.clearHistory(projectId);
        setMessages([]);
        setGenerationMode(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <>
      {/* ── Bouton flottant en HAUT à droite ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
          transition: 'all 0.3s',
          background: isOpen ? '#1A0E0A' : '#C4622D',
          transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'scale(1)',
          boxShadow: '0 4px 20px rgba(196,98,45,0.4)',
        }}
        title={isOpen ? 'Fermer EnoC' : 'Ouvrir EnoC'}
      >
        {isOpen
          ? <X color="white" size={22} />
          : <Sparkles color="white" size={22} fill="white" />
        }
        {!isOpen && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '14px',
            height: '14px',
            background: '#D4A017',
            borderRadius: '50%',
            border: '2px solid white',
            animation: 'bounce 1s infinite',
          }} />
        )}
      </button>

      {/* ── Panneau latéral ── */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: '440px',
        background: '#fff',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.15)',
        zIndex: 140,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.4s ease',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #FBF4E9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1A0E0A',
          color: 'white',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', background: '#C4622D', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} fill="currentColor" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Guide EnoC</div>
              <div style={{ fontSize: '10px', color: '#A08060', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Génération Assistée</div>
            </div>
          </div>
          <button
            onClick={clearHistory}
            style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', borderRadius: '8px' }}
            title="Recommencer"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'rgba(251,244,233,0.3)',
          }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: '24px' }}>
              <div style={{ width: '56px', height: '56px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#C4622D' }}>
                <Bot size={28} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '16px', color: '#1A0E0A', marginBottom: '8px' }}>Bienvenue sur EnoC !</h4>
              <p style={{ fontSize: '13px', color: '#7A5C44', marginBottom: '24px' }}>Que souhaitez-vous construire ?</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                {[
                  { mode: 'app', icon: <Rocket size={18} />, label: 'Application Complète', sub: 'Base de données + Interface (Recommandé)', bg: '#FFF0E8', color: '#C4622D' },
                  { mode: 'schema', icon: <Database size={18} />, label: 'Modèle de Données', sub: 'Générer uniquement les tables SQL', bg: '#EFF6FF', color: '#3B82F6' },
                  { mode: 'interface', icon: <Layout size={18} />, label: 'Interface Graphique', sub: 'Générer uniquement les pages et composants', bg: '#F0FDF4', color: '#22C55E' },
                ].map(({ mode, icon, label, sub, bg, color }) => (
                  <button
                    key={mode}
                    onClick={() => handleModeSelection(mode)}
                    style={{ padding: '12px 16px', background: 'white', border: '1px solid #E8D9C4', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#C4622D'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#E8D9C4'}
                  >
                    <div style={{ width: '36px', height: '36px', background: bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#1A0E0A' }}>{label}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: '13px',
                lineHeight: '1.6',
                background: msg.role === 'user' ? '#C4622D' : msg.isSystem ? '#EFF6FF' : 'white',
                color: msg.role === 'user' ? 'white' : msg.isSystem ? '#1E40AF' : '#1A0E0A',
                border: msg.role === 'user' ? 'none' : msg.isSystem ? '1px solid #BFDBFE' : '1px solid #E8D9C4',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.isGenerateButton ? (
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: '12px' }}>Super ! Je suis prêt à construire votre application.</p>
                    <button
                      onClick={() => handleGenerateAppClick(msg.descriptionToUse)}
                      style={{ width: '100%', padding: '10px 16px', background: '#C4622D', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Sparkles size={16} fill="currentColor" />
                      ⚡ Générer mon application
                    </button>
                  </div>
                ) : msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: 'white', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', border: '1px solid #E8D9C4', display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} style={{ width: '8px', height: '8px', background: '#A08060', borderRadius: '50%', animation: `bounce 1s ${delay}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Zone de saisie ── */}
        <div style={{
          padding: '12px 16px 16px',
          background: 'white',
          borderTop: '1px solid #F1F5F9',
          flexShrink: 0,
        }}>
          {generationMode && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#C4622D', background: '#FFF0E8', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                Mode : {generationMode}
              </span>
              <button onClick={() => setGenerationMode(null)} style={{ fontSize: '11px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Annuler
              </button>
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={generationMode ? 'Décrivez votre besoin en détail...' : 'Posez une question ou sélectionnez un mode...'}
              rows={1}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#1A0E0A',
                outline: 'none',
                resize: 'none',
                minHeight: '44px',
                maxHeight: '160px',
                overflowY: 'auto',
                lineHeight: '1.5',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = '#C4622D'; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: '44px',
                height: '44px',
                flexShrink: 0,
                background: loading || !input.trim() ? '#E2E8F0' : '#1A0E0A',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <Send size={16} />
            </button>
          </form>
          <p style={{ fontSize: '10px', color: '#CBD5E1', marginTop: '6px', textAlign: 'center' }}>
            Entrée pour envoyer • Maj+Entrée pour un saut de ligne
          </p>
        </div>
      </div>
    </>
  );
}
