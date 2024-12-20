const crap = {
    s_nav_DELETE: async ctx => {
	const {ground, units, plants, players, ncols,
	       moveUnit, showSelect, replaceTile, turn=0, spawnPlant,
	      } = ctx;

	const player = players[turn];

	const canSelect = (row, col) => units[row*ncols + col] === player.team;
	let [fromRow, fromCol] = await player.click(canSelect);
	
	const canClick = (row, col) => {
	    const close = Math.max(Math.abs(row-fromRow), Math.abs(col-fromCol)) <= 1;
	    const unit = units[row*ncols + col];
	    const water = ground[row*ncols + col] === 'water';
	    const flower = plants[row*ncols + col] === 'flower';
	    return close && !unit && !water && !flower;
	};

	let lastAction = null;
	let lastClick = null;
	for (let i = 0; i < 3; i++) {
	    lastClick = [fromRow, fromCol];
	    showSelect(fromRow, fromCol, true);	    
	    const action = await Promise.race([
		player.click(canClick),
		player.press(i > 0),
		player.unselect(i === 0),
	    ]);
	    showSelect(fromRow, fromCol, false);
	    if (['pass', 'plant', 'jump', 'unselect'].includes(action)) { lastAction = action; break; }
	    const [toRow, toCol] = action;	    

	    units[toRow*ncols + toCol] = units[fromRow*ncols + fromCol];
	    units[fromRow*ncols + fromCol] = null;
	    await moveUnit([fromRow, fromCol], [toRow, toCol]);
	    if (i===0) {
		plants[fromRow*ncols + fromCol] = 'flower';
		replaceTile(fromRow, fromCol, 'grass');
		spawnPlant(fromRow, fromCol, 'flower');
	    }
	    [fromRow, fromCol] = [toRow, toCol];
	}
	
	if (lastAction === 'unselect') { return 's_nav'; }
	Object.assign(ctx, {turn: 1 - turn, lastClick});	
	if (lastAction === 'plant') { return 's_plant'; }
	if (lastAction === 'jump') { return 's_jump'; }
	return 's_nav';
    },
    s_jump_DELETE: async ctx => {
	const {
	    ground, units, plants, players, ncols,
	    showSelect, replaceTile, turn, spawnPlant, lastClick, moveUnit,
	} = ctx;
	const [fromRow, fromCol] = lastClick;
	const player = players[turn];
	
	const canClick = (row, col) => {
	    const close = Math.max(Math.abs(row-fromRow), Math.abs(col-fromCol)) <= 2;
	    const unit = units[row*ncols + col];
	    const plant = plants[row*ncols + col];
	    const water = ground[row*ncols + col] === 'water';
	    return close & !unit && !plant && !water;
	};
	showSelect(fromRow, fromCol, true);
	const [toRow, toCol] = await Promise.race([player.click(canClick)]);
	showSelect(fromRow, fromCol, false);

	units[toRow*ncols + toCol] = units[fromRow*ncols + fromCol];
	units[fromRow*ncols + fromCol] = null;
	await moveUnit([fromRow, fromCol], [toRow, toCol]);
	
	return 's_nav';
    },
    s_plant_DELETE: async ctx => {
	const {
	    ground, units, plants, players, ncols,
	    showSelect, replaceTile, turn, spawnPlant,
	    lastClick,
	} = ctx;
	const [fromRow, fromCol] = lastClick;
	const player = players[turn];

	const canClick = (row, col) => {
	    const close = Math.max(Math.abs(row-fromRow), Math.abs(col-fromCol)) <= 2;
	    const unit = units[row*ncols + col];
	    const plant = plants[row*ncols + col];
	    const water = ground[row*ncols + col] === 'water';
	    return close & !unit && !plant && !water;
	};
	showSelect(fromRow, fromCol, true);
	const [row, col] = await Promise.race([player.click(canClick)]);
	showSelect(fromRow, fromCol, false);

	plants[row*ncols + col] = 'flower'
	replaceTile(row, col, 'grass');
	await spawnPlant(row, col, 'flower');
	
	return 's_nav';
    },
};
const statesOld = {
    s_init: async ctx => {
	return 's_initLogic';
    },
    s_initLogic: async ctx => {
	const ground = ({
	    create: () => {
		const ground = [
		    [1, 1, 1, 1, 1, 1, 1],
		    [1, 0, 0, 0, 0, 0, 1],
		    [1, 0, 0, 0, 0, 0, 1],
		    [1, 0, 0, 0, 0, 0, 1],
		    [1, 0, 0, 0, 0, 0, 1],
		    [1, 0, 0, 0, 0, 0, 1],
		    [1, 1, 1, 1, 1, 1, 1],
		].map(row => row.map(k => ['dirt', 'grass'][k])).flatMap(x => x);
		return ground;
	    },
	}).create();
	const units = ({
	    create: () => {
		const units = [
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 2, 0, 0, 0, 2, 0],
		    [0, 0, 0, 2, 0, 0, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		    [0, 0, 0, 1, 0, 0, 0],
		    [0, 1, 0, 0, 0, 1, 0],
		    [0, 0, 0, 0, 0, 0, 0],
		].map(row => row.map(k => [null, 'red', 'blue'][k])).flatMap(x => x);
		return units;
	    },
	}).create();
	const [nrows, ncols] = [7, 7];
	
	const logic = new BattleLogic().set({ground, units, nrows, ncols}).precompute();

	Object.assign(ctx, {logic, nrows, ncols});
	
	return 's_initCanvas';
    },
    s_initCanvas: async ctx => {
	const {scene, logic, nrows, ncols} = ctx;

	const canvas = new BattleCanvas().set({scene, nrows, ncols}).precompute();
	
	const tiles = canvas.newSpriteGrid((row, col) => logic.get('ground', row, col));
	tiles.gridMap(async (tile, row, col) => {
	    tile.setAlpha(0);
	    const speed = 100;
	    await timeout(speed*Math.abs((nrows-1)/2 - row) + speed*Math.abs((ncols-1)/2 - col));
	    await tile.setAlpha(1).tween({
		// x: {from: width*0.5, to: tile.x},
		// y: {from: height*0.5, to: tile.y},
		scale: {from: 0, to: tile.baseScale},
		angle: 360,
		alpha: {from: 0, to: 1},
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	});
	
	const clicks = canvas.newSpriteGrid(() => 'selection');
	clicks.gridMap(async (click, row, col) => click.setInteractive().setAlpha(1e-99));	

	const selects = canvas.newSpriteGrid(() => 'selection');
	selects.gridMap(async (select, row, col) => select.setAlpha(0).setTint(0x00ff00));

	const options = canvas.newSpriteGrid(() => 'selection');
	options.gridMap(async (select, row, col) => select.setAlpha(0).setTint(0xffff44));

	Object.assign(ctx, {canvas, tiles, clicks, selects, options});
	
	return 's_setupPlayer';
    },
    s_setupPlayer: async ctx => {
	const {clicks, options, nrows, ncols} = ctx;

	const player = {
	    click: async (selector=()=>true) => {
		const p_row_col = clicks.map((click, i) => new Promise(async resolve => {
		    const [row, col] = [Math.floor(i/ncols), i % ncols];		    
		    if (!selector(row, col)) { return; }
		    options[i].tween({
			alpha: 0.5,
			duration: 500,
			ease: 'Cubic.easeOut',
		    });
		    click.on('pointerup', () => resolve([row, col]));
		}));
		const [row, col] = await Promise.race(p_row_col);
		clicks[row*ncols + col].tween({
		    alpha: {from: 1, to: 1e-99},
		    duration: 500,
		    ease: 'Cubic.easeOut',
		});
		options.map(option => option.tween({
		    alpha: 0,
		    duration: 500,
		    ease: 'Cubic.easeOut',
		}));
		return [row, col];
	    },
	};

	Object.assign(ctx, {player});
	
	return 's_spawn';
    },
    s_spawn: async ctx => {
	const {canvas, logic, tiles, clicks, selects, nrows, ncols} = ctx;
	const p_reds = logic.find('units', u => u==='red').map(async ([row, col]) => {
	    const gnome = canvas.newSprite(row, col, 'gnome_red')
		  .setOrigin(0.45, 0.9)
		  .setAlpha(0);
	    await timeout(Math.random()*500);
	    await gnome.setAlpha(1).tween({
		y: {from: -gnome.height, to: gnome.y},
		duration: 500,
		ease: 'Cubic.easeIn',
	    });
	    await gnome.gridMove(row, col);	    
	    return gnome;
	});
	const p_blue = logic.find('units', u => u==='blue').map(async ([row, col]) => {
	    const gnome = canvas.newSprite(row, col, 'gnome_blue')
		  .setOrigin(0.4, 0.9)
		  .setAlpha(0);
	    await timeout(Math.random()*500);
	    await gnome.setAlpha(1).tween({
		y: {from: -gnome.height, to: gnome.y},
		duration: 500,
		ease: 'Cubic.easeIn',
	    });
	    await gnome.gridMove(row, col);	    
	    return gnome;
	});
	const [reds, blues] = await Promise.all([Promise.all(p_reds), Promise.all(p_blue)]);
	Object.assign(ctx, {reds, blues});
	return 's_user';
    },
    s_user: async ctx => {
	const {reds, blues, clicks, player, selects, nrow, ncols, selected=[]} = ctx;
	Object.assign(ctx, {selected});	
	// const [row, col] = await player.click((row, col) => (row + col)%2 === 0);
	const [row, col] = await player.click();
	const idx = row*ncols + col;
	clicks[idx].tween({
	    alpha: {from: 1, to: 1e-99},
	    duration: 500,
	    ease: 'Cubic.easeOut',
	});
	selects[idx].tween({
	    alpha: 1,
	    duration: 500,
	    ease: 'Cubic.easeOut',
	});
	selected.push([row, col]);
	[...reds, ...blues].forEach(async gnome => {
	    if (selected.length > 1) { return; }
	    if (row !== gnome.row || col !== gnome.col) { return; }
	    await gnome.setAngle(0).tween({
		angle: 10,
		yoyo: true,
		duration: 50,
		ease: 'Cubic.easeOut',
	    });
	    await gnome.tween({
		angle: -10,
		yoyo: true,
		duration: 50,
		ease: 'Cubic.easeOut',			
	    });
	});

	if (selected.length < 2) { return 's_user'; }
	if (selected.length >= 2) {
	    selects.gridMap(async (select, row, col) => {
		await select.tween({
		    alpha: 1e-99,
		    duration: 500,
		    ease: 'Cubic.easeOut,',
		});
	    });
	    return 's_jump';
	}
    },
    s_jump: async ctx => {
	const {reds, blues, selected} = ctx;
	
	const [rowFrom, colFrom] = selected[0];
	const [rowTo, colTo] = selected[1];
	const gnome = [...reds, ...blues].find(gnome => {
	    const out = gnome.row === rowFrom && gnome.col === colFrom;
	    return out
	});
	if (gnome && gnome.row === rowFrom && gnome.col === colFrom) { gnome.gridMove(rowTo, colTo); }
	selected.splice(0, selected.length);	
	
	return 's_user';
    },
};
export class BattleLogicOld {
    constructor() {
	this.internal = {};
	this.external = {};
    }
    set(dict) {
	Object.assign(this.external, dict);
	return this;
    }
    precompute() {
	const {ground: g, units: u, nrows, ncols} = this.external;
	
	const ground = g.map(x => x);
	const units = u.map(x => x);
	
	Object.assign(this.internal, {ground, units});
	
	return this;
    }
    get(key, row, col) {
	const {nrows, ncols} = this.external;
	return this.internal[key][row*ncols + col];
    } // Need?
    find(key, selector) {
	const {nrows, ncols} = this.external;
	const positions = this.internal[key]
	      .map((obj, i) => (selector(obj))? [Math.floor(i/ncols), i % ncols] : null)
	      .filter(x => x);

	return positions;
    } // Need?
    async run() {
	const {players} = this.external;
	
    }
}
