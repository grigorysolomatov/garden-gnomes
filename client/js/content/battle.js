import { StateMachine } from '../tools/state.js';
import { Canvas } from './canvas.js';
import { Logic } from './logic.js';
import { timeout } from '../tools/async.js';

const states = {
    s_0: async ctx => {
	return 's_size';
    },
    s_size: async ctx => {
	// TODO: wasteful computation
	const ground_7x7 = ({
	    create: () => {
		const ground = [
		    [2, 0, 0, 0, 0, 0, 2],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [2, 0, 0, 0, 0, 0, 2],
		].map(row => row.map(k => ['dirt', 'grass', 'water'][k])).flatMap(x => x);
		return ground;
	    },
	}).create();
	const units_7x7 = ({
	    create: () => {
		const units = [
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 2, 0, 2, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 1, 0, 1, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		].map(row => row.map(k => [null, 'red', 'blue'][k])).flatMap(x => x);
		return units;
	    },
	}).create();
	const plants_7x7 = ({
	    create: () => {
		const units = [
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		].map(row => row.map(k => [null, 'flower'][k])).flatMap(x => x);
		return units;
	    },
	}).create();
	const ground_9x9 = ({
	    create: () => {
		const ground = [
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		].map(row => row.map(k => ['dirt', 'grass'][k])).flatMap(x => x);
		return ground;
	    },
	}).create();
	const units_9x9 = ({
	    create: () => {
		const units = [
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 2, 0, 0, 0, 2, 0, 0],
		    [0, 0, 0, 0, 2, 0, 0, 0, 0],		    
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],		    
		    [0, 0, 0, 0, 1, 0, 0, 0, 0],
		    [0, 0, 1, 0, 0, 0, 1, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0, 0, 0],
		].map(row => row.map(k => [null, 'red', 'blue'][k])).flatMap(x => x);
		return units;
	    },
	}).create();
	const plants_9x9 = ({
	    create: () => {
		const units = [
		    [1, 1, 1, 1, 1, 1, 1, 1, 1],
		    [1, 0, 0, 0, 0, 0, 0, 0, 1],
		    [1, 0, 0, 0, 0, 0, 0, 0, 1],
		    [1, 0, 0, 0, 0, 0, 0, 0, 1],
		    [1, 0, 0, 0, 0, 0, 0, 0, 1],
		    [1, 0, 0, 0, 0, 0, 0, 0, 1],
		    [1, 0, 0, 0, 0, 0, 0, 0, 1],
		    [1, 0, 0, 0, 0, 0, 0, 0, 1],
		    [1, 1, 1, 1, 1, 1, 1, 1, 1],
		].map(row => row.map(k => [null, 'flower'][k])).flatMap(x => x);
		return units;
	    },
	}).create();

	const [nrows, ncols] = [7, 7];
	const [ground, units, plants] = (nrows===7)?
	      [ground_7x7, units_7x7, plants_7x7]:
	      [ground_9x9, units_9x9, plants_9x9];

	Object.assign(ctx, {ground, units, plants, nrows, ncols});
	
	return 's_run';
    },
    s_run: async ctx => {
	const {scene, ground, units, plants, nrows, ncols, exchange=()=>{}, myIdx} = ctx;
	const {width, height} = scene.game.config;	
	const canvas = new Canvas().set({scene, nrows, ncols}).precompute();

	const captures = {};
	const createBoard = imageMap => {
	    const tiles = canvas.newSpriteGrid(imageMap);
	    tiles.map(async tile => {
		const {row, col} = tile;
		tile.setAlpha(0);
		const speed = 100;
		await timeout(speed*Math.abs((nrows-1)/2 - row) + speed*Math.abs((ncols-1)/2 - col));
		await tile.setAlpha(1).tween({
		    scale: {from: 0, to: tile.baseScale},
		    angle: 360,
		    alpha: {from: 0, to: 1},
		    duration: 500,
		    ease: 'Cubic.easeOut',
		});
	    });

	    const clicks = canvas.newSpriteGrid(() => 'selection');
	    clicks.map(async click => click.setAlpha(1e-99).setDepth(10));

	    const selects = canvas.newSpriteGrid(() => 'selection');
	    selects.map(async select => select.setAlpha(0).setTint(0x00ff00).setDepth(10));

	    const options = canvas.newSpriteGrid(() => 'selection');
	    options.map(async select => select.setAlpha(0).setTint(0xffff44).setDepth(10));

	    Object.assign(captures, {tiles, clicks, selects, options});
	};
	const spawnUnit = async (row, col, image, initial=false) => {
	    const {units=[]} = captures;
	    const origin = {
		red: [0.45, 0.9],
		blue: [0.4, 0.9],
		flower: [0.5, 0.9],
	    }[image];
	    const unit = canvas.newSprite(row, col, image)
		  .setOrigin(...origin)
		  .setAlpha(0);
	    
	    units.push(unit);
	    Object.assign(captures, {units});
	    
	    if (initial) { await timeout(Math.random()*500); }
	    await unit.setAlpha(1).tween({
		y: {from: -unit.height, to: unit.y},
		duration: 500,
		ease: 'Cubic.easeIn',
	    });
	    await unit.gridMove(row, col);
	    
	    return unit;
	};
	const spawnPlant = async (row, col, image, initial=false) => {
	    const {plants=[]} = captures;
	    const origin = {
		flower: [0.5, 0.9],
	    }[image];
	    const plant = canvas.newSprite(row, col, image)
		  .setOrigin(...origin)
		  .setDepth(200 + row)
		  .setAlpha(0);

	    plants.push(plant);
	    Object.assign(captures, {plants});

	    if (initial) { await timeout(Math.random()*500 + 1000); }
	    await plant.setAlpha(1).tween({
		scale: {from: 0, to: plant.baseScale},
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	    plant.setDepth(row+10);
	    return plant;
	};
	const moveUnit = async (from, to) => {
	    const {units=[]} = captures;
	    const unit = units.find(unit => unit.row === from[0] && unit.col === from[1]);
	    await unit?.gridMove(to[0], to[1]);
	};
	const showSelect = async (row, col, t) => {
	    const {selects} = captures;
	    selects[row*ncols + col].tween({
		alpha: 1*t,
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	};
	const replaceTile = async (row, col, image) => {
	    const {tiles} = captures;
	    const newTile = canvas.newGridSprite(row, col, image);
	    const oldTile = tiles[row*ncols + col];
	    tiles[row*ncols + col] = newTile;
	    newTile.tween({
		// scale: {from: 0, to: newTile.baseScale},
		alpha: {from: 0, to: 1},
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	    await oldTile.tween({
		alpha: 0,
		duration: 500,
		ease: 'Cubic.easeOut',
		onComplete: () => oldTile.destroy(),
	    });
	};
	const createPass = async () => {
	    const pass = canvas.newButton('pass').setDepth(100);

	    const glow = canvas.newButton('selection', 0.5).setAlpha(0).setTint(0xffff44);
	    glow.baseScale = 1.1*glow.baseScale; glow.setScale(glow.baseScale);
	    pass.glow = async t => await glow.setDepth(pass.depth+1).tween({
		alpha: t,
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	    
	    Object.assign(captures, {pass});
	    await pass.tween({
		alpha: {from: 0, to: 1},
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	}; // TODO: createAbility?
	const createPlant = async () => {
	    const plant = canvas.newButton('plant', 0.3).setDepth(100);

	    const glow = canvas.newButton('selection', 0.3).setAlpha(0).setTint(0xffff44);
	    glow.baseScale = 1.1*glow.baseScale; glow.setScale(glow.baseScale);
	    plant.glow = async t => await glow.setDepth(plant.depth+1).tween({
		alpha: t,
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	    
	    Object.assign(captures, {plant});
	    await plant.tween({
		alpha: {from: 0, to: 1},
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	};
	const createJump = async () => {
	    const jump = canvas.newButton('jump', 0.7).setDepth(100);

	    const glow = canvas.newButton('selection', 0.7).setAlpha(0).setTint(0xffff44);
	    glow.baseScale = 1.1*glow.baseScale; glow.setScale(glow.baseScale);
	    jump.glow = async t => await glow.setDepth(jump.depth+1).tween({
		alpha: t,
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	    
	    Object.assign(captures, {jump});
	    await jump.tween({
		alpha: {from: 0, to: 1},
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	};
	
	const players = ['red', 'blue'].map((team, i) => {
	    const cleanup = () => {
		const {pass, plant, jump, unselect} = captures;
		pass.disableInteractive().glow(0);
		plant.disableInteractive().glow(0);
		jump.disableInteractive().glow(0);
		unselect?.disableInteractive();
	    };
	    const player = {
		click: async selector => {
		    const {clicks, units, pass, plant, options} = captures;
		    const p_row_col = clicks.map((click, i) => new Promise(async resolve => {
			const [row, col] = [Math.floor(i/ncols), i % ncols];
			const selectable = selector(row, col);
			options[i].tween({
			    alpha: 0.5*selectable,
			    duration: 500,
			    ease: 'Cubic.easeOut',
			});
			click.disableInteractive();
			if (!selectable) { return; }
			click.removeAllListeners().setInteractive()
			    .once('pointerup', () => resolve([row, col]));
		    }));
		    const [row, col] = await Promise.race(p_row_col);
		    clicks[row*ncols + col].IGNORE?.tween({
			alpha: {from: 1, to: 1e-99},
			duration: 500,
			ease: 'Cubic.easeOut',
		    });
		    options.map(option => option.tween({
			alpha: 0,
			duration: 500,
			ease: 'Cubic.easeOut',
		    }));

		    units.find(unit => unit.row === row && unit.col === col)?.wiggle();
		    
		    cleanup(); await exchange([row, col]);
		    return [row, col];
		},
		press: async canPress => {
		    const {plant, pass, jump} = captures;

		    const pressButton = async (canPress, key) => {
			if (!canPress) { return new Promise(()=>{}); }
			const {pass, plant, jump, options, selects} = captures;
			const button = {pass, plant, jump}[key];		
			
			button.removeAllListeners().setInteractive().glow(0.5);
			await new Promise(resolve => button.once('pointerup', resolve));
			button.disableInteractive().glow(0);

			options.map(option => option.tween({
			    alpha: 0,
			    duration: 500,
			    ease: 'Cubic.easeOut',
			}));
			selects.map(select => select.tween({
			    alpha: 0,
			    duration: 500,
			    ease: 'Cubic.easeOut',
			}));
			
			return key;
		    };
		    const pressed = await Promise.race([
			pressButton(canPress, 'plant'),
			pressButton(canPress, 'pass'),
			pressButton(canPress, 'jump'),
		    ]);
		    
		    cleanup(); await exchange(pressed);
		    return pressed;
		},
		unselect: async canPress => {
		    let {unselect} = captures;
		    if (!canPress) { return new Promise(()=>{}); }
		    unselect = unselect || scene
			.newSprite(0.5*width, 0.5*height, 'white')
			.setDisplaySize(width, height)
			.setAlpha(1e-99)
			.setInteractive()
			.setDepth(5);		    
		    Object.assign(captures, {unselect});
		    await new Promise(resolve => unselect
				      .removeAllListeners().setInteractive()
				      .once('pointerup', resolve));
		    
		    cleanup(); await exchange('unselect');
		    return 'unselect';
		},
		team,
	    };
	    const online = {
		click: async () => await exchange(),
		press: async () => await exchange(),
		unselect: async () => await exchange(),
		team,
	    };
	    if (myIdx===undefined || myIdx===i) { return player; }
	    return online;
	});	
	
	await new Logic().set({
	    nrows, ncols,
	    players,
	    ground, units, plants,
	    spawnUnit, spawnPlant,
	    moveUnit,
	    createBoard, createPass, createPlant, createJump,
	    showSelect, replaceTile,
	}).run();
    },
};
export class Battle {
    constructor() {
	this.internal = {};
	this.external = {};
    }
    set(dict) {
	Object.assign(this.external, dict);
	return this;
    }
    async run() {
	const context = this.external;
	const start = 's_0';
	await new StateMachine().set({states, start, context}).run();
    }
}
