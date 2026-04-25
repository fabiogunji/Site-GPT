/* =========================
   ELEMENTOS DA PÁGINA
========================= */
const toggle = document.getElementById("toggleTheme");
const body = document.body;
const icon = toggle.querySelector("i");

/* =========================
   DARK MODE
========================= */
toggle.addEventListener("click", () => {

    body.classList.toggle("dark");

    if (body.classList.contains("dark")) {
        icon.classList.replace("fa-moon", "fa-sun");
    } else {
        icon.classList.replace("fa-sun", "fa-moon");
    }

});

/* ==========================
   CARREGA CHAVE
========================== */
let keys = {};

async function carregarKeys() {
    try {
        const req = await fetch("keys.json");
        keys = await req.json();
        console.log("keys.json carregado");
    } catch (erro) {
        console.error("Erro ao carregar keys.json", erro);
    }
}

carregarKeys();


/* ==========================
   ELEMENTOS HTML
========================== */
const form = document.getElementById("chatForm");
const respostaTexto = document.getElementById("respostaTexto");
const loading = document.getElementById("loading");


/* ==========================
   TESTE AZURE
========================== */
form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const pergunta =
        document.getElementById("pergunta").value.trim();

    if (pergunta === "") {
        respostaTexto.innerHTML =
            "Digite uma pergunta.";
        return;
    }

    loading.style.display = "block";
    respostaTexto.innerHTML =
        "Conectando Azure...";

    try {

        const response = await fetch(keys.ENDPOINT            ,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "api-key": keys.AZURE_API_KEY
                },

                body: JSON.stringify({
                    model: "gpt-5.2-chat",
                    input: pergunta
                })
            }
        );

        /* status http */
        console.log("HTTP STATUS:", response.status);

        const data = await response.json();

        console.log("RETORNO AZURE:", data);

        /* se sucesso */
        if (response.ok) {

            /*respostaTexto.innerHTML = "✅ Conectado com sucesso!<br><br>" + data.output[0].content[0].text;*/
            /* EXIBE SOMENTE O TEXTO DA RESPOSTA */

            let texto = "";

            if (
                data.output &&
                Array.isArray(data.output)
            ) {

                const mensagem = data.output.find(
                    item => item.type === "message"
                );

                if (
                    mensagem &&
                    mensagem.content &&
                    mensagem.content.length > 0
                ) {

                    const conteudo = mensagem.content.find(
                        item => item.type === "output_text"
                    );

                    if (conteudo) {
                        texto = conteudo.text;
                    }
                }
            }

            /* fallback */
            if (texto === "") {
                texto = "Resposta não encontrada.";
            }

            respostaTexto.innerHTML = texto;

        } else {

            respostaTexto.innerHTML =
                "❌ Erro Azure:<br><br>" +
                JSON.stringify(data, null, 2);
        }

    } catch (erro) {

        console.error(erro);

        respostaTexto.innerHTML =
            "❌ Falha de conexão:<br><br>" +
            erro.message;
    }

    loading.style.display = "none";

});