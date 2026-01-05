# ConfiguraciÃ³n de Canales de YouTube

## Resumen Ejecutivo

NEXUS V1 ahora gestiona **DOS canales de YouTube** independientes:

1. **Canal Personal (nemisanalex@gmail.com)**: DocumentaciÃ³n tÃ©cnica, tutoriales, aprendizaje
2. **Canal Empresarial (a.fernandez@NEXUS V1.net)**: Marketing, demos, casos de Ã©xito, webinars
- Email: a.fernandez@NEXUS V1.net

## Arquitectura

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                   YouTube Channel Service                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                               â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”          â”‚
â”‚  â”‚  Personal Channelâ”‚         â”‚ Business Channel â”‚          â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤         â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤          â”‚
â”‚  â”‚ nemisanalex      â”‚         â”‚ NEXUS V1   â”‚          â”‚
â”‚  â”‚ @gmail.com       â”‚         â”‚ @NEXUS V1  â”‚          â”‚
â”‚  â”‚                  â”‚         â”‚                  â”‚          â”‚
â”‚  â”‚ â€¢ Tutorials      â”‚         â”‚ â€¢ Product Demos  â”‚          â”‚
â”‚  â”‚ â€¢ Documentation  â”‚         â”‚ â€¢ Case Studies   â”‚          â”‚
â”‚  â”‚ â€¢ Dev Logs       â”‚         â”‚ â€¢ Webinars       â”‚          â”‚
â”‚  â”‚ â€¢ Learning       â”‚         â”‚ â€¢ Marketing      â”‚          â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜          â”‚
â”‚                                                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Variables de Entorno Requeridas

### API Key Compartida
```env
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
```

### Canal Personal (nemisanalex)
```env
YOUTUBE_PERSONAL_CHANNEL_ID=UC...
YOUTUBE_PERSONAL_EMAIL=nemisanalex@gmail.com
YOUTUBE_PERSONAL_CLIENT_ID=your_oauth2_client_id
YOUTUBE_PERSONAL_CLIENT_SECRET=your_oauth2_client_secret
YOUTUBE_PERSONAL_REFRESH_TOKEN=your_refresh_token
```

### Canal Empresarial (NEXUS V1)
```env
YOUTUBE_BUSINESS_CHANNEL_ID=UC...
YOUTUBE_BUSINESS_EMAIL=a.fernandez@NEXUS V1.net
YOUTUBE_BUSINESS_CLIENT_ID=your_oauth2_client_id
YOUTUBE_BUSINESS_CLIENT_SECRET=your_oauth2_client_secret
YOUTUBE_BUSINESS_REFRESH_TOKEN=your_refresh_token
```

## Setup de OAuth2 (Paso a Paso)

### 1. Crear Proyecto en Google Cloud Console

1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto (o usa uno existente)
3. Habilita "YouTube Data API v3"

### 2. Configurar OAuth2 Credentials

1. Ve a "APIs & Services" â†’ "Credentials"
2. Click "Create Credentials" â†’ "OAuth 2.0 Client ID"
3. Tipo de aplicaciÃ³n: "Web application"
4. Authorized redirect URIs: `http://localhost:3000/oauth2callback`
5. Guarda el **Client ID** y **Client Secret**

### 3. Obtener Refresh Token

**Para cada canal**, ejecuta este script de Node.js:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3000/oauth2callback'
);

const scopes = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Authorize this app by visiting:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log('Refresh Token:', tokens.refresh_token);
  rl.close();
});
```

**IMPORTANTE**:
- Ejecuta este proceso **DOS VECES** (una vez logueado con cada cuenta de Gmail)
- Guarda cada refresh token en las variables de entorno correspondientes

## Uso del Servicio

### Importar el Servicio

```typescript
import { youtubeChannelService } from './utils/youtube-channel.service';
```

### Verificar ConfiguraciÃ³n

```typescript
const isPersonalReady = youtubeChannelService.isChannelConfigured('personal');
const isBusinessReady = youtubeChannelService.isChannelConfigured('business');

console.log(`Personal channel: ${isPersonalReady ? 'Ready' : 'Not configured'}`);
console.log(`Business channel: ${isBusinessReady ? 'Ready' : 'Not configured'}`);
```

### Obtener Info del Canal

```typescript
const personalChannel = youtubeChannelService.getChannelInfo('personal');
const businessChannel = youtubeChannelService.getChannelInfo('business');

