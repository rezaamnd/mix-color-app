// Global reference array with localStorage support
let references = JSON.parse(localStorage.getItem('colorReferences')) || [
    { name: "Black", color: "#000000" },
    { name: "White", color: "#FFFFFF" },
    { name: "Red Brown", color: "#621918" },
    { name: "Red WIne", color: "#523C43" },
    { name: "Dark Brown", color: "#322020" },
    { name: "Red", color: "#A80002" },
    { name: "Orange", color: "#AF0000" },
    { name: "Dark Yellow", color: "#A36100" },
    { name: "Yellow", color: "#CF9A00" },
    { name: "Lemon Yellow", color: "#C4A700" },
    { name: "Dark Green", color: "#c4a700" },
    { name: "Dark Blue", color: "#0A0B1E" },
    { name: "Blue", color: "#08185D" },
    { name: "Neon Magenta", color: "#D70069" },
    { name: "Neon Pink", color: "#FA0068" },
    { name: "Neon Red", color: "#FD003b" },
    { name: "Neon Orange", color: "#FF9400" },
    { name: "Neon Yellow", color: "#CBE700" },
    { name: "Neon Green", color: "#00C61D" },
    { name: "Neon Purple", color: "#82108B" }
  
  ];
  
  const refForm = document.getElementById('refForm');
  const refTable = document.getElementById('refTable').querySelector('tbody');
  const targetHex = document.getElementById('targetHex');
  const targetPicker = document.getElementById('targetPicker');
  const previewBox = document.getElementById('previewBox');
  const resultTable = document.getElementById('resultTable').querySelector('tbody');
  const convertTable = document.getElementById('convertTable').querySelector('tbody');
  const totalWeight = document.getElementById('totalWeight');
  
  function saveReferences() {
    localStorage.setItem('colorReferences', JSON.stringify(references));
  }
  
  function hexToRgb(hex) {
    let bigint = parseInt(hex.replace('#', ''), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return { r, g, b };
  }
  
  function rgbToLab({ r, g, b }) {
    const xyz = rgbToXyz(r, g, b);
    return xyzToLab(xyz);
  }
  
  function rgbToXyz(r, g, b) {
    r = r / 255; g = g / 255; b = b / 255;
    r = r > 0.04045 ? Math.pow((r + 0.055)/1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055)/1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055)/1.055, 2.4) : b / 12.92;
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    return { x: x * 100, y: y * 100, z: z * 100 };
  }
  
  function xyzToLab({ x, y, z }) {
    const refX =  95.047;
    const refY = 100.000;
    const refZ = 108.883;
    x = x / refX; y = y / refY; z = z / refZ;
    x = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + 16/116;
    y = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + 16/116;
    z = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + 16/116;
    const l = (116 * y) - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);
    return { l, a, b };
  }
  
  // Delta E 2000 for high precision color difference
  function deltaE(lab1, lab2) {
    const deg2rad = Math.PI / 180;
    const rad2deg = 180 / Math.PI;
  
    const avgL = (lab1.l + lab2.l) / 2;
    const c1 = Math.sqrt(lab1.a ** 2 + lab1.b ** 2);
    const c2 = Math.sqrt(lab2.a ** 2 + lab2.b ** 2);
    const avgC = (c1 + c2) / 2;
  
    const G = 0.5 * (1 - Math.sqrt((avgC ** 7) / (avgC ** 7 + 25 ** 7)));
    const a1p = lab1.a * (1 + G);
    const a2p = lab2.a * (1 + G);
    const c1p = Math.sqrt(a1p ** 2 + lab1.b ** 2);
    const c2p = Math.sqrt(a2p ** 2 + lab2.b ** 2);
  
    const h1p = Math.atan2(lab1.b, a1p) * rad2deg;
    const h2p = Math.atan2(lab2.b, a2p) * rad2deg;
  
    const deltL = lab2.l - lab1.l;
    const deltC = c2p - c1p;
  
    let deltH = 0;
    if (c1p * c2p !== 0) {
      let dh = h2p - h1p;
      if (Math.abs(dh) > 180) dh += (dh > 0 ? -360 : 360);
      deltH = 2 * Math.sqrt(c1p * c2p) * Math.sin((dh / 2) * deg2rad);
    }
  
    const avgLp = (lab1.l + lab2.l) / 2;
    const avgCp = (c1p + c2p) / 2;
    let avgHp = (h1p + h2p) / 2;
    if (Math.abs(h1p - h2p) > 180) avgHp += (h1p + h2p < 360 ? 180 : -180);
  
    const T = 1 - 0.17 * Math.cos(deg2rad * (avgHp - 30)) +
                0.24 * Math.cos(deg2rad * (2 * avgHp)) +
                0.32 * Math.cos(deg2rad * (3 * avgHp + 6)) -
                0.20 * Math.cos(deg2rad * (4 * avgHp - 63));
  
    const SL = 1 + ((0.015 * ((avgLp - 50) ** 2)) / Math.sqrt(20 + ((avgLp - 50) ** 2)));
    const SC = 1 + 0.045 * avgCp;
    const SH = 1 + 0.015 * avgCp * T;
  
    const deltTheta = 30 * Math.exp(-(((avgHp - 275) / 25) ** 2));
    const RC = 2 * Math.sqrt((avgCp ** 7) / (avgCp ** 7 + 25 ** 7));
    const RT = -RC * Math.sin(2 * deg2rad * deltTheta);
  
    return Math.sqrt(
      (deltL / SL) ** 2 +
      (deltC / SC) ** 2 +
      (deltH / SH) ** 2 +
      RT * (deltC / SC) * (deltH / SH)
    );
  }
  
  [targetHex, targetPicker].forEach(input => {
    input.addEventListener('input', () => {
      const hex = input.value;
      targetHex.value = hex;
      targetPicker.value = hex;
      previewBox.style.backgroundColor = hex;
    });
  });
  
  
  refForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('refName').value;
    const color = document.getElementById('refColor').value;
    references.push({ name, color });
    saveReferences();
    renderRefTable();
    refForm.reset();
  });
  
  function renderRefTable() {
    refTable.innerHTML = '';
    references.forEach((ref, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${ref.name}</td>
        <td style="background:${ref.color};"></td>
        <td style=>${ref.color}</td>
        <td><button onclick="removeRef(${index})">Hapus</button></td>
      `;
      refTable.appendChild(row);
    });
  }
  
  function removeRef(index) {
    references.splice(index, 1);
    saveReferences();
    renderRefTable();
  }
  
  document.getElementById('findMix').addEventListener('click', () => {
    if (references.length === 0) return alert("Tambahkan warna referensi terlebih dahulu");
    const target = hexToRgb(targetHex.value);
    const targetLab = rgbToLab(target);
  
    const distances = references.map(ref => {
      const refRgb = hexToRgb(ref.color);
      const refLab = rgbToLab(refRgb);
      const dE = deltaE(targetLab, refLab);
      return { ...ref, dE };
    });
  
    distances.sort((a, b) => a.dE - b.dE);
    const topMatches = distances.slice(0, 4); // Ambil 3 atau 4 warna terdekat
  
    const inverted = topMatches.map(d => ({ ...d, weight: 1 / (d.dE + 0.0001) }));
    const totalWeightVal = inverted.reduce((sum, d) => sum + d.weight, 0);
    const results = inverted.map(d => ({
      name: d.name,
      color: d.color,
      percent: ((d.weight / totalWeightVal) * 100).toFixed(2)
    })).filter(r => r.percent >= 10);
  
    renderResultTable(results);
    renderConvertTable(results);
  });
  
  function renderResultTable(results) {
    resultTable.innerHTML = '';
    results.forEach(r => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${r.name}</td><td style="background:${r.color};"><td style=>${r.color}</td><td>${r.percent}</td>`;
      resultTable.appendChild(row);
    });
  }
  
  function renderConvertTable(results) {
    convertTable.innerHTML = '';
    const total = parseFloat(totalWeight.value);
    results.forEach(r => {
      const row = document.createElement('tr');
      const amount = ((r.percent / 100) * total).toFixed(2);
      row.innerHTML = `<td>${r.name}</td><td>${amount}</td>`;
      convertTable.appendChild(row);
    });
  }
  
  // Initialize render
  renderRefTable();
  
  // --- Fitur Menyimpan dan Menampilkan Riwayat Hasil Pencarian ---
  
  const mixHistory = JSON.parse(localStorage.getItem('mixResults')) || [];
  const saveMixBtn = document.getElementById('saveMix');
  const showHistoryBtn = document.getElementById('showHistory');
  const historyContainer = document.getElementById('historyContainer');
  
  saveMixBtn.addEventListener('click', () => {
  const savedTarget = targetHex.value;
  const savedTotal = totalWeight.value;
  const savedResult = [];
  
  resultTable.querySelectorAll('tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    savedResult.push({
      name: cells[0].innerText,
      color: cells[1].innerText,
      percent: cells[2].innerText
    });
  });
  
  mixHistory.push({
    date: new Date().toLocaleString(),
    target: savedTarget,
    total: savedTotal,
    result: savedResult
  });
  
  localStorage.setItem('mixResults', JSON.stringify(mixHistory));
  alert("Hasil pencampuran disimpan!");
  });
  
  showHistoryBtn.addEventListener('click', () => {
  historyContainer.innerHTML = '';
  if (mixHistory.length === 0) {
    historyContainer.innerHTML = '<p>Tidak ada riwayat.</p>';
    return;
  }
  
  mixHistory.forEach((entry, i) => {
    const section = document.createElement('div');
    section.style.marginBottom = '1em';
    section.innerHTML = `<strong>#${i + 1} - ${entry.date}</strong><br>
      Target: <span style="background:${entry.target}; padding:0 0.5em;">${entry.target}</span><br>
      Total: ${entry.total} gr/ml
      <table border="1" style="margin-top:5px;"><tr><th>Nama</th><th>Warna</th><th>Persen</th></tr>
      ${entry.result.map(r => `<tr><td>${r.name}</td><td style="background:${r.color};">${r.color}</td><td>${r.percent}</td></tr>`).join('')}
      </table>`;
    historyContainer.appendChild(section);
  });
  });
  
  
