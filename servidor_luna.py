import http.server
import socketserver
import webbrowser
import threading
import time

# ==============================================================================
#            SERVIDOR PARA O JOGO LUNA ARCADE (Linguagem Python)
# ==============================================================================
# Se você nunca programou em Python, aqui está o que este script faz:
# 
# 1. Ele cria um "Servidor Local". Isso transforma seu computador em um 
#    site que pode ser acessado pelo navegador no endereço "localhost:8080".
# 2. Ele ajuda o navegador a carregar os arquivos (Imagens, Sons, Código)
#    corretamente, sem problemas de segurança que acontecem se você apenas
#    clicar no arquivo "index.html".
# ==============================================================================

PORT = 8080 # A porta onde o site vai funcionar (como o número de um ramal de telefone)

# Esta é a configuração básica do servidor oficial do Python
Handler = http.server.SimpleHTTPRequestHandler

def abrir_navegador():
    """ 
    Esta função espera 2 segundos (pra o servidor ter tempo de ligar)
    e depois abre o navegador automaticamente na página do jogo.
    """
    time.sleep(2)
    print(f"Abrindo o jogo em: http://localhost:{PORT}")
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == "__main__":
    # Criamos o servidor usando as configurações acima
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Servidor iniciado com sucesso na porta {PORT}!")
        print("Mantenha esta janela aberta para o jogo funcionar.")
        
        # Iniciamos a tarefa de abrir o navegador em segundo plano
        t = threading.Thread(target=abrir_navegador)
        t.start()
        
        # O servidor entra em "loop" e fica servindo os arquivos do jogo
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nFechando o servidor...")
            httpd.shutdown()
