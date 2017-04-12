var redis = require('../lib/redis'),
	log = require('../lib/log'),
	env = require('../env/env'),
	queue = require('../queue/queue'),
	config = require('../config/config');

var publishInterval = null,
	stateInterval = null;

module.exports.start = function() {
	log.important(process.pid, 'became a publisher');
	
	publishInterval = setInterval(publish, env.delay.publish);
	stateInterval = setInterval(setState, 250);
};

module.exports.stop = function() {
	log.important(process.pid, 'stoped as a publisher');
	clearInterval(publishInterval);
	clearInterval(stateInterval);
};

function setState() {
	redis.setex(config.redis_paths.pub, 2, process.pid);
}

function publish() {
	var msg = getMessage();
	if (msg % 10000 == 0) log.important(process.pid, 'pushed', msg, 'msgs');
	if (msg == 1000000) log.important(process.pid, 'pushed one million messages');
	queue.push(msg);
}

function getMessage(){
	this.cnt = this.cnt || 0; 
	
	return this.cnt++;
}