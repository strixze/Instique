const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('<<<<<<< HEAD')) return;
    
    // Regular expression to match conflict blocks
    const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [0-9a-f]+\r?\n/g;
    
    const newContent = content.replace(regex, '$1');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Resolved conflicts in ${filePath}`);
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.includes('errorlogs')) {
                processFile(fullPath);
            }
        }
    }
}

walkDir(path.join(__dirname, 'client/src/pages/school-admin'));
if (fs.existsSync(path.join(__dirname, 'server/errorlogs'))) {
    processFile(path.join(__dirname, 'server/errorlogs'));
}
