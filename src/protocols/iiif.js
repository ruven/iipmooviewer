/* IIIF Protocol Handler
 */

Protocols.IIIF = new Class({

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
    if (tile_x != 256) {
      src += "/!256,256";
    } else {
      src += "/full";
    }
    src += "/0/native.jpg";
    return src;
  },

  /* Parse an IIIF protocol metadata request
   */
  parseMetaData: function(response){
    var p = eval("(" + response + ")");
    var w = parseInt(p.width);
    var h = parseInt(p.height);
    this.num_resolutions = p.scale_factors.length;
    this.tileSize = { w: 256, h: 256 };
    var result = {
      'max_size': { w: w, h: h },
      'tileSize': this.tileSize,
      'num_resolutions': this.num_resolutions
    };
    return result;
  },

  /* Return URL for a full view
   */
  getRegionURL: function(server,image,region,width){
    return server + "/" + image + "/" + region.x + "," + region.y
      + "," + region.w + "," + region.h + "/" + width + ",/0/native.jpg";
  },

  /* Return thumbnail URL
   */
  getThumbnailURL: function(server,image,width){
    return server + "/" + image + "/full/" + width + ",/0/native.jpg";
  },

  /* Like Djatoka, IIIF wants the region offests in terms of the highest resolution it has.
   * Here, we multiply up the offsets to that resolution.
   */
  getMultiplier: function(resolution) {
    return this.tileSize.w * Math.pow(2, this.num_resolutions - resolution - 1);
  }

});
