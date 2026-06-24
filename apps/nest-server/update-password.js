const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'ai_lowcode.sqlite');
const db = new sqlite3.Database(dbPath);

const hashedPassword = bcrypt.hashSync('admin123', 10);
console.log('Hashed password:', hashedPassword);

db.serialize(() => {
  db.run('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'admin'], function(err) {
    if (err) {
      console.error('更新失败:', err.message);
    } else if (this.changes > 0) {
      console.log('✅ 密码更新成功');
      console.log('   用户名: admin');
      console.log('   密码: admin123');
    } else {
      console.log('❌ 用户 admin 不存在，正在创建...');
      
      db.run(`
        INSERT INTO users (username, password, email, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, ['admin', hashedPassword, 'admin@example.com', 'admin', 'active'], function(err) {
        if (err) {
          console.error('创建失败:', err.message);
        } else {
          console.log('✅ 用户 admin 创建成功');
          console.log('   用户名: admin');
          console.log('   密码: admin123');
        }
      });
    }
  });

  db.get('SELECT id, username, email, role, status FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (err) {
      console.error('查询失败:', err.message);
    } else {
      console.log('\n用户信息:', row);
    }
    
    db.close();
  });
});