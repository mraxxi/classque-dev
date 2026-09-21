import * as fs from 'fs';
import * as path from 'path';
import ts from 'typescript';

const enPath = path.join(process.cwd(), 'src/shared/i18n/en.json');
const idPath = path.join(process.cwd(), 'src/shared/i18n/id.json');
const srcDir = path.join(process.cwd(), 'src/web');

function flattenKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k in obj) {
    const newPrefix = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      keys = keys.concat(flattenKeys(obj[k], newPrefix));
    } else {
      keys.push(newPrefix);
    }
  }
  return keys;
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const id = JSON.parse(fs.readFileSync(idPath, 'utf8'));

const enKeys = new Set(flattenKeys(en));
const idKeys = new Set(flattenKeys(id));

let errors = 0;

// Parity check
for (const key of enKeys) {
  if (!idKeys.has(key)) {
    console.error(`Missing key in id.json: ${key}`);
    errors++;
  }
}
for (const key of idKeys) {
  if (!enKeys.has(key)) {
    console.error(`Missing key in en.json: ${key}`);
    errors++;
  }
}

// Simple hardcoded string heuristic using TS AST
function checkNode(node: ts.Node, sourceFile: ts.SourceFile) {
  if (ts.isJsxText(node)) {
    const text = node.getText(sourceFile).trim();
    if (text.length > 0 && /[a-zA-Z]/.test(text)) {
      console.warn(`[WARN] Possible hardcoded text in ${sourceFile.fileName}: "${text}"`);
    }
  } else if (ts.isStringLiteral(node) && ts.isJsxAttribute(node.parent) && node.parent.name.getText() === 'placeholder') {
    const text = node.text;
    if (text.length > 0 && /[a-zA-Z]/.test(text)) {
      console.warn(`[WARN] Possible hardcoded placeholder in ${sourceFile.fileName}: "${text}"`);
    }
  }
  ts.forEachChild(node, child => checkNode(child, sourceFile));
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      const src = fs.readFileSync(fullPath, 'utf8');
      const sourceFile = ts.createSourceFile(fullPath, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      checkNode(sourceFile, sourceFile);
    }
  }
}

if (fs.existsSync(srcDir)) {
  walkDir(srcDir);
}

if (errors > 0) {
  process.exit(1);
} else {
  console.log('i18n check passed');
}
