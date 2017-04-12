var n = 4, matrix = [], iterator = 0;

if (process && process.argv[2]) n = parseInt(process.argv[2]);

for (var i = 0; i < 2 * n - 1; i++) {
	var tmp = [];
	for (var j = 0; j < 2 * n - 1; j++) {
		tmp.push(++iterator);
	}

	matrix.push(tmp)
}

console.log(matrix);

var level = 0,
	modes = [
		[1, 0],
		[0, 1],
		[-1, 0],
		[0, -1]
	],
	total = [];

while (level < n) {
	total = total.concat(spiraled(level));
	level++;
}

console.log(total.join(','));

function spiraled(level) {
	if (level == 0) {
		return [matrix[n - 1][n - 1]]
	}

	var result = [],
		max_length = level * 2,
		offset = 1, 
		i = n - level, 
		j = n - level - 1;

	for (var k = 0; k < modes.length; k++) {
		for (var l = 0; l < max_length - offset; l++) {
			result.push(matrix[i][j]);
			i += modes[k][0];
			j += modes[k][1];
		}
		offset = 0;
	}
	result.push(matrix[i][j]);
	return result
}