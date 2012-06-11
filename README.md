IIPMooViewer
============


About
-----
IIPMooViewer is a high performance light-weight HTML5 Ajax-based javascript image streaming and zooming client designed for the IIPImage high resolution imaging system. It is compatible with Firefox, Chrome, Internet Explorer (Versions 6-10), Safari and Opera as well as mobile touch-based browsers for iOS and Android. Although designed for use with the IIP protocol and IIPImage, it has multi-protocol support and is additionally compatible with the Zoomify and Deepzoom protocols.

Version 2.0 of IIPMooViewer is HTML5/CSS3 based and uses the Mootools javascript framework (version 1.4+). 


Features
--------
* Fast and light-weight
* Pan and zoom of ultra high resolution imaging
* Multi-protocol support: IIP, Zoomify and Deepzoom protocols
* Image rotation
* Mobile device support: iOS and Android
* HTML5 Fullscreen API support
* Annotations of regions of images
* Synchronized viewer capability


Installation
------------
The distribution contains all the necessary library files in both compressed and uncompressed formats. Modify the parameters in the index.html template example file provided.


Server
------
You first must have a working version of the IIPImage server running if you want to use the IIP protocol and features. See http://iipimage.sourceforge.net for details. IIPMooViewer, however, also supports the Zoomify and Deepzoom protocols if you are unable to install the server or are working in a legacy environment.


Images
------
Create a pyramidal tiled TIFF image using VIPS (http://vips.sf.net) or 
imagemagick. Or JPEG2000 if you have a JPEG2000 enabled IIPImage server.


Configuration
-------------
Now modify the path and image names in the example HTML page provided - index.html to create a working client :-)
<pre>
    var iipmooviewer = new IIPMooViewer( "viewer", {
	  image: "/path/to/image.tif",
	  credit: "My Title"
    });
</pre>


Distribution
------------
/javascript : the necessary minified iipmooviewer and mootools javascript files

/css : iip.css and ie.css (for Internet Explorer)

/images : icons and image files

/src : uncompressed source javascript files

Minified files are created with the closer compiler (https://developers.google.com/closure/compiler/) with the following command:
<pre>
java -jar /path/to/compiler.jar --js src/iipmooviewer-2.0.js src/protocols/iip.js src/protocols/zoomify.js src/protocols/deepzoom.js src/annotations.js src/lang/help.en.js --js_output_file javascript/iipmooviewer-2.0-compressed.js --compilation_level SIMPLE_OPTIMIZATIONS
</pre>

You can thereby customize your build to include only those components you need. For example, if you do not require Zoomify or annotation support, simply remove these from the build. Make sure, however, that the core iipmooviewer js file is included before the other components.


Options
-------

Options to the IIPMooViewer class constructor: (The only obligatory 
option is the <b>image</b> variable)

<b>image</b> : The full system path to the image. On Windows as on other systems this 
       should be a UNIX style path such as "/path/to/image.tif". Note that this is an
       absolute system path and not the path relative to the webserver root

<b>server</b> : The address of the IIPImage server. [default : "/fcgi-bin/iipsrv.fcgi"]

<b>credit</b> : a credit, copyright or information to be shown on the image itself

<b>render</b> : the way in which tiles are rendered. Either `random' where the 
        tiles are fetched and rendered randomly or 'spiral' where the 
        tiles are rendered from the center outwards [default : "spiral"]

<b>showNavWindow</b> : whether to show the navigation window. [default : true]

<b>showNavButtons</b> : whether to show the navigation buttons on start up: true 
        or false [default : true]

<b>navWinSize</b> : ratio of navigation window size to the main window.
	Wide panoramas are scaled to twice this size [default: 0.2]

<b>scale</b> : adds a scale to the image. Specify the number of pixels per mm

<b>prefix</b>: path prefix if image subdirectory moved (for example to a different host) [default "images/"]

<b>enableFullscreen</b> : allow full screen mode. If "native" will attempt to use Javascript Fullscreen API. Otherwise it will fill the viewport. "page" allows fullscreen but only in viewport fill mode. False disables. [default: "native"]

<b>winResize</b> : whether view is reflowed on window resize. [default: true]

<b>viewport</b> : object containing x, y, resolution, rotation and contrast of initial view. For example, to start at resolution 4 with the top left of the view port at both 90% of the size of the image:
<pre>{resolution:4, x:0.9, y:0.9, rotation:0}</pre>

<b>protocol</b> : protocol to use with the server: iip, zoomify or deepzoom [default: "iip"]

<b>preload</b> : preload an extra layer of tiles surrounding the viewport [default: false]

<b>annotations</b> : An array of annotations containing struct with parameters "x", "y", "w", "h", "title", "text", "category" where x, y, w and h are the position and size of the annotation in relative [0-1] values, title is an optional title for the annotation, category is an optional category for the annotation and text is the body of the annotation


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

<b>zoomIn()</b>: Zoom in by a factor of 2

<b>zoomOut()</b>: Zoom out by a factor of 2

<b>zoomTo(z)</b>: Zoom to a particular resolution, <i>z</i>

<b>setCredit(t)</b>: (Re)set the text in credits to the HTML given by <i>t</i>

<b>recenter()</b>: Center our view

<b>reload()</b>: Reinitialize our view, using the initial viewport settings if given during class initialization

<b>changeImage(i)</b>: Load a new image, <i>i</i>, and reinitialize the viewer

<b>toggleNavigationWindow()</b>: show/hide the navigation window

<b>toggleFullScreen()</b>: toggle fullscreen mode

<b>toggleAnnotations()</b>: toggle display of annotations


Annotations
-----------
x,y,w and h are obligatory parameters. The text parameter provides the content of the annotation and can contain any valid HTML, which can be styled normally via CSS. All annotations are created as divs of class "annotation".
The title and category parameters are optional. Categories are ways of creating groups of annotations and the category will be added to the class. Thus for a category of, for example, 'retouches' the annotation divs will be of class 'annotation retouches', allowing you to access these via a class selector. So, for example, to set the colors of these differently to the others, simply use a selector:
<pre>
$$('.annotation.retouches').setStyle('borderColor', "blue")
</pre>


Events
------
IIPMooViewer fires the 'load' event when it has fully finished loading. To attach to this event, use the addEvent function:
<pre>
	iipmooviewer.addEvent('load', function(){
		// do something
	});
</pre>


Localization
------------
To create a new localization, create a new or modify an existing localization file in /lang


------------------------------------------------------------------------------------
Please refer to the project site http://iipimage.sourceforge.net for further details

------------------------------------------------------------------------------------

<pre>(c) 2007-2012 Ruven Pillay <ruven@users.sourceforge.net></pre>

