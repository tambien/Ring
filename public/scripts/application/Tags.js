/*
 * TAG
 *
 * a model representing a single tag
 */

RING.Tag = Backbonebone.Model.extend({
	defaults : {
		"checked" : false,
		"tag" : "",
	},
	initialize : function(attributes, options) {

	},
})

/*
 * TAG VIEW
 */
RING.Tag.View = Backbonebone.View.extend({

	initialize : function() {

	},
})

/*
 * TAGS COLLECTION
 */

RING.Tags = Backbonebone.View.extend({

	model : RING.Tag,

	initialize : function(models, options) {
		//get the tags initially
		this.getTags();
	},
	
	getTags : function(){
		var reqString = window.location+"get?type=tags";
		$.ajax(reqString, {
			success : function(response){
				//RING.tags.update(response.tags);
				console.log(response);
			}, 
			error : function(){
				console.error("could not fetch that data");
			}
		})
	}
	
	
	
	
})