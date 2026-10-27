# Cadastro de clientes para preparação de testes e exames

Este projeto contém uma página de cadastro em HTML/JavaScript e um endpoint em Google Apps Script para gravar os dados na aba `CLIENTES` da planilha Google Sheets existente.

## Estrutura

- `index.html` — página única do formulário de cadastro
- `apps-script/Code.gs` — endpoint para receber e gravar os dados

## Configuração inicial

O URL publicado do Apps Script está definido em `GOOGLE_APPS_SCRIPT_URL` no ficheiro `index.html`. Se publicar outro endpoint, atualize essa constante.

```js
const GOOGLE_APPS_SCRIPT_URL = 'COLOQUE_AQUI_O_URL_PUBLICADO_DO_APPS_SCRIPT';
```

## Publicar o Google Apps Script

1. Abra o Google Apps Script no Google Drive.
2. Crie um novo projeto.
3. Cole o conteúdo de `apps-script/Code.gs`.
4. Na barra de menu, vá a `Implementar` > `Nova implementação` e escolha `Aplicação Web`.
5. Em `Quem tem acesso`, escolha a opção adequada ao seu caso: `Qualquer pessoa` ou `Qualquer utilizador da conta Google`.
6. Copie a URL gerada.
7. Atualize `GOOGLE_APPS_SCRIPT_URL` no `index.html` se a URL tiver mudado.
8. Guarde e volte a implementar uma nova versão sempre que alterar o código do Apps Script.

O formulário envia JSON como `text/plain` para evitar o preflight CORS causado por `application/json`. Este formato também é aceite pela versão anterior do endpoint. A versão atual de `apps-script/Code.gs` continua a ser a recomendada, especialmente para encontrar cabeçalhos que começam na segunda linha.

O Apps Script grava os dados na primeira linha de cliente vazia abaixo dos cabeçalhos, em vez de usar `appendRow()`. Assim, linhas já formatadas da tabela são reutilizadas e a coluna de estado de pagamento não é alterada.

## Publicar o site com GitHub Pages

1. Envie o conteúdo deste projeto para um repositório GitHub com a branch `main`.
2. Em `Settings` > `Pages`, confirme que a publicação através de GitHub Actions está disponível.
3. O workflow `.github/workflows/pages.yml` publica automaticamente o site em cada envio à branch `main`.
4. Aguarde a conclusão do workflow e abra a URL indicada em `Settings` > `Pages`.

O ficheiro da planilha não faz parte da publicação; mantenha-o apenas local e privado.

## Como testar o cadastro

1. Abra a pasta do projeto num terminal e sirva a página localmente:
   ```bash
   python -m http.server 8000
   ```
2. Aceda em `http://localhost:8000` no navegador.
3. Preencha os campos obrigatórios:
   - Nome completo
   - Telefone/WhatsApp
   - Valor contratado (Kz)
4. Clique em `Cadastrar cliente`.
5. Confirme que a página mostra a mensagem `Cliente cadastrado com sucesso!`.
6. Abra a planilha Google Sheets e verifique a aba `CLIENTES`.
7. A nova linha deve incluir:
   - ID gerado no formato `CLI-0001`, `CLI-0002`, etc.
   - Data de cadastro em `Africa/Luanda`
   - Nome, BI, e-mail, telefone, valor, dia da prova/teste, status de pagamento e observações.
   - A coluna `Status de pagamento` fica vazia para a fórmula da planilha calcular automaticamente.

Importante: abrir `index.html` diretamente com `file://` pode bloquear o `fetch` do navegador com `Failed to fetch`. Use um servidor HTTP local ou o endereço do GitHub Pages.

## Campos e mapeamento

O formulário mapear para a aba `CLIENTES` da seguinte forma:

| Formulário | Coluna da planilha |
| --- | --- |
| Nome completo | Nome completo |
| BI | BI (opcional) |
| E-mail | Email |
| Telefone | Telefone |
| Valor contratado (Kz) | Valor contratado (Kz) |
| Dia do teste (Outubro/2026) | Dia da prova/teste |
| Observações | Nota/observações |

A coluna `Status de pagamento` fica vazia no envio para permitir que a fórmula existente da planilha continue a calcular o valor automaticamente. O `ID` e a `Data de cadastro` são gerados pelo sistema e não aparecem no formulário.

## Configurações a preencher antes de utilizar

- URL pública do Apps Script
- Garantir que a planilha contém a aba `CLIENTES`
- Confirmar que as colunas esperadas existem na aba `CLIENTES`
- Validar o acesso do web app conforme o nível pretendido

## Observações importantes

- O formulário não altera outras folhas da planilha.
- Não é escrito diretamente sobre células com fórmula.
- O botão é desativado durante o envio para evitar duplicações.
- O formulário é limpo após confirmação de sucesso, mantendo a página aberta para registrar outro cliente.
- O campo `Estado de pagamento` fica em branco para a fórmula da planilha calcular automaticamente.
