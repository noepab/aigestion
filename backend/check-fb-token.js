const axios = require('axios');

const accessToken = 'EAAJe4NPURJsBQCwEZAToFQ0kagtYZBDm0PsQZCsW29ao9Seq787pE0bu1yr6MuZAMILcNNDsZC5ZCgSi2oloTCFeVnWOM9UIHDPHDeDiA1Q5av9h1TY2gO9sScgngZB1FaH33VdT22POX0iOYQZBom4VHf8U6WNiCJTjs2WWDgJgZAduijcTM61PQVWZBUpqabfnPinyc8mFt3gcfqhvTpjpZClzZBtWLHdjq21XK26sdvd0xnGDDZCbr78phbZCtZCps9pD6GuD5qPn2y603TTlziAcwZDZD';

async function checkToken() {
  try {
    console.log('🔍 Checking Token...');
    // Consultar "me" para ver a quién pertenece el token (Usuario o Página)
    const me = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
    console.log('✅ Token válido para:', me.data.name, `(ID: ${me.data.id})`);

    // Consultar cuentas asociadas (si es un token de usuario) para ver páginas
    try {
        const accounts = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
        if (accounts.data.data && accounts.data.data.length > 0) {
            console.log('\n📄 Páginas disponibles:');
            accounts.data.data.forEach(page => {
                console.log(`- ${page.name} (ID: ${page.id})`);
            });
            console.log('\n💡 Tip: Usa uno de estos IDs como FACEBOOK_PAGE_ID');
        } else {
            console.log('\nℹ️ No se encontraron páginas asociadas a este token (o es un token de página directo).');
        }
    } catch (e) {
        // Si falla accounts, quizá es un token de página directo
        console.log('ℹ️ Este parece ser un token de página directo o no tiene permiso de pages_show_list.');
    }

  } catch (error) {
    console.error('❌ Error testing token:', error.response ? error.response.data : error.message);
  }
}

checkToken();
