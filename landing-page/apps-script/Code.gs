/**
 * Atelier — lead collector for a Google Apps Script Web App.
 * Paste into Code.gs, replace SPREADSHEET_ID, then deploy:
 * Execute as: Me / Who has access: Anyone.
 * This file runs on Google, never on GitHub Pages.
 */
const SPREADSHEET_ID = "COLLER_ICI_ID_DU_GOOGLE_SHEET";
const SHEET_NAME = "Leads";
const HEADERS = [
  "Horodatage",
  "Nom complet",
  "Email professionnel",
  "Nom de l’entreprise",
  "Type d’application souhaitée",
  "Mode envisagé après l’essai",
  "Budget approximatif",
  "Description du besoin"
];
const APP_TYPES = ["Application desktop", "Application web", "Je ne sais pas encore"];
const MODES = ["Achat sur-mesure", "Abonnement", "À discuter après l’essai"];
const BUDGETS = ["À définir ensemble", "Moins de 3 000 €", "3 000 à 7 000 €", "7 000 à 15 000 €", "Plus de 15 000 €"];

function doPost(e) {
  let lock = null;
  try {
    if (!e || !e.postData || typeof e.postData.contents !== "string" || e.postData.contents.length > 12000) {
      return jsonResponse_({ success: false, code: "VALIDATION_ERROR" });
    }

    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (_) {
      return jsonResponse_({ success: false, code: "VALIDATION_ERROR" });
    }
    const lead = validateLead_(data);
    if (!lead) return jsonResponse_({ success: false, code: "VALIDATION_ERROR" });
    if (!SPREADSHEET_ID || SPREADSHEET_ID === "COLLER_ICI_ID_DU_GOOGLE_SHEET") {
      return jsonResponse_({ success: false, code: "SERVER_NOT_CONFIGURED" });
    }

    // Serialize sheet creation / header initialization / appends across requests.
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return jsonResponse_({ success: false, code: "SERVER_BUSY" });
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    } else {
      const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
      if (!HEADERS.every(function (header, index) { return existing[index] === header; })) {
        // Refuse to silently put personal information into mismatched columns.
        return jsonResponse_({ success: false, code: "HEADER_MISMATCH" });
      }
    }

    sheet.appendRow([
      new Date(),
      safeCell_(lead.fullName),
      safeCell_(lead.email),
      safeCell_(lead.company),
      safeCell_(lead.appType),
      safeCell_(lead.collaborationMode),
      safeCell_(lead.budget),
      safeCell_(lead.description)
    ]);
    SpreadsheetApp.flush();
    // No personal information, sheet URL, or internal error in the response.
    return jsonResponse_({ success: true });
  } catch (_) {
    // Inspect Apps Script execution status if necessary, without logging PII.
    return jsonResponse_({ success: false, code: "SERVER_ERROR" });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function validateLead_(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const limits = { fullName: 120, email: 254, company: 160, appType: 80, collaborationMode: 80, budget: 80, description: 5000 };
  const allowed = Object.keys(limits);
  if (Object.keys(data).some(function (key) { return allowed.indexOf(key) === -1; })) return null;
  const lead = {};
  for (let i = 0; i < allowed.length; i++) {
    const key = allowed[i];
    const raw = data[key] === undefined ? "" : data[key];
    if (typeof raw !== "string" || raw.length > limits[key]) return null;
    // Keep newlines in descriptions; disallow other control characters.
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(raw)) return null;
    lead[key] = raw.trim();
  }
  if (lead.fullName.length < 2 || lead.description.length < 20) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return null;
  if (lead.appType && APP_TYPES.indexOf(lead.appType) === -1) return null;
  if (lead.collaborationMode && MODES.indexOf(lead.collaborationMode) === -1) return null;
  if (lead.budget && BUDGETS.indexOf(lead.budget) === -1) return null;
  return lead;
}

function safeCell_(value) {
  // Prevent formula injection in Sheets and common exported spreadsheet formats.
  // A leading apostrophe marks user text as literal, not an executable formula.
  return /^[\s]*[=+\-@\t\r\n]/.test(value) ? "'" + value : value;
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
