(function () {
  'use strict';
  angular.module('app.controllers')
    .controller('editRoomCtrl', EditRoomController);
  EditRoomController.$inject = ['$rootScope', '$scope', '$log', '$http', '$timeout', '$interval', '$window', 'socket', 'Room'];
  function EditRoomController($rootScope, $scope, $log, $http, $timeout, $interval, $window, socket, Room) {
    var vm = this;
    vm.isNewRoom = false;
    vm.editRoom = null;
    vm.masterRoom = null;
    $scope.editId = null;
    vm.inProgress = false;
    vm.joiningRoom = false;
    $scope.initialized = false;
    $scope.initialize = function (force) {
      if ($scope.initialized && !force) {
        return;
      }

      vm.joiningRoom = false;
      vm.inProgress = false;
      $scope.initialized = true;
      if ($rootScope.editRoom) {
        // Is an edit - not a new.
        $scope.edit = true;
        if (typeof $rootScope.editRoom === 'string') {
          $scope.editId = $scope.editId || $rootScope.editRoom;
        } else {
          $scope.editId = $scope.editId || $rootScope.editRoom._id;
        }

        vm.editRoom = Room.get({
          id: $scope.editId,
          edit: true
        }).$promise(function (room) {
          vm.masterRoom = angular.copy(room);
          $log.info('Room ready for editing.');
          vm.isNewRoom = false;
        }, function (err) {
          $log.error('Error getting room to edit!');
          console.error(err);
        });
      } else {
        vm.editRoom = new Room();
        vm.masterRoom = angular.copy(vm.editRoom);
        vm.isNewRoom = true;
      }
    }
    vm.resetRoom = function() {
      if (vm.masterRoom) {
        vm.editRoom = angular.copy(vm.masterRoom);
      }
    }
    vm.clearEditSidebar = function () {
      $scope.$emit('sidebar:close');
      vm.editRoom = new Room();
      vm.masterRoom = angular.copy(vm.editRoom);
      vm.isNewRoom = true;
    }
    vm.saveRoom = function () {
      if (vm.inProgress) {
        return;
      }

      vm.inProgress = true;
      $timeout(function () {
        vm.inProgress = false;
      }, 15000);
      vm.editRoom.$save(function() {
        if (vm.editRoom._id) {
          var rm = angular.copy(vm.editRoom);
          vm.clearEditSidebar();
          vm.joinRoom(rm._id, rm.passcode);
        }

        vm.inProgress = false;
      });
    }

    vm.clearBonzis = function () {
      function destroyBonzi() {
        if (this.id === window.guid) {
          return;
        }

        this.deconstruct();
        delete bonzis[this.id];
        delete usersPublic[this.id];
        BonziHandler.clearBonzi(this.id);
        usersUpdate();
      }
      _.forIn(window.bonzis, function (b) {
        destroyBonzi.apply(b);
      });
      usersUpdate();
    }

    $scope.doJoinRoom = function (rm, passcode) {
      if (!rm) {
        return;
      }

      if (vm.joiningRoom) {
        return;
      }

      vm.joiningRoom = true;
      $timeout(function () {
        vm.joiningRoom = false;
      }, 15000);
      $rootScope.setPasscode(passcode);

      var me = window.bonzis[window.guid || window.identity.guid];

      me.exit((function () {
        var self = this;
        const pl = {
          room: rm
        };

        if (passcode) {
          pl.passcode = passcode;
        }

        vm.clearBonzis();
        socket.emit('room:join', pl, function (data) {
          if (!data || !data.success) {
            if (data && data.message) {
              Swal.fire(
                'Room Join Error',
                `${data.message}. Please try again.`,
                'error'
              );
            } else {
              Swal.fire(
                'Room Join Error',
                `Unknown error occured - please try again.`,
                'error'
              );
            }

            vm.joiningRoom = false;
            return;
          }

          window.showToast('success', 'Created room');
          $scope.$emit('sidebar:close');
          $timeout(function () {
            self.updateSprite(true);
            self.enter();
            vm.joiningRoom = false;
          }, 1000);
        });
      }).bind(me));
    }

    vm.joinRoom = function (room, passcode) {
      if (!room) {
        return;
      }

      $scope.doJoinRoom(room, passcode);
    }

    $scope.$on('room:edit', function(event, data) {
      console.dir(data);
      $scope.initialize(true);
    });
    $scope.$on('$destroy', function() {
      $rootScope.editRoom = null;
      delete $rootScope.editRoom;
    });

    socket.on('rooms:update', function (data) {
      if (vm.masterRoom && vm.masterRoom._id === (data._id || data.id || data.rid)) {
        vm.masterRoom.$refresh();
      }
    });

    $scope.initialize();
  }
})();
