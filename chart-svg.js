// chart-svg.js
// Generates clean SVG strings that Figma imports as editable vector nodes

const W = 680;
const H = 280;
const PAD = { top: 20, right: 20, bottom: 36, left: 52 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

const PALETTE = ['#0e0e0e', '#c8b89a', '#8a7560', '#4a3728', '#d4a96a', '#e8e4db'];

function lerp(val, inMin, inMax, outMin, outMax) {
  return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function niceMax(vals) {
  const max = Math.max(...vals.flat().filter(v => v != null));
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / mag) * mag;
}

function gridLines(max, count = 5) {
  const step = max / count;
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}

function fmtVal(v, fmt) {
  if (fmt === 'pct') return Math.round(v) + '%';
  if (fmt === 'x')   return v.toFixed(1) + '×';
  return '$' + v.toFixed(v >= 10 ? 0 : 1) + 'M';
}

// ── Bar chart (stacked or grouped) ──────────────────────────────────────────
export function barChart({ labels, datasets, stacked = false, fmt = 'dollar', horizontal = false }) {
  if (horizontal) return hBarChart({ labels, datasets, fmt });

  const allVals = stacked
    ? labels.map((_, li) => datasets.reduce((s, ds) => s + (ds.data[li] || 0), 0))
    : datasets.flatMap(ds => ds.data);
  const max = niceMax([allVals]);
  const ticks = gridLines(max);
  const barW = stacked
    ? (CHART_W / labels.length) * 0.6
    : (CHART_W / labels.length) * 0.6 / datasets.length;
  const groupW = CHART_W / labels.length;

  let svg = svgOpen();
  svg += gridAndAxes(ticks, max, labels, fmt);

  labels.forEach((label, li) => {
    const groupX = PAD.left + li * groupW + groupW * 0.2;
    if (stacked) {
      let yOff = 0;
      datasets.forEach((ds, di) => {
        const v = ds.data[li] || 0;
        const barH = lerp(v, 0, max, 0, CHART_H);
        const y = PAD.top + CHART_H - yOff - barH;
        svg += `<rect x="${groupX.toFixed(1)}" y="${y.toFixed(1)}" width="${(groupW * 0.6).toFixed(1)}" height="${barH.toFixed(1)}" fill="${ds.color || PALETTE[di]}" rx="2"/>`;
        yOff += barH;
      });
    } else {
      datasets.forEach((ds, di) => {
        const v = ds.data[li] || 0;
        const barH = lerp(v, 0, max, 0, CHART_H);
        const x = groupX + di * barW;
        const y = PAD.top + CHART_H - barH;
        svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barW * 0.85).toFixed(1)}" height="${barH.toFixed(1)}" fill="${ds.color || PALETTE[di]}" rx="2"/>`;
      });
    }
  });

  svg += svgClose();
  return svg;
}

// ── Horizontal bar chart ─────────────────────────────────────────────────────
function hBarChart({ labels, datasets, fmt }) {
  const vals = datasets[0].data;
  const max = niceMax([vals]);
  const rowH = CHART_H / labels.length;
  const barH = rowH * 0.45;

  let svg = svgOpen();
  const colors = datasets[0].colors || vals.map((_, i) => PALETTE[i % PALETTE.length]);

  labels.forEach((lbl, i) => {
    const v = vals[i];
    const bw = lerp(v, 0, max, 0, CHART_W);
    const y = PAD.top + i * rowH + rowH * 0.275;
    svg += `<rect x="${PAD.left}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${barH.toFixed(1)}" fill="${colors[i]}" rx="3"/>`;
    svg += `<text x="${(PAD.left - 6).toFixed(1)}" y="${(y + barH / 2 + 4).toFixed(1)}" text-anchor="end" font-family="DM Sans,sans-serif" font-size="11" fill="#666">${lbl}</text>`;
    svg += `<text x="${(PAD.left + bw + 6).toFixed(1)}" y="${(y + barH / 2 + 4).toFixed(1)}" font-family="DM Sans,sans-serif" font-size="11" fill="#333">${fmtVal(v, fmt)}</text>`;
  });

  svg += svgClose();
  return svg;
}

