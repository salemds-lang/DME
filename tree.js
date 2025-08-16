const fs = require('fs');
const path = require('path');

function printTree(dirPath, indent = '') {
  const items = fs.readdirSync(dirPath);
  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const pointer = isLast ? '└── ' : '├── ';
    console.log(indent + pointer + item);

    const fullPath = path.join(dirPath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      printTree(fullPath, indent + (isLast ? '    ' : '│   '));
    }
  });
}

printTree(__dirname);
