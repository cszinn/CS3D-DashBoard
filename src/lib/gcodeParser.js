/**
 * Utilitário para processar arquivos G-Code e extrair Tempo e Peso.
 * Migrado da lógica original do Carlos para React/Vite.
 */
export const processGCodeFile = async (file) => {
    return new Promise((resolve, reject) => {
        const fileSize = file.size;
        const chunkSize = 50 * 1024; // 50KB
        const reader = new FileReader();

        const parseContent = (text) => {
            const content = text.toLowerCase();

            let hours = 0;
            let minutes = 0;
            let weight = 0;
            let foundTime = false;

            // === 1. TEMPO ===
            // Flashforge/Cura/Prusa patterns
            const matchFlashforge = content.match(/printing time.*=\s*(.*)/);
            const matchSeconds = content.match(/;?\s*time\s*[:=]\s*(\d+)/);

            if (matchFlashforge) {
                const timeStr = matchFlashforge[1];
                const d = timeStr.match(/(\d+)d/);
                const h = timeStr.match(/(\d+)h/);
                const m = timeStr.match(/(\d+)m/);
                const s = timeStr.match(/(\d+)s/);

                if (d) hours += parseInt(d[1]) * 24;
                if (h) hours += parseInt(h[1]);
                if (m) minutes += parseInt(m[1]);
                if (s && parseInt(s[1]) > 30) minutes++;
                foundTime = true;
            }
            else if (matchSeconds) {
                const totalSec = parseInt(matchSeconds[1]);
                if (totalSec > 0) {
                    hours = Math.floor(totalSec / 3600);
                    minutes = Math.floor((totalSec % 3600) / 60);
                    foundTime = true;
                }
            }

            // Normaliza minutos
            hours += Math.floor(minutes / 60);
            minutes = minutes % 60;

            // === 2. PESO ===
            const matchWeightG = content.match(/filament used \[g\]\s*=\s*(\d+(\.\d+)?)/);
            const matchWeightCura = content.match(/filament used:.*,\s*(\d+(\.\d+)?)\s*g/);
            const matchWeightGen = content.match(/filament weight\s*=\s*(\d+(\.\d+)?)/);

            if (matchWeightG) weight = parseFloat(matchWeightG[1]);
            else if (matchWeightCura) weight = parseFloat(matchWeightCura[1]);
            else if (matchWeightGen) weight = parseFloat(matchWeightGen[1]);

            return { hours, minutes, weight, foundTime };
        };

        reader.onload = (e) => {
            const result = parseContent(e.target.result);
            resolve({
                ...result,
                fileName: file.name.replace(/\.gcode$/i, '').replace(/\.gco$/i, '')
            });
        };

        reader.onerror = (err) => reject(err);

        // LÊ INICIO E FIM DO ARQUIVO (Estratégia Otimizada)
        if (fileSize <= (chunkSize * 2)) {
            reader.readAsText(file);
        } else {
            const headReader = new FileReader();
            headReader.onload = (eHead) => {
                const headContent = eHead.target.result;
                const tailReader = new FileReader();
                tailReader.onload = (eTail) => {
                    const tailContent = eTail.target.result;
                    const fakeEvent = { target: { result: headContent + "\n" + tailContent } };
                    reader.onload(fakeEvent);
                };
                const blobTail = file.slice(fileSize - chunkSize, fileSize);
                tailReader.readAsText(blobTail);
            };
            const blobHead = file.slice(0, chunkSize);
            headReader.readAsText(blobHead);
        }
    });
};
