/* IIP Protocol Handler
 */

Protocols.IIP = new Class({

  /* Return metadata URL
   */
  getMetaDataURL: function(server,image){
    var url = server+"?FIF=" + image + "&obj=IIP,1.0&obj=Max-size&obj=Tile-size&obj=Resolution-number";
    if( this.ask_resolutions ) url += '&obj=Resolutions';
    return url;
  },

  /* Return an individual tile request URL
   */
  getTileURL: function(t){
    var modifiers = Array( '?FIF=' + t.image );
    if( t.contrast ) modifiers.push( 'CNT=' + t.contrast );
    if( t.sds )      modifiers.push( 'SDS=' + t.sds );
    if( t.rotation ) modifiers.push( 'ROT=' + t.rotation );
    if( t.gamma )    modifiers.push( 'GAM=' + t.gamma );
    if( t.shade )    modifiers.push( 'SHD=' + t.shade + ",30" );
    modifiers.push( 'JTL=' + t.resolution + ',' + t.tileindex );
    return t.server+modifiers.join('&');
  },

  /* Parse an IIP protocol metadata request
   */
  parseMetaData: function(response){
    var tmp = response.split( "Max-size" );
    if(!tmp[1]) return null;
    var size = tmp[1].split(" ");
    var max_size = { w: parseInt(size[0].substring(1,size[0].length)),
		     h: parseInt(size[1]) };
    tmp = response.split( "Tile-size" );
    if(!tmp[1]) return null;
    size = tmp[1].split(" ");
    var tileSize = { w: parseInt(size[0].substring(1,size[0].length)),
		     h: parseInt(size[1]) };
    tmp = response.split( "Resolution-number" );
    var num_resolutions = parseInt( tmp[1].substring(1,tmp[1].length) );

    // Create our result object
    var result = {
      'max_size': max_size,
      'tileSize': tileSize,
      'num_resolutions': num_resolutions
    };

    // Get our list of exact resolutions if our server is capable
    if( this.ask_resolutions ){
      tmp = response.split( 'Resolutions' );
      tmp = tmp[1].substring(1,tmp[1].length);
      var tmp2 = tmp.split(',');
      var resolutions = new Array();
      for( var i=0; i<tmp2.length; i++ ){
	var s = tmp2[i].split(' ');
	resolutions.push({w: parseInt(s[0]), h: parseInt(s[1])});
      }
      if( resolutions.length==num_resolutions ) result.resolutions = resolutions;
    }

    return result;
  },

  /* Return URL for a full view
   */
  getRegionURL: function(server,image,region,width,height){
    var rgn = region.x + ',' + region.y + ',' + region.w + ',' + region.h;
    var size = '';
    if( width ) size += '&WID='+width;
    if( height ) size += '&HEI='+height;
    return server+'?FIF='+image+size+'&RGN='+rgn+'&CVT=jpeg';
  },

  /* Return thumbnail URL
   */
  getThumbnailURL: function(server,image,width){
    return server+'?FIF='+image+'&WID='+width+'&QLT=98&CVT=jpeg';
  }

});


