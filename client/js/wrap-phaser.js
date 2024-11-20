import { timeout } from './tools/async.js';

const tuneEntity = entity => {
    entity.tween = async settings => {
	await new Promise(resolve => {
	    entity.scene.tweens.add({
		...settings,
		targets: entity,
		onComplete: resolve,
	    });
	});
    };
    return entity;
};
const tuneScene = scene => {
    scene.loadAssets = async dict => {
	Object.keys(dict).forEach(key => scene.load.image(key, dict[key]));
	await new Promise(resolve => { scene.load.on('complete', resolve); scene.load.start(); });	
    };
    scene.newText = (x, y, str, settings={}) => {
	const defaultSettings = {
	    fontFamily: '"Modak", system-ui',//'"Nova Flat", system-ui', // '"Gochi Hand", cursive',
	    fontSize: '32px',
	    fill: '#88cc66',
	};
	const text = scene.add.text(x, y, str, {...defaultSettings, ...settings});	    
	return tuneEntity(text);
    };
    scene.newMenu = async (x, y, options, step=50) => {
	const {height, width} = scene.game.config;
	const keys = Object.keys(options);
	
	const p_renderedOptions = keys.map(async (key, i) => {
	    const label = options[key];
	    const text = scene.newText(x, y + step*(i - 0.5*(keys.length-1)), label).setOrigin(0.5).setAlpha(0);
	    await timeout(100*i);	    
	    await text.tween({
		y: {from: height, to: text.y},
		alpha: {from: 0, to: 1},
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	    if (label) {text.setInteractive()};
	    return text;
	});
	const renderedOptions = await Promise.all(p_renderedOptions);

	const p_choice = renderedOptions.map((text, i) => new Promise(resolve => {
	    text.on('pointerup', () => resolve(keys[i]));
	}));
	const choice = await Promise.race(p_choice);
	
	renderedOptions.forEach(async text => {
	    await text.tween({
		alpha: 0,
		duration: 250,
		ease: 'Cubic.easeOut',
	    });
	    text.destroy();
	});
	return choice;
    };
    scene.newSprite = (x, y, key) => {
	const sprite = scene.add.sprite(x, y, key);
	return tuneEntity(sprite);
    };
    return scene;
};
const tuneGame = game => {
    game.newScene = async key => {
	const scene = await new Promise(resolve => {
	    const scene = new Phaser.Scene({key});
	    scene.create = () => resolve(scene);
	    game.scene.add(key, scene);
	    game.scene.start(key);
	});
	return tuneScene(scene);
    };
    return game;
};

export function createGame(config) {
    const game = new Phaser.Game(config);
    return tuneGame(game);
}
