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
  getTileURL: function(server,image,resolution,sds,contrast,k,x,y){
    var r = this.num_resolutions - resolution;
    var f = this.getMultiplier(r, this.tileSize.w);
    var djatoka_x = x*f; var djatoka_y = y*f;
    var src = server + this.url_ver
      + image + "&svc_id=" + this.svc_id
      + "&svc_val_fmt=" + this.svc_val_fmt
      + "&svc.format=image/jpeg&svc.level="
      + resolution + "&svc.rotate=0&svc.region="
      + djatoka_y + "," + djatoka_x + ",256,256";
    return src;
  },

  /* Parse a Djatoka protocol metadata request
   */
  parseMetaData: function(response){
    var p = eval("(" + response + ")");
    var w = parseInt(p.width);
    var h = parseInt(p.height);
    var num_resolutions = parseInt(p.levels) + 1;
    var result = {
      'max_size': { w: w, h: h },
      'tileSize': { w: 256, h: 256 },
      'num_resolutions': num_resolutions
    };
    return result;
    },

  /* Return URL for a full view
   */
  getRegionURL: function(image,x,y,w,h){
    return null;
  },

  /* Return thumbnail URL
   */
  getThumbnailURL: function(server,image,width){
    return server + this.url_ver
      + image + "&svc_id=" + this.svc_id
      + "&svc_val_fmt=" + this.svc_val_fmt
      + "&svc.format=image/jpeg"
      + "&svc.scale=" + width;
  },

  /* Djatoka wants the region offests in terms of the highest resoltion it has.
   * Here, we multiply up the offsets to that resolution.
   */
  getMultiplier: function(r, f) {
    var m = f;
    for (i = 1; i < r; i++) {
      m = m*2;
    }
    return m;
  }
});
