const CHAVE = "lifecare_pacientes";

const TITULOS = {
  inicio: "Visão geral",
  pacientes: "Pacientes",
  prontuarios: "Prontuários",
  tratamentos: "Tratamentos",
  exames: "Exames",
  arquivo: "Arquivo médico"
};

let pacientes = carregar();
let timerAviso;

function $(id) {
  return document.getElementById(id);
}

function carregar() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || [];
  } catch (erro) {
    return [];
  }
}

function salvar() {
  localStorage.setItem(CHAVE, JSON.stringify(pacientes));
  renderTudo();
}

function gerarId() {
  return "LC-" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
}

function dataHoje() {
  return new Date().toLocaleDateString("en-CA");
}

function formatarData(data) {
  if (!data) {
    return "Não informado";
  }
  const partes = data.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function escapar(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buscar(id) {
  return pacientes.find(p => p.id === id);
}

function pacientesAtivos() {
  return pacientes.filter(p => !p.arquivado);
}

function temAlerta(p) {
  const texto = p.alergias.trim().toLowerCase();
  return texto !== "" && texto !== "não informado" && texto !== "nenhuma conhecida" && texto !== "nenhuma";
}

function classeTratamento(status) {
  return status === "Em andamento" ? "" : "cinza";
}

function avisar(mensagem) {
  const aviso = $("aviso");
  aviso.textContent = mensagem;
  aviso.classList.add("visivel");
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => aviso.classList.remove("visivel"), 2500);
}

function abrirModal(id) {
  $(id).classList.add("aberto");
}

function fecharModal(id) {
  $(id).classList.remove("aberto");
}

function trocarTela(nome) {
  document.querySelectorAll(".tela").forEach(t => t.classList.remove("ativa"));
  $("tela-" + nome).classList.add("ativa");
  document.querySelectorAll(".menu-item").forEach(b => {
    b.classList.toggle("ativo", b.dataset.tela === nome);
  });
  $("titulo-tela").textContent = TITULOS[nome];
}

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) {
    return "Bom dia";
  }
  if (hora < 18) {
    return "Boa tarde";
  }
  return "Boa noite";
}

function atualizarProntuarioAberto(id) {
  if ($("modal-prontuario").classList.contains("aberto")) {
    abrirProntuario(id);
  }
}

function novoPaciente() {
  $("form-paciente").reset();
  $("p-id").value = "";
  $("titulo-modal-paciente").textContent = "Novo paciente";
  abrirModal("modal-paciente");
  $("p-nome").focus();
}

function editarPaciente(id) {
  const p = buscar(id);
  $("form-paciente").reset();
  $("p-id").value = p.id;
  $("p-nome").value = p.nome;
  $("p-cpf").value = p.cpf;
  $("p-nascimento").value = p.nascimento;
  $("p-telefone").value = p.telefone;
  $("p-email").value = p.email;
  $("p-endereco").value = p.endereco;
  $("p-convenio").value = p.convenio;
  $("p-status").value = p.status;
  $("p-alergias").value = p.alergias;
  $("p-historico").value = p.historico;
  $("p-observacoes").value = p.observacoes;
  $("titulo-modal-paciente").textContent = "Editar paciente";
  fecharModal("modal-prontuario");
  abrirModal("modal-paciente");
}

function arquivarPaciente(id) {
  const p = buscar(id);
  if (!confirm("Arquivar o registro de " + p.nome + "? O histórico será mantido no arquivo médico.")) {
    return;
  }
  p.arquivado = true;
  p.dataArquivamento = dataHoje();
  salvar();
  avisar("Registro arquivado conforme norma.");
}

function restaurarPaciente(id) {
  const p = buscar(id);
  p.arquivado = false;
  p.dataArquivamento = "";
  salvar();
  avisar("Registro restaurado.");
}

function removerPaciente(id) {
  const p = buscar(id);
  if (!confirm("Remover definitivamente o registro de " + p.nome + "? Esta ação não pode ser desfeita.")) {
    return;
  }
  pacientes = pacientes.filter(x => x.id !== id);
  salvar();
  avisar("Registro removido.");
}

function preencherPacientes(idSelect, idSelecionado) {
  const lista = pacientesAtivos();
  $(idSelect).innerHTML = lista.map(p => `<option value="${p.id}">${escapar(p.nome)}</option>`).join("");
  $(idSelect).disabled = Boolean(idSelecionado);
  if (idSelecionado) {
    $(idSelect).value = idSelecionado;
  }
}

function novoTratamento(idPaciente) {
  if (pacientesAtivos().length === 0) {
    avisar("Cadastre um paciente antes de continuar.");
    return;
  }
  $("form-tratamento").reset();
  $("t-id").value = "";
  $("titulo-modal-tratamento").textContent = "Novo tratamento";
  preencherPacientes("t-paciente", idPaciente);
  abrirModal("modal-tratamento");
  $("t-nome").focus();
}

