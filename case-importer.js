(function () {
  'use strict';

  const PANEL_ID = 'case-importer-panel';
  const XLSX_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  const DEFAULT_STORAGE_KEY = 'amiun_cases';

  const FIELD_ALIASES = {
    requestDate: ['INGRESADO', 'INGRESOS', 'FECHA PEDIDO', 'FECHA DE PEDIDO', 'FECHA'],
    vin: ['VIN', 'CHASIS'],
    orderNumber: ['NRO OR', 'N OR', 'NRO ORDEN', 'NUMERO OR', 'NUMERO DE ORDEN', 'N ORDEN', 'NRO DE ORDEN', 'N.º OR', 'N° OR', 'OR'],
    plate: ['PATENTE', 'DOMINIO'],
    client: ['CLIENTE', 'NOMBRE CLIENTE'],
    phone: ['TELEFONO', 'TELÉFONO', 'CELULAR'],
    saleDate: ['FECHA DE VENTA', 'FECHA VENTA', 'ENTREGA'],
    mileage: ['KM', 'KILOMETRAJE'],
    priority: ['PRIORIDAD'],
    vor: ['VOR'],
    observations: ['OBSERVACIONES', 'OBSERVACION'],
    partCode: ['CODIGO REPUESTO', 'CODIGO DE REPUESTO', 'CÓDIGO REPUESTO', 'CÓDIGO DE REPUESTO', 'CODIGO', 'CÓDIGO'],
    partDescription: ['DESCRIPCION REPUESTO', 'DESCRIPCIÓN REPUESTO', 'DESCRIPCION DE REPUESTO', 'DESCRIPCIÓN DE REPUESTO', 'DESCRIPCION', 'DESCRIPCIÓN', 'REPUESTO'],
    repairTime: ['TIEMPO DE REPARACION', 'TIEMPO DE REPARACIÓN', 'TIEMPO REP', 'TIEMPO REPARACION', 'TIEMPO REPARACIÓN'],
    arrivalDate: ['FECHA ARRIBO', 'FECHA DE ARRIBO'],
    arrived: ['ARRIBO', 'ARRIBADO'],
    appointmentDate: ['FECHA TURNO', 'FECHA DEL TURNO'],
    appointmentTime: ['HORA TURNO', 'HORA DEL TURNO', 'HORA'],
    status: ['ESTADO']
  };

  const CASE_KEY_ALIASES = {
    requestDate: ['requestDate', 'fechaPedido', 'fecha', 'ingresado', 'createdDate'],
    vin: ['vin', 'VIN', 'chasis'],
    orderNumber: ['orderNumber', 'nroOr', 'nroOR', 'nro_or', 'orNumber', 'or', 'numeroOrden', 'nroOrden'],
    plate: ['plate', 'patente', 'licensePlate'],
    client: ['client', 'cliente', 'customer'],
    phone: ['phone', 'telefono', 'teléfono'],
    saleDate: ['saleDate', 'fechaVenta'],
    mileage: ['mileage', 'km', 'kilometraje'],
    priority: ['priority', 'prioridad'],
    vor: ['vor', 'isVor', 'VOR'],
    observations: ['observations', 'observaciones'],
    partCode: ['partCode', 'codigoRepuesto', 'codigo', 'code'],
    partDescription: ['partDescription', 'descripcionRepuesto', 'repuesto', 'descripcion'],
    repairTime: ['repairTime', 'tiempoReparacion', 'tiempoRep'],
    arrivalDate: ['arrivalDate', 'fechaArribo'],
    arrived: ['arrived', 'arribo', 'isArrived'],
    appointmentDate: ['appointmentDate', 'fechaTurno'],
    appointmentTime: ['appointmentTime', 'horaTurno'],
    programmed: ['programmed', 'programado', 'isProgrammed'],
    status: ['status', 'estado']
  };

  let parsedPreview = [];
  let selectedFile = null;

  function normalizeHeader(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[º°.\-_/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeValue(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function isBlank(value) {
    return value === null || value === undefined || String(value).trim() === '';
  }

  function parseBoolean(value) {
    if (value === true || value === false) return value;
    const text = normalizeHeader(value);
    if (['TRUE', 'SI', 'SÍ', '1', 'X', 'YES', 'VERDADERO'].includes(text)) return true;
    if (['FALSE', 'NO', '0', 'FALSO'].includes(text)) return false;
    return null;
  }

  function pad2(num) {
    return String(num).padStart(2, '0');
  }

  function fromExcelDate(serial) {
    const utcDays = Math.floor(Number(serial) - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    const fractionalDay = Number(serial) - Math.floor(Number(serial));
    const totalSeconds = Math.round(86400 * fractionalDay);
    dateInfo.setSeconds(dateInfo.getSeconds() + totalSeconds);
    return {
      date: `${dateInfo.getUTCFullYear()}-${pad2(dateInfo.getUTCMonth() + 1)}-${pad2(dateInfo.getUTCDate())}`,
      time: `${pad2(dateInfo.getUTCHours())}:${pad2(dateInfo.getUTCMinutes())}`
    };
  }

  function parseDateTime(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return {
        date: `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`,
        time: `${pad2(value.getHours())}:${pad2(value.getMinutes())}`
      };
    }
    if (typeof value === 'number' && value > 20000 && value < 80000) {
      return fromExcelDate(value);
    }
    const raw = normalizeValue(value);
    if (!raw) return { date: '', time: '' };
    const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
    const time = timeMatch ? `${pad2(timeMatch[1])}:${timeMatch[2]}` : '';
    const dateMatch = raw.match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (!dateMatch) return { date: raw, time };

    let a = dateMatch[1];
    let b = dateMatch[2];
    let c = dateMatch[3];
    let year;
    let month;
    let day;
    if (a.length === 4) {
      year = a;
      month = b;
      day = c;
    } else {
      day = a;
      month = b;
      year = c.length === 2 ? `20${c}` : c;
    }
    return { date: `${year}-${pad2(month)}-${pad2(day)}`, time };
  }

  function formatShortDate(isoOrRaw) {
    if (!isoOrRaw) return 'Sin dato';
    const parsed = parseDateTime(isoOrRaw).date;
    const match = parsed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return isoOrRaw;
    return `${match[3]}/${match[2]}/${match[1].slice(2)}`;
  }

  function normalizePriority(value) {
    const text = normalizeHeader(value);
    if (text === 'URGENTE') return 'Urgente';
    if (text === 'ALTA' || text === 'ALTO') return 'Alta';
    if (text === 'MEDIA' || text === 'MEDIO') return 'Media';
    if (text === 'BAJA' || text === 'BAJO') return 'Baja';
    if (text === 'NORMAL') return 'Normal';
    return normalizeValue(value) || 'Normal';
  }

  function normalizeStatus(value, row) {
    const text = normalizeHeader(value);
    const known = {
      'TURNO SIN REPUESTO': 'TURNO SIN REPUESTO',
      'PENDIENTE DE TURNO': 'PENDIENTE DE TURNO',
      'PENDIENTE DE REPUESTO': 'PENDIENTE DE REPUESTO',
      PROGRAMADO: 'PROGRAMADO',
      REALIZADO: 'REALIZADO',
      'DADO DE BAJA': 'DADO DE BAJA',
      REPROGRAMAR: 'REPROGRAMAR'
    };
    if (known[text]) return known[text];
    if (row.arrived && row.appointmentDate) return 'PROGRAMADO';
    if (row.arrived) return 'PENDIENTE DE TURNO';
    return 'PENDIENTE DE REPUESTO';
  }

  function mapRow(rawRow, rowNumber) {
    const mapped = {};
    const normalizedRow = {};
    Object.keys(rawRow || {}).forEach((key) => {
      normalizedRow[normalizeHeader(key)] = rawRow[key];
    });

    Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
      const found = aliases.map(normalizeHeader).find((alias) => Object.prototype.hasOwnProperty.call(normalizedRow, alias));
      if (found) mapped[field] = normalizedRow[found];
    });

    const requestDate = parseDateTime(mapped.requestDate).date;
    const saleDate = parseDateTime(mapped.saleDate).date;
    const arrival = parseDateTime(mapped.arrivalDate);
    const appointment = parseDateTime(mapped.appointmentDate);
    const appointmentTime = parseDateTime(mapped.appointmentTime).time || normalizeValue(mapped.appointmentTime);
    const explicitArrival = parseBoolean(mapped.arrived);
    const arrived = explicitArrival === null ? Boolean(arrival.date) : explicitArrival;

    const caseRow = {
      requestDate,
      vin: normalizeValue(mapped.vin),
      orderNumber: normalizeValue(mapped.orderNumber),
      plate: normalizeValue(mapped.plate).toUpperCase(),
      client: normalizeValue(mapped.client),
      phone: normalizeValue(mapped.phone),
      saleDate,
      mileage: normalizeValue(mapped.mileage),
      priority: normalizePriority(mapped.priority),
      vor: parseBoolean(mapped.vor) === true,
      observations: normalizeValue(mapped.observations),
      partCode: normalizeValue(mapped.partCode),
      partDescription: normalizeValue(mapped.partDescription),
      repairTime: normalizeValue(mapped.repairTime),
      arrivalDate: arrival.date,
      arrived,
      appointmentDate: appointment.date,
      appointmentTime: appointment.time || appointmentTime,
      programmed: Boolean(appointment.date || appointmentTime),
      status: '',
      importedAt: new Date().toISOString(),
      importSource: selectedFile ? selectedFile.name : 'Importación'
    };
    caseRow.status = normalizeStatus(mapped.status, caseRow);

    const detected = Object.entries(caseRow).filter(([, value]) => !isBlank(value) && value !== false).length;
    const omitReason = isBlank(caseRow.orderNumber) ? 'Sin NRO OR: no se puede identificar el caso.' : '';

    return {
      rowNumber,
      raw: rawRow,
      data: caseRow,
      detected,
      valid: !omitReason,
      omitReason,
      mode: 'nuevo'
    };
  }

  function injectStyles() {
    if (document.getElementById('case-importer-styles')) return;
    const style = document.createElement('style');
    style.id = 'case-importer-styles';
    style.textContent = `
      .case-importer-panel{margin-top:24px;border:1px solid #d8dde3;background:#fff;color:#15171a;font-family:inherit}
      .case-importer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:22px 24px;border-top:4px solid #eb0a1e;border-bottom:1px solid #d8dde3;background:#f7f8fa}
      .case-importer-eyebrow{font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#eb0a1e;margin-bottom:6px}
      .case-importer-title{font-size:26px;font-weight:800;line-height:1.1;margin:0 0 6px}
      .case-importer-subtitle{font-size:15px;color:#5d6673;margin:0}
      .case-importer-body{padding:22px 24px}
      .case-importer-warning{display:flex;gap:12px;align-items:flex-start;background:#fff7df;border:1px solid #ead29b;border-left:4px solid #f5b942;padding:14px 16px;margin-bottom:18px}
      .case-importer-warning strong{display:block;margin-bottom:2px}
      .case-importer-grid{display:grid;grid-template-columns:minmax(260px,1fr) auto auto;gap:12px;align-items:end;margin-bottom:16px}
      .case-importer-field label{display:block;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#606975;margin-bottom:8px}
      .case-importer-file{width:100%;box-sizing:border-box;background:#f0f2f4;border:1px solid #cfd6de;padding:14px;font-weight:700}
      .case-importer-btn{border:1px solid #d2d8df;background:#fff;color:#15171a;padding:14px 18px;font-weight:800;cursor:pointer;min-height:48px}
      .case-importer-btn:hover{background:#f0f2f4}
      .case-importer-btn-primary{background:#eb0a1e;border-color:#eb0a1e;color:#fff}
      .case-importer-btn-primary:hover{background:#c90013}
      .case-importer-btn:disabled{opacity:.45;cursor:not-allowed}
      .case-importer-stats{display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));border:1px solid #d8dde3;margin:18px 0}
      .case-importer-stat{padding:14px 16px;border-right:1px solid #d8dde3;background:#fff}
      .case-importer-stat:last-child{border-right:0}
      .case-importer-stat span{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.09em;color:#65707d;font-weight:800}
      .case-importer-stat strong{display:block;font-size:28px;margin-top:4px}
      .case-importer-status{margin:12px 0;color:#5d6673;font-weight:700}
      .case-importer-table-wrap{border:1px solid #d8dde3;max-height:360px;overflow:auto;background:#fff}
      .case-importer-table{width:100%;border-collapse:collapse;table-layout:fixed}
      .case-importer-table th{position:sticky;top:0;background:#2b2f34;color:#fff;padding:13px 10px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;text-align:center;z-index:1}
      .case-importer-table td{padding:12px 10px;border-top:1px solid #e6e9ed;text-align:center;vertical-align:middle;overflow-wrap:anywhere}
      .case-importer-table tr:nth-child(even) td{background:#f7f8fa}
      .case-importer-chip{display:inline-block;padding:5px 9px;font-size:12px;font-weight:800;text-transform:uppercase;border:1px solid #d8dde3;background:#f0f2f4}
      .case-importer-chip-new{background:#e9f7ee;color:#2f7d4a;border-color:#cfe8d8}
      .case-importer-chip-update{background:#eef4fb;color:#386c9f;border-color:#d4e4f3}
      .case-importer-chip-omit{background:#fff0f1;color:#d9272e;border-color:#ffd2d6}
      .case-importer-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:16px}
      .case-importer-preview-empty{padding:34px;text-align:center;color:#65707d}
      @media (max-width:900px){
        .case-importer-grid{grid-template-columns:1fr}
        .case-importer-stats{grid-template-columns:repeat(2,1fr)}
        .case-importer-head{flex-direction:column}
      }
    `;
    document.head.appendChild(style);
  }

  function findConfigurationContainer() {
    const candidates = Array.from(document.querySelectorAll('main, [role="main"], .content, .page, section, .app-main, body'));
    return candidates.find((node) => /configuraci[oó]n/i.test(node.textContent || '')) || document.body;
  }

  function ensurePanel() {
    if (document.getElementById(PANEL_ID)) return;
    if (!/configuraci[oó]n/i.test(document.body.textContent || '')) return;
    injectStyles();
    const container = findConfigurationContainer();
    const panel = document.createElement('section');
    panel.id = PANEL_ID;
    panel.className = 'case-importer-panel';
    panel.innerHTML = `
      <div class="case-importer-head">
        <div>
          <div class="case-importer-eyebrow">Carga masiva</div>
          <h2 class="case-importer-title">Importar casos</h2>
          <p class="case-importer-subtitle">Subí Excel o CSV, revisá la vista previa y confirmá antes de impactar la base.</p>
        </div>
      </div>
      <div class="case-importer-body">
        <div class="case-importer-warning">
          <div aria-hidden="true">⚠</div>
          <div>
            <strong>Control de calidad antes de guardar</strong>
            <span>No se inventan datos faltantes. Las filas sin NRO OR quedan omitidas para evitar registros sin trazabilidad.</span>
          </div>
        </div>
        <div class="case-importer-grid">
          <div class="case-importer-field">
            <label for="case-importer-file">Archivo Excel / CSV</label>
            <input id="case-importer-file" class="case-importer-file" type="file" accept=".xlsx,.xls,.csv,.tsv" />
          </div>
          <button id="case-importer-analyze" class="case-importer-btn case-importer-btn-primary" type="button">Analizar archivo</button>
          <button id="case-importer-clear" class="case-importer-btn" type="button">Limpiar</button>
        </div>
        <div class="case-importer-stats" aria-live="polite">
          <div class="case-importer-stat"><span>Filas leídas</span><strong id="case-importer-total">0</strong></div>
          <div class="case-importer-stat"><span>Nuevos</span><strong id="case-importer-new">0</strong></div>
          <div class="case-importer-stat"><span>Actualizados</span><strong id="case-importer-update">0</strong></div>
          <div class="case-importer-stat"><span>Omitidos</span><strong id="case-importer-omit">0</strong></div>
        </div>
        <div id="case-importer-status" class="case-importer-status">Esperando archivo.</div>
        <div class="case-importer-table-wrap">
          <table class="case-importer-table">
            <thead>
              <tr>
                <th style="width:110px">Resultado</th>
                <th style="width:70px">Fila</th>
                <th>NRO OR</th>
                <th>Patente</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th style="width:110px">Datos</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody id="case-importer-preview">
              <tr><td colspan="8"><div class="case-importer-preview-empty">La vista previa aparecerá después de analizar el archivo.</div></td></tr>
            </tbody>
          </table>
        </div>
        <div class="case-importer-actions">
          <button id="case-importer-confirm" class="case-importer-btn case-importer-btn-primary" type="button" disabled>Confirmar importación</button>
        </div>
      </div>
    `;
    container.appendChild(panel);
    bindPanelEvents();
  }

  function bindPanelEvents() {
    const fileInput = document.getElementById('case-importer-file');
    const analyze = document.getElementById('case-importer-analyze');
    const clear = document.getElementById('case-importer-clear');
    const confirm = document.getElementById('case-importer-confirm');
    fileInput.addEventListener('change', () => {
      selectedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      setStatus(selectedFile ? `Archivo seleccionado: ${selectedFile.name}` : 'Esperando archivo.');
    });
    analyze.addEventListener('click', analyzeSelectedFile);
    clear.addEventListener('click', resetImporter);
    confirm.addEventListener('click', confirmImport);
  }

  function setStatus(text) {
    const node = document.getElementById('case-importer-status');
    if (node) node.textContent = text;
  }

  function resetImporter() {
    parsedPreview = [];
    selectedFile = null;
    const fileInput = document.getElementById('case-importer-file');
    if (fileInput) fileInput.value = '';
    updateStats();
    renderPreview();
    setStatus('Esperando archivo.');
    const confirm = document.getElementById('case-importer-confirm');
    if (confirm) confirm.disabled = true;
  }

  function updateStats() {
    const total = parsedPreview.length;
    const omitted = parsedPreview.filter((item) => !item.valid).length;
    const updates = parsedPreview.filter((item) => item.valid && item.mode === 'actualizar').length;
    const news = parsedPreview.filter((item) => item.valid && item.mode === 'nuevo').length;
    setText('case-importer-total', total);
    setText('case-importer-new', news);
    setText('case-importer-update', updates);
    setText('case-importer-omit', omitted);
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function renderPreview() {
    const body = document.getElementById('case-importer-preview');
    if (!body) return;
    if (!parsedPreview.length) {
      body.innerHTML = '<tr><td colspan="8"><div class="case-importer-preview-empty">La vista previa aparecerá después de analizar el archivo.</div></td></tr>';
      return;
    }
    body.innerHTML = parsedPreview.slice(0, 250).map((item) => {
      const chipClass = !item.valid ? 'case-importer-chip-omit' : item.mode === 'actualizar' ? 'case-importer-chip-update' : 'case-importer-chip-new';
      const label = !item.valid ? 'Omitido' : item.mode === 'actualizar' ? 'Actualizar' : 'Nuevo';
      return `
        <tr>
          <td><span class="case-importer-chip ${chipClass}">${label}</span></td>
          <td>${escapeHtml(item.rowNumber)}</td>
          <td><strong>${escapeHtml(item.data.orderNumber || '-')}</strong></td>
          <td>${escapeHtml(item.data.plate || '-')}</td>
          <td>${escapeHtml(item.data.client || '-')}</td>
          <td>${escapeHtml(item.data.status || '-')}</td>
          <td>${escapeHtml(item.detected)}</td>
          <td>${escapeHtml(item.omitReason || buildObservation(item.data))}</td>
        </tr>
      `;
    }).join('');
  }

  function buildObservation(data) {
    const parts = [];
    if (data.requestDate) parts.push(`Pedido ${formatShortDate(data.requestDate)}`);
    if (data.arrived) parts.push('Arribo confirmado');
    if (data.appointmentDate || data.appointmentTime) parts.push('Incluye turno');
    if (data.vor) parts.push('VOR');
    return parts.join(' · ') || 'Sin observaciones.';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  async function analyzeSelectedFile() {
    if (!selectedFile) {
      setStatus('Seleccioná un archivo Excel o CSV antes de analizar.');
      return;
    }
    try {
      setStatus('Analizando archivo...');
      const rows = await readRows(selectedFile);
      const store = findCaseStore();
      const existingOrders = new Set(store.items.map((item) => normalizeValue(getCaseValue(item, 'orderNumber')).toUpperCase()).filter(Boolean));
      parsedPreview = rows.map((row, index) => {
        const mapped = mapRow(row, index + 2);
        if (mapped.valid && existingOrders.has(mapped.data.orderNumber.toUpperCase())) mapped.mode = 'actualizar';
        return mapped;
      });
      updateStats();
      renderPreview();
      const validCount = parsedPreview.filter((item) => item.valid).length;
      const confirm = document.getElementById('case-importer-confirm');
      if (confirm) confirm.disabled = validCount === 0;
      setStatus(`Vista previa lista: ${validCount} filas válidas para importar.`);
    } catch (error) {
      console.error(error);
      setStatus(error && error.message ? error.message : 'No se pudo analizar el archivo.');
    }
  }

  async function readRows(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'csv' || extension === 'tsv') return readDelimited(file, extension === 'tsv' ? '\t' : ',');
    await ensureXlsx();
    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  function readDelimited(file, delimiter) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.onload = () => {
        const text = String(reader.result || '');
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (!lines.length) return resolve([]);
        const headers = splitCsvLine(lines[0], delimiter);
        const rows = lines.slice(1).map((line) => {
          const values = splitCsvLine(line, delimiter);
          return headers.reduce((row, header, index) => {
            row[header] = values[index] || '';
            return row;
          }, {});
        });
        resolve(rows);
      };
      reader.readAsText(file, 'utf-8');
    });
  }

  function splitCsvLine(line, delimiter) {
    const result = [];
    let current = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  function ensureXlsx() {
    if (window.XLSX) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = XLSX_CDN;
      script.onload = resolve;
      script.onerror = () => reject(new Error('No se pudo cargar el lector Excel. Probá exportar el archivo como CSV.'));
      document.head.appendChild(script);
    });
  }

  function getCaseValue(item, field) {
    const keys = CASE_KEY_ALIASES[field] || [field];
    const key = keys.find((candidate) => Object.prototype.hasOwnProperty.call(item, candidate));
    return key ? item[key] : '';
  }

  function setCaseValue(item, field, value, onlyIfPresent) {
    if (onlyIfPresent && (value === '' || value === null || value === undefined)) return;
    const keys = CASE_KEY_ALIASES[field] || [field];
    const key = keys.find((candidate) => Object.prototype.hasOwnProperty.call(item, candidate)) || keys[0];
    item[key] = value;
  }

  function findCaseStore() {
    const candidates = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      try {
        const parsed = JSON.parse(localStorage.getItem(key));
        scanForCaseArrays(parsed, [], candidates, key, parsed);
      } catch (_) {
        // ignore non-json storage
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    if (candidates[0]) return candidates[0];
    const empty = [];
    return { storageKey: DEFAULT_STORAGE_KEY, root: empty, path: [], items: empty, score: 0 };
  }

  function scanForCaseArrays(node, path, candidates, storageKey, root) {
    if (Array.isArray(node)) {
      const score = node.reduce((total, item) => total + scoreCaseLike(item), 0);
      if (score > 0) candidates.push({ storageKey, root, path, items: node, score });
      node.forEach((child, index) => scanForCaseArrays(child, path.concat(index), candidates, storageKey, root));
      return;
    }
    if (node && typeof node === 'object') {
      Object.keys(node).forEach((key) => scanForCaseArrays(node[key], path.concat(key), candidates, storageKey, root));
    }
  }

  function scoreCaseLike(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return 0;
    let score = 0;
    if (getCaseValue(item, 'orderNumber')) score += 8;
    if (getCaseValue(item, 'plate')) score += 3;
    if (getCaseValue(item, 'client')) score += 2;
    if (getCaseValue(item, 'status')) score += 2;
    if (getCaseValue(item, 'partDescription')) score += 2;
    return score;
  }

  function persistStore(store) {
    localStorage.setItem(store.storageKey, JSON.stringify(store.root));
  }

  function confirmImport() {
    const validRows = parsedPreview.filter((item) => item.valid);
    if (!validRows.length) {
      setStatus('No hay filas válidas para importar.');
      return;
    }
    const store = findCaseStore();
    const byOrder = new Map();
    store.items.forEach((item) => {
      const order = normalizeValue(getCaseValue(item, 'orderNumber')).toUpperCase();
      if (order) byOrder.set(order, item);
    });

    let created = 0;
    let updated = 0;
    validRows.forEach((item) => {
      const order = item.data.orderNumber.toUpperCase();
      const existing = byOrder.get(order);
      if (existing) {
        applyImportedData(existing, item.data, true);
        updated += 1;
      } else {
        const createdCase = {};
        applyImportedData(createdCase, item.data, false);
        store.items.push(createdCase);
        byOrder.set(order, createdCase);
        created += 1;
      }
    });

    persistStore(store);
    window.dispatchEvent(new CustomEvent('amiun:cases-imported', { detail: { created, updated } }));
    window.dispatchEvent(new Event('storage'));
    setStatus(`Importación confirmada: ${created} nuevos y ${updated} actualizados. Recargando vistas...`);
    setTimeout(() => window.location.reload(), 700);
  }

  function applyImportedData(target, data, updateOnlyNonEmpty) {
    Object.keys(CASE_KEY_ALIASES).forEach((field) => {
      if (field === 'programmed') return;
      setCaseValue(target, field, data[field], updateOnlyNonEmpty);
    });
    setCaseValue(target, 'programmed', Boolean(data.programmed), false);
    setCaseValue(target, 'status', data.status, updateOnlyNonEmpty);
    if (!target.id) target.id = data.orderNumber || `IMP-${Date.now()}`;
    target.updatedAt = new Date().toISOString();
    target.importSource = data.importSource;
  }

  function boot() {
    ensurePanel();
    const observer = new MutationObserver(() => ensurePanel());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
