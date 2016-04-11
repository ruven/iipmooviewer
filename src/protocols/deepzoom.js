/* DeepZoom Protocol Handler
 */

Protocols.DeepZoom = new Class({

    /* Return metadata URL
     */
    getMetaDataURL: function (server, image) {
        return server + image;
    },

    /* Return an individual tile request URL
     */
    getTileURL: function (t) {
        // Strip off the .dzi or .xml suffix from the image name
        var prefix = t.image.substr(0, t.image.lastIndexOf("."));
        var base = t.server + prefix + '_files/';

        return base + (t.resolution + 1) + '/' + t.x + '_' + t.y + this.suffix;
    },

    /* Parse a Deepzoom protocol metadata request
     */
    parseMetaData: function (response) {
        this.suffix = "." + /Format="(\w+)/.exec(response)[1];
        var ts = parseInt(/TileSize="(\d+)/.exec(response)[1]);
        var width = parseInt(/Width="(\d+)/.exec(response)[1]);
        var height = parseInt(/Height="(\d+)/.exec(response)[1]);

        // Number of resolutions is the ceiling of Log2(max)
        var max = Math.max(width, height);

	// We need to keep track of this for our thumbnail function
	this.tileSize = ts;

        var result = {
            max_size: {w: width, h: height},
            tileSize: {w: ts, h: ts},
            num_resolutions: Math.ceil(Math.log(max) / Math.LN2)
        };

        return result;
    },

    /* Return URL for a full view - not possible with Deepzoom
     */
    getRegionURL: function (server, image, region, w, h) {
        return null;
    },

    /* Return thumbnail URL
     */
    getThumbnailURL: function (server, image, width) {
        // Strip off the .dzi or .xml suffix from the image name
        var prefix = image.substr(0, image.lastIndexOf("."));

        // level 0 is 1x1 pixel ... find the level which just fits within a
        // tile
        var thumbLevel = Math.log(this.tileSize) / Math.LN2 - 1;

        return server + prefix + '_files/' + thumbLevel + '/0_0' + this.suffix;
    }
});
