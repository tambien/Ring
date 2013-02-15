//jumping off point
$(function() {
	RING.initialize();
	RING.Three.initialize();
});
/*
 * RING
 */
var RING = function() {

	function initialize(){
		//make the tumblr collection
		RING.tumblrCollection = new RING.TumblrCollection();
		getTagsBetween(["sxsw", "rsvp"], new Date(2012, 2, 2).toISOString(), new Date().toISOString());
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
				console.log(response);
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
