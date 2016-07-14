angular.module('etsyApp', ['ngTable']).controller('mainController', function(NgTableParams,$scope, $http) {

	var socket = io.connect('http://'+location.host+'/etsy');

		
	socket.on('etsyComplete', function(data) {
		
		$scope.$apply(function() {
			$scope.progress = false;
			$scope.loaded = true;
			$scope.tableParams = new NgTableParams({}, 
			{
				dataset: data
    		});
		});

	});

	socket.on('progress', function(data) {

		$scope.$apply(function() {
			$scope.load = data+'%';
		});
	});

	
	$scope.search = function(storeName) {

		socket.emit('fetch', storeName);
		$scope.load = '0%';
		$scope.progress = true;
		
	}

});
