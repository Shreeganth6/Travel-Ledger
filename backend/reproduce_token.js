
const jwt = require('jsonwebtoken');

const secret = "123456";
const userPayload = { user_id: 1 };

// 1. Generate Token
const token = jwt.sign(userPayload, secret, { expiresIn: '1d' });
console.log("Generated Token:", token);

// 2. Verify Token (Correct usage)
try {
    const decoded = jwt.verify(token, secret);
    console.log("Verification Success:", decoded);
} catch (e) {
    console.error("Verification Failed:", e.message);
}

// 3. Verify Token (Missing Bearer simulation)
const authHeaderMissingBearer = token; // Just the token
try {
    const extracted = authHeaderMissingBearer.split(' ')[1];
    if (!extracted) throw new Error("Token extraction failed (undefined)");
    jwt.verify(extracted, secret);
} catch (e) {
    console.log("Missing Bearer Simulation Result:", e.message);
}

// 4. Verify Token (With Bearer)
const authHeaderWithBearer = `Bearer ${token}`;
try {
    const extracted = authHeaderWithBearer.split(' ')[1];
    const decoded = jwt.verify(extracted, secret);
    console.log("With Bearer Simulation Result: Success", decoded.user_id);
} catch (e) {
    console.error("With Bearer Simulation Failed:", e.message);
}
