import { StateTree } from './tools/state.js';
import { root } from './content/main.js';

export async function main() {
    new StateTree().set({root}).run('root');
}
