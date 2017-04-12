var env = require('../env/env');

module.exports.debug = function() {
	if (env.stage == 'test') {
		return;
	}

	console.log.apply(this, arguments);
};

module.exports.important = function() {
	console.log.apply(this, arguments);
};