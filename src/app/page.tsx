"use client";

import { useState, useEffect } from "react";

interface NumeroData {
  id: number;
  numero: number;
  status: string;
}

interface RifaData {
  id: number;
  titulo: string;
  descricao: string;
  valor_numero: number;
  total_numeros: number;
  numeros_restantes: number;
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

  useEffect(() => {
    fetch("/api/rifa")
      .then((r) => r.json())
      .then((data) => {
        setRifa(data.rifa);
        setNumeros(data.numeros);
      })
      .catch(() => setErro("Erro ao carregar rifa"));
  }, []);

  function toggleNumero(num: number) {
    setSelecionados((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  }

  async function reservar() {
    if (!nome.trim() || !telefone.trim()) {
      setErro("Preencha nome e telefone");
      return;
    }
    if (selecionados.length === 0) {
      setErro("Selecione pelo menos um número");
      return;
    }

    setLoading(true);
    setErro("");

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
          setNumeros((prev) =>
            prev.map((n) =>
              data.ocupados.includes(n.numero) ? { ...n, status: "reservado" } : n
            )
          );
          setSelecionados((prev) => prev.filter((n) => !data.ocupados.includes(n)));
        }
        return;
      }

      setSucesso(data);
      setNumeros((prev) =>
        prev.map((n) =>
          selecionados.includes(n.numero) ? { ...n, status: "reservado" } : n
        )
      );
      setSelecionados([]);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sucesso) {
    return (
      <main className="max-w-lg mx-auto p-4 pt-12">
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Reserva confirmada!</h1>
          <p className="text-gray-600 mb-4">
            Números: {sucesso.numeros.join(", ")}
          </p>
          <p className="text-2xl font-bold text-green-600 mb-6">
            R$ {sucesso.valorTotal.toFixed(2)}
          </p>
          <a
            href={sucesso.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors"
          >
            Enviar comprovante no WhatsApp
          </a>
          <p className="text-sm text-gray-500 mt-4">
            Você será redirecionado ao WhatsApp com a mensagem pronta
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto p-4 pt-8">
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
        <h1 className="text-2xl font-bold text-center">{rifa?.titulo || "Carregando..."}</h1>
        {rifa?.descricao && (
          <p className="text-gray-600 text-center mt-1">{rifa.descricao}</p>
        )}
        {rifa && (
          <p className="text-center text-sm text-gray-500 mt-2">
            {rifa.numeros_restantes} números disponíveis · R$ {rifa.valor_numero.toFixed(2)} cada
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Nome completo"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="11999999999"
        />
        <p className="text-xs text-gray-400 mb-4">Com DDD, apenas números</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Escolha seus números</h2>
          {selecionados.length > 0 && (
            <span className="text-sm font-medium text-green-600">
              {selecionados.length} selecionados
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {numeros.map((n) => {
            const isSelected = selecionados.includes(n.numero);
            const isTaken = n.status !== "disponivel";

            return (
              <button
                key={n.id}
                onClick={() => !isTaken && toggleNumero(n.numero)}
                disabled={isTaken}
                className={`
                  aspect-square rounded-lg text-sm font-bold transition-all
                  ${isTaken
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : isSelected
                      ? "bg-green-500 text-white shadow-md scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                  }
                `}
              >
                {String(n.numero).padStart(3, "0")}
              </button>
            );
          })}
        </div>

        {rifa && selecionados.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-xl">
            <p className="text-sm text-gray-600">
              Números: <strong>{selecionados.join(", ")}</strong>
            </p>
            <p className="text-lg font-bold text-green-700">
              Total: R$ {(selecionados.length * rifa.valor_numero).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">
          {erro}
        </div>
      )}

      <button
        onClick={reservar}
        disabled={loading || selecionados.length === 0}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors mb-8"
      >
        {loading ? "Reservando..." : "Reservar números"}
      </button>
    </main>
  );
}
