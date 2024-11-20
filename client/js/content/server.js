import { timeout } from '../tools/async.js';

class Connection {
    constructor() {
	this.external = {};
	this.internal = {};
    }
    set(data) {
	Object.assign(this.external, data);
	return this;
    }
    activate() {
	const {send, receive} = this.external;
	this.send = send;
	this.receive = receive;
	return this;
    }
}
export class CreateConnection {
    static fromSocket(socket) {
	const connection = new Connection().set({
	    send: async (key, message) => {
		const response = await new Promise(resolve => {
		    socket.emit(key, message, response => resolve(response));
		});
		return response;
	    },
	    receive: async key => {
		const [message, callback] = await new Promise(resolve => {
		    socket.on(key, (message, callback) => resolve([message, callback]));
		});
		return [message, callback];
	    },
	}).activate();
	return connection;
    }
}

