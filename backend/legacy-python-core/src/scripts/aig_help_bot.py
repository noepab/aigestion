import random

FAQ_FILE = "docs/AIG_FAQ.md"
SUPPORT_EMAIL = "soporte@aigestion.net"

# Cargar preguntas frecuentes
with open(FAQ_FILE, "r", encoding="utf-8") as f:
    faq = f.read()

# Simulación de canal de ayuda automatizado
print("Bienvenido al canal de ayuda AIGestion Agent. Escribe tu pregunta o 'salir' para terminar.")
while True:
    user_input = input("Pregunta: ").strip().lower()
    if user_input in ["salir", "exit", "quit"]:
        print("Gracias por usar el canal de ayuda. ¡Hasta pronto!")
        break
    # Buscar respuesta en FAQ
    found = False
    for line in faq.splitlines():
        if user_input and user_input in line.lower():
            print(f"Respuesta: {line}")
            found = True
            break
    if not found:
        print(
            f"No encontré una respuesta directa. Puedes consultar la documentación o escribir a {SUPPORT_EMAIL}"
        )
        # Sugerencia aleatoria
        tips = [
            "Revisa la guía rápida docs/AIGestion_GUIA_RAPIDA.md.",
            "Asegúrate de tener permisos adecuados en data/roles.json.",
            "Verifica tu conexión a internet si usas APIs externas.",
            "Consulta los logs en agente_logs.log para más detalles.",
        ]
        print("Tip: " + random.choice(tips))
