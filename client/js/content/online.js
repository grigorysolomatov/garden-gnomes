import { Battle } from './battle.js';
import { CreateConnection } from './server.js';
const socket = io();

export const online = {
    0: async ctx => {
	const {scene, width, height} = ctx;
	
	const connection = CreateConnection.fromSocket(socket);
	await connection.send('play');

	const myNum = Math.random();
	const theirNum = await connection.send('exchange', myNum);
	const myIdx = Number(myNum > theirNum);
	
	const exchange = async data => {
	    const received = await connection.send('exchange', data);
	    // console.log(received);
	    return received;
	};
	await new Battle().set({scene, exchange, myIdx}).run();

	const choice = await scene.newMenu(0.5*width, 0.9*height, {
	    '..': 'Back',
	});
	
	return choice;
    },
};