console.log(personalChannel);
// {
//   id: 'UC...',
//   type: 'personal',
//   email: 'nemisanalex@gmail.com',
//   name: 'nemisanalex',
//   description: 'Canal personal para documentaciÃ³n tÃ©cnica y desarrollo',
//   purpose: 'Documentar procesos, tutoriales tÃ©cnicos, y aprendizaje personal',
//   credentials: {...}
// }
```

### Subir Video

```typescript
import { youtubeChannelService } from './utils/youtube-channel.service';

const videoId = await youtubeChannelService.uploadVideo({
  channelType: 'personal', // o 'business'
  filePath: '/path/to/video.mp4',
  metadata: {
    title: 'Tutorial: TypeScript Setup',
    description: 'Aprende a configurar TypeScript desde cero...',
    tags: ['typescript', 'tutorial', 'nodejs'],
    categoryId: '28', // Science & Technology
    privacyStatus: 'public', // 'public' | 'private' | 'unlisted'
  },
  notifySubscribers: true,
  madeForKids: false,
});

console.log(`Video uploaded: https://youtube.com/watch?v=${videoId}`);
```

### Listar Videos

```typescript
const videos = await youtubeChannelService.listVideos('business', 20);
console.log(videos);
```

### Actualizar Metadata

```typescript
await youtubeChannelService.updateVideoMetadata('personal', 'VIDEO_ID', {
  title: 'Nuevo tÃ­tulo',
  description: 'Nueva descripciÃ³n',
  tags: ['tag1', 'tag2'],
  privacyStatus: 'unlisted',
});
```

### Obtener EstadÃ­sticas

```typescript
const stats = await youtubeChannelService.getVideoStats('business', 'VIDEO_ID');
console.log(stats.statistics);
// { viewCount: '1234', likeCount: '56', commentCount: '12' }
```

### Crear Playlist

```typescript
const playlistId = await youtubeChannelService.createPlaylist(
  'personal',
  'Tutoriales TypeScript',
  'Serie completa de tutoriales TypeScript',
  'public'
);

// AÃ±adir video a la playlist
await youtubeChannelService.addVideoToPlaylist('personal', 'VIDEO_ID', playlistId);
```

## 30 Ideas de Contenido

Las ideas estÃ¡n organizadas en `src/data/youtube-content-ideas.ts`:

### Resumen

- **Total**: 30 ideas (15 por canal)
- **Canal Personal**: ~8.25 horas de contenido
- **Canal Empresarial**: ~5.5 horas de contenido

### Por Prioridad

- **Alta**: 16 videos
- **Media**: 12 videos
- **Baja**: 2 videos

### Uso de Ideas

```typescript
import {
  contentIdeas,
  getIdeasByChannel,
  getContentStats
} from './data/youtube-content-ideas';

// Todas las ideas
console.log(contentIdeas);

// Ideas del canal personal
const personalIdeas = getIdeasByChannel('personal');
console.log(personalIdeas);

// Ideas del canal empresarial
const businessIdeas = getIdeasByChannel('business');
console.log(businessIdeas);

