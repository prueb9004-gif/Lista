import React, { useState, useEffect } from 'react';
import {
  Github,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  X,
  Share2,
  Copy,
  Check,
  Send,
  Loader2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { copyToClipboard } from '../utils/exporters';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdown: string;
  ficha?: string;
  programName?: string;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  markdown,
  ficha,
  programName,
}) => {
  const [githubUser, setGithubUser] = useState<any>(null);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [isExportingGist, setIsExportingGist] = useState<boolean>(false);
  const [gistUrl, setGistUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Exact URLs for OAuth configuration
  const devRedirectUri = 'https://ais-dev-3plskpcishlnbxruzbgemx-878801217580.us-east1.run.app/auth/callback';
  const sharedRedirectUri = 'https://ais-pre-3plskpcishlnbxruzbgemx-878801217580.us-east1.run.app/auth/callback';

  // Listen for OAuth postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'github') {
        if (event.data.user) {
          setGithubUser(event.data.user);
        }
        if (event.data.token) {
          setGithubToken(event.data.token);
        }
        if (event.data.error) {
          setErrorMsg(event.data.error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!isOpen) return null;

  const handleConnectGitHub = async () => {
    setErrorMsg(null);
    try {
      const response = await fetch('/api/auth/github/url');
      const data = await response.json();

      if (data.configured && data.url) {
        window.open(data.url, 'github_oauth_popup', 'width=600,height=700');
      } else {
        // If OAuth credentials are not configured in environment, open GitHub directly in a new tab
        window.open('https://github.com/login', '_blank', 'noopener,noreferrer');
        setErrorMsg(
          'GitHub abierto en pestaña externa. Si deseas vincular la cuenta mediante OAuth, añade GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET en la configuración.'
        );
      }
    } catch (err: any) {
      window.open('https://github.com/login', '_blank', 'noopener,noreferrer');
    }
  };

  const handleExportGist = async () => {
    if (!githubToken) {
      setErrorMsg('Primero vincula tu cuenta de GitHub.');
      return;
    }

    setIsExportingGist(true);
    setErrorMsg(null);
    setGistUrl(null);

    try {
      const res = await fetch('/api/github/export-gist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubToken,
          markdown,
          ficha: ficha || '2678901',
          programName: programName || 'ADSO',
        }),
      });

      const data = await res.json();
      if (data.success && data.gistUrl) {
        setGistUrl(data.gistUrl);
      } else {
        throw new Error(data.error || 'No se pudo exportar a GitHub.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al exportar Gist.');
    } finally {
      setIsExportingGist(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#00324D] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#39A900]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Acceso & Vinculación con GitHub</h3>
              <p className="text-[11px] text-slate-300">Servicio Nacional de Aprendizaje SENA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-700">
          {/* Explanation Alert for Iframe block */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block font-bold mb-0.5">
                ¿Por qué no carga GitHub dentro de esta vista previa?
              </strong>
              GitHub cuenta con una política de seguridad estricta (<code>X-Frame-Options: DENY</code>)
              que impide abrir su sitio web dentro de marcos o iframes embebidos.
              <strong> Debe abrirse siempre en una pestaña o ventana independiente del navegador.</strong>
            </div>
          </div>

          {/* Action 1: Direct Open in New Tab (Guaranteed to work) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <Github className="w-4 h-4 text-slate-800" />
                Abrir GitHub en Pestaña Externa
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ingresa directamente a tu cuenta, repositorios y proyectos en github.com.
              </p>
            </div>
            <a
              href="https://github.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition shrink-0"
            >
              <span>Ir a GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Action 2: OAuth Connection status */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#00324D] uppercase tracking-wider">
                Conectar Cuenta para Sincronizar Asistencia
              </span>
              {githubUser && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-[#39A900]" />
                  Conectado
                </span>
              )}
            </div>

            {githubUser ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {githubUser.avatar_url && (
                    <img
                      src={githubUser.avatar_url}
                      alt={githubUser.login}
                      className="w-8 h-8 rounded-full border border-emerald-300"
                    />
                  )}
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      {githubUser.name || githubUser.login}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">@{githubUser.login}</div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isExportingGist}
                  onClick={handleExportGist}
                  className="px-3 py-1.5 bg-[#39A900] hover:bg-[#2e8800] text-white text-xs font-bold rounded shadow-xs flex items-center gap-1.5 transition"
                >
                  {isExportingGist ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span>Exportar Asistencia a Gist</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <p className="text-xs text-slate-600">
                  Permite exportar este registro de asistencia oficial directamente a tus Gists o repositorios de GitHub.
                </p>
                <button
                  type="button"
                  onClick={handleConnectGitHub}
                  className="w-full sm:w-auto px-4 py-2 bg-[#00324D] hover:bg-[#002233] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition shrink-0"
                >
                  <Github className="w-3.5 h-3.5 text-[#39A900]" />
                  <span>Conectar GitHub</span>
                </button>
              </div>
            )}

            {gistUrl && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                <span>¡Gist creado con éxito!</span>
                <a
                  href={gistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-emerald-800 flex items-center gap-1"
                >
                  <span>Ver en GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {errorMsg && (
              <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Setup Guide for OAuth App */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#39A900]" />
              <span>Configuración OAuth de GitHub para Desarrolladores SENA:</span>
            </div>
            <p>
              Si creas una OAuth App en GitHub (<code>github.com/settings/developers</code>), registra esta URL de callback:
            </p>
            <div className="bg-slate-900 text-emerald-400 p-2 rounded font-mono text-[10px] break-all flex items-center justify-between gap-2">
              <span>{devRedirectUri}</span>
              <button
                type="button"
                onClick={() => {
                  copyToClipboard(devRedirectUri);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="text-slate-300 hover:text-white p-1"
                title="Copiar URL de callback"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
