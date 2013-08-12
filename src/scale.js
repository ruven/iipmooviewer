/* IIPMooViewer Scale Widget

   Copyright (c) 2007-2013 Ruven Pillay <ruven@users.sourceforge.net>
   IIPImage: http://iipimage.sourceforge.net

   --------------------------------------------------------------------
   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   --------------------------------------------------------------------
*/


var Scale = new Class({

  /* Constructor
   */
  initialize: function( pixelscale, units ){

    this.pixelscale = pixelscale;

    // Allow a range of units, multiples and labels.
    // First define default for meters
    this.units = {
      dims:   ["pm", "nm", "&#181;m", "mm", "cm", "m", "km"], // Unit suffixes
      orders: [ 1e-12, 1e-9, 1e-6, 0.001, 0.01, 1, 1000 ],    // Unit orders
      mults: [1,2,5,10,50,100],                               // Different scalings usable for each unit
      factor: 1000                                            // Default multiplication factor
    }

    // Allow user to also pass own user-defined units
    if( units ){
      if( instanceOf(units,String) == false ) this.units = units;
      else if( units == "degrees" ){
	// Degree units for astronomy
	this.units = {
	  dims:   ["\'\'", "\'", "&deg"],
	  orders: [ 1/3600, 1/60, 1 ],
	  mults: [1,10,15,30],
	  factor: 3600
	}
      }
    }
  },


  /* Create our HTML
   */
  create: function( container ){
    // Create our scale elements
    this.scale = new Element( 'div', {
      'class': 'scale',
      'title': IIPMooViewer.lang.scale,
      'html': '<div class="ruler"></div><div class="label"></div>'
    }).inject(container);

    // Make it draggable and add a tween transition on rescaling
    this.scale.makeDraggable({container: container});
    this.scale.getElement('div.ruler').set('tween', {
      transition: Fx.Transitions.Quad.easeInOut
    });
  },


  /* Update the scale on our image - change the units if necessary
   */
  update: function( ratio, view_width ){

    // Determine the number of pixels a unit takes at this scale. x1000 because we want per m
    var pixels = this.units.factor * this.pixelscale * ratio;

    // Loop through until we get a good fit scale. Be careful to break fully from the outer loop
    var i, j;
    outer: for( i=0;i<this.units.orders.length;i++ ){
      for( j=0; j<this.units.mults.length; j++ ){
	if( this.units.orders[i]*this.units.mults[j]*pixels > view_width/20 ) break outer;
      }
    }
    // Make sure we don't overrun the end of our array if we don't find a match
    if( i >= this.units.orders.length ) i = this.units.orders.length-1;
    if( j >= this.units.mults.length ) j = this.units.mults.length-1;

    // Create a label and calculate the new physical size of our scale
    var label = this.units.mults[j] + this.units.dims[i];
    pixels = pixels*this.units.orders[i]*this.units.mults[j] - 4; // Subtract 4px to take into account 2*2px borders

    // Use a smooth transition to resize and set the units
    this.scale.getElement('div.ruler').tween( 'width', pixels );
    this.scale.getElement('div.label').set( 'html', label );

  },


  /* Calculate best units for image size
   */
  calculateDefault: function( image_width ){
    for( var i=0; i<this.units.orders.length; i++ ){
      if( image_width / (this.units.orders[i] * this.units.factor * this.pixelscale) < 1000 ) break;
    }
    this.defaultUnit = i;
  },


  /* Reposition our scale wrt to our container
   */
  reflow: function( container ){
    var top = container.getSize().y -
      container.getElement('div.scale').getSize().y - 10;
    this.scale.setStyles({
      left: 10,
      top: top
    });
  }

});
