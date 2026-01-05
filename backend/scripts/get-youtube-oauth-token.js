const { google } = require('googleapis');
const readline = require('readline');

/**
 * Script para obtener OAuth2 Refresh Token para YouTube API
 *
 * INSTRUCCIONES:
 * 1. Instala googleapis: npm install googleapis
 * 2. Reemplaza YOUR_CLIENT_ID y YOUR_CLIENT_SECRET con tus credenciales
 * 3. Ejecuta: node get-youtube-oauth-token.js
 * 4. Copia la URL que aparece y ábrela en el navegador
 * 5. Autoriza con la cuenta de Gmail correspondiente
 * 6. Copia el código de autorización
 * 7. Pégalo en la terminal cuando se te pida
 * 8. Guarda el REFRESH_TOKEN en tu .env
 *
 * REPITE EL PROCESO PARA CADA CANAL (personal y business)
 */

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const scopes = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent', // Force to get refresh token
});

console.log('\n════════════════════════════════════════════════════════════════');
console.log('   YOUTUBE OAUTH2 TOKEN GENERATOR');
console.log('════════════════════════════════════════════════════════════════\n');
console.log('⚠️  IMPORTANTE: Asegúrate de estar logueado con la cuenta correcta');
console.log('    antes de abrir el enlace de autorización.\n');
console.log('📋 PASOS:');
console.log('   1. Copia y pega esta URL en tu navegador:');
console.log('   2. Autoriza la aplicación con la cuenta de Gmail');
console.log('   3. Copia el código de autorización');
console.log('   4. Pégalo aquí abajo cuando se te pida\n');
console.log('🔗 URL DE AUTORIZACIÓN:\n');
console.log(authUrl);
console.log('\n════════════════════════════════════════════════════════════════\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Pega el código de autorización aquí: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n✅ ¡ÉXITO! Token obtenido correctamente.\n');
    console.log('════════════════════════════════════════════════════════════════');
    console.log('   GUARDA ESTOS VALORES EN TU .env');
    console.log('════════════════════════════════════════════════════════════════\n');
    console.log('REFRESH_TOKEN:');
    console.log(tokens.refresh_token);
    console.log('\nACCESS_TOKEN (temporal):');
    console.log(tokens.access_token);
    console.log('\nEXPIRES_IN:');
    console.log(tokens.expiry_date);
    console.log('\n════════════════════════════════════════════════════════════════\n');
    console.log('💡 TIP: El REFRESH_TOKEN no expira, guárdalo de forma segura.');
    console.log('   El ACCESS_TOKEN es temporal y se regenera automáticamente.\n');

    // Probar el token
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelResponse = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      mine: true,
    });

    if (channelResponse.data.items && channelResponse.data.items.length > 0) {
      const channel = channelResponse.data.items[0];
      console.log('📺 CANAL AUTORIZADO:');
      console.log(`   Nombre: ${channel.snippet?.title}`);
      console.log(`   ID: ${channel.id}`);
      console.log(`   Suscriptores: ${channel.statistics?.subscriberCount}`);
      console.log(`   Videos: ${channel.statistics?.videoCount}`);
      console.log('\n');
    }
  } catch (error) {
    console.error('\n❌ ERROR al obtener el token:', error.message);
  } finally {
    rl.close();
  }
});
