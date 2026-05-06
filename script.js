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
const apiSwitch = document.getElementById("apiSwitch");


/* ==========================
   PROVIDER (TOGGLE)
========================== */
function getProvider() {
    return apiSwitch.checked ? "gemini" : "azure";
}


/* ==========================
   EXTRATOR AZURE
========================== */
function extrairAzure(data) {

    let texto = "";

    if (data.output && Array.isArray(data.output)) {

        const mensagem = data.output.find(
            item => item.type === "message"
        );

        if (mensagem && mensagem.content) {

            const conteudo = mensagem.content.find(
                item => item.type === "output_text"
            );

            if (conteudo) {
                texto = conteudo.text;
            }
        }
    }

    return texto || "Resposta não encontrada.";
}


/* ==========================
   EXTRATOR GEMINI
========================== */
function extrairGemini(data) {
    try {
        return data.candidates[0].content.parts[0].text;
    } catch {
        return "Resposta não encontrada (Gemini).";
    }
}


/* ==========================
   ENVIO PRINCIPAL
========================== */
form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const pergunta = document.getElementById("pergunta").value.trim();

    if (pergunta === "") {
        respostaTexto.innerHTML = "Digite uma pergunta.";
        return;
    }

    const provider = getProvider();

    /* LOADING DINÂMICO */
    loading.style.display = "block";
    loading.innerHTML =
        provider === "gemini"
            ? "🔴 Consultando Gemini..."
            : "🔵 Consultando Azure...";

    respostaTexto.innerHTML = "";

    /* força render do loading */
    await new Promise(r => setTimeout(r, 50));

    try {

        let response, data, textoFinal;

        /* ======================
           AZURE
        ====================== */
        if (provider === "azure") {

            response = await fetch(keys.AZURE_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": keys.AZURE_API_KEY
                },
                body: JSON.stringify({
                    model: "gpt-5.2-chat",
                    input: pergunta
                })
            });

            data = await response.json();

            console.log("RETORNO AZURE:", data);

            textoFinal = extrairAzure(data);
        }

        /* ======================
           GEMINI
        ====================== */
        else {

            response = await fetch(
                `${keys.ENDPOINT_GOOGLE}?key=${keys.GOOGLE_API_KEY}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    { text: pergunta }
                                ]
                            }
                        ]
                    })
                }
            );

            data = await response.json();

            console.log("RETORNO GEMINI:", data);

            textoFinal = extrairGemini(data);
        }

        /* EXIBE RESULTADO + PROVIDER */
        respostaTexto.innerHTML = `
            <div style="font-size:12px;color:#888;margin-bottom:5px;">
                🔎 Fonte: ${provider.toUpperCase()}
            </div>
            <div>${textoFinal}</div>
        `;

        /* 🔊 fala resposta */
        falarTexto(textoFinal);

    } catch (erro) {

        console.error(erro);

        respostaTexto.innerHTML =
            "❌ Erro de conexão:<br><br>" + erro.message;
    }

    loading.style.display = "none";

});

/* ==========================
   MICROFONE (VOICE INPUT)
========================== */

const micBtn = document.getElementById("micBtn");
const campoPergunta = document.getElementById("pergunta");

/* compatibilidade */
const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    console.warn("Reconhecimento de voz não suportado.");
} else {

    const recognition = new SpeechRecognition();

    recognition.lang = "pt-BR";   // português
    recognition.continuous = false;
    recognition.interimResults = false;

    /* clique no microfone */
    micBtn.addEventListener("click", () => {

        recognition.start();

        micBtn.classList.add("listening");
        console.log("🎤 Ouvindo...");

    });

    /* quando capturar */
    recognition.onresult = (event) => {

        const texto =
            event.results[0][0].transcript;

        campoPergunta.value = texto;

        console.log("Você disse:", texto);
    };

    /* erro */
    recognition.onerror = (event) => {

        console.error("Erro voz:", event.error);

        alert("Erro no microfone: " + event.error);
    };

    /* quando parar */
    recognition.onend = () => {

        micBtn.classList.remove("listening");
        console.log("🛑 Parou de ouvir");
    };
}

const vozes = window.speechSynthesis.getVoices();

const vozBR = vozes.find(
    voz => voz.lang === "pt-BR"
);

if (vozBR) {
    fala.voice = vozBR;
}

/* ==========================
   TEXT TO SPEECH
========================== */
function falarTexto(texto) {

    /* para fala anterior */
    window.speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(texto);

    fala.lang = "pt-BR";

    /* configuração voz */
    fala.rate = 0.95;
    fala.pitch = 1.15;
    fala.volume = 1;

    /* lista vozes */
    const vozes = window.speechSynthesis.getVoices();

    console.log(vozes);

    /* tenta localizar voz feminina PT-BR */
    let vozFeminina = vozes.find(voz =>
        voz.lang.includes("pt") &&
        (
            voz.name.includes("Maria") ||
            voz.name.includes("Female") ||
            voz.name.includes("Luciana") ||
            voz.name.includes("Google português do Brasil")
        )
    );

    /* fallback */
    if (!vozFeminina) {
        vozFeminina = vozes.find(
            voz => voz.lang.includes("pt")
        );
    }

    /* aplica voz */
    if (vozFeminina) {
        fala.voice = vozFeminina;
    }

    /* fala */
    window.speechSynthesis.speak(fala);
}
