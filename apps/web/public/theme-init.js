// Aplica o tema antes da primeira pintura (evita flash). Arquivo externo por causa da CSP.
;(function () {
  try {
    var preferencia = localStorage.getItem('tema')
    var escuro =
      preferencia === 'escuro' ||
      (preferencia !== 'claro' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', escuro)
  } catch (e) {
    // localStorage indisponível: mantém o tema claro
  }
})()
