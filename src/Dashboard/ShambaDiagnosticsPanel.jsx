import React from "react";
import {
  Activity, Bug, Camera, CheckCircle2, FlaskConical, ImagePlus,
  RefreshCw, ScanSearch, ShieldAlert, X,
} from "lucide-react";

const PANEL = "rounded-2xl border border-[#17384F] bg-[#0A2237]";
const MUTED = "text-[#8BA6B8]";
const ACTION = "bg-[#20C987] text-[#05251E]";

function getId(item) { return item?.id || item?._id || null; }
function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function DiagnosticList({ title, items }) {
  const values = Array.isArray(items) ? items.filter((item) => item !== null && item !== undefined && String(item).trim()) : [];
  if (!values.length) return null;
  return (
    <div className="rounded-lg border border-[#28624F] bg-[#0A4437] p-3">
      <p className="text-[10px] font-extrabold text-[#B7F0D1]">{title}</p>
      <ul className="mt-2 space-y-1.5">{values.slice(0, 8).map((item, index) => <li key={index} className="flex gap-2 text-[10px] leading-4 text-[#D8ECE2]"><span className="text-[#58DFA4]">•</span><span>{String(item)}</span></li>)}</ul>
    </div>
  );
}

export default function ShambaDiagnosticsPanel({
  mode, setMode, farm, farmVerified, file, preview, result, busy, saving,
  error, saved, cropName, setCropName, soilMethod, setSoilMethod,
  measuredPh, setMeasuredPh, calibration, setCalibration, calibrationDate,
  setCalibrationDate, kitName, setKitName, sampleDepth, setSampleDepth,
  sampleLocation, setSampleLocation, notes, setNotes, soilTests,
  imageInputRef, videoRef, cameraOpen, onStartCamera, onStopCamera,
  onCapture, onChooseImage, onRun, onSaveLeaf, onSaveSoil,
}) {
  const isLeaf = mode === "leaf";
  const savedTests = Array.isArray(soilTests) ? soilTests : [];

  return (
    <section data-shamba-diagnostics="leaf-pest-and-soil-ph" data-shamba-vision-entitlement="shamba-advanced-analytics" data-shamba-api-contract="standard-data-array" className="pt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[21px] font-black">Crop & Soil Diagnostics</h1>
          <p className={"mt-1 text-[11px] " + MUTED}>Advanced agronomy assessment with RevelaAI Live Vision</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#123F3A] text-[#52DDA0]"><ScanSearch size={21}/></span>
      </div>

      {!farm && <div className="mt-3 rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-[11px] leading-5 text-amber-200">No farm is selected. You may scan a photo, but it will not be attached to farm records yet.</div>}
      {farm && !farmVerified && <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-[11px] leading-5 text-amber-200"><ShieldAlert size={15} className="mt-0.5 shrink-0"/>This farm's rights review is not verified. You can scan the image, but saving farm-specific diagnostics is locked until the review is complete.</div>}

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[#1A3D53] bg-[#0A2237] p-1">
        <button type="button" onClick={() => setMode("leaf")} className={"flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[11px] font-extrabold " + (isLeaf ? ACTION : "text-[#91AABB]")}><Bug size={15}/>Leaf / Pest Scan</button>
        <button type="button" onClick={() => setMode("soil")} className={"flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[11px] font-extrabold " + (!isLeaf ? ACTION : "text-[#91AABB]")}><FlaskConical size={15}/>Soil & pH Assessment</button>
      </div>

      <div className={PANEL + " mt-3 p-3.5"}>
        {isLeaf ? (
          <>
            <div className="flex items-center gap-2"><Bug size={17} className="text-[#54DDA0]"/><p className="text-[12px] font-extrabold text-white">Inspect a crop leaf</p></div>
            <p className={"mt-1 text-[10px] leading-4 " + MUTED}>Capture the affected leaf close-up. Take a second photo of the underside if insects, eggs or webbing may be present.</p>
            <label className="mt-3 block text-[10px] font-bold text-[#A9C0CC]">Crop name (optional)</label>
            <input value={cropName} onChange={(event) => setCropName(event.target.value)} placeholder={farm?.primary_crop || farm?.crop_name || "e.g. Maize, tomato, kale"} className="mt-1 w-full rounded-xl border border-[#21465D] bg-[#071B2B] px-3 py-2.5 text-[11px] text-white outline-none placeholder:text-[#6D899A]"/>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2"><FlaskConical size={17} className="text-[#54DDA0]"/><p className="text-[12px] font-extrabold text-white">Soil & pH assessment</p></div>
            <p className={"mt-1 text-[10px] leading-4 " + MUTED}>Use a soil pH strip or colourimetric kit. Put the reacted strip beside its matching colour chart in the same photo. A camera cannot measure pH from bare soil.</p>
          </>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={onStartCamera} className="flex items-center justify-center gap-2 rounded-xl border border-[#27624F] bg-[#103A34] px-2 py-3 text-[11px] font-extrabold text-[#8BE8B9]"><Camera size={16}/>Open Camera</button>
          <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border border-[#21465D] bg-[#0E2B42] px-2 py-3 text-[11px] font-extrabold text-[#C9DCE5]"><ImagePlus size={16}/>{isLeaf ? "Upload Photo" : "Upload Test Photo"}</button>
        </div>
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(event) => { onChooseImage(event.target.files?.[0]); event.target.value = ""; }}/>

        {cameraOpen && (
          <div className="mt-3 overflow-hidden rounded-xl border border-[#28526A] bg-black">
            <video ref={videoRef} autoPlay muted playsInline className="max-h-[360px] w-full object-contain"/>
            <div className="grid grid-cols-2 gap-2 p-2">
              <button type="button" onClick={onCapture} className={"rounded-lg py-2.5 text-[11px] font-extrabold " + ACTION}>Capture photo</button>
              <button type="button" onClick={onStopCamera} className="rounded-lg border border-white/15 py-2.5 text-[11px] font-bold text-white">Cancel</button>
            </div>
          </div>
        )}

        {file && (
          <div className="mt-3 overflow-hidden rounded-xl border border-[#21465D] bg-[#071B2B]">
            <img src={preview} alt={isLeaf ? "Selected crop leaf" : "Selected soil pH test strip and chart"} className="max-h-[260px] w-full object-contain"/>
            <div className="flex items-center justify-between gap-2 p-2.5">
              <span className="min-w-0 truncate text-[10px] text-[#AFC3CE]">{file.name} · {(file.size / 1024).toFixed(0)} KB</span>
              <button type="button" onClick={() => onChooseImage(null)} className="shrink-0 rounded-lg p-1 text-[#9BB2C0]" aria-label="Remove selected image"><X size={16}/></button>
            </div>
          </div>
        )}

        <button type="button" disabled={!file || busy} onClick={onRun} className={"mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-extrabold disabled:opacity-40 " + ACTION}>
          {busy ? <RefreshCw size={15} className="animate-spin"/> : <ScanSearch size={16}/>}
          {busy ? (isLeaf ? "RevelaAI is inspecting the leaf…" : "Reading the test chart…") : (isLeaf ? "Analyse leaf for pests & disease" : "Read pH test strip with RevelaAI")}
        </button>

        {result && result.mode === mode && (
          <div className="mt-3 space-y-3 rounded-xl border border-[#23614E] bg-[#06392F] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-extrabold text-[#8DF0BB]">{isLeaf ? "Crop-health diagnostic report" : "Soil condition & test report"}</p>
              <span className="rounded-full bg-[#145542] px-2 py-1 text-[9px] font-bold text-[#B5F4D4]">{isLeaf ? "Visible-spectrum screening" : "Visual + test-evidence review"}</span>
            </div>
            {result.analysis?.summary && <p className="whitespace-pre-wrap text-[11px] leading-5 text-[#E2F3EB]">{result.analysis.summary}</p>}
            {!result.analysis && <p className="whitespace-pre-wrap text-[11px] leading-5 text-[#D5ECE3]">{result.reply}</p>}

            {result.analysis && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-[#28624F] bg-[#0A4437] p-2.5">
                    <span className="block text-[9px] font-bold uppercase tracking-wide text-[#9BCDB7]">Confidence</span>
                    <b className="mt-1 block text-[12px] capitalize text-white">{typeof result.analysis.confidence === "object" ? result.analysis.confidence?.level || "Undetermined" : result.analysis.confidence || "Undetermined"}</b>
                    {typeof result.analysis.confidence === "object" && result.analysis.confidence?.rationale && <p className="mt-1 text-[9px] leading-4 text-[#B7DACE]">{result.analysis.confidence.rationale}</p>}
                  </div>
                  {isLeaf && (
                    <div className="rounded-lg border border-[#28624F] bg-[#0A4437] p-2.5">
                      <span className="block text-[9px] font-bold uppercase tracking-wide text-[#9BCDB7]">Severity</span>
                      <b className="mt-1 block text-[12px] capitalize text-white">{typeof result.analysis.severity === "object" ? result.analysis.severity?.level || "Undetermined" : result.analysis.severity || "Undetermined"}</b>
                      {typeof result.analysis.severity === "object" && result.analysis.severity?.basis && <p className="mt-1 text-[9px] leading-4 text-[#B7DACE]">{result.analysis.severity.basis}</p>}
                    </div>
                  )}
                </div>

                {Array.isArray(result.analysis.observations) && result.analysis.observations.length > 0 && (
                  <div className="rounded-lg border border-[#28624F] bg-[#0A4437] p-3">
                    <p className="text-[10px] font-extrabold text-[#B7F0D1]">What the camera actually sees</p>
                    <ul className="mt-2 space-y-1.5">{result.analysis.observations.slice(0, 8).map((item, index) => <li key={index} className="flex gap-2 text-[10px] leading-4 text-[#D8ECE2]"><span className="text-[#58DFA4]">•</span><span>{String(item)}</span></li>)}</ul>
                  </div>
                )}

                {isLeaf ? (
                  <>
                    {Array.isArray(result.analysis.likely_causes) && result.analysis.likely_causes.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-extrabold text-[#B7F0D1]">Ranked possible causes — not confirmed diagnoses</p>
                        {result.analysis.likely_causes.slice(0, 5).map((cause, index) => (
                          <article key={index} className="rounded-lg border border-[#28624F] bg-[#0A4437] p-3">
                            <div className="flex items-start justify-between gap-2"><b className="text-[11px] text-white">{cause?.name || "Unspecified candidate"}</b><span className="shrink-0 rounded-full bg-[#155A46] px-2 py-1 text-[9px] capitalize text-[#C5F3DC]">{String(cause?.likelihood || "uncertain").replace(/_/g, " ")}</span></div>
                            {Array.isArray(cause?.visual_evidence) && cause.visual_evidence.length > 0 && <p className="mt-2 text-[10px] leading-4 text-[#D5ECE3]"><b className="text-[#9CE5C1]">Evidence: </b>{cause.visual_evidence.slice(0, 4).join("; ")}</p>}
                            {Array.isArray(cause?.differential) && cause.differential.length > 0 && <p className="mt-1 text-[10px] leading-4 text-[#D5ECE3]"><b className="text-[#9CE5C1]">Differentials: </b>{cause.differential.slice(0, 4).join("; ")}</p>}
                            {Array.isArray(cause?.verification) && cause.verification.length > 0 && <p className="mt-1 text-[10px] leading-4 text-[#D5ECE3]"><b className="text-[#9CE5C1]">Verify in field: </b>{cause.verification.slice(0, 4).join("; ")}</p>}
                          </article>
                        ))}
                      </div>
                    )}
                    {Array.isArray(result.analysis.integrated_pest_management) && result.analysis.integrated_pest_management.length > 0 && <DiagnosticList title="Integrated pest-management priorities" items={result.analysis.integrated_pest_management}/>}
                    {Array.isArray(result.analysis.field_checks) && result.analysis.field_checks.length > 0 && <DiagnosticList title="Next field checks" items={result.analysis.field_checks}/>}
                    {Array.isArray(result.analysis.escalation) && result.analysis.escalation.length > 0 && <DiagnosticList title="When to seek expert confirmation" items={result.analysis.escalation}/>}
                  </>
                ) : (
                  <>
                    {result.analysis.physical_assessment && <div className="rounded-lg border border-[#28624F] bg-[#0A4437] p-3"><p className="text-[10px] font-extrabold text-[#B7F0D1]">Visible soil-condition cues</p><div className="mt-2 space-y-2">{Object.entries(result.analysis.physical_assessment).map(([key, value]) => <div key={key}><p className="text-[9px] font-bold capitalize text-[#96DABB]">{key.replace(/_/g, " ")}</p><p className="mt-0.5 text-[10px] leading-4 text-[#D5ECE3]">{String(value || "Not assessable")}</p></div>)}</div></div>}
                    {result.analysis.pH_test && (
                      <div className="rounded-lg border border-[#397052] bg-[#0A4437] p-3">
                        <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-extrabold text-[#B7F0D1]">Soil pH evidence</p><span className="rounded-full bg-[#155A46] px-2 py-1 text-[9px] capitalize text-[#C5F3DC]">{String(result.analysis.pH_test.status || "not assessed").replace(/_/g, " ")}</span></div>
                        <p className="mt-2 text-[10px] leading-4 text-[#D5ECE3]">{result.analysis.pH_test.chart_match || result.analysis.pH_test.basis || "No readable soil-test evidence was supplied."}</p>
                        {result.analysis.pH_test.estimated_ph !== null && result.analysis.pH_test.estimated_ph !== undefined && <p className="mt-2 text-[12px] font-black text-white">Visual estimate: pH {result.analysis.pH_test.estimated_ph}{result.analysis.pH_test.estimated_range ? " (" + result.analysis.pH_test.estimated_range + ")" : ""}</p>}
                        {(result.analysis.pH_test.status === "not_assessable" || (result.analysis.pH_test.estimated_ph === null && !result.analysis.pH_test.estimated_range)) && <p className="mt-2 text-[10px] font-bold leading-4 text-amber-200">No pH value can be established from this photograph. Bare-soil colour is not a pH test.</p>}
                      </div>
                    )}
                    {result.analysis.nutrient_assessment && <div className="rounded-lg border border-[#28624F] bg-[#0A4437] p-3"><p className="text-[10px] font-extrabold text-[#B7F0D1]">Nutrient assessment</p><p className="mt-1 text-[10px] leading-4 text-[#D5ECE3]">{result.analysis.nutrient_assessment.reason || result.analysis.nutrient_assessment.status || "Laboratory test required."}</p></div>}
                    {Array.isArray(result.analysis.recommended_field_tests) && result.analysis.recommended_field_tests.length > 0 && <DiagnosticList title="Recommended field & laboratory tests" items={result.analysis.recommended_field_tests}/>}
                    {Array.isArray(result.analysis.management_actions) && result.analysis.management_actions.length > 0 && <DiagnosticList title="Cautious management actions" items={result.analysis.management_actions}/>}
                  </>
                )}
                {Array.isArray(result.analysis.limitations) && result.analysis.limitations.length > 0 && <DiagnosticList title="Limitations" items={result.analysis.limitations}/>}
              </>
            )}
            <p className="text-[9px] leading-4 text-[#A1C9B7]">{result.provider}{result.model ? " · " + result.model : ""} · {new Date(result.capturedAt).toLocaleString()} · Image bytes are not retained by Live Vision.</p>
            {isLeaf && farmVerified && (
              <button type="button" disabled={saving || saved} onClick={onSaveLeaf} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#20C987] px-3 py-2.5 text-[11px] font-extrabold text-[#05251E] disabled:opacity-50">
                {saved ? <CheckCircle2 size={15}/> : <Activity size={15}/>}
                {saved ? "Saved to Farm Records" : saving ? "Saving scan…" : "Save scan to Farm Records"}
              </button>
            )}
          </div>
        )}
      </div>

      {!isLeaf && (
        <>
          <div className={PANEL + " mt-3 p-3.5"}>
            <p className="text-[11px] font-extrabold text-white">Record a measured pH reading</p>
            <label className="mt-2 block text-[10px] font-semibold text-[#AFC3CE]">Test method</label>
            <select value={soilMethod} onChange={(event) => setSoilMethod(event.target.value)} className="mt-1 w-full rounded-xl border border-[#21465D] bg-[#071B2B] px-3 py-2.5 text-[11px] text-white">
              <option value="digital_meter">Digital pH meter</option><option value="test_strip">pH test strip</option><option value="colorimetric_kit">Colour comparison kit</option><option value="laboratory">Laboratory test</option>
            </select>
            <label className="mt-3 block text-[10px] font-semibold text-[#AFC3CE]">Measured pH value (0–14)</label>
            <input type="number" inputMode="decimal" min="0" max="14" step="0.1" value={measuredPh} onChange={(event) => setMeasuredPh(event.target.value)} placeholder="e.g. 6.5 — leave blank for photo estimate only" className="mt-1 w-full rounded-xl border border-[#21465D] bg-[#071B2B] px-3 py-2.5 text-[11px] text-white outline-none placeholder:text-[#6D899A]"/>
            {soilMethod === "digital_meter" && (
              <>
                <label className="mt-3 block text-[10px] font-semibold text-[#AFC3CE]">Meter calibration status</label>
                <select value={calibration} onChange={(event) => setCalibration(event.target.value)} className="mt-1 w-full rounded-xl border border-[#21465D] bg-[#071B2B] px-3 py-2.5 text-[11px] text-white"><option value="calibrated">Calibrated with buffer solutions</option><option value="uncalibrated">Not calibrated</option><option value="overdue">Calibration overdue</option></select>
                <label className="mt-3 block text-[10px] font-semibold text-[#AFC3CE]">Calibration date</label>
                <input type="date" value={calibrationDate} onChange={(event) => setCalibrationDate(event.target.value)} className="mt-1 w-full rounded-xl border border-[#21465D] bg-[#071B2B] px-3 py-2.5 text-[11px] text-white"/>
              </>
            )}
            <label className="mt-3 block text-[10px] font-semibold text-[#AFC3CE]">Test kit / meter brand (optional)</label>
            <input value={kitName} onChange={(event) => setKitName(event.target.value)} placeholder="Brand or model" className="mt-1 w-full rounded-xl border border-[#21465D] bg-[#071B2B] px-3 py-2.5 text-[11px] text-white placeholder:text-[#6D899A]"/>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div><label className="block text-[10px] font-semibold text-[#AFC3CE]">Sample depth (cm)</label><input type="number" min="0" max="100" step="1" value={sampleDepth} onChange={(event) => setSampleDepth(event.target.value)} className="mt-1 w-full rounded-xl border border-[#21465D] bg-[#071B2B] px-3 py-2.5 text-[11px] text-white"/></div>
              <div><label className="block text-[10px] font-semibold text-[#AFC3CE]">Sample point</label><input value={sampleLocation} onChange={(event) => setSampleLocation(event.target.value)} placeholder="North field" className="mt-1 w-full rounded-xl border border-[#21465D] bg-[#071B2B] px-3 py-2.5 text-[11px] text-white placeholder:text-[#6D899A]"/></div>
            </div>
            <label className="mt-3 block text-[10px] font-semibold text-[#AFC3CE]">Notes (optional)</label>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Soil preparation, dilution or kit instructions followed…" className="mt-1 w-full rounded-xl border border-[#21465D] bg-[#071B2B] px-3 py-2.5 text-[11px] text-white placeholder:text-[#6D899A]"/>
            <button type="button" disabled={saving || (!String(measuredPh).trim() && result?.mode !== "soil")} onClick={onSaveSoil} className={"mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[12px] font-extrabold disabled:opacity-40 " + ACTION}>
              {saving ? <RefreshCw size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>}Save soil test to farm
            </button>
            {saved && <p className="mt-2 text-center text-[10px] font-bold text-[#75E6AE]">Soil test saved. Measured pH and AI visual estimates remain labelled separately.</p>}
          </div>

          <div className={PANEL + " mt-3 p-3"}>
            <p className="text-[10px] font-extrabold text-[#C4D8E2]">Soil pH accuracy</p>
            <p className={"mt-1 text-[10px] leading-4 " + MUTED}>Follow the kit's soil-to-water ratio and wait time, then photograph the reacted strip with its matching chart in neutral daylight. Calibrate a digital meter with the correct buffer solutions. A laboratory test is the best confirmation. AI never converts a bare-soil photo into a measured pH.</p>
          </div>

          <div className={PANEL + " mt-3 p-3"}>
            <p className="text-[11px] font-extrabold text-white">Saved soil test history</p>
            {savedTests.slice(0, 6).map((test, index) => (
              <div key={getId(test) || index} className="mt-2 flex items-center justify-between gap-2 border-b border-[#17384F] pb-2 last:border-0">
                <span className="min-w-0"><span className="block text-[11px] font-bold text-[#DCE9EF]">{test?.measurement_status === "measured" ? "Measured pH " + test.measured_ph : test?.measurement_status === "uncalibrated_reading" ? "Uncalibrated meter reading " + test.measured_ph : "AI visual estimate only"}</span><span className={"text-[9px] " + MUTED}>{String(test?.method || "soil test").replace(/_/g, " ")} · {formatDate(test?.created_at)}</span></span>
                <span className={"shrink-0 text-[9px] " + (test?.calibration_status === "calibrated" ? "text-[#59DEA1]" : "text-amber-300")}>{test?.calibration_status || "not applicable"}</span>
              </div>
            ))}
            {!savedTests.length && <p className={"mt-2 text-[10px] " + MUTED}>No saved soil tests yet.</p>}
          </div>
        </>
      )}

      {error && <div role="alert" className="mt-3 rounded-xl border border-rose-800/60 bg-rose-950/40 p-3 text-[10px] leading-4 text-rose-200">{error}</div>}
      <p className={"mt-3 text-[9px] leading-4 " + MUTED}>Live Vision analyses the selected photo with RevelaAI’s crop-health or soil-science workflow. It is visible-spectrum screening, not an X-ray, multispectral sensor, laboratory assay or substitute for an agricultural extension officer. Soil pH and nutrients are never measured from bare-soil colour.</p>
    </section>
  );
}
