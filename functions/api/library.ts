
export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
    const { DB } = context.env;
    try {
        const { results } = await DB.prepare('SELECT * FROM library ORDER BY timestamp DESC LIMIT 20').all();
        return new Response(JSON.stringify(results), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