function editarTratamento(idPaciente, idTratamento) {
  const t = buscar(idPaciente).tratamentos.find(x => x.id === idTratamento);
  $("form-tratamento").reset();
  $("t-id").value = t.id;
  $("t-nome").value = t.nome;
  $("t-descricao").value = t.descricao;
  $("t-status").value = t.status;
  $("titulo-modal-tratamento").textContent = "Atualizar tratamento";
  preencherPacientes("t-paciente", idPaciente);
  abrirModal("modal-tratamento");
}

function novoExame(idPaciente) {
  if (pacientesAtivos().length === 0) {
    avisar("Cadastre um paciente antes de continuar.");
    return;
  }
  $("form-exame").reset();
  $("e-id").value = "";
  $("e-data").value = dataHoje();
  $("titulo-modal-exame").textContent = "Registrar exame";
  preencherPacientes("e-paciente", idPaciente);
  abrirModal("modal-exame");
  $("e-nome").focus();
}

function editarExame(idPaciente, idExame) {
  const e = buscar(idPaciente).exames.find(x => x.id === idExame);
  $("form-exame").reset();
  $("e-id").value = e.id;
  $("e-nome").value = e.nome;
  $("e-data").value = e.data;
  $("e-resultado").value = e.resultado;
  $("titulo-modal-exame").textContent = "Atualizar exame";
  preencherPacientes("e-paciente", idPaciente);
  abrirModal("modal-exame");
}

function abrirProntuario(id) {
  const p = buscar(id);
  let html = "";

  if (temAlerta(p)) {
    html += `
      <div class="alerta-critico">
        <b>Alerta crítico</b>
        <span>Alergias: ${escapar(p.alergias)}</span>
      </div>`;
  }

  html += `
    <div class="bloco">
      <h4>Identificação</h4>
      <p>Código: ${p.id}
CPF: ${escapar(p.cpf)}
Nascimento: ${formatarData(p.nascimento)}
Status: ${p.arquivado ? "Arquivado" : escapar(p.status)}
Telefone: ${escapar(p.telefone) || "Não informado"}
E-mail: ${escapar(p.email) || "Não informado"}
Endereço: ${escapar(p.endereco) || "Não informado"}
Convênio: ${escapar(p.convenio)}</p>
    </div>
    <div class="bloco">
      <h4>Histórico médico</h4>
      <p>${escapar(p.historico)}</p>
    </div>
    <div class="bloco">
      <h4>Observações médicas</h4>
      <p>${escapar(p.observacoes)}</p>
    </div>`;

  const tratamentos = p.tratamentos.map(t => `
    <div class="linha">
      <div>
        <b>${escapar(t.nome)}</b>
        <small>${escapar(t.descricao) || "Sem descrição"} · ${formatarData(t.data)}</small>
      </div>
      <div>
        <span class="pill ${classeTratamento(t.status)}">${t.status}</span>
        ${p.arquivado ? "" : `<button class="botao-link" onclick="editarTratamento('${p.id}', '${t.id}')">Atualizar</button>`}
      </div>
    </div>`).join("");

  const exames = p.exames.map(e => `
    <div class="linha">
      <div>
        <b>${escapar(e.nome)}</b>
        <small>${escapar(e.resultado) || "Resultado pendente"} · ${formatarData(e.data)}</small>
      </div>
      ${p.arquivado ? "" : `<button class="botao-link" onclick="editarExame('${p.id}', '${e.id}')">Atualizar</button>`}
    </div>`).join("");

  html += `
    <div class="bloco">
      <h4>Plano de tratamento (${p.tratamentos.length})</h4>
      ${tratamentos || "<p>Nenhum tratamento registrado.</p>"}
    </div>
    <div class="bloco">
      <h4>Exames (${p.exames.length})</h4>
      ${exames || "<p>Nenhum exame registrado.</p>"}
    </div>`;

  if (!p.arquivado) {
    html += `
      <div class="acoes-prontuario">
        <button class="botao" onclick="editarPaciente('${p.id}')">Editar cadastro</button>
        <button class="botao secundario" onclick="novoTratamento('${p.id}')">Novo tratamento</button>
        <button class="botao secundario" onclick="novoExame('${p.id}')">Novo exame</button>
      </div>`;
  }

  $("titulo-prontuario").textContent = p.nome;
  $("conteudo-prontuario").innerHTML = html;
  abrirModal("modal-prontuario");
}

