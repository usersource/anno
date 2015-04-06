'use strict';

var $cookies;
angular.injector(['ngCookies']).invoke(function(_$cookies_) {
    $cookies = _$cookies_;
});

Dashboard.config(function($httpProvider) {
    $httpProvider.defaults.headers.common = { 'Content-Type' : 'application/json;charset=utf-8' };
});

Dashboard.config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/dashboard/:teamHash?/:teamName?/login', {
        templateUrl: '/dashboard/partials/login.html',
        controller: 'Login'
    }).when('/dashboard/register', {
        templateUrl: '/dashboard/partials/register.html',
        controller: 'Register'
    }).when('/dashboard/:teamHash?/:teamName?/feed/:annoId?', {
        templateUrl: '/dashboard/partials/feed.html',
        controller: 'Feed'
    }).when('/dashboard/:teamHash?/:teamName?/account', {
        templateUrl: '/dashboard/partials/account.html',
        controller: 'Account'
    }).when('/dashboard/:teamHash?/:teamName?/getstarted', {
        templateUrl: '/dashboard/partials/getstarted.html',
        controller: 'GetStarted'
    }).when('/dashboard/:teamHash?/:teamName?/members', {
        templateUrl: '/dashboard/partials/members.html',
        controller: 'Members'
    }).when('/dashboard/:teamHash?/:teamName?', {
        redirectTo: function(params, current_url) {
            var action_page = angular.equals($cookies.authenticated, "true") ? '/feed' : '/login';
            return current_url + action_page;
        }
    }).otherwise({
        redirectTo: '/dashboard'
    });

    $locationProvider.html5Mode({ enabled: true, requireBase: false });
});

Dashboard.run(function($rootScope, $location, $cookieStore) {
    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        var redirectTo, redirectURL;

        if ($cookieStore.get('authenticated')) {
            if (next.templateUrl === "/dashboard/partials/login.html") {
                redirectTo = "feed";
            }
        } else {
            redirectTo = "login";
            if (next.controller !== "Login") {
                $cookieStore.put('redirect_to', $location.absUrl());
            }
        }

        if (angular.isDefined(redirectTo)) {
            if (next.params.hasOwnProperty("teamHash") && next.params.hasOwnProperty("teamName")) {
                $location.path("/dashboard/" + next.params.teamHash + "/" + next.params.teamName + "/" + redirectTo);
            } else  {
                $location.path("/dashboard/" + redirectTo);
            }
        }
    });
});
