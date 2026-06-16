"use client";

import { useState, useEffect, useCallback } from "react";

interface RifaData { id: number; titulo: string; valor_numero: number; total_numeros: number; numeros_restantes: number; auto_expand_percent: number; auto_expand_qtd: number; whatsapp: string }
interface Numero { id: number; numero: number; status: string; cliente_nome: string | null; cliente_telefone: string | null; pedido_id: string | null; reservado_em: string | null }
interface Pedido { id: string; cliente_nome: string; cliente_telefone: string; numeros: number[]; quantidade: number; valor_total: number; status: string; created_at: string }

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input {...props} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all" />
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    disponivel: "bg-green-100 text-green-700",
    reservado: "bg-amber-100 text-amber-700",
    pago: "bg-red-100 text-red-700",
    cancelado: "bg-gray-100 text-gray-500",
  };
  return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${colors[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { disponivel: "bg-green-400", reservado: "bg-amber-400", pago: "bg-red-400" };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || "bg-gray-300"}`} />;
}

export default function PainelAdmin() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState("");

  const [rifa, setRifa] = useState<RifaData | null>(null);
  const [numeros, setNumeros] = useState<Numero[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "disponivel" | "reservado" | "pago">("todos");
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [expandPercent, setExpandPercent] = useState(20);
  const [expandQtd, setExpandQtd] = useState(50);
  const [whatsapp, setWhatsapp] = useState("");
  const [modal, setModal] = useState<{ numero: Numero; pedido?: Pedido } | null>(null);

  function showMsg(text: string, type: "success" | "error" = "success") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  }

  const carregarDados = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/numeros");
      const data = await res.json();
      setRifa(data.rifa);
      setNumeros(data.numeros);
      setPedidos(data.pedidos);
      setExpandPercent(data.rifa.auto_expand_percent);
      setExpandQtd(data.rifa.auto_expand_qtd);
      setWhatsapp(data.rifa.whatsapp);
    } catch {
      showMsg("Erro ao carregar dados", "error");
    }
  }, []);

  async function fazerLogin() {
    const res = await fetch("/api/admin/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    });
    if (res.ok) { setAutenticado(true); setErroLogin(""); }
    else setErroLogin("Senha incorreta");
  }

  useEffect(() => { if (autenticado) carregarDados(); }, [autenticado, carregarDados]);

  async function confirmarPagamento(pedidoId: string) {
    await fetch("/api/admin/confirmar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedidoId }) });
    showMsg("Pagamento confirmado!");
    carregarDados();
  }

  async function liberarNumero(numeroId: number) {
    await fetch("/api/admin/liberar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ numeroId }) });
    showMsg("Número liberado!");
    carregarDados();
  }

  async function cancelarPedido(pedidoId: string) {
    if (!confirm("Tem certeza? Isso irá cancelar a reserva e liberar todos os números.")) return;
    await fetch("/api/admin/cancelar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedidoId }) });
    showMsg("Reserva cancelada!");
    carregarDados();
  }

  async function salvarWhatsapp() {
    await fetch("/api/admin/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ whatsapp, total_numeros: rifa?.total_numeros }) });
    showMsg("WhatsApp salvo!");
  }

  async function salvarAutoExpand() {
    await fetch("/api/admin/expandir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ percent: expandPercent, quantidade: expandQtd }) });
    showMsg("Auto-expand configurado!");
  }

  async function adicionarNumeros() {
    const input = prompt("Quantos números deseja adicionar?", "50");
    if (!input) return;
    const qtd = parseInt(input);
    if (isNaN(qtd) || qtd < 1) return;
    const totalNovo = (rifa?.total_numeros || 0) + qtd;
    await fetch("/api/admin/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ total_numeros: totalNovo, whatsapp }) });
    showMsg(`${qtd} números adicionados!`);
    carregarDados();
  }

  if (!autenticado) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full animate-scaleIn">
          <div className="text-center mb-6">
            <div className="w-14 h-14 gradient-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Painel Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Acesso restrito</p>
          </div>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && fazerLogin()}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all mb-4"
            placeholder="Digite a senha" />
          {erroLogin && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">{erroLogin}</div>}
          <button onClick={fazerLogin} className="gradient-green text-white font-bold py-3.5 px-6 rounded-xl w-full shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]">
            Entrar
          </button>
        </div>
      </main>
    );
  }

  const disponiveis = numeros.filter(n => n.status === "disponivel").length;
  const reservados = numeros.filter(n => n.status === "reservado").length;
  const pagos = numeros.filter(n => n.status === "pago").length;
  const totalArrecadado = pagos * (rifa?.valor_numero || 0);
  const numerosFiltrados = filtro === "todos" ? numeros : numeros.filter(n => n.status === filtro);

  const pedidosAgrupados = pedidos.filter(p => p.status !== "cancelado").map(p => ({
    ...p,
    numerosList: p.numeros,
  }));

  return (
    <main className="min-h-screen p-4 pb-16">
      <div className="max-w-5xl mx-auto space-y-5 animate-fadeIn">

        {msg && (
          <div className={`rounded-2xl p-4 text-sm font-medium flex items-center gap-3 animate-fadeIn ${msg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="ml-auto font-bold opacity-60 hover:opacity-100">&times;</button>
          </div>
        )}

        <div className="glass rounded-3xl p-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900">Painel Admin</h1>
          <span className="text-xs text-gray-400 bg-white px-3 py-1.5 rounded-full shadow-sm">Admin</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Disponíveis", value: disponiveis, color: "text-green-600", bg: "bg-green-50" },
            { label: "Reservados", value: reservados, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Pagos", value: pagos, color: "text-red-600", bg: "bg-red-50" },
            { label: "Arrecadado", value: `R$ ${totalArrecadado.toFixed(2)}`, color: "text-green-800", bg: "bg-emerald-50" },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 shadow-sm border border-transparent`}>
              <p className="text-2xl font-black ${stat.color}">{stat.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="font-extrabold text-gray-900">Números</h2>
            <div className="flex gap-1.5">
              {(["todos", "disponivel", "reservado", "pago"] as const).map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${filtro === f ? "gradient-green text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {f === "todos" ? "Todos" : f === "disponivel" ? "Disponível" : f === "reservado" ? "Reservado" : "Pago"}
                </button>
              ))}
            </div>
          </div>
              <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-1.5">
            {numerosFiltrados.map(n => (
              <div key={n.id} className="relative group">
                <button onClick={() => {
                  if (n.status === "reservado" || n.status === "pago") {
                    const p = pedidos.find(ped => ped.id === n.pedido_id);
                    setModal({ numero: n, pedido: p });
                  }
                }}
                  className={`w-full rounded-lg p-2 text-center text-[11px] font-bold transition-all cursor-pointer ${n.status === "disponivel" ? "bg-green-50 text-green-700" : n.status === "reservado" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-red-50 text-red-700 hover:bg-red-100"}`}
                  title={n.cliente_nome ? `${n.cliente_nome} (${n.cliente_telefone})` : `Nº ${n.numero}`}>
                  <span className="block leading-none">{String(n.numero).padStart(3, "0")}</span>
                  <StatusDot status={n.status} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 mb-5">Pessoas e seus números</h2>
          {pedidosAgrupados.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p className="font-medium">Nenhuma reserva ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Números</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qtd</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosAgrupados.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3 font-medium text-gray-800">{p.cliente_nome}</td>
                      <td className="py-3 px-3 text-gray-500">{p.cliente_telefone}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {p.numerosList.map(num => (
                            <span key={num} className="inline-block bg-gray-100 text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-md">{String(num).padStart(3, "0")}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">{p.quantidade}</td>
                      <td className="py-3 px-3 text-right font-bold text-green-700">R$ {p.valor_total.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center"><Badge status={p.status} /></td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {p.status === "reservado" ? (
                            <>
                              <button onClick={() => confirmarPagamento(p.id)}
                                className="bg-green-500 hover:bg-green-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:shadow-md">
                                Confirmar PIX
                              </button>
                              <button onClick={() => cancelarPedido(p.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-600 p-1.5 rounded-lg transition-all hover:shadow-md"
                                title="Cancelar reserva">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <span className="text-green-600 text-xs font-bold">✓ Pago</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 mb-5">Tabela de todos os números</h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nº</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefone</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {numeros.map(n => (
                  <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-3 font-bold text-gray-800">{String(n.numero).padStart(3, "0")}</td>
                    <td className="py-2 px-3 text-gray-600">{n.cliente_nome || "—"}</td>
                    <td className="py-2 px-3 text-gray-600">{n.cliente_telefone || "—"}</td>
                    <td className="py-2 px-3 text-center"><Badge status={n.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-extrabold text-gray-900 mb-4">Configurações</h2>
            <div className="space-y-4">
              <Input label="WhatsApp (receber mensagens)" type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="5511999999999" />
              <button onClick={salvarWhatsapp} className="gradient-green text-white font-bold py-3 px-5 rounded-xl text-sm w-full shadow-md hover:shadow-lg transition-all">Salvar WhatsApp</button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-extrabold text-gray-900 mb-4">Expansão automática</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Input label="Quando faltar X%" type="number" value={expandPercent} onChange={e => setExpandPercent(parseInt(e.target.value) || 0)} />
              <Input label="Adicionar Y números" type="number" value={expandQtd} onChange={e => setExpandQtd(parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex gap-2">
              <button onClick={salvarAutoExpand} className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg">Salvar auto-expand</button>
              <button onClick={adicionarNumeros} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg">+ Adicionar</button>
            </div>
            <p className="text-xs text-gray-400 mt-3">Total: <strong>{rifa?.total_numeros || 0}</strong> números</p>
          </div>
        </div>

        {modal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
            <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-scaleIn" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg text-gray-900">Nº {String(modal.numero.numero).padStart(3, "0")}</h3>
                <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
              </div>
              {modal.numero.cliente_nome && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-2 text-sm">
                  <p><span className="text-gray-500">Nome:</span> <strong>{modal.numero.cliente_nome}</strong></p>
                  <p><span className="text-gray-500">Telefone:</span> <strong>{modal.numero.cliente_telefone}</strong></p>
                  {modal.numero.reservado_em && <p><span className="text-gray-500">Reservado em:</span> <strong>{new Date(modal.numero.reservado_em).toLocaleString("pt-BR")}</strong></p>}
                  {modal.pedido && <p><span className="text-gray-500">Valor:</span> <strong>R$ {modal.pedido.valor_total.toFixed(2)}</strong></p>}
                </div>
              )}
              <Badge status={modal.numero.status} />
              <div className="mt-5 flex gap-2">
                {modal.numero.status === "reservado" && modal.numero.pedido_id && (
                  <>
                    <button onClick={() => { confirmarPagamento(modal.numero.pedido_id!); setModal(null); }}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-all">
                      Confirmar PIX
                    </button>
                    <button onClick={() => { cancelarPedido(modal.numero.pedido_id!); setModal(null); }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition-all">
                      Cancelar
                    </button>
                  </>
                )}
                {modal.numero.status === "pago" && (
                  <div className="w-full text-center py-2 text-green-600 font-bold text-sm bg-green-50 rounded-xl">✓ Pagamento confirmado</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
