const PDF_JS_VERSION = '3.11.174';

export function buildPdfJsPreviewHtml(fileName: string, maxPages = 3): string {
  const escapedName = fileName.replace(/'/g, "\\'");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    #status {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      color: #60646c;
      text-align: center;
      padding: 32px 16px;
    }
    #pages { padding: 8px 8px 16px; }
    canvas {
      display: block;
      width: 100% !important;
      height: auto !important;
      margin: 0 auto 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    }
  </style>
</head>
<body>
  <div id="status">Cargando vista previa del PDF…</div>
  <div id="pages"></div>
  <script>
    (function () {
      var fileName = '${escapedName}';
      var maxPages = ${maxPages};
      var status = document.getElementById('status');
      var container = document.getElementById('pages');

      if (!window.pdfjsLib) {
        status.textContent = 'No se pudo cargar el visor PDF.';
        return;
      }

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.worker.min.js';

      pdfjsLib.getDocument(fileName).promise
        .then(function (pdf) {
          status.style.display = 'none';
          var pagesToRender = Math.min(pdf.numPages, maxPages);

          for (var pageNum = 1; pageNum <= pagesToRender; pageNum++) {
            (function (num) {
              pdf.getPage(num).then(function (page) {
                var viewport = page.getViewport({ scale: 1.15 });
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                container.appendChild(canvas);
                return page.render({ canvasContext: context, viewport: viewport }).promise;
              });
            })(pageNum);
          }
        })
        .catch(function () {
          status.textContent = 'No se pudo mostrar la vista previa del PDF.';
        });
    })();
  </script>
</body>
</html>`;
}
