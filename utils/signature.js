const crypto = require("crypto");

const SECRET = process.env.SIG_SECRET || "rahasia-super-aman";

function generateSig(data) {
  return crypto
    .createHmac("sha1", SECRET)
    .update(String(data))
    .digest("base64url");
}

function verifySig(data, sig) {
  const expectedSig = generateSig(data);
  return sig === expectedSig;
}

module.exports = { generateSig, verifySig };
