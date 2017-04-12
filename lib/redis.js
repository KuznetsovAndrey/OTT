var redis = require('redis'),
	env = require('../env/env'),
	client = redis.createClient(env.redis);

module.exports = client;

module.exports.cleanLocks = function(cb) {
	if (!cb) {
		cb = function() {};
	}

	function clean(keys) {
		if (!keys) return cb(true, null);
		var toClean = keys.length,
			done = 0;

		for (var i = 0; i < toClean; i++) {
			client.get(keys[i], (function(index) {
				return function(err, res) {
					done++;

					if (err || !res) return client.del(keys[index]);

					res = JSON.parse(res);
					if (new Date().getTime() - parseInt(res.ts) >=  parseInt(res.expire)) {
						client.del(keys[index]);
					}

					if (done == toClean) {
						cb(null);
					}
				}
			})(i));
		}
	}
	getLocks(function(err, res) {
		clean(res);
	});
};

function getLocks(cb) {
	client.keys('lock.*', function(err, res) {
		if ((err || !res) && cb) return cb(true, null);

		if (res && cb) {
			cb(null, res);
		}
	});
};