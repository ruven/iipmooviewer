/* IIIF Protocol Handler
 */

Protocols.IIIF = new Class({

  /* Default format for requests
   */
  format: "jpg",

  /* Return metadata URL
   */
  getMetaDataURL: function(server,image){
    return server + "/" + image + "/info.json";
  },

  /* Return an individual tile request URL
   */
  getTileURL: function(t){
    var f = this.getMultiplier(t.resolution);
    var orig_x = t.x*f;
    var orig_y = t.y*f;
    var tile_x = this.tileSize.w * Math.pow(2,  this.num_resolutions - t.resolution - 1);
    var tile_y = this.tileSize.h * Math.pow(2,  this.num_resolutions - t.resolution - 1);
    var src = t.server + "/" + t.image + "/" + orig_x + "," + orig_y + "," + tile_x + "," + tile_y;

    // Handle bottom right tiles that may be smaller than the standard tile size
    if( this.resolutions &&
	(t.x+1) * this.tileSize.w > this.resolutions[t.resolution].w &&
	(t.y+1) * this.tileSize.h > this.resolutions[t.resolution].h ){
      src += "/!" + (this.resolutions[t.resolution].w - (t.x * this.tileSize.w) ) + "," + (this.resolutions[t.resolution].h - (t.y * this.tileSize.h) );

    }
    else if( tile_x != this.tileSize.w ){
      src += "/!" + this.tileSize.w + "," + this.tileSize.h;
    } else {
      src += "/max";
    }
    src += "/0/default." + this.format;
    return src;
  },

  /* Parse an IIIF protocol metadata request
   */
  parseMetaData: function(response){
    var p = eval("(" + response + ")");
    var w = parseInt(p.width);
    var h = parseInt(p.height);

    // Handle both 1.1 and 2.0 IIIF API's
    if( typeOf( p.scale_factors ) !== "null" ){ this.num_resolutions = p.scale_factors.length; }
    else this.num_resolutions = p.tiles[0].scaleFactors.length;

    this.tileSize = { w: 256, h: 256 };
    if( p.tiles[0].width ) this.tileSize.w = parseInt( p.tiles[0].width );
    if( p.tiles[0].height ) this.tileSize.h = parseInt( p.tiles[0].height );

    var result = {
      'max_size': { w: w, h: h },
      'tileSize': this.tileSize,
      'num_resolutions': this.num_resolutions
    };

    // Add a list of resolutions if given
    if( typeOf(p.sizes) !== "null" && (p.sizes.length == this.num_resolutions-1 || p.sizes.length == this.num_resolutions) ){
      result.resolutions = new Array(this.num_resolutions);
      for( var r=0; r<this.num_resolutions-1; r++ ){
	var size = p.sizes[r];
	result.resolutions[r] = {w:size.width,h:size.height};
      }
      // Add the full size image
      result.resolutions[this.num_resolutions-1] = {w:w,h:h};
    }
    // Otherwise calculate ourselves
    else{
      result.resolutions = new Array();
      var tx = w;
      var ty = h;
      result.resolutions.push({w:tx,h:ty});
      for( var i=1; i<this.num_resolutions; i++ ){
        tx = Math.floor(tx/2);
        ty = Math.floor(ty/2);
        result.resolutions.push({w:tx,h:ty});
      }
      // We reverse so that the smallest resolution is at index 0
      result.resolutions.reverse();
    }
    // Store these resolution sizes
    this.resolutions = result.resolutions;

    return result;
  },

  /* Return URL for a full view
   */
  getRegionURL: function(server,image,region,width,height){
    return server + "/" + image + "/" + region.x + "," + region.y
      + "," + region.w + "," + region.h + "/" + width + ",/0/default." + this.format;
  },

  /* Return thumbnail URL
   */
  getThumbnailURL: function(server,image,width){
    return server + "/" + image + "/full/" + width + ",/0/default." + this.format;
  },

  /* Like Djatoka, IIIF wants the region offests in terms of the highest resolution it has.
   * Here, we multiply up the offsets to that resolution.
   */
  getMultiplier: function(resolution) {
    return this.tileSize.w * Math.pow(2, this.num_resolutions - resolution - 1);
  },

  /* Set image format for image requests
   */
  setFormat: function(format){
    switch( format.toUpperCase() ){
      case 'WEBP':
        this.format = "webp";
        break;
      case 'PNG':
        this.format = "png";
        break;
      case 'AVIF':
        this.format = "avif";
        break;
      default:
        this.format = 'jpg';
    }
  }

});
