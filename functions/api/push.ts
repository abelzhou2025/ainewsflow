
export const onRequest: PagesFunction<{ DB: D1Database, DEEPSEEK_API_KEY: string }> = async (context) => {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST' } });
    }

    if (context.request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { url, title: manualTitle } = await context.request.json() as { url: string, title?: string };
        if (!url) throw new Error('URL is required');

        // 1. Get Title (if not provided)
        let title = manualTitle;
        if (!title) {
            const res = await fetch(url);
            const html = await res.text();
            const titleMatch = html.match(/<title>(.*?)<\/title>/i);
            title = titleMatch ? titleMatch[1] : 'Unknown Title';
        }

        // 2. DeepSeek Semantic Tagging
        let tag = '其他';
        if (context.env.DEEPSEEK_API_KEY) {
            try {
                const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${context.env.DEEPSEEK_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [
                            { role: "system", content: "你是一个新闻分类助手。请根据标题将新闻分类为：AI工具、底层架构、行业动向。仅输出标签名称，不要有其他文字。" },
                            { role: "user", content: `标题: ${title}` }
                        ]
                    })
                });
                const dsData = await dsRes.json() as { choices: Array<{ message: { content: string } }> };
                tag = dsData.choices[0].message.content.trim();
            } catch (e) {
                console.error('DeepSeek categorization failed', e);
            }
        }

        // 3. Save to D1
        const { DB } = context.env;
        await DB.prepare('INSERT OR REPLACE INTO library (url, title, tag) VALUES (?, ?, ?)')
            .bind(url, title, tag)
            .run();

        return new Response(JSON.stringify({ success: true, title, tag }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
