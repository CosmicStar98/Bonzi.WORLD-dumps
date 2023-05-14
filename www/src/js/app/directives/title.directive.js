(function () {
  'use strict';
  angular.module('app.directives')
    .directive('pageTitle', PageTitleDirective)
    .directive('trackDigests', trackDigests);

  PageTitleDirective.$inject = ['$rootScope', '$route'];
  trackDigests.$inject = ['$rootScope'];
  function PageTitleDirective($rootScope, $route) {
    return {
      link: function (scope, element) {
        scope.original = getCurrent();
        scope.default = getCurrent();
        function getCurrent() {
          return element.text().split('-')[0].trim();
        }

        function setTitle(title) {
          title = title || scope.default || getCurrent();
          element.text(title + ' - BonziWORLD');
        }

        function updateTitle() {
          if (!$route || !$route.current) {
            return setTitle();
          }

          if ($route.current.$$route && $route.current.$$route.meta && $route.current.$$route.meta.title) {
            return setTitle($route.current.$$route.meta.title);
          }

          if ($route.current.loadedTemplateUrl === '/fragment/http/404/') {
            return setTitle('Page not found');
          }

          if ($route.current.loadedTemplateUrl === '/fragment/http/500/') {
            return setTitle('Error');
          }

          return setTitle('Unknown page');
        }

        $rootScope.$on('$routeChangeSuccess', updateTitle);
        $rootScope.$on('$viewContentLoaded', updateTitle);
        updateTitle();
      }
    };
  }

  function trackDigests($rootScope) {
    function link($scope, $element) {
      var count = 0;
      function countDigests() {
        count++;
        $element[0].innerHTML = '$digests: ' + count;
      }

      $rootScope.$watch(countDigests);
    }

    return {
      restrict: 'EA',
      link: link
    };
  }
})();
