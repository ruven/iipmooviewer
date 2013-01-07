/*
   IIPMooViewer 2.0
   IIPImage Javascript Viewer <http://iipimage.sourceforge.net>

   Copyright (c) 2007-2013 Ruven Pillay <ruven@users.sourceforge.net>

   ---------------------------------------------------------------------------

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301, USA.

   ---------------------------------------------------------------------------

   Built using the Mootools 1.4.5 javascript framework <http://www.mootools.net>


   Usage Example:

   viewer = new IIPMooViewer( 'div_id', { server: '/fcgi-bin/iipsrv.fcgi',
                              image: '/images/test.tif',
                              credit: 'copyright me 2011',
			      prefix: '/prefix/',
			      render: 'random',
                              showNavButtons: whether to show navigation buttons: true (default) or false
			      scale: 100 } );

   where the arguments are:
	i) The id of the main div element in which to create the viewer window
	ii) A hash containting:
	      image: the full image path (or array of paths) on the server (required)
              server: the iipsrv server full URL (defaults to "/fcgi-bin/iipsrv.fcgi")
	      credit: image copyright or information (optional)
	      prefix: path prefix if images or javascript subdirectory moved (default 'images/')
              render: tile rendering style - 'spiral' for a spiral from the centre or
                      'random' for a rendering of tiles in a random order
	      scale: pixels per mm
	      showNavWindow: whether to show the navigation window. Default true
	      showNavButtons: whether to show the navigation buttons. Default true
	      showCoords: whether to show live screen coordinates. Default false
	      protocol: iip (default), zoomify or deepzoom
	      enableFullscreen: allow full screen mode. Default true
	      viewport: object containing x, y, resolution, rotation of initial view
	      winResize: whether view is reflowed on window resize. Default true
	      preload: load extra surrounding tiles

   Note: Requires mootools version 1.4 or later <http://www.mootools.net>
       : The page MUST have a standard-compliant HTML declaration at the beginning

*/



/* Main IIPMooViewer Class
 */
