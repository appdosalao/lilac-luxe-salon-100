import type { RelatorioExportacao } from '@/types/relatorio';
import type { Lancamento } from '@/types/lancamento';
import type { ContaFixa } from '@/types/contaFixa';
import type { Agendamento } from '@/types/agendamento';

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportRelatorioJSON(relatorio: RelatorioExportacao) {
  const filename = `relatorio-financeiro-${relatorio.periodo.replace(/\s+/g, '_')}.json`;
  downloadBlob(JSON.stringify(relatorio, null, 2), filename, 'application/json');
}

function toCSV<T extends Record<string, any>>(rows: T[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

export function exportLancamentosCSV(lancamentos: Lancamento[], filename = 'lancamentos.csv') {
  const rows = lancamentos.map(l => ({
    id: l.id,
    tipo: l.tipo,
    valor: l.valor,
    data: new Date(l.data).toISOString().split('T')[0],
    descricao: l.descricao,
    categoria: l.categoria || '',
    origemId: l.origemId || '',
    origemTipo: l.origemTipo || '',
    clienteId: l.clienteId || '',
    created_at: new Date(l.created_at).toISOString(),
    updated_at: new Date(l.updated_at).toISOString(),
  }));
  downloadBlob(toCSV(rows), filename, 'text/csv;charset=utf-8');
}

export function exportContasFixasCSV(contas: ContaFixa[], filename = 'contas_fixas.csv') {
  const rows = contas.map(c => ({
    id: c.id,
    nome: c.nome,
    categoria: c.categoria,
    valor: c.valor,
    vencimento: c.vencimento,
    pago: c.pago ? 'sim' : 'não',
    created_at: c.created_at,
    updated_at: c.updated_at,
  }));
  downloadBlob(toCSV(rows), filename, 'text/csv;charset=utf-8');
}

export function exportAgendamentosCSV(agendamentos: Agendamento[], filename = 'agendamentos.csv') {
  const rows = agendamentos.map(a => ({
    id: a.id,
    clienteId: a.clienteId,
    clienteNome: a.clienteNome,
    servicoId: a.servicoId,
    servicoNome: a.servicoNome,
    data: a.data,
    hora: a.hora,
    duracao: a.duracao,
    valor: a.valor,
    valorPago: a.valorPago,
    valorDevido: a.valorDevido,
    formaPagamento: a.formaPagamento,
    statusPagamento: a.statusPagamento,
    status: a.status,
    origem: a.origem || '',
    confirmado: a.confirmado ? 'sim' : 'não',
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
  downloadBlob(toCSV(rows), filename, 'text/csv;charset=utf-8');
}

export function exportRelatorioCSV(relatorio: RelatorioExportacao) {
  exportLancamentosCSV(relatorio.dadosDetalhados.lancamentos, `lancamentos-${relatorio.periodo.replace(/\s+/g, '_')}.csv`);
  exportContasFixasCSV(relatorio.dadosDetalhados.contasFixas, `contas-fixas-${relatorio.periodo.replace(/\s+/g, '_')}.csv`);
  exportAgendamentosCSV(relatorio.dadosDetalhados.agendamentos, `agendamentos-${relatorio.periodo.replace(/\s+/g, '_')}.csv`);
}

export function exportRelatorioPDF(relatorio: RelatorioExportacao) {
  const win = window.open('', '_blank');
  if (!win) return;
  const style = `
    body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    h2 { font-size: 14px; margin: 12px 0 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 12px; }
    .summary div { background: #f7f7f7; padding: 8px; border: 1px solid #eee; }
  `;
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const html = `
    <html><head><meta charset="utf-8"/><style>${style}</style><title>Relatório Financeiro</title></head>
    <body>
      <h1>Relatório Financeiro • ${relatorio.periodo}</h1>
      <div class="summary">
        <div><strong>Entradas:</strong> ${fmt(relatorio.dadosResumo.totalEntradas)}</div>
        <div><strong>Saídas:</strong> ${fmt(relatorio.dadosResumo.totalSaidas)}</div>
        <div><strong>Lucro:</strong> ${fmt(relatorio.dadosResumo.lucroLiquido)}</div>
      </div>
      <h2>Lançamentos</h2>
      <table>
        <thead><tr><th>Tipo</th><th>Valor</th><th>Data</th><th>Descrição</th><th>Categoria</th></tr></thead>
        <tbody>
          ${relatorio.dadosDetalhados.lancamentos.map(l => `
            <tr><td>${l.tipo}</td><td>${fmt(l.valor)}</td><td>${new Date(l.data).toLocaleDateString('pt-BR')}</td><td>${l.descricao}</td><td>${l.categoria || ''}</td></tr>
          `).join('')}
        </tbody>
      </table>
      <h2>Contas Fixas</h2>
      <table>
        <thead><tr><th>Nome</th><th>Categoria</th><th>Valor</th><th>Vencimento</th><th>Pago</th></tr></thead>
        <tbody>
          ${relatorio.dadosDetalhados.contasFixas.map(c => `
            <tr><td>${c.nome}</td><td>${c.categoria}</td><td>${fmt(c.valor)}</td><td>${c.vencimento}</td><td>${c.pago ? 'Sim' : 'Não'}</td></tr>
          `).join('')}
        </tbody>
      </table>
      <h2>Agendamentos</h2>
      <table>
        <thead><tr><th>Cliente</th><th>Serviço</th><th>Data</th><th>Hora</th><th>Valor</th><th>Status</th></tr></thead>
        <tbody>
          ${relatorio.dadosDetalhados.agendamentos.map(a => `
            <tr><td>${a.clienteNome}</td><td>${a.servicoNome}</td><td>${a.data}</td><td>${a.hora}</td><td>${fmt(a.valor)}</td><td>${a.status}</td></tr>
          `).join('')}
        </tbody>
      </table>
      <script>window.print();</script>
    </body></html>
  `;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export function exportVendasPorProdutoCSV(rows: Array<{ produto: string; quantidade: number; valor_total: number }>, filename = 'vendas_por_produto.csv') {
  const csv = toCSV(rows.map(r => ({
    produto: r.produto,
    quantidade: r.quantidade,
    valor_total: r.valor_total
  })));
  downloadBlob(csv, filename, 'text/csv;charset=utf-8');
}

export function exportVendasPorProdutoPDF(rows: Array<{ produto: string; quantidade: number; valor_total: number }>, periodo: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  const style = `
    body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
  `;
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const html = `
    <html><head><meta charset="utf-8"/><style>${style}</style><title>Vendas por Produto</title></head>
    <body>
      <h1>Vendas por Produto • ${periodo}</h1>
      <table>
        <thead><tr><th>Produto</th><th>Quantidade</th><th>Total</th></tr></thead>
        <tbody>
          ${rows.map(r => `<tr><td>${r.produto}</td><td>${r.quantidade}</td><td>${fmt(r.valor_total)}</td></tr>`).join('')}
        </tbody>
      </table>
      <script>window.print();</script>
    </body></html>
  `;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
