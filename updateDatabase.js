const db = require("./src/database/database");

try {

    db.prepare(`
        ALTER TABLE users
        ADD COLUMN wins INTEGER DEFAULT 0
    `).run();

    console.log("✅ Coluna wins criada");

} catch (err) {

    console.log("⚠️ wins já existe");
}

try {

    db.prepare(`
        ALTER TABLE users
        ADD COLUMN losses INTEGER DEFAULT 0
    `).run();

    console.log("✅ Coluna losses criada");

} catch (err) {

    console.log("⚠️ losses já existe");
}

console.log("🏁 Banco atualizado");