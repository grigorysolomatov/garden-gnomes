import { StateTree } from './tools/state.js';
import { root } from './content/main.js';

export async function main() {
    new StateTree().set({root}).run('root');
}

async function main2() { // Not used yet
    await new Promise(resolve => {
	socket.on('echo', (msg, callback) => { callback(msg); resolve(); });
    });
    const response = await new Promise(resolve => socket.emit('echo', 'I am client', resolve));
    console.log(response);
}
