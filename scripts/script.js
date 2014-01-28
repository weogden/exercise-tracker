/*script.js
Willaim Ogden
January 2014
Purpose: Contains the models and views for the exercise tracker
	Specifically each exercise is a model and the app is a collection of exercise model views
*/

// Main model, model objects should be in the format {id: <int>, name: <string>, last: <int>, total: <int>}	
var Ex = Backbone.Model.extend({
	idAttribute: 'id'
});

// Creates a collection of views based on model Ex. Uses Backbone.Localstorage plugin instead of a REST API
// Backbone.Localstorage plugin:https://github.com/jeromegn/Backbone.localStorage
var ExList = Backbone.Collection.extend({
	localStorage: new Backbone.LocalStorage("ExStorage"),
	model: Ex
});

// View instance for each model, views are contained in table rows, hence the 'tr' tagName.
var ExView = Backbone.View.extend({
	tagName: 'tr',
	initialize: function(){
		this.listenTo(this.model, 'change', this.render);
	},
	render: function(){
		var html = '<td>' + this.model.get('name') + '</td>' +
			'<td>' + '<input id=' + this.model.get('id') + ' class=update size=3 type="text" value=' + this.model.get('last') + ' />' + '</td>' +
			'<td><span class="total">Total: ' + this.model.get('total') + '</span></td>' +
			'<td><button class="delete">Delete</button></td>';
		this.$el.html(html);
		return this;
	},
	events: {
		'click .delete': 'deleteEx'
	},
	deleteEx: function(){
		this.model.destroy();
		this.remove();
	}	
});

// Creates the Collection View
var ColView = Backbone.View.extend({
	el:$("table"),
	events:{
		'click #add':'addEx',
		'click #update':'updateEx',
		'click #stats':'statsEx'
	},
	initialize:function(){
		this.collection = new ExList();
		this.collection.fetch();
		this.render();
		$('#statsView').hide();
		
		this.collection.on('add', this.renderEx, this);
		this.collection.on('reset', this.render, this);
	},
	addEx: function(e){
		e.preventDefault();
		var valu = $('#name').val();
		if (valu) {
			if (this.collection.length > 0) {
				var newId = (_.max(this.collection.toJSON(), function(x) {return x.id})).id;
			} else {
				var newId = 0;
			}
			var newEx = {id:(newId + 1), name:valu, last:0, total:0, history: [[new Date(),0]]};
			this.collection.create(newEx);
			$(document).trigger('domChange');
		}
	},
	updateEx: function(){
		var that = this;
		$.each($('.update'), function(index, value) {
			var modl = that.collection.get(value.id);
			var intValue = parseInt(value.value);
			var date = new Date(modl.get('history')[0][0]);
			var now = new Date();
			function isSameDate(today, someDay) {
				if (today.getDate() == someDay.getDate() && 
				today.getMonth() == someDay.getMonth() &&
				today.getFullYear() == someDay.getFullYear()
				//&& today.getMinutes() == someDay.getMinutes() // debugging line, makes it so statistics are counted by the minute
				) {
					return true;						
				} else {
					return false;
				}
			}
			if (isSameDate(now, date)) {
				var hist = modl.get('history');
				hist[0][1] = hist[0][1] + intValue;
			} else { 
				var hist = modl.get('history');
				while (!(isSameDate(now, date))) {
					date.setDate(date.getDate()+1); // adds a day, include in code, comment out the bellow for intended use
					//date.setMinutes(date.getMinutes()+1); // adds a minute, comment out the above for debugging
					var temp = new Date(date);
					hist.unshift([temp, 0]);
				}
				hist.shift();
				hist.unshift([now,intValue]);
			}
			modl.save({last: value.value, total: (modl.get('total') + intValue), history: hist});
		});
	},

	statsEx: function(){
		//chart drawing uses chart.js from http://www.chartjs.org/
		var count = 0;
		var names = '';
		_.each(this.collection.models, function(x) {
			if (names == '') {
				names += "<button class='graph color' id='" + x.get('id') + "' >" + x.get('name') + "</button>";
			} else {
				names += "<button class='graph' id='" + x.get('id') + "' >" + x.get('name') + "</button>";
			}
		});
		var hist = this.collection.models[0].get('history');
		var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
			"Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
		//Chart.js only supports chart size in px, hence window.width & window.height to determine what size graph should be
		var width = ($(window).width() * 0.7);
		var height = ($(window).height() * 0.6);
		var html = ("<h3> Stats " +
			'</h4> <a id="close"  href="">close</a><br>' +
			'Comparison: ' + names + '<br>' +
			'<canvas id="myChart" width='+ width +' height='+ height +'></canvas>');
		$('#statsView').html(html);	

		function makeGraph(c, hist) {
			var label = ['Most Recent'];
			var cData = [0];
			_.each(hist, function(x) {
				cData.push(x[1]);
				date = new Date(x[0]);
				label.push((monthNames[date.getMonth()] + ' ' + date.getDate()));
			});
			cData.push(0);
			label.push('Least Recent');
			color = ["rgba(151,187,205,", "rgba(204,43,46,", "rgba(41,207,47,", "rgba(242,242,58,"];
			var dataS =  {
				fillColor : color[c] + "0.5)",
				strokeColor : color[c] + "1)",
				pointColor : color[c] + "1)",
				pointStrokeColor : "#fff",
				data : cData
			}
			var data = {
				labels : label,
				datasets : [dataS]
			}
			
			var ctx = document.getElementById("myChart").getContext("2d");
			var myNewChart = new Chart(ctx).Line(data);	
			count++;
			if (count == 4) {
				count = 0;
			}
		}
		//Bug: the graph scale isn't ideal
		makeGraph(count, hist);

		$('#statsView').show();
		$('table').hide();
		
		//Jquery statsView button detection. 
		$('#close').on('click', function() {
			event.preventDefault();
			$('table').show();
			$('#statsView').hide();
		});
		var that = this;
		$('.graph').on('click', function() {
			event.preventDefault();
			$('.graph').removeClass('color');
			$(this).toggleClass('color');
			var modl = that.collection.get($(this).attr("id")).get('history');
			makeGraph(count, modl);
		});
		$(document).trigger('domChange');

	},
	renderEx: function(item){
		var exView = new ExView({
			model: item
		});
		this.$el.append(exView.render().el);
	},
	render: function(){
		this.$el.html("<tr><th colspan='5' class='space'>Add New Exercise: <input id='name' type='text'/><button id='add'>Add</button></th></tr>")
		var that = this;
		_.each(this.collection.models, function(item){
			that.renderEx(item);
		}, this);
		this.$el.append("<tfoot><tr><th colspan='2'><button id='update'>Update</button></th>" +
			"<th colspan='2'><button id='stats'>Statistics</button></th></tr></tfoot>");
	}
});

//Starts the app by creating a new instance of the Collection View
var colView = new ColView();



