import { Component, OnInit, ViewChild, 
  AfterViewInit, ChangeDetectorRef, 
  Input, ElementRef, HostListener } from '@angular/core';
import { TweenMax, Power3 } from 'gsap';
import { Position } from './position.interface';
import { Pixel } from './pixel.interface';
import * as PIXI from 'pixi.js';
import * as Web3 from 'web3';
import * as Contract from 'truffle-contract';
@Component({
  selector: 'app-place',
  templateUrl: './place.component.html',
  styleUrls: ['./place.component.css']
})
export class PlaceComponent implements OnInit, AfterViewInit {
  @ViewChild('canvasContainer') canvasContainer: ElementRef;

  private app: PIXI.Application;
  private container: PIXI.Container;
  private graphics: PIXI.Graphics;
  private gridSize = [1000, 1000];
  private squareSize = [3, 3];
  private zoomLevel = 6;
  private gridLines;
  private zoomed: boolean = false;
  private scale: number = 1;


  private dragging: boolean = false;
  private mouseDown: boolean = false;
  private start: Position;
  private graphicsStart: Position;
  private selectedColor: string = null;

  colors = [
    'ffffff',
    'e4e4e4',
    '888888',
    '222222',
    'ffa7d1',
    'e50000',
    'e59500',
    'a06a42',
    'e5d900',
    '94e044',
    '02be01',
    '00d3dd',
    '0083c7',
    '0000ea',
    'cf6ee4',
    '820080'
  ];

