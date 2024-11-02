const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Ser@ng161203', // Ganti dengan password database Anda
    database: 'portfolio'
});

// Koneksi ke database
db.connect(err => {
    if (err) throw err;
    console.log('MySQL connected');
});

// Konfigurasi multer untuk upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware untuk file statis
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Route untuk menampilkan portofolio
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rute login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ?';
    
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Error occurred while querying database.');
        }

        if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password); // Bandingkan password
            if (match) {
                return res.send('Login successful');
            } else {
                return res.status(401).send('Invalid username or password');
            }
        } else {
            return res.status(401).send('Invalid username or password');
        }
    });
});

// Route untuk menambah sertifikat
app.post('/upload/certificate', upload.single('certificate'), (req, res) => {
    const { title, issued_date } = req.body;
    const filePath = req.file.path;

    const sql = 'INSERT INTO certificates (title, issued_date, file_path) VALUES (?, ?, ?)';
    db.query(sql, [title, issued_date, filePath], (err, result) => {
        if (err) throw err;
        res.send('Sertifikat berhasil diupload');
    });
});

// Route untuk menambah proyek
app.post('/upload/project', (req, res) => {
    const { name, description, link } = req.body;

    const sql = 'INSERT INTO projects (name, description, link) VALUES (?, ?, ?)';
    db.query(sql, [name, description, link], (err, result) => {
        if (err) throw err;
        res.send('Proyek berhasil ditambahkan');
    });
});

// Route untuk menampilkan sertifikat
app.get('/certificates', (req, res) => {
    db.query('SELECT * FROM certificates', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Route untuk menampilkan proyek
app.get('/projects', (req, res) => {
    db.query('SELECT * FROM projects', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
