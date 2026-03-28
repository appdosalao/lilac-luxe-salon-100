import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, usuario, dados, formato, totalItens } = await req.json()

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const filename = `backup_${new Date().toISOString().split('T')[0]}.${formato}`
    const content = formato === 'json' ? JSON.stringify(dados, null, 2) : dados // No caso de CSV/SQL o frontend já pode mandar formatado ou fazemos aqui

    // Enviar email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Salão de Bolso <onboarding@resend.dev>', // Ou seu domínio verificado
        to: [email],
        subject: `Backup do Salão - ${new Date().toLocaleDateString('pt-BR')}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B5CF6;">Seu Backup está pronto!</h2>
            <p>Olá, <strong>${usuario}</strong>,</p>
            <p>Conforme solicitado, estamos enviando o backup dos seus dados do sistema.</p>
            <div style="background: #f3f4f6; padding: 20px; rounded: 10px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Resumo do Backup:</strong></p>
              <ul style="margin-top: 10px;">
                <li>Data: ${new Date().toLocaleString('pt-BR')}</li>
                <li>Total de Registros: ${totalItens}</li>
                <li>Formato: ${formato.toUpperCase()}</li>
              </ul>
            </div>
            <p>O arquivo de backup está anexado a este e-mail.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">
              Este é um e-mail automático. Por favor, não responda.
            </p>
          </div>
        `,
        attachments: [
          {
            filename: filename,
            content: btoa(unescape(encodeURIComponent(content))), // Base64 encoding
          }
        ]
      }),
    })

    const data = await res.json()

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
