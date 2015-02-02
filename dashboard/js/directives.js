Dashboard.directive('imgonload', ['$parse', function ($parse) {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            element.bind("load", function (e) {
                var fn = $parse(attrs["imgonload"]);
                scope.$apply(function() {
                    fn(scope, {$event : event});
                });
            });
        }
    }
}]);
