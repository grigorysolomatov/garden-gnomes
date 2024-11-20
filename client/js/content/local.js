import { Battle } from './battle.js';

export const local = {
    0: async ctx => {
	const {scene, height, width} = ctx;
	// await battle({scene});
	await new Battle().set({scene}).run();
	const choice = await scene.newMenu(0.5*width, 0.9*height, {
	    '..': 'Back',
	});
	
	return choice;
    },
};
