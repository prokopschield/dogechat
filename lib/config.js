"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveConfig = exports.getConfig = void 0;
const doge_json_1 = require("doge-json");
let config;
function getConfig() {
    return config ? config : (config = doge_json_1.read('.dogechat-config.json') || doge_json_1.read('config') || {});
}
exports.getConfig = getConfig;
function saveConfig(conf = config) {
    if (typeof conf === 'object') {
        config = {
            ...config,
            ...conf,
        };
        doge_json_1.write('.dogechat-config.json', config);
    }
}
exports.saveConfig = saveConfig;
