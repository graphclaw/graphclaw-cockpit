#!/usr/bin/env node

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const DEFAULT_CATALOG_URL =
  "https://dataaisummit.databricks.com/flow/db/dais2026/scheduler/page/catalog?tab.sessionsforscheduler=1713464244829001MIfa";
const PAGE_SIZE = 50;
const SESSION_API_URL = "https://events.rainfocus.com/api/session";
const SESSIONS_API_URL = "https://events.rainfocus.com/api/sessions";

// RainFocus credentials are read from the environment — never hardcode them.
// Set RF_API_PROFILE_ID, RF_AUTH_TOKEN, and RF_WIDGET_ID before running, e.g.:
//   RF_API_PROFILE_ID=... RF_AUTH_TOKEN=... RF_WIDGET_ID=... node scripts/export-dais2026-sessions-puppeteer.mjs
const DEFAULT_RF_HEADERS = {
  rfApiProfileId: process.env.RF_API_PROFILE_ID || "",
  rfAuthToken: process.env.RF_AUTH_TOKEN || "",
  rfWidgetId: process.env.RF_WIDGET_ID || "",
};

const missingRfCreds = Object.entries(DEFAULT_RF_HEADERS)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missingRfCreds.length > 0) {
  console.error(
    `Missing RainFocus credentials: ${missingRfCreds.join(", ")}. ` +
      "Set RF_API_PROFILE_ID, RF_AUTH_TOKEN, and RF_WIDGET_ID in the environment.",
  );
  process.exit(1);
}

const inputCatalogUrl = process.argv[2] || DEFAULT_CATALOG_URL;
const outputDir = process.argv[3] || path.resolve(process.cwd(), "reports");

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function findBrowserExecutable() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Could not find a Chromium browser executable. Set PUPPETEER_EXECUTABLE_PATH and retry."
  );
}

function pickHeader(headers, key) {
  const keyLower = key.toLowerCase();
  for (const [k, v] of Object.entries(headers || {})) {
    if (k.toLowerCase() === keyLower) {
      return v;
    }
  }
  return "";
}

function sanitizeSessionBody(body) {
  const parts = String(body || "")
    .split("&")
    .filter(Boolean)
    .filter((part) => !part.startsWith("from=") && !part.startsWith("size="));
  return parts.join("&");
}

function buildDefaultSessionsBody(catalogUrl) {
  const tabValue =
    catalogUrl.searchParams.get("tab.sessionsforscheduler") ||
    "1713464244829001MIfa";
  return [
    `tab.sessionsforscheduler=${encodeURIComponent(tabValue)}`,
    "type=session",
    "browserTimezone=America%2FNew_York",
    "catalogDisplay=grid",
  ].join("&");
}

function getTotalFromPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return 0;
  }
  if (typeof payload.total === "number") {
    return payload.total;
  }
  if (typeof payload.totalSearchItems === "number") {
    return payload.totalSearchItems;
  }
  if (
    Array.isArray(payload.sectionList) &&
    payload.sectionList[0] &&
    typeof payload.sectionList[0].total === "number"
  ) {
    return payload.sectionList[0].total;
  }
  return 0;
}

function getItemsFromPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  if (
    Array.isArray(payload.sectionList) &&
    payload.sectionList[0] &&
    Array.isArray(payload.sectionList[0].items)
  ) {
    return payload.sectionList[0].items;
  }
  return [];
}

async function postJson(url, headers, body) {
  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return {
    ok: response.ok,
    status: response.status,
    text,
    json,
  };
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((v) => String(v).trim()).filter(Boolean))];
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  const withoutTags = String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  return withoutTags;
}

function getAttrValues(attributeValues, attributeName) {
  return uniqueStrings(
    (Array.isArray(attributeValues) ? attributeValues : [])
      .filter((attr) => String(attr?.attribute || "").toLowerCase() === attributeName.toLowerCase())
      .map((attr) => attr?.value)
  );
}