// EstadÃ­sticas
const stats = getContentStats();
console.log(stats);
// {
//   total: 30,
//   personal: { count: 15, estimatedHours: 8.25 },
//   business: { count: 15, estimatedHours: 5.5 },
//   byPriority: { high: 16, medium: 12, low: 2 }
// }
```

## Ideas Destacadas por Canal

### Canal Personal (Technical Content)

1. **Alta Prioridad**:
   - TypeScript + Node.js setup desde cero (25 min)
   - Arquitectura limpia en Node.js (30 min)
   - Docker de cero a producciÃ³n (35 min)
   - API REST con JWT y seguridad (45 min)
   - Testing con Jest + Supertest (40 min)
   - Gemini AI API integraciÃ³n (30 min)

2. **Media Prioridad**:
   - MongoDB patrones avanzados (40 min)
   - GitHub Actions CI/CD (30 min)
   - RabbitMQ message queues (35 min)
   - Debugging avanzado VS Code (25 min)

### Canal Empresarial (Business Content)

1. **Alta Prioridad**:
   - Demo completa de NEXUS V1 (15 min)
   - Caso de Ã©xito: +40% productividad (10 min)
   - Tutorial: Setup en 5 minutos (5 min)
   - AutomatizaciÃ³n: Ahorra 10 horas/semana (12 min)
   - Seguridad y cumplimiento (10 min)
   - Dashboard ejecutivo (15 min)
   - Nuevas funcionalidades (10 min)
   - ROI Calculado (12 min)

2. **Media Prioridad**:
   - Webinar: Tendencias 2025 (60 min)
   - Comparativa vs competidores (15 min)
   - Integraciones disponibles (20 min)

## CategorÃ­as de YouTube (IDs)

```typescript
const YOUTUBE_CATEGORIES = {
  FILM_ANIMATION: '1',
  AUTOS_VEHICLES: '2',
  MUSIC: '10',
  PETS_ANIMALS: '15',
  SPORTS: '17',
  SHORT_MOVIES: '18',
  TRAVEL_EVENTS: '19',
  GAMING: '20',
  VIDEOBLOGGING: '21',
  PEOPLE_BLOGS: '22',
  COMEDY: '23',
  ENTERTAINMENT: '24',
  NEWS_POLITICS: '25',
  HOWTO_STYLE: '26',
  EDUCATION: '27',
  SCIENCE_TECHNOLOGY: '28', // â† Para canal personal
  NONPROFITS_ACTIVISM: '29',
};
```

**RecomendaciÃ³n**:
- Canal Personal: CategorÃ­a `28` (Science & Technology)
- Canal Empresarial: CategorÃ­a `28` (Science & Technology) o `27` (Education)

## Mejores PrÃ¡cticas

### TÃ­tulos
- **Personal**: TÃ©cnicos y especÃ­ficos ("TypeScript + Node.js: Setup desde cero")
- **Empresarial**: Orientados a beneficios ("Ahorra 10 horas semanales con automatizaciÃ³n")

### Descripciones
- Primera lÃ­nea: Hook (por quÃ© ver este video)
- Timestamps para videos >10 min
- Links relevantes (docs, GitHub, sitio web)
- Call to action (suscribirse, probar el producto)

### Tags
- 10-15 tags por video
- Mix de tags amplios y especÃ­ficos
- Incluir nombre del canal/marca

### Thumbnails
- ResoluciÃ³n: 1280x720 (16:9)
- Formato: JPG, PNG (< 2MB)
- Texto grande y legible
- Colores contrastantes
- Branding consistente

### ProgramaciÃ³n
- **Personal**: Martes y Viernes (contenido tÃ©cnico)
- **Empresarial**: Lunes y Jueves (contenido business)
- Hora: 9:00 AM - 11:00 AM (mejor engagement)

## Workflow Recomendado

```
1. Seleccionar idea de contenido
   â†“
2. Crear script / outline
   â†“
3. Grabar video
   â†“
4. Editar (intro, outro, branding)
   â†“
5. Exportar (1080p, H.264, MP4)
   â†“
6. Crear thumbnail
   â†“
7. Subir con youtubeChannelService.uploadVideo()
   â†“
8. Optimizar SEO (tÃ­tulo, descripciÃ³n, tags)
   â†“
9. Compartir en redes sociales
   â†“
10. Monitorear analytics
```

## Troubleshooting

### Error: "OAuth2 credentials incomplete"
**SoluciÃ³n**: Verifica que todas las variables de entorno estÃ©n configuradas para el canal correspondiente.

### Error: "Refresh token expired"
**SoluciÃ³n**: Los refresh tokens pueden expirar si no se usan por 6 meses. Regenera el token siguiendo el proceso de OAuth2.

### Error: "Quota exceeded"
**SoluciÃ³n**: YouTube API tiene lÃ­mites diarios (10,000 units/dÃ­a). Un upload usa ~1,600 units. Programa uploads para distribuir la cuota.

### Error: "Invalid video file"
**SoluciÃ³n**: Formatos soportados: MP4, AVI, FLV, MOV, WMV. TamaÃ±o mÃ¡x: 256 GB o 12 horas.

## Recursos Adicionales

- **YouTube Data API Docs**: https://developers.google.com/youtube/v3
- **OAuth2 Playground**: https://developers.google.com/oauthplayground/
- **YouTube Studio**: https://studio.youtube.com/
- **Category IDs**: https://developers.google.com/youtube/v3/docs/videoCategories/list
- **Best Practices**: https://creatoracademy.youtube.com/

## PrÃ³ximos Pasos

1. âœ… Configurar variables de entorno
2. âœ… Obtener OAuth2 credentials para ambos canales
3. âœ… Verificar configuraciÃ³n con `isChannelConfigured()`
4. ðŸ“ Seleccionar las primeras 3 ideas de alta prioridad por canal
5. ðŸŽ¬ Grabar y editar el primer video de cada canal
6. ðŸš€ Subir videos usando el servicio
7. ðŸ“Š Monitorear analytics y engagement
8. ðŸ”„ Iterar basado en mÃ©tricas

## Soporte

Para cualquier duda o problema con la integraciÃ³n de YouTube:
- Email: a.fernandez@NEXUS V1.net
- DocumentaciÃ³n interna: `/docs/youtube/`
- Logs del servicio: `src/utils/youtube-channel.service.ts`

