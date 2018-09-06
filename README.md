IIPMooViewer
============


About
-----
IIPMooViewer is a high performance light-weight HTML5 Ajax-based javascript image streaming and zooming client designed for the IIPImage high resolution imaging system. It is compatible with Firefox, Chrome, Internet Explorer (Versions 6-10), Safari and Opera as well as mobile touch-based browsers for iOS and Android. Although designed for use with the IIP protocol and IIPImage, it has multi-protocol support and is additionally compatible with the Zoomify, Deepzoom, Djatoka (OpenURL) and IIIF protocols.

Version 2.0 of IIPMooViewer is HTML5/CSS3 based and uses the Mootools javascript framework (version 1.5+). 


Features
--------
* Fast and light-weight
* Pan and zoom of ultra high resolution imaging
* Multi-protocol support: IIP, Zoomify, Deepzoom, Djatoka (OpenURL) and IIIF protocols
* Image rotation
* Mobile device support: iOS and Android
* HTML5 Fullscreen API support
* Annotations of regions of images
* Synchronized viewer capability
* Image blending comparison
* Localization


Installation
------------
The distribution contains all the necessary library files in both compressed and uncompressed formats. Modify the parameters in the index.html template example file provided.


Server
------
You first must have a working version of the IIPImage server running if you want to use the IIP protocol and features. See http://iipimage.sourceforge.net for details. IIPMooViewer, however, also supports the IIIF protocol if you have an IIIF server, or the Zoomify and Deepzoom protocols if you are unable to install the server or are working in a legacy environment.


Images
------
Create a pyramidal tiled TIFF image using VIPS (http://vips.sf.net) or 
imagemagick. Or JPEG2000 if you have a JPEG2000 enabled IIPImage server.


Configuration
-------------
Now modify the path and image names in the example HTML page provided - index.html - to create a working client :-)
<pre>
    var iipmooviewer = new IIPMooViewer( "viewer", {
	  image: "/path/to/image.tif",
	  credit: "My Title"
    });
</pre>

Note that IIPMooViewer works best when it's in its own page. If you wish to embed it in a page, you may specify any div within your page or alternatively use an `<iframe>` if you wish to keep the IIPMooViewer code separate. Note that to enable fullscreen when using an `<iframe>`, add the `allowFullScreen` attribute to the `<iframe>` tag.

Distribution
------------
/js : the necessary minified iipmooviewer and mootools javascript files

/css : iip.css and ie.css (for Internet Explorer)

/images : icons and image files

/src : uncompressed source javascript files

