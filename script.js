const form = document.getElementById("chatForm");
const respostaTexto = document.getElementById("respostaTexto");

const toggle = document.getElementById("toggleTheme");
const body = document.body;
const icon = toggle.querySelector("i");

/* dark mode */
toggle.addEventListener("click", () => {
    body.classList.toggle("dark");

    if(body.classList.contains("dark")){
        icon.classList.replace("fa-moon","fa-sun");
    }else{
        icon.classList.replace("fa-sun","fa-moon");
    }
});

/* enviar pergunta */
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pergunta = document.getElementById("pergunta").value;

    respostaTexto.innerText = "Consultando SENAI GPT...";

    try{

        const resposta = await fetch("/gerar_resposta", {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify({ pergunta })
        });

        const dados = await resposta.json();

        respostaTexto.innerText = dados.resposta;

    }catch(error){
        respostaTexto.innerText = "Erro ao consultar API.";
    }
});