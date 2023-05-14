(function () {
  'use strict';
  angular.module('app.controllers')
    .controller('userLoginCtrl', UserLoginController)
    .controller('userRegisterCtrl', UserRegisterController)
    .controller('userForgotCtrl', UserForgotController)
    .controller('loginCtrl', LoginController);
  UserLoginController.$inject = ['$scope', '$log', '$http', '$timeout', '$window', '$location'];
  UserRegisterController.$inject = ['$scope', '$log', '$http', '$timeout', '$window'];
  UserForgotController.$inject = ['$scope', '$log', '$http', '$timeout', '$window'];
  function UserLoginController($scope, $log, $http, $timeout, $window, $location) {
    var vm = this;
    vm.submit = submitLogin;
    vm.payload = {
      username: '',
      password: ''
    };
    vm.inProgress = false;
    vm.formMessage = {
      error: false,
      body: ''
    };
    vm.view = 'login';

    vm.changeView = function (nv) {
      if (!nv) {
        vm.view = 'login';
      }

      vm.view = nv;
    }
    function loginSuccess(data) {
      $log.info('Successfully logged in.');
      if (data && data.data) {
        if (data && data.data.username) {
          window.bonziLogin(data.data.username, data.data.room || 'default');
          $scope.$emit('login:success', data);
        }
      }

      vm.loginForm.username.$setValidity('server', true);
      vm.loginForm.password.$setValidity('server', true);
      $timeout(function () {
        vm.inProgress = false;
      }, 5000);
      return true;
    }

    function loginError(err) {
      $log.error('Error when attempting to login: ' + err.message + '.');
      $log.error(err);
      vm.formMessage.body = err.message || 'Username and password combination not found or your account is inactive.';
      vm.formMessage.error = true;
      vm.loginForm.username.$setValidity('server', false);
      vm.loginForm.password.$setValidity('server', false);
      vm.inProgress = false;
    }

    function submitLogin() {
      vm.inProgress = true;
      vm.formMessage.error = false;
      vm.formMessage.body = '';
      vm.loginForm.username.$setValidity('server', null);
      vm.loginForm.password.$setValidity('server', null);
      vm.loginForm.$setSubmitted();
      vm.loginForm.username.$setDirty();
      vm.loginForm.password.$setDirty();
      $http.post('/api/v1/login/', vm.payload)
        .then(function (res) {
          if (res.data.success) {
            return loginSuccess(res.data);
          }

          loginError(res.data);
        }, function (err) {
          loginError(err.data || err);
        });
    }
  }
  function UserRegisterController($scope, $log, $http, $timeout, $window) {
    var vm = this;
    vm.submit = submitRegister;
    vm.payload = {
      email: '',
      username: '',
      password: ''
    };
    vm.inProgress = false;
    vm.formMessage = {
      error: false,
      body: ''
    };

    function registerSuccess(data) {
      data = data || {};
      $log.info('Successfully registered.');
      vm.form.username.$setValidity('server', true);
      vm.form.email.$setValidity('server', true);
      vm.form.password.$setValidity('server', true);
      // $window.location.href = '/admin/';
      vm.formMessage.body = data.message || 'Check your email to validate your email address and complete the signup process';
      vm.formMessage.success = true;
      vm.payload = {email: '', username: '', password: ''};
      vm.inProgress = false;
      return true;
    }

    function registerError(err) {
      $log.error('Error when attempting to login: ' + err.message + '.');
      $log.error(err);
      vm.formMessage.body = err.message || 'Unknown error occurred. Please try again.';
      vm.formMessage.error = true;
      vm.form.username.$setValidity('server', false);
      vm.form.email.$setValidity('server', false);
      vm.form.password.$setValidity('server', false);
      vm.inProgress = false;
    }

    function submitRegister() {
      vm.inProgress = true;
      vm.formMessage.error = false;
      vm.formMessage.body = '';
      vm.form.username.$setValidity('server', null);
      vm.form.email.$setValidity('server', null);
      vm.form.password.$setValidity('server', null);
      vm.form.$setSubmitted();
      vm.form.username.$setDirty();
      vm.form.email.$setDirty();
      vm.form.password.$setDirty();
      $http.post('/api/v1/login/register/', vm.payload)
        .then(function (res) {
          if (res.data.success) {
            return registerSuccess(res.data);
          }

          registerError(res.data);
        }, function (err) {
          registerError(err.data || err);
        });
    }
  }
  function UserForgotController($scope, $log, $http, $timeout, $window) {
    var vm = this;
    vm.submit = submitForgot;
    vm.payload = {
      email: ''
    };
    vm.inProgress = false;
    vm.formMessage = {
      error: false,
      body: ''
    };

    function loginSuccess() {
      $log.info('Successfully logged in.');
      vm.form.email.$setValidity('server', true);
      // $window.location.href = '/admin/';
      $timeout(function () {
        vm.inProgress = false;
      }, 5000);
      return true;
    }

    function loginError(err) {
      $log.error('Error when attempting to login: ' + err.message + '.');
      $log.error(err);
      vm.formMessage.error = true;
      vm.form.email.$setValidity('server', false);
      vm.inProgress = false;
    }

    function submitForgot() {
      vm.inProgress = true;
      vm.formMessage.error = false;
      vm.formMessage.body = '';
      vm.form.email.$setValidity('server', null);
      vm.form.$setSubmitted();
      vm.form.email.$setDirty();
      $http.post('/api/v1/login/forgot/', vm.payload)
        .then(function (res) {
          if (res.data.success) {
            return loginSuccess(res.data);
          }

          loginError(res.data);
        }, function (err) {
          loginError(err.data || err);
        });
    }
  }
  LoginController.$inject = ['$scope', '$log', '$location'];
  function LoginController($scope, $log, $location) {
    var vm = this;
    vm.username = '';
    vm.room = '';
    if ($location && $location.$$hash) {
      vm.room = $location.$$hash || '';
    }

    $scope.checkIfReload = checkIfReload;
    $scope.useStoredName = useStoredName;
    $scope.checkIfWasLoggedIn = checkIfWasLoggedIn;
    $scope.initialize = initialize;
    $scope.checked = false;
    vm.doLogin = function (username, room) {
      var pl = {
        username: username || vm.username || 'Anonymous',
        room: room || vm.room || 'default',
        timestamp: moment()
      };

      if (typeof pl.username !== 'string' || pl.username.length <= 0) {
        pl.room = 'Anonymous';
      }
      if (typeof pl.room !== 'string' || pl.room.length <= 0) {
        pl.room = 'default';
      }

      if (localStorage) {
        localStorage.setItem('logged-in', true);
        localStorage.setItem('last-login', JSON.stringify(pl));
        localStorage.setItem('last-used-username', pl.username);
        localStorage.setItem('last-login-username', pl.username);
        localStorage.setItem('last-login-room', pl.room);
        localStorage.setItem('last-login-timestamp', pl.timestamp);
      }

      window.bonziLogin(pl.username, pl.room);
    };

    function checkIfWasLoggedIn() {
      if (!localStorage) {
        return false;
      }

      var wasLoggedIn = localStorage.getItem('logged-in');
      if (!wasLoggedIn) {
        return false;
      }

      return true;
    }

    function useStoredName() {
      if (localStorage) {
        var localName = localStorage.getItem('last-used-username') || localStorage.getItem('last-login-username');
        var localRoom = localStorage.getItem('last-login-room');

        if (localName && localName.toLowerCase() !== 'default' && localName.toLowerCase() !== 'anonymous') {
          vm.username = localName;
        } else {
          vm.username = '';
        }

        if (vm.room.length > 0) {
          return;
        }

        if (vm.room.length <= 0 && localRoom && localRoom !== 'default') {
          vm.room = localRoom || '';
        } else {
          vm.room = '';
        }
      }

      return false;
    }

    function checkIfReload() {
      var isReload = false;
      if ($scope.checked) {
        return false;
      }

      $scope.checked = true;
      try {
        var perfEntries = performance.getEntriesByType('navigation');
        if (perfEntries && perfEntries.length > 0) {
          angular.forEach(perfEntries, function (value) {
            if (value && value.type && value.type === 'reload') {
              $scope.useStoredName();
              if (vm.username && vm.username.toLowerCase() !== 'default' && vm.username.toLowerCase() !== 'anonymous') {
                isReload = true;
              }
            }
          });
        }
      } catch (err) {
        console.error(err);
      }

      return isReload || false;
    }

    function initialize() {
      var wasReload = $scope.checkIfReload();
      if (vm.room === 'default') {
        vm.room = '';
      }

      if (window && window.user && window.user.username) {
        vm.username = window.user.username;
        vm.doLogin(window.user.username, vm.room || window.user.defaultRoom || 'default');
      // } else if (wasReload && window.environment !== 'development') {
      } else if (wasReload && window.environment !== 'development') {
        $log.info('Doing login with stored values.');
        vm.doLogin();
      }
    }

    $scope.initialize();
  }
})();
