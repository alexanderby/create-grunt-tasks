'use strict';
var loadTasks = require('load-grunt-tasks');

/**
 * Registers Grunt tasks.
 */
var TaskRegistrar = (function () {

    function TaskRegistrar(grunt) {
        this.pluginsConfigs = { pkg: grunt.file.readJSON('package.json') };
        this.tasksSubTasks = {};
    }

    /**
     * Creates a task.
     */
    TaskRegistrar.prototype.task = function (taskName) {
        if (!typeof taskName === 'string') {
            throw new Error('Pass task name to "task()" method.');
        }
        var sub = new SubTaskRegistrar(this, taskName);
        return sub;
    };

    /**
     * Creates multiple tasks.
     */
    TaskRegistrar.prototype.tasks = function (tasksNames) {
        if (!Array.isArray(tasksNames)) {
            throw new Error('Pass tasks names to "tasks()" method.');
        }
        var sub = new MultiSubTaskRegistrar(this, tasksNames);
        return sub;
    };

    return TaskRegistrar;
})();

/**
 * Registers a sequence of plug-ins'
 * configurations for a single task.
 */
var SubTaskRegistrar = (function () {

    function SubTaskRegistrar(taskRegistrar, taskName) {
        this.taskName = taskName;
        this.taskRegistrar = taskRegistrar;
        this.taskRegistrar.tasksSubTasks[taskName] = [];
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

        } else if (typeof pluginOrTaskOrFunc === 'string') {

            if (options === undefined) {

                //
                // Include another task

                var otherTask = pluginOrTaskOrFunc;
                this.taskRegistrar.tasksSubTasks[this.taskName].push(otherTask);

            } else {

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

        } else {
            throw new Error('First argument to "sub()" must be a function, task name or a plug-in name.')
        }

        this.subTasksCount++;
        return this;
    };

    /**
     * [Obsolete] Adds another task to a list of sub-tasks.
     */
    SubTaskRegistrar.prototype.other = function (otherTaskName) {
        console.warn('Method "other(taskName)" is obsolete, use "sub(taskName)" instead.');
        this.taskRegistrar.tasksSubTasks[this.taskName].push(otherTaskName);
        return this;
    };

    return SubTaskRegistrar;
})();

/**
 * Registers a sequence of plug-ins'
 * configurations for multiple tasks.
 */
var MultiSubTaskRegistrar = (function () {

    function MultiSubTaskRegistrar(taskRegistrar, tasksNames) {
        this.subRegistrars = {};
        tasksNames.forEach(function (taskName) {
            this.subRegistrars[taskName] = new SubTaskRegistrar(taskRegistrar, taskName);
        }, this);
    }

    /**
     * Configures a sub-task for multiple tasks.
     */
    MultiSubTaskRegistrar.prototype.sub = function (pluginOrTaskOrFunc, optionsOrFactory) {
        var options;
        if (typeof optionsOrFactory === 'function') {
            var getOptions = optionsOrFactory;
            for (var taskName in this.subRegistrars) {
                options = getOptions.call(null, taskName);
                if (options !== undefined && options !== null) {
                    this.subRegistrars[taskName].sub(pluginOrTaskOrFunc, options);
                }
            }
        } else {
            options = optionsOrFactory;
            for (var taskName in this.subRegistrars) {
                this.subRegistrars[taskName].sub(pluginOrTaskOrFunc, options);
            }
        }
        return this;
    };

    /**
     * Configures a sub-task for specified tasks.
     */
    MultiSubTaskRegistrar.prototype.for = function (taskNameOrNames, pluginOrTaskOrFunc, options) {
        if (typeof taskNameOrNames !== 'string' && !Array.isArray(taskNameOrNames)) {
            throw new Error('Pass task names to "for()" method.');
        }
        var tasksNames = typeof taskNameOrNames === 'string' ? [taskNameOrNames] : taskNameOrNames;
        tasksNames.forEach(function (taskName) {
            this._checkTask(taskName);
            this.subRegistrars[taskName].sub(pluginOrTaskOrFunc, options);
        }, this);
        return this;
    };

    /**
     * Configures a sub-task for all tasks excluding specified.
     */
    MultiSubTaskRegistrar.prototype.not = function (taskNameOrNames, pluginOrTaskOrFunc, options) {
        if (typeof taskNameOrNames !== 'string' && !Array.isArray(taskNameOrNames)) {
            throw new Error('Pass task names to "not()" method.');
        }
        var excludedTasks = typeof taskNameOrNames === 'string' ? [taskNameOrNames] : taskNameOrNames;
        var tasksNames = Object.keys(this.subRegistrars).filter(function (taskName) {
            this._checkTask(taskName);
            return (excludedTasks.indexOf(taskName) < 0);
        }, this);
        this.for(tasksNames, pluginOrTaskOrFunc, options);
        return this;
    };

    MultiSubTaskRegistrar.prototype._checkTask = function (taskName) {
        if (!(taskName in this.subRegistrars)) {
            throw new Error('Task "' + taskName
                + '" is missing. Expected to be one of "'
                + Object.keys(this.subRegistrars).join(', ') + '".');
        }
    };

    return MultiSubTaskRegistrar;
})();

/**
 * Export.
 */
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
