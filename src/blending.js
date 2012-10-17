
/* Extend IIPMooViewer to handle blending
 */
IIPMooViewer.implement({

  /* Take a list of images and add a control panel for blending
   */
  blend: function(images) {

    // We build this only after the viewer has fully loaded
    this.addEvent('load', function(){

      // Initialize our overlay image
      this.images[1] = {src: images[0][0], cnt: 1, sds: '0,90'};

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
      document.id('baselayer').addEvent('focus', function(){
								_this.setCredit('clicked');
								_this.container.removeEvent('mouseenter');
							      });

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
    }).inject( this.navcontainer );

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
        _this.opacity = pos/100.0;
        _this.canvas.getChildren('img.layer1').setStyle( 'opacity', _this.opacity );
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
      _this.images[1] = {src: document.id('overlay').value, cnt: 1};
      _this.canvas.getChildren('img.layer1').destroy();
      _this.tiles.empty();
      _this.requestImages();
    });
  }

});
