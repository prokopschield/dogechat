"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { Client, } = require('dogehouse.js');
const { EVENT } = require('dogehouse.js/src/util/constraints');
const config_1 = require("./config");
const prompts_1 = __importDefault(require("prompts"));
const ADD_USER = 'Different user, or change tokens';
const app = new Client;
const config = config_1.getConfig();
if (!config.users) {
    config.users = {};
}
((async () => {
    let users = config.users;
    let usernames = Object.keys(config.users).map(uuid => config.users[uuid].username);
    var { userIndex, } = await prompts_1.default([
        {
            type: 'select',
            name: 'userIndex',
            message: 'Log in as',
            choices: [...usernames, ADD_USER],
        },
    ]);
    const uuid = Object.keys(users)[userIndex];
    if (users[uuid]) {
        var { token, refresh_token } = users[uuid];
    }
    else {
        var { token, refresh_token } = await prompts_1.default([
            {
                type: 'text',
                name: 'token',
                message: `Token`,
            },
            {
                type: 'text',
                name: 'refresh_token',
                message: `Refresh Token`,
            },
        ]);
    }
    await app.connect(token, refresh_token);
    if (app.bot.id && app.bot.username) {
        config.users[app.bot.id] = {
            username: app.bot.username,
            UUID: app.bot.id,
            token,
            refresh_token,
        };
        config_1.saveConfig();
    }
    const topRooms = await app.rooms.top;
    const { roomSel } = await prompts_1.default([
        {
            type: 'select',
            name: 'roomSel',
            message: 'Select room',
            choices: topRooms.map((room) => room.name),
        }
    ]);
    const room = topRooms[roomSel];
    await app.rooms.join(room);
    process.stdin.resume();
    process.stdin.on('data', (data) => {
        app.bot.sendMessage([data.toString('utf8')]);
    });
    app.on(EVENT.NEW_CHAT_MESSAGE, (message) => {
        process.stdout.write(`\r${message.author.username}${' '.repeat(17 - message.author.username.length)}=> ${message.content}\r\n$> `);
    });
})());
