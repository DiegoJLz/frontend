# Frontend - Aplicación de Procesamiento de Imágenes

Esta es la aplicación frontend para el servicio de procesamiento de imágenes. Construida con Next.js 14, TailwindCSS y TypeScript, proporciona una interfaz moderna y responsive para gestionar y procesar imágenes.

## 🚀 Características

- 🔐 Autenticación de usuarios (registro e inicio de sesión)
- 👤 Perfil de usuario
- 🖼️ Galería de imágenes con vista previa
- 🛠️ Opciones de procesamiento de imágenes:
  - Redimensionamiento
  - Rotación
  - Volteo horizontal y vertical
  - Conversión a escala de grises
- 📱 Diseño responsive
- 🎨 Interfaz moderna con Tailwind CSS
- ⚡ Carga y procesamiento de imágenes en tiempo real

## 📋 Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- Backend del servicio de procesamiento de imágenes corriendo en `http://localhost:3001`

## 🛠️ Instalación

1. Clona el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

## 🚀 Ejecución

Para ejecutar en modo desarrollo:
```bash
npm run dev
# o
yarn dev
```

Para construir y ejecutar en producción:
```bash
npm run build
npm start
# o
yarn build
yarn start
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/                    # Páginas y componentes principales
│   │   ├── auth/              # Componentes de autenticación
│   │   ├── gallery/           # Galería de imágenes
│   │   └── profile/           # Perfil de usuario
│   ├── components/            # Componentes reutilizables
│   └── services/             # Servicios y llamadas a la API
├── public/                   # Archivos estáticos
└── styles/                  # Estilos globales
```

## 🔒 Autenticación

La aplicación utiliza autenticación basada en tokens JWT. El token se almacena en:
- localStorage para persistencia
- cookies para acceso seguro

## 🖼️ Procesamiento de Imágenes

Las imágenes se pueden procesar con las siguientes opciones:
- Redimensionar: Ajusta el ancho y alto
- Rotar: Rotación en incrementos de 90 grados
- Voltear: Horizontal o vertical
- Escala de grises: Conversión a blanco y negro

## 🎨 Estilos y UI

- Utiliza Tailwind CSS para estilos
- Componentes personalizados para consistencia
- Diseño responsive para todas las pantallas
- Temas y colores personalizables

## 🔧 Configuración

Puedes modificar la configuración en:
- `next.config.js` para opciones de Next.js
- `tailwind.config.js` para personalización de Tailwind
- `.env.local` para variables de entorno

## 📱 Responsive Design

La aplicación es completamente responsive y se adapta a:
- 📱 Móviles (< 640px)
- 📱 Tablets (640px - 1024px)
- 💻 Escritorio (> 1024px)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Notas Adicionales

- Asegúrate de que el backend esté corriendo antes de iniciar el frontend
- Para desarrollo local, el backend debe estar en `http://localhost:3001`
- Las imágenes procesadas se almacenan en el backend

## 🐛 Solución de Problemas

**Las imágenes no cargan:**
- Verifica que el backend esté corriendo
- Comprueba la URL del backend en `.env.local`
- Verifica tu token de autenticación

**Errores de autenticación:**
- Limpia el localStorage y cookies
- Intenta cerrar sesión y volver a iniciar sesión

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles

## 🐳 Docker

### Requisitos para Docker
- Docker instalado en tu sistema
- Docker Compose (incluido en Docker Desktop para Windows y Mac)

### Construcción y ejecución con Docker

1. Construir y ejecutar con Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Solo ejecutar (si ya está construido):
   ```bash
   docker-compose up
   ```

3. Ejecutar en segundo plano:
   ```bash
   docker-compose up -d
   ```

4. Detener los contenedores:
   ```bash
   docker-compose down
   ```

### Construcción manual con Docker

1. Construir la imagen:
   ```bash
   docker build -t image-processor-frontend .
   ```

2. Ejecutar el contenedor:
   ```bash
   docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:3001 image-processor-frontend
   ```

### Variables de entorno en Docker
- `NEXT_PUBLIC_API_URL`: URL del backend (por defecto: http://localhost:3001)

### Notas sobre Docker
- La aplicación estará disponible en `http://localhost:3000`
- Asegúrate de que el backend esté accesible desde el contenedor
- Los cambios en el código requieren reconstruir la imagen

### Solución de problemas con Docker

#### Errores de ESLint durante la construcción
Si encuentras errores de ESLint durante la construcción, tienes varias opciones:

1. Usar la construcción sin linting:
   ```bash
   docker-compose build --build-arg DISABLE_ESLINT=true
   ```

2. Corregir los errores de ESLint localmente:
   ```bash
   npm run lint --fix
   ```

3. Ajustar las reglas de ESLint en `.eslintrc.json`

#### Problemas comunes y soluciones
- Si la construcción falla por errores de TypeScript, asegúrate de que todos los tipos estén correctamente definidos
- Para problemas de memoria durante la construcción, aumenta los recursos de Docker
- Si hay problemas de conexión con el backend, verifica la URL en las variables de entorno
