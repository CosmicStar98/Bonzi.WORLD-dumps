(function () {
  angular.module('app.factories')
    .factory('data', DataFactory);
  DataFactory.$inject = ['$rootScope', '$window', 'Idle', '$timeout', '$interval', '$localStorage', 'session', 'identity'];
  function DataFactory($rootScope, $window, Idle, $timeout, $interval, $localStorage, session, identity) {
    var data = new DataConstructor();
    $rootScope.states = data.states;
    var workerInterval = 15000;
    var workerIntervalMin = 0.55;

    function DataConstructor() {
      var self = this;
      self.initialized = false;
      self.authenticated = (identity && identity.authenticated) || false;
      self.local = $localStorage.$default({
        settings: {}
      });
      self.timestamp = moment().subtract(15, 'seconds');
      self.session = session;
    }

    DataConstructor.prototype.updateIdentity = updateIdentity;
    DataConstructor.prototype.updateStates = updateStates;
    DataConstructor.prototype.processStates = processStates;
    DataConstructor.prototype.updateAll = updateAll;

    function updateIdentity() {
      var self = this;
      self.authenticated = identity.authenticated || false;
    }

    function updateStates() {
      var self = this;
    }

    function processStates() {
      var self = this;
    }

    function updateAll() {
      var self = this;
      var diff = moment().diff(self.timestamp);
      var wid = diff / workerInterval;
      if (self.initialized && wid < workerIntervalMin) {
        console.info(`Skipping update - data was updated ${diff / 1000} seconds ago.`);
        return;
      }

      self.initialized = true;
      self.updateIdentity();
      self.updateStates();
      self.timestamp = moment();
      $rootScope.$broadcast('data:updated', self.timestamp);
      self.processStates();
    }

    $rootScope.$on('identity:update', function () {
      data.updateAll();
    });

    data._worker = $interval(function () {
      data.updateAll();
    }, workerInterval);
    return data;
  }
})();
