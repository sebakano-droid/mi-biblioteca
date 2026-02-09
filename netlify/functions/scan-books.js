// Netlify Function para escanear libros con Claude
// Soporta una imagen o múltiples frames de video
// La API key se configura en Netlify: Site settings > Environment variables > ANTHROPIC_API_KEY

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { imageBase64, images } = JSON.parse(event.body);

    // Soportar tanto imagen única como múltiples (video frames)
    const imageList = images || (imageBase64 ? [imageBase64] : []);

    if (imageList.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No image provided' }) };
    }

    // Construir el contenido con todas las imágenes
    const content = [];

   // Agregar todas las imágenes
imageList.forEach((img, index) => {
  // Limpiar el prefijo data:image/...;base64, si existe
  const base64Data = img.replace(/^data:image\/[a-z]+;base64,/, '');
  content.push({
    type: 'image',
    source: {
      type: 'base64',
      media_type: 'image/jpeg',
      data: base64Data
    }
  });
});

    // Agregar el prompt
    const isVideo = imageList.length > 1;
    const promptText = isVideo
      ? `Estas son ${imageList.length} capturas de un video de una estantería con libros. Analizá todas las imágenes juntas para detectar TODOS los libros visibles en los lomos.

Como son frames de un mismo video, puede haber libros repetidos entre imágenes - deduplicalos y listá cada libro UNA SOLA VEZ.

Para cada libro único que identifiques, extraé:
- Título (lo más preciso posible)
- Autor (si es visible o lo conocés)
- Confianza (alta si estás seguro, media si es probable, baja si es difícil de leer)

Respondé SOLO con JSON válido, sin markdown ni explicaciones:
{"libros": [{"titulo": "...", "autor": "...", "confianza": "alta|media|baja"}], "notas": "observaciones opcionales"}`
      : `Analizá esta foto de una estantería con libros. Detectá todos los libros que puedas ver en los lomos.

Para cada libro que identifiques, extraé:
- Título (lo más preciso posible)
- Autor (si es visible o lo conocés)
- Confianza (alta si estás seguro, media si es probable, baja si es difícil de leer)

Respondé SOLO con JSON válido, sin markdown ni explicaciones:
{"libros": [{"titulo": "...", "autor": "...", "confianza": "alta|media|baja"}], "notas": "observaciones opcionales"}`;

    content.push({
      type: 'text',
      text: promptText
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: content
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: data.error.message }) };
    }

    const text = data.content?.[0]?.text || '';
    const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ libros: [], notas: 'No se detectaron libros' }) };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
