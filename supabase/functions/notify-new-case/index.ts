const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const gmailTokenEndpoint = "https://oauth2.googleapis.com/token";
const gmailSendEndpoint = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const transientGmailStatuses = new Set([429, 500, 502, 503, 504]);
const maxGmailAttempts = 3;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function textValue(value: unknown, fallback = "Sin dato") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function requiredSecret(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Falta configurar ${name} en Supabase`);
  return value;
}

function escapeHtml(value: unknown) {
  return textValue(value, "").replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[char] ?? char;
  });
}

function boolText(value: unknown) {
  return value === true || value === "true" || value === "Sí" ? "Sí" : "No";
}

function formatDateTime(value = new Date()) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(value);
}

function base64FromUtf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64UrlFromUtf8(value: string) {
  return base64FromUtf8(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${base64FromUtf8(value)}?=`;
}

function isVorArrivalEvent(payload: Record<string, unknown>) {
  return textValue(payload.event, "") === "vor_arrival_notification";
}

function isReleasedPartsEvent(payload: Record<string, unknown>) {
  return textValue(payload.event, "") === "released_parts_notification";
}

function isPartsOrderEvent(payload: Record<string, unknown>) {
  return textValue(payload.event, "") === "parts_order_request";
}

function emailAddresses(value: unknown) {
  const items = Array.isArray(value) ? value : String(value ?? "").split(/[;,\n]+/);
  return [...new Set(items.map((item) => String(item ?? "").trim().toLowerCase()))]
    .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))
    .slice(0, 20);
}

function releasedCases(payload: Record<string, unknown>) {
  return Array.isArray(payload.cases)
    ? payload.cases.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
}

function buildSubject(payload: Record<string, unknown>) {
  const caseData = (isPartsOrderEvent(payload) ? payload.partOrderCase : payload.case ?? {}) as Record<string, unknown>;
  if (isReleasedPartsEvent(payload)) {
    const count = releasedCases(payload).length;
    return `[Dados de baja] ${count} repuesto${count === 1 ? "" : "s"} requiere${count === 1 ? "" : "n"} tratamiento interno`;
  }
  if (isVorArrivalEvent(payload)) {
    return `[VOR] Programar reemplazo - OR ${textValue(caseData.order)} - ${textValue(caseData.plate)}`;
  }
  if (isPartsOrderEvent(payload)) {
    return `[Pedido de repuesto] OR ${textValue(caseData.order)} - ${textValue(caseData.partCode)}`;
  }
  return `Nuevo caso de garantía ${textValue(caseData.order)} - ${textValue(caseData.plate)}`;
}

function buildPartsOrderHtml(payload: Record<string, unknown>) {
  const caseData = (payload.partOrderCase ?? {}) as Record<string, unknown>;
  const requestedBy = textValue(payload.requestedBy, "Usuario no identificado");
  return buildHtml({
    ...payload,
    event: "new_case_created",
    case: caseData,
    createdBy: requestedBy,
    createdAt: payload.requestedAt ?? new Date().toISOString(),
  });
}

