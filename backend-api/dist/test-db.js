"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./config/db"));
async function test() {
    try {
        console.log('Testing connection to database...');
        const usersCount = await db_1.default.user.count();
        console.log(`Connection successful! Total users in database: ${usersCount}`);
    }
    catch (error) {
        console.error('Database connection failed:', error);
    }
    finally {
        await db_1.default.$disconnect();
    }
}
test();
