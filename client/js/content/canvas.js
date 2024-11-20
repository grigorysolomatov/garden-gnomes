import { timeout } from '../tools/async.js';

export class Canvas {
    constructor() {
	this.internal = {};
	this.external = {};
    }
    set(dict) {
	Object.assign(this.external, dict);
	return this;
    }
    getContext() {
	return {...this.external, ...this.internal};
    }
    precompute() {
	const {scene, nrows, ncols} = this.external;
	const {width, height} = scene.game.config;
	
	const step = Math.min(0.9*width/ncols, 0.9*height/nrows);
	const row_col = ({
	    create: () => {
		const out = [];
		for (let row = 0; row < nrows; row++) {
		    for (let col = 0; col < ncols; col++) {
			out.push([row, col]);
		    }
		}
		return out;
	    },
	}).create();
	const x_y = row_col.map(([row, col]) => {
	    const [x, y] = [
		col*step - (ncols-1)*step*0.5 + width*0.5,
		row*step - (nrows-1)*step*0.5 + height*0.45,
	    ];
	    return [x, y];
	});

	Object.assign(this.internal, {step, row_col, x_y, width, height});
	
	return this;
    }
    // -------------------------------------------------------------------------
    newSpriteGrid(imageFunc) {
	const {scene, nrows, ncols, step, row_col, x_y} = this.getContext();
	
	const sprites = x_y.map(([x, y], i) => {
	    const [row, col] = [Math.floor(i/ncols), i % ncols];
	    const sprite = this.newGridSprite(row, col, imageFunc(row, col));
	    return sprite;
	});
	// sprites.gridMap = (func) => row_col.map(([row, col], i) => func(sprites[i], row, col));
	
	return sprites;
    }
    newGridSprite(row, col, image) {
	const {scene, step, ncols, x_y} = this.getContext();
	
	const [x, y] = x_y[row*ncols + col];
	const tile = scene.newSprite(x, y, image).setDisplaySize(0.9*step, 0.9*step);
	tile.baseScale = tile.scale;
	tile.row = row;
	tile.col = col;
	return tile;
    }
    newSprite(row, col, image) {
	const {scene, nrows, ncols, x_y, step} = this.getContext();
	
	const i = row*ncols + col;
	const [x, y] = x_y[i];
	const sprite = scene.newSprite(x, y, image).setDisplaySize(step, step);
	sprite.baseScale = sprite.scale;	
	sprite.gridMove = async (r, c) => {
	    Object.assign(sprite, {row: r, col: c});
	    const [oldX, oldY] = [sprite.x, sprite.y];
	    const [newX, newY] = x_y[r*ncols + c];
	    const [originX, originY] = [sprite.originX, sprite.originY];	    	    
	    scene.tweens.add({
		targets: {t: 0},
		t: 1,
		yoyo: true,
		duration: 250,
		onUpdate: (tween, t) => sprite
		    .setOrigin(originX, originY + 0.5*t.t)
		    .setScale(sprite.baseScale*(1 + 0.2*t.t))
		    .setAngle(5*t.t),
		ease: 'Cubic.easeOut',
	    });
	    sprite.setDepth(200 + r);
	    await sprite.tween({
		x: newX,
		y: newY,
		duration: 500,
		ease: 'Cubic.easeOut',
	    });
	    sprite.setDepth(100 + r);
	};
	sprite.wiggle = async () => {
	    const duration = 50;
	    await sprite.tween({
		angle: 10,
		duration: duration,
		yoyo: true,
		ease: 'Cubic.easeOut',
	    });
	    await sprite.tween({
		angle: -10,
		duration: duration,
		yoyo: true,
		ease: 'Cubic.easeOut',
	    });
	};

	return sprite;
    }
    newButton(image, t=0.5) {
	const {scene, x_y, nrows, ncols, step} = this.getContext();

	const get_x_y = (row, col) => x_y[row*ncols + col];
	const [x1, y1] = get_x_y(nrows-1, 0);
	const [x2, y2] = get_x_y(nrows-1, ncols-1);
	const [x, y] = [(1-t)*x1 + t*x2, y1];

	const button = scene.newSprite(x, y + 1.5*step, image);
	button.setDisplaySize(button.width*step/button.height, step);
	button.baseScale = button.scale;
	return button;
    }
}