  constructor(private changeDetectorRef: ChangeDetectorRef) { }
  ngOnInit() {

  }
  ngAfterViewInit() {
    const canvasContainerEl: HTMLCanvasElement = this.canvasContainer.nativeElement;
    this.app = new PIXI.Application(window.innerWidth, window.innerHeight-60, {antialias: false, backgroundColor: 0xeeeeee});
    canvasContainerEl.appendChild(this.app.view);
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(0xffffff, 1);
    this.graphics.drawRect(0, 0, this.gridSize[0] * this.squareSize[0], this.gridSize[1] * this.squareSize[1])
    this.graphics.interactive = true;

    // setup input listeners, we use
    // pointerdown, pointermove, etc 
    // rather than mousedown, mousemove,
    // etc, because it triggers on both
    // mouse and touch
    this.graphics.on('pointerdown', this.onDown.bind(this));
    this.graphics.on('pointermove', this.onMove.bind(this));
    this.graphics.on('pointerup', this.onUp.bind(this));
    this.graphics.on('pointerupoutside', this.onUp.bind(this));

    // move graphics so that it's center
    // is at x0 y0
    this.graphics.position.x = -this.graphics.width/2;
    this.graphics.position.y = -this.graphics.height/2;
    // place graphics into the container
    this.container.addChild(this.graphics);

    this.gridLines = new PIXI.Graphics();
    this.gridLines.lineStyle(0.5, 0x888888, 1);
    this.gridLines.alpha = 0;

    this.gridLines.position.x = this.graphics.position.x;
    this.gridLines.position.y = this.graphics.position.y;

    for(let i = 0; i <= this.gridSize[0]; i++) {
      this.drawLine(0, i * this.squareSize[0], this.gridSize[0] * this.squareSize[0], i * this.squareSize[0])	
    }
    for(let j = 0; j <= this.gridSize[1]; j++) {
      this.drawLine(j * this.squareSize[1], 0, j * this.squareSize[1], this.gridSize[1] * this.squareSize[1])
    }

    this.container.addChild(this.gridLines);


    // make canvas fill the screen.
    this.onResize();

    // add zoom button controls
    //zoomInButton.addEventListener("click", () => { toggleZoom({x: window.innerWidth / 2, y: window.innerHeight / 2}, true) });
    //zoomOutButton.addEventListener("click", () => { toggleZoom({x: window.innerWidth / 2, y: window.innerHeight / 2}, false) });

  }
  selectColor(event, color, index) {
    if (this.selectedColor !== color) {
      this.selectedColor = color;
    } else {
      this.selectedColor = null;
    }
    
  }
  zoomIn() {
    this.toggleZoom({x: window.innerWidth / 2, y: window.innerHeight / 2}, true);
  }
  zoomOut() {
    this.toggleZoom({x: window.innerWidth / 2, y: window.innerHeight / 2}, false);
  }
  toggleZoom(offset: Position, forceZoom?: boolean) {
    console.log(forceZoom)
    // toggle the zoomed varable
    this.zoomed = forceZoom !== undefined ? forceZoom : !this.zoomed;

    // scale will equal 4 if this.zoomed (so 4x bigger), 
    // other otherwise the scale will be 1
    this.scale = this.zoomed ? this.zoomLevel : 1;

    // add or remove the zoomed class to the 
    // body tag. This is so we can change the 
    // info box instructions
    //if(this.zoomed) body.classList.add('zoomed');
    //else body.classList.remove('zoomed');	

    let opacity = this.zoomed ? 1 : 0;

    // Use GSAP to animate between this.scales.
    // We are scaling the container and not
    // the graphics. 

    TweenMax.to(this.container.scale, 0.5, { x: this.scale, y: this.scale, ease: Power3.easeInOut });
    let x = offset.x - (window.innerWidth / 2);
    let y = offset.y - (window.innerHeight / 2);
    let newX = this.zoomed ? this.graphics.position.x - x : this.graphics.position.x + x;
    let newY = this.zoomed ? this.graphics.position.y - y : this.graphics.position.y + y;
    TweenMax.to(this.graphics.position, 0.5, {x: newX, y: newY, ease:Power3.easeInOut});
    TweenMax.to(this.gridLines.position, 0.5, {x: newX, y: newY, ease:Power3.easeInOut});
    TweenMax.to(this.gridLines, 0.5, {alpha: opacity, ease:Power3.easeInOut});
  }
  @HostListener('window:resize', ['$event'])
  private onResize() {
    // resize the canvas to fill the screen
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
      
    // center the container to the new
    // window size.
    this.container.position.x = window.innerWidth / 2;
    this.container.position.y = window.innerHeight / 2;
  }
  private drawLine(x, y, x2, y2) {
    this.gridLines.moveTo(x, y);
		this.gridLines.lineTo(x2, y2);
  }
  private onDown(e) {
    // Pixi.js adds all its mouse listeners
    // to the window, regardless of which
    // element they are assigned to inside the
    // canvas. So to avoid zooming in when 
    // selecting a color we first check if the
    // click is not withing the bottom 60px where
    // the color options are
    if(e.data.global.y < window.innerHeight - 60 /*&& ready*/) {
      // We save the mouse down position
      this.start = {x: e.data.global.x, y: e.data.global.y};
      
      // And set a flag to say the mouse
      // is now down
      this.mouseDown = true;
    }
}
private onMove(e) {
	// check if mouse is down (in other words
	// check if the user has clicked or touched 
	// down and not yet lifted off)
	if(this.mouseDown) {	
		// if not yet detected a drag then...
		if(!this.dragging) {
			// we get the mouses current position
			let pos = e.data.global;
			
			// and check if that new position has
			// move more than 5 pixels in any direction
			// from the first mouse down position
			if(Math.abs(this.start.x - pos.x) > 5 || Math.abs(this.start.y - pos.y) > 5) {
				// if it has we can assume the user
				// is trying to draw the view around
				// and not clicking. We store the 
				// graphics current position do we 
				// can offset its postion with the
				// mouse position later.
				this.graphicsStart = {x: this.graphics.position.x, y: this.graphics.position.y};
				
				// set the dragging flag
				this.dragging = true;
				
				// add the .dragging class to the 
				// DOM so we can switch to the 
				// move cursor
				//body.classList.add('dragging');
			}
		}
		if(this.dragging) {
			// update the graphics position based
			// on the mouse position, offset with the
			// start and graphics orginal positions
			this.graphics.position.x = ((e.data.global.x - this.start.x)/this.scale) + this.graphicsStart.x;
			this.graphics.position.y = ((e.data.global.y - this.start.y)/this.scale) + this.graphicsStart.y;
			
			this.gridLines.position.x = ((e.data.global.x - this.start.x)/this.scale) + this.graphicsStart.x;
			this.gridLines.position.y = ((e.data.global.y - this.start.y)/this.scale) + this.graphicsStart.y;
		}
	}
}
private onUp(e) {
	// clear the .dragging class from DOM
	// body.classList.remove('dragging');
	
	// ignore the mouse up if the mouse down
	// was out of bounds (e.g in the bottom
	// 60px)
	if(this.mouseDown /*&& this.ready*/) {
		// clear mouseDown flag
		this.mouseDown = false;
		
		// if the dragging flag was never set
		// during all the mouse moves then this 
		// is a click
		if(!this.dragging) {
			// if a color has been selected and
			// the view is zoomed in then this
			// click is to draw a new pixel
			if(this.selectedColor && this.zoomed) {
				// get the latest mouse position 
				let position = e.data.getLocalPosition(this.graphics);
				
				// round the x and y down
				let x = Math.floor(position.x / this.squareSize[0]);
				let y = Math.floor(position.y / this.squareSize[1]);
				
				this.writePixel(x, y, this.selectedColor);
			}
			else {
				// either a color has not been selected
				// or it has but the user is zoomed out,
				// either way this click is to toggle the
				// zoom level
				this.toggleZoom(e.data.global)
			}
		}
		this.dragging = false;
	}
}
private writePixel(x: number, y: number, color: string) {
  let pixel: Pixel = {uid: '', timestamp: 1, color: color};
  this.renderPixel(x+'x'+y, pixel)
}
private renderPixel(pos:string, pixel: Pixel) {
	// split the pos string at the 'x'
	// so '100x200' would become an
	// array ['100', '200']
	let split = pos.split('x');
	
	// assign the values to x and y 
	// vars using + to convert the 
	// string to a number
	let x = +split[0];
	let y = +split[1];
	
	// grab the color from the pixel
	// object
	let color = pixel.color;
	
	// draw the square on the graphics canvas
	this.graphics.beginFill(parseInt('0x' + color), 1);
	this.graphics.drawRect(x * this.squareSize[0], y * this.squareSize[1], this.squareSize[0], this.squareSize[1]);
}

}
