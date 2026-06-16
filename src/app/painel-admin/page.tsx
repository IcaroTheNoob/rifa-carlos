"use client";

import { useState, useEffect, useCallback } from "react";

interface Rifa {
  id: number;
  titulo: string;
  valor_numero: number;
  total_numeros: number;
  numeros_restantes: number;
  auto_expand_percent: number;
  auto_expand_qtd: number;
  whatsapp: string;
}

interface Numero {
  id: number;
  numero: number;
  status: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  pedido_id: string | null;
  reservado_em: string | null;
}

interface Pedido {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  numeros: number[];
  quantidade: number;
  valor_total: number;
  status: string;
  created_at: string;
}

export default function PainelAdmin() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState("");

  const [rifa, setRifa] = useState<Rifa | null>(null);
  const [numeros, setNumeros] = useState<Numero[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "disponivel" | "reservado" | "pago">("todos");
  const [msg, setMsg] = useState("");

  const [expandPercent, setExpandPercent] = useState(20);
  const [expandQtd, setExpandQtd] = useState(50);
  const [whatsapp, setWhatsapp] = useState("");

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
      setMsg("Erro ao carregar dados");
    }
  }, []);

  async function fazerLogin() {
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    });
    if (res.ok) {
      setAutenticado(true);
      setErroLogin("");
    } else {
      setErroLogin("Senha incorreta");
    }
  }

  useEffect(() => {
    if (autenticado) carregarDados();
  }, [autenticado, carregarDados]);

  async function confirmarPagamento(pedidoId: string) {
    await fetch("/api/admin/confirmar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId }),
    });
    setMsg("Pagamento confirmado!");
    carregarDados();
  }

  async function liberarNumero(numeroId: number) {
    await fetch("/api/admin/liberar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeroId }),
    });
    setMsg("Número liberado!");
    carregarDados();
  }

  async function salvarConfig() {
    const totalAtual = rifa?.total_numeros || 0;
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsapp,
        total_numeros: totalAtual,
      }),
    });
    if (res.ok) setMsg("Configuração salva!");
    carregarDados();
  }

  async function salvarAutoExpand() {
    await fetch("/api/admin/expandir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percent: expandPercent, quantidade: expandQtd }),
    });
    setMsg("Auto-expand configurado!");
    carregarDados();
  }

  async function adicionarNumeros() {
    const novos = prompt("Quantos números deseja adicionar?", "50");
    if (!novos) return;
    const qtd = parseInt(novos);
    if (isNaN(qtd) || qtd < 1) return;

    const totalNovo = (rifa?.total_numeros || 0) + qtd;
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total_numeros: totalNovo, whatsapp }),
    });
    if (res.ok) setMsg(`${qtd} números adicionados!`);
    carregarDados();
  }

  if (!autenticado) {
    return (
      <main className="max-w-sm mx-auto p-4 pt-20">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-center mb-6">Painel Admin</h1>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fazerLogin()}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Senha"
          />
          {erroLogin && <p className="text-red-600 text-sm mb-4">{erroLogin}</p>}
          <button
            onClick={fazerLogin}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Entrar
          </button>
        </div>
      </main>
    );
  }

  const disponiveis = numeros.filter((n) => n.status === "disponivel").length;
  const reservados = numeros.filter((n) => n.status === "reservado").length;
  const pagos = numeros.filter((n) => n.status === "pago").length;
  const totalArrecadado = pagos * (rifa?.valor_numero || 0);

  const numerosFiltrados = filtro === "todos" ? numeros : numeros.filter((n) => n.status === filtro);

  return (
    <main className="max-w-4xl mx-auto p-4 pt-8">
      <h1 className="text-2xl font-bold mb-6">Painel Admin</h1>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-4 text-sm">
          {msg}
          <button onClick={() => setMsg("")} className="float-right font-bold">X</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{disponiveis}</div>
          <div className="text-sm text-gray-500">Disponíveis</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-yellow-500">{reservados}</div>
          <div className="text-sm text-gray-500">Reservados</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-red-500">{pagos}</div>
          <div className="text-sm text-gray-500">Pagos</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-700">R$ {totalArrecadado.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Arrecadado</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Números</h2>
          <div className="flex gap-2">
            {["todos", "disponivel", "reservado", "pago"].map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f as any)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filtro === f
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "todos" ? "Todos" : f === "disponivel" ? "Disponível" : f === "reservado" ? "Reservado" : "Pago"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
          {numerosFiltrados.map((n) => {
            const cor =
              n.status === "disponivel"
                ? "bg-green-100 text-green-800"
                : n.status === "reservado"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800";

            return (
              <div
                key={n.id}
                className={`${cor} rounded-lg p-2 text-center text-xs font-bold cursor-default relative group`}
                title={
                  n.cliente_nome
                    ? `${n.cliente_nome} (${n.cliente_telefone})`
                    : `Nº ${n.numero}`
                }
              >
                {String(n.numero).padStart(3, "0")}
                {n.status === "reservado" && (
                  <button
                    onClick={() => liberarNumero(n.id)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Liberar número"
                  >
                    X
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-lg mb-4">Pedidos Pendentes</h2>
        {pedidos.filter((p) => p.status === "reservado").length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum pedido pendente</p>
        ) : (
          <div className="space-y-3">
            {pedidos
              .filter((p) => p.status === "reservado")
              .map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{p.cliente_nome}</p>
                      <p className="text-sm text-gray-500">{p.cliente_telefone}</p>
                      <p className="text-sm mt-1">
                        Números: <strong>{p.numeros.join(", ")}</strong>
                      </p>
                      <p className="text-sm">
                        Total: <strong>R$ {p.valor_total.toFixed(2)}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => confirmarPagamento(p.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Confirmar pagamento
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-lg mb-4">Configurações</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (receber mensagens)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="5511999999999"
              />
              <button
                onClick={salvarConfig}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Expansão automática de números</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quando faltar X%</label>
                <input
                  type="number"
                  value={expandPercent}
                  onChange={(e) => setExpandPercent(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Adicionar Y números</label>
                <input
                  type="number"
                  value={expandQtd}
                  onChange={(e) => setExpandQtd(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <button
              onClick={salvarAutoExpand}
              className="mt-3 bg-gray-800 hover:bg-gray-900 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              Salvar auto-expand
            </button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Adicionar números manualmente</h3>
            <button
              onClick={adicionarNumeros}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              + Adicionar números
            </button>
            <p className="text-xs text-gray-400 mt-2">Total atual: {rifa?.total_numeros || 0} números</p>
          </div>
        </div>
      </div>
    </main>
  );
}
