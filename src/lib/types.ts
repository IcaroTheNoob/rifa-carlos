export interface Rifa {
  id: number;
  titulo: string;
  descricao: string;
  valor_numero: number;
  total_numeros: number;
  numeros_restantes: number;
  auto_expand_percent: number;
  auto_expand_qtd: number;
  whatsapp: string;
  status: string;
}

export interface Numero {
  id: number;
  rifa_id: number;
  numero: number;
  status: 'disponivel' | 'reservado' | 'pago';
  cliente_nome: string | null;
  cliente_telefone: string | null;
  pedido_id: string | null;
  reservado_em: string | null;
}

export interface Pedido {
  id: string;
  rifa_id: number;
  cliente_nome: string;
  cliente_telefone: string;
  numeros: number[];
  quantidade: number;
  valor_total: number;
  status: 'reservado' | 'pago' | 'cancelado';
  created_at: string;
}
