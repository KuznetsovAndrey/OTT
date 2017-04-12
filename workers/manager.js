var env = require('../env/env'),
	config = require('../config/config'),
	observer = require('./observer'),
	queue = require('../queue/queue'),
	redis = require('../lib/redis'),
	ticker = require('./ticker'),
	subscriber = require('./subscriber'),
	publisher = require('./publisher'),
	log = require('../lib/log');

var checkId = null;

module.exports.defineRoleAndStart = function() {
	function onCheckFinish() {
		if (env.role == 'subscriber') {
			checkId = ticker.addEvent(checkAvailableRole, 4);
		}
	}

	observer.isPublisherAlive(function(answer) {
		if (answer) {
			subscriber.start();
			env.role = 'subscriber';
			onCheckFinish();
		}
		else {
			observer.isAvailableToBecomeAPublisher(function(answer) {
				if (!answer) {
					subscriber.start();
					env.role = 'subscriber';
				}
				else {
					publisher.start();
					env.role = 'publisher';
				}

				onCheckFinish();
			});
		}
	});
};

/*
	Может такое случится, что например все инстансы упали, а следующие запустили непосредственно за ними
	Так как приложение хранит ключ в редисе и проверяет необходимость паблишера только на старте и при отсутствии задач,
	то необходимо проверять раз в пару секунд - не потребовался паблишер (вдруг очередь слишком большая, а паблишер упал)
*/

function checkAvailableRole() {
	if (env.role != 'subscriber') {
		ticker.removeEvent(checkId)
	}

	observer.checkPublisherState(function(publisherState) {
		if (publisherState) return;

		subscriber.transform();
	});
}