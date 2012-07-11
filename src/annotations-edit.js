
/* Extend IIPMooViewer to handle annotations
 */
IIPMooViewer.implement({

  /* Create a new annotation, add it to our list and edit it
   */
  newAnnotation: function(){

    // Create new ID for annotation
    var id = String.uniqueID();

    // Create default annotation and insert into our annotation array
    var a = {
      id: id,
      x: (this.wid<this.view.w) ? 0.25 : (this.view.x+this.view.w/4)/this.wid,
      y: (this.hei<this.view.h) ? 0.25 : (this.view.y+this.view.h/4)/this.hei,
      w: (this.wid<this.view.w) ? 0.5 : (this.view.w/(2*this.wid)),
      h: (this.hei<this.view.h) ? 0.5 : (this.view.h/(2*this.hei)),
      category: '',
      title: '',
      text: ''
    };

    // Create an array if we don't have one and push a new annotation to it
    if( !this.annotations ) this.annotations = new Array();
    this.annotations.push(a);

    var _this = this;

    // Now draw the annotation
    var annotation = new Element('div', {
      'id': id,
      'class': 'annotation edit',
      'styles': {
        left: Math.round( a.x * this.wid ),
        top: Math.round( a.y * this.hei ),
	width: Math.round( a.w * this.wid ),
	height: Math.round( a.h * this.hei )
      }
    }).inject( this.canvas );

    this.editAnnotation( annotation );

  },



  /* Edit an existing annotation
   */
  editAnnotation: function(annotation){

    // Disable key bindings on container
    this.container.removeEvents('keydown');
    if( this.annotationTip ){
      this.annotationTip.hide();
      this.annotationTip.detach('div.annotation');
    }

    var id = annotation.get('id');

    // Find the reference to this annotation within our array
    var index = 0;
    for( var i=0; i<this.annotations.length; i++ ){
      if( this.annotations[i].id == id ) index = i;
    }

    // Remove the edit class from other annotations divs and assign to this one
    this.canvas.getChildren('div.annotation.edit').removeClass('edit');
    annotation.addClass('edit');

    var _this = this;

    // Check whether this annotation is already in edit mode. If so return
    if( annotation.getElement('div.handle') != null ) return;

    // Create our edit infrastructure
    var handle = new Element('div', {
      'id': 'annotation handle',
      'class': 'annotation handle',
      'title': 'resize annotation'
    }).inject( annotation );

    var form = new Element('form', {
      'class': 'annotation form',
      'styles':{
        'top': annotation.getSize().y
      }
    }).inject( annotation );

    // Create our input fields
    var html = '<p>title<input type="text" name="title" tabindex="1" autofocus';
    if( this.annotations[index].title ) html += ' value="' + this.annotations[index].title + '"';
    html += '/></p>';

    html += '<p>category<input type="text" name="category" tabindex="2"';
    if( this.annotations[index].category ) html += this.annotations[index].category + '"';
    html += '/></p>';

    html += '<p><textarea name="text" rows="5" tabindex="3">' + (this.annotations[index].text||'') + '</textarea></p>';

    form.set( 'html', html );

    new Element('input', {
      'type': 'submit',
      'value': 'ok'
    }).inject( form );

    new Element('input', {
      'type': 'reset',
      'value': 'cancel'
    }).inject( form );

    var del = new Element( 'input', {
      'type': 'button',
      'value': 'delete'
    }).inject( form );


    // Add update event for our list of annotations
    form.addEvents({
      'submit': function(e){
        e.stop();
	_this.updateShape(this.getParent());
	_this.annotations[index].category = e.target['category'].value;
	_this.annotations[index].title = e.target['title'].value;
	_this.annotations[index].text = e.target['text'].value;
	_this.updateAnnotations();
	_this.fireEvent('annotation', _this.annotations);
      },
      'reset': function(){ _this.updateAnnotations(); }
    });

    // Add a delete event to our annotation
    del.addEvent('click', function(){
		   _this.annotations.splice( index, 1 );
		   _this.updateAnnotations();
		   _this.fireEvent('annotation', _this.annotations);
		 });


    // Make it draggable and resizable, but prevent this interfering with our canvas drag
    // Update on completion of movement
    var draggable = annotation.makeDraggable({
      stopPropagation: true,
      preventDefault: true,
      container: this.canvas
    });

    var resizable = annotation.makeResizable({
      handle: handle,
      stopPropagation: true,
      preventDefault: true,
      // Keep our form attached to the annotation
      onDrag: function(){ form.setStyle('top', this.element.getSize().y ); }
    });


    // Set default focus on textarea
    annotation.addEvent( 'mouseenter', function(){
			   form.getElement('textarea').focus();
			   form.getElement('textarea').value = form.getElement('textarea').value;
			 });

    // Add focus events and reset values to deactivate text selection
    form.getElements('input,textarea').addEvents({
      'click': function(){
        this.focus();
        this.value = this.value;
       },
       'mousedown': function(e){ e.stop(); },
       'mousemove': function(e){ e.stop(); }
    });

  },



  /* Update the coordinates of the annotation
   */
  updateShape: function(el){

    // Loop through our list of annotations to find the right ID
    for( var i=0; i<this.annotations.length; i++ ){
      if( this.annotations[i].id == el.get('id') ) break;
    }

    // Update our list entry
    var parent = el.getParent();
    this.annotations[i].x = el.getPosition(parent).x / this.wid;
    this.annotations[i].y = el.getPosition(parent).y / this.hei;
    this.annotations[i].w = (el.getSize(parent).x-2) / this.wid;
    this.annotations[i].h = (el.getSize(parent).y-2) / this.hei;
  },


  updateAnnotations: function(){
    this.destroyAnnotations();
    this.createAnnotations();
    this.container.addEvent( 'keydown', this.key.bind(this) );
    if( this.annotationTip ) this.annotationTip.attach( 'div.annotation' );
  }


});
