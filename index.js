'use strict';
var loadTasks = require('load-grunt-tasks');

var TaskRegistrar = (function () {
    function TaskRegistrar(grunt) {
        this.pluginsConfigs = { pkg: grunt.file.readJSON('package.JSON') };
        this.tasksSubTasks = {};
    }
    /**
     * Creates a task.
     */
    TaskRegistrar.prototype.task = function (taskName) {
        this.tasksSubTasks[taskName] = [];
        var info = new SubTaskRegistrar(this, taskName);
        return info;
    };
    return TaskRegistrar;
})();

var SubTaskRegistrar = (function () {
    function SubTaskRegistrar(taskRegistrar, taskName) {
        this.taskName = taskName;
        this.taskRegistrar = taskRegistrar;
        this.pluginsUsageCount = {};
    }
    /**
     * Creates a sub-task.
     */
    SubTaskRegistrar.prototype.sub = function (plugin, options) {
        // Increment plugin usage count
        if (!(plugin in this.pluginsUsageCount)) {
            this.pluginsUsageCount[plugin] = -1;
        }
        this.pluginsUsageCount[plugin]++;

        // Set options
        var task = this.taskName;
        var command = task + this.pluginsUsageCount[plugin];
        this.taskRegistrar.pluginsConfigs[plugin] = this.taskRegistrar.pluginsConfigs[plugin] || {};
        this.taskRegistrar.pluginsConfigs[plugin][command] = options;

        // Set sub-task name
        var subTaskName = plugin + ':' + command;
        this.taskRegistrar.tasksSubTasks[task].push(subTaskName);
        return this;
    };
    return SubTaskRegistrar;
})();

module.exports = function (grunt, regFn) {
    // Load NPM modules
    loadTasks(grunt);

    // Register tasks
    var reg = new TaskRegistrar(grunt);
    regFn(reg);

    // Apply configs to Grunt
    grunt.initConfig(reg.pluginsConfigs);
    for (var task in reg.tasksSubTasks) {
        grunt.registerTask(task, reg.tasksSubTasks[task]);
    }
};
