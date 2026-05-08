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
    return apiSwitch.checked ? "GEMINI" : "CHATGPT";
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
        return "Resposta não encontrada (GEMINI).";
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
        provider === "GEMINI"
            ? "🔴 Consultando Gemini..."
            : "🔵 Consultando ChatGPT...";

    respostaTexto.innerHTML = "";

    /* força render do loading */
    await new Promise(r => setTimeout(r, 50));

    try {

        let response, data, textoFinal;

        /* ======================
           AZURE
        ====================== */
        if (provider === "CHATGPT") {

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

            console.log("RETORNO CHATGPT:", data);

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
        falarTexto( limparMarkdown(textoFinal));

        

    } catch (erro) {

        console.error(erro);

        respostaTexto.innerHTML =
            "❌ Erro de conexão:<br><br>" + erro.message;
    }

    liberarInterface();
    loading.style.display = "none";

});

/* ==========================
   MICROFONE (VOICE INPUT)
========================== */

const micBtn = document.getElementById("micBtn");
const sendBtn = document.getElementById("sendBtn");
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
   TTS AZURE
========================== */

/* ==========================
   REMOVE MARKDOWN
========================== */
function limparMarkdown(texto){

    if(!texto) return "";

    return texto

        /* remove blocos código ``` */
        .replace(/```[\s\S]*?```/g, "")

        /* remove inline code `code` */
        .replace(/`([^`]+)`/g, "$1")

        /* remove negrito **texto** */
        .replace(/\*\*(.*?)\*\*/g, "$1")

        /* remove itálico *texto* */
        .replace(/\*(.*?)\*/g, "$1")

        /* remove underline */
        .replace(/__(.*?)__/g, "$1")

        /* remove headings */
        .replace(/^#+\s/gm, "")

        /* remove listas */
        .replace(/^\s*[-•]\s+/gm, "")

        /* remove markdown links */
        .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1")

        /* remove imagens markdown */
        .replace(/!\[.*?\]\(.*?\)/g, "")

        /* remove pipes tabela */
        .replace(/\|/g, " ")

        /* remove > quote */
        .replace(/^>\s+/gm, "")

        /* remove múltiplos espaços */
        .replace(/\s+/g, " ")

        .trim();
}

async function falarTexto(texto){

    try{

         /* limpa markdown */
        const textoLimpo = limparMarkdown(texto);
        

        const endpoint =
            `https://${keys.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

        const response = await fetch(endpoint, {

            method:"POST",

            headers:{
                "Ocp-Apim-Subscription-Key":
                    keys.AZURE_SPEECH_KEY,

                "Content-Type":
                    "application/ssml+xml",

                "X-Microsoft-OutputFormat":
                    "audio-16khz-128kbitrate-mono-mp3"
            },

            body: `
                <speak version='1.0' xml:lang='pt-BR'>
                    <voice xml:lang='pt-BR'
                           xml:gender='Female'
                           name='pt-BR-FranciscaNeural'>

                        ${texto}

                    </voice>
                </speak>
            `
        });

        const audioBlob = await response.blob();

        const audioUrl =
            URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);

        audio.play();

    }catch(erro){

        console.error("Erro TTS Azure:", erro);
    }
}

/* ==========================
   BLOQUEIA INTERFACE
========================== */
function bloquearInterface(){

    sendBtn.disabled = true;
    micBtn.disabled = true;

    sendBtn.style.opacity = "0.5";
    micBtn.style.opacity = "0.5";

    campoPergunta.disabled = true;
}

/* ==========================
   LIBERA INTERFACE
========================== */
function liberarInterface(){

    sendBtn.disabled = false;
    micBtn.disabled = false;

    sendBtn.style.opacity = "1";
    micBtn.style.opacity = "1";

    campoPergunta.disabled = false;
}

/* ==========================
   SPEECH TO TEXT
========================== */


let ouvindo = false;

if(SpeechRecognition){

    const recognition = new SpeechRecognition();

    recognition.lang = "pt-BR";

    recognition.continuous = false;

    recognition.interimResults = false;

    /* clique microfone */
    micBtn.addEventListener("click", () => {

        /* evita iniciar duas vezes */
        if(ouvindo) return;

        ouvindo = true;

        recognition.start();

        micBtn.classList.add("listening");

        loading.style.display = "block";

        loading.innerHTML =
            "🎤 Ouvindo...";

        console.log("🎤 Ouvindo...");
    });

    /* quando detectar fala */
    recognition.onresult = (event) => {

        const texto =
            event.results[0][0].transcript;

        campoPergunta.value = texto;

        console.log("Você disse:", texto);

        /* envia automático */
        form.requestSubmit();
    };

    /* quando parar */
    recognition.onend = () => {

        ouvindo = false;

        micBtn.classList.remove("listening");

        console.log("🔴 Parou de ouvir");
    };

    /* erro */
    recognition.onerror = (event) => {

        console.error(event.error);

        ouvindo = false;

        micBtn.classList.remove("listening");

        loading.style.display = "none";
    };

}else{

    console.warn(
        "SpeechRecognition não suportado."
    );
}

/* ==========================
   JARVIS VOICE SYSTEM
========================== */


const WAKE_WORD = "jarvis".toLowerCase();

let recognition;

let processando = false;


/* ==========================
   SPEECH API
========================== */
if(SpeechRecognition){

    recognition =
        new SpeechRecognition();

    recognition.lang = "pt-BR";

    recognition.continuous = true;

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;

    iniciarJarvis();

}else{

    console.error(
        "SpeechRecognition não suportado"
    );
}

/* ==========================
   INICIAR ESCUTA
========================== */
function iniciarJarvis(){

    if(ouvindo) return;

    try{

        recognition.start();

        ouvindo = true;

        micBtn.classList.add(
            "listening"
        );

        console.log(
            "🎧 JARVIS ouvindo..."
        );

    }catch(erro){

        console.log(
            "Microfone já iniciado"
        );
    }
}

/* ==========================
   RESULTADO VOZ
========================== */
recognition.onresult =
async (event) => {

    if(processando) return;

    let fala =
    event.results[
        event.results.length - 1
    ][0].transcript
    .toLowerCase()
    .trim();

    fala = fala.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

    console.log(
        "🗣 Você disse:",
        fala
    );

    /* remove pontuação */
    fala = fala.replace(
        /[.,!?]/g,
        ""
    );

    /* verifica wake word */
    if(!fala.includes(WAKE_WORD)){

        return;
    }

    console.log(
        "🟢 Wake word detectada"
    );

    processando = true;

    /* remove jarvis */
    const pergunta = fala
        .replace(WAKE_WORD, "")
        .trim();

    if(pergunta.length === 0){

        processando = false;

        return;
    }

    /* coloca input */
    campoPergunta.value =
        pergunta;

    /* loading */
    loading.style.display =
        "block";

    loading.innerHTML =
        "🤖 JARVIS processando...";

    /* pesquisa */
    await enviarPergunta();

    processando = false;
};

/* ==========================
   QUANDO ENCERRA
========================== */
recognition.onend = () => {

    ouvindo = false;

    micBtn.classList.remove(
        "listening"
    );

    console.log(
        "🔴 Microfone encerrado"
    );

    /* reinicia automático */
    setTimeout(() => {

        iniciarJarvis();

    }, 1000);
};

/* ==========================
   ERROS
========================== */
recognition.onerror = (event) => {

    console.log(
        "Erro Speech:",
        event.error
    );

    ouvindo = false;

    micBtn.classList.remove(
        "listening"
    );

    /* reinicia */
    setTimeout(() => {

        iniciarJarvis();

    }, 1500);
};

