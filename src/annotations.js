/*
   IIPMooViewer 2.0 - Annotation Extensions
   IIPImage Javascript Viewer <http://iipimage.sourceforge.net>

   Copyright (c) 2007-2016 Ruven Pillay <ruven@users.sourceforge.net>

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

    this.createAnnotationsArray();

    // Use closure for mouseenter and mouseleave events
    var _this = this;

    // Display / hide our annotations if we have any
    this.canvas.addEvent('mouseenter', function() {
      if (_this.annotationsVisible) {
        _this.canvas.getElements('div.annotation').removeClass('hidden');
      }
    });
    this.canvas.addEvent('mouseleave', function() {
      if (_this.annotationsVisible) {
        _this.canvas.getElements('div.annotation').addClass('hidden');
      }
    });
  },

  /* Convert our annotation object into an array - we'll need this for sorting
   */
  createAnnotationsArray: function() {
    var annotation_array = [];

    Object.each(this.annotations, function(annotation, id){
        annotation.id = id;
        annotation_array.push( annotation );
    });

    // Sort our annotations by size to make sure it's always possible to interact
    // with annotations within annotations.
    annotation_array.sort( function(a,b){ return (b.w*b.h)-(a.w*a.h); } );
    this.annotation_array = annotation_array;
  },

  /* Create annotations if they are contained within our current view
   */
  drawAnnotations: function() {

    // If there are no annotations, simply return
    if( !this.annotations ) return;
    var annotation_item, i = 0, l = this.annotation_array.length;

    // Now go through our sorted list and display those within the view
    for( ; i < l; i++ ){
      annotation_item = this.annotation_array[i];

      var position = {
        left: Math.round(this.wid * annotation_item.x),
        top: Math.round(this.hei * annotation_item.y),
        width: Math.round(this.wid * annotation_item.w),
        height: Math.round(this.hei * annotation_item.h)
      };

      var annotation = $('annotation-' + annotation_item.id);
      if (annotation) {
        annotation.setStyles(position);
      }
      else {
        this.initAnnotation(annotation_item, position);
      }

    }

    if( !this.annotationTip ){
      this.annotationTip = this.createAnnotationsTips();
    }

  },


  initAnnotation: function(annotation_item, position) {
    var cl = 'annotation';
    if (annotation_item.category) cl += ' ' + annotation_item.category;

    var annotation = new Element('div', {
      'id': 'annotation-' + annotation_item.id,
      'class': cl,
      'styles': position
    }).inject(this.canvas);
    if (!this.annotationsVisible) annotation.addClass('hidden');

    // Add edit events to annotations if we have included the functions
    if (typeof(this.editAnnotation) == "function") {
      var _this = this;
      annotation.addEvent('dblclick', function(e) {
        var event = new DOMEvent(e);
        event.stop();
        _this.editAnnotation(this);
      });
    }

    // Add our annotation text
    var text = annotation_item.text;
    if (annotation_item.title) text = '<h1>' + annotation_item.title + '</h1>' + text;
    annotation.store('tip:text', text);
  },


  createAnnotationsTips: function() {
    return new Tips('div.annotation', {
      className: 'tip', // We need this to force the tip in front of nav window
      fixed: true,
      offset: {
        x: 30,
        y: 30
      },
      hideDelay: 300,
      link: 'chain',
      onShow: function(tip, el) {
        // Fade from our current opacity to 0.9
        tip.setStyles({
          opacity: tip.getStyle('opacity'),
          display: 'block'
        }).fade(0.9);

        // Prevent the tip from fading when we are hovering on the tip itself and not
        // just when we leave the annotated zone
        tip.addEvents({
          'mouseleave': function() {
            this.active = false;
            this.fade('out').get('tween').chain(function() {
              this.element.setStyle('display', 'none');
            });
          },
          'mouseenter': function() {
            this.active = true;
          }
        });
      },
      onHide: function(tip, el) {
        if (!tip.active) {
          tip.fade('out').get('tween').chain(function() {
            this.element.setStyle('display', 'none');
          });
          tip.removeEvents(['mouseenter', 'mouseleave']);
        }
      }
    });
  },


  /* Toggle visibility of any annotations
   */
  toggleAnnotations: function() {
    var els = this.canvas.getElements('div.annotation');
    if( els ){
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