function buildReleasedPartsHtml(payload: Record<string, unknown>) {
  const cases = releasedCases(payload);
  const notifiedBy = textValue(payload.notifiedBy, "Usuario no identificado");
  const notifiedAt = formatDateTime(payload.notifiedAt ? new Date(String(payload.notifiedAt)) : new Date());
  const urgentCount = cases.filter((item) => textValue(item.priority, "").toUpperCase() === "URGENTE").length;
  const rows = cases.map((item, index) => `
    <tr>
      <td align="center" valign="top" style="padding:9px 7px;border:1px solid #D9DEE6;background:${index % 2 ? "#F7F8FA" : "#FFFFFF"};font-size:12px;line-height:16px;color:#111827;font-weight:bold;">${escapeHtml(item.cancelledAt)}</td>
      <td align="center" valign="top" style="padding:9px 7px;border:1px solid #D9DEE6;background:${index % 2 ? "#F7F8FA" : "#FFFFFF"};font-size:12px;line-height:16px;color:#111827;font-weight:bold;word-break:break-word;">${escapeHtml(item.order)}</td>
      <td align="center" valign="top" style="padding:9px 7px;border:1px solid #D9DEE6;background:${index % 2 ? "#F7F8FA" : "#FFFFFF"};font-size:12px;line-height:16px;color:#111827;">${escapeHtml(item.plate)}</td>
      <td valign="top" style="padding:9px 7px;border:1px solid #D9DEE6;background:${index % 2 ? "#F7F8FA" : "#FFFFFF"};font-size:12px;line-height:16px;color:#111827;word-break:break-word;">${escapeHtml(item.client)}</td>
      <td align="center" valign="top" style="padding:9px 7px;border:1px solid #D9DEE6;background:${index % 2 ? "#F7F8FA" : "#FFFFFF"};font-size:12px;line-height:16px;color:${textValue(item.priority, "").toUpperCase() === "URGENTE" ? "#EB0A1E" : "#111827"};font-weight:bold;">${escapeHtml(item.priority)}</td>
      <td valign="top" style="padding:9px 7px;border:1px solid #D9DEE6;background:${index % 2 ? "#F7F8FA" : "#FFFFFF"};font-size:12px;line-height:16px;color:#111827;word-break:break-word;">${escapeHtml(item.partCode)}</td>
      <td valign="top" style="padding:9px 7px;border:1px solid #D9DEE6;background:${index % 2 ? "#F7F8FA" : "#FFFFFF"};font-size:12px;line-height:16px;color:#111827;word-break:break-word;">${escapeHtml(item.part)}</td>
      <td valign="top" style="padding:9px 7px;border:1px solid #D9DEE6;background:${index % 2 ? "#F7F8FA" : "#FFFFFF"};font-size:12px;line-height:16px;color:#4B5563;word-break:break-word;">${escapeHtml(item.cancelReason)}</td>
    </tr>`).join("");

  return `<!doctype html>
  <html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="x-ua-compatible" content="ie=edge"><title>Repuestos dados de baja</title></head>
  <body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;color:#111827;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <center style="width:100%;background:#F3F4F6;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#F3F4F6;"><tr><td align="center" style="padding:24px 10px;">
      <table role="presentation" width="760" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:760px;border-collapse:collapse;background:#FFFFFF;border-top:5px solid #EB0A1E;">
        <tr><td style="padding:22px 24px 18px;border-bottom:1px solid #D9DEE6;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;"><tr>
            <td valign="middle"><div style="font-size:13px;line-height:16px;letter-spacing:.12em;color:#EB0A1E;font-weight:bold;">AMIUN TOYOTA · POSTVENTA</div><div style="padding-top:5px;font-size:25px;line-height:30px;color:#111827;font-weight:bold;">Repuestos de casos dados de baja</div><div style="padding-top:5px;font-size:14px;line-height:19px;color:#667085;">Aviso consolidado para revisión y tratamiento interno</div></td>
            <td width="126" valign="top" align="right"><div style="padding:10px;border-left:3px solid #EB0A1E;background:#F7F8FA;font-size:10px;line-height:14px;color:#667085;font-weight:bold;">EMITIDO<br><span style="font-size:12px;color:#111827;">${escapeHtml(notifiedAt)}</span></div></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:18px 24px 10px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;"><tr>
          <td width="50%" style="padding:13px 15px;border:1px solid #D9DEE6;background:#F7F8FA;"><div style="font-size:10px;letter-spacing:.08em;color:#667085;font-weight:bold;">CASOS A REVISAR</div><div style="padding-top:3px;font-size:25px;color:#111827;font-weight:bold;">${cases.length}</div></td>
          <td width="50%" style="padding:13px 15px;border:1px solid #D9DEE6;background:#F7F8FA;"><div style="font-size:10px;letter-spacing:.08em;color:#667085;font-weight:bold;">PRIORIDAD URGENTE</div><div style="padding-top:3px;font-size:25px;color:${urgentCount ? "#EB0A1E" : "#111827"};font-weight:bold;">${urgentCount}</div></td>
        </tr></table></td></tr>
        <tr><td style="padding:10px 24px 16px;"><div style="padding:13px 15px;border-left:4px solid #EB0A1E;background:#FFF4F4;font-size:14px;line-height:20px;color:#111827;"><strong>Acción requerida:</strong> identificar cada repuesto, verificar su ubicación y definir su tratamiento según el procedimiento interno autorizado.</div></td></tr>
        <tr><td style="padding:0 24px 18px;overflow:hidden;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;table-layout:fixed;">
            <tr style="background:#30343A;">${["Fecha baja","N.º OR","Patente","Cliente","Prioridad","Código","Repuesto","Motivo"].map((label) => `<th valign="middle" style="padding:9px 6px;border:1px solid #454A51;color:#FFFFFF;font-size:10px;line-height:13px;text-align:center;word-break:break-word;">${label}</th>`).join("")}</tr>
            ${rows}
          </table>
        </td></tr>
        <tr><td style="padding:0 24px 18px;"><div style="padding:12px 14px;border:1px solid #F5B942;background:#FFF8E7;font-size:12px;line-height:17px;color:#5F4612;"><strong>Control de disposición:</strong> este aviso no autoriza por sí mismo tirar, destruir, trasladar ni enviar repuestos. Toda disposición debe cumplir la autorización y trazabilidad interna correspondiente.</div></td></tr>
        <tr><td style="padding:15px 24px;background:#202226;color:#FFFFFF;font-size:11px;line-height:16px;">Avisado por <strong>${escapeHtml(notifiedBy)}</strong> · ${escapeHtml(notifiedAt)}<br><span style="color:#B8BDC6;">Documento operativo interno · Amiun Toyota</span></td></tr>
      </table>
    </td></tr></table></center>
  </body></html>`;
}

