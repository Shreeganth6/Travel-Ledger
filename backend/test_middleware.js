
const authMiddleware = require('./middleware/authMiddleware');
const jwt = require('jsonwebtoken');

const secret = "123456";

// Mock Response
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        console.log(`Response [${res.statusCode}]:`, JSON.stringify(data));
        return res;
    };
    return res;
};

// Mock Next
const mockNext = () => console.log("Next() called");

// 1. Valid Token
console.log("--- Test 1: Valid Token ---");
const validToken = jwt.sign({ user_id: 1 }, secret, { expiresIn: '1h' });
const req1 = { headers: { authorization: `Bearer ${validToken}` } };
authMiddleware(req1, mockRes(), mockNext);

// 2. Missing Bearer Prefix
console.log("\n--- Test 2: Missing Bearer Prefix ---");
const req2 = { headers: { authorization: validToken } };
authMiddleware(req2, mockRes(), mockNext);

// 3. Expired Token (Simulated with short expiry)
console.log("\n--- Test 3: Expired Token ---");
const expiredToken = jwt.sign({ user_id: 1 }, secret, { expiresIn: '-1s' });
const req3 = { headers: { authorization: `Bearer ${expiredToken}` } };
authMiddleware(req3, mockRes(), mockNext);

// 4. Invalid Signature
console.log("\n--- Test 4: Invalid Signature ---");
const invalidToken = jwt.sign({ user_id: 1 }, "wrongsecret", { expiresIn: '1h' });
const req4 = { headers: { authorization: `Bearer ${invalidToken}` } };
authMiddleware(req4, mockRes(), mockNext);
