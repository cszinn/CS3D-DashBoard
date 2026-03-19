const fs = require('fs');

const file = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
const words = [
    'Printer', 'Trash2', 'Save', 'Plus', 'Zap', 'Package', 'TrendingUp',
    'AlertTriangle', 'UploadCloud', 'CheckCircle2', 'Clock', 'Send',
    'Download', 'DollarSign', 'Circle', 'Settings', 'Wrench',
    'CalculatorIcon', 'History', 'ChartPie', 'Diamond', 'Palette', 'FileText'
];

words.forEach(w => {
    // regex matches exact word boundries
    const count = (file.match(new RegExp(`\\b${w}\\b`, 'g')) || []).length;
    console.log(`${w}: ${count}`);
});
