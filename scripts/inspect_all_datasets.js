const fs = require('fs');
const path = require('path');

const datasetsDir = path.join(__dirname, '..', 'datasets');
const files = fs.readdirSync(datasetsDir).filter(f => f.endsWith('.csv'));

files.forEach(f => {
  const filepath = path.join(datasetsDir, f);
  const content = fs.readFileSync(filepath, 'utf8').trim();
  const lines = content.split(/\r?\n/);
  const header = lines[0].split(',').map(s => s.replace(/["\r]/g, '').trim());
  const rows = lines.slice(1).map(l => l.split(',').map(s => s.replace(/["\r]/g, '').trim()));

  console.log(`==================================================`);
  console.log(`📂 DATASET FILE: ${f}`);
  console.log(`==================================================`);
  console.log(`- Dimensions: ${rows.length} rows, ${header.length} columns`);
  console.log(`- Column Headers:`, header);

  const missingByCol = {};
  header.forEach(c => missingByCol[c] = 0);

  const rowSet = new Set();
  let duplicateRows = 0;

  rows.forEach(r => {
    const str = r.join(',');
    if (rowSet.has(str)) duplicateRows++;
    else rowSet.add(str);

    r.forEach((val, idx) => {
      if (val === '' || val === undefined || val === null) {
        if (header[idx]) missingByCol[header[idx]]++;
      }
    });
  });

  console.log(`- Duplicate Rows: ${duplicateRows}`);
  console.log(`- Missing Values per Column:`, missingByCol);
  console.log(`- Sample Row 1:`, rows[0]);
  console.log(``);
});
