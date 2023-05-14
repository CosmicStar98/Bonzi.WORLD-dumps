(function () {
  angular.module('app.factories')
    .factory('identity', IdentityFactory);
  IdentityFactory.$inject = ['$rootScope', '$log', '$http', '$window', '$timeout', '$interval', 'User', 'Identity', 'socket'];
  function IdentityFactory($rootScope, $log, $http, $window, $timeout, $interval, User, Identity, socket) {
    var identity = new IdentityConstructor();
    function IdentityConstructor() {
      var self = this;
      self.authenticated = false;
      self.user = null;
      self.bonzi = null;
      Identity.get({type: 'user'}).$promise.then(function (user) {
        // Loaded user.
        if (user && user._id && user.authenticated) {
          self.authenticated = true;
        } else {
          self.authenticated = false;
        }
      }).catch(function (error) {
        $log.warn('Error getting user: ' + ((error && error.message) || 'Unknown error') + '.');
      });
    }

    IdentityConstructor.prototype.updateBonzi = updateBonzi;
    IdentityConstructor.prototype._ayncReload = ayncReload;
    IdentityConstructor.prototype.reloadUser = reloadUser;
    IdentityConstructor.prototype.getUser = getUser;
    IdentityConstructor.prototype.announce = announce;
    IdentityConstructor.prototype.reload = reloadIdentity;
    IdentityConstructor.prototype.doLogout = logoutIdentity;
    IdentityConstructor.prototype.sendFingerprint = sendFingerprint;

    function reloadUser(callback) {
      var self = this;
      function done(err, user) {
        if (typeof callback === 'function') {
          callback(err, user);
        }

        return user;
      }

      Identity.get({type: 'user'}, function (u) {
        if (u && u._id) {
          self.authenticated = true;
        } else {
          self.authenticated = false;
        }

        done(null, u);
      }, function (err) {
        // console.dir(err);
        done(err, null);
      });
    }

    function updateBonzi(bonzi) {
      var self = this;
      if (!bonzi) {
        return;
      }

      self.bonzi = bonzi;
    }

    function ayncReload() {
      var self = this;
      async.parallel({
        user: self.reloadUser.bind(self)
      }, function (err, result) {
        if (err) {
          console.error('Error async identity reload: ' + (err.message || err) + '.');
          console.error(err);
          return;
        }

        if (!result) {
          return;
        }

        if (result.user) {
          self.user = result.user;
          if (self.user && self.user._id) {
            self.authenticated = true;
          } else {
            self.authenticated = false;
          }
        }

        self.announce();
      });
    }

    function reloadIdentity() {
      var self = this;
      self._ayncReload();
    }

    function getUser() {
      var self = this;
      return self.user;
    }

    function announce() {
      var self = this;
      $rootScope.$broadcast('identity:update', self);
    }
    function sendFingerprint(data) {
      return new Promise(function (resolve, reject) {
        if (!data) {
          return;
        }

        var payload = data;
        if (typeof data === 'string') {
          payload = {
            fingerprint: data
          };
        }

        payload.socket = payload.socket || (window.socket && window.socket.id) || null;
        if (!payload.socket) {
          delete payload.socket;
        }

        $http.post('/api/v1/identity/fingerprint/', payload)
          .then(response => {
            resolve(response.data);
          }, err => {
            reject(err);
          });
      });
    }

    function logoutIdentity() {
      var self = this;
      self.user.logout(function (err) {
        if (err) {
          console.error('Error logging out: ' + err);
          console.error(err);
          return false;
        }

        self.user = null;
        $rootScope.$broadcast('identity:logout');
        $rootScope.$broadcast('identity:update', self);
        $window.location.href = '/';
      });
    }
    $rootScope.$on('login:success', function () {
      $timeout(function () {
        identity._ayncReload();
      });
    })

    socket.on('identity:updated', function () {
      // $log.info('identity updated on server.');
      $timeout(function () {
        identity._ayncReload();
      });
    });
    socket.on('identity', function (data) {
      // $log.info('identity updated on server.');
      $timeout(function () {
        identity.updateBonzi(data);
        if (localStorage) {
          localStorage.setItem('last-identity', JSON.stringify(data));
          localStorage.setItem('last-used-username', data.name);
          localStorage.setItem('last-used-color', data.color || 'purple');
        }
      });
    });
    $rootScope.setPasscode = function (passcode) {
      socket.query = socket.query || {};
      if(!passcode) {
        socket.query.passcode = null;
        delete socket.query.passcode;
        window.roomPasscode = null;
        delete window.roomPasscode;
      } else {
        socket.query.passcode = passcode;
        window.roomPasscode = passcode;
      }
    }

    window.addEventListener('fingerprint', function (e) {
      identity.sendFingerprint(e.detail)
        .then(function (res) {
          // $log.debug('Fingerprint sent.');
        }).catch(function (err) {
          $log.warn('Error sending fingerprint.');
        });
      // e.target matches elem
    }, true);

    $timeout(function () {
      identity._ayncReload();
    }, 2500);

    return identity;
  }
})();
