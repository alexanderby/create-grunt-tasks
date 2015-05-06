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
        this.subTasksCount = 0;
    }
    /**
     * Confugures a sub-task.
     */
    SubTaskRegistrar.prototype.sub = function (pluginOrTaskOrFunc, options) {
        if (typeof pluginOrTaskOrFunc === 'function') {

            //
            // Configure a task function

            var func = pluginOrTaskOrFunc;
            var funcTaskName = this.taskName + '_sub' + this.subTasksCount;
            this.taskRegistrar.tasksSubTasks[funcTaskName] = func;
            this.taskRegistrar.tasksSubTasks[this.taskName].push(funcTaskName);
        }
        else if (typeof pluginOrTaskOrFunc === 'string') {

            if (options === void (0)) {

                //
                // Include another task

                var otherTask = pluginOrTaskOrFunc;
                this.taskRegistrar.tasksSubTasks[this.taskName].push(otherTask);
            }
            else {

                //
                // Configure a plug-in

                var plugin = pluginOrTaskOrFunc;

                // Set options
                var configName = this.taskName + '_sub' + this.subTasksCount;
                this.taskRegistrar.pluginsConfigs[plugin] = this.taskRegistrar.pluginsConfigs[plugin] || {};
                this.taskRegistrar.pluginsConfigs[plugin][configName] = options;

                // Set sub-task name
                var subTaskName = plugin + ':' + configName;
                this.taskRegistrar.tasksSubTasks[this.taskName].push(subTaskName);
            }
        }
        else {
            throw new Error('First argument to "sub()" must be a function, task name or a plug-in name.')
        }
        this.subTasksCount++;
        return this;
    };
    /**
     * (Obsolete) Adds another task to a list of sub-tasks.
     */
    SubTaskRegistrar.prototype.other = function (otherTaskName) {
        this.taskRegistrar.tasksSubTasks[this.taskName].push(otherTaskName);
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