function renderInicio() {
  const ativos = pacientesAtivos();
  const alertas = ativos.filter(temAlerta);
  let emAndamento = 0;
  let exames = 0;

  ativos.forEach(p => {
    emAndamento += p.tratamentos.filter(t => t.status === "Em andamento").length;
    exames += p.exames.length;
  });

  $("total-pacientes").textContent = ativos.length;
  $("total-tratamentos").textContent = emAndamento;
  $("total-alertas").textContent = alertas.length;
  $("total-exames").textContent = exames;

  $("lista-recentes").innerHTML = ativos.slice(0, 5).map(p => `
    <div class="linha clicavel" onclick="abrirProntuario('${p.id}')">
      <div>
        <b>${escapar(p.nome)}</b>
        <small>${p.id} · ${escapar(p.cpf)}</small>
      </div>
      <span class="pill azul">${escapar(p.status)}</span>
    </div>`).join("") || '<p class="vazio">Nenhum paciente cadastrado.</p>';

  $("lista-alertas").innerHTML = alertas.slice(0, 5).map(p => `
    <div class="alerta-critico">
      <b>${escapar(p.nome)}</b>
      <span>Alergias: ${escapar(p.alergias)}</span>
    </div>`).join("") || '<p class="vazio">Nenhum alerta crítico registrado.</p>';
}

function renderPacientes() {
  const busca = $("busca-pacientes").value.toLowerCase();
  const mostrarTodos = $("filtro-pacientes").value === "todos";

  const lista = pacientes.filter(p => {
    const texto = (p.nome + " " + p.cpf + " " + p.id).toLowerCase();
    return (mostrarTodos || !p.arquivado) && texto.includes(busca);
  });

  $("tabela-pacientes").innerHTML = lista.map(p => `
    <tr>
      <td><b>${escapar(p.nome)}</b><small>${p.id}</small></td>
      <td>${escapar(p.cpf)}</td>
      <td>${escapar(p.telefone) || "—"}</td>
      <td>${escapar(p.convenio)}</td>
      <td><span class="pill ${p.arquivado ? "cinza" : "azul"}">${p.arquivado ? "Arquivado" : escapar(p.status)}</span></td>
      <td>
        <div class="acoes">
          <button class="botao-link" onclick="abrirProntuario('${p.id}')">Ver</button>
          ${p.arquivado ? "" : `
          <button class="botao-link" onclick="editarPaciente('${p.id}')">Editar</button>
          <button class="botao-link" onclick="arquivarPaciente('${p.id}')">Arquivar</button>`}
        </div>
      </td>
    </tr>`).join("") || '<tr><td colspan="6" class="vazio">Nenhum paciente encontrado.</td></tr>';
}

function renderProntuarios() {
  const busca = $("busca-prontuarios").value.toLowerCase();
  const lista = pacientesAtivos().filter(p => (p.nome + " " + p.cpf).toLowerCase().includes(busca));

  $("lista-prontuarios").innerHTML = lista.map(p => `
    <div class="ficha">
      <h3>${escapar(p.nome)}</h3>
      <small>${p.id} · ${escapar(p.status)}</small>
      <p><b>Histórico:</b> ${escapar(p.historico)}</p>
      <p><b>Observações:</b> ${escapar(p.observacoes)}</p>
      <div class="ficha-rodape">
        <span class="pill azul">${p.exames.length} exame(s) · ${p.tratamentos.length} tratamento(s)</span>
        <button class="botao-link" onclick="abrirProntuario('${p.id}')">Abrir prontuário</button>
      </div>
    </div>`).join("") || '<p class="vazio">Nenhum prontuário encontrado.</p>';
}

function renderTratamentos() {
  let html = "";

  pacientesAtivos().forEach(p => {
    p.tratamentos.forEach(t => {
      html += `
        <div class="ficha">
          <h3>${escapar(t.nome)}</h3>
          <small>Paciente: ${escapar(p.nome)}</small>
          <p>${escapar(t.descricao) || "Sem descrição"}</p>
          <div class="ficha-rodape">
            <span class="pill ${classeTratamento(t.status)}">${t.status} · ${formatarData(t.data)}</span>
            <button class="botao-link" onclick="editarTratamento('${p.id}', '${t.id}')">Atualizar</button>
          </div>
        </div>`;
    });
  });

  $("lista-tratamentos").innerHTML = html || '<p class="vazio">Nenhum tratamento registrado.</p>';
}

function renderExames() {
  let linhas = "";

  pacientesAtivos().forEach(p => {
    p.exames.forEach(e => {
      linhas += `
        <tr>
          <td><b>${escapar(e.nome)}</b></td>
          <td>${escapar(p.nome)}</td>
          <td>${formatarData(e.data)}</td>
          <td>${escapar(e.resultado) || "Pendente"}</td>
          <td>
            <div class="acoes">
              <button class="botao-link" onclick="abrirProntuario('${p.id}')">Prontuário</button>
              <button class="botao-link" onclick="editarExame('${p.id}', '${e.id}')">Atualizar</button>
            </div>
          </td>
        </tr>`;
    });
  });

  $("lista-exames").innerHTML = linhas ? `
    <table>
      <thead>
        <tr>
          <th>Exame</th>
          <th>Paciente</th>
          <th>Data</th>
          <th>Resultado</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>` : '<p class="vazio">Nenhum exame registrado.</p>';
}

