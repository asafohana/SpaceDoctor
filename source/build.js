// Builds one self-contained index.html from src/ and the handoff package.
const fs = require('fs'), path = require('path');
const H = process.argv[2], out = process.argv[3];
const rd = p => fs.readFileSync(p, 'utf8');
const icons = {};
for (const f of fs.readdirSync(path.join(H, 'assets/svg'))) {
  const m = f.match(/^(.+)_light\.svg$/); if (!m) continue;
  icons[m[1]] = rd(path.join(H, 'assets/svg', f)).replace(/ width="512" height="512"/, '').replace(/ color="#F5F7FA"/, '').replace(/stroke="#F5F7FA"/g, 'stroke="currentColor"').trim();
}
const demo = JSON.parse(rd(path.join(H, 'demo/Synthetic_Demo_Data.json')));
const fc = JSON.parse(rd(path.join(H, 'SpaceDoctor_Feature_Contracts.json')));
const feats = {}; for (const i of fc.items) feats[i.id] = { title: i.title, group: i.group, description: i.description };
const viz = JSON.parse(rd(path.join(H, 'SpaceDoctor_Visualization_Registry.json'))).visualizations;
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(H, 'assets/brand/spacedoctor-logo.png')).toString('base64');
const js = s => JSON.stringify(s).replace(/</g, '\\u003c');
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SpaceDoctor Focus v3 — Demo</title>
<style>
${rd('src/styles.css')}
</style>
</head>
<body>
<div id="app"></div>
<div id="overlay"></div>
<noscript>SpaceDoctor needs JavaScript to run.</noscript>
<script>
window.SD_ICONS=${js(icons)};
window.SD_DEMO=${js(demo)};
window.SD_FEATURES=${js(feats)};
window.SD_VIZ=${js(viz)};
window.SD_LOGO=${js(logo)};
</script>
<script>
${rd('src/logic.js')}
</script>
<script>
${rd('src/app.js')}
</script>
</body>
</html>
`;
fs.writeFileSync(out, html);
console.log('built', out, Math.round(html.length / 1024) + ' KB', Object.keys(icons).length + ' icons');
