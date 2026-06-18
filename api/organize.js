const DEFAULT_MODEL = 'gpt-4.1-mini';

const systemPrompt = `你是台灣清潔與工程場勘助理。請把使用者貼上的 LINE 對話或場勘紀錄整理成施工細項。
規則：
1. 僅輸出 JSON，格式為 {"items":[{"area":"區域","detail":"施工細項"}]}。
2. area 只能是：牆面地面、客廳玄關、臥室、廁所、廚房、陽台、窗戶、注意事項、其他。
3. 每個 detail 使用繁體中文，清楚、短句、可直接放進估價單。
4. 不要加入價格。
5. 資訊不足時請寫「待確認」。
6. 不要捏造不存在的施工內容。`;

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
    return;
  }

  try {
    const { text = '' } = await readJsonBody(req);
    if (!text.trim()) {
      res.status(200).json({ items: [{ area: '其他', detail: '施工內容待確認' }] });
      return;
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        instructions: systemPrompt,
        input: text,
        text: {
          format: {
            type: 'json_schema',
            name: 'site_quote_items',
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                items: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      area: {
                        type: 'string',
                        enum: ['牆面地面', '客廳玄關', '臥室', '廁所', '廚房', '陽台', '窗戶', '注意事項', '其他']
                      },
                      detail: { type: 'string' }
                    },
                    required: ['area', 'detail']
                  }
                }
              },
              required: ['items']
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: errorText });
      return;
    }

    const data = await response.json();
    const textOutput =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        .find((content) => content.type === 'output_text' || content.type === 'text')?.text;
    const output = textOutput ? JSON.parse(textOutput) : { items: [] };
    res.status(200).json(output);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
}
