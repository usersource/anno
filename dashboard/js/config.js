'use strict';

Dashboard.config(function($httpProvider) {
    $httpProvider.defaults.headers.common.contentType = 'application/json';
});

Dashboard.config(function($routeProvider, $locationProvider) {
    var $cookies;
    angular.injector(['ngCookies']).invoke(function(_$cookies_) {
        $cookies = _$cookies_;
    });

    $routeProvider.when('/dashboard/:teamHash/:teamName/login', {
        templateUrl: '/dashboard/partials/login.html',
        controller: 'Login'
    }).when('/dashboard/:teamHash/:teamName/feed', {
        templateUrl: '/dashboard/partials/feed.html',
        controller: 'Feed'
    }).when('/dashboard/:teamHash/:teamName', {
        redirectTo: function(params, current_url) {
            var action_page = angular.equals($cookies.authenticated, "true") ? '/feed' : '/login';
            return current_url + action_page;
        }
    }).when('/dashboard/login', {
        templateUrl: '/dashboard/partials/login.html',
        controller: 'Login'
    }).when('/dashboard/feed', {
        templateUrl: '/dashboard/partials/feed.html',
        controller: 'Feed'
    }).when('/dashboard', {
        redirectTo: function(params, current_url) {
            var action_page = angular.equals($cookies.authenticated, "true") ? '/feed' : '/login';
            return current_url + action_page;
        }
    }).otherwise({
        redirectTo: '/dashboard'
    });

    $locationProvider.html5Mode({ enabled: true, requireBase: false });
});
