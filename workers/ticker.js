var redis = require('../lib/redis'),
	env = require('../env/env'),
	log = require('../lib/log'),
	queue = require('../queue/queue'),
	config = require('../config/config');

var timer = null,
	ticks = 0,
	listeners = [];

module.exports.start = function() {
	if (timer) return;

	setInterval(tick, 500);
};

module.exports.addEvent = function(cb, every) {
	listeners.push({
		executor: cb,
		every: (every || 1)
	});
	return listeners.length - 1;
};

module.exports.removeEvent = function(index) {
	listeners.splice(index, 1);
};

function tick() {
	ticks++;
	for (var i = 0; i < listeners.length; i++) {
		if (ticks % listeners[i].every == 0)
			listeners[i].executor();
	}
}