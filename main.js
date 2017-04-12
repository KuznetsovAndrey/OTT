var env = require('./env/env'),
	config = require('./config/config'),
	observer = require('./workers/observer'),
	queue = require('./queue/queue'),
	redis = require('./lib/redis'),
	ticker = require('./workers/ticker'),
	manager = require('./workers/manager'),
	log = require('./lib/log');

observer.onFork();
ticker.start();

/*
	Локи ставятся на определённое время, поэтому их необходимо удалять самостоятельно
*/

ticker.addEvent(redis.cleanLocks);

if (env.infoMode) {
	queue.getErrors(function(errors) {
		if (errors.length == 0) log.debug('empty');
		else log.debug(errors.join(','));
	});
	return;
}

/*
	В самом начале работы приложение проверяет, не нуждается ли вся сеть в паблишере, если нет, то начинает обрабатывать сообщения.
*/

manager.defineRoleAndStart();