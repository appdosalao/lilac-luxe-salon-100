import type { Agendamento } from '@/types/agendamento';

export function printAgendamentoRecibo(params: {
  agendamento: Agendamento;
  cliente: { nome: string; telefone: string; email?: string };
  servico: { nome: string; descricao?: string };
  salonName?: string;
  logoUrl?: string;
}) {
  const { agendamento, cliente, servico, salonName, logoUrl } = params;
  const dataBR = new Date(`${agendamento.data}T${agendamento.hora}`);
  const dataStr = dataBR.toLocaleDateString('pt-BR');
  const horaStr = agendamento.hora.slice(0, 5);
  const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agendamento.valor);
  const valorPago = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agendamento.valorPago || 0);
  const valorDevido = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agendamento.valorDevido || 0);
  const forma = agendamento.formaPagamento === 'cartao' ? 'Cartão' :
                agendamento.formaPagamento === 'pix' ? 'PIX' :
                agendamento.formaPagamento === 'dinheiro' ? 'Dinheiro' : 'Fiado';
  const statusPagamento = agendamento.statusPagamento === 'pago' ? 'Pago' :
                          agendamento.statusPagamento === 'parcial' ? 'Parcial' : 'Em aberto';

  const win = window.open('', '_blank');
  if (!win) return;

  const style = `
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .logo { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; border: 2px solid #d6b2e7; }
    .title { font-size: 18px; font-weight: 700; }
    .subtitle { font-size: 12px; color: #666; }
    .section { margin-top: 14px; }
    .section h3 { font-size: 14px; margin: 0 0 6px 0; }
    .row { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px dashed #ddd; }
    .footer { margin-top: 16px; font-size: 10px; color: #555; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 8px; font-size: 11px; }
  `;

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Recibo de Agendamento</title>
        <style>${style}</style>
      </head>
      <body>
        <div class="header">
          ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="Logo" />` : ''}
          <div>
            <div class="title">${salonName || 'Salão de Bolso'}</div>
            <div class="subtitle">Recibo de Agendamento</div>
          </div>
        </div>

        <div class="section">
          <h3>Dados do Cliente</h3>
          <div class="row"><div>Nome</div><div>${cliente.nome}</div></div>
          <div class="row"><div>Telefone</div><div>${cliente.telefone}</div></div>
          ${cliente.email ? `<div class="row"><div>E-mail</div><div>${cliente.email}</div></div>` : ''}
        </div>

        <div class="section">
          <h3>Agendamento</h3>
          <div class="row"><div>Serviço</div><div>${servico.nome}</div></div>
          <div class="row"><div>Data</div><div>${dataStr}</div></div>
          <div class="row"><div>Hora</div><div>${horaStr}</div></div>
          <div class="row"><div>Duração</div><div>${agendamento.duracao} min</div></div>
          <div class="row"><div>Status</div><div>${agendamento.status}</div></div>
        </div>

        <div class="section">
          <h3>Pagamento</h3>
          <div class="row"><div>Valor Total</div><div>${valor}</div></div>
          <div class="row"><div>Valor Pago</div><div>${valorPago}</div></div>
          <div class="row"><div>Valor Devido</div><div>${valorDevido}</div></div>
          <div class="row"><div>Forma de Pagamento</div><div>${forma}</div></div>
          <div class="row"><div>Status do Pagamento</div><div>${statusPagamento}</div></div>
        </div>

        <div class="footer">
          Documento gerado em ${new Date().toLocaleString('pt-BR')} • ${window.location.origin}
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
