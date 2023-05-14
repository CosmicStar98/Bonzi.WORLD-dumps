(function () {
  'use strict';
  angular.module('app.directives')
    .directive('bonziTextName', BonziTextNameDirective);

  BonziTextNameDirective.$inject = ['$log', '$timeout'];
  function BonziTextNameDirective($log, $timeout) {
    return {
      scope: {
        message: '=bonziTextName'
      },
      link: function (scope, element) {
        function hookupContextMenu() {
          // Setup context menu
          var build = scope.bonzi.getContextMenu();
          $.contextMenu({
            selector: scope.selector,
            build: build,
            trigger: 'right'
          });
        }
        function cleanupContextMenu() {
          if (!scope.selector) {
            return;
          }

          $.contextMenu('destroy', scope.selector);
        }
        function bonziTextMessage() {
          scope.bonzi = scope.message._bonzi || _.get(window.bonzis, scope.message.bonzi.guid);
          scope.selector = `#cl-msg-${scope.message.id} > .bonzi-name`;
          if (!scope.bonzi) {
            return;
          }

          $timeout(hookupContextMenu, 100);
        }

        if (!scope.message.type || scope.message.type === 'text') {
          bonziTextMessage();
        }

        scope.$on('$destroy', function () {
          cleanupContextMenu();
        });
      }
    };
  }
})();
