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
export declare function getConfig(): any;
export declare function saveConfig(conf?: Config): void;
