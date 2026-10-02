/** Aparece enquanto o SQL da gestão ainda não foi aplicado no Supabase. */
export default function SetupNotice({ erro, sql = 'academia_gestao.sql' }: { erro?: string; sql?: string }) {
  return (
    <section className="ac-setup" aria-labelledby="setup-t">
      <p className="ac-kicker">Falta um passo</p>
      <h2 id="setup-t">{erro ? 'Não foi possível ler os dados da gestão' : 'As tabelas da gestão ainda não existem no banco'}</h2>
      {erro ? (
        <p>O banco respondeu: <code>{erro}</code></p>
      ) : (
        <>
          <p>
            O arquivo <code>{sql}</code>, na raiz do projeto, cria as tabelas e a proteção de acesso que esta área precisa. Ele pode ser rodado mais de uma vez.
          </p>
          <ol>
            <li>Abra o Supabase do projeto e entre em <strong>SQL Editor</strong>.</li>
            <li>Cole o conteúdo de <code>{sql}</code> e clique em <strong>Run</strong>.</li>
            <li>Volte a esta página e atualize.</li>
          </ol>
        </>
      )}
    </section>
  )
}
