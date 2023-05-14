(function () {
  angular.module('app.filters')
    .filter('unmuted', UnmutedFilter);
    UnmutedFilter.$inject = ['$parse'];
    function UnmutedFilter($parse) {
      return function (items) {
        var out = _.filter(items, function (m) {
          if (!m.type || m.type !== 'text') {
            return m;
          }

          var bz = m._bonzi || window.bonzis[m.guid];
          try {
            if (bz && bz.mute) {
              return false;
            }

            return true;
          } catch (err) {
            return m;
          }
        });

        return out;
      };
    }
})();