function buildReleasedPartsHtmlV2(payload: Record<string, unknown>) {
  const cases = releasedCases(payload);
  const notifiedBy = textValue(payload.notifiedBy, "Usuario no identificado");
  const notifiedAt = formatDateTime(payload.notifiedAt ? new Date(String(payload.notifiedAt)) : new Date());
  const cards = cases.map((item, index) => {
    const order = escapeHtml(textValue(item.order, "Sin N.º OR"));
    const cancelledAt = escapeHtml(textValue(item.cancelledAt, "Sin fecha"));
    const plate = escapeHtml(textValue(item.plate, "Sin patente"));
    const client = escapeHtml(textValue(item.client, "Sin cliente"));
    const part = escapeHtml(textValue(item.part, "Sin especificar"));

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:0 0 14px 0;border:1px solid #D7DBE0;background:#FFFFFF;">
        <tr>
          <td style="padding:13px 16px;background:#2D3035;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;">
            Orden ${order}
          </td>
          <td align="right" style="padding:13px 16px;background:#2D3035;color:#B8BDC6;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;">
            ${String(index + 1).padStart(2, "0")}
          </td>
        </tr>
        <tr>
          <td width="50%" valign="top" style="padding:13px 16px;border-right:1px solid #E2E5E9;border-bottom:1px solid #E2E5E9;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;color:#6B7280;text-transform:uppercase;margin-bottom:5px;">Fecha de baja</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#1A1A1A;line-height:1.35;">${cancelledAt}</div>
          </td>
          <td width="50%" valign="top" style="padding:13px 16px;border-bottom:1px solid #E2E5E9;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;color:#6B7280;text-transform:uppercase;margin-bottom:5px;">Patente</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#1A1A1A;line-height:1.35;">${plate}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" valign="top" style="padding:13px 16px;border-bottom:1px solid #E2E5E9;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;color:#6B7280;text-transform:uppercase;margin-bottom:5px;">Cliente</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#1A1A1A;line-height:1.4;overflow-wrap:anywhere;word-break:break-word;">${client}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" valign="top" style="padding:13px 16px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;color:#6B7280;text-transform:uppercase;margin-bottom:5px;">Repuesto</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#1A1A1A;line-height:1.45;overflow-wrap:anywhere;word-break:break-word;">${part}</div>
          </td>
        </tr>
      </table>`;
  }).join("");

  return `<!doctype html>
  <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#F2F3F5;color:#1A1A1A;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:#F2F3F5;">
        <tr>
          <td align="center" style="padding:26px 12px;">
            <table role="presentation" width="680" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:680px;border-collapse:collapse;background:#FFFFFF;border-top:5px solid #EB0A1E;">
              <tr>
                <td style="padding:25px 28px 21px 28px;border-bottom:1px solid #D7DBE0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td valign="top">
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.4px;color:#EB0A1E;text-transform:uppercase;margin-bottom:7px;">Amiun Toyota · Control operativo</div>
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;color:#1A1A1A;line-height:1.15;">Repuestos dados de baja</div>
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B7280;line-height:1.45;margin-top:7px;">Notificación para identificar y definir el tratamiento de cada repuesto.</div>
                      </td>
                      <td width="104" valign="top" align="right" style="padding-left:18px;">
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;color:#6B7280;text-transform:uppercase;">Casos</div>
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:30px;font-weight:700;color:#EB0A1E;line-height:1.1;margin-top:4px;">${cases.length}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 28px 8px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:#FFF5F5;border-left:4px solid #EB0A1E;">
                    <tr>
                      <td style="padding:13px 15px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#32353A;line-height:1.5;">
                        <strong style="color:#1A1A1A;">Acción requerida:</strong> localizar cada repuesto y definir su disposición según el procedimiento interno autorizado.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 28px 12px 28px;">
                  ${cards || `<div style="padding:18px;border:1px solid #D7DBE0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B7280;text-align:center;">No hay repuestos pendientes para informar.</div>`}
                </td>
              </tr>
              <tr>
                <td style="padding:4px 28px 20px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:#F7F8FA;border:1px solid #E2E5E9;">
                    <tr>
                      <td style="padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#4B5563;line-height:1.45;">
                        <strong style="color:#1A1A1A;">Control de disposición:</strong> este aviso identifica los casos a revisar; no autoriza por sí mismo la eliminación, el traslado ni el envío del repuesto.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:15px 28px;background:#202226;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#B8BDC6;line-height:1.45;">Emitido por ${escapeHtml(notifiedBy)} · ${escapeHtml(notifiedAt)}</td>
                      <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#FFFFFF;white-space:nowrap;">AMIUN TOYOTA</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

function buildVorArrivalHtml(payload: Record<string, unknown>) {
  const caseData = (payload.case ?? {}) as Record<string, unknown>;
  const notifiedBy = textValue(payload.notifiedBy, "Usuario no identificado");
  const notifiedAt = formatDateTime(payload.notifiedAt ? new Date(String(payload.notifiedAt)) : new Date());
  const observations = textValue(caseData.observations, "");
  const optionalObservations = observations && observations !== "-" && observations.toLowerCase() !== "sin especificar"
    ? `<tr><td colspan="2" style="padding:12px 14px;border:1px solid #D9DEE6;background:#FFFFFF;">
        <div style="font-size:10px;line-height:13px;text-transform:uppercase;letter-spacing:.08em;color:#667085;font-weight:bold;">Observaciones</div>
        <div style="padding-top:4px;font-size:14px;line-height:19px;color:#111827;word-break:break-word;">${escapeHtml(observations)}</div>
      </td></tr>`
    : "";

  const cell = (label: string, value: unknown, width = "50%") => `
    <td width="${width}" valign="top" style="padding:12px 14px;border:1px solid #D9DEE6;background:#FFFFFF;">
      <div style="font-size:10px;line-height:13px;text-transform:uppercase;letter-spacing:.08em;color:#667085;font-weight:bold;">${escapeHtml(label)}</div>
      <div style="padding-top:4px;font-size:15px;line-height:20px;color:#111827;font-weight:bold;word-break:break-word;">${escapeHtml(value)}</div>
    </td>`;

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="x-ua-compatible" content="ie=edge">
      <title>Repuesto VOR disponible para reemplazo</title>
    </head>
    <body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;color:#111827;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
      <center style="width:100%;background:#F3F4F6;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#F3F4F6;">
          <tr><td align="center" style="padding:20px 10px;">
            <table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" style="width:620px;max-width:620px;border-collapse:collapse;background:#FFFFFF;border:1px solid #D9DEE6;border-top:4px solid #EB0A1E;">
              <tr><td style="padding:17px 20px;border-bottom:1px solid #D9DEE6;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td width="150" valign="middle"><img src="https://amiun-garantias.vercel.app/assets/logo-amiun.png" width="130" alt="Amiun Toyota" style="display:block;border:0;width:130px;max-width:130px;height:auto;"></td>
                    <td valign="middle" style="padding-left:18px;border-left:1px solid #D9DEE6;">
                      <div style="font-size:10px;line-height:13px;letter-spacing:.16em;text-transform:uppercase;color:#EB0A1E;font-weight:bold;">Aviso VOR · Repuestos a Taller</div>
                      <div style="padding-top:4px;font-size:22px;line-height:27px;color:#111827;font-weight:bold;">Repuesto listo para reemplazo</div>
                    </td>
                  </tr>
                </table>
              </td></tr>
              <tr><td style="padding:16px 20px;background:#F7F8FA;border-bottom:1px solid #D9DEE6;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td valign="middle">
                      <div style="font-size:10px;line-height:13px;text-transform:uppercase;letter-spacing:.1em;color:#667085;font-weight:bold;">Orden / vehículo</div>
                      <div style="padding-top:2px;font-size:24px;line-height:29px;color:#111827;font-weight:bold;">OR ${escapeHtml(caseData.order)} &nbsp;·&nbsp; ${escapeHtml(caseData.plate)}</div>
                      <div style="padding-top:2px;font-size:13px;line-height:18px;color:#667085;">${escapeHtml(caseData.client)}</div>
                    </td>
                    <td width="78" align="center" valign="middle" style="background:#EB0A1E;color:#FFFFFF;font-size:17px;line-height:21px;font-weight:bold;">VOR</td>
                  </tr>
                </table>
              </td></tr>
              <tr><td style="padding:16px 20px 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>${cell("Código de repuesto", caseData.partCode, "42%")} ${cell("Repuesto", caseData.part, "58%")}</tr>
                  <tr>${cell("Fecha de arribo", caseData.arrivalDate)}${cell("Tiempo de reparación", caseData.repairTime)}</tr>
                  ${optionalObservations}
                </table>
              </td></tr>
              <tr><td style="padding:8px 20px 18px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#FDECEC;border-left:4px solid #EB0A1E;">
                  <tr><td style="padding:13px 15px;">
                    <div style="font-size:10px;line-height:13px;text-transform:uppercase;letter-spacing:.1em;color:#EB0A1E;font-weight:bold;">Acción para Jefe de Taller</div>
                    <div style="padding-top:3px;font-size:16px;line-height:21px;color:#111827;font-weight:bold;">Programar el reemplazo del vehículo que ya se encuentra en taller.</div>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="padding:11px 20px;background:#1F2329;border-top:3px solid #EB0A1E;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;"><tr>
                  <td style="font-size:11px;line-height:16px;color:#FFFFFF;font-weight:bold;">AMIUN TOYOTA · Aviso operativo interno</td>
                  <td align="right" style="font-size:11px;line-height:16px;color:#D0D5DD;">${escapeHtml(notifiedAt)} · ${escapeHtml(notifiedBy)}</td>
                </tr></table>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </center>
    </body>
  </html>`;
}

function buildHtml(payload: Record<string, unknown>) {
  if (isReleasedPartsEvent(payload)) return buildReleasedPartsHtmlV2(payload);
  if (isVorArrivalEvent(payload)) return buildVorArrivalHtml(payload);
  if (isPartsOrderEvent(payload)) return buildPartsOrderHtml(payload);
  const caseData = (isPartsOrderEvent(payload) ? payload.partOrderCase : payload.case ?? {}) as Record<string, unknown>;
  const createdBy = textValue(payload.createdBy, "Usuario no identificado");
  const createdAt = formatDateTime(payload.createdAt ? new Date(String(payload.createdAt)) : new Date());
  const order = escapeHtml(caseData.order);
  const priority = textValue(caseData.priority);
  const isUrgent = priority.toUpperCase() === "URGENTE";
  const isToyota10 = boolText(caseData.toyota10) === "Sí";

  const infoCell = (label: string, value: unknown, options: { width?: string; highlight?: boolean } = {}) => `
    <td width="${options.width ?? "50%"}" valign="top" style="padding:13px 16px;border:1px solid #D9DEE6;${options.highlight ? "background:#FFF4C7;border-left:4px solid #F5B942;" : "background:#FFFFFF;"}">
      <div style="font-size:10px;line-height:13px;text-transform:uppercase;letter-spacing:.09em;color:#667085;font-weight:bold;mso-line-height-rule:exactly;">${escapeHtml(label)}</div>
      <div style="padding-top:4px;font-size:16px;line-height:20px;color:#111827;font-weight:bold;mso-line-height-rule:exactly;word-break:break-word;">${escapeHtml(value)}</div>
    </td>
  `;

  const sectionTitle = (number: string, title: string, subtitle: string) => `
    <tr>
      <td colspan="2" style="padding:0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#E9ECEF;border:1px solid #D9DEE6;border-bottom:0;">
          <tr>
            <td width="48" valign="middle" align="center" style="padding:14px 0;color:#EB0A1E;font-size:12px;line-height:16px;font-weight:bold;border-right:1px solid #D3D8DF;">${number}</td>
            <td valign="middle" style="padding:12px 16px;">
              <div style="font-size:19px;line-height:23px;color:#111827;font-weight:bold;mso-line-height-rule:exactly;">${escapeHtml(title)}</div>
              <div style="font-size:13px;line-height:17px;color:#667085;mso-line-height-rule:exactly;">${escapeHtml(subtitle)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="x-ua-compatible" content="ie=edge">
      <title>Nuevo caso de garantía ${order}</title>
    </head>
    <body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;color:#111827;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
      <center style="width:100%;background:#F3F4F6;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#F3F4F6;">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" width="720" cellspacing="0" cellpadding="0" border="0" style="width:720px;max-width:720px;border-collapse:collapse;background:#FFFFFF;border:1px solid #D9DEE6;border-top:5px solid #EB0A1E;">
                <tr>
                  <td style="padding:22px 26px 18px 26px;border-bottom:1px solid #D9DEE6;background:#FFFFFF;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      <tr>
                        <td width="190" valign="middle" style="padding:0;">
                          <img src="https://amiun-garantias.vercel.app/assets/logo-amiun.png" width="158" alt="Amiun Toyota" style="display:block;border:0;outline:none;text-decoration:none;width:158px;max-width:158px;height:auto;">
                          <div style="font-size:0;line-height:0;color:#FFFFFF;mso-hide:all;">TOYOTA | AMIUN</div>
                        </td>
                        <td valign="middle" align="center" style="padding:0 16px;">
                          <div style="font-size:11px;line-height:14px;letter-spacing:.18em;text-transform:uppercase;color:#EB0A1E;font-weight:bold;mso-line-height-rule:exactly;">Control operativo de garantías</div>
                          <div style="padding-top:5px;font-size:26px;line-height:30px;color:#111827;font-weight:bold;mso-line-height-rule:exactly;">Nuevo caso registrado</div>
                          <div style="padding-top:5px;font-size:13px;line-height:18px;color:#667085;mso-line-height-rule:exactly;">Ficha técnica para seguimiento inicial del circuito</div>
                        </td>
                        <td width="150" valign="middle" align="right" style="padding:0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border-left:3px solid #EB0A1E;background:#F7F8FA;">
                            <tr>
                              <td style="padding:11px 14px;">
                                <div style="font-size:10px;line-height:13px;text-transform:uppercase;letter-spacing:.08em;color:#667085;font-weight:bold;">Emitido</div>
                                <div style="padding-top:3px;font-size:13px;line-height:17px;color:#111827;font-weight:bold;">${escapeHtml(createdAt)}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 26px;background:#F7F8FA;border-bottom:1px solid #D9DEE6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      <tr>
                        <td width="78" valign="middle" align="center" style="background:#1F2329;color:#FFFFFF;font-size:22px;line-height:26px;font-weight:bold;padding:14px 0;">OR</td>
                        <td valign="middle" style="padding:0 18px;">
                          <div style="font-size:10px;line-height:13px;letter-spacing:.16em;text-transform:uppercase;color:#EB0A1E;font-weight:bold;">Caso de garantía</div>
                          <div style="font-size:30px;line-height:34px;color:#111827;font-weight:bold;mso-line-height-rule:exactly;">${order}</div>
                          <div style="font-size:14px;line-height:18px;color:#667085;mso-line-height-rule:exactly;">${escapeHtml(caseData.plate)} &nbsp;|&nbsp; ${escapeHtml(caseData.client)}</div>
                        </td>
                        <td width="210" valign="middle" align="right" style="padding:0;">
                          <span style="display:inline-block;padding:8px 11px;background:${isUrgent ? "#FDECEC" : "#F7F8FA"};border:1px solid ${isUrgent ? "#EB0A1E" : "#D9DEE6"};color:${isUrgent ? "#EB0A1E" : "#111827"};font-size:12px;line-height:15px;font-weight:bold;">Prioridad ${escapeHtml(priority)}</span>
                          ${isToyota10 ? `<span style="display:inline-block;margin-left:6px;margin-top:6px;padding:8px 11px;background:#FFF4C7;border:1px solid #F5B942;color:#7A4D00;font-size:12px;line-height:15px;font-weight:bold;">Toyota 10</span>` : ""}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 26px 8px 26px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      ${sectionTitle("01", "Vehículo y cliente", "Identificación para tomar contacto")}
                      <tr>
                        ${infoCell("VIN", caseData.vin)}
                        ${infoCell("Cliente", caseData.client)}
                      </tr>
                      <tr>
                        ${infoCell("Patente", caseData.plate)}
                        ${infoCell("Teléfono", caseData.phone)}
                      </tr>
                      <tr>
                        ${infoCell("Fecha de venta", caseData.saleDate, { highlight: isToyota10 })}
                        ${infoCell("Kilometraje", caseData.km, { highlight: isToyota10 })}
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 26px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      ${sectionTitle("02", "Repuesto y reparación", "Disponibilidad y contenido técnico")}
                      <tr>
                        ${infoCell("Fecha del pedido", caseData.requestDate)}
                        ${infoCell("Tiempo de reparación", caseData.repairTime)}
                      </tr>
                      <tr>
                        ${infoCell("Código de repuesto", caseData.partCode, { width: "55%" })}
                        ${infoCell("Repuesto", caseData.part, { width: "45%" })}
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 26px 22px 26px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      ${sectionTitle("03", "Control operativo", "Criterios de gestión visual TPS")}
                      <tr>
                        ${infoCell("VOR", boolText(caseData.vor))}
                        ${infoCell("Toyota 10", boolText(caseData.toyota10), { highlight: isToyota10 })}
                      </tr>
                      <tr>
                        <td colspan="2" valign="top" style="padding:13px 16px;border:1px solid #D9DEE6;background:#FFFFFF;">
                          <div style="font-size:10px;line-height:13px;text-transform:uppercase;letter-spacing:.09em;color:#667085;font-weight:bold;">Observaciones</div>
                          <div style="padding-top:4px;font-size:15px;line-height:21px;color:#111827;font-weight:bold;word-break:break-word;">${escapeHtml(caseData.observations)}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:15px 26px;background:#1F2329;border-top:3px solid #EB0A1E;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      <tr>
                        <td valign="middle" style="font-size:12px;line-height:17px;color:#FFFFFF;font-weight:bold;">AMIUN TOYOTA | Postventa y Garantías</td>
                        <td valign="middle" align="right" style="font-size:12px;line-height:17px;color:#D0D5DD;">Registrado por ${escapeHtml(createdBy)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="max-width:720px;padding:10px 0 0 0;font-size:11px;line-height:16px;color:#667085;text-align:center;">
                Aviso automático generado por la WebApp Amiun Garantías. No responder este correo.
              </div>
            </td>
          </tr>
        </table>
      </center>
    </body>
  </html>`;
}

function buildText(payload: Record<string, unknown>) {
  if (isReleasedPartsEvent(payload)) {
    const cases = releasedCases(payload);
    const lines = [
      "AMIUN TOYOTA - REPUESTOS DE CASOS DADOS DE BAJA",
      "",
      `${cases.length} repuesto${cases.length === 1 ? "" : "s"} requiere${cases.length === 1 ? "" : "n"} revisión y tratamiento interno.`,
      "",
    ];

    cases.forEach((item, index) => {
      lines.push(
        `${index + 1}. NRO OR: ${textValue(item.order, "Sin dato")}`,
        `Fecha de baja: ${textValue(item.cancelledAt, "Sin fecha")}`,
        `Patente: ${textValue(item.plate, "Sin dato")}`,
        `Cliente: ${textValue(item.client, "Sin dato")}`,
        `Repuesto: ${textValue(item.part, "Sin especificar")}`,
        "",
      );
    });

    lines.push(
      "ACCIÓN REQUERIDA: identificar cada repuesto, verificar su ubicación y definir su tratamiento según el procedimiento interno autorizado.",
      "",
      "Este aviso no autoriza por sí mismo tirar, destruir, trasladar ni enviar repuestos.",
      "",
      `Avisado por: ${textValue(payload.notifiedBy, "Usuario no identificado")}`,
      `Fecha: ${formatDateTime(payload.notifiedAt ? new Date(String(payload.notifiedAt)) : new Date())}`,
    );
    return lines.join("\n");
  }

  const caseData = (isPartsOrderEvent(payload) ? payload.partOrderCase : payload.case ?? {}) as Record<string, unknown>;
  if (isPartsOrderEvent(payload)) {
    return buildText({
      ...payload,
      event: "new_case_created",
      case: caseData,
      createdBy: textValue(payload.requestedBy, "Usuario no identificado"),
      createdAt: payload.requestedAt ?? new Date().toISOString(),
    });
  }
  if (isVorArrivalEvent(payload)) {
    const observations = textValue(caseData.observations, "");
    const lines = [
      "AMIUN TOYOTA - AVISO VOR A TALLER",
      "",
      "REPUESTO LISTO PARA REEMPLAZO",
      `NRO OR: ${textValue(caseData.order)}`,
      `Patente: ${textValue(caseData.plate)}`,
      `Cliente: ${textValue(caseData.client)}`,
      "",
      `Código: ${textValue(caseData.partCode)}`,
      `Repuesto: ${textValue(caseData.part)}`,
      `Fecha de arribo: ${textValue(caseData.arrivalDate)}`,
      `Tiempo de reparación: ${textValue(caseData.repairTime)}`,
    ];
    if (observations && observations !== "-" && observations.toLowerCase() !== "sin especificar") {
      lines.push(`Observaciones: ${observations}`);
    }
    lines.push(
      "",
      "ACCIÓN REQUERIDA: Programar el reemplazo del vehículo que ya se encuentra en taller.",
      "",
      `Avisado por: ${textValue(payload.notifiedBy, "Usuario no identificado")}`,
      `Fecha: ${formatDateTime(payload.notifiedAt ? new Date(String(payload.notifiedAt)) : new Date())}`,
    );
    return lines.join("\n");
  }
  return [
    "AMIUN TOYOTA - Nuevo caso registrado",
    "",
    `NRO OR: ${textValue(caseData.order)}`,
    `VIN: ${textValue(caseData.vin)}`,
    `Patente: ${textValue(caseData.plate)}`,
    `Cliente: ${textValue(caseData.client)}`,
    `Teléfono: ${textValue(caseData.phone)}`,
    `Prioridad: ${textValue(caseData.priority)}`,
    `VOR: ${boolText(caseData.vor)}`,
    `Toyota 10: ${boolText(caseData.toyota10)}`,
    `Fecha del pedido: ${textValue(caseData.requestDate)}`,
    `Fecha de venta: ${textValue(caseData.saleDate)}`,
    `Kilometraje: ${textValue(caseData.km)}`,
    `Repuesto: ${textValue(caseData.part)}`,
    `Código: ${textValue(caseData.partCode)}`,
    `Estado: ${textValue(caseData.status)}`,
    `Observaciones: ${textValue(caseData.observations)}`,
    "",
    `Registrado por: ${textValue(payload.createdBy, "Usuario no identificado")}`,
    `Fecha: ${formatDateTime(payload.createdAt ? new Date(String(payload.createdAt)) : new Date())}`,
  ].join("\n");
}

async function fetchWithTransientRetry(url: string, init: RequestInit, service: string, retryNetworkErrors = true) {
  for (let attempt = 1; attempt <= maxGmailAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      if (!retryNetworkErrors) {
        const ambiguousError = new Error("No se pudo confirmar si Gmail aceptó el correo. Revisá Enviados antes de reintentarlo para evitar duplicados.");
        ambiguousError.name = "ambiguous_send";
        throw ambiguousError;
      }
      if (attempt === maxGmailAttempts) throw error;
      const delay = 1000 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 500);
      console.warn(JSON.stringify({ event: "gmail_retry", service, attempt, delayMs: delay, reason: "network_error" }));
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    if (response.ok || !transientGmailStatuses.has(response.status) || attempt === maxGmailAttempts) {
      return response;
    }
    await response.text();
    const delay = 1000 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 500);
    console.warn(JSON.stringify({ event: "gmail_retry", service, attempt, status: response.status, delayMs: delay }));
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error(`${service} falló después de ${maxGmailAttempts} intentos`);
}

async function getGmailAccessToken() {
  const body = new URLSearchParams({
    client_id: requiredSecret("GOOGLE_CLIENT_ID"),
    client_secret: requiredSecret("GOOGLE_CLIENT_SECRET"),
    refresh_token: requiredSecret("GOOGLE_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  });
  const response = await fetchWithTransientRetry(gmailTokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  }, "Google OAuth");
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || !data.access_token) {
    throw new Error(`Google OAuth rechazó el refresh token: ${textValue(data.error_description ?? data.error ?? response.statusText)}`);
  }
  return String(data.access_token);
}

async function sendGmailEmail(payload: Record<string, unknown>) {
  const accessToken = await getGmailAccessToken();
  const fromEmail = requiredSecret("GMAIL_FROM");
  const configuredRecipients = isPartsOrderEvent(payload) ? emailAddresses(payload.recipients) : [];
  const configuredCopies = isPartsOrderEvent(payload) ? emailAddresses(payload.cc) : [];
  const toEmail = isPartsOrderEvent(payload)
    ? configuredRecipients.join(", ")
    : isVorArrivalEvent(payload)
    ? Deno.env.get("WORKSHOP_CHIEF_EMAIL") || Deno.env.get("NOTIFY_TO_EMAIL") || ""
    : isReleasedPartsEvent(payload)
      ? Deno.env.get("RELEASED_PARTS_EMAIL") || Deno.env.get("NOTIFY_TO_EMAIL") || ""
      : Deno.env.get("NOTIFY_TO_EMAIL") || textValue(payload.recipient, "");
  if (!toEmail) throw new Error("No hay destinatarios válidos para el correo");
  const subject = buildSubject(payload);
  const text = buildText(payload);
  const html = buildHtml(payload);

  // No se reintenta automáticamente un fallo de red en messages.send: Gmail
  // podría haber aceptado el correo aunque la respuesta se haya perdido.
  const boundary = `amiun_${crypto.randomUUID()}`;
  const rawMessage = [
    `From: ${fromEmail}`,
    `To: ${toEmail}`,
    ...(configuredCopies.length ? [`Cc: ${configuredCopies.join(", ")}`] : []),
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const response = await fetchWithTransientRetry(gmailSendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: base64UrlFromUtf8(rawMessage) }),
  }, "Gmail API", false);
  const gmailBody = await response.text();
  if (!response.ok) throw new Error(`Gmail rechazó el envío: ${gmailBody}`);
  try {
    return JSON.parse(gmailBody || "{}");
  } catch {
    // HTTP 2xx confirma la aceptación aunque el cuerpo de respuesta sea inválido.
    return {};
  }
}

async function handler(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Método no permitido" }, 405);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "JSON inválido" }, 400);
  }

  if (isReleasedPartsEvent(payload)) {
    if (!releasedCases(payload).length) {
      return jsonResponse({ ok: false, error: "No hay repuestos dados de baja para avisar" }, 400);
    }
  } else {
    const caseData = (isPartsOrderEvent(payload) ? payload.partOrderCase : payload.case ?? {}) as Record<string, unknown>;
    const order = textValue(caseData.order, "");
    if (!order) {
      return jsonResponse({ ok: false, error: "Falta el NRO OR del caso" }, 400);
    }
    if (isPartsOrderEvent(payload)) {
      if (!textValue(caseData.partCode, "")) return jsonResponse({ ok: false, error: "Falta el código de repuesto" }, 400);
      if (!emailAddresses(payload.recipients).length) return jsonResponse({ ok: false, error: "Falta al menos un destinatario válido" }, 400);
    }
  }

  try {
    const gmailBody = await sendGmailEmail(payload);
    console.info(JSON.stringify({
      event: "gmail_message_accepted",
      notificationType: textValue(payload.event, "new_case_created"),
      order: textValue((isPartsOrderEvent(payload) ? payload.partOrderCase : payload.case ?? {}) as Record<string, unknown>, "").slice(0, 40),
      messageId: textValue(gmailBody.id, ""),
    }));
    return jsonResponse({ ok: true, provider: "gmail", detail: gmailBody, deliveryStatus: "accepted_by_gmail" });
  } catch (error) {
    console.error(JSON.stringify({ event: "gmail_send_failed", message: error instanceof Error ? error.message : "unknown" }));
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo enviar el correo con Gmail",
    }, 502);
  }
}

Deno.serve(handler);

