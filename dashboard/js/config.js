'use strict';

Dashboard.config(function($routeProvider, $locationProvider) {
    $routeProvider.
        when('/dashboard/login/:teamHash?/:teamName?', {
            templateUrl: '/dashboard/partials/login.html',
            controller: 'Login'
        }).
        when('/dashboard/feed/:teamHash?/:teamName?', {
            templateUrl: '/dashboard/partials/feed.html',
            controller: 'Feed'
        }).
        otherwise({
            redirectTo: '/dashboard'
        });

    $locationProvider.html5Mode({ enabled: true, requireBase: false });
});
