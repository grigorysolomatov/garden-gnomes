import { timeout } from '../tools/async.js';
import { createGame } from '../wrap-phaser.js';
import { local } from './local.js';
import { online } from './online.js';

export const root = {
    0: async ctx => {
	await new Promise(resolve => WebFont.load({
	    google: { families: ['Modak'] }, // 'Nova Flat', 
	    active: resolve,
	}));

	const [w, h] = [window.innerWidth, window.innerHeight];
	const game = createGame({
	    height: h,
	    width: Math.min(w, h/1.6),
	    backgroundColor: '#111111',
	    type: Phaser.WEBGL,
	});
	const scene = await game.newScene('MainScene');
	const {width, height} = scene.game.config;	

	await scene.loadAssets({
	    dirt: 'assets/exported/dirt.png',
	    grass: 'assets/exported/grass.png',
	    water: 'assets/exported/water.png',
	    flower: 'assets/exported/flower.png',
	    white: 'assets/exported/white.svg',
	    plant: 'assets/exported/plant.png',
	    jump: 'assets/exported/jump.png',
	    pass: 'assets/exported/pass.png',
	    red: 'assets/exported/gnome-red.png',
	    blue: 'assets/exported/gnome-blue.png',
	    selection: 'assets/exported/selection.png',
	    background: 'assets/exported/background.png',
	});

	const background = scene
	      .newSprite(0.5*width, 0.5*height, 'background')
	      .setDisplaySize(width, height)
	      .setTint(0x888888);
	const title = scene.newText(0.5*width, 0.1*height, 'Garden Gnomes').setOrigin(0.5);
	await title.tween({
	    alpha: {from: 0, to: 1},
	    duration: 500,
	    ease: 'Cubic.easeOut',
	});
	
	Object.assign(ctx, {scene, title, width, height});
	
	return 'main';
    },
    main: {
	0: async ctx => {
	    const {scene, height, width} = ctx;
	    	    
	    const choice = await scene.newMenu(0.5*width, 0.5*height, {
		play: 'Play',
		learn: 'Learn',
	    });
	    
	    return choice;
	},
	play: {
	    0: async ctx => {
		const {scene, width, height} = ctx;
		
		const choice = await scene.newMenu(0.5*width, 0.5*height, {
		    online: 'Online',
		    local: 'Local',
		    _: '',
		    '..': 'Back',
		});

		return choice;
	    },
	    online,
	    local,
	},
	learn: {
	    0: async ctx => '..',
	}
    },
};
