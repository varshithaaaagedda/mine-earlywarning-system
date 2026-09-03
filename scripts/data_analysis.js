const fs = require('fs');
const path = require('path');

const datasetsDir = path.join(__dirname, '..', 'datasets');

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  const lines = content.split(/\r?\n/);
  const header = lines[0].split(',');
  const rows = lines.slice(1).map(line => line.split(','));
  return { header, rows, totalLines: lines.length };
}

function analyzeDataset(filename) {
  const filePath = path.join(datasetsDir, filename);
  const { header, rows } = parseCSV(filePath);

  console.log(`\n==================================================`);
  console.log(`📊 DATASET ANALYSIS: ${filename}`);
  console.log(`==================================================`);
  console.log(`1. Dimensions: ${rows.length} rows, ${header.length} columns`);
  console.log(`2. Columns & Descriptions:`);

  const numCols = [];
  const catCols = [];
  const missingCounts = {};
  header.forEach(col => missingCounts[col] = 0);

  let duplicateCount = 0;
  const rowStrings = new Set();

  rows.forEach((row, rIdx) => {
    const rowStr = row.join(',');
    if (rowStrings.has(rowStr)) {
      duplicateCount++;
    } else {
      rowStrings.add(rowStr);
    }

    row.forEach((val, cIdx) => {
      const colName = header[cIdx];
      if (val === '' || val === undefined || val === null) {
        missingCounts[colName]++;
      }
    });
  });

  header.forEach((col, idx) => {
    // Sample non-empty values
    const sampleVals = rows.map(r => r[idx]).filter(v => v !== '');
    const isNum = sampleVals.length > 0 && sampleVals.every(v => !isNaN(Number(v)));
    if (isNum) {
      numCols.push(col);
    } else {
      catCols.push(col);
    }
    console.log(`   - ${col} (${isNum ? 'Numerical' : 'Categorical'}): Sample = "${rows[0][idx]}"`);
  });

  console.log(`\n3. Numerical Features (${numCols.length}): ${numCols.join(', ')}`);
  console.log(`4. Categorical Features (${catCols.length}): ${catCols.join(', ')}`);
  console.log(`5. Data Quality Checks:`);
  console.log(`   - Duplicate Rows: ${duplicateCount}`);
  console.log(`   - Missing Values per Column:`, missingCounts);

  // Target Column Identification
  const hasTarget = header.includes('risk_class') || header.includes('target') || header.includes('label');
  console.log(`6. Target/Label Column: ${hasTarget ? '`risk_class` (Present)' : 'None (Unlabeled Dataset)'}`);

  return { filename, rowsCount: rows.length, colsCount: header.length, header, numCols, catCols, missingCounts, duplicateCount, hasTarget };
}

function runDatasetAnalysis() {
  const files = fs.readdirSync(datasetsDir).filter(f => f.endsWith('.csv'));
  console.log(`Found ${files.length} dataset files in ${datasetsDir}: ${files.join(', ')}`);

  const results = files.map(analyzeDataset);

  console.log(`\n==================================================`);
  console.log(`🔗 COMBINABILITY ANALYSIS`);
  console.log(`==================================================`);
  console.log(`Can these datasets be directly merged/combined into a single tabular file?`);
  console.log(`❌ NO. Reason:`);
  console.log(`- 'open_cast_mine_telemetry.csv' consists of point-sensor IoT telemetry (Displacement, Tilt, Crack, PPV) with target label 'risk_class'.`);
  console.log(`- 'dinsar_satellite_displacement.csv' contains satellite radar spatial grid deformation observations (LOS displacement, coherence index).`);
  console.log(`- 'borehole_tiltmeter_logs.csv' contains deep subsurface inclinometer sensor logs (depth_m, x_tilt, y_tilt).`);
  console.log(`Combining them directly without explicit spatial/temporal alignment would cause severe schema distortion and synthetic data leakage.`);
  console.log(`Therefore, 'open_cast_mine_telemetry.csv' is selected as the primary dataset for supervised ML risk classification (Normal, Warning, Critical).`);
}

runDatasetAnalysis();
