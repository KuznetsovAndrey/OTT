var redis = require('../lib/redis'),
	log = require('../lib/log'),
	env = require('../env/env'),
	queue = require('../queue/queue'),
	observer = require('./observer'),
	config = require('../config/config');

var stopped = false;

module.exports.start = function() {
	getMessage();
};

module.exports.stop = function() {
	log.important(process.pid, 'stopped as a subscriber');
	stopped = true;
};

module.exports.transform = function() {
	this.stop();
	env.role = 'publisher';
	require('./publisher').start();
}

/*
	Если нет новых сообщений, то читателю предлагается подождать ровно столько, сколько требуется для отправки следующего сообщения.
*/

function getMessage() {
	if (stopped) return;
	queue.pop(function(err, res) {
		if (err || !res) {
			return wait();
		}
		
		eventHandler(res, function(err, msg) {
			msg = {
				message: msg,
				processedBy: env.name
			};

			if (err) {
				err = {
					message: 'error',
					processedBy: env.name
				};
			}
			observer.onMessageHandle(err, msg);
			setTimeout(getMessage);
		})
	});
}

/*
	Функция из ТЗ, слегка изменена для быстрой обработки задач в тестовом режиме.
*/

function eventHandler(msg, callback){
	function onComplete(){
		var error = Math.random() > 0.95; 
		callback(error, msg);
	}

	// processing takes time...
	if (env.stage == 'test')
		onComplete();
	else
		setTimeout(onComplete, Math.floor(Math.random()*1000));
}

/*
	Если читателя вынуждают ждать, то он первым делом спрашивает - может паблишер упал?
	Если это так, то он узнаёт, сможет ли он стать паблишером
	В случае положительного ответа, он прекращает обрабатывать сообщения и начинает их публиковать самостоятельно.
*/

function wait() {
	observer.isPublisherAlive(function(answer) {
		if (!answer) {
			return tryTransformToPublisher();
		}

		setTimeout(function() {
			getMessage();
		}, env.delay.publish);
	})
}

function tryTransformToPublisher() {
	var that = this;

	observer.isAvailableToBecomeAPublisher(function(answer) {
		if (!answer) {
			setTimeout(function() {
				getMessage();
			}, env.delay.publish);
			return;
		}

		exports.transform();
	});
}