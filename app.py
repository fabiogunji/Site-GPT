from flask import Flask, request, jsonify, render_template
from google import genai
from dotenv import load_dotenv
import os

app = Flask(__name__)

# Carregar variáveis de ambiente
load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/gerar_resposta", methods=["POST"])
def gerar_resposta():
    try:

        data = request.get_json()
        pergunta = data["pergunta"]

        resposta =  client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""
            Você é o SENAI-GPT, assistente virtual oficial do SENAI.
            Sua função é responder perguntas de forma clara, objetiva, profissional e didática.

            ### REGRAS:            
            1. Nunca invente informações falsas.
            2. Responder apenas ao que foi solicitado.
            3. Explique conteúdos técnicos de forma simples quando necessário.
            4. Use linguagem motivadora e profissional.
            5. Respostas curtas, médias ou longas conforme a pergunta exigir.
          
            Pergunta:{pergunta}

            """
        )

        texto = resposta.choices[0].message.content

        return jsonify({texto})

    except Exception as e:
        return f"Erro: {e}"


if __name__ == "__main__":
    app.run(debug=True)
