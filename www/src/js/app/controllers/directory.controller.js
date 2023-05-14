(function () {
  'use strict';
  angular.module('app.controllers')
    .controller('sidebarDirectoryCtrl', SidebarDirectoryController);
  SidebarDirectoryController.$inject = ['$rootScope', '$scope', '$log', '$http', '$timeout', '$interval', '$window', 'socket', 'Room'];
  function SidebarDirectoryController($rootScope, $scope, $log, $http, $timeout, $interval, $window, socket, Room) {
    var vm = this;
    vm.editRoom = null;
    $scope.initialized = false;
    $scope.enteredPasscode = '';
    vm.getRoomClass = function (rm) {
      var c = ['fas'];

      if (!rm) {
        c.push('fa-bug');
        return c;
      }

      if (rm && rm.icon) {
        c = rm.icon.split(' ');
        if (rm.flags && rm.flags.static) {
          return c;
        }
      }

      if (rm.users === 0) {
        c.push('fa-thermometer-empty');
      }

      if (rm.full) {
        c.push('fa-thermometer-full');
        return c;
      }

      if (rm.locked) {
        c.push('fa-lock');
      } else {
        c.push('fa-door-open');
      }

      return c;
    }

    vm.rooms = Room.query({}, function () {
      $scope.initialized = true;
    }, function (err) {
      $scope.initialized = true;
      console.error(err);
    });

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

    $scope.askForPasscode = function (rm, pc) {
      if (!rm) {
        return;
      }

      Swal.fire({
        title: 'Room passcode required',
        text: 'The owner of the room requires a passcode to enter the room.',
        icon: 'warning',
        input: 'text',
        inputValue: pc || '',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Join',
        inputValidator: function (value) {
          if (!value) {
            return 'Room passcode required!'
          }
        }
      }).then(result => {
        if (result.value) {
          $rootScope.setPasscode(result.value);
          $scope.doJoinRoom(rm, result.value);
        } else {
          socket.emit('room:join', {room: 'default'});
        }
      });
    }

    $scope.doJoinRoom = function (rm, passcode) {
      if (!rm) {
        return;
      }

      var currentRoom = String(window.roomCode || 'default');
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
          data = data || {};
          if (!data.success) {
            if (!data.extras) {
              Swal.fire(
                'Room Join Error',
                `Unknown error occured - please try again.`,
                'error'
              )

              socket.emit('room:join', {room: currentRoom || 'default'});
              return;
            }

            if (data.extras.passcode) {
              $scope.askForPasscode(rm, passcode || '');
              return;
            } else {
              Swal.fire(
                'Room Join Error',
                String((data && data.message) || `Unknown error occured - please try again`) + '.',
                'error'
              )
            }

            socket.emit('room:join', {room: currentRoom || 'default'});
            return;
          }

          $scope.enteredPasscode = '';
          window.showToast('success', 'Joining room.');
          $scope.$emit('sidebar:close');
          $timeout(function () {
            self.updateSprite(true);
            self.enter();
          }, 1000);
        });
      }).bind(me));
    }

    vm.joinRoom = function (room, passcode) {
      if (!room) {
        return;
      }

      passcode = passcode || $scope.enteredPasscode || null;

      if (room.locked && (!passcode || passcode.length <= 0)) {
        $scope.askForPasscode(room);
        return;
      }

      $scope.doJoinRoom(room, passcode);
    }

    $scope.updateRooms = function () {
      if (!$scope.initialized || $rootScope.sidebarCollapsed) {
        return;
      }

      Room.query({}, function (rooms) {
        vm.rooms = rooms || [];
      }, function (err) {
        $log.error(`Error updating rooms.`);
        // console.error(err);
        Sentry.captureException(err);
      });
    }

    socket.on('rooms:update', function (data) {
      var found = false;
      if (vm.rooms && vm.rooms.length >= 0) {
        for (var l = 0; l < vm.rooms.length; l++) {
          if (vm.rooms[l]._id === (data._id || data.id || data.rid)) {
            found = true;
            vm.rooms[l].$refresh();
          }
        }
      }

      if (!found) {
        $scope.updateRooms();
      }
    });

    $scope.interval = $interval($scope.updateRooms, 30000);
  }
})();
