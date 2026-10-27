function doGet() {
  return jsonResponse({
    ok: true,
    message: 'Endpoint do Google Apps Script está ativo.'
  });
}

function doPost(e) {
  try {
    const payload = parseRequestPayload(e);
    const validationErrors = validateIncomingData(payload);

    if (validationErrors.length > 0) {
      return jsonResponse({
        ok: false,
        message: validationErrors.join(' '),
        errors: validationErrors
      });
    }

    const sheet = getClientSheet();
    const headerRowNumber = findHeaderRowNumber(sheet);
    const nextClientId = generateNextClientId(sheet, headerRowNumber);
    const row = buildRow(sheet, payload, nextClientId, headerRowNumber);
    const rowNumber = findNextAvailableRow(sheet, headerRowNumber);
    row.forEach((field) => {
      sheet.getRange(rowNumber, field.column).setValue(field.value);
    });

    return jsonResponse({
      ok: true,
      message: 'Cliente cadastrado com sucesso!',
      id: nextClientId,
      rowNumber: rowNumber
    });
  } catch (error) {
    const message = error && error.message ? error.message : 'Erro interno ao gravar o cliente.';
    return jsonResponse({
      ok: false,
      message: message
    });
  }
}

function parseRequestPayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Pedido sem conteúdo válido.');
  }

  let parsed;
  try {
    parsed = e.parameter && e.parameter.payload
      ? JSON.parse(e.parameter.payload)
      : JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('Formato de dados inválido.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Os dados enviados não são válidos.');
  }

  return parsed;
}

function validateIncomingData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return ['Dados inválidos.'];
  }

  const nomeCompleto = String(data.nomeCompleto || '').trim();
  const telefone = String(data.telefone || '').trim();
  const valorContratado = Number(data.valorContratado);
  const email = String(data.email || '').trim();
  const diaTeste = String(data.dataTeste || '').trim();

  if (!nomeCompleto) {
    errors.push('O nome completo é obrigatório.');
  }

  if (!telefone) {
    errors.push('O número de telefone/WhatsApp é obrigatório.');
  }

  if (!Number.isFinite(valorContratado) || valorContratado < 0) {
    errors.push('O valor contratado deve ser numérico e não negativo.');
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('O e-mail introduzido não é válido.');
  }

  if (diaTeste) {
    const dia = Number(diaTeste);
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
      errors.push('O dia do teste deve estar entre 1 e 31.');
    }
  }

  return errors;
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CLIENT_HEADER_ALIASES = [
  ['id'],
  ['data de cadastro', 'data de registo'],
  ['nome completo'],
  ['bi opcional', 'bi'],
  ['email', 'e mail'],
  ['telefone'],
  ['valor contratado kz', 'valor contratado'],
  ['dia da prova teste', 'dia do teste', 'data do teste'],
  ['status de pagamento', 'estado do pagamento'],
  ['status da preparacao', 'estado da preparacao'],
  ['nota observacoes', 'observacoes', 'nota']
];

function findHeaderRowNumber(sheet) {
  const maxScanRows = Math.min(sheet.getLastRow(), 20);
  if (maxScanRows === 0) {
    throw new Error('A aba CLIENTES está vazia; não encontrei a linha de cabeçalhos.');
  }

  const headerCandidates = sheet.getRange(1, 1, maxScanRows, Math.max(sheet.getLastColumn(), 20)).getValues();

  for (let rowIndex = 0; rowIndex < headerCandidates.length; rowIndex += 1) {
    const rowValues = headerCandidates[rowIndex].map((header) => normalizeHeader(header));
    const rowMatches = CLIENT_HEADER_ALIASES.filter((aliases) => aliases.some((alias) => rowValues.includes(normalizeHeader(alias))));
    if (rowMatches.length >= 5) {
      return rowIndex + 1;
    }
  }

  const foundHeaders = headerCandidates
    .flat()
    .map((header) => String(header || '').trim())
    .filter(Boolean);
  throw new Error('Não encontrei os cabeçalhos da aba CLIENTES nas primeiras 20 linhas. Cabeçalhos encontrados: ' + foundHeaders.join(' | '));
}

function getClientSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('CLIENTES');

  if (!sheet) {
    throw new Error('A aba CLIENTES não foi encontrada na planilha.');
  }

  const headerRowNumber = findHeaderRowNumber(sheet);
  const headerRow = sheet.getRange(headerRowNumber, 1, 1, Math.max(sheet.getLastColumn(), 20)).getValues()[0];
  const existingHeaders = headerRow.map((header) => normalizeHeader(header));
  const missingHeaders = CLIENT_HEADER_ALIASES.filter((aliases) => !aliases.some((alias) => existingHeaders.includes(normalizeHeader(alias))));

  if (missingHeaders.length > 0) {
    const foundHeaders = headerRow
      .map((header) => String(header || '').trim())
      .filter(Boolean);
    throw new Error(
      'A aba CLIENTES não contém todas as colunas esperadas. Em falta: ' +
      missingHeaders.map((aliases) => aliases[0]).join(', ') +
      '. Cabeçalhos encontrados: ' +
      foundHeaders.join(' | ')
    );
  }

  return sheet;
}

function buildRow(sheet, data, clientId, headerRowNumber) {
  const registrationDate = Utilities.formatDate(new Date(), 'Africa/Luanda', 'yyyy-MM-dd HH:mm:ss');
  const headerRow = sheet.getRange(headerRowNumber || 2, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headers = headerRow.map((header, index) => ({ header: normalizeHeader(header), index }));

  const fieldsToWrite = [];

  const setValue = (headerNames, value) => {
    const targetAliases = Array.isArray(headerNames) ? headerNames : [headerNames];
    const found = headers.find((item) => targetAliases.some((alias) => item.header === normalizeHeader(alias)));
    if (!found) return;
    fieldsToWrite.push({ column: found.index + 1, value: value });
  };

  setValue(['ID', 'Id'], clientId);
  setValue(['Data de cadastro', 'Data de registo'], registrationDate);
  setValue(['Nome completo'], String(data.nomeCompleto || '').trim());
  setValue(['BI (opcional)', 'BI'], String(data.bi || '').trim());
  setValue(['Email'], String(data.email || '').trim());
  setValue(['Telefone'], String(data.telefone || '').trim());
  setValue(['Valor contratado (Kz)', 'Valor contratado'], Number(data.valorContratado || 0));
  setValue(['Dia da prova/teste', 'Dia do teste', 'Data do teste'], String(data.dataTeste || '').trim());
  setValue(['Status da preparação', 'Estado da preparação'], '');
  setValue(['Nota/observações', 'Observações', 'Nota'], String(data.observacoes || '').trim());

  return fieldsToWrite;
}

function findNextAvailableRow(sheet, headerRowNumber) {
  const headerRow = sheet.getRange(headerRowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const normalizedHeaders = headerRow.map((header) => normalizeHeader(header));
  const paymentStatusAliases = ['status de pagamento', 'estado do pagamento'];
  const paymentStatusColumn = normalizedHeaders.findIndex((header) =>
    paymentStatusAliases.some((alias) => header === normalizeHeader(alias))
  );
  const firstDataRow = headerRowNumber + 1;
  const maxRows = sheet.getMaxRows();
  if (firstDataRow > maxRows) {
    sheet.insertRowsAfter(maxRows, firstDataRow - maxRows);
  }

  const lastRowToScan = Math.min(Math.max(sheet.getLastRow() + 1, firstDataRow), sheet.getMaxRows());
  const rowsToScan = lastRowToScan - firstDataRow + 1;
  const displayRows = sheet.getRange(firstDataRow, 1, rowsToScan, sheet.getLastColumn()).getDisplayValues();

  for (let rowIndex = 0; rowIndex < displayRows.length; rowIndex += 1) {
    const hasData = displayRows[rowIndex].some((value, columnIndex) =>
      columnIndex !== paymentStatusColumn && String(value || '').trim() !== ''
    );
    if (!hasData) {
      return firstDataRow + rowIndex;
    }
  }

  const nextRow = lastRowToScan + 1;
  if (nextRow > maxRows) {
    sheet.insertRowsAfter(maxRows, 1);
  }
  return nextRow;
}

function generateNextClientId(sheet, headerRowNumber) {
  const headerRow = sheet.getRange(headerRowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idColumnIndex = headerRow.findIndex((header) => normalizeHeader(header) === 'id');
  if (idColumnIndex === -1) {
    throw new Error('A coluna ID não foi encontrada na aba CLIENTES.');
  }

  const firstDataRow = headerRowNumber + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < firstDataRow) {
    return 'CLI-0001';
  }

  const ids = sheet.getRange(firstDataRow, idColumnIndex + 1, lastRow - firstDataRow + 1, 1).getValues().flat();
  let maxNumber = 0;

  ids.forEach((value) => {
    if (!value) return;
    const match = String(value).match(/^CLI-(\d+)$/i);
    if (!match) return;
    const numericPart = parseInt(match[1], 10);
    if (!Number.isNaN(numericPart) && numericPart > maxNumber) {
      maxNumber = numericPart;
    }
  });

  return 'CLI-' + String(maxNumber + 1).padStart(4, '0');
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
