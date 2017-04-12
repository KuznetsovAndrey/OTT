/*
	Реализация очереди методами redis - rpop, rpush. 
	При таком подходе точно известно, что каждый пользователь получит разные сообщения
*/

var redis = require('../lib/redis'),
	log = require('../lib/log'),
	env = require('../env/env'),
	config = require('../config/config');

/*
	В основной очереди хранятся сообщения, которые необходимо обработать 
*/
module.exports.push = function(msg, cb) {
	log.debug(process.pid, 'pushed msg', msg);
	redis.rpush(config.redis_paths.messages, msg, function(err, res) {
		if (cb) cb(err, res);
	});
};

module.exports.pop = function(cb) {
	redis.rpop(config.redis_paths.messages, function(err, res) {
		log.debug(process.pid, 'got', res);
		if (cb) cb(err, res);
	});	
};

/*
	Обработанные сообщения и ошибки хранятся в других очередях
*/

module.exports.pushHangledMessage = function(msg, cb) {
	redis.rpush(config.redis_paths.handled, JSON.stringify(msg), function(err, res) {
		if (cb) cb(err, res);
	});		
};

module.exports.pushErrorMessage = function(msg, cb) {
	redis.rpush(config.redis_paths.errors, JSON.stringify(msg), function(err, res) {
		if (cb) cb(err, res);
	});		
};
module.exports.getErrors = function(cb) {
	var result = [];
	redis.lrange(config.redis_paths.errors, 0, -1, function(err, res) {
		if (err || !res || res.length == 0) return cb(result);

		var complete = 0, toComplete = res.length;
		result = res;
		
		for (var i = 0; i < res.length; i++) {
			redis.rpop(config.redis_paths.errors, function() {
				complete++;
				if (complete == toComplete) return cb(result);
			});
		}
	});
};