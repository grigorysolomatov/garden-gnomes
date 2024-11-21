const { v4: uuidv4 } = require('uuid');
const { CreateConnection } = require('./tools/connection.js');
const { StateServer } = require('./tools/state.js');

const states = {
    s_connect: async ctx => {
	const {client, shared} = ctx;
	const {queue=[]} = shared;
	Object.assign(shared, {queue});
	
	const [message, callback] = await client.receive('play');
	client.callback = callback;	

	const opponent = queue.pop();
	if (opponent) {
	    client.opponent = opponent;
	    opponent.opponent = client;
	    client.callback();
	    opponent.callback();
	    return 's_play';
	}
	queue.push(client);
	await client.receive('disconnect');
	const idx = queue.indexOf(client);
	if (idx !== -1) { queue.splice(idx, 1); }
    },
    s_play: async ctx => {
	const {client, shared} = ctx;

	const players = [client, client.opponent];
	const p_exchange = players.map(async player => await player.receive('exchange'));
	const [[message0, callback0], [message1, callback1]] = await Promise.all(p_exchange);
	callback0(message1); callback1(message0);

	return 's_play';
    },
};

async function main(io) {
    const shared = {};
    const next = async () => {
	const socket = await new Promise(resolve => io.once('connection', socket => resolve(socket)));
	const connection = CreateConnection.fromSocket(socket);
	return connection;
    };
    const start = 's_connect';
    await new StateServer().set({states, start, shared, next}).run();
}

const crap1 = async () => {
    while (true) {
	const socket = await new Promise(resolve => io.once('connection', socket => resolve(socket)));
	const connection = CreateConnection.fromSocket(socket);
	// const response = await connection.send('echo', 'I am server');

	({
	    echo: async () => {
		const [message, callback] = await connection.receive('echo'); callback(message);
	    },
	}).echo();
    }
};
const crap2 = async () => {
    const handler_CRAP = async ctx => {
	const {connection, play=[]} = ctx;
	const [message, callback] = await connection.receive('play'); callback('OK');
	queue.push(connection);
	
	console.log(message);
    };
};

module.exports = {main};
