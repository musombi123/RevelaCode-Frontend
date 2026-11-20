const PRESENTATION_REQUEST = /\\b(?:power\\s*point|pptx|presentation(?:s)?|slide\\s*deck|slides?)\\b/i;
const DOCUMENT_REQUEST = /\\b(?:document|documents|pdf|pdfs|proposal|introduction|letter|memo|report|submission|letterhead)\\b/i;
const CREATION_VERB = /\\b(?:create|make|prepare|generate|produce|build|draft|write|design|export|convert|turn)\\b/i;

/**
 * Route explicit file-creation requests to the real workspace tools.
 *
 * A user asking for a PowerPoint must enter the PPTX generator, not receive
 * an ordinary chat answer that merely describes possible slide contents.
 */
export function inferWorkspaceCommand(prompt, attachedFile = null) {
  const text = String(prompt || "").trim();
  const lower = text.toLowerCase();
  const imageAttached = Boolean(
    attachedFile?.type?.startsWith("image/") || /\\.svg$/i.test(attachedFile?.name || "")
  );

  // Prioritize a requested slide deck over general document wording that may
  // appear in the deck's subject (for example, "slides about official reports").
  const presentationCreation = CREATION_VERB.test(text) && PRESENTATION_REQUEST.test(text);
  const presentationConversion = /\\b(?:turn|convert)\\b[\\s\\S]{0,100}\\b(?:into|to)\\b[\\s\\S]{0,50}\\b(?:power\\s*point|pptx|presentation|slide\\s*deck|slides?)\\b/i.test(text);
  if (presentationCreation || presentationConversion) return "/deck";

  if (/\\b(official|formal|business|institutional)\\b.{0,45}\\b(letter|memo|proposal|submission|report|notice)\\b|\\b(create|draft|write|prepare|generate)\\b.{0,50}\\b(official letter|formal letter|memorandum|business letter|institutional proposal|word document|pdf report)\\b/i.test(text)) return "/doc";
  if (/\\b(create|make|prepare|generate|build|produce)\\b.{0,45}\\b(excel|spreadsheet|workbook|financial model|ledger template)\\b/i.test(text)) return "/sheet";
  if (/\\b(analy[sz]e|profile|audit|summari[sz]e)\\b.{0,55}\\b(dataset|csv|spreadsheet data|table data|records)\\b/i.test(text) && attachedFile) return "/data";
  if (/\\b(generate|write|create|build)\\b.{0,45}\\b(source code|python script|javascript|typescript|sql query|program|function|class)\\b/i.test(text)) return "/code";
  if (/\\b(create|design|build|prototype|generate)\\b.{0,45}\\b(responsive (web|admin|dashboard|mobile)|website prototype|web app interface|ui prototype|dashboard interface|html interface)\\b/i.test(text)) return "/ui";
  if (/\\b(create|generate|design|prepare)\\b.{0,50}\\b(marketing campaign|campaign kit|promotional poster|advertising flyer|brand promotion|social media campaign)\\b/i.test(text)) return "/promo";
  if (/\\b(generate|create|draw|design)\\b.{0,40}\\b(image|illustration|logo|graphic)\\b/i.test(text) && !imageAttached) return "/image";

  const documentIntent = DOCUMENT_REQUEST.test(lower);
  const creationIntent = /\\b(help me|make|create|prepare|generate|produce|format|convert|turn|wire|draft|write)\\b/i.test(text);
  if (documentIntent && creationIntent) return "/doc";
  return null;
}

export function selectWorkspaceCommand(selectedToolCommand, inferredCommand, validCommands) {
  const selected = String(selectedToolCommand || "").trim().toLowerCase();
  const inferred = String(inferredCommand || "").trim().toLowerCase();
  const valid = validCommands instanceof Set ? validCommands : new Set(validCommands || []);
  // An explicit artifact request wins over a different selected shortcut such
  // as Deep Search. A selected workspace tool still works when no intent is
  // inferable from the user's wording.
  if (inferred && valid.has(inferred)) return inferred;
  if (selected && valid.has(selected)) return selected;
  return selected || inferred || null;
}
