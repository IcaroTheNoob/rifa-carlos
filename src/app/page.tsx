"use client";

import { useState, useEffect } from "react";

interface NumeroData { id: number; numero: number; status: string }
interface RifaData { id: number; titulo: string; descricao: string; valor_numero: number; total_numeros: number; numeros_restantes: number }

function Confetti() {
  const colors = ["#10b981", "#f59e0b", "#34d399", "#fbbf24", "#059669", "#ef4444"];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: "0",
            backgroundColor: colors[i % colors.length],
            animation: `confetti 1.5s ease-out ${i * 0.05}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function RifaPage() {
  const [rifa, setRifa] = useState<RifaData | null>(null);
  const [numeros, setNumeros] = useState<NumeroData[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState<{ whatsappLink: string; valorTotal: number; numeros: number[] } | null>(null);
  const [info, setInfo] = useState("");

  useEffect(() => {
    fetch("/api/rifa").then(r => r.json()).then(data => {
      setRifa(data.rifa);
      setNumeros(data.numeros);
    }).catch(() => setErro("Erro ao carregar rifa"));
  }, []);

  function toggleNumero(num: number) {
    setSelecionados(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
    setErro("");
  }

  async function reservar() {
    if (!nome.trim()) { setErro("Digite seu nome"); return; }
    if (!telefone.trim()) { setErro("Digite seu WhatsApp"); return; }
    if (selecionados.length === 0) { setErro("Selecione pelo menos um número"); return; }

    setLoading(true); setErro(""); setInfo("Reservando números...");

    try {
      const res = await fetch("/api/reservar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), telefone: telefone.trim(), numeros: selecionados }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao reservar");
        if (data.ocupados) {
          setNumeros(prev => prev.map(n => data.ocupados.includes(n.numero) ? { ...n, status: "reservado" } : n));
          setSelecionados(prev => prev.filter(n => !data.ocupados.includes(n)));
        }
        setInfo("");
        return;
      }

      setSucesso(data);
      setNumeros(prev => prev.map(n => selecionados.includes(n.numero) ? { ...n, status: "reservado" } : n));
      setSelecionados([]);
      setInfo("");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setInfo("");
    } finally {
      setLoading(false);
    }
  }

  if (sucesso) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-scaleIn bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center relative overflow-hidden">
          <Confetti />
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Reserva Confirmada!</h1>
            <p className="text-gray-500 mb-2">Números garantidos por 30 minutos</p>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 my-6">
              <p className="text-sm text-gray-600 mb-1">Seus números</p>
              <p className="text-3xl font-black text-green-700">{sucesso.numeros.map(n => String(n).padStart(3, "0")).join(" · ")}</p>
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm text-gray-600">Valor a pagar</p>
                <p className="text-2xl font-black text-green-700">R$ {sucesso.valorTotal.toFixed(2)}</p>
              </div>
            </div>

            <a href={sucesso.whatsappLink} target="_blank" rel="noopener noreferrer"
              className="gradient-green text-white font-bold py-4 px-6 rounded-2xl text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar comprovante no WhatsApp
            </a>
            <p className="text-xs text-gray-400 mt-4">Abriremos o WhatsApp com a mensagem pronta para envio do comprovante Pix</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-12">
      <div className="max-w-lg mx-auto space-y-4 animate-fadeIn">
        <div className="glass rounded-3xl p-6 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {rifa ? `${rifa.numeros_restantes} números disponíveis` : "Carregando..."}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{rifa?.titulo || "Rifa"}</h1>
          {rifa?.descricao && <p className="text-gray-500 text-sm">{rifa.descricao}</p>}
          {rifa && (
            <p className="text-sm text-gray-400 mt-2">
              <strong className="text-green-600 shimmer-text">R$ {rifa.valor_numero.toFixed(2)}</strong> por número
            </p>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Seu nome</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                className="input-focus w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white outline-none"
                placeholder="Nome completo" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">WhatsApp</label>
              <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)}
                className="input-focus w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white outline-none"
                placeholder="11999999999" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-gray-900 text-lg">Escolha seus números</h2>
            {selecionados.length > 0 && (
              <span className="gradient-green text-white text-xs font-bold px-3 py-1.5 rounded-full animate-scaleIn">
                {selecionados.length} selecionado{selecionados.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
            {numeros.map(n => {
              const isSelected = selecionados.includes(n.numero);
              const isTaken = n.status !== "disponivel";

              return (
                <button key={n.id} onClick={() => !isTaken && toggleNumero(n.numero)} disabled={isTaken}
                  className={`numero-tile aspect-square rounded-xl text-sm font-bold relative overflow-hidden
                    ${isTaken
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed line-through"
                      : isSelected
                        ? "gradient-green text-white shadow-lg selected"
                        : "bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer border border-gray-200"
                    }`}>
                  {String(n.numero).padStart(3, "0")}
                </button>
              );
            })}
          </div>

          {rifa && selecionados.length > 0 && (
            <div className="mt-5 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Números selecionados</p>
                  <p className="font-bold text-gray-800">{selecionados.map(n => String(n).padStart(3, "0")).join(", ")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">Total</p>
                  <p className="text-2xl font-black text-green-700">
                    R$ {(selecionados.length * rifa.valor_numero).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {info && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl p-4 text-sm font-medium flex items-center gap-3">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {info}
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-medium animate-fadeIn">
            {erro}
          </div>
        )}

        <button onClick={reservar} disabled={loading || selecionados.length === 0}
          className="gradient-green text-white font-bold py-4 px-6 rounded-2xl text-lg w-full shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
          {loading ? "Reservando..." : "Reservar números"}
        </button>
      </div>
    </main>
  );
}
