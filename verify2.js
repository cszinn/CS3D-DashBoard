const fs = require('fs');
const text = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
['custoFixoMes', 'pecasEstMes', 'valorImpressora', 'vidaUtil'].forEach(v => {
   console.log(v, text.split(v).length - 1);
});
