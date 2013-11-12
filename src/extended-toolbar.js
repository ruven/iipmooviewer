/*
   IIPMooViewer 2.0 - Extended Toolbar Extension
   IIPImage Javascript Viewer <http://iipimage.sourceforge.net>

   Copyright (c) 2013 Massimo Brero <massimobrero@gmail.com>

   ---------------------------------------------------------------------------
   This file is part of IIPMooViewer 2.0 (hereinafter referred to as 'this program').

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program. If not, see <http://www.gnu.org/licenses/>
   ---------------------------------------------------------------------------

*/

/** Extends IIPMooViewer with a modular toolbar to provide user-friendly access to most options.
* @param {String} toolbarId : id of the HTML 'div' of the toolbar.
* @param {String} position : choice is 'inside' or 'outside'. Default is 'inside'.
*        Specifies if the toolbar appears 
*          inside the viewer (= on top of it), or
*		   outside the viewer (=next/above of it, depending on the orientation).
* @param {String} orientation : choice is 'vertical' or 'horizontal'.
* @param {String[]} buttons : Array of strings
*/
IIPMooViewer.implement({
  createExtendedToolbar: function(toolbarId, position, orientation, buttons){
    var _thisIIP = this; // local reference to 'this'
	// Get a reference to the original toolbar - an HTML div must exists
	var toolbar = document.getElementById(toolbarId);

	if ( (typeof(toolbar)==='undefined') ||  (toolbar == null)  ) {
		var msg = "IIPMooViewer Extended Toolbar creation error :\nNo element ID given to IIPMooViewer createExtendedToolbar\(\) or\nInvalide id.\nThe toolbar will not be available.";
		alert( msg );
		return;
	}
	
	position = position || 'inside';
	if (typeof(orientation)==='undefined') orientation = 'horizontal';
	if (typeof(buttons)==='undefined') buttons = ['rotateanticlockwise', 'rotateclockwise', 'toggleNavigationWindow', 'getRegionalURL', 'zoomIn', 'zoomOut', 'reset', 'toggleFullscreen'];
	
	// To suppress duplicate entries, keeping only the first occurence.
	buttons = buttons.filter(function(elem, pos) {
		return buttons.indexOf(elem) == pos;
	})

	/* Create the extended toolbar buttons for every valid array entry.
	 * Non existing options (malformed array entries) or meaningless buttons
	 * (i.e. toggleAnnotations if the annotation extension is not loaded)
	 * are ignored and therefor not created.
	 */
	for (var i=0;i<buttons.length;i++) {
		switch (buttons[i]) {
			case 'newAnnotation':
				// Test if 'initAnnotationTips' from 'annotations-js'
				// and 'newAnnotation' from 'annotations-edit.js' are set.
				// If not, the button is not created.
				if ( (typeof(_thisIIP.initAnnotationTips)=="function") && (typeof(_thisIIP.newAnnotation)=="function") ) {
					this.rectangleannotationbutton=new Element('img',{'title':'Simple annotation','class':'toolButton','src':'images/extended-toolbar/Inkscape/Inkscape_icons_draw_rectangle.svg'}).inject(toolbar);//Create Rectangle Tool
					this.rectangleannotationbutton.addEvents({'click':function(){
						_thisIIP.newAnnotation();
					}});
				} else {
					alert("Toolbar warning : '" + buttons[i] + "'. Cannot set this button if 'annotations.js' and 'annotations-edit.js' extensions are not loaded. Ignored.");
				}
				break;
			case 'fakeDrawNewAnnotation':
				this.drawrectangleannotationbutton=new Element('img',{'title':IIPMooViewer.lang['annotButtonInactive'],'class':'toolButton','src':'images/extended-toolbar/Inkscape/Inkscape_icons_draw_rectangle.svg'}).inject(toolbar);//Create Rectangle Tool
				this.drawrectangleannotationbutton.addClass("requireAuthentication");
				this.drawrectangleannotationbutton.addEvents({'click':function(e){
					alert(IIPMooViewer.lang['alertCantEdit']);
				}});
			case 'drawNewAnnotation':
				// Test if 'initAnnotationTips' from 'annotations-js' and 'newAnnotation' from 'annotations-edit.js' are set.
				// If not, the button is not created.
				if ( (typeof(_thisIIP.initAnnotationTips)=="function") && (typeof(_thisIIP.newAnnotation)=="function") && (typeof(_thisIIP.drawNewAnnotation)=="function") ) {
					this.drawrectangleannotationbutton=new Element('img',{'title':IIPMooViewer.lang['annotButton'],'class':'toolButton','src':'images/extended-toolbar/Inkscape/Inkscape_icons_draw_rectangle.svg'}).inject(toolbar);//Create Rectangle Tool
					this.drawrectangleannotationbutton.addEvents({'click':function(e){
						// e.stopPropagation();
						if ( _thisIIP.drawrectangleannotationbutton.hasClass("toolbarButtonSelected") ) {
							_thisIIP.fireEvent('newAnnotationCancel');
							_thisIIP.drawrectangleannotationbutton.removeClass("toolbarButtonSelected");
						} else {
							_thisIIP.drawrectangleannotationbutton.addClass("toolbarButtonSelected");
							_thisIIP.drawNewAnnotation();
						}
					}});
				} else {
					alert("Toolbar warning : '" + buttons[i] + "'. Cannot set this button if 'annotations.js' and 'annotations-edit.js' extensions are not loaded. Ignored.");
				}
				break;
			case 'rotateclockwise':
				this.rotateclockwisebutton=new Element('img',{'title':IIPMooViewer.lang['rotateClockwise'],'class':'toolButton','src':'images/extended-toolbar/Inkscape/Inkscape_icons_object_rotate_right.svg'}).inject(toolbar);//Image Button
				this.rotateclockwisebutton.addEvents({'click':function(){
					_thisIIP.rotate( _thisIIP.view.rotation + 90);
				}});
				break;
			case 'rotateanticlockwise':
				this.rotateanticlockwisebutton=new Element('img',{'title':IIPMooViewer.lang['rotateAnticlockwise'],'class':'toolButton','src':'images/extended-toolbar/Inkscape/Inkscape_icons_object_rotate_left.svg'}).inject(toolbar);//Image Button
				this.rotateanticlockwisebutton.addEvents({'click':function(){
					_thisIIP.rotate( _thisIIP.view.rotation - 90);		
				}});
				break;
			case 'toggleNavigationWindow':
				if ( ( _thisIIP.navigation ) || ( _thisIIP.credit ) ) {
					this.toggleNavigationWindowButton=new Element('img',{'title':IIPMooViewer.lang['toggleNavWindow'],'class':'toolButton','src':'images/extended-toolbar/11971143101886773363mozart_ar_wind_rose_compas.svg'}).inject(toolbar); //http://www.clker.com/clipart-14845.html
					this.toggleNavigationWindowButton.addEvents({'click':function(){
						if( _thisIIP.navigation ) _thisIIP.navigation.toggleWindow();
						if( _thisIIP.credit ) _thisIIP.container.getElement('div.credit').get('reveal').toggle();

						var visible = 'images/extended-toolbar/11971143101886773363mozart_ar_wind_rose_compas.svg';
						var hidden  = 'images/extended-toolbar/mozart_ar_wind_rose_compas_NO_width80_reverse.svg';
						if (Browser.firefox && this.src.indexOf(visible) !== -1 ) {
							this.src = hidden;
						} else if (Browser.firefox && this.src.indexOf(hidden) !== -1 ) {
							this.src = visible;
						} else {
							if (_thisIIP.toggleNavigationWindowButton.hasClass("toolbarButtonSelected") ) {
								_thisIIP.toggleNavigationWindowButton.removeClass("toolbarButtonSelected");
							} else { 
								_thisIIP.toggleNavigationWindowButton.addClass("toolbarButtonSelected");
							}
						}
					}});
				} else {
					alert("Toolbar warning : '" + buttons[i] + "'. Cannot set this button if 'navigation.js' is not loaded or if IIPMooViewer 'credit' argument is not set. Ignored.");
					break;
				}
				if (!_thisIIP.navigation ) {
					alert("Toolbar info : '" + buttons[i] + "' will not show/hide the navigation window because 'navigation.js' is not loaded.");
				}				
				if (!_thisIIP.credit ) {
					alert("Toolbar info : '" + buttons[i] + "' will not show/hide the credit because IIPMooViewer 'credit' argument is not set.");
				}
				break;
			case 'toggleAnnotations':
				if ( typeof(_thisIIP.initAnnotationTips)=="function" ) {
						this.toggleAnnotationsButton=new Element('img',{'title':IIPMooViewer.lang['toggleAnnotations'],'class':'toolButton','src':'images/extended-toolbar/Inkscape/Inkscape_icons_object_visible.svg'}).inject(toolbar);// // icone from Picol
						this.toggleAnnotationsButton.addEvents({'click':function(){
							_thisIIP.toggleAnnotations();
							var visible = 'images/extended-toolbar/Inkscape/Inkscape_icons_object_visible.svg';
							var hidden  = 'images/extended-toolbar/Inkscape/Inkscape_icons_object_hidden.svg';
							if (Browser.firefox && this.src.indexOf(visible) !== -1 ) {
								this.src = hidden;
							} else if (Browser.firefox && this.src.indexOf(hidden) !== -1 ) {
								this.src = visible;
							} else {
								if (_thisIIP.toggleAnnotationsButton.hasClass("toolbarButtonSelected") ) {
									_thisIIP.toggleAnnotationsButton.removeClass("toolbarButtonSelected");
								} else {
									_thisIIP.toggleAnnotationsButton.addClass("toolbarButtonSelected");
								}
							}
						}});
				} else {
					alert("Toolbar warning : '" + buttons[i] + "'. Cannot set this button if 'annotations.js' extension is not loaded. Ignored.");
				}
				break;
			case 'getRegionalURL':
				this.getRegionalURLButton=new Element('img',{'title':IIPMooViewer.lang['exportView'],'class':'toolButton','src':'images/extended-toolbar/Inkscape/Inkscape_icons_selection_make_bitmap_copy.svg'}).inject(toolbar);
				this.getRegionalURLButton.addEvents({'click':function(){
					window.open(_thisIIP.getRegionURL());
				}});
				break;
			case 'zoomIn':
				this.zoomInButton=new Element('img',{'title':IIPMooViewer.lang['zoomIn'],'class':'toolButton','src':'images/extended-toolbar/Inkscape/Inkscape_icons_zoom_in.svg'}).inject(toolbar);
				this.zoomInButton.addEvents({'click':function(){
					_thisIIP.zoomIn();
				}});
				break;
			case 'zoomOut':
				this.zoomInButton=new Element('img',{'title':IIPMooViewer.lang['zoomOut'],'class':'toolButton','src':'images/extended-toolbar/Inkscape/Inkscape_icons_zoom_out.svg'}).inject(toolbar);//Image Button
				this.zoomInButton.addEvents({'click':function(){
					_thisIIP.zoomOut();
				}});
				break;
			case 'reset':
				this.resetButton=new Element('img',{'title':IIPMooViewer.lang['resetView'],'class':'toolButton','src':'images/reset.svg'}).inject(toolbar);//Image Button
				this.resetButton.addEvents({'click':function(){
					_thisIIP.reload();
				}});
				break;
			case 'toggleFullscreen':
				this.toggleFullscreenButton=new Element('img',{'title':IIPMooViewer.lang['toggleFullscreen'],'class':'toolButton','src':'images/extended-toolbar/Inkscape/Inkscape_icons_view_fullscreen.svg'}).inject(toolbar);
				this.toggleFullscreenButton.addEvents({'click':function(){
					if(!IIPMooViewer.sync) _thisIIP.toggleFullScreen();
				}});
				break;
		   default:
				alert("Toolbar warning : '" + buttons[i] + "' is not a valid button. Ignored.");
				break;
		}
	}

	
	// Set the extended toolbar style with CSS class according to
	// the position and the orientation. Default is 'inside' and 'horizontal'.
	if (  (orientation == 'vertical') && (position == 'inside')  ){
		toolbar.addClass("innerVerticalToolbar");
	} else if (  (orientation == 'horizontal') && (position == 'inside')  ){
		toolbar.addClass("innerHorizontalToolbar");
	} else if (  (orientation == 'vertical') && (position == 'outside')  ){
		toolbar.addClass("outerVerticalToolbar");
		// Shifts the viewer (left) to fit the toolbar without overlapping
		var left = toolbar.getStyle('width').toInt() + $(_thisIIP.source).getStyle('left').toInt();
		left = left + 'px';
		$(_thisIIP.source).setStyle('left', left);
	} else if (  (orientation == 'horizontal') && (position == 'outside')  ){
		toolbar.addClass("outerHorizontalToolbar");
		// Shifts the viewer (top) to fit the toolbar without overlapping
		var top = toolbar.getStyle('height').toInt() + ($(_thisIIP.source).getStyle('top')).toInt();
		top = top + 'px';
		$(_thisIIP.source).setStyle('top', top);
	}
	toolbar.addClass("extendedToolbar");
  }
})