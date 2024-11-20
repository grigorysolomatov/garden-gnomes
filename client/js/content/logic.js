import { StateMachine } from '../tools/state.js';
import { timeout } from '../tools/async.js';

const states = {
    s_init: async ctx => {
	const {createBoard, ground, ncols, players} = ctx;
	await createBoard((row, col) => ground[row*ncols + col]);	
	return 's_spawn';
    },
    s_spawn: async ctx => {
	const {units, plants, spawnUnit, spawnPlant, ncols, replaceTile} = ctx;

	const p_units = units.map(async (unit, i) => {
	    if (!unit) {return};
	    const [row, col] = [Math.floor(i/ncols), i%ncols];
	    await spawnUnit(row, col, unit, true);
	});
	await Promise.all(p_units);

	const p_plants = plants.map(async (plant, i) => {
	    if (!plant) { return; }
	    const [row, col] = [Math.floor(i/ncols), i%ncols];
	    await spawnPlant(row, col, plant, true);
	});
	await Promise.all(p_plants);

	return 's_createButtons';
    },
    s_createButtons: async ctx => {
	const {createPass, createPlant, createJump} = ctx;

	createPass();
	createPlant();
	createJump();
	
	return 's_nav';
    },
    // -------------------------------------------------------------------------
    s_nav: async ctx => {
	const {progress=0, history} = ctx;
	
	if (progress === 0) { return 's_select'; }
	if (progress >= 3) { return 's_pass'; }

	return 's_step';
    },
    s_select: async ctx => {
	const {units, players, turn=0, ncols, history=[]} = ctx;

	const player = players[turn];
	
	const canSelect = (row, col) => units[row*ncols + col] === player.team;
	const [row, col] = await player.click(canSelect);
	
	history.push('select', [row, col]);
	Object.assign(ctx, {history, turn, progress: 0});
	
	return 's_step';
    },
    s_step: async ctx => {
	const {ground, plants, units, turn, progress, history,
	       players, ncols, moveUnit, showSelect, replaceTile, spawnPlant} = ctx;
	
	const player = players[turn];
	const [fromRow, fromCol] = history[history.length-1];
	const canClick = (row, col) => {
	    const close = Math.max(Math.abs(row-fromRow), Math.abs(col-fromCol)) <= 1;
	    const unit = units[row*ncols + col];
	    const water = ground[row*ncols + col] === 'water';
	    const flower = plants[row*ncols + col] === 'flower';
	    return close && !unit && !water && !flower;
	};
	showSelect(fromRow, fromCol, true);	
	const action = await Promise.race([
	    player.click(canClick),
	    player.unselect(progress === 0),
	    player.press(progress > 0),
	]);	
	showSelect(fromRow, fromCol, false);
	
	if (action === 'unselect') { return 's_select'; }
	if (progress === 0) {
	    plants[fromRow*ncols + fromCol] = 'flower';
	    replaceTile(fromRow, fromCol, 'grass');
	    spawnPlant(fromRow, fromCol, 'flower');
	}	
	if (action === 'pass') { return 's_pass'}
	if (action === 'jump') { return 's_jump'}
	if (action === 'plant') { return 's_plant'}
	
	const [toRow, toCol] = action;
	history.push('step', [toRow, toCol]);

	units[toRow*ncols + toCol] = units[fromRow*ncols + fromCol];
	units[fromRow*ncols + fromCol] = null;
	await moveUnit([fromRow, fromCol], [toRow, toCol]);

	Object.assign(ctx, {progress: progress+1});
	
	return 's_nav';
    },
    s_pass: async ctx => {
	const {turn, history} = ctx;

	history.push('pass');
	Object.assign(ctx, {turn: 1-turn, progress: 0});
	
	return 's_nav';
    },
    s_jump: async ctx => {
	const {ground, units, plants, players, ncols, turn, moveUnit, history, showSelect} = ctx;
	
	const player = players[turn];
	const [fromRow, fromCol] = history[history.length-1];
	
	const canClick = (row, col) => {
	    const close = Math.max(Math.abs(row-fromRow), Math.abs(col-fromCol)) <= 2;
	    const unit = units[row*ncols + col];
	    const plant = plants[row*ncols + col];
	    const water = ground[row*ncols + col] === 'water';
	    return close & !unit && !plant && !water;
	};
	showSelect(fromRow, fromCol, true);
	const action = await Promise.race([
	    player.click(canClick),
	    player.unselect(true),
	]);
	showSelect(fromRow, fromCol, false);
	
	if (action === 'unselect') { return 's_step'; }
	const [toRow, toCol] = action;
	history.push('jump', [toRow, toCol]);

	units[toRow*ncols + toCol] = units[fromRow*ncols + fromCol];
	units[fromRow*ncols + fromCol] = null;
	await moveUnit([fromRow, fromCol], [toRow, toCol]);
	
	return 's_pass';
    },
    s_plant: async ctx => {
	const {ground, units, plants, players, ncols,
	       replaceTile, turn, spawnPlant, history, showSelect} = ctx;
	const player = players[turn];
	const [fromRow, fromCol] = history[history.length-1];

	const canClick = (row, col) => {
	    const close = Math.max(Math.abs(row-fromRow), Math.abs(col-fromCol)) <= 2;
	    const unit = units[row*ncols + col];
	    const plant = plants[row*ncols + col];
	    const water = ground[row*ncols + col] === 'water';
	    return close & !unit && !plant && !water;
	};
	
	showSelect(fromRow, fromCol, true);
	const action = await Promise.race([
	    player.click(canClick),
	    player.unselect(true),
	]);
	showSelect(fromRow, fromCol, false);
	
	if (action === 'unselect') { return 's_step'; }	
	const [toRow, toCol] = action;
	history.push('plant', [toRow, toCol]);

	plants[toRow*ncols + toCol] = 'flower'
	replaceTile(toRow, toCol, 'grass');
	await spawnPlant(toRow, toCol, 'flower');
	
	return 's_pass';
    },
};
export class Logic {
    constructor() {
	this.internal = {};
	this.external = {};
    }
    set(dict) {
	Object.assign(this.external, dict);
	return this;
    }
    async run() {
	const start = 's_init';
	const context = this.external;
	new StateMachine().set({states, start, context}).run();
    }
}
