const bcrypt = require('bcrypt');

const hash = bcrypt.hashSync('admin123', 10);
console.log('Hashed password for "admin123":');
console.log(hash);
console.log('\n请手动更新数据库中的 users 表:');
console.log("UPDATE users SET password = '" + hash + "' WHERE username = 'admin';");