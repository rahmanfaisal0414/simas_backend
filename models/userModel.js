const pool = require('../config/db');

const findUserByEmail = async (email) => {
  const res = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return res.rows[0];
};

const findUserByUsername = async (username) => {
  const res = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
  return res.rows[0];
};

const updatePassword = async (email, hashedPassword) => {
  const res = await pool.query(
    `UPDATE users 
     SET password = $1 
     WHERE email = $2 
     RETURNING id, username, email`,
    [hashedPassword, email]
  );
  return res.rows[0];
};

const findUserById = async (id) => {
  const res = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return res.rows[0];
};

const updatePasswordById = async (id, hashedPassword) => {
  const res = await pool.query(
    `UPDATE users 
     SET password = $1 
     WHERE id = $2 
     RETURNING id, username, email`,
    [hashedPassword, id]
  );
  return res.rows[0];
};


module.exports = {
  findUserByEmail,
  findUserByUsername,
  updatePassword,
  updatePasswordById,
  findUserById
};
