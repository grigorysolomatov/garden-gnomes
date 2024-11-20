class StateTree {
    set(data) {
	this.external = this.external || {};
	this.external = {...this.external, ...data};
	return this;
    }
    async run() {
	const {root, ctx={}} = this.external;
	const path = [];
	while (true) {
	    const node = path.reduce((node, step) => node[step], root);
	    if (!node) {break;}
	    const res = await node[0](ctx);
	    if (res === '..') { path.pop(); } else { path.push(res); }
	}
	return this;
    }
}
class StateMachine {
    constructor() {
	this.external = {};
    }
    set(data) {
	this.external = this.external || {};
	this.external = {...this.external, ...data};
	return this;
    }
    async run() {
	const {states, start: startState, context={}} = this.external;
	let currentState = startState;
	while (true) {
	    if (!states[currentState]) { break; }
	    currentState = await states[currentState](context);
	}
    }
}
class StateServer {
    constructor() {
	this.external = {};
	this.internal = {};
    }
    set(data) {
	Object.assign(this.external, data);
	return this;
    }
    async run() {
	const {states, start, shared, next: getNext} = this.external;
	while (true) {
	    const client = await getNext();
	    const context = {client, shared};
	    new StateMachine().set({states, start, context}).run();
	}
    }
}

module.exports = {StateMachine, StateTree, StateServer};
