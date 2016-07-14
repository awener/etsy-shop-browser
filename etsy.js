var request = require('req-fast');
var async = require('async');
exports.fetch = function(storeName, main_callback, progress_callback) {
	

	var shop = 'https://www.etsy.com/shop/'+storeName+'/sold?view_type=list&order=sales_desc';
	var worker = [];
	var items = [];
	var etsyContainer = [];
	var total = 0;
	var done = 0;
	var job = {
		itemParser: function(url, callback) {
			request(url, function(err, response, body) {
				if(err) return callback(true, err);

			})
		},
		filter: function(data, callback) {

			var holder = {};
			data.forEach(function(b){
      
      			if(!holder[b.title]){
       				holder[b.title] = b
       			} else{
 		       		holder[b.title].quantity += b.quantity
	        	}
    		});	
    		data = [];
    		for(var i in holder) {
      			data.push(holder[i])
    		}
    		
    		data.sort(function(a,b) {
      			return b.quantity - a.quantity;
    		})
    		
    		return callback(data);

		}
	}

	request(shop, function(err, response, body) {
		body = response.body
		if(err) return main_callback(true, err);
		if(body.match('has gone awry')) return main_callback(true, 'No such user.');
		var pages = (body.match(/data-page="(\d+)"/g));
		if(!pages) pages = 1;
		else pages = pages[pages.length-2].split('data-page="')[1].split('"')[0];
		
		pages = Math.min(pages, 10); // get tops 30 pages.

		total = pages*24;
		
		for(var i = 0; i < pages;i++) {
			worker.push(i);
		}
		
		async.map(worker, function iterator(item, callback) {
			
			var totalRequests = 0;

			(function fetcher(url) {
				
				if(totalRequests == 5) return callback(); // skip page.
				
				request(url, function(err, response, body) {
					body = response.body
					if(err) {
						console.log('Request failed: ' + totalRequests);
						totalRequests++;
						return fetcher(url);
						
					}

					
					body.replace(/href="(https:\/\/www.etsy.com\/listing\/(\d+).*)"/g, function(s, itemUrl){
						items.push(itemUrl);
					});


					return callback();


				});
			})(shop+'?ref=pagination&page='+item);
			

		}, function complete(err) {
			
			async.map(items, function(item, callback) {

				var totalRequests = 0;
				(function fetch(url) {


				var d = {};
				request(item, function(err, response, body) {
					body = response.body;
					if(totalRequests == 5) return callback();
					if(err) {
						totalRequests++;
						return fetch(url);
					}
					
					d.title = (body.match(/<span itemprop="name">(.+?)</)||['']).pop()
    				d.image = (body.match(/https:[^"]+_fullxfull[^"]+.jpg/)||[''])[0].replace('_fullxfull', '_570xN')
    				d.thumb = d.image.replace('_570xN', '_170x135')
    				d.price = (body.match(/<meta property="etsymarketplace:price_value" content="([\d.]+)"/)||['']).pop()
    				d.quantity = 1;
    				etsyContainer.push(d);
    				done += 1;

    				progress_callback(parseInt((done*100)/total));
    				return callback();
				});
			})(item);
			}, function() {
				
				job.filter(etsyContainer, function(data) {
					
					main_callback(null, data);
					
				})

				
			})
			
		});



	})

}


// main app 82 seconds

// my solution currently: 63 seconds