// ── Line chart ───────────────────────────────────────────────────────────────
export function lineChart({ labels, datasets, fmt = 'dollar', fill = true }) {
  const allVals = datasets.flatMap(ds => ds.data);
  const max = niceMax([allVals]);
  const ticks = gridLines(max);
  const stepX = CHART_W / (labels.length - 1);

  let svg = svgOpen();
  svg += gridAndAxes(ticks, max, labels, fmt);

  datasets.forEach((ds, di) => {
    const color = ds.color || PALETTE[di];
    const pts = ds.data.map((v, i) => ({
      x: PAD.left + i * stepX,
      y: PAD.top + lerp(v, 0, max, CHART_H, 0)
    }));

    const pathD = pts.map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const cp1x = (pts[i - 1].x + p.x) / 2;
      return `C ${cp1x.toFixed(1)} ${pts[i - 1].y.toFixed(1)} ${cp1x.toFixed(1)} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(' ');

    if (fill) {
      const fillD = pathD
        + ` L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.top + CHART_H).toFixed(1)}`
        + ` L ${pts[0].x.toFixed(1)} ${(PAD.top + CHART_H).toFixed(1)} Z`;
      svg += `<path d="${fillD}" fill="${color}" opacity="0.08"/>`;
    }

    svg += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    pts.forEach(p => {
      svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
    });
  });

  svg += svgClose();
  return svg;
}

// ── Dual-axis line/bar combo ─────────────────────────────────────────────────
export function comboChart({ labels, barDatasets, lineDatasets, fmtBar = 'dollar', fmtLine = 'dollar' }) {
  const barVals = barDatasets.flatMap(ds => ds.data);
  const lineVals = lineDatasets.flatMap(ds => ds.data);
  const maxBar = niceMax([barVals]);
  const maxLine = niceMax([lineVals]);
  const ticks = gridLines(maxBar);
  const groupW = CHART_W / labels.length;
  const barW = groupW * 0.5;
  const stepX = CHART_W / (labels.length - 1);

  let svg = svgOpen();
  svg += gridAndAxes(ticks, maxBar, labels, fmtBar);

  // right axis
  ticks.forEach(t => {
    const y = PAD.top + lerp(t, 0, maxBar, CHART_H, 0);
    const lineVal = lerp(t, 0, maxBar, 0, maxLine);
    svg += `<text x="${(W - PAD.right + 4).toFixed(1)}" y="${(y + 4).toFixed(1)}" font-family="DM Sans,sans-serif" font-size="10" fill="#aaa">${fmtVal(lineVal, fmtLine)}</text>`;
  });

  // bars
  labels.forEach((_, li) => {
    barDatasets.forEach((ds, di) => {
      const v = ds.data[li] || 0;
      const bh = lerp(v, 0, maxBar, 0, CHART_H);
      const x = PAD.left + li * groupW + groupW * 0.25;
      const y = PAD.top + CHART_H - bh;
      svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" fill="${ds.color || PALETTE[di]}" rx="2"/>`;
    });
  });

  // lines
  lineDatasets.forEach((ds, di) => {
    const color = ds.color || PALETTE[di + barDatasets.length];
    const pts = ds.data.map((v, i) => ({
      x: PAD.left + i * stepX,
      y: PAD.top + lerp(v, 0, maxLine, CHART_H, 0)
    }));
    const pathD = pts.map((p, i) => i === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    svg += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4 3"/>`;
    pts.forEach(p => svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${color}" stroke="#fff" stroke-width="1.5"/>`);
  });

  svg += svgClose();
  return svg;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function svgOpen() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
}

function svgClose() {
  return '</svg>';
}

function gridAndAxes(ticks, max, labels, fmt) {
  let out = '';
  // grid lines + y labels
  ticks.forEach(t => {
    const y = PAD.top + lerp(t, 0, max, CHART_H, 0);
    out += `<line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${W - PAD.right}" y2="${y.toFixed(1)}" stroke="#e8e8e8" stroke-width="1"/>`;
    out += `<text x="${(PAD.left - 6).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-family="DM Sans,sans-serif" font-size="10" fill="#aaa">${fmtVal(t, fmt)}</text>`;
  });
  // x axis
  out += `<line x1="${PAD.left}" y1="${(PAD.top + CHART_H).toFixed(1)}" x2="${W - PAD.right}" y2="${(PAD.top + CHART_H).toFixed(1)}" stroke="#e0e0e0" stroke-width="1"/>`;
  // x labels
  const groupW = CHART_W / labels.length;
  labels.forEach((lbl, i) => {
    const x = PAD.left + i * groupW + groupW / 2;
    out += `<text x="${x.toFixed(1)}" y="${(PAD.top + CHART_H + 20).toFixed(1)}" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="11" fill="#888">${lbl}</text>`;
  });
  return out;
}
