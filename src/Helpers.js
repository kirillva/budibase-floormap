import _ from "lodash";

export const uuid = function () {
    var d = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === "x" ? r : r && 0x7 | 0x8).toString(16);
        }
    );
    return uuid;
};
export const getPosition = function (
    positions,
    { 
		// максимальное число итераций
		max_iter,
		// желаемая точность
		target_delta, 
		// шаг (должен быть меньше точности)
		step,
		// определять лучшее направление каждую fq итерацию
		fq
	} = {}
) {
	const all_pos = [];
	positions.forEach(item=>{
		all_pos.push(item.x);
		all_pos.push(item.y);
		all_pos.push(item.z);
	});
	const new_step = (_.max(all_pos) - _.min(all_pos)) / 100;
	
	max_iter = max_iter || 1000,
	target_delta = target_delta || new_step, 
	step = step || new_step,
	fq = fq || 2

    function fn(x, y, z, x0, y0, z0, dist) {
        return (
            Math.pow(x - x0, 2) +
            Math.pow(y - y0, 2) +
            Math.pow(z - z0, 2) -
            Math.pow(dist, 2)
        );
    }

    function iter(positions, current) {
        const delta_arr = [];
        for (let index = 0; index < positions.length; index++) {
            const item = positions[index];
            delta_arr.push(
                fn(
                    item.x,
                    item.y,
                    item.z,
                    current.x,
                    current.y,
                    current.z,
                    item.distance
                )
            );
        }
        return delta_arr.map((item) => Math.abs(item));
    }

	function get_best_vector(positions, current) {
        let best_direction = 0;
        let best_delta_mean = 1000000;
        for (let direction = 0; direction < vectors.length; direction++) {
            const vector = vectors[direction];

            const new_current = current;
            new_current.x = current.x + vector.x * step;
            new_current.y = current.y + vector.y * step;
            new_current.z = current.z + vector.z * step;

            const delta_arr = iter(positions, new_current);
            const delta_mean = _.mean(delta_arr);
            if (delta_mean < best_delta_mean) {
                best_delta_mean = delta_mean;
                best_direction = direction;
            }
        }
        return vectors[best_direction];
    }

    const vectors = [
        { x: 0, y: 0, z: -1 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: -1, z: -1 },
        { x: -1, y: 0, z: 0 },
        { x: -1, y: 0, z: -1 },
        { x: -1, y: -1, z: 0 },
        { x: -1, y: -1, z: -1 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 1, z: 1 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 0, z: 1 },
        { x: 1, y: 1, z: 0 },
        { x: 1, y: 1, z: 1 },
    ];

    let current_iter = 0;
    let current = { 
		x: positions[0].x,
		y: positions[0].y,
		z: positions[0].z,
	};
    let current_vector = get_best_vector(positions, current);
    let min_delta_mean = 1000000;
	let last_deltas = [];
	let last_deltas_max_len = 100;
	
    while (true) {
        if (current_iter % fq) {
            current_vector = get_best_vector(positions, current);
        }

        current.x = current.x + current_vector.x * step;
        current.y = current.y + current_vector.y * step;
        current.z = current.z + current_vector.z * step;

        const delta_arr = iter(positions, current);
        const delta_mean = _.mean(delta_arr);
        if (delta_mean < min_delta_mean) {
            min_delta_mean = delta_mean;
        }

		last_deltas.push(min_delta_mean);
		if (last_deltas.length >= last_deltas_max_len) {
			last_deltas.shift();
		}

		if (current_iter >= max_iter) {
			// console.log('exit 1')
			break;
		}
		if (min_delta_mean < target_delta) {
			// console.log('exit 2')
			break;
		}
		// console.log('abs', Math.abs(_.mean(last_deltas) - last_deltas[last_deltas.length - 1]))
		if (last_deltas.length == last_deltas_max_len - 1 && Math.abs(_.mean(last_deltas) - last_deltas[last_deltas.length - 1]) < step * 0.1) {
			// console.log('exit 3')
			break;
		}
		current_iter++;
    }
	console.log('iterations:', current_iter)
    return current;
};
