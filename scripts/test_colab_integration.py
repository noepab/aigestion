from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import os
import pickle

# Configuración
SCOPES = ['https://www.googleapis.com/auth/cloud-platform']

def get_authenticated_service():
    creds = None

    # El archivo token.pickle almacena los tokens de acceso y actualización
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)

    # Si no hay credenciales válidas disponibles, permite al usuario iniciar sesión
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        # Guarda las credenciales para la próxima ejecución
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    return creds

def main():
    print("🔍 Iniciando autenticación con Google...")

    try:
        creds = get_authenticated_service()
        print("✅ Autenticación exitosa!")
        print(f"🔑 Token de acceso: {creds.token[:15]}...")
        print(f"🔄 Token de actualización: {'Disponible' if creds.refresh_token else 'No disponible'}")

        # Aquí puedes agregar el código para interactuar con la API de Google
        # Por ejemplo, listar los notebooks de Colab

    except Exception as e:
        print(f"❌ Error durante la autenticación: {str(e)}")

if __name__ == '__main__':
    main()