The minified files are created with the [closure compiler](https://developers.google.com/closure/compiler/) with the following command:
<pre>
java -jar /path/to/compiler.jar --js src/mootools-more-1.6.0.js --js src/iipmooviewer-2.0.js --js src/navigation.js --js src/scale.js --js src/touch.js --js src/protocols/iip.js --js src/annotations.js --js src/blending.js --js src/lang/help.en.js --js_output_file js/iipmooviewer-2.0-min.js --compilation_level SIMPLE_OPTIMIZATIONS
</pre>

You can thereby customize your build to include only those components you need. For example, if you require Zoomify or do not require annotation support, simply add or remove these from the build. Make sure, however, that the core iipmooviewer js file is included before the other components. Otherwise, if you prefer not to rebuild, use the default build and add the extra components you want as extra includes.


Options
-------

Options to the IIPMooViewer class constructor: (The only obligatory 
option is the <b>image</b> variable)

<b>image</b> : The full system path to the image. On Windows as on other systems this 
       should be a UNIX style path such as "/path/to/image.tif". Note that this is an
       absolute system path and not the path relative to the webserver root

<b>server</b> : The address of the IIPImage server. [default: "/fcgi-bin/iipsrv.fcgi"]

<b>credit</b> : a credit, copyright or information to be shown on the image itself

<b>render</b> : the way in which tiles are rendered. Either `random' where the 
        tiles are fetched and rendered randomly or 'spiral' where the 
        tiles are rendered from the center outwards [default: "spiral"]

<b>showNavWindow</b> : whether to show the navigation window. [default: true]

<b>showNavButtons</b> : whether to show the navigation buttons on start up: true 
        or false [default: true]

<b>navWinSize</b> : ratio of navigation window size to the main window.
	Wide panoramas are scaled to twice this size [default: 0.2]

<b>navigation</b> : a hash containing options for the navigation box:
   (a) id: the id of the element where the navigation box will be embedded. Defaults to the main container.
   (b) draggable: a boolean, indicating whether the navigation box is draggable. Defaults to true, however, if a navigation id is specified, defaults to false.
   (c) buttons: an array of the available buttons: reset, zoomIn, zoomOut, rotateLeft, rotateRight. The default is the following:
<pre>
  navigation: {
    draggable: true,
    buttons: ['reset','zoomIn','zoomOut']
  }
</pre>

<b>showCoords</b> : whether to show live screen coordinates [default: false]

<b>scale</b> : adds a scale to the image. Specify the number of pixels per units. Should be given in pixels per mm if the default meter unit is used. Otherwise pixels per degree if degree units are used.

<b>units</b> : define the units used. Can be in degrees or meters [default: meters]. Or define completely new unit system. The default structure is the following:
<pre>
  units: {
    dims:   ["pm", "nm", "&#181;m", "mm", "cm", "m", "km"], // Unit suffixes
    orders: [ 1e-12, 1e-9, 1e-6, 0.001, 0.01, 1, 1000 ],    // Unit orders
    mults: [1,2,5,10,50,100],                               // Different scalings usable for each unit
    factor: 1000                                            // Default multiplication factor
  }
</pre>

<b>prefix</b>: path prefix if image subdirectory moved (for example to a different host) [default: "images/"]

<b>enableFullscreen</b> : allow full screen mode. If "native" will attempt to use Javascript Fullscreen API. Otherwise it will fill the viewport. "page" allows fullscreen but only in viewport fill mode. False disables. [default: "native"]

<b>winResize</b> : whether view is reflowed on window resize. [default: true]

<b>viewport</b> : object containing center x, y, resolution, rotation and contrast of initial view. For example, to 
start 
at resolution 4 with the center of the view port at both 90% of the size of the image:
<pre>{resolution:4, x:0.9, y:0.9, rotation:0}</pre>

<b>protocol</b> : protocol to use with the server: iip, zoomify, deepzoom or iiif [default: "iip"]

<b>preload</b> : preload an extra layer of tiles surrounding the viewport [default: false]

<b>disableHash</b> : disable setting viewport through the hashchange event. See the section "Linking to a Specific View" below [default: enabled]

<b>annotations</b> : An object containing object structures with parameters "x", "y", "w", "h", "title", "text", "category" where x, y, w and h are the position and size of the annotation in relative [0-1] values, title is an optional title for the annotation, category is an optional category for the annotation and text is the body of the annotation


Public Functions
----------------

<b>getRegionURL()</b>: If using the default IIP protocol, this functions returns the IIPImage server URL needed to export the region of the image within the view port as a single image. Thus, to export the current view, call this function and use the result as the source of an image. This example exports, when the user presses the "p" key, the view into a new window which can then be saved as a whole image.
<pre>
    window.addEvent('keypress', function(e){
      if( e.key == "p" ) window.open(iipmooviewer.getRegionURL());
    });
</pre>

<b>rotate(x)</b>: Rotate the view by <i>x</i> degrees

<b>moveTo(x,y)</b>: Move the view to position <i>x</i>,<i>y</i> at the current resolution, where x,y are the coordinates of the top left of the view port.

<b>centerTo(x,y)</b>: Center the view at relative position <i>x</i>,<i>y</i> at the current resolution, where x,y are resolution independent 
coordinate ratios (0.0 -> 1.0 ) of the center of the view port.

<b>zoomIn()</b>: Zoom in by a factor of 2

<b>zoomOut()</b>: Zoom out by a factor of 2

<b>zoomTo(z)</b>: Zoom to a particular resolution, <i>z</i>

<b>setCredit(t)</b>: (Re)set the text in credits to the HTML given by <i>t</i>

<b>recenter()</b>: Center our view

<b>reload()</b>: Reinitialize our view, using the initial viewport settings if given during class initialization

<b>changeImage(i)</b>: Load a new image, <i>i</i>, and reinitialize the viewer

<b>toggleNavigationWindow()</b>: toggle the navigation window

<b>toggleFullScreen()</b>: toggle fullscreen mode

<b>toggleAnnotations()</b>: toggle display of annotations

<b>print()</b>: print current image view

Annotations
-----------
You can supply a list of annotations for the image which will be overlaid while
navigating the image. These must be supplied in an object containing a list of
individual annotation objects, each with parameters describing the size,
position, title, category and text. The size is set by the w,h properties, and
the position is described by the x,y properties (top-left offset). The size and
position (obligatory) parameters are ratios (i.e go from `0.0` to `1.0`) of the
image's dimensions. The `text` parameter provides the content of the annotation
and can contain any valid HTML, which can be styled normally via CSS. All
annotations are created as divs of class `annotation`.

For example:
<pre>
  var annotations = {
     1: { x: 0.7, y: 0.6, w: 0.2, h: 0.18, category: "pigments", text: "prussian blue" },
     2: { x: 0.1, y: 0.8, w: 0.15, h: 0.1, category: "pigments", text: "azurite" },
     3: { x: 0.7, y: 0.4, w: 0.1, h: 0.1, category: "people", text: "Mary" }
  };
</pre>

The 1,2,3 are unique IDs which can be either numbers or strings.
The created element's ID is the annotation's ID with `annotation-` prepended.

Categories are ways of creating groups of annotations and the category will be added to the class. Thus for a category of, for example, 'retouches' the annotation divs will be of class 'annotation retouches', allowing you to access these via a class selector. So, for example, to set the colors of these differently to the others, simply with javascript, use a selector:
<pre>
$$('.annotation.retouches').setStyle('borderColor', "blue")
</pre>

or in CSS:
<pre>
.annotation.retouches{
  border-color: blue;
}
</pre>

Annotation editing is possible by including the `annotations-edit.js` file, which extends the `IIPMooViewer` class. The function `newAnnotation()` creates a new blank annotation in the centre of the view. Double click on any existing annotation to move, resize of modify it. When an update occurs, an `annotationChange` event occurs, which can be captured and used to send the results back to a server via an AJAX call.

For example, to send the updated list of annotations back to `annotations.php`:

<pre>
  iipmooviewer.addEvent('annotationChange', function(action, annotation_id) {
    var data = {id: annotation_id, action: action};
    // `action` is either `updated` or `deleted`
    if (action == 'updated') {
      // If the annotation has been updated, send the updated data.
      data.annotation = JSON.encode(this.annotations[annotation_id]);
    }
    var metadata = new Request.JSON({
      method: 'post',
      url: 'annotations.php',
      data: data
    }).send();
  });
</pre>


Synchronized Views
------------------
It is possible to synchronize two or more instances of iipmooviewer, so that they will zoom, pan and rotate at the same time. To do this, simply create your viewers and synchronize them together using the IIPMooViewer.synchronize() function, which takes an array of viewer instances. For example:

<pre>
  // Create viewers
  var viewer1 = new IIPMooViewer( "viewer1", {
    image: 'image1.tif'
  });
  var viewer2 = new IIPMooViewer( "viewer2", {
    image: 'image2.tif',
    showNavWindow: false, // Only show navigation window on first viewer
    showNavButtons: false
  });

  // Synchronize our viewers
  IIPMooViewer.synchronize([viewer2,viewer1]);
</pre>


Events
------
IIPMooViewer fires the 'load' event when it has fully finished loading. To attach to this event, use the addEvent function:
<pre>
	iipmooviewer.addEvent('load', function(){
		// do something
	});
</pre>


Protocols
---------
IIPMooViewer supports the IIP, Zoomify, Deepzoom, Djatoka and IIIF protocols. By default it will use IIP, but to use, for example Zoomify, first include the protocol after the other javascript includes as this is not included by default:

<pre>
  &lt;script src="src/protocols/zoomify.js"&gt;&lt;/script&gt;
</pre>

Protocols such as zoomify don't have a server as such, so set this value to / or to the path prefix for the image. For example, if you have an image with URL /images/zoomify/image1, use:

<pre>
new IIPMooViewer( "viewer", {
   server: "/images/zoomify/",
   image: "image1",
   protocol: "zoomify"
});
</pre>

Note that for Deepzoom, the image name should be name of the .dzi or .xml Deepzoom index file.

Localization
------------
A number of localizations exist in the src/lang folder. To use, simply include the desired language file as an extra javascript include. To create a new localization, create a new or modify an existing localization file and include this extra javascript file.

For example to create a new Chinese localization, create the file lang/help.zh.js and include it after the main iipmooviewer includes:

<pre>
  &lt;script src="javascript/mootools-core-1.6.0-compressed.js"&gt;&lt;/script&gt;
  &lt;script src="javascript/iipmooviewer-2.0-compressed.js"&gt;&lt;/script&gt;
  &lt;script src="src/lang/help.zh.js"&gt;&lt;/script&gt;
</pre>

Image Blending
--------------
It's also possible to load several images for comparison and dynamically blend between them to compare. This is useful, for example, for comparing scientific imagery of the same scene or object. Images should be of the same size and registered. The blending component is in src/blending.js, but is built by default into the main compressed iipmooviewer js file in the javascript/ folder. To use, simply load the the viewer as normal with the default image, but use the blend() function to provide a list of all images and text for use in the selection box. For eample:

<pre>
var iipmooviewer = new IIPMooViewer( "targetframe", {
  image: 'color.tif',
  credit: 'Compare scientific images'
});

iipmooviewer.blend( [ ['color.tif','color'],
                      ['uv.tif','ultra-violet'],
                      ['ir.tif','infra-red'],
                      ['xray.tif','X-ray']
                    ] );
</pre>


Linking to a Specific View
--------------------------
A hash tag in the form x, y, resolution can be appended to the URL to 
link to a particular area within the image at a particular resolution. 
x and y should be resolution-independent ratios from 0.0 -> 1.0 and the resolution an integer representing the desired resolution 
number (where 0 is the smallest resolution).
For example:
<pre>http://your.server/iipmooviewer/test.html#0.5,0.5,5</pre> 
will set the initial view of the image to the x,y coordinate 0.5, 0.5 (the center of the image) at resolution number 5.

The <i>hashchange</i> event is also used if supported by the browser to update the view if the coordinates change. This can be used, for example, to 
maintain a sequence or history of view changes.

Use control-c in order to obtain the tagged URL of the current view.

To disable this feature, add "disableHash: true" to the constructor.


Styling
-------
It is possible to restyle widgets such as the credit information box. Simply create your own CSS rule to override the default rule for:
<pre>.iipmooviewer .credit</pre>
to change the font, background or borders etc.


Gallery
-------
If you have a series of images, it's possible to use IIPMooViewer within an image gallery. A Gallery component is available in src/gallery.js with a minified version in js/gallery.min.js. This provides a light-weight, ergonomic and fully responsive gallery component which is mobile-friendly and fully touch-enabled. The input list of images can be provided either as a JSON object within your HTML itself or via an Ajax request.

To use the gallery component, make sure you include both the gallery CSS and JS files:

<pre>
  &lt;link rel="stylesheet" type="text/css" media="all" href="css/gallery.min.css" /&gt;
  &lt;script src="js/gallery.min.js"&gt;&lt;/script&gt;
</pre>

To create the component, simply create an instance of the class with the URL of your JSON.

<pre>
  &lt;script&gt;
    // Create our image gallery and load our list of images from JSON 
    new Gallery( "targetframe", {
      images: "gallery.json"
    });
  &lt;/script&gt;
</pre>

The list of images should be structured as an array as in the following example:
<pre>
  [
     {
       image: "/path/image1.tif",
       caption: "caption 1",
       title: "Title 1",
       scale: 20.0,
       server: "/fcgi-bin/iipsrv.fcgi"
     },
     {
       image: "/path/image2.tif",
       caption: "caption 2",
       title: "Title 2",
       scale: 10.0,
       server: "/fcgi-bin/iipsrv.fcgi"
     }
  ];
</pre>

The "image" parameter is mandatory, otherwise all other parameters are optional. If "server" is not set, the default IIPImage server path /fcgi-bin/iipsrv.fcgi is used. The caption field, if provided, will be overlaid on the viewer, whereas the title field, if given, provides a tooltip when the mouse is over the image. The scale option is a value for the scale for the given image in pixels/mm and is used in the same way as a scale given to IIPMooViewer directly. An example HTML template is provided in the provided gallery.html.


Licensing
---------
iipmooviewer is released under the GNU General Public License (GPL). See the copyright notice COPYING in this directory for licensing details or go to 
http://www.gnu.org/licenses/gpl.html for more details.


------------------------------------------------------------------------------------
Please refer to the project site http://iipimage.sourceforge.net for further details

------------------------------------------------------------------------------------

<pre>(c) 2007-2018 Ruven Pillay <ruven@users.sourceforge.net></pre>
