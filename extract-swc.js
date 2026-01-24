const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tgz = 'swc-win32-x64-msvc-16.1.1.tgz';
const targetDir = path.join('node_modules', '@next', 'swc-win32-x64-msvc');

if (!fs.existsSync(tgz)) {
    console.error('File not found:', tgz);
    process.exit(1);
}

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

console.log(`Extracting ${tgz} to ${targetDir}...`);

try {
    // Windows might have tar. Use it.
    // Clean target first? Maybe not needed if empty.
    
    // Extract to temp first to handle the 'package' root folder typical in npm tgz
    const tempDir = 'temp_swc_extract';
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    // Using tar to extract. -C changes cwd.
    execSync(`tar -xzf "${tgz}" -C "${tempDir}"`);
    
    // Move contents from temp/package to target
    const packageDir = path.join(tempDir, 'package');
    if (fs.existsSync(packageDir)) {
        // Copy recursive
        fs.cpSync(packageDir, targetDir, { recursive: true });
        console.log('Files copied successfully.');
    } else {
        console.error('Expected "package" folder inside tgz not found.');
    }
    
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
    
} catch (e) {
    console.error('Extraction failed:', e.message);
    process.exit(1);
}
