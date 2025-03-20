import mysql from 'mysql2';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

const __dirname = import.meta.dirname;

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, '..', 'certs', 'ca-cert.pem')),
    key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'client-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'client-cert.pem')),
    rejectUnauthorized: false
  }
});

export default connection;