var IIPMooViewer = new Class({

  Extends: Events,

  version: '2.0',


  /* Constructor - see documentation for options
   */
  initialize: function( main_id, options ) {

    this.source = main_id || alert( 'No element ID given to IIPMooViewer constructor' );

    this.server = options.server || '/fcgi-bin/iipsrv.fcgi';

    this.render = options.render || 'spiral';

    // Set the initial zoom resolution and viewport
    this.viewport = null;
    if( options.viewport ){
      this.viewport = {
	resolution: (typeof(options.viewport.resolution)=='undefined') ? null : parseInt(options.viewport.resolution),
	rotation: (typeof(options.viewport.rotation)=='undefined') ? null : parseInt(options.viewport.rotation),
	contrast: (typeof(options.viewport.contrast)=='undefined') ? null : parseFloat(options.viewport.contrast),
	x: (typeof(options.viewport.x)=='undefined') ? null : parseFloat(options.viewport.x),
	y: (typeof(options.viewport.y)=='undefined') ? null : parseFloat(options.viewport.y)
      }
    }

    this.images = new Array(options['image'].length);
    options.image || alert( 'Image location not set in class constructor options');
    if( typeOf(options.image) == 'array' ){
       for( i=0; i<options.image.length;i++ ){
	 this.images[i] = { src:options.image[i], sds:"0,90", cnt:(this.viewport&&this.viewport.contrast!=null)? this.viewport.contrast : null };
       }
    }
    else this.images = [{ src:options.image, sds:"0,90", cnt:(this.viewport&&this.viewport.contrast!=null)? this.viewport.contrast : null } ];

    this.loadoptions = options.load || null;

    this.credit = options.credit || null;

    this.scale = ((typeof(Scale)==="function")&&options.scale) ? new Scale(options.scale,options.units) : null;


    // Enable fullscreen mode? If false, then disable. Otherwise option can be "native" for HTML5
    // fullscreen API mode or "page" for standard web page fill page mode
    this.enableFullscreen = 'native';
    if( options.enableFullscreen == false ) this.enableFullscreen = false;
    if( options.enableFullscreen == 'page' ) this.enableFullscreen = 'page';
    this.fullscreen = null;
    if( this.enableFullscreen != false ){
      this.fullscreen = {
	isFullscreen: false,
	targetsize: {},
	eventChangeName: null,
	enter: null,
	exit: null
      }
    }


    // Disable the right click context menu on image tiles?
    this.disableContextMenu = true;

    this.prefix = options.prefix || 'images/';


    // Navigation window options
    this.navigation = null;
    if( (typeof(Navigation)==="function") ){
      this.navigation = new Navigation({ showNavWindow:options.showNavWindow,
					 showNavButtons: options.showNavButtons,
					 navWinSize: options.navWinSize,
				         showCoords: options.showCoords,
					 prefix: this.prefix
				       });
    }

    this.winResize = (options.winResize==false)? false : true;


    // Set up our protocol handler
    switch( options.protocol ){
      case 'zoomify':
	this.protocol = new Protocols.Zoomify();
	break;
      case 'deepzoom':
	this.protocol = new Protocols.DeepZoom();
	break;
      case 'djatoka':
        this.protocol = new Protocols.Djatoka();
	break;
      default:
	this.protocol = new Protocols.IIP();
    }


    // Preload tiles surrounding view window?
    this.preload = (options.preload == true) ? true : false;
    this.effects = false;

    // Set up our annotations if they have been set and our annotation functions implemented
    this.annotations = ((typeof(this.initAnnotationTips)=="function")&&options.annotations)? options.annotations : null;



    // If we want to assign a function for a click within the image
    // - used for multispectral curve visualization, for example
    this.click = options.click || null;

    this.max_size = {};      // Dimensions of largest resolution
    this.opacity = 0;
    this.wid = 0;             // Width of current resolution
    this.hei = 0;             // Height of current resolution
    this.resolutions;         // List of available resolutions
    this.num_resolutions = 0; // Number of available resolutions
    this.view = {
      x: 0,                   // Location and dimensions of current visible view
      y: 0,
      w: this.wid,
      h: this.hei,
      res: 0,                 // Current resolution
      rotation: 0          // Current rotational orientation
    };

    this.tileSize = {};       // Tile size in pixels {w,h}


    // Number of tiles loaded
    this.tiles = new Array(); // List of tiles currently displayed
    this.nTilesLoaded = 0;    // Number of tiles loaded
    this.nTilesToLoad = 0;    // Number of tiles left to load


    // CSS3: Need to prefix depending on browser. Cannot handle IE<9
    this.CSSprefix = '';
    if( Browser.firefox ) this.CSSprefix = '-moz-';
    else if( Browser.chrome || Browser.safari || Browser.Platform.ios ) this.CSSprefix = '-webkit-';
    else if( Browser.opera ) this.CSSprefix = '-o-';
    else if( Browser.ie ) this.CSSprefix = 'ms-';  // Note that there should be no leading "-" !!


    // Load us up when the DOM is fully loaded!
    window.addEvent( 'domready', this.load.bind(this) );
  },



  /* Create the appropriate CGI strings and change the image sources
   */
  requestImages: function() {

    // Set our cursor
    this.canvas.setStyle( 'cursor', 'wait' );

    // Delete our annotations
    if( this.annotations ) this.destroyAnnotations();

    // Set our rotation origin - calculate differently if canvas is smaller than view port
    if( !Browser.buggy ){
      var origin_x = ( this.wid>this.view.w ? Math.round(this.view.x+this.view.w/2) : Math.round(this.wid/2) ) + "px";
      var origin_y = ( this.hei>this.view.h ? Math.round(this.view.y+this.view.h/2) : Math.round(this.hei/2) ) + "px";
      var origin = origin_x + " " + origin_y;
      this.canvas.setStyle( this.CSSprefix+'transform-origin', origin );
    }

    // Load our image mosaic
    this.loadGrid();

    // Create new annotations and attach the tooltip to them if it already exists
    if( this.annotations ){
      this.createAnnotations();
      if( this.annotationTip ) this.annotationTip.attach( this.canvas.getChildren('div.annotation') );
    }
  },



  /* Create a grid of tiles with the appropriate tile request and positioning
   */
  loadGrid: function(){

    var border = this.preload ? 1 : 0

    // Get the start points for our tiles
    var startx = Math.floor( this.view.x / this.tileSize.w ) - border;
    var starty = Math.floor( this.view.y / this.tileSize.h ) - border;
    if( startx<0 ) startx = 0;
    if( starty<0 ) starty = 0;


    // If our size is smaller than the display window, only get these tiles!
    var len = this.view.w;
    if( this.wid < this.view.w ) len = this.wid;
    var endx =  Math.ceil( ((len + this.view.x)/this.tileSize.w) - 1 ) + border;


    len = this.view.h;
    if( this.hei < this.view.h ) len = this.hei;
    var endy = Math.ceil( ( (len + this.view.y)/this.tileSize.h) - 1 ) + border;


    // Number of tiles is dependent on view width and height
    var xtiles = Math.ceil( this.wid / this.tileSize.h );
    var ytiles = Math.ceil( this.hei / this.tileSize.h );

    if( endx >= xtiles ) endx = xtiles-1;
    if( endy >= ytiles ) endy = ytiles-1;


    /* Calculate the offset from the tile top left that we want to display.
       Also Center the image if our viewable image is smaller than the window
    */
    var xoffset = Math.floor(this.view.x % this.tileSize.w);
    if( this.wid < this.view.w ) xoffset -=  (this.view.w - this.wid)/2;

    var yoffset = Math.floor(this.view.y % this.tileSize.h);
    if( this.hei < this.view.h ) yoffset -= (this.view.h - this.hei)/2;

    var tile;
    var i, j, k, n;
    var left, top;
    k = 0;
    n = 0;

    var centerx = startx + Math.round((endx-startx)/2);
    var centery = starty + Math.round((endy-starty)/2);

    var map = new Array((endx-startx)*(endx-startx));
    var newTiles = new Array((endx-startx)*(endx-startx));
    newTiles.empty();

    // Should put this into
    var ntiles = 0;
    for( j=starty; j<=endy; j++ ){
      for (i=startx;i<=endx; i++) {

	map[ntiles] = {};
	if( this.render == 'spiral' ){
	  // Calculate the distance from the centre of the image
	  map[ntiles].n = Math.abs(centery-j)* Math.abs(centery-j) + Math.abs(centerx-i)*Math.abs(centerx-i);
	}
	// Otherwise do a random rendering
	else map[ntiles].n = Math.random();

	map[ntiles].x = i;
	map[ntiles].y = j;
	ntiles++;

	k = i + (j*xtiles);
	newTiles.push(k);

      }
    }

    this.nTilesLoaded = 0;
    this.nTilesToLoad = ntiles * this.images.length;

    // Delete the tiles from our old image mosaic which are not in our new list of tiles
    this.canvas.get('morph').cancel();
    var _this = this;
    this.canvas.getChildren('img').each( function(el){
      var index = parseInt(el.retrieve('tile'));
      if( !newTiles.contains(index) ){
        el.destroy();
	_this.tiles.erase(index);
      }
    });

    map.sort(function s(a,b){return a.n - b.n;});

    for( var m=0; m<ntiles; m++ ){

      var i = map[m].x;
      var j = map[m].y;

      // Sequential index of the tile in the tif image
      k = i + (j*xtiles);

      if( this.tiles.contains(k) ){
	this.nTilesLoaded += this.images.length;
        if( this.navigation ) this.navigation.refreshLoadBar(this.nTilesLoaded,this.nTilesToLoad);
	if( this.nTilesLoaded >= this.nTilesToLoad ) this.canvas.setStyle( 'cursor', null );
	continue;
      }

      // Iterate over the number of layers we have
      var n;
      for(n=0;n<this.images.length;n++){

        var tile = new Element('img', {
          'class': 'layer'+n+' hidden',
          'styles': {
	    left: i*this.tileSize.w,
	    top: j*this.tileSize.h
          }
        });
	// Move this out of the main constructor to avoid DOM attribute bloat
	if( this.effects ) tile.setStyle('opacity',0.1);

	// Inject into our canvas
	tile.inject(this.canvas);

	// Get tile URL from our protocol object
	var src = this.protocol.getTileURL({
	  server: this.server,
	  image:this.images[n].src,
	  resolution: this.view.res,
	  sds: (this.images[n].sds||'0,90'),
          contrast: (this.images[n].cnt||null),
	  gamma: (this.images[n].gam||null),
          tileindex: k,
          x: i,
          y: j
	});

	// Add our tile event functions after injection otherwise we get no event
	tile.addEvents({
	  'load': function(tile,id){
	     if( this.effects ) tile.setStyle('opacity',1);
	     tile.removeClass('hidden');
	     if(!(tile.width&&tile.height)){
	       tile.fireEvent('error');
	       return;
	     }
	     this.nTilesLoaded++;
	     if( this.navigation ) this.navigation.refreshLoadBar( this.nTilesLoaded, this.nTilesToLoad );
	     if( this.nTilesLoaded >= this.nTilesToLoad ) this.canvas.setStyle( 'cursor', null );
	     this.tiles.push(id); // Add to our list of loaded tiles
	  }.bind(this,tile,k),
	  'error': function(){
	     // Try to reload if we have an error.
	     // Add a suffix to prevent caching, but remove error event to avoid endless loops
	     this.removeEvents('error');
	     var src = this.src;
	     this.set( 'src', src + '?'+ Date.now() );
	  }
	});

	// We must set the source at the end so that the 'load' function is properly fired
	tile.set( 'src', src );
	tile.store('tile',k);
      }

    }

    if( this.images.length > 1 ){
      var selector = 'img.layer'+(n-1);
      this.canvas.getChildren(selector).setStyle( 'opacity', this.opacity );
    }

  },


  /* Get a URL for a screenshot of the current view region
   */
  getRegionURL: function(){
    var w = this.resolutions[this.view.res].w;
    var h = this.resolutions[this.view.res].h;
    var region = {x: this.view.x/w, y: this.view.y/h, w: this.view.w/w, h: this.view.h/h};
    var url = this.protocol.getRegionURL( this.server, this.images[0].src, region, w );
    return url;
  },


  /* Handle various keyboard events such as allowing us to navigate within the image via the arrow keys etc.
   */
  key: function(e){

    var event = new DOMEvent(e);

    var d = Math.round(this.view.w/4);

    switch( e.code ){
    case 37: // left
      this.nudge(-d,0);
      if( IIPMooViewer.sync ){
	IIPMooViewer.windows(this).each( function(el){ el.nudge(-d,0); });
      }
      event.preventDefault(); // Prevent default only for navigational keys
      break;
    case 38: // up
      this.nudge(0,-d);
      if( IIPMooViewer.sync ){
	IIPMooViewer.windows(this).each( function(el){ el.nudge(0,-d); });
      }
      event.preventDefault();
      break;
    case 39: // right
      this.nudge(d,0);
      if( IIPMooViewer.sync ){
	IIPMooViewer.windows(this).each( function(el){ el.nudge(d,0); });
      }
      event.preventDefault();
      break;
    case 40: // down
      this.nudge(0,d);
      if( IIPMooViewer.sync ){
	IIPMooViewer.windows(this).each( function(el){ el.nudge(0,d); });
      }
      event.preventDefault();
      break;
    case 107: // plus
      if(!e.control){
	this.zoomIn();
	if( IIPMooViewer.sync ){
	  IIPMooViewer.windows(this).each( function(el){ el.zoomIn(); });
	}
	event.preventDefault();
      }
      break;
    case 109: // minus
      if(!e.control){
	this.zoomOut();
	if( IIPMooViewer.sync ){
	  IIPMooViewer.windows(this).each( function(el){ el.zoomOut(); });
	}
      }
      break;
    case 189: // minus
      if(!e.control) this.zoomOut();
      break;
    case 72: // h
      if( this.navigation ) this.navigation.toggleWindow();
      break;
    case 82: // r
      if(!e.control){
	var r = this.view.rotation;
	if(e.shift) r -= 90 % 360;
	else r += 90 % 360;

	this.rotate( r );
	if( IIPMooViewer.sync ){
	  IIPMooViewer.windows(this).each( function(el){ el.rotate(r); });
	}
      }
      break;
    case 65: // a
      if( this.annotations ) this.toggleAnnotations();
      break;
    case 27: // esc
      if( this.fullscreen && this.fullscreen.isFullscreen ) if(!IIPMooViewer.sync) this.toggleFullScreen();
      this.container.getElement('div.info').fade('out');
      break;
    case 70: // f fullscreen, but if we have multiple views
      if(!IIPMooViewer.sync) this.toggleFullScreen();
      break;
    case 67: // For control-c, show our current view location
      if(e.control) prompt( "URL of current view:", window.location.href + '#' + this.view.res + ',' +
			   (this.view.x+this.view.w/2)/this.wid + ',' +
			   (this.view.y+this.view.h/2)/this.hei );
      break;
    default:
      break;
    }

  },


  /* Rotate our view
   */
  rotate: function( r ){

    // Rotation works in Firefox 3.5+, Chrome, Safari and IE9+
    if( Browser.buggy ) return;

    this.view.rotation = r;
    var angle = 'rotate(' + r + 'deg)';
    this.canvas.setStyle( this.CSSprefix+'transform', angle );

  },


  /* Toggle fullscreen
   */
  toggleFullScreen: function(){
    var l,t,w,h;

    if(this.enableFullscreen == false) return;

    if( !this.fullscreen.isFullscreen ){
      // Note our size, location and positioning
      this.fullscreen.targetsize = {
	pos: {x: this.container.style.left, y: this.container.style.top },
	size: {x: this.container.style.width, y: this.container.style.height },
	position: this.container.style.position
      };
      l = 0;
      t = 0;
      w = '100%';
      h = '100%';
      p = 'absolute'; // Must make our container absolute for fullscreen

      if( this.fullscreen.enter && !this.fullscreen.isFullscreen ) this.fullscreen.enter.call(this.container);
    }
    else{
      l = this.fullscreen.targetsize.pos.x;
      t = this.fullscreen.targetsize.pos.y;
      w = this.fullscreen.targetsize.size.x;
      h = this.fullscreen.targetsize.size.y;
      p = this.fullscreen.targetsize.position;

      if( this.fullscreen.exit && this.fullscreen.isFullscreen ) this.fullscreen.exit.call(document);
    }

    if( !this.fullscreen.enter ){
      this.container.setStyles({
	left: l,
	top: t,
	width: w,
	height: h,
	position: p
      });
      this.fullscreen.isFullscreen = !this.fullscreen.isFullscreen;
      // Create a fullscreen message, then delete after a timeout
      if( this.fullscreen.isFullscreen ) this.showPopUp( IIPMooViewer.lang.exitFullscreen );
      else this.container.getElements('div.message').destroy();
      this.reload();
    }

  },


  /* Show a message, then delete after a timeout
   */
  showPopUp: function( text ) {
    var fs = new Element('div',{
      'class': 'message',
      'html': text
    }).inject( this.container );
    var del;
    if( Browser.buggy ) del = function(){ fs.destroy(); };
    else del = function(){ fs.fade('out').get('tween').chain( function(){ fs.destroy(); } ); };
    del.delay(3000);
  },


  /* Scroll resulting from a drag of the navigation window
   */
  scrollNavigation: function( e ) {

    // Cancel any running morphs on the canvas
    this.canvas.get('morph').cancel();

    var xmove = Math.round(e.x * this.wid);
    var ymove = Math.round(e.y * this.hei);

    // Only morph transition if we have moved a short distance and our rotation is zero
    var morphable = Math.abs(xmove-this.view.x)<this.view.w/2 && Math.abs(ymove-this.view.y)<this.view.h/2 && this.view.rotation==0;
    if( morphable ){
      this.canvas.morph({
	left: (this.wid>this.view.w)? -xmove : Math.round((this.view.w-this.wid)/2),
	top: (this.hei>this.view.h)? -ymove : Math.round((this.view.h-this.hei)/2)
      });
    }
    else{
      this.canvas.setStyles({
	left: (this.wid>this.view.w)? -xmove : Math.round((this.view.w-this.wid)/2),
	top: (this.hei>this.view.h)? -ymove : Math.round((this.view.h-this.hei)/2)
      });
    }

    this.view.x = xmove;
    this.view.y = ymove;

    // The morph event automatically calls requestImages
    if( !morphable ){
      this.requestImages();
    }

    if(IIPMooViewer.sync){
      IIPMooViewer.windows(this).each( function(el){ el.moveTo(xmove,ymove); });
    }
  },



  /* Scroll from a drag event on the tile canvas
   */
  scroll: function(e) {

    var pos = {};
    // Use style values directly as getPosition will take into account rotation
    pos.x = this.canvas.getStyle('left').toInt();
    pos.y = this.canvas.getStyle('top').toInt();
    var xmove =  -pos.x;
    var ymove =  -pos.y;
    this.moveTo( xmove, ymove );

    if( IIPMooViewer.sync ){
      IIPMooViewer.windows(this).each( function(el){ el.moveTo(xmove,ymove); });
    }

  },



  /* Check our scroll bounds.
   */
  checkBounds: function( x, y ) {

    if( x > this.wid-this.view.w ) x = this.wid - this.view.w;
    if( y > this.hei-this.view.h ) y = this.hei - this.view.h;

    if( x < 0 || this.wid < this.view.w ) x = 0;
    if( y < 0 || this.hei < this.view.h ) y = 0;

    this.view.x = x;
    this.view.y = y;
  },



  /* Move to a particular position on the image
   */
  moveTo: function( x, y ){

    // To avoid unnecessary redrawing ...
    if( x==this.view.x && y==this.view.y ) return;

    this.checkBounds(x,y);
    this.canvas.setStyles({
      left: (this.wid>this.view.w)? -this.view.x : Math.round((this.view.w-this.wid)/2),
      top: (this.hei>this.view.h)? -this.view.y : Math.round((this.view.h-this.hei)/2)
    });

    this.requestImages();
    if( this.navigation ) this.navigation.update(this.view.x/this.wid,this.view.y/this.hei,this.view.w/this.wid,this.view.h/this.hei);
  },



  /* Nudge the view by a small amount
   */
  nudge: function( dx, dy ){

    this.checkBounds(this.view.x+dx,this.view.y+dy);

    // Check whether image size is less than viewport
    this.canvas.morph({
      left: (this.wid>this.view.w)? -this.view.x : Math.round((this.view.w-this.wid)/2),
      top: (this.hei>this.view.h)? -this.view.y : Math.round((this.view.h-this.hei)/2)
    });

    if( this.navigation ) this.navigation.update(this.view.x/this.wid,this.view.y/this.hei,this.view.w/this.wid,this.view.h/this.hei);
  },



  /* Generic zoom function for mouse wheel or click events
   */
  zoom: function( e ) {

    var event = new DOMEvent(e);

    // Stop all mousewheel events in order to prevent stray scrolling events
    event.stop();

    // Set z to +1 if zooming in and -1 if zooming out
    var z = 1;

    // For mouse scrolls
    if( event.wheel && event.wheel < 0 ) z = -1;
    // For double clicks
    else if( event.shift ) z = -1;
    else z = 1;

    // Bail out if at zoom limits
    if( (z==1) && (this.view.res >= this.num_resolutions-1) ) return;
    if( (z==-1) && (this.view.res <= 0) ) return;

    if( event.target ){
      var pos, xmove, ymove;
      var cc = event.target.get('class');

      if( cc != "zone" & cc != 'navimage' ){
	pos = this.canvas.getPosition();

	// Center our zooming on the mouse position when over the main target window
	this.view.x = event.page.x - pos.x - Math.floor(this.view.w/2);
	this.view.y = event.page.y - pos.y - Math.floor(this.view.h/2);
      }
      else{
	// For zooms with the mouse over the navigation window
	pos = this.navigation.zone.getParent().getPosition();
	var n_size = this.navigation.zone.getParent().getSize();
	var z_size = this.navigation.zone.getSize();
	this.view.x = Math.round( (event.page.x - pos.x - z_size.x/2) * this.wid/n_size.x );
	this.view.y = Math.round( (event.page.y - pos.y - z_size.y/2) * this.hei/n_size.y );
      }

      if( IIPMooViewer.sync ){
	var _x = this.view.x;
	var _y = this.view.y;
	IIPMooViewer.windows(this).each( function(el){
	  el.view.x = _x;
	  el.view.y = _y;
        });
      }
    }

    // Now do our actual zoom
    if( z == -1 ) this.zoomOut();
    else this.zoomIn();

    if( IIPMooViewer.sync ){
      IIPMooViewer.windows(this).each( function(el){
	if( z==-1) el.zoomOut();
	else el.zoomIn();
      });
    }

  },



  /* Zoom in by a factor of 2
   */
  zoomIn: function(){
    if( this.view.res < this.num_resolutions-1 ) this.zoomTo( this.view.res+1 );
  },



  /* Zoom out by a factor of 2
   */
  zoomOut: function(){
    if( this.view.res > 0 ) this.zoomTo( this.view.res-1 );
  },



  /* Zoom to a particular resolution
   */
  zoomTo: function(r){

    if( r == this.view.res ) return;

    if( (r <= this.num_resolutions-1) && (r >= 0) ){

      var factor = Math.pow( 2, r-this.view.res );

      // Calculate an offset to take into account the view port size
      // Center if our image width at this resolution is smaller than the view width - only need to do this on zooming in as our
      // constraining will automatically recenter when zooming out
      var xoffset, yoffset;
      if( r > this.view.res ){
	xoffset = (this.resolutions[this.view.res].w > this.view.w) ? this.view.w*(factor-1)/2 : this.resolutions[r].w/2 - this.view.w/2;
	yoffset = (this.resolutions[this.view.res].h > this.view.h) ? this.view.h*(factor-1)/2 : this.resolutions[r].h/2 - this.view.h/2;
      }
      else{
	xoffset = -this.view.w*(1-factor)/2;
	yoffset = -this.view.h*(1-factor)/2;;
      }

      this.view.x = Math.round( factor*this.view.x + xoffset );
      this.view.y = Math.round( factor*this.view.y + yoffset );

      this.view.res = r;

      this._zoom();
    }
  },


  /* Generic zoom function
   */
  _zoom: function(){

    // Get the image size for this resolution
    this.wid = this.resolutions[this.view.res].w;
    this.hei = this.resolutions[this.view.res].h;

    if( this.view.x + this.view.w > this.wid ) this.view.x = this.wid - this.view.w;
    if( this.view.x < 0 ) this.view.x = 0;

    if( this.view.y + this.view.h > this.hei ) this.view.y = this.hei - this.view.h;
    if( this.view.y < 0 ) this.view.y = 0;

    this.canvas.setStyles({
      left: (this.wid>this.view.w)? -this.view.x : Math.round((this.view.w-this.wid)/2),
      top: (this.hei>this.view.h)? -this.view.y : Math.round((this.view.h-this.hei)/2),
      width: this.wid,
      height: this.hei
    });

    // Contstrain our canvas to our containing div
    this.constrain();

    // Delete our image tiles
    this.canvas.getChildren('img').destroy();

    this.tiles.empty();

    this.requestImages();
    if( this.navigation ){
      this.navigation.update(this.view.x/this.wid,this.view.y/this.hei,this.view.w/this.wid,this.view.h/this.hei);
      this.navigation.setCoords('');
    }
    if( this.scale ) this.scale.update( this.wid/this.max_size.w, this.view.w );

  },


  /* Calculate navigation view size
   */
  calculateNavSize: function(){

    var thumb_width = Math.round(this.view.w * this.navigation.options.navWinSize);

    // For panoramic images, use a large navigation window
    if( this.max_size.w > 2*this.max_size.h ) thumb_width = Math.round( this.view.w/2 );

    // Make sure our height is not more than 50% of view height
    if( (this.max_size.h/this.max_size.w)*thumb_width > this.view.h*0.5 ){
      thumb_width = Math.round( this.view.h * 0.5 * this.max_size.w/this.max_size.h );
    }

    this.navigation.size.x = thumb_width;
    this.navigation.size.y = Math.round( (this.max_size.h/this.max_size.w)*thumb_width );
  },


  /* Calculate some dimensions
   */
  calculateSizes: function(){

    // Set up our default sizes
    var target_size = this.container.getSize();
    this.view.x = -1; // Intitalize x,y with dummy values
    this.view.y = -1;
    this.view.w = target_size.x;
    this.view.h = target_size.y;

    // Calculate our navigation window size
    if( this.navigation ) this.calculateNavSize();

    // Determine the image size for this image view
    this.view.res = this.num_resolutions;
    var tx = this.max_size.w;
    var ty = this.max_size.h;

    // Calculate our list of resolution sizes and the best resolution
    // for our window size
    this.resolutions = new Array(this.num_resolutions);
    this.resolutions.push({w:tx,h:ty});
    this.view.res = 0;
    for( var i=1; i<this.num_resolutions; i++ ){
      tx = Math.floor(tx/2);
      ty = Math.floor(ty/2);
      this.resolutions.push({w:tx,h:ty});
      if( tx < this.view.w && ty < this.view.h ) this.view.res++;
    }
    this.view.res -= 1;

    // Sanity check and watch our for small screen displays causing the res to be negative
    if( this.view.res < 0 ) this.view.res = 0;
    if( this.view.res >= this.num_resolutions ) this.view.res = this.num_resolutions-1;

    // We reverse so that the smallest resolution is at index 0
    this.resolutions.reverse();
    this.wid = this.resolutions[this.view.res].w;
    this.hei = this.resolutions[this.view.res].h;

  },


  /* Update the message in the credit div
   */
  setCredit: function(message){
    this.container.getElement('div.credit').set( 'html', message );
  },


  /* Create our main and navigation windows
   */
  createWindows: function(){

    // Setup our class
    this.container = document.id(this.source);
    this.container.addClass( 'iipmooviewer' );

    // Use a lexical closure rather than binding to pass this to anonymous functions
    var _this = this;


    // Set up fullscreen API event support for Firefox 10+, Safari 5.1+ and Chrome 17+
    if( this.enableFullscreen == 'native' ){

      if( document.documentElement.requestFullscreen ){
        this.fullscreen.eventChangeName = 'fullscreenchange';
        this.enter =  this.container.requestFullscreen;
        this.exit = document.documentElement.cancelFullScreen;
      }
      else if( document.mozCancelFullScreen ){
        this.fullscreen.eventChangeName = 'mozfullscreenchange';
        this.fullscreen.enter = this.container.mozRequestFullScreen;
        this.fullscreen.exit = document.documentElement.mozCancelFullScreen;
      }
      else if( document.webkitCancelFullScreen ){
        this.fullscreen.eventChangeName = 'webkitfullscreenchange';
        this.fullscreen.enter = this.container.webkitRequestFullScreen;
        this.fullscreen.exit = document.documentElement.webkitCancelFullScreen;
      }

      if( this.fullscreen.enter ){
	// Monitor Fullscreen change events
	document.addEvent( this.fullscreen.eventChangeName, function(){
			     _this.fullscreen.isFullscreen = !_this.fullscreen.isFullscreen;
			     _this.reload();
			   });
      }
      else{
	// Disable fullscreen mode if we are already at 100% size and we don't have real Fullscreen
	if( this.container.getStyle('width') == '100%' && this.container.getStyle('height') == '100%' ){
	  this.enableFullscreen = false;
	}
      }
    }


    // Our modal information box
    new Element( 'div', {
      'class': 'info',
      'styles': { opacity: 0 },
      'events': {
	click: function(){ this.fade('out'); }
      },
      'html': '<div><div><h2><a href="http://iipimage.sourceforge.net"><img src="'+this.prefix+'iip.32x32.png"/></a>IIPMooViewer</h2>IIPImage HTML5 Ajax High Resolution Image Viewer - Version '+this.version+'<br/><ul><li>'+IIPMooViewer.lang.navigate+'</li><li>'+IIPMooViewer.lang.zoomIn+'</li><li>'+IIPMooViewer.lang.zoomOut+'</li><li>'+IIPMooViewer.lang.rotate+'</li><li>'+IIPMooViewer.lang.fullscreen+'<li>'+IIPMooViewer.lang.annotations+'</li><li>'+IIPMooViewer.lang.navigation+'</li></ul><br/>'+IIPMooViewer.lang.more+' <a href="http://iipimage.sourceforge.net">http://iipimage.sourceforge.net</a></div></div>'
    }).inject( this.container );

    // Create our main window target div, add our events and inject inside the frame
    this.canvas = new Element('div', {
      'class': 'canvas',
      'morph': {
	transition: Fx.Transitions.Quad.easeInOut,
	onComplete: function(){
	  _this.requestImages();
	}
      }
    });


    // Create our main view drag object for our canvas.
    // Add synchronization via the Drag complete hook as well as coordinate updating
    var coordsBind = this.updateCoords.bind(this);
    this.touch = new Drag( this.canvas, {
      onStart: function(){
	_this.canvas.addClass('drag');
	_this.canvas.removeEvent('mousemove:throttle(100)',coordsBind);
      },
      onComplete: function(){
	_this.scroll();
	_this.canvas.removeClass('drag');
	_this.canvas.addEvent('mousemove:throttle(100)',coordsBind);
      }
    });


    // Inject our canvas into the container, but events need to be added after injection
    this.canvas.inject( this.container );
    this.canvas.addEvents({
      'mousewheel:throttle(75)': this.zoom.bind(this),
      'dblclick': this.zoom.bind(this),
      'mousedown': function(e){ var event = new DOMEvent(e); event.stop(); },
      'mousemove:throttle(100)': coordsBind, // Throttle to avoid unnecessary updating
      'mouseenter': function(){ if( _this.navigation && _this.navigation.coords ) _this.navigation.coords.fade(0.65); },
      'mouseleave': function(){ if( _this.navigation && _this.navigation.coords ) _this.navigation.coords.fade('out'); }
    });


    // Initialize canvas events for our annotations
    if( this.annotations ) this.initAnnotationTips();


    // Disable the right click context menu if requested and show our info window instead
    if( this.disableContextMenu ){
      this.container.addEvent( 'contextmenu', function(e){
					   var event = new DOMEvent(e);
					   event.stop();
					   _this.container.getElement('div.info').fade(0.95);
					   return false;
					 } )
    }


    // Add an external callback if we have been given one
    if( this.click ){

      // But add it mouseup rather than click to avoid triggering during dragging
      var fn = this.click.bind(this);
      this.canvas.addEvent( 'mouseup', fn );

      // And additionally disable this during dragging
      this.touch.addEvents({
	start: function(e){ _this.canvas.removeEvents( 'mouseup' ); },
	complete: function(e){ _this.canvas.addEvent( 'mouseup', fn ); }
      });
    }


    // We want to add our keyboard events, but only when we are over the viewer div
    // Also prevent default scrolling via mousewheel
    var keybind = this.key.bind(this);
    this.container.addEvents({
      'mouseenter': function(){ document.addEvent( 'keydown', keybind ); },
      'mouseleave': function(){ document.removeEvent( 'keydown', keybind ); },
      'mousewheel': function(e){ e.preventDefault(); }
    });


    // Add our logo and a tooltip explaining how to use the viewer
    var info = new Element( 'img', {
      'src': this.prefix+'iip.32x32.png',
      'class': 'logo',
      'title': IIPMooViewer.lang.help,
      'events': {
	click: function(){ _this.container.getElement('div.info').fade(0.95); },
	// Prevent user from dragging image
	mousedown: function(e){ var event = new DOMEvent(e); event.stop(); }
      }
    }).inject(this.container);


    // Add our touch events
    this.addTouchEvents();


    // Add some information or credit
    if( this.credit ){
      new Element( 'div', {
	'class': 'credit',
	'html': this.credit,
	'events': {
	  // We specify the start value to stop a strange problem where on the first
	  // mouseover we get a sudden transition to opacity 1.0
	  mouseover: function(){ this.fade([0.6,0.9]); },
	  mouseout: function(){ this.fade(0.6); }
	}
      }).inject(this.container);
    }


    // Add a scale if requested
    if( this.scale ) this.scale.create(this.container);


    // Calculate some sizes and create the navigation window
    this.calculateSizes();
    if( this.navigation){
      this.navigation.create(this.container);
      this.navigation.setImage(this.protocol.getThumbnailURL(this.server,this.images[0].src,this.navigation.size.x));
      this.navigation.addEvents({
	'zoomIn': this.zoomIn.bind(this),
	'zoomOut': this.zoomOut.bind(this),
	'reload': this.reload.bind(this),
	'scroll': this.scrollNavigation.bind(this),
	'zoom': this.zoom.bind(this)
     });
    }
    if( this.annotations ) this.createAnnotations();


    // Add tips if we are not on a mobile device
    if( !(Browser.Platform.ios||Browser.Platform.android) ){
      var tip_list = 'img.logo, div.toolbar, div.scale';
      if( Browser.ie8||Browser.ie7 ) tip_list = 'img.logo, div.toolbar'; // IE8 bug which triggers window resize
      new Tips( tip_list, {
	className: 'tip', // We need this to force the tip in front of nav window
	  onShow: function(tip,hovered){
	    tip.setStyles({ opacity: 0, display: 'block' }).fade(0.9);
	  },
	  onHide: function(tip, hovered){
	    tip.fade('out').get('tween').chain( function(){ tip.setStyle('display', 'none'); } );
	  }
      });
    }

    // Clear invalid this.viewport.resolution values
    if( this.viewport && typeof(this.viewport.resolution!='undefined') &&
	typeof(this.resolutions[this.viewport.resolution])=='undefined'){
      this.viewport.resolution=null;
    }

    // Set our initial viewport resolution if this has been set
    if( this.viewport && this.viewport.resolution!=null ){
      this.view.res = this.viewport.resolution;
      this.wid = this.resolutions[this.view.res].w;
      this.hei = this.resolutions[this.view.res].h;
      this.touch.options.limit = { x: Array(this.view.w-this.wid,0), y: Array(this.view.h-this.hei,0) };
    }

    // Center our view or move to initial viewport position
    if( this.viewport && this.viewport.x!=null && this.viewport.y!=null ){
      this.moveTo( this.viewport.x*this.wid-(this.view.w/2), this.viewport.y*this.hei-(this.view.h/2) );
    }
    else this.recenter();


    // Set the size of the canvas to that of the full image at the current resolution
    this.canvas.setStyles({
      width: this.wid,
      height: this.hei
    });


    // Load our images
    this.requestImages();
    if( this.navigation ) this.navigation.update(this.view.x/this.wid,this.view.y/this.hei,this.view.w/this.wid,this.view.h/this.hei);
    if( this.scale ) this.scale.update( this.wid/this.max_size.w, this.view.w );

    // Set initial rotation
    if( this.viewport && this.viewport.rotation!=null ){
      this.rotate( this.viewport.rotation );
    }

    // Add our key press and window resize events. Do this at the end to avoid reloading before
    // we are fully set up
    if(this.winResize) window.addEvent( 'resize', this.reflow.bind(this) );

    this.fireEvent('load');

  },


  /* Create function to update coordinates
   */
  updateCoords: function(e){
    if( !this.navigation || !this.navigation.coords ) return;
    // Calculate scale factor for this resolution 
    var f = this.max_size.w / this.wid;
    // Calculate position taking into account images smaller than our view
    var x = e.page.x + this.view.x - ((this.wid<this.view.w) ? Math.round((this.view.w-this.wid)/2) : 0);
    var y = e.page.y + this.view.y - ((this.hei<this.view.h) ? Math.round((this.view.h-this.hei)/2) : 0);
    x = (x*f / this.scale.pixelscale).toFixed(2);
    y = (y*f / this.scale.pixelscale).toFixed(2);
    this.navigation.setCoords( x+'mm, '+y+'mm' );
  },


  /* Change our image and reload our view
   */
  changeImage: function( image ){

    // Replace our image array
    this.images = [{ src:image, sds:"0,90", cnt:(this.viewport&&this.viewport.contrast!=null)? this.viewport.contrast : null } ];

    // Send a new AJAX request for the metadata
    var metadata = new Request({
      method: 'get',
      url: this.protocol.getMetaDataURL( this.server, this.images[0].src ),
      onComplete: function(transport){
	var response = transport || alert( "Error: No response from server " + this.server );

	// Parse the result
	var result = this.protocol.parseMetaData( response );
	this.max_size = result.max_size;
	this.tileSize = result.tileSize;
	this.num_resolutions = result.num_resolutions;

	this.reload();

	if( this.navigation ) this.navigation.setImage( this.protocol.getThumbnailURL( this.server, image, this.navigation.size.x ) );

      }.bind(this),
	onFailure: function(){ alert('Error: Unable to get image metadata from server!'); }
    } );

    // Send the metadata request
    metadata.send();
  },



  /* Use an AJAX request to get the image size, tile size and number of resolutions from the server
   */
  load: function(){

    // If we have supplied the relevent information, simply use the given data
    if( this.loadoptions ){
      this.max_size = this.loadoptions.size;
      this.tileSize = this.loadoptions.tiles;
      this.num_resolutions = this.loadoptions.resolutions;
      this.createWindows();
    }
    else{
      var metadata = new Request({
	method: 'get',
	url: this.protocol.getMetaDataURL( this.server, this.images[0].src ),
	onComplete: function(transport){
	  var response = transport || alert( "Error: No response from server " + this.server );

	  // Parse the result
	  var result = this.protocol.parseMetaData( response );
	  this.max_size = result.max_size;
	  this.tileSize = result.tileSize;
	  this.num_resolutions = result.num_resolutions;

	  this.createWindows();
        }.bind(this),
	onFailure: function(){ alert('Error: Unable to get image metadata from server!'); }
      });

      // Send the metadata request
      metadata.send();
    }
  },


  /* Reflow our viewer after a resize
   */
  reflow: function(){

    var target_size = this.container.getSize();
    this.view.w = target_size.x;
    this.view.h = target_size.y;

    // Constrain our canvas if it is smaller than the view window
    this.canvas.setStyles({
      left: (this.wid>this.view.w)? -this.view.x : Math.round((this.view.w-this.wid)/2),
      top: (this.hei>this.view.h)? -this.view.y : Math.round((this.view.h-this.hei)/2)
    });


    // Calculate our new navigation window size
    if( this.navigation ){
      this.calculateNavSize();
      this.navigation.reflow(this.container);
    }


    // Reset and reposition our scale
    if( this.scale ){
      this.scale.update( this.wid/this.max_size.w, this.view.w );
      this.scale.reflow(this.container);
    }

    this.requestImages();

    if( this.navigation ){
      this.navigation.update(this.view.x/this.wid,this.view.y/this.hei,this.view.w/this.wid,this.view.h/this.hei);
    }
    this.constrain();

  },


  /* Reload our view
   */
  reload: function(){

    // First cancel any effects on the canvas and delete the tiles within
    this.canvas.get('morph').cancel();
    this.canvas.getChildren('img').destroy();
    this.tiles.empty();
    this.calculateSizes();

    // Resize the main tile canvas
    if( this.viewport && this.viewport.resolution!=null ){
      this.view.res = this.viewport.resolution;
      this.wid = this.resolutions[this.view.res].w;
      this.hei = this.resolutions[this.view.res].h;
      this.touch.options.limit = { x: Array(this.view.w-this.wid,0), y: Array(this.view.h-this.hei,0) };
    }
    // Center our view or move to initial viewport position
    if( this.viewport && this.viewport.x!=null && this.viewport.y!=null ){
      this.moveTo( this.viewport.x*this.wid-(this.view.w/2), this.viewport.y*this.hei-(this.view.h/2) );
    }
    else this.recenter();

    this.canvas.setStyles({
      width: this.wid,
      height: this.hei
    });


    this.reflow();

    // Set initial rotation - do this after a reflow as requestimages resets rotation to zero
    if( this.viewport && this.viewport.rotation!=null ){
      this.rotate( this.viewport.rotation );
    }
    else this.rotate(0);

  },


  /* Recenter the image view
   */
  recenter: function(){

    // Calculate the x,y for a centered view, making sure we have no negative
    // in case our resolution is smaller than the viewport
    var xoffset = Math.round( (this.wid-this.view.w)/2 );
    this.view.x = (xoffset<0)? 0 : xoffset;

    var yoffset = Math.round( (this.hei-this.view.h)/2 );
    this.view.y = (yoffset<0)? 0 : yoffset;

    // Center our canvas, taking into account images smaller than the viewport
    this.canvas.setStyles({
      left: (this.wid>this.view.w)? -this.view.x : Math.round((this.view.w-this.wid)/2),
      top : (this.hei>this.view.h)? -this.view.y : Math.round((this.view.h-this.hei)/2)
    });

    this.constrain();

  },


  /* Constrain the movement of our canvas to our containing div
   */
  constrain: function(){

    var ax = this.wid<this.view.w ? Array(Math.round((this.view.w-this.wid)/2), Math.round((this.view.w-this.wid)/2)) : Array(this.view.w-this.wid,0);
    var ay = this.hei<this.view.h ? Array(Math.round((this.view.h-this.hei)/2), Math.round((this.view.h-this.hei)/2)) : Array(this.view.h-this.hei,0);

    this.touch.options.limit = { x: ax, y: ay };
  }


});
window['IIPMooViewer'] = IIPMooViewer;


/* Static function for synchronizing iipmooviewer instances
 */
IIPMooViewer.synchronize = function(viewers){
  this.sync = viewers;
};


/* Static function get get an array of the windows that are
   synchronized to this one
 */
IIPMooViewer.windows = function(s){
  if( !this.sync || !this.sync.contains(s) ) return Array();
  return this.sync.filter( function(t){
     return (t!=s);
  });
};


/* Add a little convenience variable to detect buggy IE versions
 */
if( Browser.ie && Browser.version<9 ) Browser.buggy = true;
else Browser.buggy = false;


/* Setup our list of protocol objects
 */
if(typeof Protocols === 'undefined') var Protocols = {};
