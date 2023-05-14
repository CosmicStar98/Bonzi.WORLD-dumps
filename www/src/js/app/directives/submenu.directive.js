(function () {
  'use strict';
  angular.module('app.directives')
    .directive('pageSubmenu', SubmenuDirective);

  SubmenuDirective.$inject = ['$rootScope', '$route', '$timeout'];
  function SubmenuDirective($rootScope, $route, $timeout) {
    return {
      scope: {
        submenu: '=pageSubmenu'
      },
      link: function (scope, element) {
        scope.enableScroll = enableScroll;
        scope.disableScroll = disableScroll;
        scope.updateScroll = updateScroll;
        scope.update = update;
        scope.slowUpdate = slowUpdate;
        scope.scrollOptions = {
          handlers: ['drag-thumb', 'keyboard', 'wheel', 'touch'],
          suppressScrollY: true
        };
        function enableScroll() {
          if (!scope.ps) {
            scope.ps = new PerfectScrollbar(element.parent()[0], scope.scrollOptions || {});
          }

          return scope.updateScroll();
        }

        function disableScroll() {
          if (!scope.ps) {
            return false;
          }

          scope.ps.destroy();
          scope.ps = null;
        }

        function updateScroll() {
          if (!scope.ps) {
            return;
          }

          scope.ps.update();
          var activeItem = $(element).children('.active');
          if (activeItem) {
            element.parent()[0].scrollLeft = activeItem[0].offsetLeft;
          }
        }

        function update() {
          var smFullWidth = element.width();
          var smViewWidth = element.parent().width();
          if (smFullWidth > smViewWidth) {
            scope.enableScroll();
            return;
          }

          scope.disableScroll();
        }

        function slowUpdate() {
          $timeout(scope.update, 500);
        }

        scope.slowUpdate();
        $rootScope.$on('submenu:updated', scope.slowUpdate);
      }
    };
  }
})();
