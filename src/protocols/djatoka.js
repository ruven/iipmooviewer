/* Djatoka Protocol Handler
 */

Protocols.Djatoka = new Class({

  svc_val_fmt: "info:ofi/fmt:kev:mtx:jpeg2000",
  svc_id:      "info:lanl-repo/svc/getRegion",
  url_ver:     "?url_ver=Z39.88-2004&rft_id=",

  /* Return metadata URL
   */
  getMetaDataURL: function(server,image){
    return server + this.url_ver + image + "&svc_id=info:lanl-repo/svc/getMetadata";
  },

  /* Return an individual tile request URL
   */
  getTileURL: function(t){
    var f = this.getMultiplier(t.resolution);
    var djatoka_x = t.x*f; var djatoka_y = t.y*f;
    var src = t.server + this.url_ver
      + t.image + "&svc_id=" + this.svc_id
      + "&svc_val_fmt=" + this.svc_val_fmt
      + "&svc.format=image/jpeg&svc.level="
      + t.resolution + "&svc.rotate=0&svc.region="
      + djatoka_y + "," + djatoka_x + ",256,256";
    return src;
  },

  /* Parse a Djatoka protocol metadata request
   */
  parseMetaData: function(response){
    var p = eval("(" + response + ")");
    var w = parseInt(p.width);
    var h = parseInt(p.height);
    this.num_resolutions = parseInt(p.levels) + 1;
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
  getRegionURL: function(server,image,region,width,height){
    return server + this.url_ver
      + image + "&svc_id=" + this.svc_id
      + "&svc_val_fmt=" + this.svc_val_fmt
      + "&svc.format=image/jpeg"
      + "&svc.region=" + region.y + "," + region.x
      + "," + region.h + "," + region.w
      + "&svc.scale=" + Math.floor(width);
  },

  /* Return thumbnail URL
   */
  getThumbnailURL: function(server,image,width){
    return server + this.url_ver
      + image + "&svc_id=" + this.svc_id
      + "&svc_val_fmt=" + this.svc_val_fmt
      + "&svc.format=image/jpeg"
      + "&svc.scale=" + Math.floor(width);
  },

  /* Djatoka wants the region offests in terms of the highest resoltion it has.
   * Here, we multiply up the offsets to that resolution.
   */
  getMultiplier: function(resolution) {
    return this.tileSize.w * Math.pow(2, this.num_resolutions - resolution - 1);
  }
});
