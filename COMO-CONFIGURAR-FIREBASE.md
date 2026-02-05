# Cómo configurar Firebase para Mi Biblioteca

## Paso 1: Crear proyecto en Firebase

1. Andá a [console.firebase.google.com](https://console.firebase.google.com)
2. Hacé clic en "Agregar proyecto" o "Add project"
3. Ponele un nombre (ej: "mi-biblioteca")
4. Desactivá Google Analytics (no lo necesitamos) y hacé clic en "Crear proyecto"

## Paso 2: Agregar app web

1. En tu proyecto, hacé clic en el ícono de web `</>`
2. Ponele un nombre a la app (ej: "mi-biblioteca-web")
3. **NO** marques Firebase Hosting
4. Hacé clic en "Registrar app"
5. Te va a mostrar un código con `firebaseConfig` - **copiá esos valores**

## Paso 3: Configurar Authentication

1. En el menú de la izquierda, andá a "Build" → "Authentication"
2. Hacé clic en "Get started" o "Comenzar"
3. En "Sign-in method", habilitá **Email/Password**
4. Hacé clic en "Enable" y después "Save"

## Paso 4: Configurar Firestore Database

1. En el menú de la izquierda, andá a "Build" → "Firestore Database"
2. Hacé clic en "Create database"
3. Elegí "Start in **test mode**" (modo de prueba)
4. Seleccioná la ubicación más cercana a vos
5. Hacé clic en "Enable"

## Paso 5: Configurar reglas de seguridad

1. En Firestore, andá a la pestaña "Rules"
2. Reemplazá las reglas con esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer/escribir solo su propia data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Colecciones del usuario (books, recommendations, wishlist)
      match /{collection}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Permitir buscar usuarios por email (para agregar amigos)
    match /users/{userId} {
      allow read: if request.auth != null;
    }
  }
}
```

3. Hacé clic en "Publish"

## Paso 6: Agregar tus credenciales a la app

1. Abrí el archivo `index.html`
2. Buscá la sección con `firebaseConfig`
3. Reemplazá los valores con los que copiaste en el Paso 2:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",              // Tu API Key
    authDomain: "mi-biblioteca-xxxxx.firebaseapp.com",
    projectId: "mi-biblioteca-xxxxx",
    storageBucket: "mi-biblioteca-xxxxx.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123..."
};
```

## ¡Listo!

Tu app ahora está conectada a Firebase. Podés:
- Registrarte con email y contraseña
- Guardar tu biblioteca en la nube
- Agregar amigos y compartir recomendaciones

---

## Costos

Firebase tiene un plan gratuito muy generoso:
- **Authentication**: Gratis hasta 10,000 usuarios/mes
- **Firestore**: 1 GB almacenamiento, 50,000 lecturas/día, 20,000 escrituras/día

Para uso personal o con amigos, nunca vas a pagar nada.

---

## Problemas comunes

### "Permission denied" al guardar
→ Verificá que configuraste las reglas de Firestore correctamente (Paso 5)

### "auth/configuration-not-found"
→ Verificá que habilitaste Email/Password en Authentication (Paso 3)

### La app no carga
→ Verificá que los valores de firebaseConfig sean correctos (Paso 6)
