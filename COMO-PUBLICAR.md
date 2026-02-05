# Cómo publicar Mi Biblioteca en Netlify

## Paso 1: Subir a GitHub (opcional pero recomendado)

1. Creá una cuenta en [github.com](https://github.com) si no tenés
2. Creá un nuevo repositorio
3. Subí todos estos archivos

## Paso 2: Crear cuenta en Netlify

1. Andá a [netlify.com](https://netlify.com)
2. Hacé clic en "Sign up" → "Sign up with GitHub"
3. Autorizá Netlify

## Paso 3: Publicar la app

### Opción A: Desde GitHub (más fácil para actualizaciones)
1. En Netlify, hacé clic en "Add new site" → "Import an existing project"
2. Seleccioná GitHub y el repositorio que creaste
3. Dejá la configuración por defecto y hacé clic en "Deploy"

### Opción B: Arrastrar y soltar (más rápido)
1. En Netlify, hacé clic en "Add new site" → "Deploy manually"
2. Arrastrá toda la carpeta `mi-biblioteca` al área de upload

## Paso 4: Configurar tu API Key de Anthropic

**Esto es importante para que funcione el escaneo de libros**

1. En Netlify, andá a tu sitio → "Site configuration" → "Environment variables"
2. Hacé clic en "Add a variable"
3. Poné:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** tu API key de Anthropic (empieza con `sk-ant-...`)
4. Hacé clic en "Save"
5. Andá a "Deploys" y hacé clic en "Trigger deploy" → "Deploy site"

## Paso 5: ¡Listo!

Tu app va a estar en una URL como: `https://tu-sitio.netlify.app`

---

## ¿Dónde consigo la API Key de Anthropic?

1. Andá a [console.anthropic.com](https://console.anthropic.com)
2. Creá una cuenta o logueate
3. Andá a "API Keys"
4. Creá una nueva key y copiala

## Costos estimados

- **Netlify:** Gratis (hasta 100GB de bandwidth/mes)
- **Anthropic API:** ~$0.003 por escaneo de foto (3 dólares por 1000 escaneos)

---

## Estructura de archivos

```
mi-biblioteca/
├── index.html          # La app principal
├── netlify.toml        # Configuración de Netlify
├── COMO-PUBLICAR.md    # Este archivo
└── netlify/
    └── functions/
        ├── scan-books.js   # Función que llama a Claude
        └── package.json    # Dependencias
```
