/* Zoomify Protocol Handler
 */

Protocols.Zoomify = new Class({

  /* Return metadata URL
   */
  getMetaDataURL: function(server,image){
    return server + image + "/ImageProperties.xml";
  },

  /* Return an individual tile request URL
   */
  getTileURL: function(t){
    return t.server+t.image+"/TileGroup0/"+t.resolution+"-"+t.x+"-"+t.y+".jpg";
  },

  /* Parse a Zoomify protocol metadata request
   */
  parseMetaData: function(response){
    // Simply split the response as a string
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
  getRegionURL: function(server,image,region,w,h){
    return null;
  },

  /* Return thumbnail URL
   */
  getThumbnailURL: function(server,image,width){
    return server+image+'/TileGroup0/0-0-0.jpg';
  }

});
