/* Extend IIPMooViewer to handle touch events

   Copyright (c) 2007-2015 Ruven Pillay <ruven@users.sourceforge.net>
   IIPImage: http://iipimage.sourceforge.net

*/

IIPMooViewer.implement({

  /* Create touch events
   */
  addTouchEvents: function(){

    // Add touch and gesture support for mobile devices
    if( 'ontouchstart' in window || navigator.msMaxTouchPoints ){

      var _this = this;

      // Prevent dragging on the container div
      this.container.addEvent('touchmove', function(e){ e.preventDefault(); } );

      // Disable elastic scrolling and handle changes in orientation on mobile devices.
      // These events need to be added to the document body itself
      document.body.addEvents({
	'touchmove': function(e){ e.preventDefault(); },
	'orientationchange': function(){
	  _this.container.setStyles({
	    width: '100%',
	    height: '100%'
	  });
	  // Need to set a timeout the div is not resized immediately on some versions of iOS
	  this.reflow.delay(500,this);
	}.bind(this)
      });

      // Now add our touch events to our canvas
      this.canvas.addEvents({

        'touchstart': function(e){

	  // Disable mouse events during touch dragging
	  _this.touch.detach();

	  e.preventDefault();
	  _this.touchend = null;

	  // Single touch events are drags or double taps
          if(e.touches.length == 1){
	    // Simulate a double click with a timer
	    var t1 = _this.canvas.retrieve('taptime') || 0;
	    var t2 = Date.now();
	    _this.canvas.store( 'taptime', t2 );
	    _this.canvas.store( 'tapstart', 1 );

	    if( t2-t1 < 250 ){
	      // Double tap
	      _this.canvas.eliminate('taptime');
	      _this.zoomIn();
	      if(IIPMooViewer.sync) IIPMooViewer.windows(_this).invoke('zoomIn');
	    }
	    else{
	      // Record our start position
	      _this.touchstart = { x: e.touches[0].pageX, y: e.touches[0].pageY };
	      // Add drag class to prevent smooth transitions
	      _this.canvas.addClass('drag');
	    }

	  }
	  // For multitouch gestures, store our start positions
	  else if( e.touches.length == 2 ){
	    _this.canvas.store('gesturestart', 1);
	    _this.touchstart = [ { x: e.touches[0].pageX, y: e.touches[0].pageY }, { x: e.touches[1].pageX, y: e.touches[1].pageY } ];
	    _this.canvas.setStyle( _this.CSSprefix+'transform', 'translateZ(0,0,0)' );
	  }

        },

	'touchmove': function(e){
	  // Handle single finger events
	  if( e.touches.length == 1 ){

	    _this.touchend = { x: e.touches[0].pageX, y: e.touches[0].pageY };
	    var left = _this.touchend.x - _this.touchstart.x;
	    var top = _this.touchend.y - _this.touchstart.y;

	    // Limit the scroll
	    var view_x = _this.view.x - left;
	    var view_y = _this.view.y - top;

	    if( view_x > _this.wid - _this.view.w ) _this.touchend.x = _this.touchstart.x - _this.wid + _this.view.w + _this.view.x;
	    if( view_y > _this.hei - _this.view.h ) _this.touchend.y = _this.touchstart.y - _this.hei + _this.view.h + _this.view.y;
	    if( view_x < 0 ) _this.touchend.x = _this.touchstart.x + _this.view.x;
	    if( view_y < 0 ) _this.touchend.y = _this.touchstart.y + _this.view.y;

	    left = (_this.wid>_this.view.w) ? (_this.touchend.x - _this.touchstart.x) : 0;
	    top = (_this.hei>_this.view.h) ? (_this.touchend.y - _this.touchstart.y) : 0;

	    var transform = 'translate3d(' + left + 'px,' + top + 'px, 0 )';

	    _this.canvas.setStyle( _this.CSSprefix+'transform', transform );

	  }
	  // For multitouch events, track our end positions
	  if( e.touches.length == 2 ){
	    _this.touchend = [ { x: e.touches[0].pageX, y: e.touches[0].pageY }, { x: e.touches[1].pageX, y: e.touches[1].pageY } ];
	    var xx = Math.round( (e.touches[0].pageX+e.touches[1].pageX) / 2 ) + _this.view.x;
	    var yy = Math.round( (e.touches[0].pageY+e.touches[1].pageY) / 2 ) + _this.view.y;
	    var origin = xx + 'px,' + yy + 'px';
	    _this.canvas.setStyle( this.CSSprefix+'transform-origin', origin );
	  }
        },

	'touchend': function(e){

	  // Re-enable mouse dragging when touch events have terminated
	  _this.touch.attach();

	  // Handle gestures first
	  if( _this.canvas.retrieve('gesturestart') == 1 ){

	    _this.canvas.removeClass('drag');
	    _this.canvas.eliminate('tapstart');
            _this.canvas.eliminate('gesturestart');

	    // Calculate the distances between our touches
	    var d1 = ( (_this.touchend[1].x-_this.touchend[0].x)*(_this.touchend[1].x-_this.touchend[0].x) +
		       (_this.touchend[1].y-_this.touchend[0].y)*(_this.touchend[1].y-_this.touchend[0].y) );

	    var d2 = ( (_this.touchstart[1].x-_this.touchstart[0].x)*(_this.touchstart[1].x-_this.touchstart[0].x) +
		       (_this.touchstart[1].y-_this.touchstart[0].y)*(_this.touchstart[1].y-_this.touchstart[0].y) );

	    // Calculate scale
	    var scale = d1 - d2;
	    if( Math.abs(scale) > 20000 ){
	      if( scale > 0 ){
		_this.zoomIn();
		if(IIPMooViewer.sync) IIPMooViewer.windows(_this).invoke('zoomIn');
	      }
	      else if( scale < 0 ){
		_this.zoomOut();
		if(IIPMooViewer.sync) IIPMooViewer.windows(_this).invoke('zoomOut');
	      }
	    }

	    else{
	      // Rotation
	      var r1 = Math.atan2( _this.touchend[1].y - _this.touchend[0].y, _this.touchend[1].x - _this.touchend[0].x ) * 180 / Math.PI;
	      var r2 = Math.atan2( _this.touchstart[1].y - _this.touchstart[0].y, _this.touchstart[1].x - _this.touchstart[0].x ) * 180 / Math.PI;
	      var rotation = r1 - r2;
	      if( Math.abs(rotation) > 25 ){
		var r = _this.view.rotation;
		if( rotation > 0 ) r += 90 % 360;
		else r -= 90 % 360;
		_this.rotate(r);
		if(IIPMooViewer.sync) IIPMooViewer.windows(_this).invoke( 'rotate', r );
	      }
	    }

	    _this.touchend = null;
	  }

	  // Otherwise handle single touch events.
	  // Update our tiles and navigation window
	  else if( _this.canvas.retrieve('tapstart') == 1 && _this.touchend ){

	    _this.canvas.eliminate('tapstart');

	    // Reset our transform and move the canvas
	    _this.view.x -= _this.touchend.x - _this.touchstart.x;
	    _this.view.y -= _this.touchend.y - _this.touchstart.y;

	    _this.touchend = null;

	    if( _this.view.x > _this.wid-_this.view.w ) _this.view.x = _this.wid-_this.view.w;
	    if( _this.view.y > _this.hei-_this.view.h ) _this.view.y = _this.hei-_this.view.h;
	    if( _this.view.x < 0 ) _this.view.x = 0;
	    if( _this.view.y < 0 ) _this.view.y = 0;

	    // Need to reset transform to none
	    _this.canvas.setStyle( _this.CSSprefix+'transform', 'none' );
	    _this.canvas.setStyles({
              left: (_this.wid>_this.view.w) ? -_this.view.x : Math.round((_this.view.w-_this.wid)/2), 
	      top: (_this.hei>_this.view.h) ? -_this.view.y : Math.round((_this.view.h-_this.hei)/2) 
	    });

	    _this.requestImages();
	    if( _this.navigation ) _this.navigation.update(_this.view.x/_this.wid,_this.view.y/_this.hei,_this.view.w/_this.wid,_this.view.h/_this.hei);
	    if(IIPMooViewer.sync) IIPMooViewer.windows(_this).invoke( 'moveTo', _this.view.x, _this.view.y );

	    // This activates hardware acceleration
	    _this.canvas.setStyle( _this.CSSprefix+'transform', 'translateZ(0)' );
	    _this.canvas.removeClass('drag');

	  }

	}
      });
    }
  }

});
