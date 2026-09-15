/**
 * Super-Nat — Google Apps Script Web App
 * Reçoit les leads du formulaire landing-page et les ajoute à une Google Sheet.
 *
 * COLONNES ATTENDUES (dans cet ordre, ligne 1 = en-têtes) :
 * A Horodatage | B Nom complet | C Email | D Entreprise | E Type d'application | F Mode envisagé | G Budget | H Description du besoin | I Source | J User-Agent
 *
 * Installation : voir README.md (section "Google Sheet & Apps Script")
 */

// Si vous voulez forcer un Spreadsheet précis (utile si le script n'est PAS lié à la Sheet),
// collez son ID ici. Sinon laissez vide et le script utilisera le Spreadsheet lié (recommandé).
// Pour trouver l'ID : URL du Sheet = https://docs.google.com/spreadsheets/d/<ID>/edit
const SPREADSHEET_ID = ""; // ex. "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"

const SHEET_NAME = "Leads"; // Nom de l'onglet qui accueille les leads

// En-têtes — doivent correspondre exactement à l'ordre d'écriture ci-dessous
const HEADERS = [
  "Horodatage",
  "Nom complet",
  "Email",
  "Entreprise",
  "Type d'application",
  "Mode envisagé",
  "Budget",
  "Description du besoin",
  "Source",
  "User-Agent"
];

function getSheet_() {
  let ss;
  if (SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error(
        "Aucun Spreadsheet lié. Soit liez ce script à votre Google Sheet (Extensions > Apps Script depuis le Sheet), soit renseignez SPREADSHEET_ID."
      );
    }
  }
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  // Si la première ligne est vide, on écrit les en-têtes
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    // Mise en forme minimale
    sheet.getRange(1, 1, 1, HEADERS.length).setBackground("#111113").setFontColor("#FAFAFA");
    sheet.autoResizeColumns(1, HEADERS.length);
  } else {
    // Vérifie que les en-têtes existent, sinon les ajoute
    const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    const isEmpty = firstRow.every(function (v) { return !v; });
    if (isEmpty) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * Point d'entrée POST — appelé par fetch() depuis la landing page.
 * Accepte un JSON (Content-Type: text/plain pour éviter le preflight CORS).
 */
function doPost(e) {
  try {
    // e.postData.contents contient le JSON stringifié
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      const raw = e.postData.contents;
      try {
        payload = JSON.parse(raw);
      } catch (err) {
        // Fallback : données form-encoded (si jamais)
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    // Champs attendus (tolérant : on mappe plusieurs clés possibles)
    const nom = (payload.nom || payload["Nom complet"] || "").toString().trim();
    const email = (payload.email || payload["Email"] || "").toString().trim();
    const entreprise = (payload.entreprise || payload["Entreprise"] || "").toString().trim();
    const typeApp = (payload.type_app || payload.typeApp || payload["Type d'application"] || "").toString().trim();
    const mode = (payload.mode || payload["Mode envisagé"] || "").toString().trim();
    const budget = (payload.budget || payload["Budget"] || "").toString().trim();
    const besoin = (payload.besoin || payload["Description du besoin"] || payload.besoin || "").toString().trim();
    const source = (payload.source || "").toString().trim();
    const userAgent = (payload.userAgent || payload["User-Agent"] || "").toString().trim();

    // Validation minimale côté serveur
    if (!nom || !email || !besoin) {
      return jsonResponse_({ ok: false, error: "Champs requis manquants (nom, email, besoin)." }, 400);
    }
    // Validation email simple
    if (email.indexOf("@") === -1 || email.indexOf(".") === -1) {
      return jsonResponse_({ ok: false, error: "Format d'email invalide." }, 400);
    }

    const sheet = getSheet_();

    // Verrou pour éviter les écritures concurrentes
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (lockErr) {
      // On continue quand même
    }

    try {
      const timestamp = new Date();
      // Format d'horodatage lisible (fuseau du script)
      // On stocke l'objet Date pour que Sheets le reconnaisse comme date
      const row = [
        timestamp,
        nom,
        email,
        entreprise,
        typeApp,
        mode,
        budget,
        besoin,
        source,
        userAgent
      ];
      sheet.appendRow(row);

      // Optionnel : formater la colonne Horodatage
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 1).setNumberFormat("dd/MM/yyyy HH:mm:ss");

      // Optionnel : notification email (décommentez et renseignez votre adresse)
      // MailApp.sendEmail("contact@super-nat.fr", "Nouveau lead — Super-Nat", 
      //   "Nouveau lead :\n\nNom: " + nom + "\nEmail: " + email + "\nEntreprise: " + entreprise + "\nType: " + typeApp + "\nMode: " + mode + "\nBudget: " + budget + "\nBesoin: " + besoin);

    } finally {
      try { lock.releaseLock(); } catch (_) {}
    }

    return jsonResponse_({ ok: true, result: "success" }, 200);

  } catch (err) {
    console.error(err);
    return jsonResponse_({ ok: false, error: err && err.message ? err.message : String(err) }, 500);
  }
}

/**
 * GET — utile pour vérifier que le Web App est en ligne.
 * Ouvrez l'URL du Web App dans un navigateur : vous devez voir {"ok":true,"message":"..."}
 */
function doGet() {
  return jsonResponse_({ ok: true, message: "Super-Nat Leads Web App en ligne. Utilisez POST pour envoyer un lead." }, 200);
}

/**
 * Helper : renvoie une réponse JSON avec les en-têtes CORS.
 */
function jsonResponse_(obj, statusCode) {
  // Note : Google Apps Script ne permet pas de définir le status HTTP exact via ContentService,
  // mais on inclut ok/error dans le JSON pour que le front puisse réagir.
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  // Les Web Apps Apps Script renvoient déjà Access-Control-Allow-Origin: * quand déployées en "Anyone"
  return output;
}

/**
 * Test manuel depuis l'éditeur Apps Script (Run > testAppend)
 */
function testAppend() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        nom: "Test Lead",
        email: "test@example.fr",
        entreprise: "Test SAS",
        type_app: "Application web",
        mode: "À discuter après l'essai",
        budget: "5k – 15k €",
        besoin: "Ceci est un test manuel depuis l'éditeur Apps Script.",
        source: "test manuel",
        userAgent: "AppsScript/test"
      })
    }
  };
  const res = doPost(fakeEvent);
  Logger.log(res.getContent());
}
