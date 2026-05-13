#!/usr/bin/env node
// Convert temp/carto_melodi.ods into src/config/indicators.json.
//
// Only choropleth rows with a simple ratio formula `(DIM=A)/(DIM=B)` are kept.
// Bubble rows and complex formulas (multi-term, pow, arithmetic) are skipped
// and reported on stderr.
//
// Usage: node scripts/build-indicators.mjs
//   Requires `unzip` available on PATH.

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ODS_PATH = join(ROOT, 'temp/carto_melodi.ods');
const OUT_PATH = join(ROOT, 'src/config/indicators.json');

/**
 * Extract rows from an OpenDocument content.xml string.
 * Returns an array of row arrays (each cell is a plain string).
 * @param {string} xml - Raw content.xml content
 * @returns {string[][]} Rows (only the first sheet)
 */
const extractRows = (xml) => {
  const rows = [];
  // Naive but sufficient: walk via regex over <table:table-row>…</table:table-row>
  const rowRe = /<table:table-row\b[^>]*>([\s\S]*?)<\/table:table-row>/g;
  const cellRe = /<table:table-cell\b([^>]*)>([\s\S]*?)<\/table:table-cell>|<table:table-cell\b([^/]*)\/>/g;
  const repeatRe = /table:number-columns-repeated="(\d+)"/;
  let rowMatch;
  while ((rowMatch = rowRe.exec(xml)) !== null) {
    const inner = rowMatch[1];
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRe.exec(inner)) !== null) {
      const attrs = cellMatch[1] ?? cellMatch[3] ?? '';
      const body = cellMatch[2] ?? '';
      const repeatM = repeatRe.exec(attrs);
      const repeat = repeatM ? parseInt(repeatM[1], 10) : 1;
      const text = body
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
        .trim();
      for (let i = 0; i < repeat; i++) cells.push(text);
    }
    while (cells.length && cells[cells.length - 1] === '') cells.pop();
    rows.push(cells);
  }
  return rows;
};

/**
 * Parse a filter string like "SEX=_T&AGE=_T&AGE=Y_GE80&TIME_PERIOD=2022".
 * Repeated keys become arrays.
 * @param {string} raw - Filter expression
 * @returns {Object} Parsed parameter map
 */
const parseFilter = (raw) => {
  const out = {};
  if (!raw) return out;
  for (const part of raw.split('&')) {
    const [keyRaw, valueRaw] = part.split('=');
    const key = keyRaw?.trim();
    const value = valueRaw?.trim();
    if (!key || value === undefined) continue;
    if (out[key] === undefined) {
      out[key] = value;
    } else if (Array.isArray(out[key])) {
      out[key].push(value);
    } else {
      out[key] = [out[key], value];
    }
  }
  return out;
};

/**
 * Parse a simple ratio formula of the form `(DIM=A)/(DIM=B)`.
 * Returns null for unsupported forms.
 * @param {string} formula - Raw formula
 * @returns {{type: 'ratio', numerator: Object, denominator: Object} | null}
 */
const parseFormula = (formula) => {
  const match = /^\(\s*([A-Z0-9_]+)\s*=\s*([A-Z0-9_]+)\s*\)\s*\/\s*\(\s*([A-Z0-9_]+)\s*=\s*([A-Z0-9_]+)\s*\)$/.exec(
    formula.trim()
  );
  if (!match) return null;
  const [, numDim, numVal, denDim, denVal] = match;
  return {
    type: 'ratio',
    numerator: { [numDim]: numVal },
    denominator: { [denDim]: denVal },
  };
};

/**
 * Convert a French title into a slug suitable for an id.
 * @param {string} title - Source title
 * @returns {string} Kebab-case slug
 */
const slugify = (title) => {
  const raw = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (raw.length <= 60) return raw;
  const cut = raw.lastIndexOf('-', 60);
  return cut > 0 ? raw.slice(0, cut) : raw.slice(0, 60);
};

const main = () => {
  const tmp = mkdtempSync(join(tmpdir(), 'ods-'));
  try {
    execFileSync('unzip', ['-q', '-o', ODS_PATH, '-d', tmp]);
    const xml = readFileSync(join(tmp, 'content.xml'), 'utf-8');
    const rows = extractRows(xml);

    if (!rows.length || rows[0][0] !== 'title_fr') {
      throw new Error('Unexpected ODS structure: header row not found');
    }

    const indicators = [];
    const skipped = [];
    for (let i = 1; i < rows.length; i++) {
      const [title, ds, filter, mode, formula] = rows[i];
      if (!title || !ds || !mode) continue;
      const cleanTitle = title.trim();
      const cleanDs = ds.trim();
      if (mode !== 'choropleth') {
        skipped.push({ row: i, title: cleanTitle, reason: `mode=${mode}` });
        continue;
      }
      const parsedFormula = parseFormula(formula ?? '');
      if (!parsedFormula) {
        skipped.push({ row: i, title: cleanTitle, reason: `unsupported formula: ${formula}` });
        continue;
      }
      indicators.push({
        id: slugify(cleanTitle),
        title: cleanTitle,
        datasetId: cleanDs,
        filter: parseFilter(filter ?? ''),
        formula: parsedFormula,
        unit: '%',
      });
    }

    writeFileSync(OUT_PATH, `${JSON.stringify(indicators, null, 2)}\n`, 'utf-8');
    console.log(`Wrote ${indicators.length} indicators to ${OUT_PATH}`);
    if (skipped.length) {
      console.error(`Skipped ${skipped.length} rows:`);
      for (const s of skipped) console.error(`  - row ${s.row} "${s.title}": ${s.reason}`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
};

main();
