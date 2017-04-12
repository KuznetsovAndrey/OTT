/*
	Наблюдатель за всем происходящим. 
*/

var redis = require('../lib/redis'),
	env = require('../env/env'),
	log = require('../lib/log'),
	queue = require('../queue/queue'),
	config = require('../config/config');

module.exports.onMessageHandle = function(err, msg) {
	if (err) {
		log.debug('error in handle!');
		queue.pushErrorMessage(err);
		return;
	}

	queue.pushHangledMessage(msg);
	log.debug('handled');
};

module.exports.isPublisherAlive = function(cb) {
	log.debug('checking publisher');
	redis.get(config.redis_paths.pub, function(err, res) {
		if (err || !res) {
			log.important('publisher is not alive!');
			return cb(false);
		}
		else {
			if (cb) cb(true);
		}
	})
};

/*
	Для того, чтобы нужный процесс "забил" себе место для того, чтобы стать паблишером, необходимо реализовать некий "лок"
	Для этого используется setnx - redis возвратит 0, если значение уже присвоено.
	В этот ключ помещается текущий таймстемп и время expire, через которое надо убить этот лок.
	Идея в следующем - если несколько процессов увидели, что можно стать паблишером, то все они задают вопрос - могу ли я сейчас публиковать?
	Первый, кто этот вопрос задал, становится паблишером.
	Локи удаляются в тикере (workers/ticker.js)
*/

module.exports.isAvailableToBecomeAPublisher = function(cb) {
	var info = {
		ts: new Date().getTime(),
		author: env.name,
		expire: 2000
	};

	redis.setnx('lock.' + config.redis_paths.pub_flag, JSON.stringify(info), function(err, res) {
		if (res == 0 || res == '0') {
			return cb(false);
		}

		return cb(true);
	});
};

module.exports.onFork = function() {
	var user = {
		name: env.name
	};

	redis.llen(config.redis_paths.users, function(err, res) {
		if (err || !res) res = 0;
		user.index = res;
		env.index = res;
		redis.rpush(config.redis_paths.users, JSON.stringify(user));
	});
};

module.exports.checkPublisherState = function(cb) {
	var that = this;
	that.isPublisherAlive(function(isPublisherAlive) {
		if (isPublisherAlive) {
			return cb(true);
		}

		that.isAvailableToBecomeAPublisher(function(isAvailableToBecomeAPublisher) {
			if (isAvailableToBecomeAPublisher) {
				return cb(false);
			}

			cb(true);
		});
	});
};