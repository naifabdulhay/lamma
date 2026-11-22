// Builds dist/index.html — one self-contained file
const fs = require('fs');
const r = f => fs.readFileSync(f, 'utf8');
const esc = s => s.replace(/<\/script/gi, '<\\/script');
const libs = [r('node_modules/mqtt/dist/mqtt.min.js'), r('node_modules/qrcode-generator/dist/qrcode.js')];
const app = ['maps', 'core', 'vis', 'bank', 'qgen', 'net', 'host', 'player', 'main'].map(f => `/* ${f}.js */\n` + r(`src/${f}.js`)).join('\n');
const fav = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1D1A2B"/><text x="32" y="44" font-size="30" text-anchor="middle" fill="#FFC83D" font-family="Tahoma" font-weight="700">لمّة</text></svg>');
const AR = 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const LA = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const ff = (fam, file, w, range) => `@font-face{font-family:"${fam}";font-style:normal;font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(file).toString('base64')}) format("woff2");unicode-range:${range}}`;
const B = 'node_modules/@fontsource/baloo-bhaijaan-2/files/baloo-bhaijaan-2-', A = 'node_modules/@fontsource/amiri/files/amiri-';
const fonts = [500, 700, 800].flatMap(w => [ff('Baloo Bhaijaan 2', `${B}arabic-${w}-normal.woff2`, w, AR), ff('Baloo Bhaijaan 2', `${B}latin-${w}-normal.woff2`, w, LA)]).concat([ff('Amiri', `${A}arabic-700-normal.woff2`, 700, AR), ff('Amiri', `${A}latin-700-normal.woff2`, 700, LA)]).join('\n');
const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#FFC83D">
<title>تحدّي اللمّة</title>
<link rel="icon" href="${fav}">
<style>${fonts}
${r('src/style.css')}</style>
</head>
<body>
<div id="app"></div>
<script>${esc(libs[0])}</script>
<script>${esc(libs[1])}</script>
<script>
${esc(app)}
</script>
</body>
</html>`;

fs.writeFileSync('index.html', html);
console.log('built', (html.length / 1024).toFixed(0) + ' KB');
