(function () {
  angular.module('app.factories')
    .factory('settings', SettingsFactory);
  SettingsFactory.$inject = ['$rootScope', '$window', '$timeout', '$interval', 'User', 'Identity', 'data'];
  function SettingsFactory($rootScope, $window, $timeout, $interval, User, Identity, data) {
    var settings = data.local.settings;
    return settings;
  }
})();
