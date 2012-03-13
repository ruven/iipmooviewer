/* Zoomify Protocol Handler
 */

var Zoomify = new Class({

  /* Return metadata URL
   */
  getMetaDataURL: function(image){
    return "Zoomify=" + image + "/ImageProperties.xml";
  },

  /* Return an individual tile request URL
   */
  getTileURL: function(server,image,resolution,sds,contrast,k,x,y){
    return server+"?Zoomify="+image+"/TileGroup0/"+resolution+"-"+x+"-"+y+".jpg";
  },

  /* Parse a Zoomify protocol metadata request
   */
  parseMetaData: function(response){
    // Simply split the reponse as a string
    var tmp = response.split('"');
    var w = parseInt(tmp[1]);
    var h = parseInt(tmp[3]);
    var ts = parseInt(tmp[11]);
    // Calculate the number of resolutions - smallest fits into a tile
    var max = (w>h)? w : h;
    var n = 1;
    while( max > ts ){
      max = Math.floor( max/2 );
      n++;
    }
    var result = {
      'max_size': { w: w, h: h },
      'tileSize': { w: ts, h: ts },
      'num_resolutions': n
    };
    return result;
  },

  /* Return URL for a full view - not possible with Zoomify
   */
  getRegionURL: function(image,x,y,w,h){
    return null;
  }

});
