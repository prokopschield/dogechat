import {
	BotUser,
	Client,
	MessageController,
} from 'dogehouse.js';

import {
	EVENT
} from 'dogehouse.js/src/util/constraints';

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

	let { users }: {
		[UUID: string]: UserConfig;
	} = config;

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
			choices: topRooms.map(room => room.name),
		}
	]);

	const room = topRooms[roomSel];
	await app.rooms.join(room);

	process.stdin.resume();

	const maxRows = parseInt(process.env.LINES) || process.stdout.rows || 20;
	let lines: string[] = [''];
	let msgbuf = '';
	let maxll = 0;

	process.stdout.write('> ');
	process.stdin.on('data', (data: Buffer) => {
		msgbuf += data.toString('utf-8');
		if (msgbuf.match(/[\r\n]/)) {
			const message = msgbuf.trim();
			if (message.length > maxll) {
				maxll = message.length;
			}
			app.bot.sendMessage([ message ]);
			msgbuf = '';
			process.stdout.write('\x1b[A' + ' '.repeat(maxll) + '\r' + '> ');
		}
	});

	app.on(EVENT.NEW_CHAT_MESSAGE, (message: MessageController) => {
		if (lines.length > (process.stdout.rows || maxRows)) {
			lines.shift();
		}
		let line = `${message.author.username}: ${message}`;
		if (line.length >= maxll) {
			maxll = line.length;
		} else {
			line += ' '.repeat(maxll - line.length);
		}
		lines.push(line);
		if (maxll > process.stdout.columns) sliceLines();
		process.stdout.write( ''
			+ '\x1b[A'.repeat(lines.length + 2)
			+ lines.join('\r\n')
			+ '\r\n> \x1b[F'
		);
	});

	function sliceLines () {
		const maxlen = process.stdout.columns - 8;
		const regex = new RegExp(`^.{0,${maxlen}} `);
		const newlines: string[] = [];
		for (let line of lines) {
			if (line.length <= maxlen) {
				newlines.push(line);
			} else {
				let first = true;
				do {
					let [ segment ] = line.match(regex);
					line = line.substr(segment.length);
					if (first) {
						first = false;
						newlines.push(segment.trim());
					} else {
						newlines.push('....' + segment.trim());
					}
				} while (line.length > maxlen);
				newlines.push('....' + line);
			}
		}
		lines = newlines;
	}

})());
