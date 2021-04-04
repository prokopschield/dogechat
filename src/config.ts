import { read, write } from 'doge-json';

export interface Config {
	users: UsersConfig;
}

export interface UsersConfig {
	[UUID: string]: UserConfig;
}

export interface UserConfig {
	UUID: string;
	username: string;
	token: string;
	refresh_token: string;
}

let config: Config;

export function getConfig () {
	return config ? config : ( config = read('.dogechat-config.json') || read('config') || {} );
}

export function saveConfig (conf = config) {
	if (typeof conf === 'object') {
		config = {
			...config,
			...conf,
		};
		write('.dogechat-config.json', config);
	}
}
