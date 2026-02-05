// Netlify Function para recomendar libros con Claude
// Usa la API de Anthropic para analizar la biblioteca y recomendar libros

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const { books } = JSON.parse(event.body);

        if (!books || books.length === 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ recommendations: [] })
            };
        }

        // Crear lista de libros para el prompt
        const booksList = books.map(b => `- "${b.title}" de ${b.author}`).join('\n');

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: `Basándote en esta biblioteca personal, recomienda 5 libros que NO estén en la lista pero que le gustarían al lector.

BIBLIOTECA DEL USUARIO:
${booksList}

Responde SOLO con un JSON array con este formato exacto (sin explicaciones adicionales):
[
  {
    "title": "Título del libro",
    "author": "Autor",
    "reason": "Razón en máximo 10 palabras",
    "amazonSearch": "término de búsqueda para Amazon"
  }
]

Las razones deben ser muy cortas y directas, máximo 10 palabras. Ejemplo: "Si te gustó Sapiens, amarás esto" o "Mismo autor de tu favorito".`
                }]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Error de Anthropic:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Error al obtener recomendaciones' })
            };
        }

        const data = await response.json();
        const content = data.content[0].text;

        // Parsear JSON de la respuesta
        let recommendations = [];
        try {
            // Buscar el JSON en la respuesta
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                recommendations = JSON.parse(jsonMatch[0]);
                // Agregar link de Amazon a cada recomendación
                recommendations = recommendations.map(rec => ({
                    ...rec,
                    amazonLink: `https://www.amazon.com/s?k=${encodeURIComponent(rec.amazonSearch || rec.title + ' ' + rec.author)}`
                }));
            }
        } catch (parseError) {
            console.error('Error parseando JSON:', parseError, content);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ recommendations })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
