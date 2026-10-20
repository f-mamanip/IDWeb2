const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // 1. ENDPOINT GET /api/estudiantes
    if (req.method === 'GET' && pathname === '/api/estudiantes') {
        const filePath = path.join(__dirname, 'data', 'estudiantes.json');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error al leer los datos' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
    }

    // 2. ENDPOINT POST /api/estudiantes
    if (req.method === 'POST' && pathname === '/api/estudiantes') {
        let body = '';
        
        // Capturar los chunks de datos del body
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const nuevoEstudiante = JSON.parse(body);
                const filePath = path.join(__dirname, 'data', 'estudiantes.json');

                fs.readFile(filePath, 'utf8', (err, data) => {
                    let estudiantes = [];
                    if (!err && data) {
                        estudiantes = JSON.parse(data);
                    }

                    // Asignar ID autoincremental simple
                    nuevoEstudiante.id = estudiantes.length > 0 ? estudiantes[estudiantes.length - 1].id + 1 : 1;
                    estudiantes.push(nuevoEstudiante);

                    // Guardar en el archivo JSON de persistencia local
                    fs.writeFile(filePath, JSON.stringify(estudiantes, null, 2), (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Error al guardar el registro' }));
                            return;
                        }
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(nuevoEstudiante));
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Formato JSON inválido' }));
            }
        });
        return;
    }

    // 3. SERVIR ARCHIVOS ESTÁTICOS DESDE /public
    let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    const extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
        case '.css':
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Ruta no existente -> 404 Not Found
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Ruta no encontrada', status: 404 }));
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Error interno del servidor: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});