function renderArquivo() {
  const lista = pacientes.filter(p => p.arquivado);

  $("lista-arquivo").innerHTML = lista.length ? `
    <table>
      <thead>
        <tr>
          <th>Paciente</th>
          <th>CPF</th>
          <th>Arquivado em</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${lista.map(p => `
        <tr>
          <td><b>${escapar(p.nome)}</b></td>
          <td>${escapar(p.cpf)}</td>
          <td>${formatarData(p.dataArquivamento)}</td>
          <td>
            <div class="acoes">
              <button class="botao-link" onclick="abrirProntuario('${p.id}')">Consultar</button>
              <button class="botao-link" onclick="restaurarPaciente('${p.id}')">Restaurar</button>
              <button class="botao-link" onclick="removerPaciente('${p.id}')">Remover</button>
            </div>
          </td>
        </tr>`).join("")}
      </tbody>
    </table>` : '<p class="vazio">Não há registros arquivados.</p>';
}

function renderTudo() {
  renderInicio();
  renderPacientes();
  renderProntuarios();
  renderTratamentos();
  renderExames();
  renderArquivo();
}

$("p-cpf").addEventListener("input", function () {
  let valor = this.value.replace(/\D/g, "").slice(0, 11);
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  this.value = valor;
});

$("form-paciente").addEventListener("submit", function (evento) {
  evento.preventDefault();

  const id = $("p-id").value;
  const dados = {
    nome: $("p-nome").value.trim(),
    cpf: $("p-cpf").value.trim(),
    nascimento: $("p-nascimento").value,
    telefone: $("p-telefone").value.trim(),
    email: $("p-email").value.trim(),
    endereco: $("p-endereco").value.trim(),
    convenio: $("p-convenio").value.trim() || "Não informado",
    status: $("p-status").value,
    alergias: $("p-alergias").value.trim() || "Não informado",
    historico: $("p-historico").value.trim() || "Não informado",
    observacoes: $("p-observacoes").value.trim() || "Sem observações"
  };

  if (dados.cpf.length !== 14) {
    avisar("Informe o CPF completo.");
    return;
  }

  if (pacientes.some(p => p.cpf === dados.cpf && p.id !== id)) {
    avisar("Já existe um paciente com este CPF.");
    return;
  }

  if (id) {
    Object.assign(buscar(id), dados);
    avisar("Cadastro do paciente atualizado.");
  } else {
    pacientes.unshift({
      id: gerarId(),
      ...dados,
      tratamentos: [],
      exames: [],
      arquivado: false,
      dataArquivamento: ""
    });
    avisar("Paciente cadastrado com sucesso.");
  }

  salvar();
  fecharModal("modal-paciente");
});

$("form-tratamento").addEventListener("submit", function (evento) {
  evento.preventDefault();

  const paciente = buscar($("t-paciente").value);
  const idTratamento = $("t-id").value;
  const dados = {
    nome: $("t-nome").value.trim(),
    descricao: $("t-descricao").value.trim(),
    status: $("t-status").value
  };

  if (idTratamento) {
    Object.assign(paciente.tratamentos.find(t => t.id === idTratamento), dados);
  } else {
    paciente.tratamentos.unshift({ id: gerarId(), data: dataHoje(), ...dados });
  }

  salvar();
  fecharModal("modal-tratamento");
  atualizarProntuarioAberto(paciente.id);
  avisar("Plano de tratamento atualizado.");
});

$("form-exame").addEventListener("submit", function (evento) {
  evento.preventDefault();

  const paciente = buscar($("e-paciente").value);
  const idExame = $("e-id").value;
  const dados = {
    nome: $("e-nome").value.trim(),
    data: $("e-data").value,
    resultado: $("e-resultado").value.trim()
  };

  if (idExame) {
    Object.assign(paciente.exames.find(e => e.id === idExame), dados);
  } else {
    paciente.exames.unshift({ id: gerarId(), ...dados });
  }

  salvar();
  fecharModal("modal-exame");
  atualizarProntuarioAberto(paciente.id);
  avisar("Exame registrado no prontuário.");
});

document.querySelectorAll(".fundo").forEach(fundo => {
  fundo.addEventListener("click", function (evento) {
    if (evento.target === fundo) {
      fundo.classList.remove("aberto");
    }
  });
});

$("saudacao").textContent = saudacao() + "! Bem-vindo ao LifeCare.";
$("data-hoje").textContent = new Date().toLocaleDateString("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric"
});

renderTudo();
