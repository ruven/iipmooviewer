/* Extend IIPMooViewer to handle blending

   Copyright (c) 2007-2016 Ruven Pillay <ruven@users.sourceforge.net>
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


IIPMooViewer.implement({

  /* Take a list of images and add a control panel for blending
   */
  blend: function(images) {

    // We build this only after the viewer has fully loaded
    this.addEvent('load', function(){

      // Initialize our overlay image
      this.images[1] = {src: images[0][0], sds: '0,90', opacity: 0};

      // Build our controls
      this.createBlendingInterface();

      // Go through our list of images and inject them into our menus
      images.each( function(item){
	var o = new Element('option', {
	  'value': item[0],
	  'html': item[1]
	 }).inject( document.id('baselayer') );
	o.clone().inject( document.id('overlay') );
      });

      var _this = this;

    });
   },


  /* Create our control panel and add events
   */
  createBlendingInterface: function() {

    var _this = this;

    // Create our control panel and inject it into our container
    new Element( 'div', {
      'class': 'blending',
      'html': '<h2 title="<h2>Image Comparison</h2>Select the pair of images you wish<br/>to compare from the menus below.<br/>Use the slider to blend smoothly<br/>between them">Image Comparison</h2><span>Image 1</span><select id="baselayer"></select><br/><br/><span>Move slider to blend between images:</span><br/><div id="area"><div id="knob"></div></div><br/><span>Image 2</span><select id="overlay"></select><br/>'
    }).inject( this.navigation.navcontainer );

    // Add a tooltip
    new Tips( 'div.blending h2', {
      className: 'tip',
      onShow: function(t){ t.setStyle('opacity',0); t.fade(0.7); },
      onHide: function(t){ t.fade(0); }
    });

    // Create our blending slider
    var slider = new Slider( document.id('area'), document.id('knob'), {
      range: [0,100],
      onChange: function(pos){
	if( _this.images[1] ){
	  _this.images[1].opacity = pos/100.0;
	  _this.canvas.getChildren('img.layer1').setStyle( 'opacity', _this.images[1].opacity );
	}
      }
    });
    // Make sure the slider takes into account window resize events
    window.addEvent('resize', function(){ slider.autosize(); });

    // Add on change events to our select menus
    document.id('baselayer').addEvent('change', function(){
      _this.images[0].src = document.id('baselayer').value;
      _this.canvas.getChildren('img.layer0').destroy();
      _this.tiles.empty();
      _this.requestImages();
    });
    document.id('overlay').addEvent('change', function(){
      var opacity = 0;
      if( _this.images[1] ) opacity = _this.images[1].opacity;
      _this.images[1] = {src: document.id('overlay').value, opacity: opacity};
      _this.canvas.getChildren('img.layer1').destroy();
      _this.tiles.empty();
      _this.requestImages();
    });
  }

});
