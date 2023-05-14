(function () {
  'use strict';
  angular.module('app.controllers')
    .controller('debugWindowCtrl', DebugWindowController);
  DebugWindowController.$inject = ['$rootScope', '$scope', '$log', '$http', '$timeout', '$interval', '$window', 'socket'];
  function DebugWindowController($rootScope, $scope, $log, $http, $timeout, $interval, $window, socket) {
    var vm = this;
    vm.animation = {
      play: false,
      frameCurrent: 0,
      frameStart: 0,
      frameEnd: 902,
      interval: 750,
      reverse: false,
      loop: true,
      _fwd: true
    };
    vm.updateMe = function () {
      try {
        if (!bonzis || !window.guid || !bonzis[window.guid] || !bonzis[window.guid].sprite) {
          return;
        }

        bonzis[window.guid].sprite.gotoAndStop(vm.animation.frameCurrent);
      } catch (err) {
        // Nothing.
      }
    }

    $scope.doAnim = function () {
      if (vm.animation.play) {
        if (vm.animation._fwd) {
          vm.animation.frameCurrent++;
        }

        if (vm.animation.frameCurrent < vm.animation.frameStart) {
          vm.animation.frameCurrent = vm.animation.frameStart;
        }

        if (vm.animation.frameCurrent > vm.animation.frameEnd) {
          vm.animation.frameCurrent = vm.animation.frameStart;
        }

        vm.updateMe();
      }

      $timeout($scope.doAnim, vm.animation.interval);
    }

    vm.animCtrl = {
      play: function () {
        vm.animation.play = true;
      },
      stop: function () {
        vm.animation.play = false;
      },
      restart: function () {
        vm.animation.frameCurrent = vm.animation.frameStart;
      }
    };
    $scope.initialized = false;
    $scope.initialize = function (force) {
      if ($scope.initialized && !force) {
        return;
      }

      $scope.doAnim();
    }

    $scope.initialize();
  }
})();
