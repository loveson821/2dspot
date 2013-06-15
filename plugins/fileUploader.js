module.exports = function(app) {
	var fs = require('fs');
	var uploadFile = function(req, res, next) {
	if (req.files) {
	    // get the temporary location of the file
	    console.log(req.files);
	    var tmp_path = req.files.pic.path;
	    // set where the file should actually exists - in this case it is in the "images" directory
	    var target_path = './public/images/uploads/'+req.files.pic.name;
	    // move the file from the temporary location to the intended location
	    fs.rename(tmp_path, target_path, function(err) {
	        if (err) throw err;
	        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
	        fs.unlink(tmp_path, function() {
	            if (err) throw err;
	            console.log('File uploaded to: ' + target_path + ' - ' + req.files.pic.size + ' bytes');
	        });
	  	});
	}
		return next();
	};

	return{
		uploadFile: uploadFile
	};
}