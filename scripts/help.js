//help.js
//manages the help text and mousover tool tips at the bottom of the page

//wrapped in a event binding so that the function can act on dynamically added content
$(document).bind('domChange', function(){

	//hides tool tips by default
	$('.help').hide();

	//tool tip function, takes 2 strings. el is the element that is moused over
	//help is the element that should be displayed while el is moused over
	function toolTips(el,help) {
		$(el).on('mouseenter', function() {
			$(help).show();
			$(el).on('click', function() {
				$(help).hide();
			});
			$(el).on('mouseleave', function() {
				$(help).hide();
			});
		});
	}
	
	toolTips('H1','#exerciseTracker');
	toolTips('#name','#addExercise');
	toolTips('#add','#addExercise');
	toolTips('#update','#updateExercise');
	toolTips('.delete','#deleteExercise');
	toolTips('#stats','#statsExercise');
	toolTips('.update','#inputExercise');
	toolTips('.total','#totalExercise');
	toolTips('#close','#closeG');
	toolTips('.graph','#showG');
	
});

$(document).ready(function() {
	$(document).trigger('domChange');
});

