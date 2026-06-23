exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key não configurada.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido.' }) };
  }

  const { servico, estilo } = body;

  const prompt = `Crie uma mensagem curta de WhatsApp de reativação de cliente para o Salão Goretti Miranda em Manaus, Amazonas. O salão tem mais de 30 anos de história e uma equipe de mais de 40 profissionais.

Serviço que a cliente fez e não voltou a fazer: "${servico}".
Tom da mensagem: ${estilo}.

Regras obrigatórias:
- Use exatamente {{nome}} onde deve aparecer o nome da cliente
- Use exatamente {{servico}} onde deve aparecer o nome do serviço
- Máximo 3 linhas
- Primeira letra de cada frase sempre em maiúscula
- Pode usar 1 ou 2 emojis relevantes ao serviço
- Não use aspas, não explique, não coloque prefixo — responda APENAS com o texto da mensagem`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data?.content?.find(b => b.type === 'text')?.text?.trim() || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: text })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao chamar a API: ' + err.message })
    };
  }
};
