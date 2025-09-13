const { commandPrefixes } = require(`${BASE_DIR}/config`);

exports.verifyPrefix = (prefix) => commandPrefixes.includes(prefix);
exports.hasTypeOrCommand = ({ type, command }) => type && command;