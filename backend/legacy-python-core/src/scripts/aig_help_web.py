from flask import Flask, render_template_string, request

FAQ_FILE = "docs/AIG_FAQ.md"
SUPPORT_EMAIL = "soporte@aigestion.net"

app = Flask(__name__)

with open(FAQ_FILE, "r", encoding="utf-8") as f:
    faq = f.read()

HTML = """
<!DOCTYPE html>
<html><head><title>AIGestion Help Bot</title></head><body>
<h2>Canal de ayuda AIGestion Agent</h2>
<form method="post">
  <input name="question" placeholder="Escribe tu pregunta" style="width:300px;" required>
  <button type="submit">Consultar</button>
</form>
{% if answer %}<p><b>Respuesta:</b> {{ answer }}</p>{% endif %}
</body></html>
"""


@app.route("/", methods=["GET", "POST"])
def help_bot():
    answer = None
    if request.method == "POST":
        user_input = request.form["question"].lower()
        # Registrar consulta
        with open("logs/aigestion_help_queries.log", "a", encoding="utf-8") as logf:
            logf.write(user_input + "\n")
        found = False
        for line in faq.splitlines():
            if user_input and user_input in line.lower():
                answer = line
                found = True
                break
        if not found:
            answer = f"No encontré una respuesta directa. Consulta la documentación o escribe a {SUPPORT_EMAIL}."
    return render_template_string(HTML, answer=answer)


if __name__ == "__main__":
    app.run(port=8080)
