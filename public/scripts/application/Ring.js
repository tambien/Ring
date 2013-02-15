//jumping off point
$(function() {
	RING.initialize();
	RING.Three.initialize();
});
/*
 * RING
 * 
 * the main application
 */
var RING = function() {

	function initialize(){
		//make the tumblr collection
		RING.tumblrCollection = new RING.TumblrCollection();
		//get all of the tags
		//getTags();
		getTagsBetween(["sxsw", "majorlazer"], new Date(2012, 2, 2).toISOString(), new Date().toISOString());
	}
	
	/*
	 * REQUESTS
	 */
	
	function getTagsBetween(tags, timeFrom, timeTo){
		var obj = {
			type : "range",
			tags : tags,
			start : timeFrom,
			end : timeTo
		}
		var reqString = window.location+"get?"+decodeURIComponent($.param(obj));
		$.ajax(reqString, {
			success : function(response){
				RING.tumblrCollection.update(response.tumblr);
			}, 
			error : function(){
				console.error("could not fetch that data");
			}
		})
	}
	
	
	

	/*
	 * API
	 */
	return {
		initialize: initialize,
	};

}();

//development version
RING.dev = true;
