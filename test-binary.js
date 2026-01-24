const path = require('path');

const binaryPath = path.join(__dirname, 'node_modules', '@next', 'swc-win32-x64-msvc', 'next-swc.win32-x64-msvc.node');

console.log(`Attempting to load binary from: ${binaryPath}`);

try {
    const mod = require(binaryPath);
    console.log("✅ Success! Binary loaded correctly.");
} catch (e) {
    console.error("❌ Failed to load binary.");
    console.error("Error Code:", e.code);
    console.error("Error Message:", e.message);
}
