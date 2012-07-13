/*
   IIPMooViewer 2.0 - Annotation Extensions
   IIPImage Javascript Viewer <http://iipimage.sourceforge.net>

   Copyright (c) 2007-2012 Ruven Pillay <ruven@users.sourceforge.net>

   ---------------------------------------------------------------------------

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   ---------------------------------------------------------------------------

*/


/* Extend IIPMooViewer to handle annotations
 */
IIPMooViewer.implement({

  /* Initialize canvas events for our annotations
   */
  initAnnotationTips: function() {

    this.annotationTip = null;
    this.annotationsVisible = true;

    // Use closure for mouseenter and mouseleave events
    var _this = this;

    // Display / hide our annotations if we have any
    if( this.annotations ){
      this.canvas.addEvent( 'mouseenter', function(){
        if( _this.annotationsVisible ){
	  _this.canvas.getElements('div.annotation').removeClass('hidden');
	}
      });
      this.canvas.addEvent( 'mouseleave', function(){
	if( _this.annotationsVisible ){
	  _this.canvas.getElements('div.annotation').addClass('hidden');
	}
      });
    }
  },


  /* Create annotations if they are contained within our current view
   */
  createAnnotations: function() {

    // If there are no annotations, simply return
    if( !this.annotations ) return;

    // Convert our annotation object into an array - we'll need this for sorting later
    var annotation_array = new Array();
    for( var a in this.annotations ){
      this.annotations[a].id = a;
      annotation_array.push( this.annotations[a] );
    }

    // Make sure we really have some content
    if( annotation_array.length == 0 ) return;

    // Sort our annotations by size to make sure it's always possible to interact
    // with annotations within annotations.
    annotation_array.sort( function(a,b){ return (b.w*b.h)-(a.w*a.h); } );

    // Now go through our sorted list and display those within the view
    for( var i=0; i<annotation_array.length; i++ ){

      // Check whether this annotation is within our view
      if( this.wid*(annotation_array[i].x+annotation_array[i].w) > this.view.x &&
	  this.wid*annotation_array[i].x < this.view.x+this.view.w &&
	  this.hei*(annotation_array[i].y+annotation_array[i].h) > this.view.y &&
	  this.hei*annotation_array[i].y < this.view.y+this.view.h
	  // Also don't show annotations that entirely fill the screen
	  //	  (this.hei*annotation_array[i].x < this.view.x && this.hei*annotation_array[i].y < this.view.y &&
	  //	   this.wid*(annotation_array[i].x+annotation_array[i].w) > this.view.x+this.view.w && 
      ){

	var _this = this;
	var cl = 'annotation';
	if( annotation_array[i].category ) cl += ' ' + annotation_array[i].category;
	var annotation = new Element('div', {
	  'id': annotation_array[i].id,
          'class': cl,
          'styles': {
            left: Math.round(this.wid * annotation_array[i].x),
            top: Math.round(this.hei * annotation_array[i].y ),
	    width: Math.round( this.wid * annotation_array[i].w ),
	    height: Math.round( this.hei * annotation_array[i].h )
	  }
        }).inject( this.canvas );

	if( this.annotationsVisible==false ) annotation.addClass('hidden');

	// Add edit events to annotations if we have included the functions
	if( typeof(this.editAnnotation)=="function" ){
	  if( annotation_array[i].edit == true ) this.editAnnotation( annotation );
	  else{
	    var _this = this;
	    annotation.addEvent( 'dblclick', function(e){
				   var event = new DOMEvent(e); 
				   event.stop();
				   _this.editAnnotation(this);
				 });
	  }
	}

	// Add our annotation text
	var text = annotation_array[i].text;
	if( annotation_array[i].title ) text = '<h1>'+annotation_array[i].title+'</h1>' + text;
        annotation.store( 'tip:text', text );
      }

    }


    if( !this.annotationTip ){
      var _this = this;
      this.annotationTip = new Tips( 'div.annotation', {
        className: 'tip', // We need this to force the tip in front of nav window
	fixed: true,
	offset: {x:30,y:30},
	hideDelay: 300,
	link: 'chain',
        onShow: function(tip,el){

	  // Fade from our current opacity to 0.9
	  tip.setStyles({
	    opacity: tip.getStyle('opacity'),
	    display: 'block'
	  }).fade(0.9);

	  // Prevent the tip from fading when we are hovering on the tip itself and not
	  // just when we leave the annotated zone
	  tip.addEvents({
	    'mouseleave':  function(){
	       this.active = false;
	       this.fade('out').get('tween').chain( function(){ this.element.setStyle('display','none'); });
	    },
	    'mouseenter': function(){ this.active = true; }
	  })
        },
        onHide: function(tip, el){
	  if( !tip.active ){
	    tip.fade('out').get('tween').chain( function(){ this.element.setStyle('display','none'); });
	    tip.removeEvents(['mouseenter','mouseleave']);
	  }
        }
      });
    }

  },


  /* Toggle visibility of any annotations
   */
  toggleAnnotations: function() {
    var els;
    if( els = this.canvas.getElements('div.annotation') ){
      if( this.annotationsVisible ){
	els.addClass('hidden');
	this.annotationsVisible = false;
	this.showPopUp( IIPMooViewer.lang.annotationsDisabled );
      }
      else{
	els.removeClass('hidden');
	this.annotationsVisible = true;
      }
    }
  },


  /* Destroy our annotations
   */
  destroyAnnotations: function() {
    if( this.annotationTip ) this.annotationTip.detach( this.canvas.getChildren('div.annotation') );
    this.canvas.getChildren('div.annotation').each(function(el){
      el.eliminate('tip:text');
      el.destroy();
    });
  }


});
