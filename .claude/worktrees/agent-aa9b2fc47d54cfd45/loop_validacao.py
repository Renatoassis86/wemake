"""Loop ate o robo conseguir submeter o formulario com sucesso."""
import subprocess, time, sys

MAX_TENTATIVAS = 8
INTERVALO = 30   # segundos entre tentativas

for i in range(1, MAX_TENTATIVAS + 1):
    print(f'\n{"="*64}\nTENTATIVA {i}/{MAX_TENTATIVAS}\n{"="*64}')
    r = subprocess.run([sys.executable, 'teste_robo_formulario.py'],
                       capture_output=True, text=True, timeout=180)
    out = r.stdout + r.stderr
    # Procura linhas chave
    sucesso = '[SUCESSO]' in out
    delta = None
    for line in out.splitlines():
        if 'Registros agora' in line:
            print('  ' + line.strip())
        if 'delta:' in line:
            try:
                delta = int(line.split('delta:')[1].split(')')[0].strip())
            except:
                pass
        if 'Erro:' in line or 'Erro ao' in line or 'SEVERE' in line:
            if 'row-level' in line or 'violates' in line:
                print('  ! erro do servidor:', line.strip()[-200:])
        if '[SUCESSO]' in line or '[FALHA]' in line:
            print('  ' + line.strip())

    if sucesso:
        print(f'\n>>> SUCESSO na tentativa {i} <<<')
        sys.exit(0)
    if i < MAX_TENTATIVAS:
        print(f'\n  aguardando {INTERVALO}s antes da proxima tentativa...')
        time.sleep(INTERVALO)

print('\nMaximo de tentativas atingido.')
sys.exit(1)
