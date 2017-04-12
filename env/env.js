var DEFAULT_ENV = 'local';

var params = process.argv,
	stage = params[2] || DEFAULT_ENV,
	availableEnvironments = ['local', 'test', 'getErrors'];

if (availableEnvironments.indexOf(stage) == -1) {
	throw new Error('Unknow environment');
}

if (stage == 'getErrors') {
	return module.exports = {stage: stage, infoMode: true};
}

console.log('Using', stage, 'environment');

var environment = require('./env.' + (params[2] || DEFAULT_ENV) + '.json');
environment.name = createName();
environment.stage = stage;

module.exports = require('./env.' + (params[2] || DEFAULT_ENV) + '.json');

function createName() {
	var crypto = require('crypto');

	var md5 = crypto.createHash('md5');
	md5.update(String(process.pid) + String(new Date().getTime) + String(Math.random() * 1000));

	return md5.digest('hex');
}