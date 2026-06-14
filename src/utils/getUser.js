const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "database", "users.json");

function getUser(userId) {
    let data = {};

    if (fs.existsSync(dbPath)) {
        data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }

    if (!data[userId]) {
        data[userId] = {
            wallet: 0,
            bank: 0
        };

        fs.writeFileSync(
            dbPath,
            JSON.stringify(data, null, 2)
        );
    }

    return data[userId];
}

module.exports = getUser;