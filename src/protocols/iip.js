/* IIP Protocol Handler
 */

Protocols.IIP = new Class({

  /* Return metadata URL
   */
  getMetaDataURL: function(image){
    return "FIF=" + image + "&obj=IIP,1.0&obj=Max-size&obj=Tile-size&obj=Resolution-number";
  },

  /* Return an individual tile request URL
   */
  getTileURL: function(server,image,resolution,sds,contrast,k,x,y){
    return server+"?FIF="+image+"&CNT="+contrast+"&SDS="+sds+"&JTL="+resolution+"," + k;	
  },

  /* Parse an IIP protocol metadata request
   */
  parseMetaData: function(response){
    var tmp = response.split( "Max-size" );
    if(!tmp[1]) alert( "Error: Unexpected response from server " + this.server );
    var size = tmp[1].split(" ");
    var max_size = { w: parseInt(size[0].substring(1,size[0].length)),
		     h: parseInt(size[1]) };
    tmp = response.split( "Tile-size" );
    size = tmp[1].split(" ");
    var tileSize = { w: parseInt(size[0].substring(1,size[0].length)),
		     h: parseInt(size[1]) };
    tmp = response.split( "Resolution-number" );
    var num_resolutions = parseInt( tmp[1].substring(1,tmp[1].length) );
    var result = {
      'max_size': max_size,
      'tileSize': tileSize,
      'num_resolutions': num_resolutions
    };
    return result;
  },

  /* Return URL for a full view
   */
  getRegionURL: function(image,x,y,w,h){
    var rgn = x + ',' + y + ',' + w + ',' + h;
    return '?FIF='+image+'&WID='+w+'&RGN='+rgn+'&CVT=jpeg';
  },

  /* Return thumbnail URL
   */
  getThumbnailURL: function(server,image,width){
    return server+'?FIF='+image+'&WID='+width+'&QLT=98&CVT=jpeg';
  }

});


