/* DeepZoom Protocol Handler
 */

Protocols.DeepZoom = new Class({

  /* Return metadata URL
   */
  getMetaDataURL: function(server,image){
    return server + image + ".dzi";
  },

  /* Return an individual tile request URL
   */
  getTileURL: function(server,image,resolution,sds,contrast,k,x,y){
    return server+image+'_files/'+(resolution+1)+'/'+x+'_'+y+'.jpg';
  },

  /* Parse a Deepzoom protocol metadata request
   */
  parseMetaData: function(response){
    var ts = parseInt( /TileSize="(\d+)/.exec(response)[1] );
    var w = parseInt( /Width="(\d+)/.exec(response)[1] );
    var h = parseInt( /Height="(\d+)/.exec(response)[1] );
    // Number of resolutions is the ceiling of Log2(max)
    var max = (w>h)? w : h;
    var result = {
      'max_size': { w: w, h: h },
      'tileSize': { w: ts, h: ts },
      'num_resolutions': Math.ceil( Math.log(max)/Math.LN2 )
    };
    return result;
  },

  /* Return URL for a full view - not possible with Deepzoom
   */
  getRegionURL: function(server,image,region,w){
    return null;
  },

  /* Return thumbnail URL
   */
  getThumbnailURL: function(server,image,width){
    return server+image+'_files/0/0_0.jpg';
  }

});
