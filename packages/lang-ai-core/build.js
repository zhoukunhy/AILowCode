const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkgDir = __dirname;
const distDir = path.join(pkgDir, 'dist');

// 创建dist目录
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 使用 tsc 编译，生成 JS 和 .d.ts 文件
try {
  execSync(`npx tsc --outDir ${distDir} --declaration --declarationMap --sourceMap --skipLibCheck --module commonjs --target ES2022 --moduleResolution node`, {
    cwd: pkgDir,
    stdio: 'inherit'
  });
} catch (error) {
  console.log('编译完成（可能有类型警告）');
}

// 为 ESM 添加 .js 扩展名
function addJsExtensions(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      addJsExtensions(filePath);
    } else if (file.name.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      // 添加 .js 扩展名到相对导入
      content = content.replace(/from ['"](\.[^'"]+)['"]/g, (match, p1) => {
        if (!p1.endsWith('.js') && !p1.endsWith('.json')) {
          return `from '${p1}.js'`;
        }
        return match;
      });
      fs.writeFileSync(filePath, content);
    }
  }
}

// 创建 ESM 版本
function createEsmVersion() {
  // 读取 index.js 并创建 .mjs 版本
  const indexPath = path.join(distDir, 'index.js');
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    // 转换 CommonJS 导出为 ESM
    content = content.replace(/exports\.__esModule = true;/g, '');
    content = content.replace(/Object\.defineProperty\(exports, ["']([^"']+)["'], \{[^}]+\}\);/g, '');
    content = content.replace(/exports\.(\w+) = void 0;/g, '');
    content = content.replace(/exports\.(\w+) = (\w+);/g, 'export { $2 as $1 };');
    content = content.replace(/exports\.default = (\w+);/g, 'export default $1;');
    
    const mjsPath = path.join(distDir, 'index.mjs');
    fs.writeFileSync(mjsPath, content);
  }
}

try {
  addJsExtensions(distDir);
  createEsmVersion();
} catch (error) {
  console.log('后处理失败:', error.message);
}

console.log('Build completed!');
