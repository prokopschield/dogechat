const {
	Client,
} = require('dogehouse.js');

const {
	EVENT
} = require('dogehouse.js/src/util/constraints');

import {
	getConfig,
	saveConfig,
	UserConfig
} from './config';

import prompts from 'prompts';

const ADD_USER = 'Different user, or change tokens';

const app = new Client;
const config = getConfig();

if (!config.users) {
	config.users = {};
}

((async () => {

	let users: {
		[UUID: string]: UserConfig;
	} = config.users;

	let usernames = Object.keys(config.users).map(uuid => config.users[uuid].username);

	var {
		userIndex,
	} = await prompts([
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
	} else {
		var { token, refresh_token }: {
			token: string;
			refresh_token: string;
		} = await prompts([
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
		}
		saveConfig();
	}

	const topRooms = await (app.rooms as any).top;

	const { roomSel } = await prompts([
		{
			type: 'select',
			name: 'roomSel',
			message: 'Select room',
			choices: topRooms.map((room: any) => room.name),
		}
	]);

	const room = topRooms[roomSel];
	await app.rooms.join(room);

	process.stdin.resume();

	process.stdin.on('data', (data: Buffer) => {
		app.bot.sendMessage([data.toString('utf8')]);
	});

	app.on(EVENT.NEW_CHAT_MESSAGE, (message: any) => {
		process.stdout.write(`\r${message.author.username}${' '.repeat(17 - message.author.username.length)}=> ${message.content}\r\n$> `);
	});

})());
