const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false,
});

const ServerConfig = sequelize.define('ServerConfig', {
    guildId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    autoRoleId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    geminiModel: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'gemini-2.5-flash'
    }
});

const syncDb = async () => {
    console.log('Starting Database sync...');
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synced with schema updates.');
    } catch (err) {
        console.error('Database sync failed:', err);
    }
};

module.exports = { sequelize, ServerConfig, syncDb };