function firstOrEmpty(values) {
  return Array.isArray(values) && values.length > 0 ? values[0] : "";
}

function slug(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "na";
}

function yesNo(condition) {
  return condition ? "yes" : "no";
}

function derivePersonaTag(text) {
  const value = text.toLowerCase();
  const tags = [];

  if (/(chief|cxo|ceo|cto|cio|cdo|vp|director|leadership|executive|strategy)/.test(value)) {
    tags.push("executive");
  }
  if (/(engineer|engineering|developer|architect|platform|infra|infrastructure)/.test(value)) {
    tags.push("engineer");
  }
  if (/(data scientist|ml engineer|machine learning|research|model)/.test(value)) {
    tags.push("data_science_ml");
  }
  if (/(analyst|bi|dashboard|kpi|reporting|metrics)/.test(value)) {
    tags.push("analytics_bi");
  }
  if (/(governance|catalog|security|compliance|privacy|risk)/.test(value)) {
    tags.push("governance_risk");
  }

  return tags.length > 0 ? uniqueStrings(tags).join("|") : "general";
}

function parseSessionRow(session, clickOpened) {
  const attributeValues = Array.isArray(session?.attributevalues) ? session.attributevalues : [];
  const times = Array.isArray(session?.times) ? session.times : [];
  const participants = Array.isArray(session?.participants) ? session.participants : [];

  const type = firstOrEmpty(getAttrValues(attributeValues, "Type")) || cleanText(session?.type);
  const level = firstOrEmpty(getAttrValues(attributeValues, "Level"));
  const trackValues = getAttrValues(attributeValues, "Track");
  const track = trackValues.join(" | ");
  const experienceValues = getAttrValues(attributeValues, "Experience");
  const experience = experienceValues.join(" | ");
  const products = getAttrValues(attributeValues, "Technologies: Databricks Products");
  const oss = getAttrValues(attributeValues, "Technologies: OSS");
  const industries = getAttrValues(attributeValues, "Industry");
  const areas = getAttrValues(attributeValues, "Areas of Interest");

  const dates = uniqueStrings(times.map((t) => t?.dateFormatted || t?.date));
  const dayNames = uniqueStrings(times.map((t) => t?.dayName));
  const timeSlots = uniqueStrings(
    times.map((t) => {
      const start = t?.startTimeFormatted || t?.startTime || "";
      const end = t?.endTimeFormatted || t?.endTime || "";
      const date = t?.dateFormatted || t?.date || "";
      return cleanText(`${date} ${start} - ${end}`);
    })
  );
  const rooms = uniqueStrings(times.map((t) => t?.room));

  const capacities = times
    .map((t) => Number.parseInt(String(t?.capacity || "0"), 10))
    .filter((v) => Number.isFinite(v));
  const seatsRemaining = times
    .map((t) => Number.parseInt(String(t?.seatsRemaining || "0"), 10))
    .filter((v) => Number.isFinite(v));
  const waitlistRemaining = times
    .map((t) => Number.parseInt(String(t?.waitlistRemaining || "0"), 10))
    .filter((v) => Number.isFinite(v));

  const speakerParticipants = participants.filter((p) => {
    const roleText = String(p?.roles || "").toLowerCase();
    if (roleText.includes("speaker")) {
      return true;
    }
    const sessionRoles = Array.isArray(p?.session) ? p.session : [];
    return sessionRoles.some((s) => String(s?.speakerRole || "").toLowerCase().includes("speaker"));
  });

  const speakerNames = uniqueStrings(
    speakerParticipants.map(
      (p) => p?.preferredFullName || p?.globalFullName || p?.fullName || cleanText(`${p?.firstName || ""} ${p?.lastName || ""}`)
    )
  );
  const speakerCompanies = uniqueStrings(speakerParticipants.map((p) => p?.companyName || p?.globalCompany));
  const speakerTitles = uniqueStrings(speakerParticipants.map((p) => p?.jobTitle || p?.globalJobtitle));

  const abstractText = stripHtml(session?.abstract || "");
  const combinedText = [
    session?.title,
    abstractText,
    type,
    level,
    track,
    experience,
    products.join(" "),
    oss.join(" "),
    industries.join(" "),
    areas.join(" "),
    speakerTitles.join(" "),
  ]
    .map(cleanText)
    .join(" ")
    .toLowerCase();

  const modality = experience.toLowerCase().includes("virtual")
    ? "Virtual"
    : experience.toLowerCase().includes("in person")
      ? "In Person"
      : times.some((t) => t?.virtualTime) && times.some((t) => t?.inPersonTime)
        ? "Hybrid"
        : times.some((t) => t?.virtualTime)
          ? "Virtual"
          : "In Person";

  const themeValues = uniqueStrings([...trackValues, ...areas]);
  const filterTags = uniqueStrings([
    `type:${slug(type)}`,
    `level:${slug(level || "unspecified")}`,
    `modality:${slug(modality)}`,
    ...trackValues.map((v) => `track:${slug(v)}`),
    ...areas.map((v) => `interest:${slug(v)}`),
    ...products.map((v) => `dbx:${slug(v)}`),
    ...oss.map((v) => `oss:${slug(v)}`),
    ...industries.map((v) => `industry:${slug(v)}`),
  ]);

  return {
    session_external_id: cleanText(session?.externalID || session?.sessionID),
    session_id: cleanText(session?.sessionID),
    session_code: cleanText(session?.code),
    session_abbreviation: cleanText(session?.abbreviation),
    title: cleanText(session?.title),
    abstract_text: abstractText,
    status: cleanText(session?.status),
    type,
    level,
    track,
    experience,
    technologies_databricks_products: products.join(" | "),
    technologies_oss: oss.join(" | "),
    industry: industries.join(" | "),
    areas_of_interest: areas.join(" | "),
    day_names: dayNames.join(" | "),
    date_list: dates.join(" | "),
    time_slots_local: timeSlots.join(" | "),
    timezone: "America/Los_Angeles",
    room_list: rooms.join(" | "),
    duration_minutes: Number.parseInt(String(session?.length || "0"), 10) || 0,
    capacity_max: capacities.length ? Math.max(...capacities) : "",
    seats_remaining_min: seatsRemaining.length ? Math.min(...seatsRemaining) : "",
    waitlist_remaining_max: waitlistRemaining.length ? Math.max(...waitlistRemaining) : "",
    speaker_count: speakerNames.length,
    speaker_names: speakerNames.join(" | "),
    speaker_companies: speakerCompanies.join(" | "),
    speaker_titles: speakerTitles.join(" | "),
    session_url: `https://dataaisummit.databricks.com/flow/db/dais2026/scheduler/page/catalog/session/${encodeURIComponent(
      session?.externalID || session?.sessionID || ""
    )}`,
    click_opened: clickOpened ? "yes" : "no",
    tag_format: type,
    tag_level: level || "Unspecified",
    tag_modality: modality,
    tag_theme: themeValues.length ? themeValues.join(" | ") : "General",
    tag_persona: derivePersonaTag(combinedText),
    tag_ai: yesNo(/\bai\b|artificial intelligence/.test(combinedText)),
    tag_genai: yesNo(/genai|generative ai/.test(combinedText)),
    tag_agents: yesNo(/agent|agents/.test(combinedText)),
    tag_llm: yesNo(/\bllm\b|large language model/.test(combinedText)),
    tag_ml: yesNo(/machine learning|\bml\b/.test(combinedText)),
    tag_data_engineering: yesNo(/data engineering|pipeline|etl|streaming|lakehouse|delta/.test(combinedText)),
    tag_governance_security: yesNo(/governance|security|compliance|privacy|unity catalog/.test(combinedText)),
    tag_bi_analytics: yesNo(/bi|analytics|dashboard|kpi|metrics|reporting/.test(combinedText)),
    tag_open_source: yesNo(/open source|spark|delta lake|iceberg|mlflow|dbt|pytorch|llama/.test(combinedText)),
    filter_tags: filterTags.join(";"),
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows, columns) {
  const lines = [columns.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column] ?? "")).join(","));
  }
  return lines.join("\n");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const browserExecutable = findBrowserExecutable();
  const catalogUrl = new URL(inputCatalogUrl);
  const sessionBaseUrl = `${catalogUrl.origin}${catalogUrl.pathname.replace(/\/page\/catalog$/, "/page/catalog/session")}`;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: browserExecutable,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (["image", "font", "media"].includes(resourceType)) {
      request.abort();
      return;
    }
    request.continue();
  });

  let capturedSessionsRequest = null;
  page.on("request", (request) => {
    if (
      !capturedSessionsRequest &&
      request.url().includes("events.rainfocus.com/api/sessions") &&
      request.method() === "POST"
    ) {
      capturedSessionsRequest = {
        headers: request.headers(),
        body: request.postData() || "",
      };
    }
  });

  await page.goto(catalogUrl.toString(), { waitUntil: "networkidle2", timeout: 120000 });
  await delay(2000);

  if (!capturedSessionsRequest) {
    await page.reload({ waitUntil: "networkidle2", timeout: 120000 });
    await delay(2000);
  }

  const envHeaders = {
    rfApiProfileId: process.env.RF_API_PROFILE_ID || "",
    rfAuthToken: process.env.RF_AUTH_TOKEN || "",
    rfWidgetId: process.env.RF_WIDGET_ID || "",
  };

  const apiHeaders = {
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    rfApiProfileId:
      envHeaders.rfApiProfileId ||
      pickHeader(capturedSessionsRequest?.headers, "rfApiProfileId") ||
      DEFAULT_RF_HEADERS.rfApiProfileId,
    rfAuthToken:
      envHeaders.rfAuthToken ||
      pickHeader(capturedSessionsRequest?.headers, "rfAuthToken") ||
      DEFAULT_RF_HEADERS.rfAuthToken,
    rfWidgetId:
      envHeaders.rfWidgetId ||
      pickHeader(capturedSessionsRequest?.headers, "rfWidgetId") ||
      DEFAULT_RF_HEADERS.rfWidgetId,
  };

  if (!apiHeaders.rfApiProfileId || !apiHeaders.rfAuthToken || !apiHeaders.rfWidgetId) {
    throw new Error("Captured sessions API headers are missing one or more RainFocus auth values.");
  }

  const baseSessionsBody = capturedSessionsRequest?.body
    ? sanitizeSessionBody(capturedSessionsRequest.body)
    : buildDefaultSessionsBody(catalogUrl);

  const firstPage = await postJson(
    SESSIONS_API_URL,
    apiHeaders,
    `${baseSessionsBody}&from=0&size=${PAGE_SIZE}`
  );

  if (!firstPage.ok || !firstPage.json) {
    throw new Error(`Failed to fetch initial sessions page. HTTP ${firstPage.status}`);
  }

  const totalSessions = getTotalFromPayload(firstPage.json);
  const allSessionSummaries = [];
  allSessionSummaries.push(...getItemsFromPayload(firstPage.json));

  for (let from = PAGE_SIZE; from < totalSessions; from += PAGE_SIZE) {
    const pageResult = await postJson(
      SESSIONS_API_URL,
      apiHeaders,
      `${baseSessionsBody}&from=${from}&size=${PAGE_SIZE}`
    );

    if (!pageResult.ok || !pageResult.json) {
      console.warn(`Skipping sessions page from=${from}; HTTP ${pageResult.status}`);
      continue;
    }

    allSessionSummaries.push(...getItemsFromPayload(pageResult.json));
  }

  const uniqueSessionIds = uniqueStrings(
    allSessionSummaries.map((session) => session?.externalID || session?.sessionID)
  );

  console.log(`Captured ${uniqueSessionIds.length} unique sessions from catalog.`);

  const detailItems = [];
  const failures = [];
  const totalToProcess = uniqueSessionIds.length;

  for (let index = 0; index < uniqueSessionIds.length; index += 1) {
    const sessionId = uniqueSessionIds[index];
    const sessionUrl = `${sessionBaseUrl}/${encodeURIComponent(sessionId)}`;

    let clickOpened = false;

    try {
      await page.goto(sessionUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
      clickOpened = true;
    } catch {
      clickOpened = false;
    }

    const detailResult = await postJson(
      SESSION_API_URL,
      apiHeaders,
      `id=${encodeURIComponent(sessionId)}`
    );

    const detailItem = detailResult?.json?.items?.[0];

    if (!detailResult.ok || !detailItem) {
      failures.push({
        sessionId,
        status: detailResult?.status,
      });
    } else {
      detailItems.push(parseSessionRow(detailItem, clickOpened));
    }

    if ((index + 1) % 25 === 0 || index + 1 === totalToProcess) {
      console.log(`Processed ${index + 1}/${totalToProcess} sessions...`);
    }
  }

  await browser.close();

  await fsp.mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const csvPath = path.join(outputDir, `dais2026_sessions_detailed_${timestamp}.csv`);
  const jsonPath = path.join(outputDir, `dais2026_sessions_detailed_${timestamp}.json`);
  const summaryPath = path.join(outputDir, `dais2026_sessions_export_summary_${timestamp}.txt`);

  const columns = [
    "session_external_id",
    "session_id",
    "session_code",
    "session_abbreviation",
    "title",
    "abstract_text",
    "status",
    "type",
    "level",
    "track",
    "experience",
    "technologies_databricks_products",
    "technologies_oss",
    "industry",
    "areas_of_interest",
    "day_names",
    "date_list",
    "time_slots_local",
    "timezone",
    "room_list",
    "duration_minutes",
    "capacity_max",
    "seats_remaining_min",
    "waitlist_remaining_max",
    "speaker_count",
    "speaker_names",
    "speaker_companies",
    "speaker_titles",
    "session_url",
    "click_opened",
    "tag_format",
    "tag_level",
    "tag_modality",
    "tag_theme",
    "tag_persona",
    "tag_ai",
    "tag_genai",
    "tag_agents",
    "tag_llm",
    "tag_ml",
    "tag_data_engineering",
    "tag_governance_security",
    "tag_bi_analytics",
    "tag_open_source",
    "filter_tags",
  ];

  const csvContent = toCsv(detailItems, columns);
  await fsp.writeFile(csvPath, csvContent, "utf8");
  await fsp.writeFile(jsonPath, JSON.stringify(detailItems, null, 2), "utf8");

  const summary = [
    `Catalog URL: ${catalogUrl.toString()}`,
    `Total sessions discovered: ${totalToProcess}`,
    `Detailed rows exported: ${detailItems.length}`,
    `Failures: ${failures.length}`,
    `CSV: ${csvPath}`,
    `JSON: ${jsonPath}`,
    failures.length ? `Failed IDs: ${failures.map((f) => f.sessionId).join(", ")}` : "Failed IDs: none",
    "",
    "Tag columns included:",
    "- tag_format",
    "- tag_level",
    "- tag_modality",
    "- tag_theme",
    "- tag_persona",
    "- tag_ai",
    "- tag_genai",
    "- tag_agents",
    "- tag_llm",
    "- tag_ml",
    "- tag_data_engineering",
    "- tag_governance_security",
    "- tag_bi_analytics",
    "- tag_open_source",
    "- filter_tags",
  ].join("\n");

  await fsp.writeFile(summaryPath, summary, "utf8");

  console.log(`CSV written to ${csvPath}`);
  console.log(`JSON written to ${jsonPath}`);
  console.log(`Summary written to ${summaryPath}`);
}

main().catch((error) => {
  console.error("Export failed:", error);
  process.exitCode = 1;
});
