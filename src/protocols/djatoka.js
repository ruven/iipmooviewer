/* Djatoka Protocol Handler
 */

var Djatoka = new Class({

  'svc_val_fmt': "info:ofi/fmt:kev:mtx:jpeg2000",
  'svc_id': "info:lanl-repo/svc/getRegion",

  /* Return metadata URL
   */
  getMetaDataURL: function(image){
    return "url_ver=Z39.88-2004&rft_id=" + image + "&svc_id=info:lanl-repo/svc/getMetadata";
  },

  /* Return an individual tile request URL
   */
  getTileURL: function(server,image,resolution,sds,contrast,k,x,y){
    var src = server + "?url_ver=Z39.88-2004&rft_id="
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
    var tmp = p.levels;
    var w = parseInt(p.width);
    var h = parseInt(p.height);
    var num_resolutions = parseInt(p.levels);
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
  }

});
