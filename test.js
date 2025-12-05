looker.plugins.visualizations.add({
    id: 'test_viz',
    label: 'Test Viz',

    options: {},

    create: function(element, config) {
        element.innerHTML = '<h1 style="text-align: center; padding: 50px;">Hello from Test Viz!</h1>';
    },

    updateAsync: function(data, element, config, queryResponse, details, done) {
        element.innerHTML = '<h1 style="text-align: center; padding: 50px;">Data loaded! Got ' + data.length + ' rows</h1>';
        done();
    }
});
