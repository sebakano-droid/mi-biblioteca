// Servidor local para probar el escáner con Anthropic
// Ejecutar: node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ⚠️ IMPORTANTE: Poné tu API Key de Anthropic acá
const ANTHROPIC_API_KEY = 'TU_API_KEY_DE_ANTHROPIC';

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API endpoint para escanear libros
    if (req.url === '/.netlify/functions/scan-books' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { imageBase64 } = JSON.parse(body);

                const requestData = JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 4096,
                    messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/jpeg',
                                    data: imageBase64
                                }
                            },
                            {
                                type: 'text',
                                text: `Analizá esta foto de una estantería con libros. Detectá todos los libros que puedas ver en los lomos.

Para cada libro que identifiques, extraé:
- Título (lo más preciso posible)
- Autor (si es visible)
- Confianza (alta/media/baja) de que la identificación es correcta

Respondé SOLO con un JSON válido en este formato exacto, sin texto adicional ni markdown:
{"libros": [{"titulo": "...", "autor": "...", "confianza": "alta|media|baja"}], "notas": "cualquier observación sobre la imagen"}`
                            }
                        ]
                    }]
                });

                const options = {
                    hostname: 'api.anthropic.com',
                    path: '/v1/messages',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': ANTHROPIC_API_KEY,
                        'anthropic-version': '2023-06-01'
                    }
                };

                const apiReq = https.request(options, (apiRes) => {
                    let data = '';
                    apiRes.on('data', chunk => data += chunk);
                    apiRes.on('end', () => {
                        try {
                            const response = JSON.parse(data);

                            if (response.error) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: response.error.message }));
                                return;
                            }

                            const text = response.content[0].text;
                            const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

                            if (jsonMatch) {
                                const parsed = JSON.parse(jsonMatch[0]);
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify(parsed));
                            } else {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ libros: [], notas: 'No se pudieron detectar libros' }));
                            }
                        } catch (e) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Error procesando respuesta' }));
                        }
                    });
                });

                apiReq.on('error', (e) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                });

                apiReq.write(requestData);
                apiReq.end();

            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Servir archivos estáticos
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`
🚀 Servidor corriendo en http://localhost:${PORT}

📚 Abrí http://localhost:${PORT} en tu navegador para usar la app

⚠️  Asegurate de configurar tu ANTHROPIC_API_KEY en este archivo
    `);
});
