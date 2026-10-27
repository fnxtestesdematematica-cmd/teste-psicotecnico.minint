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

1. Abra o projeto Google Apps Script associado à planilha de destino.
2. Substitua o código pelo conteúdo de `apps-script/Code.gs` e salve.
3. Vá a `Implementar` > `Gerir implementações`, edite a aplicação Web e escolha `Nova versão`.
4. Mantenha a permissão necessária para o site enviar cadastros e clique em `Implementar`.
5. Se a URL da implementação mudar, atualize `GOOGLE_APPS_SCRIPT_URL` no `index.html`.

O formulário envia JSON como `text/plain` para evitar o preflight CORS causado por `application/json`.

O Apps Script procura a primeira linha em que a célula `ID` está realmente vazia (sem valor nem fórmula), independentemente das outras células da linha. Sob bloqueio para evitar colisões entre envios simultâneos, copia a formatação, altura, validações e fórmulas da linha-modelo anterior e grava somente os campos do cliente. Um filtro existente não é alterado; se não houver uma linha vazia dentro do seu intervalo, o script recusa o cadastro com uma mensagem explícita em vez de escrever fora da tabela.

Se a célula de estado de pagamento da linha tiver fórmula, a fórmula é mantida e o formulário apresenta um aviso. Se não tiver fórmula, o estado escolhido é gravado normalmente.

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
4. Para testar sem risco, use uma cópia da planilha e um Apps Script associado a essa cópia.
5. Clique em `Cadastrar cliente` e confirme o ID e número da linha mostrados na mensagem.
6. Abra a aba `CLIENTES` na cópia e confirme o registo, a formatação e as fórmulas.
7. Depois da validação, implemente o código no Apps Script associado à planilha de produção.
8. A nova linha deve incluir:
   - ID gerado no formato `CLI-0001`, `CLI-0002`, etc.
   - Data de cadastro em `Africa/Luanda`
   - Nome, BI, e-mail, telefone, valor, dia da prova/teste, status de pagamento e observações.
   - O estado de pagamento selecionado, se a célula não tiver fórmula.

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
| Estado de pagamento | Status de pagamento |
| Observações | Nota/observações |

O formulário exige a seleção de `Pago`, `Pendente` ou `Pagamento incompleto`. A escolha é gravada na coluna `Status de pagamento` somente se a célula de destino não tiver fórmula. O `ID` e a `Data de cadastro` são gerados pelo sistema e não aparecem no formulário.

## Configurações a preencher antes de utilizar

- URL pública do Apps Script
- Garantir que a planilha contém a aba `CLIENTES`
- Confirmar que as colunas esperadas existem na aba `CLIENTES`
- Validar o acesso do web app conforme o nível pretendido

## Observações importantes

- O formulário não altera outras folhas da planilha.
- As colunas não preenchidas pelo formulário, incluindo `Status da preparação`, não são alteradas; fórmulas de destino nunca são substituídas por valores.
- O botão é desativado durante o envio para evitar duplicações.
- O formulário é limpo após confirmação de sucesso, mantendo a página aberta para registrar outro cliente.
- O estado de pagamento escolhido é gravado se a célula não contiver fórmula; uma fórmula existente é preservada.
